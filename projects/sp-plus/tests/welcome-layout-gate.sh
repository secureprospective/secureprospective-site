#!/usr/bin/env bash
# Welcome layout gate: nothing may be silently cut off.
#
# The app sets body{overflow:hidden}, so content that does not fit does not get a
# scrollbar -- it disappears. That is the worst failure mode for this product,
# because a nervous advisor sees a half-drawn screen and cannot even tell there
# was more. This gate walks all eight screens at both supported sizes and reports
# any box whose content exceeds it while its own overflow refuses to scroll.
#
# .sr-only is excluded deliberately: clipping to a 1px box is exactly how
# visually-hidden text for screen readers is supposed to work.
set -uo pipefail
APP="${SPPLUS_WELCOME_SRC:-$HOME/sp-plus-welcome-src/welcome}/app/index.html"
PROBE=/tmp/welcome-layout-probe.py
cat > "$PROBE" <<'PY'
import sys
from PySide6.QtCore import QUrl, QTimer
from PySide6.QtWidgets import QApplication
from PySide6.QtWebEngineWidgets import QWebEngineView
src, W, H = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
app = QApplication(sys.argv); v = QWebEngineView(); v.resize(W, H); v.show()
v.load(QUrl.fromLocalFile(src)); out = []
JS = """
(function(){
 var bad=[], act=document.querySelector('.screen.active');
 if(!act) return JSON.stringify({screen:'NONE',clipped:[{el:'no active screen',axis:'-',by:0}]});
 act.querySelectorAll('*').forEach(function(e){
   var s=getComputedStyle(e);
   if(s.display==='none'||s.visibility==='hidden') return;
   if(e.classList.contains('sr-only')) return;
   var vy=e.scrollHeight-e.clientHeight, vx=e.scrollWidth-e.clientWidth;
   if(vy>2&&(s.overflowY==='hidden'||s.overflowY==='clip'))
     bad.push({el:(e.id||e.className||e.tagName).toString().slice(0,44),axis:'y',by:vy});
   if(vx>2&&(s.overflowX==='hidden'||s.overflowX==='clip'))
     bad.push({el:(e.id||e.className||e.tagName).toString().slice(0,44),axis:'x',by:vx});
 });
 return JSON.stringify({screen:act.getAttribute('data-screen'),clipped:bad});
})()"""
def step(i):
    if i >= 8:
        for r in out: print(r)
        app.quit(); return
    v.page().runJavaScript("try{window.spWelcome.go(%d);1}catch(e){0}" % i,
      lambda _: QTimer.singleShot(1200, lambda: v.page().runJavaScript(JS,
        lambda m: (out.append(m), step(i+1)))))
v.loadFinished.connect(lambda ok: QTimer.singleShot(1500, lambda: step(0)) if ok else app.quit())
QTimer.singleShot(150000, app.quit)
sys.exit(app.exec())
PY
fail=0
for size in "1280 800" "1024 768"; do
  set -- $size
  echo "--- ${1}x${2} ---"
  res=$(QT_QPA_PLATFORM=offscreen timeout 200 python3 "$PROBE" "$APP" "$1" "$2" 2>/dev/null)
  [ -z "$res" ] && { echo "  probe produced nothing"; fail=1; continue; }
  n=$(printf '%s\n' "$res" | grep -c '^{') 
  [ "$n" -eq 8 ] || { echo "  expected 8 screens, got $n"; fail=1; }
  while IFS= read -r line; do
    printf '%s' "$line" | python3 -c '
import sys,json
d=json.load(sys.stdin)
if d["clipped"]:
    print("  screen %s CLIPPED:" % d["screen"])
    for c in d["clipped"]: print("    %s cut %spx on %s" % (c["el"], c["by"], c["axis"]))
    sys.exit(1)
' || fail=1
  done <<< "$(printf '%s\n' "$res" | grep '^{')"
done
echo
[ $fail -eq 0 ] && echo "WELCOME LAYOUT GATE: PASS" || echo "WELCOME LAYOUT GATE: FAIL"
exit $fail
