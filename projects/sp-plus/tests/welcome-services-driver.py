#!/usr/bin/env python3
"""Exercise welcome.py's service capability fetch against a controlled server.

WHY THIS EXISTS: the Office connection ("Your Services") had NO automated
coverage. --self-test drives five verbs and service-capabilities is not one of
them, so every claim about what an advisor sees when the portal is down, still
provisioning, or answering with something other than the contract rested on
reading the code.

This runs the REAL fetch_service_capability against a real socket. Nothing is
mocked: the fixture is an actual HTTP server, so redirects, truncated bodies,
oversized bodies, refused connections and stalled responses are produced the
way the network produces them.

Runs INSIDE the SP+ image (welcome.py imports PySide6), and binds only
127.0.0.1, so it needs no host network and no VM.
"""
import http.server, importlib.util, json, os, socket, ssl, sys, threading, time

WELCOME = os.environ.get('SPPLUS_WELCOME_PY', '/w/welcome/welcome.py')

spec = importlib.util.spec_from_file_location('welcome_under_test', WELCOME)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

# Keep the stalled-response case quick. These are the real module's knobs.
m.SERVICE_CONNECT_TIMEOUT = 2
m.SERVICE_TOTAL_TIMEOUT = 3

BIG = 'x' * (m.SERVICE_MAX_BODY + 64)

def body_ready(service):
    return json.dumps({'service': service, 'status': 'ready', 'platforms': [
        {'id': 'bluesky', 'label': 'Bluesky', 'state': 'live'}]})

ROUTES = {
    '/ready-files':      (200, json.dumps({'service': 'files', 'status': 'ready', 'platforms': []})),
    '/ready-social':     (200, body_ready('social')),
    '/provisioning':     (200, json.dumps({'service': 'files', 'status': 'provisioning', 'platforms': []})),
    '/unavailable':      (200, json.dumps({'service': 'files', 'status': 'unavailable', 'platforms': []})),
    '/notfound':         (404, 'nope'),
    '/servererror':      (500, 'boom'),
    '/notjson':          (200, '<html>this is the marketing page</html>'),
    '/wrongservice':     (200, json.dumps({'service': 'social', 'status': 'ready', 'platforms': []})),
    '/badstatus':        (200, json.dumps({'service': 'files', 'status': 'fine', 'platforms': []})),
    '/platformsnotlist': (200, json.dumps({'service': 'files', 'status': 'ready', 'platforms': {}})),
    '/platformdup':      (200, json.dumps({'service': 'social', 'status': 'ready', 'platforms': [
                              {'id': 'x', 'label': 'X', 'state': 'live'},
                              {'id': 'x', 'label': 'X again', 'state': 'live'}]})),
    '/oversize':         (200, BIG),
    '/notadict':         (200, json.dumps([1, 2, 3])),
}

class Quiet(http.server.ThreadingHTTPServer):
    # The oversize and stall cases make the client hang up mid-response on
    # purpose. That is the behaviour under test, not a fixture fault, so the
    # resulting ConnectionReset must not spray a traceback over the report.
    def handle_error(self, request, client_address):
        pass


class Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    def log_message(self, *a):  # keep the gate output readable
        pass
    def do_GET(self):
        if self.path == '/redirect':
            self.send_response(302)
            self.send_header('Location', 'https://example.invalid/marketing')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return
        if self.path == '/stall':
            time.sleep(10)          # longer than SERVICE_TOTAL_TIMEOUT above
            self.send_response(200)
            self.send_header('Content-Length', '2')
            self.end_headers()
            self.wfile.write(b'{}')
            return
        code, payload = ROUTES.get(self.path, (404, 'unknown route'))
        raw = payload.encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

