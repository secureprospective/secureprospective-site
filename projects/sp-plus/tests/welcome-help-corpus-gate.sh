#!/usr/bin/env bash
# Help corpus gate: every article the app offers must actually open and read.
#
# The corpus is generated from the manual, so it grows without anyone opening the
# result. A category button that leads to an empty list, or an article that opens
# to a blank reader, is the kind of dead end that costs a nervous advisor their
# trust -- and it is invisible from the JSON alone. This walks the whole tree the
# way a person does: every category, every article, checking each one renders
# real text and reports a page count.
set -uo pipefail
APP="${SPPLUS_WELCOME_SRC:-$HOME/sp-plus-welcome-src/welcome}/app/index.html"
MIN_CHARS="${MIN_CHARS:-200}"
WALKER=/tmp/help-corpus-walker.py
cat > "$WALKER" <<'PYWALK'
import sys, json
from PySide6.QtCore import QUrl, QTimer
from PySide6.QtWidgets import QApplication
from PySide6.QtWebEngineWidgets import QWebEngineView
app=QApplication(sys.argv); v=QWebEngineView(); v.resize(1280,800); v.show()
v.load(QUrl.fromLocalFile(sys.argv[1])); out=[]
WALK = """
(function(){
  var report=[];
  var cats=[].map.call(document.querySelectorAll('#help-content [data-category]'),
                       function(b){return b.dataset.category;});
  return JSON.stringify(cats);
})()"""
def finish():
    print(json.dumps(out, indent=1)); app.quit()
def walk_cat(cats, i):
    if i >= len(cats): finish(); return
    cat = cats[i]
    js = """(function(){
      var b=[].filter.call(document.querySelectorAll('#help-content [data-category]'),
             function(x){return x.dataset.category===%s;})[0];
      if(!b) return JSON.stringify({cat:%s,err:'category button missing'});
      b.click();
      // A long category is paged. Read every page before walking, then come
      // back to the first: collecting lazily mid-walk fights the reset that
      // happens each time we return from a guide.
      var arts=[], guard=0;
      function titles(){return [].map.call(
        document.querySelectorAll('#help-content [data-article] b'),
        function(x){return x.textContent;});}
      arts=titles();
      while(guard++ < 20){
        var n=document.querySelector('#help-content [data-list=\"next\"]');
        if(!n) break;
        n.click(); arts=arts.concat(titles());
      }
      var p=document.querySelector('#help-content [data-list=\"prev\"]');
      while(p){p.click(); p=document.querySelector('#help-content [data-list=\"prev\"]');}
      return JSON.stringify({cat:%s, articles:arts});})()""" % (json.dumps(cat),json.dumps(cat),json.dumps(cat))
    def got(res):
        d=json.loads(res) if res else {'cat':cat,'err':'no result'}
        walk_articles(cats, i, d, 0)
    v.page().runJavaScript(js, got)
def walk_articles(cats, i, d, j):
    arts = d.get('articles', [])
    if j >= len(arts):
        out.append(d)
        # back to root for the next category
        v.page().runJavaScript("(function(){var h=document.getElementById('help-home');if(h)h.click();return 1;})()",
            lambda _: QTimer.singleShot(500, lambda: walk_cat(cats, i+1)))
        return
    # Find the guide by its title, paging forward if it is not on the page in
    # front of us. Index alone is wrong once a category pages: the buttons
    # renumber from zero on every page.
    js = """(function(){
      var want=%s;
      function find(){return [].filter.call(
        document.querySelectorAll('#help-content [data-article]'),
        function(x){var b=x.querySelector('b');return b&&b.textContent===want;})[0];}
      var b=find(), guard=0;
      while(!b && guard++ < 20){
        var n=document.querySelector('#help-content [data-list=\"next\"]');
        if(!n) break;
        n.click(); b=find();
      }
      if(!b) return JSON.stringify({err:'article button missing'});
      b.click();
      var r=document.querySelector('.article-reader');
      var pager=document.querySelector('.help-pager span');
      return JSON.stringify({chars:r?r.textContent.trim().length:0,
                             pager:pager?pager.textContent:'none',
                             heading:document.getElementById('help-heading').textContent});})()""" % json.dumps(arts[j])
    def got(res):
        a = json.loads(res) if res else {'err':'no result'}
        d.setdefault('checked', []).append({arts[j]: a})
        # return to the category listing
        v.page().runJavaScript("""(function(){
            var c=document.querySelectorAll('#breadcrumbs .crumb-button');
            if(c.length>1){c[1].click();return 1;} return 0;})()""",
            lambda _: QTimer.singleShot(350, lambda: walk_articles(cats, i, d, j+1)))
    v.page().runJavaScript(js, got)
