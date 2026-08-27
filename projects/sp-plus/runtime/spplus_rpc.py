#!/usr/bin/env python3
"""Narrow SP+ POC RPC boundary and local PWA server.

This service intentionally exposes a small allowlisted operation set. It is not a
shell bridge and it does not accept arbitrary commands, paths, or file contents.
"""
from __future__ import annotations

import hashlib
import json
import os
import platform
import subprocess
import time
import urllib.error
import urllib.request
import uuid
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

ROOT = Path(os.environ.get("SPPLUS_ROOT", Path(__file__).resolve().parents[1]))
PWA_ROOT = ROOT / "pwa"
KNOWLEDGE_ROOT = ROOT / "knowledge"
PLAYBOOK_PATH = ROOT / "playbooks" / "printer-reconnect.json"
PLAYBOOK_DIGEST_PATH = ROOT / "playbooks" / "printer-reconnect.json.sha256"
STATE_DIR = Path(os.environ.get("SPPLUS_STATE_DIR", "/var/lib/sp-plus"))
STATE_PATH = STATE_DIR / "printer-fixture.json"
EVENTS_PATH = STATE_DIR / "events.jsonl"
AI_ENDPOINT = os.environ.get("SPPLUS_AI_ENDPOINT", "").strip()
FIXTURE = os.environ.get("SPPLUS_PRINTER_FIXTURE", "1").lower() not in {"0", "false", "no"}


def now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def ensure_state() -> dict[str, Any]:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    if not STATE_PATH.exists():
        state = {"printer_name": "Advisor Test Printer", "state": "offline", "test_page": False}
        STATE_PATH.write_text(json.dumps(state) + "\n", encoding="utf-8")
    return json.loads(STATE_PATH.read_text(encoding="utf-8"))


def save_state(state: dict[str, Any]) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, sort_keys=True) + "\n", encoding="utf-8")


def event(kind: str, details: dict[str, Any]) -> dict[str, Any]:
    record = {"id": str(uuid.uuid4()), "timestamp": now(), "kind": kind, "details": details}
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    with EVENTS_PATH.open("a", encoding="utf-8") as stream:
        stream.write(json.dumps(record, sort_keys=True) + "\n")
    return record


def read_events() -> list[dict[str, Any]]:
    if not EVENTS_PATH.exists():
        return []
    records: list[dict[str, Any]] = []
    for line in EVENTS_PATH.read_text(encoding="utf-8").splitlines():
        try:
            records.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return records[-100:]


def command_status(command: list[str]) -> str:
    """Return only a fixed status, never command output."""
    try:
        result = subprocess.run(command, check=False, capture_output=True, timeout=3)
        return "active" if result.returncode == 0 else "inactive"
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return "unknown"


def sanitized_snapshot() -> dict[str, Any]:
    state = ensure_state()
    printer_state = state["state"] if FIXTURE else "unknown"
    return {
        "os": {"kernel": platform.release(), "architecture": platform.machine()},
        "print_service": {"name": "cups", "state": command_status(["systemctl", "is-active", "cups"])},
        "printer": {
            "name": "Advisor Test Printer" if FIXTURE else "redacted",
            "state": printer_state,
            "error_code": "IPP_PRINTER_NOT_CONNECTED" if printer_state == "offline" else None,
        },
    }


def playbook_digest() -> str:
    return hashlib.sha256(PLAYBOOK_PATH.read_bytes()).hexdigest()


def verify_playbook() -> tuple[bool, str]:
    digest = playbook_digest()
    if not PLAYBOOK_DIGEST_PATH.exists():
        return False, "trust manifest missing"
    expected = PLAYBOOK_DIGEST_PATH.read_text(encoding="utf-8").split()[0]
    return digest == expected, digest


def deterministic_diagnosis(snapshot: dict[str, Any]) -> dict[str, Any]:
    return {
        "summary": "The test printer is offline. Reconnect it, then verify with a test page.",
        "confidence": "test-fixture",
        "next_action": "Reconnect the printer fixture",
        "sanitized_request": snapshot,
        "provider": "deterministic-test-provider",
    }


