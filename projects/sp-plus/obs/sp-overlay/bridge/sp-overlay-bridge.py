#!/usr/bin/env python3
"""Localhost bridge between OBS and the SP+ overlay page.

The page never talks to obs-websocket itself. The bridge holds the socket, so
the websocket password stays out of the browser source URL, out of the page,
and out of these logs. The page gets a read-only view over HTTP:

    GET /             -> the overlay page (docroot is served as static files)
    GET /state        -> one JSON snapshot, for a cold start
    GET /events       -> SSE stream, one `data:` line per state change

Serving over HTTP rather than file:// is deliberate: a file origin is opaque,
which breaks ES modules and fetch inside CEF.

Everything runs on one asyncio loop. There is no thread and no lock: the OBS
client, the HTTP server and the runtime-state poller are all coroutines that
mutate the same STATE dict, and broadcast only when the serialized payload
actually changes.

Run:  python3 sp-overlay-bridge.py [--port 59536] [--docroot ../]
"""
import argparse
import asyncio
import base64
import hashlib
import json
import mimetypes
import os
import sys
import time
import traceback
import urllib.parse
from datetime import datetime, timezone

import websockets

OBS_CONFIG = os.path.expanduser(
    "~/.var/app/com.obsproject.Studio/config/obs-studio/"
    "plugin_config/obs-websocket/config.json"
)

# Config(2) + Scenes(4) + Outputs(64). General is not needed; the bridge
# publishes no general-category state.
EVENT_SUBSCRIPTIONS = 70

RECONNECT_DELAYS = [0.25, 0.5, 1.0, 2.0, 4.0, 8.0, 10.0]

# Freshness ceilings, seconds. Anything older is reported as unknown rather
# than displayed as current -- a stale chapter number on screen is worse than
# no chapter number.
MAX_AGE_STATE = 10.0
MAX_AGE_COUNTDOWN = 10.0
MAX_AGE_SIGNAL = 30.0

POLL_INTERVAL = 1.0

SCHEMA_VERSION = 1


def log(msg):
    print("[bridge] %s %s" % (datetime.now().strftime("%H:%M:%S"), msg),
          flush=True)


# --------------------------------------------------------------------------
# state


class State:
    """The whole publishable world. Serialized to JSON for /state and /events."""

    def __init__(self):
        self.obs_connected = False
        self.scene = None
        self.record = None            # {"active": bool, "state": str}
        self.stream = None
        self.collection_changing = False
        self.runtime = None           # parsed runtime JSON
        self.runtime_read_at = 0.0
        self.subscribers = set()
        self._last_payload = None

    # -- OBS side ---------------------------------------------------------

    def obs_down(self):
        """A closed socket means every OBS-derived value is unknown, not stale."""
        self.obs_connected = False
        self.scene = None
        self.record = None
        self.stream = None

    # -- payload ----------------------------------------------------------

    def payload(self):
        now = time.time()
        rt = self.runtime
        fresh = rt is not None and (now - self.runtime_read_at) <= MAX_AGE_STATE

        def aged(node, ceiling):
            """Signal nodes carry their own observedAt and expire separately."""
            if not fresh or not isinstance(node, dict):
                return {"signal": "unknown", "note": None}
            seen = _parse_iso(node.get("observedAt"))
            if seen is None or (now - seen) > ceiling:
                return {"signal": "unknown", "note": node.get("note")}
            return {"signal": node.get("signal", "unknown"),
                    "note": node.get("note")}

        countdown = None
        if fresh and isinstance(rt.get("countdownTarget"), str):
            target = _parse_iso(rt["countdownTarget"])
            if target is not None:
                countdown = {"target": rt["countdownTarget"],
                             "secondsRemaining": max(0, int(target - now))}

        live = self.obs_connected and not self.collection_changing

        return {
            "schema": SCHEMA_VERSION,
            "obsConnected": live,
            "scene": self.scene if live else None,
            "record": self.record if live else None,
            "stream": self.stream if live else None,
            "chapter": (rt or {}).get("chapter") if fresh else None,
            "topic": (rt or {}).get("topic") if fresh else None,
            "countdown": countdown,
            "guest": aged((rt or {}).get("guest"), MAX_AGE_SIGNAL),
            "camera": aged((rt or {}).get("camera"), MAX_AGE_SIGNAL),
        }

    def broadcast_if_changed(self):
        body = json.dumps(self.payload(), separators=(",", ":"),
                          sort_keys=True)
        if body == self._last_payload:
            return
        self._last_payload = body
        frame = ("data: %s\n\n" % body).encode("utf-8")
        for q in list(self.subscribers):
            try:
                q.put_nowait(frame)
            except asyncio.QueueFull:
                # A page that cannot keep up with 1 Hz is wedged. Drop it and
                # let its own SSE backoff reconnect into a fresh snapshot.
                self.subscribers.discard(q)


