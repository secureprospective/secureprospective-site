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
    raw = (raw or "").strip().replace("Z", "+00:00")
    # podman and skopeo differ on sub-second precision; normalise to 6 digits.
    if "." in raw:
        head, _, tail = raw.partition(".")
        digits = "".join(c for c in tail if c.isdigit())[:6].ljust(6, "0")
        off = tail[len(digits):] if not tail[len(digits):].isdigit() else ""
        raw = f"{head}.{digits}{off or '+00:00'}"
    return datetime.fromisoformat(raw)


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
COSIGN_PASSWORD=$(cat "$KEYDIR/password") \
    "$COSIGN" sign --yes --key "$KEYDIR/cosign.key" "$REPO@$DIGEST"

say "verifying the signature we just made"
"$COSIGN" verify --key "$KEYDIR/cosign.pub" "$REPO@$DIGEST" >/dev/null
echo "  ok  signature verifies against $KEYDIR/cosign.pub"

say "published"
printf '%s@%s\n' "$REPO" "$DIGEST"
