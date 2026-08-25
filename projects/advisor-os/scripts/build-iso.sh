#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"
"$ROOT/scripts/build-container.sh"
if command -v podman >/dev/null; then
  podman build --pull=missing -f installer/Containerfile -t localhost/advisor-os-installer:poc installer
else
  command -v docker >/dev/null || { echo 'Podman or Docker is required.' >&2; exit 2; }
  docker build --pull -f installer/Containerfile -t localhost/advisor-os-installer:poc installer
  docker save localhost/advisor-os-installer:poc -o artifacts/advisor-os-installer.tar
fi
"$ROOT/scripts/image-builder.sh" build \
  --bootc-ref localhost/advisor-os-installer:poc \
  --bootc-default-fs ext4 \
  --bootc-installer-payload-ref localhost/advisor-os:poc \
  bootc-generic-iso
SOURCE=$(find artifacts -type f -name '*.iso' -not -path 'artifacts/iso/*' | sort | tail -1)
[[ -n "$SOURCE" ]] || { echo 'image-builder did not produce an ISO artifact.' >&2; exit 1; }
mkdir -p artifacts/iso
cp --reflink=auto "$SOURCE" artifacts/iso/advisor-os-installer.iso
printf 'ISO build complete: artifacts/iso/advisor-os-installer.iso\n'