def _parse_iso(text):
    """ISO-8601 -> epoch seconds, or None. Accepts a trailing Z."""
    if not isinstance(text, str):
        return None
    try:
        dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.timestamp()


STATE = State()


# --------------------------------------------------------------------------
# obs-websocket v5 client


def _obs_creds():
    with open(OBS_CONFIG) as fh:
        cfg = json.load(fh)
    return cfg.get("server_port", 4455), cfg.get("server_password", "")


def _auth_string(password, salt, challenge):
    secret = base64.b64encode(
        hashlib.sha256((password + salt).encode("utf-8")).digest()).decode()
    return base64.b64encode(
        hashlib.sha256((secret + challenge).encode("utf-8")).digest()).decode()


class ObsClient:
    def __init__(self):
        self.port, self._password = _obs_creds()
        self.ws = None
        self._rid = 0
        self._pending = {}

    async def _identify(self):
        hello = json.loads(await self.ws.recv())          # op 0
        ident = {"op": 1, "d": {"rpcVersion": 1,
                                "eventSubscriptions": EVENT_SUBSCRIPTIONS}}
        auth = hello.get("d", {}).get("authentication")
        if auth:
            ident["d"]["authentication"] = _auth_string(
                self._password, auth["salt"], auth["challenge"])
        await self.ws.send(json.dumps(ident))
        got = json.loads(await self.ws.recv())            # op 2
        if got.get("op") != 2:
            raise RuntimeError("identify rejected: op %s" % got.get("op"))

    async def call(self, request_type, data=None):
        self._rid += 1
        rid = "r%d" % self._rid
        fut = asyncio.get_running_loop().create_future()
        self._pending[rid] = fut
        await self.ws.send(json.dumps({
            "op": 6,
            "d": {"requestType": request_type, "requestId": rid,
                  "requestData": data or {}},
        }))
        return await asyncio.wait_for(fut, timeout=10)

    async def snapshot(self):
        """Three requests that must ALL succeed before anything goes on screen."""
        scene = await self.call("GetCurrentProgramScene")
        rec = await self.call("GetRecordStatus")
        stream = await self.call("GetStreamStatus")
        STATE.scene = scene.get("sceneName") or scene.get("currentProgramSceneName")
        STATE.record = {"active": bool(rec.get("outputActive")),
                        "state": "OBS_WEBSOCKET_OUTPUT_STARTED"
                                 if rec.get("outputActive") else
                                 "OBS_WEBSOCKET_OUTPUT_STOPPED"}
        STATE.stream = {"active": bool(stream.get("outputActive")),
                        "state": "OBS_WEBSOCKET_OUTPUT_STARTED"
                                 if stream.get("outputActive") else
                                 "OBS_WEBSOCKET_OUTPUT_STOPPED"}
        STATE.collection_changing = False
        STATE.obs_connected = True

    def _on_event(self, d):
        kind = d.get("eventType")
        data = d.get("eventData") or {}
        if kind == "CurrentProgramSceneChanged":
            STATE.scene = data.get("sceneName")
        elif kind == "RecordStateChanged":
            STATE.record = {"active": bool(data.get("outputActive")),
                            "state": data.get("outputState")}
        elif kind == "StreamStateChanged":
            STATE.stream = {"active": bool(data.get("outputActive")),
                            "state": data.get("outputState")}
        elif kind == "CurrentSceneCollectionChanging":
            # Scene names are about to be meaningless. Suppress live labels
            # until a fresh snapshot lands.
            STATE.collection_changing = True
        elif kind == "CurrentSceneCollectionChanged":
            asyncio.create_task(self._resnapshot())

    async def _resnapshot(self):
        try:
            await self.snapshot()
        except Exception as exc:
            log("re-snapshot failed: %s" % exc)
        STATE.broadcast_if_changed()

    async def _read_loop(self):
        async for raw in self.ws:
            msg = json.loads(raw)
            op = msg.get("op")
            if op == 5:
                self._on_event(msg["d"])
                STATE.broadcast_if_changed()
            elif op == 7:
                d = msg["d"]
                fut = self._pending.pop(d.get("requestId"), None)
                if fut and not fut.done():
                    status = d.get("requestStatus") or {}
                    if status.get("result"):
                        fut.set_result(d.get("responseData") or {})
                    else:
                        fut.set_exception(RuntimeError(
                            "%s: %s" % (status.get("code"),
                                        status.get("comment"))))

    async def run_once(self):
        async with websockets.connect(
                "ws://127.0.0.1:%d" % self.port,
                subprotocols=["obswebsocket.json"],
                max_size=4 * 1024 * 1024) as ws:
            self.ws = ws
            await self._identify()
            # The reader must be running before the snapshot is requested:
            # snapshot() awaits futures that only the reader can resolve.
            reader = asyncio.create_task(self._read_loop())
            try:
                await self.snapshot()
                log("connected to OBS on %d, snapshot complete" % self.port)
                STATE.broadcast_if_changed()
                await reader
            finally:
                reader.cancel()

    async def run_forever(self):
        attempt = 0
        while True:
            try:
                await self.run_once()
                attempt = 0
            except Exception as exc:
                # Never let the exception text carry credentials.
                log("OBS link down (%s), retrying" % type(exc).__name__)
            finally:
                self.ws = None
                for fut in self._pending.values():
                    if not fut.done():
                        fut.cancel()
                self._pending.clear()
                STATE.obs_down()
                STATE.broadcast_if_changed()
            delay = RECONNECT_DELAYS[min(attempt, len(RECONNECT_DELAYS) - 1)]
            attempt += 1
            await asyncio.sleep(delay)


