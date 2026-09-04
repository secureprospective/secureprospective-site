#!/usr/bin/env bash
# SP+ Phase 2 theme path/source gate. Live Plasma results belong to the Dell
# round-trip; this gate catches drift before an image can claim to contain it.
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
APPLY="$ROOT/config/spplus-apply-theme"
FIRST="$ROOT/config/spplus-first-login"
LAYOUT="$ROOT/theme/look-and-feel/org.secureprospective.spplus.modern.dark/contents/layouts/org.kde.plasma.desktop-layout.js"
HTML="$ROOT/welcome/app/index.html"
CONTAINER="$ROOT/images/kde/Containerfile"
fail() { printf 'FAIL %s\n' "$1" >&2; exit 1; }
pass() { printf 'PASS %s\n' "$1"; }

[ -x "$APPLY" ] || fail 'apply helper is not executable'
! grep -qE 'check[[:space:]]*=[[:space:]]*False' "$APPLY" || fail 'apply helper swallows a subprocess failure'
! grep -qE '\bsleep\b' "$APPLY" || fail 'apply helper contains a fixed wait'
grep -qF 'check=True' "$APPLY" || fail 'apply helper does not use checked subprocesses'
grep -qF 'dumpCurrentLayoutJS' "$APPLY" || fail 'layout readback is missing'
grep -qF 'KIconLoader.iconChanged' "$APPLY" || fail 'KIconLoader notification is missing'
grep -qF 'KDEPlatformTheme.refreshFonts' "$APPLY" || fail 'font refresh notification is missing'
grep -qF 'KWin.reconfigure' "$APPLY" || fail 'KWin reconfigure is missing'
grep -qF 'LookAndFeelPackage' "$APPLY" || fail 'selected look-and-feel package is not read back'
grep -qF 'kcminputrc' "$APPLY" || fail 'kcminputrc is not in the snapshot/readback path'
grep -qF 'plasma-org.kde.plasma.desktop-appletsrc' "$APPLY" || fail 'Plasma 6 desktop applet config is not in the snapshot/readback path'
grep -qF 'click_receipt' "$ROOT/welcome/welcome.py" || fail 'Welcome does not record the click receipt'
grep -qF "stream.write(line + '\\n')" "$ROOT/welcome/welcome.py" || fail 'Welcome event log is not newline-delimited JSONL'
grep -qF 'kdedefaults' "$APPLY" || fail 'kdedefaults is not in the snapshot/readback path'
grep -qF 'snapshot_config' "$APPLY" || fail 'configuration snapshot is missing'
grep -qF -- '--resetLayout' "$APPLY" || fail 'explicit layout reset bridge is missing'

[ -x "$FIRST" ] || fail 'first-login helper is not executable'
grep -qF 'spplus-apply-theme' "$FIRST" || fail 'first-login does not use the shared helper'
grep -qF -- '--layout' "$FIRST" || fail 'first-login does not make its layout decision explicit'
! grep -qF -- '--resetLayout' "$FIRST" || fail 'first-login has a second direct layout path'
! grep -qE '\bsleep\b' "$FIRST" || fail 'first-login still has a fixed wait'

for package in \
  "$ROOT/theme/look-and-feel/org.secureprospective.spplus.modern.light" \
  "$ROOT/theme/look-and-feel/org.secureprospective.spplus.modern.dark"; do
  [ -f "$package/contents/defaults" ] || fail "missing defaults in $package"
  grep -q '^Theme=modern$' "$package/contents/defaults" || fail "Modern icon declaration missing in $package"
  grep -q '^Image=Modern$' "$package/contents/defaults" || fail "Modern wallpaper declaration missing in $package"
  grep -q '^library=org.kde.kwin.aurorae.v2$' "$package/contents/defaults" || fail "Aurorae v2 declaration missing in $package"
  [ -f "$package/contents/layouts/org.kde.plasma.desktop-layout.js" ] || fail "missing layout in $package"
done
for switcher in DesktopSwitcher WindowSwitcher; do
  grep -q "^\[kwinrc\]\[$switcher\]$" "$ROOT/theme/look-and-feel/org.secureprospective.spplus.modern.dark/contents/defaults" \
    || fail "$switcher declaration missing in Windows dark"
done
grep -q '^LayoutName=org.kde.breeze.desktop$' \
  "$ROOT/theme/look-and-feel/org.secureprospective.spplus.modern.dark/contents/defaults" \
  || fail 'switcher layout declaration missing in Windows dark'
