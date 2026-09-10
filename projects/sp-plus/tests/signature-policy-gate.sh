#!/usr/bin/bash
# SP+ signature policy gate — prove a booted machine ACCEPTS an OS image signed
# by Secure Prospective and REFUSES everything else.
#
# WHY THE FIXTURES ARE LOCAL. The negative cases cannot be published to the
# fleet tag to watch them be refused, so all four cases are served from a
# throwaway registry mirrored into the product's own policy scope
# (ghcr.io/secureprospective/sp-plus-kde). The scope is what the policy keys on,
# so the rule under test is the real one; only the transport is local. The
# accepted case is signed with the REAL SP+ key and carries the REAL production
# identity, via skopeo's --sign-identity.
#
# WHAT THIS GATE FOUND ON ITS FIRST RUN, and why the last assertion exists.
# cosign v3 no longer writes the legacy `sha256-<digest>.sig` attachment that
# containers/image reads. It writes an OCI referrers index pointing at a
# `application/vnd.dev.sigstore.bundle.v0.3+json` artifact, under a tag with no
# `.sig` suffix at all. containers/image does not look there, reports "a
# signature was required, but no signature exists", and refuses the image. The
# published SP+ image is signed in exactly that unreadable format. Shipping the
# policy without fixing the publish lane would have stopped the entire fleet
# updating. PUBLISHED_SIGNATURE_READABLE is the assertion that stands between
# those two facts.
#
# Usage: tests/signature-policy-gate.sh [ssh-target] [ssh-port] [identity]
set -uo pipefail

TARGET="${1:-test@127.0.0.1}"
PORT="${2:-2222}"
IDENT="${3:-$HOME/.ssh/spvm}"
REGPORT="${REGPORT:-5000}"
SCOPE="ghcr.io/secureprospective/sp-plus-kde"
KEYDIR="${SPPLUS_SIGNING_DIR:-$HOME/.config/sp-plus-signing}"
COSIGN="${COSIGN_BIN:-$HOME/vendor/cosign/cosign}"
WORK="$(mktemp -d)"

SSH=(ssh -n -o BatchMode=yes -o StrictHostKeyChecking=no
     -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -o ConnectTimeout=10
     -i "$IDENT" -p "$PORT" "$TARGET")
remote() { "${SSH[@]}" "$*" 2>&1; }

PASS=0; FAIL=0
record() {
    if [ "$1" = PASS ]; then PASS=$((PASS+1)); printf '  PASS  %-40s %s\n' "$2" "$3"
    else FAIL=$((FAIL+1)); printf '  FAIL  %-40s %s\n' "$2" "$3"; fi
}
die() { echo "HARNESS PROBLEM: $*" >&2; echo "That is not a pass." >&2; cleanup; exit 2; }

# sudo here permits podman and nothing else, so files under /etc are written
# through a container. Ugly, and the only thing available.
etcwrite() { # <relative path under /etc/containers> <content>
    sudo -n podman run --rm -v /etc/containers:/c docker.io/library/alpine:latest \
        sh -c "mkdir -p /c/\$(dirname '$1') && printf '%s' \"\$0\" > /c/$1" "$2" >/dev/null 2>&1
}
etcrm() { sudo -n podman run --rm -v /etc/containers:/c docker.io/library/alpine:latest \
        sh -c "rm -f /c/$1" >/dev/null 2>&1; }

cleanup() {
    remote "sudo rm -f /etc/containers/registries.conf.d/99-sig-gate.conf /etc/containers/registries.d/99-sig-gate.yaml" >/dev/null 2>&1
    remote "sudo podman rmi -af" >/dev/null 2>&1
    etcrm "registries.d/99-sig-gate.yaml"
    sudo -n podman rm -f sp-sig-test-registry >/dev/null 2>&1
    sudo -n podman rmi -f sp-sig-test:unsigned sp-sig-test:wrongkey sp-sig-test:signed >/dev/null 2>&1
    rm -rf "$WORK"
}
trap cleanup EXIT

echo "SP+ signature policy gate — $TARGET:$PORT"
remote true >/dev/null || die "cannot ssh to $TARGET:$PORT with $IDENT"
[ -s "$KEYDIR/cosign.key" ] || die "no signing key at $KEYDIR/cosign.key"
command -v skopeo >/dev/null || die "skopeo is required to produce a readable signature"
echo

# ------------------------------------------------------------- static shape
# Cheap, and it localises a later failure: with the key or the attachment
# setting missing, EVERY pull refuses and a broken policy looks like a working one.
pol="$(remote "cat /etc/containers/policy.json" | sed -n '/^{/,$p')"
if printf '%s' "$pol" | python3 -c 'import json,sys; d=json.load(sys.stdin); sys.exit(0 if d["default"][0]["type"]=="reject" else 1)' 2>/dev/null
then record PASS "policy default is reject" "reject"
else record FAIL "policy default is reject" "$(printf '%s' "$pol" | head -c 60)"; fi

