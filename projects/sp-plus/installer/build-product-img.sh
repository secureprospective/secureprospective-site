#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
OUT="$ROOT/product.img"

# product.img is the Anaconda product overlay. Keep the archive portable and
# reproducible: newc cpio is understood by Anaconda, and gzip is the required
# product-image compression. The source tree contains no credentials.
(
    cd "$ROOT/product"
    find . -mindepth 1 -print0 | LC_ALL=C sort -z \
        | cpio --null --create --format=newc --reproducible \
        | gzip --no-name --best
) > "$OUT"

printf 'Built %s (%s bytes)\n' "$OUT" "$(stat -c %s "$OUT")"