[ -d "$ROOT/theme/icons/modern" ] || fail 'modern icon tree is missing'
[ -s "$ROOT/theme/icons/modern/index.theme" ] || fail 'modern index.theme is missing'
[ -s "$ROOT/theme/wallpaper/Modern/metadata.json" ] || fail 'Modern wallpaper metadata is missing'
[ -s "$ROOT/theme/wallpaper/Modern/contents/images/2560x1440.png" ] || fail 'Modern light wallpaper is missing'
[ -s "$ROOT/theme/wallpaper/Modern/contents/images_dark/2560x1440.png" ] || fail 'Modern dark wallpaper is missing'
grep -qF 'COPY theme/wallpaper/Modern/' "$CONTAINER" || fail 'Modern wallpaper is not copied into the image'
grep -qF "'Theme=modern'" "$CONTAINER" || fail 'system default still selects an unrelated icon theme'
[ -s "$ROOT/theme/vendor/aurorae/CatppuccinMocha-Classic/CatppuccinMocha-Classicrc" ] || fail 'Catppuccin Mocha Aurorae config is missing'
[ -s "$ROOT/theme/vendor/aurorae/CatppuccinLatte-Classic/CatppuccinLatte-Classicrc" ] || fail 'Catppuccin Latte Aurorae config is missing'

python3 - "$LAYOUT" "$HTML" <<'PY'
import re
import sys
from pathlib import Path
layout = Path(sys.argv[1]).read_text(encoding='utf-8')
html = Path(sys.argv[2]).read_text(encoding='utf-8')
launchers = re.search(r'var spplusTaskbarLaunchers = \[(.*?)\];', layout, re.S)
favorites = re.search(r'var spplusMenuFavorites = \[(.*?)\];', layout, re.S)
if not launchers or not favorites:
    raise SystemExit('layout launchers/favourites declarations are missing')
expected_taskbar = [
    'applications:brave-browser.desktop',
    'applications:net.thunderbird.Thunderbird.desktop',
    'applications:org.kde.dolphin.desktop',
    'applications:libreoffice-writer.desktop',
    'applications:org.kde.okular.desktop',
]
expected_favorites = [
    'applications:brave-browser.desktop',
    'applications:net.thunderbird.Thunderbird.desktop',
    'applications:fin.desktop',
    'applications:org.kde.dolphin.desktop',
    'applications:libreoffice-writer.desktop',
    'applications:org.kde.okular.desktop',
    'applications:org.keepassxc.KeePassXC.desktop',
]
for block, expected, label in ((launchers.group(1), expected_taskbar, 'taskbar'), (favorites.group(1), expected_favorites, 'favourites')):
    found = re.findall(r'"([^"]+)"', block)
    if found != expected:
        raise SystemExit(f'{label} order drift: {found!r}')
if 'applications:fin.desktop' in launchers.group(1):
    raise SystemExit('Fin leaked into taskbar pins')
if 'knownWidgetTypes' not in layout:
    raise SystemExit('version-sensitive show-desktop guard is missing')
for declaration in ('panel.location = "bottom"', 'panel.height = 48', 'panel.hiding = "none"', 'panel.lengthMode = "fill"'):
    if declaration not in layout:
        raise SystemExit(f'panel declaration missing: {declaration}')
if 'panel.locked = true' not in layout:
    raise SystemExit('Windows panel is not locked after creation')
if html.count('class="theme-card') != 8:
    raise SystemExit('Welcome does not offer exactly eight theme cards')
for card in re.findall(r'<button class="theme-card[^>]*>', html):
    if 'data-preview=' not in card or 'data-layout-reset=' not in card:
        raise SystemExit(f'theme card lacks preview/layout receipt data: {card}')
    layout = re.search(r'data-layout-reset=["\']([^"\']+)["\']', card)
    if not layout or layout.group(1) != 'true':
        raise SystemExit(f'theme card does not reset to its declared layout: {card}')
if 'role="dialog"' not in html or 'id="preview-apply"' not in html:
    raise SystemExit('single preview confirmation surface is missing')
if 'confirm(' in Path(sys.argv[2]).with_name('app.js').read_text(encoding='utf-8'):
    raise SystemExit('theme path uses a second browser confirmation dialog')
PY

# These are deliberately hard gates. A desktop swatch, upstream screenshot, or
# package screenshot cannot satisfy them. The Dell capture round-trip must add
# all eight verified-session receipts before the image is buildable.
preview_root="$ROOT/welcome/app/assets/theme-previews"
for preview in \
  windows-light.png windows-dark.png breeze-light.png breeze-dark.png \
  nordic-dark.png orchis-light.png catppuccin-latte.png catppuccin-mocha.png; do
  [ -s "$preview_root/$preview" ] || fail "missing applied-session preview receipt: $preview"
done

pass 'SP+ Phase 2 theme source path and preview contract'
