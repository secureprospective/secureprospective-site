#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"
"$ROOT/scripts/build-container.sh"
"$ROOT/scripts/image-builder.sh" build \
  --bootc-ref localhost/sp-plus:poc \
  --bootc-default-fs ext4 \
  qcow2
SOURCE=$(find artifacts -type f -name '*.qcow2' -not -path 'artifacts/qcow2/*' | sort | tail -1)
[[ -n "$SOURCE" ]] || { echo 'image-builder did not produce a qcow2 artifact.' >&2; exit 1; }
mkdir -p artifacts/qcow2
cp --reflink=auto "$SOURCE" artifacts/qcow2/disk.qcow2
printf 'qcow2 build complete: artifacts/qcow2/disk.qcow2\n'
