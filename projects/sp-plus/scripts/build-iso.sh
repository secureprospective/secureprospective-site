#!/usr/bin/env bash
# build-iso.sh <tag> -- payload, installer, ISO, and the verification that the
# ISO actually contains the payload you think it does. One script, because the
# three commands were recorded in three ledger files with three different build
# contexts and two of the three cannot work.
#
#   payload   context = REPO ROOT            (Containerfile COPYs images/kde/...)
#   installer context = projects/sp-plus     (COPYs installer/... and branding/)
#   iso       --bootc-ref is the INSTALLER, --bootc-installer-payload-ref is the
#             PAYLOAD. Passing the payload as --bootc-ref yields an ISO with no
#             shimx64.efi. --bootc-default-fs ext4 is required or it dies with
#             "missing required info: DefaultRootFs".
#
# The final step is not optional. The 2026-09-04 alpha1 crash was a kickstart
# that named one image while the ISO embedded another; nothing compared the two
# strings. This does.
#
# Usage: scripts/build-iso.sh <tag> [--skip-payload] [--skip-installer]
set -euo pipefail

TAG="${1:?usage: build-iso.sh <tag> [--skip-payload] [--skip-installer]}"; shift || true
SKIP_PAYLOAD=0; SKIP_INSTALLER=0
for a in "$@"; do
  case "$a" in
    --skip-payload)   SKIP_PAYLOAD=1 ;;
    --skip-installer) SKIP_INSTALLER=1 ;;
    *) echo "unknown option: $a" >&2; exit 2 ;;
  esac
done

SP="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="$(cd "$SP/../.." && pwd)"
PAYLOAD="localhost/sp-plus-kde:${TAG}"
INSTALLER="localhost/sp-plus-installer:${TAG}"
OUT="$SP/artifacts/${TAG}-iso"
LOG="$HOME/logs/sp-plus/build-${TAG}-$(date -u +%Y%m%dT%H%M%SZ).log"
mkdir -p "$OUT" "$(dirname "$LOG")"

say() { printf '[build %s] %s\n' "$(date -u +%H:%M:%S)" "$*" | tee -a "$LOG" >&2; }

# Refuse to start without room. An ISO build that fills the disk takes the host
# down with it, and the host is Christopher's desktop.
free_gib() { df -BG --output=avail "$1" | tail -1 | tr -dc 0-9; }
for m in / "$SP"; do
  f="$(free_gib "$m")"
  [ "$f" -ge 40 ] || { echo "REFUSING TO BUILD: only ${f}G free on $m, need 40G" >&2; exit 3; }
done
say "disk ok: $(free_gib /)G on /, $(free_gib "$SP")G on the repo volume"

# --network=host is required: the default bridge has no egress on the Beelink.
# ip_forward and `podman network reload --all` are both already ruled out.
if [ "$SKIP_PAYLOAD" = 0 ]; then
  say "payload $PAYLOAD (context $SP)"
  ( cd "$SP" && sudo -n podman build --network=host --build-arg SPPLUS_BUILD="20260910" -t "$PAYLOAD" -f images/kde/Containerfile . ) \
    >>"$LOG" 2>&1 || { echo "PAYLOAD BUILD FAILED -- $LOG" >&2; tail -30 "$LOG" >&2; exit 4; }
fi
sudo -n podman image exists "$PAYLOAD" || { echo "no such image: $PAYLOAD" >&2; exit 4; }

# THE REF IS WRITTEN IN THREE PLACES AND THEY DRIFT. payload-ref.txt is the
# declared source of truth and the installer's DN-51 gate checks the kickstart
# against it -- but nothing tied either of them to the image actually embedded in
# the ISO, which is passed separately as --bootc-installer-payload-ref. So the
# two guarded strings agreed with each other and disagreed with reality: the
# first phase-s ISO embedded the phase-s payload and carried a kickstart that
# said :alpha4. That is the 2026-09-04 alpha1 crash, one tag later.
#
# Set all three from one variable here, then let both gates check the result.
say "pinning the payload ref to $PAYLOAD"
printf '%s\n' "$PAYLOAD" > "$SP/installer/payload-ref.txt"
sed -i -E "s|containers-storage:localhost/sp-plus-kde:[A-Za-z0-9._-]+|containers-storage:${PAYLOAD}|g" \
  "$SP/installer/interactive-defaults.ks"
grep -qF "containers-storage:$PAYLOAD" "$SP/installer/interactive-defaults.ks" \
  || { echo "could not rewrite the kickstart payload ref" >&2; exit 5; }

