#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

mkdir -p artifacts
if command -v podman >/dev/null; then
  podman build --pull=missing -f Containerfile -t localhost/sp-plus:poc .
  podman image inspect localhost/sp-plus:poc >/dev/null
else
  command -v docker >/dev/null || { echo 'Podman or Docker is required.' >&2; exit 2; }
  docker build --pull -f Containerfile -t localhost/sp-plus:poc .
  docker image inspect localhost/sp-plus:poc >/dev/null
  docker save localhost/sp-plus:poc -o artifacts/sp-plus-payload.tar
fi
printf 'localhost/sp-plus:poc\n' > artifacts/image-ref
printf 'Bootable payload built.\n'