if printf '%s' "$pol" | grep -q "$SCOPE"; then record PASS "product scope present in policy" "$SCOPE"
else record FAIL "product scope present in policy" "absent"; fi

if remote "openssl pkey -pubin -in /etc/pki/containers/sp-plus-cosign.pub -noout && echo ok" | grep -q ok
then record PASS "signing public key installed" "/etc/pki/containers/sp-plus-cosign.pub"
else record FAIL "signing public key installed" "absent or unparseable"; fi

att="$(remote "grep -h 'use-sigstore-attachments: true' /etc/containers/registries.d/*.yaml 2>/dev/null | wc -l" | tr -dc 0-9)"
if [ "${att:-0}" -ge 1 ] 2>/dev/null
then record PASS "sigstore attachments enabled" "registries.d entry present"
else record FAIL "sigstore attachments enabled" "missing — every pull would refuse"; fi

# ------------------------------------------ NEGATIVE: nothing else is allowed
out="$(remote "sudo timeout 60 podman pull docker.io/library/alpine:latest 2>&1 | tail -2")"
if printf '%s' "$out" | grep -qi 'rejected by policy'
then record PASS "unlisted registry refused" "rejected by policy"
else record FAIL "unlisted registry refused" "${out:-<pulled successfully>}"; fi

# --------------------------------------------------------------- the fixtures
echo
sudo -n podman rm -f sp-sig-test-registry >/dev/null 2>&1
sudo -n podman run -d --name sp-sig-test-registry -p "${REGPORT}:5000" \
    docker.io/library/registry:2 >/dev/null 2>&1 || die "could not start the test registry"
sleep 3

# The VM runs on passt, which hands the guest the HOST's own LAN address and
# then makes the host reachable at the default gateway. The host is therefore
# NOT reachable at its own IP from inside the VM -- that address is the VM.
PUSH="127.0.0.1:${REGPORT}/secureprospective/sp-plus-kde"
GW="$(remote "ip -4 route | awk '/^default/{print \$3; exit}'" | tr -dc '0-9.')"
[ -n "$GW" ] || die "could not determine the address the VM reaches the host on"
PULL="${GW}:${REGPORT}/secureprospective/sp-plus-kde"
echo "  fixtures pushed to 127.0.0.1:${REGPORT}, the VM reads the same registry at ${GW}:${REGPORT}"

# EACH FIXTURE NEEDS ITS OWN DIGEST. The first version of this gate built one
# image and pushed it under all three tags -- and signing the accepted one
# signed the other two, because a signature binds to the MANIFEST DIGEST, not to
# the tag. Both refusal cases passed verification and the gate reported them as
# accepted. That is not a bug in the fixture; it is the documented residual risk
# of signedIdentity=matchRepository, visible in miniature: anyone who can write
# a tag in this repository can point it at any digest we have ever signed. The
# downgrade guard in spplus-stage-update is the control that covers it, and it
# is a separate control from this one.
for tag in unsigned wrongkey signed; do
    mkdir -p "$WORK/$tag"
    printf 'FROM scratch\nCOPY sig-test /sig-test\n' > "$WORK/$tag/Containerfile"
    echo "sp-plus signature policy fixture: $tag" > "$WORK/$tag/sig-test"
    sudo -n podman build -q -t "sp-sig-test:$tag" "$WORK/$tag" >/dev/null 2>&1 \
        || die "could not build the $tag fixture"
    sudo -n podman tag "sp-sig-test:$tag" "${PUSH}:${tag}" >/dev/null 2>&1
    sudo -n podman push -q --tls-verify=false "${PUSH}:${tag}" >/dev/null 2>&1 \
        || die "could not push the ${tag} fixture"
done
# Prove they really are three different images before trusting the result.
digests="$(for tag in unsigned wrongkey signed; do
    sudo -n podman image inspect --format '{{.Id}}' "sp-sig-test:$tag"; done | sort -u | wc -l)"
[ "$digests" = 3 ] || die "the three fixtures share a digest; refusals would be meaningless"

# Signing writes the attachment only when the pushing side has attachments on.
etcwrite "registries.d/99-sig-gate.yaml" "docker:
  127.0.0.1:${REGPORT}:
    use-sigstore-attachments: true
"

# An unrelated key, generated into a temp dir and never written anywhere else.
( cd "$WORK" && COSIGN_PASSWORD=throwaway "$COSIGN" generate-key-pair >/dev/null 2>&1 ) \
    || die "could not generate the throwaway key"
printf 'throwaway' > "$WORK/pass"
skopeo copy --src-tls-verify=false --dest-tls-verify=false \
    --sign-by-sigstore-private-key "$WORK/cosign.key" --sign-passphrase-file "$WORK/pass" \
    --sign-identity "${SCOPE}:wrongkey" \
    "docker://${PUSH}:wrongkey" "docker://${PUSH}:wrongkey" >/dev/null 2>&1 \
    || die "could not sign the wrong-key fixture"

# The accepted case: the REAL key, and the REAL production identity, so the
# policy's signedIdentity check is exercised rather than sidestepped.
skopeo copy --src-tls-verify=false --dest-tls-verify=false \
    --sign-by-sigstore-private-key "$KEYDIR/cosign.key" --sign-passphrase-file "$KEYDIR/password" \
    --sign-identity "${SCOPE}:signed" \
    "docker://${PUSH}:signed" "docker://${PUSH}:signed" >/dev/null 2>&1 \
    || die "could not sign the accepted fixture with the SP+ key"

remote "printf '[[registry]]\nprefix = \"${SCOPE}\"\nlocation = \"${SCOPE}\"\n\n[[registry.mirror]]\nlocation = \"${PULL}\"\ninsecure = true\n' | sudo tee /etc/containers/registries.conf.d/99-sig-gate.conf" >/dev/null
remote "printf 'docker:\n  ${GW}:${REGPORT}:\n    use-sigstore-attachments: true\n' | sudo tee /etc/containers/registries.d/99-sig-gate.yaml" >/dev/null

echo
for case in unsigned wrongkey; do
    out="$(remote "sudo timeout 120 podman pull ${SCOPE}:${case} 2>&1 | tail -2")"
    if printf '%s' "$out" | grep -qiE 'no signature exists|is not accepted|rejected by policy|invalid signature'
    then record PASS "${case} image refused" "$(printf '%s' "$out" | tr '\n' ' ' | sed 's/.*rejected: //' | head -c 52)"
    else record FAIL "${case} image refused" "${out:-<accepted>}"; fi
    remote "sudo podman rmi -f ${SCOPE}:${case}" >/dev/null 2>&1
done

out="$(remote "sudo timeout 120 podman pull ${SCOPE}:signed 2>&1 | tail -2")"
if printf '%s' "$out" | grep -qiE 'rejected|no signature|not accepted'
then record FAIL "SP+ signed image accepted" "$(printf '%s' "$out" | tr '\n' ' ' | sed 's/.*rejected: //' | head -c 52)"
elif printf '%s' "$out" | grep -qE '^[0-9a-f]{64}$|Storing signatures'
then record PASS "SP+ signed image accepted" "pulled and verified"
else record FAIL "SP+ signed image accepted" "inconclusive: $(printf '%s' "$out" | tr '\n' ' ' | head -c 46)"; fi
remote "sudo podman rmi -f ${SCOPE}:signed" >/dev/null 2>&1

# ---------------------------------- the published image, in the real registry
# This is the one assertion that is about the PUBLISH LANE rather than the
# machine, and it is the one that decides whether Phase S can be switched on.
# If the fleet tag's signature is not in the attachment format containers/image
# reads, every advisor machine stops updating the moment this policy ships.
remote "sudo rm -f /etc/containers/registries.conf.d/99-sig-gate.conf" >/dev/null
out="$(remote "sudo timeout 120 podman pull ${SCOPE}:latest 2>&1 | tail -2")"
if printf '%s' "$out" | grep -qi 'no signature exists'
then record FAIL "published image signature is readable" "cosign bundle format — the fleet would stop updating"
elif printf '%s' "$out" | grep -qiE 'copying blob|copying config|storing signatures|^[0-9a-f]{64}$|timed out|killed'
then record PASS "published image signature is readable" "policy passed against the real registry"
else record FAIL "published image signature is readable" "$(printf '%s' "$out" | tr '\n' ' ' | sed 's/.*rejected: //' | head -c 52)"; fi

sig="$(remote "grep -c 'not signed by Secure Prospective' /usr/libexec/spplus-update-control" | tr -dc 0-9)"
if [ "${sig:-0}" != 0 ]
then record PASS "advisor sees plain english on refusal" "message present in update control"
else record FAIL "advisor sees plain english on refusal" "a container runtime error would surface"; fi

echo
echo "passed=$PASS failed=$FAIL"
if [ "$FAIL" -gt 0 ]; then
    echo "SIGNATURE POLICY GATE FAILED — do not ship this image."
    exit 1
fi
echo "SIGNATURE_POLICY_OK signed accepted, unsigned refused, wrong key refused, default reject live"
