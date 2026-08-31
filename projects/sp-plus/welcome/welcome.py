#!/usr/bin/env python3
"""SP+ Welcome: a native QWebEngineView shell for the local HTML application."""
from __future__ import annotations
import argparse
import sys
from pathlib import Path
import datetime as dt
import http.client
import json
import os
import re
import socket
import ssl
import subprocess
import time
import uuid
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
THEME_EVENT_LOG = os.environ.get(
    'SPPLUS_THEME_EVENT_LOG',
    str(Path(os.environ.get('XDG_STATE_HOME',
                            str(Path.home() / '.local' / 'state'))) /
        'sp-plus' / 'theme-events.jsonl'))
THEME_JOURNAL = os.environ.get('SPPLUS_JOURNAL_COMMAND', '/usr/bin/systemd-cat')
THEME_APPLY_TIMEOUT = float(os.environ.get('SPPLUS_THEME_APPLY_TIMEOUT', '600'))

# Workers that were still running when the application quit and did not stop
# inside the shutdown drain. Destroying a running QThread aborts the process,
# so such a thread is parked here instead: the reference lives as long as the
# interpreter, the thread finishes on its own, and the process exits cleanly.
# This list should stay empty in practice; a non-empty one is a worker that
# outran its own timeout and is worth investigating.
_PARKED_WORKERS = []
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
SELFTEST_SHARE_UP = os.environ.get('SPPLUS_SELFTEST_SHARE_UP', '127.0.0.1')
SELFTEST_SHARE_DOWN = os.environ.get('SPPLUS_SELFTEST_SHARE_DOWN', '203.0.113.1')
MACHINE_DOC = os.environ.get('SPPLUS_MACHINE_DOC', '/var/lib/sp-plus/THIS-MACHINE.md')
SERVICE_ENDPOINTS = {
    'files': 'https://cloud.secureprospective.com/.well-known/sppl',
    'social': 'https://social.secureprospective.com/.well-known/sppl',
}
SERVICE_URLS = {
    'files': 'https://cloud.secureprospective.com',
    'social': 'https://social.secureprospective.com',
}
# These overrides exist for local test fixtures only. Production defaults above
# remain public hostnames and are never replaced by a LAN fallback.
SERVICE_ENDPOINT_ENV = {
    'files': 'SPPLUS_CAPABILITY_FILES_URL',
    'social': 'SPPLUS_CAPABILITY_SOCIAL_URL',
}
SERVICE_CONNECT_TIMEOUT = 10
SERVICE_TOTAL_TIMEOUT = 15
SERVICE_MAX_BODY = 1024 * 1024
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


class CapabilityShapeError(ValueError):
    """The response was not the small, explicit service contract."""


def capability_endpoint(service):
    env_name = SERVICE_ENDPOINT_ENV.get(service)
    if not env_name:
        return ''
    return os.environ.get(env_name, SERVICE_ENDPOINTS[service])


def capability_result(service, status='unavailable', platforms=None,
                      http_status=None, failure='', valid=False):
    return {
        'ok': bool(valid and status == 'ready'),
        'valid': valid,
        'service': service,
        'status': status,
        'platforms': platforms or [],
        'http_status': http_status,
        'failure': failure,
    }


def validate_capability(service, payload):
    if not isinstance(payload, dict) or payload.get('service') != service:
        raise CapabilityShapeError('service field')
    status = payload.get('status')
    if status not in {'ready', 'provisioning', 'unavailable'}:
        raise CapabilityShapeError('status field')
    raw_platforms = payload.get('platforms')
    if not isinstance(raw_platforms, list):
        raise CapabilityShapeError('platforms field')
    platforms = []
    seen = set()
    for item in raw_platforms:
        if not isinstance(item, dict):
            raise CapabilityShapeError('platform entry')
        platform_id = item.get('id')
        label = item.get('label')
        state = item.get('state')
        if (not isinstance(platform_id, str) or not platform_id.strip() or
                not isinstance(label, str) or not label.strip() or
                state not in {'live', 'pending_review'} or
                platform_id in seen):
            raise CapabilityShapeError('platform entry fields')
        seen.add(platform_id)
        platforms.append({'id': platform_id, 'label': label, 'state': state})
    return status, platforms


