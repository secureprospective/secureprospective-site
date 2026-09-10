#!/usr/bin/env bash
# SP+ — publish a built image to the registry every machine updates from, signed.
#
# WHY THIS IS A SCRIPT AND NOT A COMMAND SOMEONE REMEMBERS. The registry tag
# ghcr.io/secureprospective/sp-plus-kde:latest is what every installed SP+
# machine pulls from. On 2026-09-01 that tag was serving an image built by an
# unrelated BlueBuild workflow -- a stock fedora-kinoite with an SP+ description
# and none of SP+ in it -- and the automatic update timer staged it over a
# working machine. Publishing is therefore a fleet-wide act, and the checks
# below are the ones that were missing when that happened.
#
# IT REFUSES TO PUBLISH AN IMAGE THAT IS NOT SP+. That is the whole point.
#
# Usage:  scripts/publish-image.sh <local-image> [dated-tag]
# e.g.    scripts/publish-image.sh localhost/sp-plus-kde:test52 20260901
set -euo pipefail

LOCAL=${1:?usage: publish-image.sh <local-image> [dated-tag]}
DATED=${2:-$(date -u +%Y%m%d)}
REPO=${SPPLUS_REGISTRY:-ghcr.io/secureprospective/sp-plus-kde}
KEYDIR=${SPPLUS_SIGNING_DIR:-$HOME/.config/sp-plus-signing}
COSIGN=${COSIGN_BIN:-$HOME/vendor/cosign/cosign}
PODMAN=${PODMAN_BIN:-"sudo -n podman"}

say() { printf '\n== %s\n' "$*"; }

say "checking the image really is SP+"
# Every one of these was ABSENT from the image that was being published by
# mistake. If a future build drops them, this stops before the fleet sees it.
for f in /usr/libexec/spplus-update-control \
         /usr/libexec/spplus-stage-update \
         /usr/libexec/spplus-tune \
         /usr/libexec/sp-plus/welcome/welcome.py \
         /usr/share/polkit-1/rules.d/49-sp-plus-updates.rules; do
    if ! $PODMAN run --rm --entrypoint /bin/sh "$LOCAL" -c "test -e $f"; then
        echo "REFUSING TO PUBLISH: $LOCAL is missing $f -- this is not an SP+ image" >&2
        exit 1
    fi
    echo "  ok  $f"
done

# The OS lane must not have come back. A published image carrying Discover's
# rpm-ostree backend re-arms the downgrade dialog for every machine at once.
if $PODMAN run --rm --entrypoint /bin/sh "$LOCAL" \
        -c "test -e /usr/lib64/qt6/plugins/discover/rpm-ostree-backend.so"; then
    echo "REFUSING TO PUBLISH: Discover's rpm-ostree backend is present again" >&2
    exit 1
fi
echo "  ok  Discover has no second OS updater"

say "checking this image is NEWER than what the tag serves"
# The failure this whole exercise came from. Publishing something older than the
# tag's current image would hand every machine a downgrade, which bootc will
# stage without complaint.
NEW_CREATED=$($PODMAN inspect "$LOCAL" --format '{{.Created}}')
if OLD_CREATED=$(skopeo inspect "docker://$REPO:latest" 2>/dev/null \
                 | python3 -c 'import json,sys; print(json.load(sys.stdin).get("Created",""))'); then
    python3 - "$NEW_CREATED" "$OLD_CREATED" <<'PY'
import sys
from datetime import datetime


def when(raw):
    """Parse a container creation time from either of the two shapes we get.

    skopeo returns RFC3339 ("2026-09-02T01:10:07.765591329Z"). podman inspect
    returns Go's default time rendering ("2026-09-02 01:10:07.765591329 +0000
    UTC"), which fromisoformat rejects outright -- that mismatch aborted a
    publish on 2026-09-02. Both are normalised here rather than trusting
    either tool to keep its format.
    """
    raw = (raw or "").strip()
    if raw.endswith(" UTC"):          # Go: drop the trailing zone NAME
        raw = raw[:-4].strip()
    raw = raw.replace(" ", "T", 1)    # Go: date/time separated by a space
    raw = raw.replace("Z", "+00:00")

    # Split off a numeric offset (+0000 / +00:00) so it survives truncation.
    off = ""
    for i in range(len(raw) - 1, max(len(raw) - 7, 0), -1):
        if raw[i] in "+-" and i > 10:
            off, raw = raw[i:], raw[:i]
            break
    off = off.strip()
    if off and ":" not in off and len(off) == 5:   # +0000 -> +00:00
        off = off[:3] + ":" + off[3:]

    # Sub-second precision differs between the two; datetime takes 6 digits.
    if "." in raw:
        head, _, tail = raw.partition(".")
        raw = head + "." + "".join(c for c in tail if c.isdigit())[:6].ljust(6, "0")

    return datetime.fromisoformat(raw + (off or "+00:00"))


