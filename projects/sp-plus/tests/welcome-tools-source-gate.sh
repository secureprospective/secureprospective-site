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
grep -qF "'install', '--user', '-y', 'flathub'" "$PY" \
  || fail 'Flatpak install is not a user install from Flathub'
grep -qF "'info', '--user', self.app_id" "$PY" \
  || fail 'Flatpak install is not verified with flatpak info --user'
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
grep -qF "document.title = 'spplus:install?app='" "$JS" \
  || fail 'install title bridge is missing'
grep -qF "document.title = 'spplus:browse-store'" "$JS" \
  || fail 'browse-store title bridge is missing'
grep -qF 'toolResult: finishTool' "$JS" \
  || fail 'tool callback is missing'
grep -qF 'storeResult: finishStore' "$JS" \
  || fail 'store callback is missing'
grep -qF 'data-app-id="com.bitwarden.desktop"' "$HTML" \
  || fail 'Bitwarden action is missing'
grep -qF 'data-app-id="org.signal.Signal"' "$HTML" \
  || fail 'Signal action is missing'
grep -qF 'data-store-action' "$HTML" \
  || fail 'Discover action is missing'
[ "$(grep -c 'data-stub=\"Bitwarden install\"' "$HTML")" -eq 0 ] \
  || fail 'Bitwarden remains a stub'
[ "$(grep -c 'data-stub=\"Signal Desktop install\"' "$HTML")" -eq 0 ] \
  || fail 'Signal remains a stub'
[ "$(grep -c 'data-stub=\"Flathub setup and Discover\"' "$HTML")" -eq 0 ] \
  || fail 'Discover remains a stub'
grep -qF 'Flathub is configured and ready to browse.' "$HTML" \
  || fail 'Flathub copy still claims setup is pending'
pass 'Optional Tools actions and bridge wiring'