def fetch_service_capability(service):
    """Fetch one setup record without following redirects or blocking the UI.

    The socket gets a ten-second connect/read ceiling and the whole transaction
    gets a fifteen-second monotonic deadline. A non-200 response is terminal:
    the social host intentionally redirects unknown paths to HTML, which must
    never be mistaken for a JSON setup record.
    """
    if service not in SERVICE_ENDPOINTS:
        return capability_result(service, failure='malformed')
    endpoint = capability_endpoint(service)
    connection = None
    http_status = None
    deadline = time.monotonic() + SERVICE_TOTAL_TIMEOUT
    try:
        parsed = urlparse(endpoint)
        if (parsed.scheme not in {'http', 'https'} or not parsed.hostname or
                parsed.username or parsed.password or parsed.fragment):
            raise CapabilityShapeError('endpoint')
        port = parsed.port
        if parsed.scheme == 'https':
            connection = http.client.HTTPSConnection(
                parsed.hostname, port or 443,
                timeout=SERVICE_CONNECT_TIMEOUT,
                context=ssl.create_default_context())
        else:
            connection = http.client.HTTPConnection(
                parsed.hostname, port or 80, timeout=SERVICE_CONNECT_TIMEOUT)
        # HTTPConnection does not follow redirects. Calling connect explicitly
        # keeps the connect budget separate from the remaining total budget.
        connection.connect()
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError('capability connect exceeded total deadline')
        if connection.sock is not None:
            connection.sock.settimeout(min(SERVICE_CONNECT_TIMEOUT, remaining))
        target = parsed.path or '/'
        if parsed.query:
            target += '?' + parsed.query
        connection.request('GET', target, headers={
            'Accept': 'application/json',
            'User-Agent': 'SP-plus-Welcome-capability-check',
        })
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError('capability request exceeded total deadline')
        if connection.sock is not None:
            connection.sock.settimeout(remaining)
        response = connection.getresponse()
        http_status = response.status
        # Do not read a redirect body. The status itself is the evidence that
        # this was not the declared JSON endpoint, and no redirect is followed.
        if http_status != 200:
            return capability_result(service, http_status=http_status,
                                     failure='http')
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError('capability response exceeded total deadline')
        if connection.sock is not None:
            connection.sock.settimeout(remaining)
        body = response.read(SERVICE_MAX_BODY + 1)
        if len(body) > SERVICE_MAX_BODY:
            raise CapabilityShapeError('response too large')
        payload = json.loads(body.decode('utf-8'))
        status, platforms = validate_capability(service, payload)
        return capability_result(service, status, platforms, http_status=200,
                                 valid=True)
    except (socket.timeout, TimeoutError):
        return capability_result(service, http_status=http_status,
                                 failure='network')
    except CapabilityShapeError:
        return capability_result(service, http_status=http_status,
                                 failure='malformed')
    except (UnicodeError, ValueError, json.JSONDecodeError):
        return capability_result(service, http_status=http_status,
                                 failure='malformed')
    except (OSError, http.client.HTTPException):
        return capability_result(service, http_status=http_status,
                                 failure='network')
    except Exception:
        return capability_result(service, http_status=http_status,
                                 failure='network')
    finally:
        if connection is not None:
            connection.close()


class ServiceCapabilityWorker(QThread):
    """Check one public service without holding up the Welcome window."""

    result_ready = Signal(object, object)

    def __init__(self, service):
        super().__init__()
        self.service = service

    def run(self):
        payload = fetch_service_capability(self.service)
        self.result_ready.emit(self, payload)


class ThemeEventFailure(RuntimeError):
    """Welcome could not record the required apply event in both sinks."""


def emit_theme_event(correlation_id, event, stage, **fields):
    record = {
        'event': event,
        'stage': stage,
        'correlation_id': correlation_id,
        'utc': dt.datetime.now(dt.timezone.utc).isoformat(),
        'monotonic_ns': time.monotonic_ns(),
    }
    record.update(fields)
    line = json.dumps(record, sort_keys=True, ensure_ascii=True,
                      separators=(',', ':'))
    path = Path(THEME_EVENT_LOG).expanduser()
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.touch(mode=0o600, exist_ok=True)
        os.chmod(path, 0o600)
        with path.open('a', encoding='utf-8') as stream:
            stream.write(line + '\n')
            stream.flush()
            os.fsync(stream.fileno())
    except OSError as exc:
        raise ThemeEventFailure(f'could not append {path}: {exc}') from exc
    try:
        subprocess.run([THEME_JOURNAL, '--identifier=spplus-theme',
                        '--priority=info'], input=line + '\n', text=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
                       check=True, timeout=10)
    except subprocess.TimeoutExpired as exc:
        raise ThemeEventFailure('journald event command timed out') from exc
    except (OSError, subprocess.SubprocessError) as exc:
        raise ThemeEventFailure(f'could not write journald event: {exc}') from exc


def theme_success_verdict(correlation_id):
    path = Path(THEME_EVENT_LOG).expanduser()
    try:
        lines = path.read_text(encoding='utf-8').splitlines()
    except (OSError, UnicodeError):
        return False
    for line in reversed(lines):
        try:
            record = json.loads(line)
        except (TypeError, ValueError):
            continue
        if (record.get('correlation_id') == correlation_id and
                record.get('event') == 'verdict'):
            return record.get('result') == 'success'
    return False