new, old = when(sys.argv[1]), when(sys.argv[2])
print(f"  new {new.isoformat()}\n  old {old.isoformat()}")
if new <= old:
    sys.exit("REFUSING TO PUBLISH: this image is not newer than the tag it would replace")
print("  ok  newer than the published image")
PY
else
    echo "  note: the tag has no readable image yet; nothing to compare against"
fi

say "pushing $LOCAL -> $REPO:{latest,$DATED}"
$PODMAN tag "$LOCAL" "$REPO:latest"
$PODMAN tag "$LOCAL" "$REPO:$DATED"
$PODMAN push "$REPO:$DATED"
$PODMAN push "$REPO:latest"

say "signing by digest"
# Sign the DIGEST, not the tag. A tag moves; a signature has to be attached to
# the exact bytes it was made over.
DIGEST=$(skopeo inspect "docker://$REPO:latest" | python3 -c 'import json,sys; print(json.load(sys.stdin)["Digest"])')
echo "  digest $DIGEST"

# WHY THIS NO LONGER USES COSIGN. Measured 2026-09-10 against a booted SP+ VM:
# cosign v3 does not write the attachment that the machine reads. It publishes
# an OCI referrers index pointing at an
# `application/vnd.dev.sigstore.bundle.v0.3+json` artifact, under a tag with no
# `.sig` suffix. containers/image -- which is what bootc uses to fetch the OS
# image -- looks for `sha256-<digest>.sig` in the legacy cosign layout, does not
# find it, and reports:
#
#   Source image rejected: A signature was required, but no signature exists
#
# `cosign verify` passes on the same image, because cosign reads its own format.
# So the fleet tag WAS signed, verifiably, in a format no advisor machine can
# use. Shipping the Phase S reject-by-default policy against a cosign-signed tag
# would have stopped every machine updating. `--registry-referrers-mode=legacy`
# does NOT fix it; per its own help text that flag governs FETCHING references,
# not writing them.
#
# skopeo produces the format containers/image reads, using the same key file.
# --sign-identity is not decorative: without it the signature records whatever
# reference the copy targeted, and the policy's signedIdentity check rejects it.
#
# This requires attachments to be enabled ON THE PUBLISHING HOST too, or skopeo
# refuses with "writing sigstore attachments is disabled by configuration".
RD=/etc/containers/registries.d/sp-plus-ghcr.yaml
if ! grep -qs 'use-sigstore-attachments: true' "$RD"; then
    echo "  ERROR: $RD does not enable sigstore attachments." >&2
    echo "  Signing would silently produce nothing the fleet can verify. Create it with:" >&2
    echo "    docker:" >&2
    echo "      ghcr.io/secureprospective:" >&2
    echo "        use-sigstore-attachments: true" >&2
    exit 5
fi

skopeo copy --preserve-digests \
    --sign-by-sigstore-private-key "$KEYDIR/cosign.key" \
    --sign-passphrase-file "$KEYDIR/password" \
    --sign-identity "$REPO:latest" \
    "docker://$REPO@$DIGEST" "docker://$REPO:latest"

say "verifying the signature the way an ADVISOR MACHINE will read it"
# cosign verifying its own signature proved nothing on 2026-09-10: it passed
# against a signature no SP+ machine could find. The only verification worth
# running is the one the fleet performs -- containers/image, the shipped policy,
# the shipped public key.
#
# It has to be `podman pull --signature-policy`. `skopeo --policy ... inspect`
# was tried first and DOES NOT ENFORCE THE POLICY AT ALL: measured 2026-09-10,
# it accepted a deliberately unsigned image without complaint. A verification
# step that cannot fail is worse than none, because it is believed.
#
# This is cheap despite pulling the fleet image: every blob was just built and
# pushed from this host, so only the manifest and the signature move. The
# signature is checked against the manifest before any layer is considered.
VERIFY_POLICY=$(mktemp)
cat > "$VERIFY_POLICY" <<POLICY
{"default":[{"type":"reject"}],"transports":{"docker":{"$REPO":[{"type":"sigstoreSigned",
"keyPath":"$KEYDIR/cosign.pub","signedIdentity":{"type":"matchRepository"}}]}}}
POLICY
if $PODMAN pull -q --signature-policy "$VERIFY_POLICY" "$REPO@$DIGEST" >/dev/null 2>&1; then
    echo "  ok  the policy SP+ ships accepts $REPO@$DIGEST"
else
    echo "  FAILED: the signature is not readable by the policy SP+ ships." >&2
    echo "  Do not announce this release. Every machine would stop updating." >&2
    $PODMAN pull --signature-policy "$VERIFY_POLICY" "$REPO@$DIGEST" 2>&1 | tail -2 >&2
    rm -f "$VERIFY_POLICY"
    exit 6
fi
rm -f "$VERIFY_POLICY"

say "published"
printf '%s@%s\n' "$REPO" "$DIGEST"
