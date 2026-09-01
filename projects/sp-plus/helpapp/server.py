#!/usr/bin/env python3
"""SP+ Help: a local server for the pinned help application.

WHY A SERVER AND NOT A FILE

The help app is a real installable web app, and the two things that make it
one only exist on an http origin. A service worker cannot register on
file://, so without a server there is no offline cache, and an advisor who
opens Help precisely because the network is broken gets nothing. A web app
manifest is likewise ignored. Pointing a browser at a file:// path would
give a page, not an application.

WHY A USER SERVICE AND NOT THE SYSTEM ONE

sp-plus.service already serves the proof-of-concept PWA, but it runs as the
`spplus` system user with ProtectHome=true. Fin is per-advisor: it holds
their provider login and their session. Asking a locked-down system account
to answer "what did Fin say" would either fail or answer as the wrong
person. This runs as the advisor, in their session, and dies with it.

It listens on loopback only. An advisor's laptop sits on client and hotel
networks, and nothing here should be reachable from any of them.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(os.environ.get("SPPLUS_HELP_ROOT", Path(__file__).resolve().parent))
APP_ROOT = ROOT / "app"
HELP_DATA = Path(os.environ.get(
    "SPPLUS_HELP_DATA", "/usr/libexec/sp-plus/welcome/app/help-data.json"))
HELP_CORE = Path(os.environ.get(
    "SPPLUS_HELP_CORE", "/usr/libexec/sp-plus/welcome/app/help-core.js"))
FIN = os.environ.get("SPPLUS_FIN", "/usr/libexec/sp-plus/fin")
ASK_TIMEOUT = int(os.environ.get("SPPLUS_HELP_ASK_TIMEOUT", "120"))

# Served by name, never by joining a request path onto a directory. A help
# viewer has no reason to reach any other file, and a static allowlist cannot
# be walked out of.
STATIC = {
    "index.html": "text/html; charset=utf-8",
    "app.js": "text/javascript; charset=utf-8",
    "styles.css": "text/css; charset=utf-8",
    "manifest.webmanifest": "application/manifest+json",
    "sw.js": "text/javascript; charset=utf-8",
    "icon.svg": "image/svg+xml",
}


def ask_fin(question: str) -> dict:
    """Put the advisor's question to Fin and return a display-safe result."""
    question = (question or "").strip()
    if not question:
        return {"ok": False, "answer": "", "reason": "No question was asked."}
    if len(question) > 500:
        return {"ok": False, "answer": "",
                "reason": "That question is longer than Fin accepts."}
    try:
        done = subprocess.run([FIN, "--ask", question], capture_output=True,
                              text=True, timeout=ASK_TIMEOUT)
    except subprocess.TimeoutExpired:
        return {"ok": False, "answer": "",
                "reason": "Fin took too long to answer this time."}
    except OSError:
        return {"ok": False, "answer": "",
                "reason": "Fin is not available on this computer yet."}
    answer = (done.stdout or "").strip()
    if done.returncode == 0 and answer:
        return {"ok": True, "answer": answer, "reason": ""}
    if done.returncode != 0:
        reason = f"Fin stopped before it could answer (exit code {done.returncode})."
        if answer == "Fin is not connected yet.":
            reason = answer
        return {"ok": False, "answer": "", "reason": reason}
    return {"ok": False, "answer": "", "reason": "Fin did not return an answer."}


class Handler(BaseHTTPRequestHandler):
    server_version = "SPPlusHelp/1.0"

    def log_message(self, _format, *_args):
        return

    def send_json(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def send_file(self, path: Path, content_type: str, cache: str):
        try:
            data = path.read_bytes()
        except OSError:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", cache)
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):  # noqa: N802
        path = self.path.split("?", 1)[0]
        if path in ("/", ""):
            path = "/index.html"
        # The corpus and the shared logic are served from the ONE copy that
        # Welcome uses. Shipping a second copy here would let the pinned help
        # and the in-Welcome help drift into disagreeing about the manual.
        if path == "/help-data.json":
            self.send_file(HELP_DATA, "application/json; charset=utf-8", "no-cache")
            return
        if path == "/help-core.js":
            self.send_file(HELP_CORE, "text/javascript; charset=utf-8", "no-cache")
            return
        name = path.lstrip("/")
        if name not in STATIC:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        self.send_file(APP_ROOT / name, STATIC[name], "no-cache")

    def do_POST(self):  # noqa: N802
        if self.path != "/api/ask":
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 8 * 1024:
                raise ValueError("invalid request size")
            body = json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, json.JSONDecodeError):
            self.send_json({"ok": False, "answer": "",
                            "reason": "That question could not be read."},
                           HTTPStatus.BAD_REQUEST)
            return
        self.send_json(ask_fin(str(body.get("question", ""))))


def main() -> int:
    host = os.environ.get("SPPLUS_HELP_ADDRESS", "127.0.0.1")
    port = int(os.environ.get("SPPLUS_HELP_PORT", "8766"))
    if host not in ("127.0.0.1", "::1", "localhost"):
        print("SP+ Help refuses to listen off loopback", file=sys.stderr)
        return 2
    ThreadingHTTPServer((host, port), Handler).serve_forever()
    return 0


if __name__ == "__main__":
    sys.exit(main())
