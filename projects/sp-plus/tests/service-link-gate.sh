#!/usr/bin/env bash
# Service link gate.
#
# Christopher will sign in with his own accounts; what has to be true before he
# does is that each button reaches the right address and nothing else. This gate
# proves the whole chain without registering anything:
#
#   card click -> panel -> OPEN button -> document.title bridge -> host -> xdg-open URL
#
# It runs offscreen so it cannot collide with a Welcome instance already on the
# VM's display, and it stubs xdg-open with a recorder so no browser is launched.
set -uo pipefail
cd "$(dirname "$0")"
APP="${SPPLUS_WELCOME_SRC:-$HOME/sp-plus-welcome-src/welcome}"
fail=0
say(){ printf '%-62s %s\n' "$1" "$2"; }
chk(){ if [ "$2" = "$3" ]; then say "$1" "PASS"; else say "$1" "FAIL (want=$2 got=$3)"; fail=1; fi; }

# --- Half 1: the page emits the correct bridge title on a real click ---------
cat > /tmp/page-half.py <<'PY'
import sys, json
from PySide6.QtCore import QUrl, QTimer
from PySide6.QtWidgets import QApplication
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebEngineCore import QWebEngineSettings

app = QApplication(sys.argv)
view = QWebEngineView()
s = view.settings()
s.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessRemoteUrls, False)
view.load(QUrl.fromLocalFile(sys.argv[1]))
out = {}
service = sys.argv[2]

def ready_payload(svc):
    plats = [{'id':'x','label':'X','state':'ready'}] if svc=='social' else []
    return {'ok':True,'valid':True,'service':svc,'status':'ready',
            'platforms':plats,'http_status':200,'failure':''}

def step3(t):
    out['title'] = t
    print(json.dumps(out)); app.quit()

def step2(_):
    # real click on the panel's OPEN button, then read the bridge title
    view.page().runJavaScript(
        "document.getElementById('service-panel').hidden === false ? "
        "(document.getElementById('service-panel-link').click(), document.title) : 'PANEL_DID_NOT_OPEN'",
        step3)

def step1(_):
    view.page().runJavaScript(
        "document.querySelector('[data-service-card=\"%s\"]').disabled" % service,
        lambda d: out.__setitem__('disabled_after_ready', d))
    view.page().runJavaScript(
        "document.querySelector('[data-service-card=\"%s\"]').click(); 1" % service, step2)

def loaded(ok):
    if not ok:
        print(json.dumps({'title':'LOAD_FAILED'})); app.quit(); return
    view.page().runJavaScript(
        "window.spWelcome.serviceResult(%s); 1" % json.dumps(ready_payload(service)),
        lambda _: QTimer.singleShot(300, lambda: step1(None)))

view.loadFinished.connect(loaded)
QTimer.singleShot(20000, lambda: (print(json.dumps({'title':'TIMEOUT'})), app.quit()))
sys.exit(app.exec())
PY

for svc in files social; do
  r=$(QT_QPA_PLATFORM=offscreen timeout 40 python3 /tmp/page-half.py "$APP/app/index.html" "$svc" 2>>/tmp/page-half.err | tail -1)
  got=$(printf '%s' "$r" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("title","NO_OUTPUT"))' 2>/dev/null || echo NO_OUTPUT)
  dis=$(printf '%s' "$r" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("disabled_after_ready","?"))' 2>/dev/null || echo '?')
  chk "page: $svc card enabled once service reports ready" "False" "$dis"
  chk "page: $svc OPEN emits bridge title" "spplus:open-service?service=$svc&action=browser" "$got"
done

# --- Half 2: the host turns that same title into xdg-open <url> --------------
cat > /tmp/xdg-recorder.sh <<'REC'
#!/bin/sh
echo "$1" >> /tmp/xdg-calls.txt
REC
chmod +x /tmp/xdg-recorder.sh
: > /tmp/xdg-calls.txt

cat > /tmp/host-half.py <<'PY'
import sys, os
sys.path.insert(0, os.environ['APPDIR'])
os.environ['SPPLUS_XDG_OPEN'] = '/tmp/xdg-recorder.sh'
import importlib.util
spec = importlib.util.spec_from_file_location('w', os.path.join(os.environ['APPDIR'],'welcome.py'))
w = importlib.util.module_from_spec(spec)
sys.modules['w'] = w
spec.loader.exec_module(w)

class FakePage:
    def runJavaScript(self, s): pass
class FakeView:
    def page(self): return FakePage()

# Exercise the real handler methods on an uninitialised instance: on_title parses
# the bridge string and open_service performs the launch. Nothing is faked in
# between, which is the point of the gate.
inst = w.WelcomeBridge.__new__(w.WelcomeBridge)
inst.view = FakeView()
for t in ['spplus:open-service?service=files&action=browser',
          'spplus:open-service?service=social&action=browser',
          'spplus:open-service?service=evil&action=browser',
          'spplus:open-service?service=files&action=exec']:
    inst.on_title(t)
PY

APPDIR="$APP" python3 /tmp/host-half.py 2>/dev/null
sleep 1
calls=$(tr '\n' ' ' < /tmp/xdg-calls.txt | sed 's/ *$//')
chk "host: bridge title launches exactly the two real URLs" \
    "https://cloud.secureprospective.com https://social.secureprospective.com" "$calls"

echo
[ $fail -eq 0 ] && echo "SERVICE LINK GATE: PASS" || echo "SERVICE LINK GATE: FAIL"
exit $fail
