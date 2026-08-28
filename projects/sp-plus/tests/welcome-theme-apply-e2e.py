#!/usr/bin/env python3
"""End-to-end: click a theme card in the real Welcome app and prove the desktop
changed. This exercises the actual spplus: bridge, not a simulation of it."""
import subprocess, sys
from pathlib import Path
from PySide6.QtCore import QTimer
from PySide6.QtWidgets import QApplication
sys.path.insert(0, str(Path.home() / "welcome-test"))
import welcome

TARGET = sys.argv[1] if len(sys.argv) > 1 else "Nordic"

def read(f, g, k):
    r = subprocess.run(["kreadconfig6", "--file", f, "--group", g, "--key", k],
                       capture_output=True, text=True)
    return r.stdout.strip()

app = QApplication(sys.argv[:1])
win = welcome.WelcomeWindow(force=True, screen=2)
win.show()

def click():
    win.view.page().runJavaScript(
        f"document.querySelector('[data-lnf=\"{TARGET}\"]').click(); 'clicked'",
        lambda v: QTimer.singleShot(9000, check))

def check():
    print(f"after clicking {TARGET}:")
    for label, args in [("ColorScheme", ("kdeglobals","General","ColorScheme")),
                        ("Icons", ("kdeglobals","Icons","Theme")),
                        ("widgetStyle", ("kdeglobals","KDE","widgetStyle")),
                        ("plasmaTheme", ("plasmarc","Theme","name")),
                        ("decoTheme", ("kwinrc","org.kde.kdecoration2","theme")),
                        ("cursor", ("kcminputrc","Mouse","cursorTheme")),
                        ("font", ("kdeglobals","General","font"))]:
        print(f"  {label:12s} {read(*args)}")
    app.quit()

win.view.loadFinished.connect(lambda ok: QTimer.singleShot(2500, click))
app.exec()
