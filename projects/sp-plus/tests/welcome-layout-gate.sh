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
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/lib/webengine.sh"
we_init; rc=$?
[ $rc -eq 3 ] && exit 0
[ $rc -eq 0 ] || { echo "WELCOME LAYOUT GATE: FAIL"; exit 2; }
trap we_cleanup EXIT
we_where
PROBE="$WE_WORK/welcome-layout-probe.py"
cat > "$PROBE" <<'PY'
import sys, json
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
# Screens are checked in their resting state AND in the states a person puts
# them into. Search was the proof this matters: results plus the topic rail
# overflowed the help panel, and a gate that only ever looked at the untouched
# screen reported PASS while the bottom row was visibly cut off.
STATES = [(2, 'printr wont wrk'), (2, 'zzzqqq nonsense')]
# Reading a guide is a state too, and the longest one: an article page plus its
# pager has to sit inside the same bounded panel. It is checked at every depth
# the advisor can reach -- the topic list, and the article itself.
DEPTHS = [(2, 1, 'category list'), (2, 2, 'article page')]

def check_depths(i):
    if i >= len(DEPTHS):
        for r in out: print(r)
        app.quit(); return
    screen, depth, label = DEPTHS[i]
    js = ("(function(){var f=document.getElementById('ask-fin');f.value='';"
          "f.dispatchEvent(new Event('input',{bubbles:true}));"
          "window.spWelcome.go(%d);window.spWelcome.helpDepth(%d);return 1;})()" % (screen, depth))
    v.page().runJavaScript(js,
      lambda _: QTimer.singleShot(1400, lambda: v.page().runJavaScript(JS,
        lambda m: (out.append(m.replace('"screen":"', '"screen":"%d/%s ' % (screen, label))),
                   check_depths(i+1)))))

def check_states(i):
    if i >= len(STATES):
        check_depths(0); return
    screen, query = STATES[i]
    js = """(function(){window.spWelcome.go(%d);
      var f=document.getElementById('ask-fin');f.value=%s;
      f.dispatchEvent(new Event('input',{bubbles:true}));return 1;})()""" % (screen, json.dumps(query))
    v.page().runJavaScript(js,
      lambda _: QTimer.singleShot(1200, lambda: v.page().runJavaScript(JS,
        lambda m: (out.append(m.replace('"screen":"', '"screen":"%d/search:%s ' % (screen, query))),
                   check_states(i+1)))))

def step(i):
    if i >= 8:
        check_states(0); return
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
  res=$(we_run 200 "$PROBE" "$WE_APP" "$1" "$2")
  [ -n "$res" ] || we_err
  [ -z "$res" ] && { echo "  probe produced nothing"; fail=1; continue; }
  n=$(printf '%s\n' "$res" | grep -c '^{')
  [ "$n" -eq 12 ] || { echo "  expected 8 screens, 2 search states and 2 help depths, got $n"; fail=1; }
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
