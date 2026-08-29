#!/usr/bin/env python3
"""SP+ Welcome: a native QWebEngineView shell for the local HTML application."""
from __future__ import annotations
import argparse
import sys
from pathlib import Path
import json
import os
import subprocess
import re
import time
from urllib.parse import parse_qs, quote, urlparse
from PySide6.QtCore import QSettings, QThread, QTimer, QUrl, QObject, Signal, Slot
from PySide6.QtGui import QIcon
from PySide6.QtWidgets import QApplication, QMainWindow
from PySide6.QtWebEngineCore import QWebEngineSettings
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtNetwork import QLocalServer, QLocalSocket

ROOT = Path(__file__).resolve().parent
APP_URL = QUrl.fromLocalFile(str(ROOT / 'app' / 'index.html'))
INSTANCE_NAME = 'spplus-welcome'

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
FIN_DESKTOP = os.environ.get('SPPLUS_FIN_DESKTOP', '/usr/share/applications/fin.desktop')
GTK_LAUNCH = os.environ.get('SPPLUS_GTK_LAUNCH', '/usr/bin/gtk-launch')
XDG_OPEN = os.environ.get('SPPLUS_XDG_OPEN', '/usr/bin/xdg-open')
EMAIL_DATA_HOME = Path(os.environ.get('XDG_DATA_HOME', str(Path.home() / '.local' / 'share')))
CUPS_TEST_PAGE = os.environ.get('SPPLUS_CUPS_TEST_PAGE', '/usr/share/cups/data/testprint')
FLATPAK = os.environ.get('SPPLUS_FLATPAK', '/usr/bin/flatpak')
SUDO = os.environ.get('SPPLUS_SUDO', '/usr/bin/sudo')
DISCOVER = os.environ.get('SPPLUS_DISCOVER', '/usr/bin/plasma-discover')
TUNE = os.environ.get('SPPLUS_TUNE', '/usr/libexec/spplus-tune')
MACHINE_DOC = os.environ.get('SPPLUS_MACHINE_DOC', '/var/lib/sp-plus/THIS-MACHINE.md')
FLATPAK_APP_NAMES = {
    'com.bitwarden.desktop': 'Bitwarden',
    'org.signal.Signal': 'Signal',
}
FLATPAK_APP_ID = re.compile(r'^[A-Za-z0-9][A-Za-z0-9.-]*[A-Za-z0-9]$')


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


class FlatpakInstallWorker(QThread):
    """Install one Flatpak and verify it exists before reporting success."""

    result_ready = Signal(object, object)

    def __init__(self, app_id):
        super().__init__()
        self.app_id = app_id
        self.name = FLATPAK_APP_NAMES.get(app_id, 'That application')

    def _result(self, ok, state, message):
        return {'ok': ok, 'state': state, 'app': self.app_id,
                'name': self.name, 'message': message}

    def run(self):
        try:
            existing = subprocess.run([FLATPAK, 'info', '--system', self.app_id],
                                      capture_output=True, text=True, timeout=30)
            if existing.returncode == 0:
                payload = self._result(
                    True, 'installed', f'{self.name} is already ready on this computer.')
                self.result_ready.emit(self, payload)
                return

            # SYSTEM scope, driven through `sudo -n`. This was `--user` until
            # 2026-08-29 and every install failed with
            #   error: No remote refs found for 'flathub'
            # because the image ships Flathub as a SYSTEM remote only
            # (/usr/share/flatpak/remotes.d/flathub.flatpakrepo) and the
            # preinstall unit also uses --system. The user installation has no
            # remote at all, so Welcome was the one component asking a scope
            # that does not exist here. Reproduced live on the Dell for both
            # Bitwarden and Signal.
            #
            # `sudo -n` rather than polkit: the advisor is in wheel with
            # NOPASSWD, and a polkit password prompt is exactly the dead end
            # sudoers-sp-plus argues against -- SP+ ships no account, the
            # password is chosen once by the first-boot wizard, and a
            # non-technical user does not reliably remember it months later.
            subprocess.run([SUDO, '-n', FLATPAK, 'install', '--system', '-y',
                            'flathub', self.app_id],
                           capture_output=True, text=True, timeout=1800)
            verified = subprocess.run([FLATPAK, 'info', '--system', self.app_id],
                                      capture_output=True, text=True, timeout=30)
            if verified.returncode == 0:
                payload = self._result(
                    True, 'installed', f'{self.name} is ready on this computer.')
            else:
                payload = self._result(
                    False, 'failed',
                    f'{self.name} could not be added. Your computer was left as it was.')
        except subprocess.TimeoutExpired:
            payload = self._result(
                False, 'failed',
                f'{self.name} could not be added. Your computer was left as it was.')
        except (OSError, subprocess.SubprocessError):
            payload = self._result(
                False, 'failed',
                f'{self.name} could not be added. Your computer was left as it was.')
        except Exception:
            payload = self._result(
                False, 'failed',
                f'{self.name} could not be added. Your computer was left as it was.')
        self.result_ready.emit(self, payload)


