#!/usr/bin/env bash
# SP+ Welcome: "Do not show this setup again" actually stops it coming back.
#
# THE DEFECT THIS GATE EXISTS FOR (2026-09-09, found on the Dell).
# The checkbox wrote localStorage['spplus-welcome-no-show'] and the shell read
# it back on the next launch. QWebEngineProfile.defaultProfile() is OFF THE
# RECORD, so that localStorage lives in memory and dies with the process.
# Measured on HW-00:
#
#     offTheRecord = True
#     storagePath  = '.../QtWebEngine/OffTheRecord'
#
# The advisor ticked the box, Welcome told them it would stay out of the way,
# and it autostarted again at every single login with no way to stop it. The
# preference now lives in QSettings, which the shell owns.
#
# THE SECOND DEFECT, FOUND ON THE v0.11 INSTALL (2026-09-11).
# The fix above was applied to the launcher itself, and the menu entry and the
# autostart entry were the same command. So the preference silenced BOTH. The
# advisor ticked the box, and from then on clicking SP+ Welcome in the
# application menu produced a startup cursor for a second and nothing else --
# no window, no error, no way back in. The preference now applies ONLY to the
# launch that carries --autostart, which is the login one.
#
# WHAT THIS GATE CHECKS. The round trip, through the real launcher, not a copy:
# with the preference set, the login launch must close itself and the menu
# launch must stay open; with it clear, the login launch must stay open too.
# Every direction is asserted, so the gate fails if the preference stops being
# read, if it starts hiding Welcome from everyone, and if it ever again takes
# the application away from an advisor who only asked not to be interrupted.
set -uo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
WELCOME=$ROOT/welcome/welcome.py
[ -f "$WELCOME" ] || { echo "WELCOME_NO_SHOW_FAIL: no welcome.py at $WELCOME" >&2; exit 1; }
command -v timeout >/dev/null 2>&1 || { echo 'WELCOME_NO_SHOW_FAIL: timeout missing' >&2; exit 1; }
python3 -c 'import PySide6.QtWebEngineWidgets' 2>/dev/null || {
    echo 'SKIP no PySide6 QtWebEngine here; the no-show round trip was NOT exercised'; exit 0; }

# Every run gets its own settings, runtime and cache directories. The gate must
# never read or write the preference belonging to whoever is logged in, and the
# single-instance socket must not collide with a Welcome they already have open.
SANDBOX=$(mktemp -d)
trap 'rm -rf "$SANDBOX"' EXIT
export XDG_CONFIG_HOME="$SANDBOX/config"
export XDG_CACHE_HOME="$SANDBOX/cache"
export XDG_RUNTIME_DIR="$SANDBOX/run"
mkdir -p "$XDG_CONFIG_HOME" "$XDG_CACHE_HOME" "$XDG_RUNTIME_DIR"
chmod 700 "$XDG_RUNTIME_DIR"
export QT_QPA_PLATFORM=offscreen
# Do not contend for the advisor's single-instance socket. Without this the
# running Welcome on a logged-in machine owns the name, every launch below
# returns 0 at once, and the gate reports success having tested nothing.
export SPPLUS_INSTANCE_NAME="spplus-welcome-gate-$$"

# Set the preference through the SHIPPING code, so the gate cannot pass against
# a key the app does not actually use.
set_no_show() {
    python3 - "$WELCOME" "$1" <<'PY'
import importlib.util, sys
spec = importlib.util.spec_from_file_location('spplus_welcome', sys.argv[1])
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
mod.write_no_show(sys.argv[2] == 'true')
if mod.read_no_show() != (sys.argv[2] == 'true'):
    raise SystemExit('read_no_show did not agree with what was just written')
PY
}

fail=0

