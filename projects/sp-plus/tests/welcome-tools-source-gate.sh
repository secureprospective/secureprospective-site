#!/usr/bin/env bash
# SP+ Welcome Optional Tools source gate.
# This is intentionally source-level: the installed-system loop proves the
# Flatpak and Discover behavior against the real guest.
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
PY="$ROOT/welcome/welcome.py"
JS="$ROOT/welcome/app/app.js"
HTML="$ROOT/welcome/app/index.html"
pass() { printf 'PASS %s\n' "$1"; }
fail() { printf 'FAIL %s\n' "$1" >&2; exit 1; }

grep -qF "FLATPAK = os.environ.get('SPPLUS_FLATPAK'" "$PY" \
  || fail 'Flatpak executable is not overridable'
grep -qF "DISCOVER = os.environ.get('SPPLUS_DISCOVER'" "$PY" \
  || fail 'Discover executable is not overridable'
grep -qF 'class FlatpakInstallWorker' "$PY" \
  || fail 'Flatpak installs do not have a worker'
# DN-33: installs are SYSTEM-scope, not --user. Flathub ships as a SYSTEM remote
# (/usr/share/flatpak/remotes.d/flathub.flatpakrepo), so a --user install fails with
# "No remote refs found for 'flathub'". Verified on the Dell 2026-08-29: --user failed,
# --system via sudo -n installed Bitwarden and `flatpak info --system` returned rc=0.
grep -qF "SUDO = os.environ.get('SPPLUS_SUDO'" "$PY" \
  || fail 'sudo executable is not overridable'
grep -qF "'install', '--system', '-y'," "$PY" \
  || fail 'Flatpak install is not a SYSTEM install (DN-33)'
grep -qF "[SUDO, '-n', FLATPAK, 'install', '--system'" "$PY" \
  || fail 'Flatpak system install does not go through sudo -n (DN-33)'
grep -qF "'info', '--system', self.app_id" "$PY" \
  || fail 'Flatpak install is not verified with flatpak info --system'
if grep -qF "'install', '--user'" "$PY"; then
  fail 'welcome.py still contains a --user flatpak install (DN-33 regression)'
fi
grep -qF 'class FlathubCheckWorker' "$PY" \
  || fail 'Flathub is not checked off the UI thread'
grep -qF "'remotes', '--columns=name'" "$PY" \
  || fail 'Flathub remote check is missing'
grep -qF 'start_new_session=True' "$PY" \
  || fail 'Discover is not detached from Welcome'
grep -qF "parsed.path == 'install'" "$PY" \
  || fail 'install bridge verb is missing'
grep -qF "parsed.path == 'browse-store'" "$PY" \
  || fail 'browse-store bridge verb is missing'
grep -qF "send('spplus:install?app='" "$JS" \
  || fail 'install title bridge is missing'
grep -qF "send('spplus:browse-store')" "$JS" \
  || fail 'browse-store title bridge is missing'
grep -qF 'toolResult: finishTool' "$JS" \
  || fail 'tool callback is missing'
grep -qF 'storeResult: finishStore' "$JS" \
  || fail 'store callback is missing'
grep -qF 'data-app-id="com.bitwarden.desktop"' "$HTML" \
  || fail 'Bitwarden action is missing'
grep -qF 'data-app-id="org.signal.Signal"' "$HTML" \
  || fail 'Signal action is missing'
grep -qF 'data-app-id="org.gnome.Boxes"' "$HTML" \
  || fail 'GNOME Boxes action is missing'
# The bridge refuses any app id absent from FLATPAK_APP_NAMES, so a row in the
# HTML without its entry here is a button that fails on click.
grep -qF "'org.gnome.Boxes': 'GNOME Boxes'," "$PY" \
  || fail 'GNOME Boxes is not in the welcome.py bridge allowlist'
# Every row in the register must be answerable by the bridge. Counting both ends
# catches a fourth tool added to one side only.
rows=$(grep -o 'data-tool-name="' "$HTML" | wc -l)
names=$(sed -n '/^FLATPAK_APP_NAMES = {/,/^}/p' "$PY" | grep -c "^    '")
[ "$rows" -eq "$names" ] \
  || fail "$rows tool buttons but $names allowlisted app ids; they must match"
grep -qF 'data-store-action' "$HTML" \
  || fail 'Discover action is missing'
[ "$(grep -c 'data-stub="Bitwarden install"' "$HTML")" -eq 0 ] \
  || fail 'Bitwarden remains a stub'
[ "$(grep -c 'data-stub="Signal Desktop install"' "$HTML")" -eq 0 ] \
  || fail 'Signal remains a stub'
[ "$(grep -c 'data-stub="Flathub setup and Discover"' "$HTML")" -eq 0 ] \
  || fail 'Discover remains a stub'
# What matters is the promise this copy makes, not its exact sentence. Flathub is
# configured in the image, so the store must read as available now; copy that
# still describes setup as pending tells the advisor a working feature is
# unfinished. Pinning the literal string made every honest rewording look like a
# regression, so the meaning is gated instead.
python3 - "$HTML" <<'PYFLAT' || fail 'Flathub copy does not read as ready to browse'
import re, sys
html = open(sys.argv[1]).read()
text = re.sub(r'<[^>]+>', ' ', html)
# Scope to the store strip's own prose. The optional-tool rows also mention
# Flathub and carry an unrelated READY state chip, and letting those into the
# sample made the readiness check pass on copy that never claimed readiness.
strip = re.search(r'<section class="discover-strip".*?</section>', html, re.S)
if not strip:
    print('       the software library strip is missing entirely')
    sys.exit(1)
prose = ' '.join(re.findall(r'<p[^>]*>(.*?)</p>', strip.group(0), re.S))
prose = re.sub(r'<[^>]+>', ' ', prose)
sentences = [s for s in re.split(r'(?<=[.!])\s+', prose) if 'flathub' in s.lower()]
if not sentences:
    print('       the software library strip never mentions Flathub')
    sys.exit(1)
blob = ' '.join(sentences).lower()
if not re.search(r'\bready\b|\bavailable\b|\bconfigured\b', blob):
    print('       Flathub copy never says it is ready:', ' '.join(sentences).strip()[:120])
    sys.exit(1)
for phrase in ('coming soon', 'being set up', 'not yet', 'pending', 'will be available',
               'once we', 'setup required', 'still setting'):
    if phrase in blob:
        print('       Flathub copy still describes setup as pending:', phrase)
        sys.exit(1)
sys.exit(0)
PYFLAT
pass 'Optional Tools actions and bridge wiring'
