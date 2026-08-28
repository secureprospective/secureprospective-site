#!/usr/bin/env python3
"""SP+ Welcome: a native QWebEngineView shell for the local HTML application."""
from __future__ import annotations
import argparse
import sys
from pathlib import Path
from PySide6.QtCore import QSettings, QTimer, QUrl
from PySide6.QtGui import QIcon
from PySide6.QtWidgets import QApplication, QMainWindow
from PySide6.QtWebEngineCore import QWebEngineSettings
from PySide6.QtWebEngineWidgets import QWebEngineView

ROOT = Path(__file__).resolve().parent
APP_URL = QUrl.fromLocalFile(str(ROOT / 'app' / 'index.html'))

class WelcomeWindow(QMainWindow):
    def __init__(self, force: bool = False, screen: int = 1, captures: bool = False, help_depth: int = 0):
        super().__init__()
        self.force, self.screen, self.captures, self.help_depth = force, screen, captures, help_depth
        self.setWindowTitle('SP+ Welcome')
        self.setMinimumSize(1120, 720)
        self.resize(1440, 900)
        self.view = QWebEngineView(self)
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
