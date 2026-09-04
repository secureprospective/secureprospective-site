#!/usr/bin/env bash
# The last button on Welcome must actually hand off.
#
# "OPEN THE DESKTOP" spent its whole life announcing a sentence and staying
# open, so the one control on the final screen did nothing an advisor could
# see. This drives the real button in the real application -- not a copy of
# the page in a probe -- and passes only if the app is on its way out.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/lib/webengine.sh"
we_init; rc=$?
[ $rc -eq 3 ] && exit 0
[ $rc -eq 0 ] || { echo "WELCOME FINISH HANDOFF: FAIL"; exit 2; }
trap we_cleanup EXIT
we_where
DRIVER="$WE_WORK/welcome-finish-driver.py"
cat > "$DRIVER" <<PY
import sys, os
sys.path.insert(0, os.environ['SPPLUS_WELCOME_DIR'])
os.environ['QT_QPA_PLATFORM'] = 'offscreen'
import welcome
from PySide6.QtWidgets import QApplication
from PySide6.QtCore import QTimer
app = QApplication(sys.argv)
state = {'quit': False}
state['clicked'] = False

def on_quit():
    state['quit'] = True
    # The app shutting down AFTER the click is the pass. Before it, it is this
    # harness ending, which must never read as the button working.
    if state['clicked']:
        print('FINISH_HANDOFF_OK')

app.aboutToQuit.connect(on_quit)
w = welcome.WelcomeWindow(force=True, screen=8)
w.show()

def click():
    w.view.page().runJavaScript(
        "(function(){var n=document.getElementById('next');return n.textContent.trim()})()",
        lambda label: (print('button:', label),
                       state.update(clicked=True),
                       w.view.page().runJavaScript("document.getElementById('next').click();1")))
    QTimer.singleShot(3000, verdict)

def verdict():
    # Still here three seconds after the click means the button did nothing.
    if not state['quit'] and w.isVisible():
        print('FINISH_HANDOFF_FAILED the button left Welcome open')
        state['clicked'] = False
    QTimer.singleShot(200, app.quit)

w.view.loadFinished.connect(lambda ok: QTimer.singleShot(2500, click))
QTimer.singleShot(40000, app.quit)
app.exec()
PY
WE_ENV=( "SPPLUS_WELCOME_DIR=$WE_SRC_CTX" )
out=$(we_run 90 "$DRIVER")
printf '%s\n' "$out"
[ -n "$out" ] || we_err
if printf '%s' "$out" | grep -q FINISH_HANDOFF_OK; then
  echo "WELCOME FINISH HANDOFF: PASS"; exit 0
fi
echo "WELCOME FINISH HANDOFF: FAIL"; exit 1