class FlathubCheckWorker(QThread):
    """Check the configured remote without making Discover wait on the page."""

    result_ready = Signal(object, object)

    def run(self):
        try:
            result = subprocess.run([FLATPAK, 'remotes', '--columns=name'],
                                    capture_output=True, text=True, timeout=30)
            remotes = {line.strip().split()[0].lower()
                       for line in (result.stdout or '').splitlines()
                       if line.strip()}
            if result.returncode == 0 and 'flathub' in remotes:
                payload = {'ok': True, 'message': ''}
            else:
                payload = {
                    'ok': False,
                    'message': 'Flathub is not available on this computer. Discover was not opened.',
                }
        except Exception:
            payload = {
                'ok': False,
                'message': 'Flathub is not available on this computer. Discover was not opened.',
            }
        self.result_ready.emit(self, payload)


class SingleInstance(QObject):
    """Own the local server and ask an existing Welcome window to come forward."""

    activated = Signal()

    def __init__(self):
        super().__init__()
        self.server = QLocalServer(self)
        self.server.newConnection.connect(self._new_connection)

    def _notify_existing(self):
        socket = QLocalSocket()
        socket.connectToServer(INSTANCE_NAME)
        if not socket.waitForConnected(250):
            return False
        socket.write(b'activate')
        socket.waitForBytesWritten(250)
        socket.disconnectFromServer()
        return True

    def acquire(self):
        if self._notify_existing():
            return False
        # A crashed process can leave the local socket name behind. Removing
        # only an unconnectable server makes the next launch recover safely.
        QLocalServer.removeServer(INSTANCE_NAME)
        if self.server.listen(INSTANCE_NAME):
            return True
        if self._notify_existing():
            return False
        raise RuntimeError(f'could not create Welcome instance server: {self.server.errorString()}')

    def _new_connection(self):
        while self.server.hasPendingConnections():
            socket = self.server.nextPendingConnection()
            socket.readAll()
            self.activated.emit()
            socket.disconnectFromServer()
            socket.deleteLater()