def cloud_diagnosis(snapshot: dict[str, Any]) -> dict[str, Any]:
    payload = {"kind": "printer-diagnosis", "snapshot": snapshot}
    if not AI_ENDPOINT:
        return deterministic_diagnosis(snapshot)
    request = urllib.request.Request(
        AI_ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            decoded = json.loads(response.read(64 * 1024).decode("utf-8"))
        return {
            "summary": str(decoded.get("summary", "The printer needs attention."))[:500],
            "confidence": str(decoded.get("confidence", "provider"))[:40],
            "next_action": str(decoded.get("next_action", "Review the suggested action."))[:200],
            "sanitized_request": snapshot,
            "provider": "configured-provider",
        }
    except (urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError):
        result = deterministic_diagnosis(snapshot)
        result["provider"] = "deterministic-fallback"
        return result


def report() -> dict[str, Any]:
    return {
        "report_type": "security-evidence-poc",
        "generated_at": now(),
        "encryption": {"status": "not-read-by-poc-runtime", "note": "OS-level evidence is a later adapter."},
        "secure_boot": {"status": "not-read-by-poc-runtime", "note": "OS-level evidence is a later adapter."},
        "events": read_events(),
        "playbook": {"id": "printer-reconnect", "sha256": playbook_digest()},
        "redaction": {"status": "enforced", "raw_paths": False, "credentials": False, "client_data": False},
    }


# --- approval registry -------------------------------------------------------
# run_remediation used to accept ANY non-empty approval_id: the check was
# `if not approval_id: raise`, a presence test, not an authenticity test. So
# {"approval_id": "x"} ran the playbook without a user ever having approved it,
# which defeats the point of having an approval step. Found by probing the
# running service on 2026-08-27.
#
# Approvals are now single-use and expiring. They live in memory on purpose:
# an approval must not survive a restart of the service, because the human who
# granted it is not necessarily still sitting there.
APPROVAL_TTL_SECONDS = 600
_ISSUED_APPROVALS: dict[str, float] = {}


def issue_approval() -> str:
    approval_id = str(uuid.uuid4())
    _ISSUED_APPROVALS[approval_id] = time.time()
    return approval_id


def consume_approval(approval_id: str) -> None:
    """Spend an approval, or refuse. Raises ValueError with a reason."""
    if not approval_id:
        raise ValueError("explicit approval is required")
    granted_at = _ISSUED_APPROVALS.pop(approval_id, None)
    if granted_at is None:
        raise ValueError("that approval is not recognised")
    if time.time() - granted_at > APPROVAL_TTL_SECONDS:
        raise ValueError("that approval has expired")


def rpc(method: str, params: dict[str, Any]) -> dict[str, Any]:
    if method == "health":
        return {"ok": True, "service": "sp-plus-rpc", "fixture": FIXTURE}
    if method == "get_printer_state":
        return {"snapshot": sanitized_snapshot()}
    if method == "diagnose_printer":
        snapshot = sanitized_snapshot()
        diagnosis = cloud_diagnosis(snapshot)
        event("diagnosis_requested", {"provider": diagnosis["provider"], "snapshot": snapshot})
        return diagnosis
    if method == "approve_remediation":
        approval_id = issue_approval()
        event("remediation_approved", {"approval_id": approval_id, "playbook": "printer-reconnect"})
        return {"approval_id": approval_id, "playbook": "printer-reconnect"}
    if method == "run_remediation":
        approval_id = str(params.get("approval_id", ""))
        try:
            consume_approval(approval_id)
        except ValueError:
            event("remediation_blocked", {"reason": "approval not recognised"})
            raise
        trusted, digest = verify_playbook()
        if not trusted:
            event("remediation_blocked", {"reason": "playbook integrity check failed", "sha256": digest})
            raise ValueError("playbook integrity check failed")
        state = ensure_state()
        if FIXTURE:
            state.update({"state": "online", "test_page": False})
            save_state(state)
        event("remediation_completed", {"approval_id": approval_id, "playbook": "printer-reconnect", "sha256": digest})
        return {"ok": True, "message": "Printer reconnected. Verify with a test page.", "sha256": digest}
    if method == "verify_printer":
        state = ensure_state()
        verified = bool(FIXTURE and state["state"] == "online")
        if verified:
            state["test_page"] = True
            save_state(state)
        event("printer_verified", {"verified": verified, "test_page": verified})
        return {"verified": verified, "test_page": verified}
    if method == "report":
        return report()
    raise ValueError("method is not allowlisted")


class Handler(BaseHTTPRequestHandler):
    server_version = "SPPlus/0.1"

    def log_message(self, _format: str, *_args: Any) -> None:
        return

    def send_json(self, payload: dict[str, Any], status: int = HTTPStatus.OK) -> None:
        encoded = json.dumps(payload, sort_keys=True).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/api/health":
            self.send_json(rpc("health", {}))
            return
        if self.path == "/api/knowledge/printer":
            content = (KNOWLEDGE_ROOT / "advisor-help" / "printer.md").read_text(encoding="utf-8")
            self.send_json({"title": "Printer help", "markdown": content})
            return
        if self.path == "/api/report":
            self.send_json(report())
            return
        relative = self.path.split("?", 1)[0].lstrip("/") or "index.html"
        if relative not in {"index.html", "app.js", "styles.css", "manifest.webmanifest"}:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        path = PWA_ROOT / relative
        if not path.exists():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        content_types = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webmanifest": "application/manifest+json"}
        data = path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_types.get(path.suffix, "application/octet-stream"))
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/api/rpc":
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 64 * 1024:
                raise ValueError("invalid request size")
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            result = rpc(str(body.get("method", "")), body.get("params", {}))
            self.send_json({"ok": True, "result": result})
        except (ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
            self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)


def main() -> None:
    host = os.environ.get("SPPLUS_LISTEN_ADDRESS", "127.0.0.1")
    port = int(os.environ.get("SPPLUS_LISTEN_PORT", "8765"))
    ensure_state()
    ThreadingHTTPServer((host, port), Handler).serve_forever()


if __name__ == "__main__":
    main()