# Wait for each condition instead of guessing a delay. Fixed sleeps passed on a
# fast machine and failed on the Dell-class test VM, where software rendering
# makes the first paint arrive late -- and a gate that fails on the slow machine
# we deliberately test on is worse than no gate. Two things are awaited in turn:
# the app object being wired up, and the help categories actually being rendered.
def start(tries=0):
    def got(ready):
        if ready == 'ok':
            await_cats(0); return
        if tries >= 60:
            finish(); return
        QTimer.singleShot(500, lambda: start(tries + 1))
    v.page().runJavaScript(
        "(function(){try{if(!window.spWelcome||!window.spWelcome.go)return 'wait';"
        "window.spWelcome.go(2);return 'ok';}catch(e){return 'wait';}})()", got)
def await_cats(tries):
    def got(c):
        cats = json.loads(c) if c else []
        if cats:
            walk_cat(cats, 0); return
        if tries >= 60:
            finish(); return
        QTimer.singleShot(500, lambda: await_cats(tries + 1))
    v.page().runJavaScript(WALK, got)
v.loadFinished.connect(lambda ok: start(0) if ok else finish())
QTimer.singleShot(220000, finish); sys.exit(app.exec())
PYWALK
QT_QPA_PLATFORM=offscreen timeout 280 python3 "$WALKER" "$APP" > /tmp/help-walk.json 2>/dev/null
[ -s /tmp/help-walk.json ] || { echo "walker produced nothing"; echo "HELP CORPUS GATE: FAIL"; exit 1; }
MIN_CHARS="$MIN_CHARS" APP_PATH="$APP" python3 - <<'PY'
import json, os, re, sys
data = json.load(open('/tmp/help-walk.json'))
floor = int(os.environ['MIN_CHARS'])
fail = 0
total = 0
if not data:
    print('  no categories were found at all'); sys.exit(1)
for cat in data:
    name = cat.get('cat', '?')
    arts = cat.get('articles', [])
    if not arts:
        print('  %-22s leads to an empty list' % name); fail = 1; continue
    print('  %-22s %d articles' % (name, len(arts)))
    for entry in cat.get('checked', []):
        for title, info in entry.items():
            total += 1
            chars = info.get('chars', 0)
            pager = info.get('pager', '') or ''
            if chars < floor:
                print('    %s opens with only %d characters' % (title, chars)); fail = 1
            if not re.match(r'PAGE \d+ OF \d+', pager):
                print('    %s has no page count (%r)' % (title, pager)); fail = 1
print('  %d articles opened' % total)
if total == 0:
    print('  nothing was opened'); fail = 1
# Every article the app ships must be reachable by clicking. Counting them
# against the corpus is what catches a guide that exists in the data but has
# no route to it -- the failure paging introduced and this gate first missed.
corpus = json.load(open(os.path.join(os.path.dirname(os.environ['APP_PATH']), 'help-data.json')))
if total != len(corpus):
    print('  corpus ships %d articles but only %d could be reached by clicking'
          % (len(corpus), total)); fail = 1
sys.exit(fail)
PY
status=$?
echo
[ $status -eq 0 ] && echo "HELP CORPUS GATE: PASS" || echo "HELP CORPUS GATE: FAIL"
exit $status
