#!/usr/bin/env bash
set -euo pipefail

# Logo-only 8K wallpaper. This is deliberately separate from the ISO build.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="$(cd "$ROOT/.." && pwd)"
LOGO="$PROJECT/branding/sp-plus-icon.png"
OUT="$ROOT/sp-plus-calm/wallpapers/SPPlus-Calm/contents/images"
PREVIEW_DARK="$ROOT/sp-plus-calm/look-and-feel/org.secureprospective.spplus.calm.dark/contents/previews"
PREVIEW_LIGHT="$ROOT/sp-plus-calm/look-and-feel/org.secureprospective.spplus.calm.light/contents/previews"

command -v magick >/dev/null || { echo "FAIL: ImageMagick (magick) is required" >&2; exit 1; }
test -f "$LOGO" || { echo "FAIL: missing SP+ logo: $LOGO" >&2; exit 1; }
mkdir -p "$OUT" "$PREVIEW_DARK" "$PREVIEW_LIGHT"

# The only foreground object is the supplied SP+ logo. Its own alpha mask is
# also used for a restrained coral aura; no text, stock art, or extra geometry.
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
magick "$LOGO" -resize 5200x5200 -strip "$TMP/logo.png"
magick "$TMP/logo.png" -channel A -blur 0x70 -fill '#ff704c' -colorize 100% +channel "$TMP/glow.png"
magick -size 7680x4320 gradient:'#07090d-#171c24' \
  "$TMP/glow.png" -gravity center -composite \
  "$TMP/logo.png" -gravity center -composite \
  -depth 8 -strip -define png:compression-level=9 \
  "$OUT/7680x4320.png"

# A small preview is part of the look-and-feel package; it is generated from
# the same 8K source so previews cannot drift from the shipped wallpaper.
magick "$OUT/7680x4320.png" -resize 1200x675 -strip -define png:compression-level=9 "$PREVIEW_DARK/preview.png"
magick "$OUT/7680x4320.png" -resize 1200x675 -strip -define png:compression-level=9 "$PREVIEW_LIGHT/preview.png"
magick "$OUT/7680x4320.png" -resize 1920x1080 -strip -define jpeg:extent=2MiB "$PREVIEW_DARK/fullscreenpreview.jpg"
magick "$OUT/7680x4320.png" -resize 1920x1080 -strip -define jpeg:extent=2MiB "$PREVIEW_LIGHT/fullscreenpreview.jpg"

cat > "$ROOT/sp-plus-calm/wallpapers/SPPlus-Calm/metadata.json" <<'JSON'
{
  "KPackageStructure": "Plasma/Wallpaper",
  "KPlugin": {
    "Id": "SPPlus-Calm",
    "Name": "SP+ Calm",
    "Description": "A logo-only SP+ wallpaper for calm, focused work.",
    "License": "CC0-1.0",
    "Version": "1.0.0",
    "Authors": [{ "Name": "Secure Prospective", "Email": "design@secureprospective.com" }]
  }
}
JSON

printf 'generated %s (%s)\n' "$OUT/7680x4320.png" "$(du -h "$OUT/7680x4320.png" | cut -f1)"