# --- 1. Preference SET, LOGIN launch: Welcome must close itself, quickly. ----
set_no_show true || { echo 'WELCOME_NO_SHOW_FAIL: could not write the preference' >&2; exit 1; }
start=$(date +%s)
timeout 40s python3 "$WELCOME" --autostart >/dev/null 2>&1
rc=$?
elapsed=$(( $(date +%s) - start ))
if [ "$rc" = 124 ]; then
    echo "WELCOME_NO_SHOW_FAIL: opted out, but the login launch stayed open past 40s" >&2
    fail=1
else
    echo "WELCOME_NO_SHOW_OPTED_OUT_OK: login launch exited in ${elapsed}s"
fi

# --- 1b. Preference SET, MENU launch: Welcome must STILL open. ---------------
# The whole punch item. "Do not show this setup again" is about the login
# interruption. An advisor who then goes looking for Welcome in the menu must
# get Welcome, not a startup cursor and silence.
timeout 20s python3 "$WELCOME" >/dev/null 2>&1
rc=$?
if [ "$rc" = 124 ]; then
    echo 'WELCOME_NO_SHOW_MENU_OK: opted out, and the menu launch still opened'
else
    echo "WELCOME_NO_SHOW_FAIL: opted out took the menu entry away too (rc=$rc)" >&2
    fail=1
fi

# --- 2. Preference CLEAR: the login launch must stay open. -------------------
# This is the half that stops a "fix" which simply always closes. Without it the
# gate would pass for an app no advisor could ever use.
set_no_show false || { echo 'WELCOME_NO_SHOW_FAIL: could not clear the preference' >&2; exit 1; }
timeout 20s python3 "$WELCOME" --autostart >/dev/null 2>&1
rc=$?
if [ "$rc" = 124 ]; then
    echo 'WELCOME_NO_SHOW_OPTED_IN_OK: stayed open until the gate stopped it'
else
    echo "WELCOME_NO_SHOW_FAIL: not opted out, but Welcome exited on its own (rc=$rc)" >&2
    fail=1
fi

# --- 3. --reset-no-show must clear the preference it names. ------------------
set_no_show true || exit 1
timeout 40s python3 "$WELCOME" --reset-no-show >/dev/null 2>&1
after=$(python3 - "$WELCOME" <<'PY'
import importlib.util, sys
spec = importlib.util.spec_from_file_location('spplus_welcome', sys.argv[1])
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
print('true' if mod.read_no_show() else 'false')
PY
)
if [ "$after" = "false" ]; then
    echo 'WELCOME_NO_SHOW_RESET_OK: --reset-no-show cleared the preference'
else
    echo "WELCOME_NO_SHOW_FAIL: --reset-no-show left the preference at '$after'" >&2
    fail=1
fi

# --- 4. The page must not be the store. -------------------------------------
# The old defect is a one-line regression away: any localStorage write of this
# preference means the durable copy has a rival that silently wins on the page.
if grep -rn "localStorage[^)]*spplus-welcome-no-show" "$ROOT/welcome/app" >/dev/null 2>&1; then
    echo 'WELCOME_NO_SHOW_FAIL: the page writes this preference to localStorage again' >&2
    fail=1
else
    echo 'WELCOME_NO_SHOW_SOURCE_OK: the page does not store this preference itself'
fi

# --- 5. The two launchers must not be the same file. ------------------------
# They were, and that is what caused the menu entry to die silently. A future
# edit that copies one over the other reintroduces the defect exactly.
MENU=$ROOT/welcome/org.secureprospective.spplus.welcome.desktop
AUTO=$ROOT/welcome/org.secureprospective.spplus.welcome-autostart.desktop
if grep -q '^Exec=/usr/bin/spplus-welcome --autostart$' "$AUTO" 2>/dev/null \
   && grep -q '^Exec=/usr/bin/spplus-welcome$' "$MENU" 2>/dev/null; then
    echo 'WELCOME_NO_SHOW_LAUNCHERS_OK: only the login entry passes --autostart'
else
    echo 'WELCOME_NO_SHOW_FAIL: the menu and login launchers no longer differ' >&2
    fail=1
fi

[ "$fail" = 0 ] || exit 1
echo 'WELCOME_NO_SHOW_OK: 6/6'
