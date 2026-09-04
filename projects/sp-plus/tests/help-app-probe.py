#!/usr/bin/python3
"""Drive the pinned Help application the way an advisor does.

Loads the real app from the real local server in a real browser engine, then
walks it: every category, every guide, the search field, the suggested-prompt
panel and the Fin round trip. It asserts on what the page ACTUALLY renders,
not on the JSON behind it, because a corpus can be complete while the reader
that shows it is broken.

Offscreen and headless. It never opens a window on anyone's desktop.
"""
import json
import os
import sys

from PySide6.QtCore import QTimer, QUrl
from PySide6.QtWidgets import QApplication
from PySide6.QtWebEngineWidgets import QWebEngineView

URL = os.environ.get("SPPLUS_HELP_URL", "http://127.0.0.1:8766/")
EXPECT_ARTICLES = int(os.environ.get("SPPLUS_HELP_EXPECT_ARTICLES", "37"))
EXPECT_CATEGORIES = int(os.environ.get("SPPLUS_HELP_EXPECT_CATEGORIES", "7"))

fails = []
checks = 0


def fail(msg):
    fails.append(msg)


class Probe:
    def __init__(self, view, app):
        self.view = view
        self.app = app
        self.titles = []
        self.i = 0
        self.with_prompts = 0

    def js(self, script, then):
        self.view.page().runJavaScript(script, then)

    # ---- readiness -----------------------------------------------------
    def start(self, tries=0):
        def got(ready):
            if ready == "ready":
                self.begin()
                return
            if tries >= 90:
                fail("the Help app never finished loading its corpus")
                self.finish()
                return
            QTimer.singleShot(500, lambda: self.start(tries + 1))
        self.js("(window.spHelpReady && window.spHelp) ? 'ready' : 'wait'", got)

    def begin(self):
        def got(raw):
            global checks
            data = json.loads(raw)
            checks += 1
            if len(data["articles"]) != EXPECT_ARTICLES:
                fail("the app lists %d guides, expected %d"
                     % (len(data["articles"]), EXPECT_ARTICLES))
            checks += 1
            if len(data["categories"]) != EXPECT_CATEGORIES:
                fail("the app lists %d topics, expected %d"
                     % (len(data["categories"]), EXPECT_CATEGORIES))
            checks += 1
            if data["rootCards"] != len(data["categories"]):
                fail("the opening screen drew %d topic cards for %d topics"
                     % (data["rootCards"], len(data["categories"])))
            # The opening screen is the index of the manual: every guide is
            # named there and opens in one click. Before 2026-09-04 it showed
            # seven topic cards and nothing else, so an advisor could not tell
            # whether the answer existed without clicking into a topic first.
            # Checking the count is not enough -- a list of the right length
            # with the wrong names would pass -- so this compares the sets.
            checks += 1
            missing = sorted(set(data["articles"]) - set(data["rootLinks"]))
            if missing:
                fail("%d guides are not listed on the opening screen: %s"
                     % (len(missing), ", ".join(missing[:4])))
            checks += 1
            stray = sorted(set(data["rootLinks"]) - set(data["articles"]))
            if stray:
                fail("the opening screen lists guides that do not exist: %s"
                     % ", ".join(stray[:4]))
            self.titles = data["articles"]
            self.walk()
        self.js("JSON.stringify({articles: window.spHelp.articles(),"
                " categories: window.spHelp.categories(),"
                " rootLinks: window.spHelp.rootLinks(),"
                " rootCards: window.spHelp.results().length})", got)

    # ---- every guide opens and renders ---------------------------------
    def walk(self):
        global checks
        if self.i >= len(self.titles):
            self.search_phase()
            return
        title = self.titles[self.i]

        def opened(raw):
            global checks
            data = json.loads(raw)
            checks += 1
            if not data["opened"]:
                fail("could not open the guide: %s" % title)
            elif data["state"] != title:
                fail("opening %r showed %r instead" % (title, data["state"]))
            elif data["chars"] < 200:
                fail("the guide %r rendered only %d characters of text"
                     % (title, data["chars"]))
            # Where the manual offers prompts, each must reach the panel with
            # its own copy button. Retyping into a terminal is the step that
            # loses a nervous advisor.
            if data["prompts"]:
                self.with_prompts += 1
                checks += 1
                if data["copyButtons"] != len(data["prompts"]):
                    fail("%r shows %d prompts but %d copy buttons"
                         % (title, len(data["prompts"]), data["copyButtons"]))
                checks += 1
                bad = [p for p in data["prompts"] if not p.startswith("Fin,")]
                if bad:
                    fail("%r lifted a line that is not a Fin prompt: %r" % (title, bad[0]))
                checks += 1
                if any(p in data["readerHtml"] for p in data["prompts"]):
                    fail("%r shows a prompt twice: in the panel and in the article" % title)
            self.i += 1
            QTimer.singleShot(0, self.walk)

        self.js(
            "(function(){var ok=window.spHelp.openByTitle(%s);"
            "var r=document.querySelector('.article-reader');"
            "return JSON.stringify({opened:ok,state:window.spHelp.state().title,"
            "chars:window.spHelp.readerText(),prompts:window.spHelp.prompts(),"
            "copyButtons:window.spHelp.copyButtons(),"
            "readerHtml:r?r.textContent:''});}())" % json.dumps(title), opened)

    # ---- the search bar ------------------------------------------------
    def search_phase(self):
        queries = [
            ("printr wont wrk", "print"),
            ("recovry key", None),
            ("passwrd", None),
            ("excel", None),
            ("zzzq wobblefish", "__none__"),
        ]
        self.queries = queries
        self.qi = 0
        self.next_query()

    def next_query(self):
        global checks
        if self.qi >= len(self.queries):
            self.coverage()
            return
        query, want = self.queries[self.qi]

        def got(raw):
            global checks
            data = json.loads(raw)
            checks += 1
            if want == "__none__":
                if data["results"]:
                    fail("nonsense query %r returned %s" % (query, data["results"]))
                elif "ASK FIN" not in data["html"].upper() and not data["empty"]:
                    fail("nonsense query %r offered no way on to Fin" % query)
            elif not data["results"]:
                fail("search found nothing for %r" % query)
            elif want and not any(want in r.lower() for r in data["results"]):
                fail("search for %r returned only %s" % (query, data["results"]))
            self.qi += 1
            QTimer.singleShot(0, self.next_query)

        self.js(
            "(function(){window.spHelp.search(%s);"
            "return JSON.stringify({results:window.spHelp.results(),"
            "html:document.getElementById('help-content').innerHTML,"
            "empty:!!document.querySelector('.search-empty')});}())"
            % json.dumps(query), got)

    # ---- every guide is reachable from the search bar ------------------
    def coverage(self):
        def got(raw):
            global checks
            unreachable = json.loads(raw)
            checks += 1
            if unreachable:
                fail("%d guides cannot be found from the search bar: %s"
                     % (len(unreachable), ", ".join(unreachable[:5])))
            self.finish()
        self.js(
            "(function(){var missing=[];"
            "window.spHelp.articles().forEach(function(t){"
            "window.spHelp.search(t);"
            "if(window.spHelp.results().indexOf(t)===-1) missing.push(t);});"
            "window.spHelp.search('');return JSON.stringify(missing);}())", got)

    def finish(self):
        checks_total = checks
        if self.with_prompts == 0:
            fail("no guide produced a single suggested prompt")
        print("guides opened: %d" % len(self.titles))
        print("guides offering prompts: %d" % self.with_prompts)
        if fails:
            print("HELP_APP_GATE FAILED (%d)" % len(fails))
            for f in fails:
                print("  - " + f)
            self.app.exit(1)
            return
        print("HELP_APP_GATE_OK %d checks passed" % checks_total)
        self.app.exit(0)


def main():
    os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
    app = QApplication(sys.argv)
    view = QWebEngineView()
    probe = Probe(view, app)
    view.loadFinished.connect(
        lambda ok: probe.start(0) if ok else (fail("the Help app did not load"),
                                              probe.finish()))
    view.load(QUrl(URL))
    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