class ComputerCheckWorker(QThread):
    """Run the survey (DN-32) and report what it found.

    NAMED "check", NOT "tune", ON PURPOSE. v1 has no apply path: it looks at the
    machine and writes the record, and it changes NOTHING. The advisor's own
    settings are sacred (DN-32 D2) -- ownership of a setting cannot be inferred
    by comparing values, because a changed value tells you THAT it changed and
    never WHO changed it. So the button promises only what it does.

    The tuner exits 10 when the machine has fallen off the update path. That is
    a RESULT, not a crash: a machine that cannot update looks completely normal
    from the desktop, which is the entire reason this check exists.
    """

    result_ready = Signal(object, object)

    def run(self):
        try:
            if not Path(TUNE).is_file():
                payload = {'ok': False,
                           'message': 'The system check is not installed on this computer.'}
                self.result_ready.emit(self, payload)
                return
            # Writes /var/lib/sp-plus, which the advisor does not own.
            proc = subprocess.run([SUDO, '-n', TUNE],
                                  capture_output=True, text=True, timeout=300)
            healthy = proc.returncode == 0
            broken = proc.returncode == 10
            if not healthy and not broken:
                payload = {'ok': False,
                           'message': 'The check could not finish. Nothing on this computer was changed.'}
                self.result_ready.emit(self, payload)
                return

            summary = []
            try:
                for line in Path(MACHINE_DOC).read_text(errors='replace').splitlines():
                    if line.startswith('- '):
                        summary.append(line[2:].strip())
                    if len(summary) >= 6:
                        break
            except OSError:
                summary = []

            if broken:
                payload = {'ok': True, 'healthy': False,
                           'message': 'This computer can no longer receive updates. '
                                      'Nothing was changed. Show this to support.',
                           'summary': summary}
            else:
                payload = {'ok': True, 'healthy': True,
                           'message': 'Fin checked this computer and it is up to date. '
                                      'Nothing was changed.',
                           'summary': summary}
        except subprocess.TimeoutExpired:
            payload = {'ok': False,
                       'message': 'The check took too long and was stopped. Nothing was changed.'}
        except (OSError, subprocess.SubprocessError):
            payload = {'ok': False,
                       'message': 'The check could not run. Nothing on this computer was changed.'}
        self.result_ready.emit(self, payload)


class FinLaunchWorker(QThread):
    """Launch Fin through its installed desktop entry, never as a child of Welcome."""

    result_ready = Signal(object, object)

    def run(self):
        try:
            desktop_id = Path(FIN_DESKTOP).stem
            if not Path(FIN_DESKTOP).is_file():
                payload = {'ok': False, 'message': 'Fin is not installed on this computer.'}
            else:
                running = subprocess.run(
                    ['pgrep', '-f', '[/]usr/libexec/sp-plus/fin'],
                    capture_output=True, text=True, timeout=5)
                running_lines = [line for line in (running.stdout or '').splitlines()
                                 if 'pgrep' not in line]
                if running.returncode == 0 and running_lines:
                    payload = {'ok': True, 'reused': True,
                               'message': 'Fin is already open. Use that window.'}
                else:
                    subprocess.Popen([GTK_LAUNCH, desktop_id], stdin=subprocess.DEVNULL,
                                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                     start_new_session=True)
                    payload = {'ok': True, 'reused': False,
                               'message': 'Fin is open. If it asks, type /login and choose a provider.'}
        except (OSError, subprocess.SubprocessError):
            payload = {'ok': False, 'message': 'Fin could not be opened. Welcome is still available.'}
        self.result_ready.emit(self, payload)


class EmailLaunchWorker(QThread):
    """Create a local webmail launcher, then open the provider's own sign-in page."""

    result_ready = Signal(object, object)

    PROVIDERS = {
        'google': ('Google Workspace', 'https://mail.google.com/',
                   'spplus-email-google.desktop'),
        'microsoft': ('Microsoft 365', 'https://outlook.office.com/mail/',
                      'spplus-email-microsoft.desktop'),
    }

    def __init__(self, provider):
        super().__init__()
        self.provider = provider

    def run(self):
        details = self.PROVIDERS.get(self.provider)
        if not details:
            self.result_ready.emit(self, {
                'ok': False,
                'message': 'Ask your practice which webmail page to use. SP+ did not open anything.'})
            return
        name, url, desktop_name = details
        try:
            applications = EMAIL_DATA_HOME / 'applications'
            applications.mkdir(parents=True, exist_ok=True)
            launcher = applications / desktop_name
            launcher.write_text(
                '[Desktop Entry]\n'
                'Type=Application\n'
                f'Name=SP+ {name} email\n'
                f'Comment=Open {name} in your web browser\n'
                f'Exec=xdg-open {url}\n'
                'Icon=internet-mail\n'
                'Terminal=false\n'
                'Categories=Office;Network;\n', encoding='utf-8')
            launcher.chmod(0o644)
            subprocess.Popen([XDG_OPEN, url], stdin=subprocess.DEVNULL,
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                             start_new_session=True)
            self.result_ready.emit(self, {
                'ok': True,
                'message': f'{name} is open in your browser. SP+ did not handle or store your password.'})
        except (OSError, subprocess.SubprocessError):
            self.result_ready.emit(self, {
                'ok': False,
                'message': f'{name} could not be opened. No email password was requested or stored.'})


