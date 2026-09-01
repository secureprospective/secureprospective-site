#!/usr/bin/python3
"""The two new controls on Welcome's help screen, driven for real.

Covers what the Help app's own gate cannot: Welcome draws the suggested-prompt
panel with its own code, and the PIN YOUR HELP button only means anything if
pressing it reaches the shell. Both are checked by pressing them, not by
reading the markup.
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
                "return document.getElementById('pin-help')?'ready':'wait';}"
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
            self.press_pin()

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

    def press_pin(self):
        # The button must actually reach the shell. Welcome talks to its Qt
        # host by setting document.title, so a press that never sets it is a
        # button that does nothing.
        def got(raw):
            global checks
            data = json.loads(raw)
            checks += 1
            if data["title"] != "spplus:pin-help":
                fails.append("pressing PIN YOUR HELP did not ask the shell to pin "
                             "(document.title was %r)" % data["title"])
            checks += 1
            if not data["disabled"]:
                fails.append("PIN YOUR HELP stayed pressable while pinning, so it can be double-fired")
            self.report_result()
        self.js("(function(){var b=document.getElementById('pin-help');b.click();"
                "return JSON.stringify({title:document.title,disabled:b.disabled});}())", got)

    def report_result(self):
        # A failure has to reach the advisor as a sentence, not a dead button.
        def got(raw):
            global checks
            data = json.loads(raw)
            checks += 1
            if "could not be pinned" not in data["text"]:
                fails.append("a failed pin did not explain itself: %r" % data["text"])
            checks += 1
            if data["label"] != "PIN YOUR HELP":
                fails.append("a failed pin left the button reading %r" % data["label"])
            checks += 1
            if data["disabled"]:
                fails.append("a failed pin left the button unpressable, so the advisor cannot retry")
            self.finish()
        self.js("(function(){window.spWelcome.pinHelpResult({ok:false,reason:'test double refused.'});"
                "var b=document.getElementById('pin-help');"
                "return JSON.stringify({text:document.getElementById('pin-help-result').textContent,"
                "label:b.textContent,disabled:b.disabled});}())", got)

    def finish(self):
        if fails:
            print("WELCOME_PROMPT_PIN FAILED (%d)" % len(fails))
            for f in fails:
                print("  - " + f)
            self.app.exit(1)
            return
        print("WELCOME_PROMPT_PIN_OK %d checks passed" % checks)
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
