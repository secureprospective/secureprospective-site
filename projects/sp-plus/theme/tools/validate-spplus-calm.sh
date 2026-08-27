#!/usr/bin/env bash
set -euo pipefail

# Static, theme-only gate. It never starts the ISO build and never mutates files.
THEME="$(cd "$(dirname "${BASH_SOURCE[0]}")/../sp-plus-calm" && pwd)"
fail=0
pass=0
ok() { printf 'PASS %-72s\n' "$1"; pass=$((pass + 1)); }
bad() { printf 'FAIL %-72s\n' "$1" >&2; fail=$((fail + 1)); }
need() { test -e "$1" && ok "$2" || bad "$2 ($1)"; }

need "$THEME/wallpapers/SPPlus-Calm/metadata.json" 'wallpaper metadata exists'
need "$THEME/wallpapers/SPPlus-Calm/contents/images/7680x4320.png" 'literal 8K UHD wallpaper exists'
need "$THEME/color-schemes/SPPlusCalmDark.colors" 'dark color scheme exists'
need "$THEME/color-schemes/SPPlusCalmLight.colors" 'light color scheme exists'

python3 - "$THEME" <<'PY' || exit 1
import json, os, re, sys
from pathlib import Path
root = Path(sys.argv[1])
errors = []

def load(rel):
    p = root / rel
    try:
        return json.loads(p.read_text())
    except Exception as exc:
        errors.append(f"invalid JSON {rel}: {exc}")
        return {}

for p in sorted((root / 'look-and-feel').glob('*/metadata.json')):
    data = load(p.relative_to(root))
    expected = p.parent.name
    actual = data.get('KPlugin', {}).get('Id')
    if actual != expected: errors.append(f"look-and-feel Id {actual!r} != {expected!r}")
    if data.get('KPackageStructure') != 'Plasma/LookAndFeel': errors.append(f"wrong package structure in {p}")
    if data.get('X-Plasma-APIVersion') != '2': errors.append(f"missing Plasma API version in {p}")
for p in sorted((root / 'desktoptheme').glob('*/metadata.json')):
    data = load(p.relative_to(root))
    expected = p.parent.name
    if data.get('KPlugin', {}).get('Id') != expected: errors.append(f"desktop theme Id mismatch in {p}")
    if data.get('X-Plasma-API') != '5.0': errors.append(f"wrong desktop theme API in {p}")
wall = load('wallpapers/SPPlus-Calm/metadata.json')
if wall.get('KPlugin', {}).get('Id') != 'SPPlus-Calm': errors.append('wallpaper Id mismatch')
if wall.get('KPackageStructure') != 'Plasma/Wallpaper': errors.append('wrong wallpaper package structure')

required = ['Colors:Button', 'Colors:Complementary', 'Colors:Header', 'Colors:Header][Inactive',
            'Colors:Selection', 'Colors:Tooltip', 'Colors:View', 'Colors:Window', 'General', 'KDE', 'WM']
for p in sorted((root / 'color-schemes').glob('*.colors')) + sorted((root / 'desktoptheme').glob('*/colors')):
    text = p.read_text()
    for sec in required:
        if f'[{sec}]' not in text: errors.append(f'missing [{sec}] in {p.relative_to(root)}')

for p in (root / 'look-and-feel').glob('*/contents/defaults'):
    text = p.read_text()
    for needle in ('ColorScheme=SPPlusCalm', 'Theme=Paper-Mono-Dark', 'font=JetBrains Mono', 'Image=SPPlus-Calm', 'theme=__aurorae__svg__spplus-calm-'):
        if needle not in text: errors.append(f'missing {needle!r} in {p.relative_to(root)}')
    if '[kwinrc][DesktopSwitcher]' in text or '[kwinrc][WindowSwitcher]' in text:
        errors.append(f'unsafe Plasma 5 tabbox defaults in {p.relative_to(root)}')

for p in root.rglob('*.svg'):
    try:
        import xml.etree.ElementTree as ET
        ET.parse(p)
    except Exception as exc: errors.append(f'invalid SVG {p.relative_to(root)}: {exc}')
for p in root.rglob('*.json'):
    try: json.loads(p.read_text())
    except Exception as exc: errors.append(f'invalid JSON {p.relative_to(root)}: {exc}')

for needle in ('WindowsModern', 'Windows 11', 'Jeysef', 'Microsoft artwork'):
    hits = [str(p.relative_to(root)) for p in root.rglob('*') if p.is_file() and needle in p.read_text(errors='ignore')]
    if hits: errors.append(f'forbidden inherited/product name {needle!r}: {hits}')

if errors:
    for e in errors: print('FAIL', e, file=sys.stderr)
    sys.exit(1)
print('PASS metadata, references, color sections, SVG/XML, and naming checks')
PY
if [ $? -eq 0 ]; then pass=$((pass + 1)); else fail=$((fail + 1)); fi

if command -v desktop-file-validate >/dev/null; then
  desktop_fail=0
  while IFS= read -r -d '' file; do
    if ! desktop-file-validate "$file"; then desktop_fail=$((desktop_fail + 1)); fi
  done < <(find "$THEME" -name '*.desktop' -print0)
  [ "$desktop_fail" -eq 0 ] && ok 'Aurorae desktop metadata validates' || bad "$desktop_fail invalid desktop metadata file(s)"
else
  bad 'desktop-file-validate unavailable for Aurorae metadata gate'
fi

if command -v magick >/dev/null; then
  geometry="$(magick identify -format '%wx%h' "$THEME/wallpapers/SPPlus-Calm/contents/images/7680x4320.png")"
  [ "$geometry" = '7680x4320' ] && ok 'wallpaper geometry is 7680x4320 (8K UHD)' || bad "wallpaper geometry is $geometry"
else
  bad 'ImageMagick unavailable for wallpaper geometry gate'
fi

svg_count="$(find "$THEME/aurorae" -name '*.svg' | wc -l)"
[ "$svg_count" -ge 22 ] && ok "Aurorae SVG set is complete ($svg_count files)" || bad "Aurorae SVG set incomplete ($svg_count files)"

printf '\nSPPLUS_CALM_THEME_GATE pass=%d fail=%d\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
