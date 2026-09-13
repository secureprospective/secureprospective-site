#!/usr/bin/env bash
# publish-iso-r2.sh -- put a finished SP+ ISO in the R2 bucket the members
# download page streams from.
#
# WHY A SCRIPT. The download lane has three parts that must agree: the object
# in R2, the RELEASES entry committed to the site repo (key, size, sha256), and
# the Pages binding SPPLUS_RELEASES. functions/_lib/releases.ts says plainly why
# the manifest is committed rather than read back from R2 -- R2 does not return
# a whole-object sha256 for a multipart upload, so the only trustworthy sha256
# is the one the build computed. This script therefore uploads AND prints the
# exact manifest entry, so the two cannot drift.
#
# Credentials live in ~/.config/sp-plus-r2/env (mode 600), never in the repo.
#
# Usage: publish-iso-r2.sh check|upload|verify [iso-path]
set -euo pipefail

ENVF="$HOME/.config/sp-plus-r2/env"
RCLONE="${RCLONE_BIN:-$HOME/.local/bin/rclone}"
SP="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
DEFAULT_ISO="$SP/artifacts/v0.11.4-iso/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso"
ISO="${2:-$DEFAULT_ISO}"

# What the advisor downloads. The public release of this build is 0.11.
KEY="sp-plus/sp-plus-0.11.iso"

[ -r "$ENVF" ] || { echo "no credentials at $ENVF -- see ~/Downloads/paste.md" >&2; exit 2; }
# shellcheck disable=SC1090
set -a; . "$ENVF"; set +a
for v in R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET; do
    val="${!v:-}"
    case "$val" in
        ''|PASTE_*) echo "$v is still a placeholder in $ENVF" >&2; exit 2 ;;
    esac
done
[ -x "$RCLONE" ] || { echo "rclone not at $RCLONE" >&2; exit 2; }

rc() {
    "$RCLONE" \
        --s3-provider Cloudflare \
        --s3-access-key-id "$R2_ACCESS_KEY_ID" \
        --s3-secret-access-key "$R2_SECRET_ACCESS_KEY" \
        --s3-endpoint "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
        --s3-no-check-bucket \
        "$@"
}

case "${1:-check}" in
  check)
      echo "== bucket $R2_BUCKET"
      rc lsd ":s3:$R2_BUCKET" >/dev/null 2>&1 || rc ls ":s3:$R2_BUCKET" >/dev/null
      echo "  OK  credentials work and the bucket is readable"
      echo "== objects already under sp-plus/"
      rc ls ":s3:$R2_BUCKET/sp-plus/" 2>/dev/null || echo "  (none yet)"
      ;;
  upload)
      [ -r "$ISO" ] || { echo "cannot read $ISO" >&2; exit 3; }
      echo "== uploading $(basename "$ISO") -> $R2_BUCKET/$KEY"
      echo "   $(stat -c %s "$ISO") bytes; multipart, resumable"
      # 64 MiB parts: R2 caps a multipart upload at 10,000 parts, and four
      # concurrent streams saturates the link without starving the desktop.
      rc copyto "$ISO" ":s3:$R2_BUCKET/$KEY" \
          --s3-chunk-size 64M --s3-upload-concurrency 4 \
          --progress --stats-one-line --stats 30s
      echo "== done"
      "$0" verify "$ISO"
      ;;
  verify)
      SIZE_LOCAL=$(stat -c %s "$ISO")
      SHA_LOCAL=$(sha256sum "$ISO" | awk '{print $1}')
      SIZE_R2=$(rc size ":s3:$R2_BUCKET/$KEY" 2>/dev/null | awk '/total size/ {print $NF}' | tr -dc 0-9)
      echo "== local $SIZE_LOCAL bytes"
      echo "== r2    ${SIZE_R2:-<absent>} bytes"
      [ -n "${SIZE_R2:-}" ] && [ "$SIZE_R2" = "$SIZE_LOCAL" ] \
          || { echo "R2 GATE FAIL: object missing or the wrong size" >&2; exit 4; }
      echo "  OK  the object in R2 is byte-for-byte the size the build produced"
      echo
      echo "== paste this entry into functions/_lib/releases.ts on the site repo:"
      cat <<ENTRY
  {
    id: "0.11",
    label: "SP+ 0.11",
    key: "$KEY",
    filename: "sp-plus-0.11.iso",
    size: $SIZE_LOCAL,
    sha256: "$SHA_LOCAL",
    released: "$(date -u +%Y-%m-%d)",
    note: "Install to a spare machine, not your working laptop.",
    published: true,
  },
ENTRY
      ;;
  *) echo "usage: $0 check|upload|verify [iso]" >&2; exit 2 ;;
esac