# --------------------------------------------------------------------------
# runtime state file


async def poll_runtime(path):
    """Re-read the producer's JSON, and re-evaluate freshness every tick.

    The freshness tick matters as much as the file read: a value going stale is
    a state change that no file write announces.
    """
    last_mtime = None
    while True:
        try:
            mtime = os.path.getmtime(path)
            if mtime != last_mtime:
                with open(path) as fh:
                    doc = json.load(fh)
                if doc.get("schema") != SCHEMA_VERSION:
                    log("runtime state schema %r ignored" % doc.get("schema"))
                else:
                    STATE.runtime = doc
                    STATE.runtime_read_at = time.time()
                last_mtime = mtime
        except FileNotFoundError:
            pass
        except (OSError, ValueError) as exc:
            log("runtime state unreadable: %s" % exc)
        STATE.broadcast_if_changed()
        await asyncio.sleep(POLL_INTERVAL)


# --------------------------------------------------------------------------
# HTTP + SSE


def _resolve(docroot, url_path):
    """Map a URL path to a file inside docroot, or None if it escapes."""
    clean = urllib.parse.unquote(url_path.split("?", 1)[0])
    if clean.endswith("/"):
        clean += "index.html"
    target = os.path.realpath(os.path.join(docroot, clean.lstrip("/")))
    if target != docroot and not target.startswith(docroot + os.sep):
        return None
    return target if os.path.isfile(target) else None


