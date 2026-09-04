#!/usr/bin/python3
"""Welcome's suggested-prompt panel, driven for real.

Covers what the Help app's own gate cannot: Welcome draws this panel with its
own code, so it is checked by searching, opening a guide and reading what the
page actually rendered -- not by grepping the markup.

The PIN YOUR HELP half of this probe was removed 2026-09-04 with the button
itself. Help is opened from Brave, so pinning it to the task bar was a second
path to the same place, and the launcher it produced errored with "Unknown
application folder" when clicked.
"""
import json
import os
import sys

from PySide6.QtCore import QTimer, QUrl
from PySide6.QtWidgets import QApplication
from PySide6.QtWebEngineWidgets import QWebEngineView

APP = os.environ.get("SPPLUS_WELCOME_SRC",
                     os.path.expanduser("~/sp-plus-welcome-src/welcome"))
INDEX = os.path.join(APP, "app", "index.html")

fails = []
checks = 0


class Probe:
    def __init__(self, view, app):
        self.view, self.app = view, app

    def js(self, script, then):
        self.view.page().runJavaScript(script, then)

    def start(self, tries=0):
        def got(state):
            if state == "ready":
                self.open_article()
                return
            if tries >= 90:
                fails.append("Welcome never became ready")
                self.finish()
                return
            QTimer.singleShot(500, lambda: self.start(tries + 1))
        self.js("(function(){try{if(!window.spWelcome||!window.spWelcome.goHelp)"
                "return 'wait';window.spWelcome.goHelp();"
                "return document.getElementById('ask-fin')?'ready':'wait';}"
                "catch(e){return 'wait';}}())", got)

    def open_article(self, tries=0):
        # Walk to a guide the manual gives prompts for, the way an advisor
        # does: search for it, then open the result.
        def got(raw):
            global checks
            data = json.loads(raw)
            if not data["ready"]:
                if tries >= 60:
                    fails.append("could not reach a guide with prompts")
                    self.finish()
                    return
                QTimer.singleShot(500, lambda: self.open_article(tries + 1))
                return
            checks += 1
            if data["panelHidden"]:
                fails.append("the suggested-prompt panel stayed hidden on a guide that has prompts")
            checks += 1
            if data["prompts"] != data["copyButtons"]:
                fails.append("%d prompts but %d copy buttons"
                             % (data["prompts"], data["copyButtons"]))
            checks += 1
            if data["prompts"] == 0:
                fails.append("no prompts were lifted out of the guide")
            checks += 1
            if data["dupInBody"]:
                fails.append("a prompt appears both in the panel and in the article body")
            self.finish()

        self.js(
            "(function(){try{"
            "var input=document.getElementById('ask-fin');"
            "input.value='coming from windows';"
            "input.dispatchEvent(new Event('input'));"
            "var hit=document.querySelector('#help-content [data-found]');"
            "if(!hit) return JSON.stringify({ready:false});"
            "hit.click();"
            "var panel=document.getElementById('prompt-panel');"
            "var texts=[].map.call(document.querySelectorAll('#prompt-list .prompt-text'),"
            "  function(n){return n.textContent;});"
            "var reader=document.querySelector('.article-reader');"
            "var body=reader?reader.textContent:'';"
            "return JSON.stringify({ready:true,panelHidden:panel.hidden,"
            "prompts:texts.length,"
            "copyButtons:document.querySelectorAll('#prompt-list .prompt-copy').length,"
            "dupInBody:texts.some(function(t){return body.indexOf(t)!==-1;})});"
            "}catch(e){return JSON.stringify({ready:false});}}())", got)

    def finish(self):
        if fails:
            print("WELCOME_PROMPT FAILED (%d)" % len(fails))
            for f in fails:
                print("  - " + f)
            self.app.exit(1)
            return
        print("WELCOME_PROMPT_OK %d checks passed" % checks)
        self.app.exit(0)


def main():
    os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
    app = QApplication(sys.argv)
    view = QWebEngineView()
    probe = Probe(view, app)
    view.loadFinished.connect(
        lambda ok: probe.start(0) if ok else (fails.append("Welcome did not load"),
                                              probe.finish()))
    view.load(QUrl.fromLocalFile(INDEX))
    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
