#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

mkdir -p artifacts
if command -v podman >/dev/null; then
  podman build --pull=missing -f Containerfile -t localhost/advisor-os:poc .
  podman image inspect localhost/advisor-os:poc >/dev/null
else
  command -v docker >/dev/null || { echo 'Podman or Docker is required.' >&2; exit 2; }
  docker build --pull -f Containerfile -t localhost/advisor-os:poc .
  docker image inspect localhost/advisor-os:poc >/dev/null
  docker save localhost/advisor-os:poc -o artifacts/advisor-os-payload.tar
fi
printf 'localhost/advisor-os:poc\n' > artifacts/image-ref
printf 'Bootable payload built.\n'
