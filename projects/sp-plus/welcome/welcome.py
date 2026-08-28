#!/usr/bin/env python3
"""SP+ Welcome: a native QWebEngineView shell for the local HTML application."""
from __future__ import annotations
import argparse
import sys
from pathlib import Path
import json
import os
import subprocess
from urllib.parse import parse_qs, urlparse
from PySide6.QtCore import QSettings, QThread, QTimer, QUrl, QObject, Signal, Slot
from PySide6.QtGui import QIcon
from PySide6.QtWidgets import QApplication, QMainWindow
from PySide6.QtWebEngineCore import QWebEngineSettings
from PySide6.QtWebEngineWidgets import QWebEngineView

ROOT = Path(__file__).resolve().parent
APP_URL = QUrl.fromLocalFile(str(ROOT / 'app' / 'index.html'))

# Applying a global theme has to change EVERY component together -- colours,
# icons, widget style, Plasma theme, window decoration, cursor and fonts. That is
# what /usr/libexec/spplus-apply-theme guarantees; plasma-apply-lookandfeel on its
# own applies the colour scheme and leaves the rest to the session, which is the
# partial-switch the advisor sees. Welcome must never call the bare tool.
# Overridable so the gate can exercise the real bridge against a staged helper
# without needing to write into the immutable /usr.
APPLY_THEME = os.environ.get('SPPLUS_APPLY_THEME',
                             '/usr/libexec/spplus-apply-theme')
FIN = os.environ.get('SPPLUS_FIN', '/usr/libexec/sp-plus/fin')


class AskWorker(QThread):
    """Run Fin away from Qt's UI thread and return a display-safe result."""

    result_ready = Signal(object, object)

    def __init__(self, question):
        super().__init__()
        self.question = question

    def run(self):
        try:
            result = subprocess.run([FIN, '--ask', self.question],
                                    capture_output=True, text=True, timeout=120)
            answer = (result.stdout or '').strip()
            if result.returncode == 0 and answer:
                payload = {'ok': True, 'answer': answer, 'reason': ''}
            elif result.returncode != 0:
                output = (result.stdout or '').strip()
                reason = f'Fin stopped before answering (exit code {result.returncode}).'
                if output == 'Fin is not connected yet.':
                    reason = output
                payload = {'ok': False, 'answer': '', 'reason': reason}
            else:
                payload = {'ok': False, 'answer': '', 'reason': 'Fin returned no answer.'}
        except subprocess.TimeoutExpired:
            payload = {'ok': False, 'answer': '',
                       'reason': 'Fin took too long to answer.'}
        except OSError:
            payload = {'ok': False, 'answer': '',
                       'reason': 'Fin is not available on this computer.'}
        except subprocess.SubprocessError:
            payload = {'ok': False, 'answer': '',
                       'reason': 'Fin could not be started.'}
        except Exception:
            payload = {'ok': False, 'answer': '',
                       'reason': 'Fin could not answer.'}
        self.result_ready.emit(self, payload)


class WelcomeBridge(QObject):
    """Carries requests from the page to the desktop over the window title.

    Navigating to a custom scheme is not usable here: QtWebEngine resolves the
    navigation itself and replaces the page, so the request never reaches the
    shell and the advisor loses the app. Setting document.title triggers
    titleChanged with no navigation at all, which is stable across Qt versions
    and needs no extra JavaScript asset shipped with the app.
    """

    PREFIX = 'spplus:'

    def __init__(self, view):
        super().__init__()
        self.view = view
        self._ask_workers = set()
        view.titleChanged.connect(self.on_title)

    def on_title(self, title):
        if not title.startswith(self.PREFIX):
            return
        parsed = urlparse(title[len(self.PREFIX):])
        params = parse_qs(parsed.query)
        if parsed.path == 'apply-theme':
            theme = (params.get('theme') or [''])[0]
            if theme:
                self.apply_theme(theme)
        elif parsed.path == 'ask':
            question = (params.get('q') or [''])[0].strip()
            if question:
                self.ask(question)

    def ask(self, question):
        worker = AskWorker(question)
        self._ask_workers.add(worker)
        worker.result_ready.connect(self._ask_finished)
        worker.finished.connect(worker.deleteLater)
        worker.start()

    @Slot(object, object)
    def _ask_finished(self, worker, payload):
        self._ask_workers.discard(worker)
        encoded = json.dumps(payload, ensure_ascii=True)
        self.view.page().runJavaScript(
            f'window.spWelcome && window.spWelcome.answered({encoded})')

    def apply_theme(self, theme_id):
        try:
            result = subprocess.run([APPLY_THEME, theme_id], capture_output=True,
                                    text=True, timeout=60)
            ok = result.returncode == 0
            detail = (result.stdout or result.stderr).strip().splitlines()
            summary = detail[-1] if detail else ''
        except (OSError, subprocess.SubprocessError) as exc:
            ok, summary = False, str(exc)
        # Report what actually happened; the page never assumes the click worked.
        payload = json.dumps({'ok': ok, 'detail': summary, 'theme': theme_id})
        self.view.page().runJavaScript(
            f'window.spWelcome && window.spWelcome.themeApplied({payload})')


