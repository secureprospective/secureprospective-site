#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"
mkdir -p artifacts

DEVICES=(--device /dev/loop-control)
for n in 0 1 2 3 4 5 6 7; do DEVICES+=(--device "/dev/loop$n"); done

if command -v podman >/dev/null; then
  if [[ $(id -u) -eq 0 ]]; then
    STORE=/var/lib/containers/storage
  else
    STORE=${CONTAINERS_STORAGE_PATH:-${HOME}/.local/share/containers/storage}
  fi
  [[ -d "$STORE" ]] || { echo "Podman storage not found: $STORE" >&2; exit 2; }
  podman pull ghcr.io/osbuild/image-builder-cli:latest >/dev/null
  podman run --rm --privileged --userns=host --security-opt label=disable \
    "${DEVICES[@]}" -v "$ROOT/artifacts:/output" -v "$STORE:/var/lib/containers/storage" \
    ghcr.io/osbuild/image-builder-cli:latest "$@"
else
  command -v docker >/dev/null || { echo 'Podman or Docker is required.' >&2; exit 2; }
  docker pull ghcr.io/osbuild/image-builder-cli:latest >/dev/null
  docker run --rm --privileged --userns=host --security-opt label=disable \
    "${DEVICES[@]}" -v "$ROOT/artifacts:/output" \
    --entrypoint /bin/sh ghcr.io/osbuild/image-builder-cli:latest -lc '
      set -eu
      for archive in /output/*.tar; do
        [ -e "$archive" ] || continue
        podman load -i "$archive" >/dev/null
      done
      image-builder "$@"
    ' -- "$@"
fi