class ShareCheckWorker(QThread):
    """Check an SMB folder through GIO and let GVFS use KDE Wallet for saved credentials."""

    result_ready = Signal(object, object)

    def __init__(self, server, folder, username, password, save_securely):
        super().__init__()
        self.server = server
        self.folder = folder
        self.username = username
        self.password = password
        self.save_securely = save_securely

    def _message_for_error(self, error):
        text = str(error).lower()
        if any(word in text for word in ('host', 'network', 'connect', 'timed out', 'unreachable')):
            return 'The office server could not be found or reached. Check its name and your network connection.'
        if any(word in text for word in ('permission', 'authentication', 'credential', 'password', 'logon', 'denied')):
            return 'The server answered, but the username or password was not accepted.'
        if any(word in text for word in ('not found', 'no such', 'does not exist')):
            return 'The server was reached, but that shared folder was not found. Check the folder name.'
        return 'The folder could not be checked. Check the server, folder name and network connection.'

    def run(self):
        try:
            from gi.repository import Gio
            uri = f'smb://{quote(self.server, safe=".-_~")}/{quote(self.folder, safe=".-_~")}'
            location = Gio.File.new_for_uri(uri)
            operation = Gio.MountOperation()
            save_mode = Gio.PasswordSave.PERMANENTLY if self.save_securely else Gio.PasswordSave.NEVER
            operation.set_username(self.username)
            operation.set_password(self.password)
            operation.set_password_save(save_mode)

            def answer_password(op, _message, _default_user, _default_domain, _flags):
                op.set_username(self.username)
                op.set_password(self.password)
                op.set_password_save(save_mode)
                op.reply(Gio.MountOperationResult.HANDLED)

            operation.connect('ask-password', answer_password)
            mounted_before = None
            try:
                mounted_before = location.find_enclosing_mount(None)
            except Exception:
                pass
            mounted_here = mounted_before is None
            if mounted_here:
                location.mount_enclosing_volume(Gio.MountMountFlags.NONE, operation, None)
                mount = location.find_enclosing_mount(None)
            else:
                mount = mounted_before
            if mounted_here:
                try:
                    mount.unmount_with_operation(Gio.MountUnmountFlags.NONE, operation, None)
                except Exception as unmount_error:
                    self.result_ready.emit(self, {
                        'ok': False,
                        'message': 'The folder was reachable, but the temporary check mount could not be removed. Open Files to review it.'})
                    return
            self.result_ready.emit(self, {
                'ok': True,
                'message': 'The shared folder is reachable and the credentials worked. No permanent mount was left behind.'})
        except Exception as error:
            self.result_ready.emit(self, {'ok': False, 'message': self._message_for_error(error)})


