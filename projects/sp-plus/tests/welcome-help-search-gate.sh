#!/usr/bin/env bash
# Help search gate: the advisor must not need our vocabulary or our spelling.
#
# The help tree silently assumes the reader knows which category their problem
# belongs to and how to spell it. Someone whose printer has stopped may type
# "printr wont wrk" and does not know whether that is Everyday work or Fix a
# problem. This gate drives the real search field with the words an advisor
# actually types -- misspelled, in their own terms -- and requires the right
# guide to come back.
#
# It also requires the opposite: nonsense must return nothing AND offer Fin,
# because a search that invents matches is worse than one that admits a gap.
set -uo pipefail
APP="${SPPLUS_WELCOME_SRC:-$HOME/sp-plus-welcome-src/welcome}/app/index.html"
PROBE=/tmp/help-search-probe.py
cat > "$PROBE" <<'PY'
import sys, json
from PySide6.QtCore import QUrl, QTimer
from PySide6.QtWidgets import QApplication
from PySide6.QtWebEngineWidgets import QWebEngineView
app = QApplication(sys.argv); v = QWebEngineView(); v.resize(1280, 800); v.show()
v.load(QUrl.fromLocalFile(sys.argv[1]))
queries = json.loads(sys.argv[2]); res = []
def done():
    print(json.dumps(res)); app.quit()
def run(i):
    if i >= len(queries): done(); return
    q = queries[i]
    js = """(function(){
      var f=document.getElementById('ask-fin');
      f.value=%s; f.dispatchEvent(new Event('input',{bubbles:true}));
      return JSON.stringify({
        hits:[].map.call(document.querySelectorAll('#help-content [data-found] b'),
                         function(b){return b.textContent;}),
        empty: !!document.querySelector('#help-content .search-empty'),
        lede: document.getElementById('help-lede').textContent});})()""" % json.dumps(q)
    v.page().runJavaScript(js, lambda out, q=q, i=i: (res.append({'q': q, 'r': out}), run(i + 1)))
v.loadFinished.connect(lambda ok: QTimer.singleShot(2200, lambda: run(0)) if ok else done())
QTimer.singleShot(120000, done)
sys.exit(app.exec())
PY

# query -> the article it must surface. These are the advisor's words, not ours.
QUERIES='["printr wont wrk","no internet","passwrd","excel","sound","recovry key","screen went black","zzzqqq nonsense"]'
EXPECT='{"printr wont wrk":"Printing","no internet":"Wi-Fi won'"'"'t connect","passwrd":"Browser and passwords","excel":"LibreOffice: your Word and Excel","sound":"No sound","recovry key":"Your encryption and recovery key","screen went black":"Second monitor problems"}'

out=$(QT_QPA_PLATFORM=offscreen timeout 150 python3 "$PROBE" "$APP" "$QUERIES" 2>/dev/null | tail -1)
[ -z "$out" ] && { echo "probe produced nothing"; echo "HELP SEARCH GATE: FAIL"; exit 1; }

printf '%s' "$out" | EXPECT="$EXPECT" python3 -c '
import json, os, sys
rows = json.load(sys.stdin)
expect = json.loads(os.environ["EXPECT"])
fail = 0
for row in rows:
    q = row["q"]
    try:
        r = json.loads(row["r"])
    except Exception:
        print("  %-26s probe returned nothing" % q); fail = 1; continue
    hits = r["hits"]
    if q in expect:
        want = expect[q]
        if want in hits:
            print("  %-26s -> %s" % (q, ", ".join(hits)))
        else:
            print("  %-26s MISSED %r, got %s" % (q, want, hits or "nothing")); fail = 1
    else:
        # the nonsense query: no results, and the advisor is handed to Fin
        if hits:
            print("  %-26s INVENTED matches: %s" % (q, hits)); fail = 1
        elif not r["empty"]:
            print("  %-26s empty result has no hand-off panel" % q); fail = 1
        elif "ASK FIN" not in r["lede"].upper():
            print("  %-26s empty result never offers Fin: %s" % (q, r["lede"][:60])); fail = 1
        else:
            print("  %-26s -> nothing, and offers Fin" % q)
sys.exit(1 if fail else 0)
'
status=$?
echo
[ $status -eq 0 ] && echo "HELP SEARCH GATE: PASS" || echo "HELP SEARCH GATE: FAIL"
exit $status
