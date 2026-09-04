#!/usr/bin/env python3
"""Drive the real Welcome preview, confirmation, worker and theme readback path.

Run this on the Dell after the applied-session preview captures exist. It does
not treat opening a card as an apply, and it never reports success without the
helper's own verdict reaching the page.
"""
import json
import os
import subprocess
import sys
from pathlib import Path

from PySide6.QtCore import QTimer
from PySide6.QtWidgets import QApplication

sys.path.insert(0, str(Path.home() / "welcome-test"))
import welcome

TARGET = os.environ.get("SPPLUS_THEME_E2E_TARGET", sys.argv[1] if len(sys.argv) > 1 else
                       "org.secureprospective.spplus.modern.dark")
TIMEOUT_MS = int(os.environ.get("SPPLUS_THEME_E2E_TIMEOUT_MS", "300000"))


def read(file_name, group, key):
    result = subprocess.run(
        ["kreadconfig6", "--file", file_name, "--group", group, "--key", key],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


app = QApplication(sys.argv[:1])
win = welcome.WelcomeWindow(force=True, screen=2)
win.show()
elapsed = 0
apply_clicked = False


def finish(message, code):
    print(message)
    QTimer.singleShot(0, lambda: (app.exit(code)))


def inspect_preview(_value=None):
    global elapsed, apply_clicked
    script = """
      (() => {
        const card = [...document.querySelectorAll('.theme-card')]
          .find(item => item.dataset.lnf === %s);
        if (!card) return {error: 'theme card not found'};
        if (!document.querySelector('#theme-preview:not([hidden])')) card.click();
        const image = document.getElementById('preview-image');
        const button = document.getElementById('preview-apply');
        return {
          capture: Boolean(image && image.naturalWidth > 0),
          disabled: Boolean(!button || button.disabled),
          result: document.getElementById('preview-result')?.textContent || ''
        };
      })()
    """ % json.dumps(TARGET)

    def received(value):
        global elapsed, apply_clicked
        if value and value.get('error'):
            finish('FAIL ' + value['error'], 1)
            return
        if not apply_clicked:
            if value and value.get('capture') and not value.get('disabled'):
                apply_clicked = True
                win.view.page().runJavaScript(
                    "document.getElementById('preview-apply').click(); 'apply-clicked'"
                )
            elif elapsed >= TIMEOUT_MS:
                finish(f'REQUIRES-HUMAN capture missing or apply unavailable for {TARGET}', 2)
                return
        elif value and ('Applied.' in value.get('result', '') or
                        'Apply failed' in value.get('result', '')):
            print(f'after confirming {TARGET}:')
            for label, args in [
                ('LookAndFeel', ('kdeglobals', 'KDE', 'LookAndFeelPackage')),
                ('ColorScheme', ('kdeglobals', 'General', 'ColorScheme')),
                ('Icons', ('kdeglobals', 'Icons', 'Theme')),
                ('widgetStyle', ('kdeglobals', 'KDE', 'widgetStyle')),
                ('plasmaTheme', ('plasmarc', 'Theme', 'name')),
                ('decoTheme', ('kwinrc', 'org.kde.kdecoration2', 'theme')),
                ('cursor', ('kcminputrc', 'Mouse', 'cursorTheme')),
                ('font', ('kdeglobals', 'General', 'font')),
                ('buttons-left', ('kwinrc', 'org.kde.kdecoration2', 'ButtonsOnLeft')),
                ('buttons-right', ('kwinrc', 'org.kde.kdecoration2', 'ButtonsOnRight')),
                ('desktop-switcher', ('kwinrc', 'DesktopSwitcher', 'LayoutName')),
                ('window-switcher', ('kwinrc', 'WindowSwitcher', 'LayoutName')),
            ]:
                print(f'  {label:12s} {read(*args)}')
            finish(value['result'], 0 if 'Applied.' in value['result'] else 1)
            return
        elapsed += 500
        QTimer.singleShot(500, poll)

    win.view.page().runJavaScript(script, received)


def poll():
    inspect_preview()


win.view.loadFinished.connect(lambda ok: QTimer.singleShot(1500, inspect_preview) if ok else finish('FAIL Welcome did not load', 1))
QTimer.singleShot(TIMEOUT_MS, lambda: finish(f'FAIL theme apply timed out for {TARGET}', 1))
app.exec()