class PrinterWorker(QThread):
    """Check CUPS, submit one test page, and wait for its CUPS job state."""

    result_ready = Signal(object, object)

    def run(self):
        try:
            import cups
            connection = cups.Connection()
            printers = connection.getPrinters()
            usable = []
            for name, info in printers.items():
                accepting = info.get('printer-is-accepting-jobs', True)
                state = int(info.get('printer-state', 3))
                if accepting and state != 5:
                    usable.append(name)
            if not usable:
                self.result_ready.emit(self, {
                    'ok': False,
                    'jobs': 0,
                    'message': 'CUPS is running, but no usable printer is configured yet. Open printer settings to add one.'})
                return
            default = connection.getDefault()
            printer = default if default in usable else sorted(usable)[0]
            job_id = connection.printFile(printer, CUPS_TEST_PAGE,
                                          'SP+ Welcome test page', {'job-sheets': 'none'})
            deadline = time.monotonic() + float(os.environ.get('SPPLUS_PRINT_TIMEOUT', '120'))
            while time.monotonic() < deadline:
                attributes = connection.getJobAttributes(job_id)
                state = int(attributes.get('job-state', 0))
                if state == 9:
                    self.result_ready.emit(self, {
                        'ok': True, 'jobs': 1, 'printer': printer, 'job_id': job_id,
                        'message': f'One test page was accepted by {printer}.'})
                    return
                if state in (6, 7, 8):
                    self.result_ready.emit(self, {
                        'ok': False, 'jobs': 1, 'printer': printer, 'job_id': job_id,
                        'message': 'The test page job failed in CUPS. No printed page is being claimed.'})
                    return
                time.sleep(1)
            self.result_ready.emit(self, {
                'ok': False, 'jobs': 1, 'printer': printer, 'job_id': job_id,
                'message': 'The test page is still in the CUPS queue. It was not reported as printed.'})
        except Exception:
            self.result_ready.emit(self, {
                'ok': False, 'jobs': 0,
                'message': 'CUPS could not be checked. The print service may not be running. No test page was submitted.'})


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
        self._tool_workers = set()
        self._store_workers = set()
        self._fin_workers = set()
        self._check_workers = set()
        self._email_workers = set()
        self._share_workers = set()
        self._printer_workers = set()
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
        elif parsed.path == 'install':
            app_id = (params.get('app') or [''])[0].strip()
            if FLATPAK_APP_ID.fullmatch(app_id):
                self.install_tool(app_id)
        elif parsed.path == 'browse-store':
            self.browse_store()
        elif parsed.path == 'check-computer':
            self.check_computer()
        elif parsed.path == 'launch-fin':
            self.launch_fin()
        elif parsed.path == 'connect-email':
            provider = (params.get('provider') or [''])[0].strip().lower()
            self.connect_email(provider)
        elif parsed.path == 'check-share':
            server = (params.get('server') or [''])[0].strip()
            folder = (params.get('folder') or [''])[0].strip()
            username = (params.get('username') or [''])[0].strip()
            save_securely = (params.get('save') or ['false'])[0].lower() == 'true'
            self.view.page().runJavaScript(
                "document.getElementById('share-password')?.value || ''",
                lambda password: self.check_share(server, folder, username,
                                                  password or '', save_securely))
        elif parsed.path == 'print-test':
            self.print_test()

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

    def check_computer(self):
        worker = ComputerCheckWorker()
        self._check_workers.add(worker)
        worker.result_ready.connect(self._check_finished)
        worker.finished.connect(worker.deleteLater)
        worker.start()

    @Slot(object, object)
    def _check_finished(self, worker, payload):
        self._check_workers.discard(worker)
        encoded = json.dumps(payload, ensure_ascii=True)
        self.view.page().runJavaScript(
            f'window.spWelcome && window.spWelcome.checkResult({encoded})')

    def launch_fin(self):
        worker = FinLaunchWorker()
        self._fin_workers.add(worker)
        worker.result_ready.connect(self._fin_finished)
        worker.finished.connect(worker.deleteLater)
        worker.start()

    @Slot(object, object)
    def _fin_finished(self, worker, payload):
        self._fin_workers.discard(worker)
        encoded = json.dumps(payload, ensure_ascii=True)
        self.view.page().runJavaScript(
            f'window.spWelcome && window.spWelcome.finResult({encoded})')

    def connect_email(self, provider):
        worker = EmailLaunchWorker(provider)
        self._email_workers.add(worker)
        worker.result_ready.connect(self._email_finished)
        worker.finished.connect(worker.deleteLater)
        worker.start()

    @Slot(object, object)
    def _email_finished(self, worker, payload):
        self._email_workers.discard(worker)
        encoded = json.dumps(payload, ensure_ascii=True)
        self.view.page().runJavaScript(
            f'window.spWelcome && window.spWelcome.emailResult({encoded})')

    def check_share(self, server, folder, username, password, save_securely):
        if not server or not folder or not username or not password:
            self.view.page().runJavaScript(
                "window.spWelcome && window.spWelcome.shareResult({ok:false,message:'Enter the server, folder, username and password first.'})")
            return
        worker = ShareCheckWorker(server, folder, username, password, save_securely)
        self._share_workers.add(worker)
        worker.result_ready.connect(self._share_finished)
        worker.finished.connect(worker.deleteLater)
        worker.start()

    @Slot(object, object)
    def _share_finished(self, worker, payload):
        self._share_workers.discard(worker)
        encoded = json.dumps(payload, ensure_ascii=True)
        self.view.page().runJavaScript(
            f'window.spWelcome && window.spWelcome.shareResult({encoded})')

    def print_test(self):
        worker = PrinterWorker()
        self._printer_workers.add(worker)
        worker.result_ready.connect(self._printer_finished)
        worker.finished.connect(worker.deleteLater)
        worker.start()

    @Slot(object, object)
    def _printer_finished(self, worker, payload):
        self._printer_workers.discard(worker)
        encoded = json.dumps(payload, ensure_ascii=True)
        self.view.page().runJavaScript(
            f'window.spWelcome && window.spWelcome.printerResult({encoded})')

    def install_tool(self, app_id):
        worker = FlatpakInstallWorker(app_id)
        self._tool_workers.add(worker)
        worker.result_ready.connect(self._tool_finished)
        worker.finished.connect(worker.deleteLater)
        worker.start()

    @Slot(object, object)
    def _tool_finished(self, worker, payload):
        self._tool_workers.discard(worker)
        encoded = json.dumps(payload, ensure_ascii=True)
        self.view.page().runJavaScript(
            f'window.spWelcome && window.spWelcome.toolResult({encoded})')

    def browse_store(self):
        worker = FlathubCheckWorker()
        self._store_workers.add(worker)
        worker.result_ready.connect(self._store_finished)
        worker.finished.connect(worker.deleteLater)
        worker.start()

    @Slot(object, object)
    def _store_finished(self, worker, payload):
        self._store_workers.discard(worker)
        if not payload.get('ok'):
            encoded = json.dumps(payload, ensure_ascii=True)
            self.view.page().runJavaScript(
                f'window.spWelcome && window.spWelcome.storeResult({encoded})')
            return
        try:
            subprocess.Popen([DISCOVER], stdin=subprocess.DEVNULL,
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                             start_new_session=True)
            payload = {'ok': True, 'message': 'Discover is open. Welcome stays available.'}
        except (OSError, subprocess.SubprocessError):
            payload = {
                'ok': False,
                'message': 'Discover could not be opened. Welcome is still available.',
            }
        encoded = json.dumps(payload, ensure_ascii=True)
        self.view.page().runJavaScript(
            f'window.spWelcome && window.spWelcome.storeResult({encoded})')

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

    def raise_and_focus(self):
        if self.isMinimized():
            self.showNormal()
        self.show()
        self.raise_()
        self.activateWindow()
        self.view.setFocus()

    def closeEvent(self, event):
        # QMainWindow.close() only hides this window by default. That left the
        # autostart process and its QWebEngine renderer resident after the
        # advisor closed Welcome. Closing the window is the end of this app.
        event.accept()
        self.view.stop()
        self.view.setUrl(QUrl('about:blank'))
        self.view.deleteLater()
        self.deleteLater()
        QTimer.singleShot(0, QApplication.quit)

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
    instance = SingleInstance()
    try:
        owns_instance = instance.acquire()
    except RuntimeError as exc:
        print(exc, file=sys.stderr)
        return 1
    if not owns_instance:
        return 0
    if args.reset_no_show:
        QSettings('Secure Prospective', 'SP+ Welcome').clear()
    window = WelcomeWindow(args.force or args.screenshots or args.self_test_close, args.screen, args.screenshots, args.help_depth)
    instance.activated.connect(window.raise_and_focus)
    window.single_instance = instance
    window.showMaximized()
    if args.self_test_close:
        QTimer.singleShot(1000, window.close)
    return app.exec()

if __name__ == '__main__':
    raise SystemExit(main())