class WelcomeWindow(QMainWindow):
    def __init__(self, force: bool = False, screen: int = 1, captures: bool = False, help_depth: int = 0):
        super().__init__()
        self.force, self.screen, self.captures, self.help_depth = force, screen, captures, help_depth
        self.setWindowTitle('SP+ Welcome')
        self.setMinimumSize(1120, 720)
        self.resize(1440, 900)
        self.view = QWebEngineView(self)
        self.bridge = WelcomeBridge(self.view)
        settings = self.view.settings()
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessFileUrls, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessRemoteUrls, False)
        self.setCentralWidget(self.view)
        self.view.loadFinished.connect(self.loaded)
        self.view.setUrl(APP_URL)

    def resizeEvent(self, event):
        super().resizeEvent(event)
        QTimer.singleShot(0, self.sync_shell_height)

    def closeEvent(self, event):
        # QMainWindow.close() only hides this window by default. That left the
        # autostart process and its QWebEngine renderer resident after the
        # advisor closed Welcome. Closing the window is the end of this app.
        event.accept()
        self.view.setUrl(QUrl())
        self.view.deleteLater()
        QApplication.quit()

    def sync_shell_height(self):
        if self.view.url().isValid():
            self.view.page().runJavaScript(f"document.documentElement.style.setProperty('--shell-height', '{self.view.height()}px')")

    def loaded(self, ok: bool):
        if not ok:
            self.setWindowTitle('SP+ Welcome: local application did not load')
            return
        self.sync_shell_height()
        if self.captures:
            QTimer.singleShot(700, self.capture_next)
            return
        if not self.force:
            self.view.page().runJavaScript("localStorage.getItem('spplus-welcome-no-show')", self.close_if_opted_out)
        if self.screen != 1:
            self.view.page().runJavaScript(f'window.spWelcome.go({max(0, min(6, self.screen - 1))})')
        if self.help_depth:
            QTimer.singleShot(900, lambda: self.view.page().runJavaScript(f'window.spWelcome.helpDepth({self.help_depth})'))

    def close_if_opted_out(self, value):
        if value == 'true':
            self.close()

    def capture_next(self):
        self._capture_index = 0
        self._capture_screen()

    def _capture_screen(self):
        if self._capture_index >= 7:
            QApplication.quit()
            return
        self.view.page().runJavaScript(f'window.spWelcome.go({self._capture_index})')
        QTimer.singleShot(250, self._grab_current)

    def _grab_current(self):
        out = ROOT / 'screenshots'
        out.mkdir(exist_ok=True)
        self.view.grab().save(str(out / f'html-screen-{self._capture_index + 1:02d}.png'))
        self._capture_index += 1
        QTimer.singleShot(100, self._capture_screen)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--screen', type=int, default=1, help='screen number 1-7')
    parser.add_argument('--screenshots', action='store_true')
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--reset-no-show', action='store_true')
    parser.add_argument('--self-test-close', action='store_true', help=argparse.SUPPRESS)
    parser.add_argument('--help-depth', type=int, choices=(1, 2), default=0, help='capture Everyday work or its LibreOffice article')
    args = parser.parse_args()
    app = QApplication(sys.argv)
    app.setApplicationName('SP+ Welcome')
    if args.reset_no_show:
        QSettings('Secure Prospective', 'SP+ Welcome').clear()
    window = WelcomeWindow(args.force or args.screenshots or args.self_test_close, args.screen, args.screenshots, args.help_depth)
    window.showMaximized()
    if args.self_test_close:
        QTimer.singleShot(1000, window.close)
    return app.exec()

if __name__ == '__main__':
    raise SystemExit(main())