class ThemeApplyWorker(QThread):
    """Apply a theme away from Qt's UI thread and require the helper verdict."""

    result_ready = Signal(object, object)

    def __init__(self, theme_id, reset_layout, correlation_id):
        super().__init__()
        self.theme_id = theme_id
        self.reset_layout = reset_layout
        self.correlation_id = correlation_id

    @staticmethod
    def _summary(stdout, stderr):
        lines = [line.strip() for line in (stdout or '').splitlines() if line.strip()]
        if not lines:
            lines = [line.strip() for line in (stderr or '').splitlines() if line.strip()]
        return lines[-1] if lines else ''

    def _payload(self, ok, detail):
        return {
            'ok': ok,
            'detail': detail,
            'theme': self.theme_id,
            'layout': self.reset_layout,
            'correlation_id': self.correlation_id,
        }

    def run(self):
        layout_arg = '--layout' if self.reset_layout else '--no-layout'
        env = os.environ.copy()
        env['SPPLUS_CORRELATION_ID'] = self.correlation_id
        env['SPPLUS_THEME_EVENT_LOG'] = THEME_EVENT_LOG
        try:
            result = subprocess.run(
                [APPLY_THEME, self.theme_id, layout_arg],
                capture_output=True,
                text=True,
                timeout=THEME_APPLY_TIMEOUT,
                check=True,
                env=env,
            )
            if theme_success_verdict(self.correlation_id):
                payload = self._payload(True, self._summary(result.stdout, result.stderr))
            else:
                payload = self._payload(
                    False,
                    'The theme helper exited successfully without a success readback verdict.',
                )
        except subprocess.TimeoutExpired:
            payload = self._payload(False, 'Theme apply reached its time limit and was rolled back.')
        except subprocess.CalledProcessError as exc:
            payload = self._payload(False, self._summary(exc.stdout, exc.stderr) or
                                    f'Theme apply failed with exit code {exc.returncode}.')
        except (OSError, subprocess.SubprocessError) as exc:
            payload = self._payload(False, f'Theme apply could not be started: {exc}')
        except Exception as exc:
            payload = self._payload(False, f'Theme apply failed: {type(exc).__name__}: {exc}')
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

    # Left-hand column of the table rows in THIS-MACHINE.md worth showing an
    # advisor, in the order they should appear.
    DOC_FIELDS = ('Image', 'Layered packages', 'Memory', 'Root disk',
                  'Wi-Fi interface', 'Power management')

    @classmethod
    def _summarise_machine_doc(cls, text):
        """Pull advisor-readable facts out of THIS-MACHINE.md.

        DN-41. The previous version harvested every line beginning "- ", which
        in practice matched only the engineering caveats under "## Notes" --
        and, because those are hard-wrapped, produced sentences chopped off
        mid-clause ("... and its actual effect are not the same thing. KDE").
        The advisor saw two truncated warnings and none of the actual state.
        The facts live in the "## Update health" heading and in the tables, so
        that is what this reads.
        """
        summary = []
        health = re.search(r'^##\s+Update health\s*[-\u2013\u2014]+\s*(.+?)\s*$',
                           text, re.MULTILINE)
        if health:
            state = health.group(1).strip()
            summary.append('Updates: %s'
                           % ('working' if state.upper() == 'OK' else state))

        rows = {}
        for line in text.splitlines():
            if not line.startswith('|'):
                continue
            cells = [c.strip() for c in line.strip().strip('|').split('|')]
            if len(cells) >= 2 and cells[0] and cells[0] not in ('Field', '---'):
                rows.setdefault(cells[0], cells[1])

        for key in cls.DOC_FIELDS:
            if len(summary) >= 6:
                break
            value = rows.get(key)
            if value and value not in ('-', '\u2014'):
                summary.append('%s: %s' % (key, value))
        return summary

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

            try:
                summary = self._summarise_machine_doc(
                    Path(MACHINE_DOC).read_text(errors='replace'))
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

    # Sentinel distinguishing "the operation never came back" from "it failed".
    TIMED_OUT = object()
    PROBE_TIMEOUT = float(os.environ.get('SPPLUS_SHARE_PROBE_TIMEOUT', '4'))
    MOUNT_TIMEOUT = int(os.environ.get('SPPLUS_SHARE_MOUNT_TIMEOUT', '25'))

    def _reachable(self, host, port=445):
        """Is the SMB port actually answering? A measurement, not a guess."""
        try:
            with socket.create_connection((host, port), timeout=self.PROBE_TIMEOUT):
                return True
        except OSError:
            return False

    def _await_async(self, start, finish):
        """Run one async GIO call to completion and return its error, or None.

        GIO async calls dispatch on a GMainContext. This worker is a QThread, so
        it pushes its OWN context as thread-default rather than driving the
        default one, which belongs to the main thread and must not be run here.
        Returns None on success, TIMED_OUT if it never came back, else GLib.Error.
        """
        from gi.repository import GLib
        ctx = GLib.MainContext.new()
        ctx.push_thread_default()
        try:
            loop = GLib.MainLoop.new(ctx, False)
            box = {}

            def done(source, result):
                try:
                    finish(result)
                except Exception as exc:            # noqa: BLE001 - reported, not raised
                    box['error'] = exc
                finally:
                    loop.quit()

            def bail():
                box['error'] = self.TIMED_OUT
                loop.quit()
                return False

            GLib.timeout_add_seconds(self.MOUNT_TIMEOUT, bail)
            start(done)
            loop.run()
            return box.get('error')
        finally:
            ctx.pop_thread_default()

    @staticmethod
    def _gerror_is(error, *codes):
        """Match a GLib.Error by TYPED code, not by English words."""
        try:
            from gi.repository import Gio, GLib
            if not isinstance(error, GLib.Error):
                return False
            return any(error.matches(Gio.io_error_quark(), c) for c in codes)
        except Exception:
            return False

    def _already_mounted(self, error):
        try:
            from gi.repository import Gio
            return self._gerror_is(error, Gio.IOErrorEnum.ALREADY_MOUNTED)
        except Exception:
            return False

    def _message_for_gerror(self, error):
        """Typed first. Substring matching is a fallback, not the mechanism.

        The old code classified only by matching English words in the error
        text, which is fragile to GIO wording and breaks entirely under
        translation.
        """
        try:
            from gi.repository import Gio
            E = Gio.IOErrorEnum
            if self._gerror_is(error, E.HOST_NOT_FOUND, E.HOST_UNREACHABLE,
                               E.NETWORK_UNREACHABLE, E.CONNECTION_REFUSED,
                               E.TIMED_OUT):
                return ('The office server could not be reached. Check its name '
                        'and your network connection.')
            if self._gerror_is(error, E.PERMISSION_DENIED):
                return 'The server answered, but the username or password was not accepted.'
            if self._gerror_is(error, E.NOT_FOUND):
                return ('The server was reached, but that shared folder was not '
                        'found. Check the folder name.')
            if self._gerror_is(error, E.FAILED_HANDLED):
                return 'The sign-in was cancelled, so the folder was not checked.'
        except Exception:
            pass
        return self._message_for_error(error)

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
        # DN-39. The previous implementation called mount_enclosing_volume as if
        # it were synchronous. It is ASYNC: it takes a callback, returns
        # immediately, and its outcome is read with mount_enclosing_volume_finish.
        # So nothing ever waited for the mount, execution fell through to
        # find_enclosing_mount, and its "not mounted" error was substring-matched
        # into "that shared folder was not found". A live host and an unroutable
        # one produced the SAME sentence -- verified on the Dell against
        # 203.0.113.1 (TEST-NET-3). An advisor whose server was down was told to
        # check the folder name.
        if not self.server or not self.folder:
            self.result_ready.emit(self, {
                'ok': False,
                'message': 'Enter the server and folder name first.'})
            return

        # Decide reachability BEFORE any GIO error-string classification, so
        # "cannot reach the server" is a measurement and not a guess at wording.
        if not self._reachable(self.server):
            self.result_ready.emit(self, {
                'ok': False,
                'message': f'{self.server} could not be reached on the network. '
                           'Check the server name and that you are connected to '
                           'the office network.'})
            return
        try:
            from gi.repository import Gio, GLib
            uri = f'smb://{quote(self.server, safe=".-_~")}/{quote(self.folder, safe=".-_~")}'
            location = Gio.File.new_for_uri(uri)
            operation = Gio.MountOperation()
            save_mode = Gio.PasswordSave.PERMANENTLY if self.save_securely else Gio.PasswordSave.NEVER
            operation.set_username(self.username)
            operation.set_password(self.password)
            operation.set_password_save(save_mode)

            # DN-41. GVFS re-emits ask-password on every authentication failure.
            # Replying HANDLED with the same credentials each time is an infinite
            # retry loop: the mount never settles, _await_async hits
            # MOUNT_TIMEOUT, and the advisor is told the server "did not answer
            # in time" when the truth is that their password was wrong. Answer
            # once; ABORT the re-ask so a real GError propagates instead.
            # Verified on the Dell 2026-08-30: GVFS itself answers in under a
            # second ("Anonymous access denied"), so a timeout here was never
            # the server being slow -- it was always us looping.
            auth = {'asks': 0}

            def answer_password(op, _message, _default_user, _default_domain, _flags):
                auth['asks'] += 1
                if auth['asks'] > 1:
                    op.reply(Gio.MountOperationResult.ABORTED)
                    return
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
                err = self._await_async(
                    lambda cb: location.mount_enclosing_volume(
                        Gio.MountMountFlags.NONE, operation, None, cb),
                    location.mount_enclosing_volume_finish)
                if err is self.TIMED_OUT:
                    self.result_ready.emit(self, {
                        'ok': False,
                        'message': 'The server did not answer in time. It may be '
                                   'busy or blocked by a firewall.'})
                    return
                if err is not None and not self._already_mounted(err):
                    # A second ask-password means the credentials we supplied
                    # were rejected; we aborted, so GIO reports FAILED_HANDLED,
                    # which _message_for_gerror would read as "the advisor
                    # cancelled". They did not -- the password was refused.
                    if auth['asks'] > 1 and self._gerror_is(
                            err, Gio.IOErrorEnum.FAILED_HANDLED):
                        message = ('The server answered, but the username or '
                                   'password was not accepted.')
                    else:
                        message = self._message_for_gerror(err)
                    self.result_ready.emit(self, {'ok': False, 'message': message})
                    return
                try:
                    mount = location.find_enclosing_mount(None)
                except Exception:
                    mount = None
            else:
                mount = mounted_before

            left_behind = False
            if mounted_here and mount is not None:
                err = self._await_async(
                    lambda cb: mount.unmount_with_operation(
                        Gio.MountUnmountFlags.NONE, operation, None, cb),
                    mount.unmount_with_operation_finish)
                left_behind = err is not None

            if left_behind:
                self.result_ready.emit(self, {
                    'ok': True,
                    'message': 'The shared folder is reachable and the credentials '
                               'worked, but the temporary check mount could not be '
                               'removed. Open Files to review it.'})
                return
            self.result_ready.emit(self, {
                'ok': True,
                'message': 'The shared folder is reachable and the credentials worked. '
                           'No permanent mount was left behind.'})
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
        self._theme_workers = set()
        self._service_workers = set()
        self._service_cache = {}
        view.titleChanged.connect(self.on_title)

    def _worker_sets(self):
        return (self._ask_workers, self._tool_workers, self._store_workers,
                self._fin_workers, self._check_workers, self._email_workers,
                self._share_workers, self._printer_workers, self._theme_workers,
                self._service_workers)

    @Slot()
    def shutdown(self):
        """Let every running worker finish before the interpreter tears down.

        Every worker here is a QThread owned by this bridge. When the
        application quits, Python drops the bridge and its worker sets; a
        QThread object destroyed while its thread is still running makes Qt
        abort the process with

            QThread: Destroyed while thread '' is still running

        followed by SIGABRT. That is the crash seen after a theme apply: the
        apply restarts plasmashell, the shell teardown can close the Welcome
        window mid-apply, and QApplication.quit() then races the running
        ThemeApplyWorker. The race is real but narrow, which is why it appears
        intermittently rather than on every apply.

        The workers wrap subprocesses that carry their own time limits, so
        there is nothing to interrupt -- the correct move is to wait for them.
        Each is given a bound slightly past the longest worker time limit. A
        thread that somehow outlasts even that is parked at module scope rather
        than destroyed, because leaking one thread object is a correct program
        that exits, and destroying it is not.
        """
        bound_ms = int((THEME_APPLY_TIMEOUT + 30) * 1000)
        for workers in self._worker_sets():
            for worker in list(workers):
                if not worker.isRunning():
                    continue
                if not worker.wait(bound_ms):
                    _PARKED_WORKERS.append(worker)
            workers.clear()

    def on_title(self, title):
        if not title.startswith(self.PREFIX):
            return
        parsed = urlparse(title[len(self.PREFIX):])
        params = parse_qs(parsed.query)
        if parsed.path == 'service-capabilities':
            service = (params.get('service') or [''])[0].strip().lower()
            retry = (params.get('retry') or ['0'])[0] == '1'
            self.request_service_capability(service, retry)
        elif parsed.path == 'open-service':
            service = (params.get('service') or [''])[0].strip().lower()
            action = (params.get('action') or ['browser'])[0].strip().lower()
            platform = (params.get('platform') or [''])[0].strip().lower()
            self.open_service(service, action, platform)
        elif parsed.path == 'apply-theme':
            theme = (params.get('theme') or [''])[0].strip()
            layout_value = (params.get('layout') or [''])[0].strip()
            if theme and layout_value in {'0', '1'}:
                correlation_id = uuid.uuid4().hex
                try:
                    # This is intentionally the first line for a Welcome click.
                    # The helper inherits the same correlation ID and appends its
                    # command/readback/verdict events to the same two sinks.
                    emit_theme_event(
                        correlation_id,
                        'click_receipt',
                        'request',
                        theme=theme,
                        layout_requested=layout_value == '1',
                        source='welcome',
                    )
                except ThemeEventFailure as exc:
                    self._send_theme_result({
                        'ok': False,
                        'detail': f'Apply was not started because it could not be logged: {exc}',
                        'theme': theme,
                        'layout': layout_value == '1',
                        'correlation_id': correlation_id,
                    })
                else:
                    self.apply_theme(theme, layout_value == '1', correlation_id)
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

    def _send_service_result(self, payload):
        encoded = json.dumps(payload, ensure_ascii=True)
        self.view.page().runJavaScript(
            f'window.spWelcome && window.spWelcome.serviceResult({encoded})')

    def request_service_capability(self, service, retry=False):
        if service not in SERVICE_ENDPOINTS:
            return
        if retry:
            self._service_cache.pop(service, None)
        elif service in self._service_cache:
            self._send_service_result(self._service_cache[service])
            return
        if any(worker.service == service for worker in self._service_workers):
            return
        worker = ServiceCapabilityWorker(service)
        self._service_workers.add(worker)
        worker.result_ready.connect(self._service_finished)
        worker.finished.connect(worker.deleteLater)
        worker.start()

    @Slot(object, object)
    def _service_finished(self, worker, payload):
        self._service_workers.discard(worker)
        self._service_cache[worker.service] = payload
        self._send_service_result(payload)

    def open_service(self, service, action, platform=''):
        actions = {'browser', 'connect-platform', 'calendar'}
        if service not in SERVICE_URLS or action not in actions:
            self._send_service_open_result({
                'ok': False,
                'service': service,
                'action': action,
                'platform': platform,
                'message': 'That service action is not available. Welcome stayed open.',
            })
            return
        try:
            subprocess.Popen([XDG_OPEN, SERVICE_URLS[service]],
                             stdin=subprocess.DEVNULL,
                             stdout=subprocess.DEVNULL,
                             stderr=subprocess.DEVNULL,
                             start_new_session=True)
            message = ('Browser launch requested for the SecureProspective File Portal.'
                       if service == 'files' else
                       'Browser launch requested for SecureProspective Social.')
            payload = {
                'ok': True,
                'service': service,
                'action': action,
                'platform': platform,
                'message': message,
            }
        except (OSError, subprocess.SubprocessError):
            payload = {
                'ok': False,
                'service': service,
                'action': action,
                'platform': platform,
                'message': 'The browser could not be opened. Welcome stayed open.',
            }
        self._send_service_open_result(payload)

    def _send_service_open_result(self, payload):
        encoded = json.dumps(payload, ensure_ascii=True)
        self.view.page().runJavaScript(
            f'window.spWelcome && window.spWelcome.serviceOpenResult({encoded})')

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

    def _send_theme_result(self, payload):
        encoded = json.dumps(payload, ensure_ascii=True)
        self.view.page().runJavaScript(
            f'window.spWelcome && window.spWelcome.themeApplied({encoded})')

    def apply_theme(self, theme_id, reset_layout, correlation_id):
        if self._theme_workers:
            detail = 'Another theme apply is already running. Keep the current preview open and wait for its result.'
            try:
                emit_theme_event(
                    correlation_id,
                    'apply_rejected_busy',
                    'request',
                    theme=theme_id,
                    layout_requested=reset_layout,
                    reason='one apply worker at a time',
                )
            except ThemeEventFailure as exc:
                detail = f'{detail} Event logging also failed: {exc}'
            self._send_theme_result({
                'ok': False,
                'detail': detail,
                'theme': theme_id,
                'layout': reset_layout,
                'correlation_id': correlation_id,
            })
            return
        worker = ThemeApplyWorker(theme_id, reset_layout, correlation_id)
        self._theme_workers.add(worker)
        worker.result_ready.connect(self._theme_finished)
        worker.finished.connect(worker.deleteLater)
        try:
            worker.start()
        except RuntimeError as exc:
            self._theme_workers.discard(worker)
            self._send_theme_result({
                'ok': False,
                'detail': f'Theme apply worker could not start: {exc}',
                'theme': theme_id,
                'layout': reset_layout,
                'correlation_id': correlation_id,
            })

    @Slot(object, object)
    def _theme_finished(self, worker, payload):
        self._theme_workers.discard(worker)
        # Report what the helper actually proved; the page never assumes the
        # click worked from a process exit code alone.
        self._send_theme_result(payload)


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
            self.view.page().runJavaScript(f'window.spWelcome.go({max(0, min(8, self.screen - 1))})')
        if self.help_depth:
            QTimer.singleShot(900, lambda: self.view.page().runJavaScript(f'window.spWelcome.helpDepth({self.help_depth})'))

    def close_if_opted_out(self, value):
        if value == 'true':
            self.close()

    def capture_next(self):
        self._capture_index = 0
        self._capture_screen()

    def _capture_screen(self):
        if self._capture_index >= 9:
            QApplication.quit()
            return
        self.view.page().runJavaScript(f'window.spWelcome.go({self._capture_index})')
        QTimer.singleShot(250, self._grab_current)

    def _grab_current(self):
        # DN-37. This used to be ROOT/'screenshots', i.e. inside
        # /usr/libexec/sp-plus/welcome/. /usr is READ-ONLY on an image-mode
        # system, so capture mode raised
        #   OSError: [Errno 30] Read-only file system
        # on every real installation and only ever worked in a dev checkout.
        # Found 2026-08-29 on the Dell, where it blocked the rendering QC.
        #
        # Note this grabs the WIDGET (self.view.grab()), not the screen, so it
        # needs no Wayland screen-capture protocol -- which is what makes
        # rendering QC automatable on Plasma at all (grim reports
        # "compositor doesn't support the screen capture protocol" here).
        out = Path(os.environ.get('SPPLUS_CAPTURE_DIR', '/tmp/spcaps'))
        out.mkdir(parents=True, exist_ok=True)
        self.view.grab().save(str(out / f'html-screen-{self._capture_index + 1:02d}.png'))
        self._capture_index += 1
        QTimer.singleShot(100, self._capture_screen)