if [ "$SKIP_INSTALLER" = 0 ]; then
  say "installer $INSTALLER (context $SP)"
  ( cd "$SP" && sudo -n podman build --network=host -t "$INSTALLER" -f installer/Containerfile . ) \
    >>"$LOG" 2>&1 || { echo "INSTALLER BUILD FAILED -- $LOG" >&2; tail -30 "$LOG" >&2; exit 5; }
fi
sudo -n podman image exists "$INSTALLER" || { echo "no such image: $INSTALLER" >&2; exit 5; }

PAYLOAD_ID="$(sudo -n podman image inspect --format '{{.Id}}' "$PAYLOAD")"
say "payload image id ${PAYLOAD_ID:0:12}"

# The ISO lands owned by root because image-builder runs rootful, so a plain
# `rm` fails and a stale ISO from a previous attempt gets picked up as this
# build's output. Sudo here permits podman and nothing else, so delete it the
# only way available.
if [ -n "$(ls -A "$OUT" 2>/dev/null)" ]; then
  say "clearing the previous $TAG output"
  sudo -n podman run --rm -v "$OUT:/w" docker.io/library/alpine:latest \
    sh -c 'rm -rf /w/..?* /w/.[!.]* /w/*' >/dev/null 2>&1 || true
fi
say "iso -> $OUT"
# /dev/loopN are created on demand and udev removes them again when the last
# user detaches, so enumerating loop0..loop7 fails on a host that has not used a
# loop device recently: "stat /dev/loop0: no such file or directory". Bind the
# whole of /dev instead and let the builder allocate through /dev/loop-control.
# The container is already --privileged; this widens nothing that was narrow.
DEV=(--device /dev/loop-control -v /dev:/dev)
sudo -n podman run --rm --privileged --userns=host --security-opt label=disable \
  "${DEV[@]}" -v "$OUT:/output" -v /var/lib/containers/storage:/var/lib/containers/storage \
  ghcr.io/osbuild/image-builder-cli:latest build bootc-generic-iso \
  --bootc-ref "$INSTALLER" \
  --bootc-installer-payload-ref "$PAYLOAD" \
  --bootc-default-fs ext4 >>"$LOG" 2>&1 || { echo "ISO BUILD FAILED -- $LOG" >&2; tail -40 "$LOG" >&2; exit 6; }

# "Image build successful:" is the real success line. A monitor grepping
# "Image built" misses it and calls a good build a failure.
grep -q 'Image build successful:' "$LOG" || { echo "NO SUCCESS LINE IN $LOG" >&2; exit 6; }

ISO="$(find "$OUT" -name '*.iso' -newermt '-6 hours' | head -1)"
[ -n "$ISO" ] || { echo "build reported success but no ISO landed under $OUT" >&2; exit 6; }

say "verifying the ISO carries the payload it claims"
KSREF="$(sudo -n podman run --rm --privileged --device /dev/loop-control -v /dev:/dev \
  -v "$ISO:/iso:ro" "$INSTALLER" bash -c '
    mkdir -p /isomnt && mount -o loop,ro /iso /isomnt
    unsquashfs -q -d /tmp/sq /isomnt/LiveOS/squashfs.img \
      "var/lib/containers/storage/overlay-images/images.json" \
      "usr/share/anaconda/interactive-defaults.ks" >/dev/null 2>&1
    grep -ohE "containers-storage:[^ ]+" /tmp/sq/usr/share/anaconda/interactive-defaults.ks | head -1
    python3 -c "import json;[print(i[\"id\"]) for i in json.load(open(\"/tmp/sq/var/lib/containers/storage/overlay-images/images.json\"))]"' 2>/dev/null)"
KS="$(printf '%s\n' "$KSREF" | grep containers-storage | head -1)"
IDS="$(printf '%s\n' "$KSREF" | grep -v containers-storage)"

echo "  kickstart ref : ${KS:-<none found>}" | tee -a "$LOG"
echo "  embedded ids  : $(printf '%s ' $IDS)" | tee -a "$LOG"
printf '%s\n' "$KS" | grep -q "$PAYLOAD" \
  || { echo "REF MISMATCH: kickstart does not name $PAYLOAD -- this ISO would crash in Anaconda" >&2; exit 7; }
printf '%s\n' "$IDS" | grep -q "^${PAYLOAD_ID}$" \
  || { echo "ID MISMATCH: ISO embeds $(printf '%s ' $IDS), payload is $PAYLOAD_ID" >&2; exit 7; }

SHA="$(sha256sum "$ISO" | cut -d' ' -f1)"
{ echo
  echo "ISO      $ISO"
  echo "bytes    $(stat -c %s "$ISO")"
  echo "sha256   $SHA"
  echo "payload  $PAYLOAD  ($PAYLOAD_ID)"
  echo "log      $LOG"
  echo "BUILD_ISO_OK ref and image id both verified inside the ISO"
} | tee -a "$LOG"
