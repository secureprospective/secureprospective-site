#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"
"$ROOT/scripts/build-container.sh"
if command -v podman >/dev/null; then
  podman build --pull=missing -f installer/Containerfile -t localhost/sp-plus-installer:poc .
else
  command -v docker >/dev/null || { echo 'Podman or Docker is required.' >&2; exit 2; }
  docker build --pull -f installer/Containerfile -t localhost/sp-plus-installer:poc .
  docker save localhost/sp-plus-installer:poc -o artifacts/sp-plus-installer.tar
fi
"$ROOT/scripts/image-builder.sh" build \
  --bootc-ref localhost/sp-plus-installer:poc \
  --bootc-default-fs ext4 \
  --bootc-installer-payload-ref localhost/sp-plus:poc \
  bootc-generic-iso
SOURCE=$(find artifacts -type f -name '*.iso' -not -path 'artifacts/iso/*' | sort | tail -1)
[[ -n "$SOURCE" ]] || { echo 'image-builder did not produce an ISO artifact.' >&2; exit 1; }
mkdir -p artifacts/iso
DEST=artifacts/iso/sp-plus-installer.iso
if ! cp --reflink=auto "$SOURCE" "$DEST" 2>/dev/null; then
  DEST=artifacts/iso/sp-plus-installer-latest.iso
  cp --reflink=auto "$SOURCE" "$DEST"
  printf 'Existing ISO was not writable; using user-owned fallback: %s\n' "$DEST"
fi
printf 'ISO build complete: %s\n' "$DEST"