srv = Quiet(('127.0.0.1', 0), Handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:%d' % srv.server_address[1]

# A port with nothing on it, for the refused-connection case.
_s = socket.socket(); _s.bind(('127.0.0.1', 0)); DEAD = _s.getsockname()[1]; _s.close()

ENV = {'files': 'SPPLUS_CAPABILITY_FILES_URL', 'social': 'SPPLUS_CAPABILITY_SOCIAL_URL'}

# service, url, then the fields that must match exactly.
CASES = [
    ('a portal that is ready',            'files',  BASE + '/ready-files',      dict(ok=True,  valid=True,  status='ready',       failure='',          http_status=200)),
    ('social ready, one platform',        'social', BASE + '/ready-social',     dict(ok=True,  valid=True,  status='ready',       failure='',          http_status=200)),
    ('still being provisioned',           'files',  BASE + '/provisioning',     dict(ok=False, valid=True,  status='provisioning',failure='',          http_status=200)),
    ('declared unavailable',              'files',  BASE + '/unavailable',      dict(ok=False, valid=True,  status='unavailable', failure='',          http_status=200)),
    ('404 from the endpoint',             'files',  BASE + '/notfound',         dict(ok=False, valid=False, status='unavailable', failure='http',      http_status=404)),
    ('500 from the endpoint',             'files',  BASE + '/servererror',      dict(ok=False, valid=False, status='unavailable', failure='http',      http_status=500)),
    ('redirect is NOT followed',          'files',  BASE + '/redirect',         dict(ok=False, valid=False, status='unavailable', failure='http',      http_status=302)),
    ('HTML instead of the record',        'files',  BASE + '/notjson',          dict(ok=False, valid=False, status='unavailable', failure='malformed', http_status=200)),
    ('record names the wrong service',    'files',  BASE + '/wrongservice',     dict(ok=False, valid=False, status='unavailable', failure='malformed', http_status=200)),
    ('status outside the contract',       'files',  BASE + '/badstatus',        dict(ok=False, valid=False, status='unavailable', failure='malformed', http_status=200)),
    ('platforms is not a list',           'files',  BASE + '/platformsnotlist', dict(ok=False, valid=False, status='unavailable', failure='malformed', http_status=200)),
    ('duplicate platform id',             'social', BASE + '/platformdup',      dict(ok=False, valid=False, status='unavailable', failure='malformed', http_status=200)),
    ('body larger than the ceiling',      'files',  BASE + '/oversize',         dict(ok=False, valid=False, status='unavailable', failure='malformed', http_status=200)),
    ('payload is a list, not an object',  'files',  BASE + '/notadict',         dict(ok=False, valid=False, status='unavailable', failure='malformed', http_status=200)),
    ('connection refused',                'files',  'http://127.0.0.1:%d/x' % DEAD,
                                                                                dict(ok=False, valid=False, status='unavailable', failure='network',   http_status=None)),
    ('server never answers',              'files',  BASE + '/stall',            dict(ok=False, valid=False, status='unavailable', failure='network',   http_status=None)),
    ('endpoint is not http(s)',           'files',  'file:///etc/passwd',       dict(ok=False, valid=False, status='unavailable', failure='malformed', http_status=None)),
    ('endpoint carries credentials',      'files',  'http://u:p@127.0.0.1/x',   dict(ok=False, valid=False, status='unavailable', failure='malformed', http_status=None)),
]

def compare(got, want):
    return [f'{k}={got.get(k)!r} (wanted {v!r})' for k, v in want.items() if got.get(k) != v]

# The comparison itself is gated. A gate whose assertions cannot fail is the
# failure mode this whole exercise is about, so prove the comparator detects a
# mismatch before trusting any PASS it reports.
if compare({'ok': True}, {'ok': False}) == []:
    print('SELF-CHECK FAIL: the comparator does not detect a mismatch'); sys.exit(2)
if compare({'ok': False}, {'ok': False}) != []:
    print('SELF-CHECK FAIL: the comparator reports a false mismatch'); sys.exit(2)

print('=== SP+ WELCOME SERVICES GATE ===')
print('  module under test: %s' % m.__file__)
print('  fixture: %s   dead port: %d' % (BASE, DEAD))
print()

failed = 0
rows = []
for name, service, url, want in CASES:
    os.environ[ENV[service]] = url
    started = time.monotonic()
    try:
        got = m.fetch_service_capability(service)
    except Exception as exc:                       # a raise is always a failure
        got = {'raised': f'{type(exc).__name__}: {exc}'}
    elapsed = time.monotonic() - started
    diffs = compare(got, want) if 'raised' not in got else [got['raised']]
    rows.append((name, elapsed, diffs))
    if diffs:
        failed += 1
    print('  %-4s %-36s %6.2fs %s' % ('FAIL' if diffs else 'PASS', name, elapsed,
                                      '; '.join(diffs) if diffs else ''))
    os.environ.pop(ENV[service], None)

# Every case must actually have run the code; a silent zero-case run passes
# vacuously otherwise.
if len(rows) != len(CASES) or len(CASES) < 15:
    print('\nSELF-CHECK FAIL: expected at least 15 cases, ran %d' % len(rows)); sys.exit(2)

print()
print('  %d passed, %d failed, %d cases' % (len(CASES) - failed, failed, len(CASES)))
srv.shutdown()
sys.exit(1 if failed else 0)