# ---------------------------------------------------------------------------
# HEADLESS SELF-TEST (DN-38)
#
# WHY THIS EXISTS. Four separate QC dispatches tried to drive this page through
# the live Wayland session over ssh and produced twenty-four UNVERIFIED results
# and no findings. The wall was identical every time: you cannot reliably script
# a QtWebEngine window through someone else's compositor from a remote shell.
#
# So the app tests itself. This drives the SAME bridge verbs the page triggers,
# through the SAME handlers, and reports the SAME payloads the page would render
# -- it does not reimplement them, which would test a copy instead of the thing.
#
# It deliberately does NOT run verbs that spawn a GUI application or mutate the
# advisor's desktop (launch-fin, browse-store, connect-email, install,
# apply-theme). Those are reported as REQUIRES-HUMAN rather than silently
# skipped, because a QC report that hides what it did not test is worse than one
# that admits it.
class SelfTest(QObject):
    """Drive the bridge verbs in-process and report what the page would show."""

    # Verbs whose result is computable without spawning a window or changing
    # the running desktop.
    SAFE = ('check-computer', 'check-share-reachable', 'check-share-unreachable',
            'print-test')

    # What a CORRECT machine reports. An error path is SUPPOSED to return
    # ok:false -- calling that a failed test would make the report lie.
    # None means "no expectation; print it and let a human judge".
    EXPECT = {'check-computer': True, 'check-share-reachable': False,
              'check-share-unreachable': False, 'print-test': None,
              'ask': True}

    # DN-41. check-share-reachable deliberately supplies a fake password, so it
    # can NEVER return ok:true -- the old expectation of True was unsatisfiable
    # and the test could only ever fail. What it actually proves is that a
    # REACHABLE server produces a credentials verdict rather than a network
    # one. Both cases return ok:false, so ok alone cannot tell them apart; the
    # message is the only thing that distinguishes a working path from the
    # timeout bug this test was written to catch.
    EXPECT_MESSAGE = {
        'check-share-reachable': ('was not accepted', 'was not found'),
        'check-share-unreachable': ('could not be reached',),
    }
    # Real verbs, deliberately not automated. Named so the report is honest.
    REQUIRES_HUMAN = {
        'apply-theme': 'changes the live desktop appearance',
        'launch-fin': 'opens the Fin window',
        'browse-store': 'opens Discover',
        'connect-email': 'opens a browser window',
        'install': 'installs software system-wide',
    }

    def __init__(self, window, include_ask=False, timeout_ms=300000):
        super().__init__()
        # The verbs live on the BRIDGE, not the window. Drive the same object
        # the page drives, so this tests the shipped path and not a copy.
        self.window, self.include_ask = window.bridge, include_ask
        self.timeout_ms = timeout_ms
        self.results, self._queue, self._current = [], [], None
        self._page = window.view.page()
        self._real_run_js = self._page.runJavaScript
        self._page.runJavaScript = self._intercept
        self._timer = QTimer(self)
        self._timer.setSingleShot(True)
        self._timer.timeout.connect(self._timed_out)

    # The handlers report by calling window.spWelcome.<name>(<json>). Capture
    # that instead of executing it; everything else still runs for real.
    def _intercept(self, js, *rest):
        m = re.search(r'window\.spWelcome\.(\w+)\((.*)\)$', (js or '').strip(), re.S)
        if m:
            try:
                payload = json.loads(m.group(2))
            except (ValueError, TypeError):
                # Some handlers emit a JS object literal -- {ok:false,message:'x'}
                # with unquoted keys and single quotes -- which is not JSON, so
                # json.loads would drop the advisor-visible message on the floor.
                blob = m.group(2)
                payload = {'raw': blob,
                           'ok': bool(re.search(r'\bok\s*:\s*true\b', blob))}
                mo = re.search(r"message\s*:\s*'((?:[^'\\]|\\.)*)'", blob)
                if mo:
                    payload['message'] = mo.group(1)
            self._record(m.group(1), payload)
            return
        # check_share reads the password field out of the DOM before running.
        # There is no DOM here, so answer the callback with an empty string --
        # the credential path is a human test, not this one.
        if rest and callable(rest[0]):
            rest[0]('')
            return
        return None

    def _record(self, sink, payload):
        if self._current is None:
            return
        self._timer.stop()
        ok = bool(payload.get('ok'))
        expect = self.EXPECT.get(self._current)
        verdict = 'REPORTED' if expect is None else ('PASS' if ok == expect else 'FAIL')
        wanted = self.EXPECT_MESSAGE.get(self._current)
        if verdict == 'PASS' and wanted:
            message = str(payload.get('message', ''))
            if not any(w in message for w in wanted):
                verdict = 'FAIL'
                payload = dict(payload, selftest_note='ok matched, but the message '
                               'was not one of: %s' % '; '.join(wanted))
        self.results.append({'verb': self._current, 'sink': sink, 'ok': ok,
                             'expected_ok': expect, 'verdict': verdict,
                             'payload': payload})
        self._current = None
        QTimer.singleShot(50, self._next)

    def _timed_out(self):
        if self._current is None:
            return
        self.results.append({'verb': self._current, 'sink': None, 'ok': False,
                             'verdict': 'FAIL',
                             'payload': {'message': 'TIMED OUT -- no result was '
                                                    'reported to the page'}})
        self._current = None
        QTimer.singleShot(50, self._next)

    def run(self):
        self._queue = list(self.SAFE) + (['ask'] if self.include_ask else [])
        QTimer.singleShot(1200, self._next)

    def _next(self):
        if not self._queue:
            self._report()
            return
        verb = self._queue.pop(0)
        self._current = verb
        self._timer.start(self.timeout_ms)
        w = self.window
        try:
            if verb == 'check-computer':
                w.check_computer()
            elif verb == 'print-test':
                w.print_test()
            elif verb == 'check-share-reachable':
                # Placeholder password, never a real one: this tests whether a
                # reachable host is correctly reported as a CREDENTIAL problem
                # rather than a network one. See EXPECT_MESSAGE.
                w.check_share(SELFTEST_SHARE_UP, 'Shared', 'tester',
                              'selftest-not-a-real-password', False)
            elif verb == 'check-share-unreachable':
                w.check_share(SELFTEST_SHARE_DOWN, 'Shared', 'tester',
                              'selftest-not-a-real-password', False)
            elif verb == 'ask':
                w.ask('what is 1847 + 2965')
        except Exception as exc:                     # noqa: BLE001 - report, never crash the run
            self._timer.stop()
            self.results.append({'verb': verb, 'sink': None, 'ok': False, 'verdict': 'FAIL',
                                 'payload': {'message': f'RAISED {type(exc).__name__}: {exc}'}})
            self._current = None
            QTimer.singleShot(50, self._next)

    def _report(self):
        self._page.runJavaScript = self._real_run_js
        out = ['# SP+ Welcome headless self-test (DN-38)', '',
               '| Verb | Result | Advisor-visible message |', '|---|---|---|']
        for r in self.results:
            msg = str(r['payload'].get('message', '')).replace('|', '\\|')[:160]
            out.append(f"| {r['verb']} | {r.get('verdict', 'FAIL')} | {msg} |")
        for verb, why in sorted(self.REQUIRES_HUMAN.items()):
            out.append(f'| {verb} | REQUIRES-HUMAN | not automated: {why} |')
        out += ['', '## Full payloads', '```json',
                json.dumps(self.results, indent=2, ensure_ascii=True), '```']
        print('\n'.join(out), flush=True)
        failed = sum(1 for r in self.results if r.get('verdict') == 'FAIL')
        QApplication.instance().exit(1 if failed else 0)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--screen', type=int, default=1, help='screen number 1-9')
    parser.add_argument('--screenshots', action='store_true')
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--reset-no-show', action='store_true')
    parser.add_argument('--self-test', action='store_true',
                        help='drive the bridge verbs headlessly and print a QC report')
    parser.add_argument('--self-test-ask', action='store_true',
                        help='include the ask verb in --self-test (calls Fin; slow)')
    parser.add_argument('--self-test-close', action='store_true', help=argparse.SUPPRESS)
    parser.add_argument('--help-depth', type=int, choices=(1, 2), default=0, help='capture Everyday work or its LibreOffice article')
    args = parser.parse_args()
    app = QApplication(sys.argv)
    app.setApplicationName('SP+ Welcome')
    # The self-test is a QC harness, not a second copy of the app for the
    # advisor, so it does NOT contend for the single-instance socket. That lock
    # is exactly what blocked four consecutive QC dispatches: a Welcome already
    # running for the logged-in user made every controlled run impossible.
    instance = None
    if not args.self_test:
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
    window = WelcomeWindow(args.force or args.screenshots or args.self_test_close or args.self_test,
                           args.screen, args.screenshots, args.help_depth)
    if instance is not None:
        instance.activated.connect(window.raise_and_focus)
        window.single_instance = instance
    # Drain workers on every quit route -- the window's own closeEvent, the
    # capture path, and a quit that arrives from the session -- rather than on
    # any single one of them.
    app.aboutToQuit.connect(window.bridge.shutdown)
    window.showMaximized()
    if args.self_test_close:
        QTimer.singleShot(1000, window.close)
    if args.self_test:
        tester = SelfTest(window, include_ask=args.self_test_ask)
        window._self_test = tester
        tester.run()
    return app.exec()

if __name__ == '__main__':
    raise SystemExit(main())