HEADERS = ("HTTP/1.1 %s\r\n"
           "Cache-Control: no-store\r\n"
           "Connection: close\r\n"
           "Content-Type: %s\r\n"
           "Content-Length: %d\r\n\r\n")


async def _send(writer, status, ctype, body):
    writer.write((HEADERS % (status, ctype, len(body))).encode("ascii"))
    writer.write(body)
    await writer.drain()


async def handle(reader, writer, docroot):
    try:
        line = await asyncio.wait_for(reader.readline(), timeout=10)
        if not line:
            return
        parts = line.decode("latin-1").split()
        if len(parts) < 2:
            return
        method, path = parts[0], parts[1]
        while True:                                   # drain request headers
            hdr = await asyncio.wait_for(reader.readline(), timeout=10)
            if hdr in (b"\r\n", b"\n", b""):
                break
        if method not in ("GET", "HEAD"):
            await _send(writer, "405 Method Not Allowed", "text/plain", b"no")
            return

        route = path.split("?", 1)[0]
        if route == "/state":
            body = json.dumps(STATE.payload()).encode("utf-8")
            await _send(writer, "200 OK", "application/json", body)
            return
        if route == "/events":
            await serve_events(writer)
            return

        target = _resolve(docroot, path)
        if target is None:
            await _send(writer, "404 Not Found", "text/plain", b"not found")
            return
        ctype = mimetypes.guess_type(target)[0] or "application/octet-stream"
        with open(target, "rb") as fh:
            body = fh.read()
        await _send(writer, "200 OK", ctype, body if method == "GET" else b"")
    except (asyncio.TimeoutError, ConnectionResetError, BrokenPipeError):
        pass
    except Exception:
        traceback.print_exc()
    finally:
        try:
            writer.close()
        except Exception:
            pass


async def serve_events(writer):
    """One SSE connection. Opens with a full snapshot so a reconnecting page
    never has to wait for the next change to render."""
    writer.write(b"HTTP/1.1 200 OK\r\n"
                 b"Content-Type: text/event-stream\r\n"
                 b"Cache-Control: no-store\r\n"
                 b"Connection: keep-alive\r\n"
                 b"X-Accel-Buffering: no\r\n\r\n")
    await writer.drain()

    q = asyncio.Queue(maxsize=64)
    STATE.subscribers.add(q)
    try:
        body = json.dumps(STATE.payload(), separators=(",", ":"))
        writer.write(("data: %s\n\n" % body).encode("utf-8"))
        await writer.drain()
        while True:
            try:
                frame = await asyncio.wait_for(q.get(), timeout=15)
            except asyncio.TimeoutError:
                frame = b": keepalive\n\n"    # keeps CEF from closing an idle stream
            writer.write(frame)
            await writer.drain()
    except (ConnectionResetError, BrokenPipeError, asyncio.CancelledError):
        pass
    finally:
        STATE.subscribers.discard(q)


# --------------------------------------------------------------------------


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=59536)
    ap.add_argument("--docroot", default=os.path.join(
        os.path.dirname(os.path.abspath(__file__)), ".."))
    ap.add_argument("--state", default=os.path.expanduser(
        "~/.local/state/sp-overlay/state.json"))
    args = ap.parse_args()

    docroot = os.path.realpath(args.docroot)
    if not os.path.isdir(docroot):
        sys.exit("docroot does not exist: %s" % docroot)

    mimetypes.add_type("font/woff2", ".woff2")
    mimetypes.add_type("text/javascript", ".js")

    server = await asyncio.start_server(
        lambda r, w: handle(r, w, docroot), "127.0.0.1", args.port)
    log("serving %s on http://127.0.0.1:%d" % (docroot, args.port))
    log("runtime state file: %s" % args.state)

    await asyncio.gather(
        server.serve_forever(),
        ObsClient().run_forever(),
        poll_runtime(args.state),
    )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
