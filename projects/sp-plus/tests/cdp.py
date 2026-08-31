#!/usr/bin/env python3
"""Minimal Chrome DevTools Protocol client for driving the SP+ Welcome app.

This runs ON the Dell. QtWebEngine exposes DevTools only on loopback and validates
the Host header, so tunnelling it off-box is unreliable; running here sidesteps that
and needs no package the immutable image does not already ship. The WebSocket client
below is deliberately small rather than pulling in a dependency that is not there.

Clicks are dispatched as real mouse press/release events through Input.dispatchMouseEvent,
so the app's own JavaScript, its window-title bridge and the apply helper all run exactly
as they would for a person clicking. This is driving the application, not bypassing it.
"""
import base64
import json
import os
import socket
import struct
import sys
import urllib.request


def http_json(path):
    with urllib.request.urlopen("http://127.0.0.1:9222" + path, timeout=5) as response:
        return json.load(response)


class WS:
    def __init__(self, url):
        _, rest = url.split("://", 1)
        hostport, path = rest.split("/", 1)
        host, port = hostport.split(":")
        self.sock = socket.create_connection((host, int(port)), timeout=15)
        key = base64.b64encode(os.urandom(16)).decode()
        request = (
            "GET /" + path + " HTTP/1.1\r\n"
            "Host: " + hostport + "\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            "Sec-WebSocket-Key: " + key + "\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        )
        self.sock.sendall(request.encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            chunk = self.sock.recv(4096)
            if not chunk:
                raise RuntimeError("devtools closed during handshake")
            buf += chunk
        status = buf.split(b"\r\n")[0]
        if b"101" not in status:
            raise RuntimeError("handshake failed: " + repr(status))
        self.buf = buf.split(b"\r\n\r\n", 1)[1]
        self.msg_id = 0

    def _send(self, payload):
        data = payload.encode()
        header = bytearray([0x81])
        mask = os.urandom(4)
        n = len(data)
        if n < 126:
            header.append(0x80 | n)
        elif n < 65536:
            header.append(0x80 | 126)
            header += struct.pack(">H", n)
        else:
            header.append(0x80 | 127)
            header += struct.pack(">Q", n)
        header += mask
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(data))
        self.sock.sendall(bytes(header) + masked)

    def _recv_exact(self, n):
        while len(self.buf) < n:
            chunk = self.sock.recv(65536)
            if not chunk:
                raise RuntimeError("devtools closed")
            self.buf += chunk
        out, self.buf = self.buf[:n], self.buf[n:]
        return out

    def _recv_frame(self):
        _b0, b1 = self._recv_exact(2)
        length = b1 & 0x7F
        if length == 126:
            length = struct.unpack(">H", self._recv_exact(2))[0]
        elif length == 127:
            length = struct.unpack(">Q", self._recv_exact(8))[0]
        return self._recv_exact(length).decode(errors="replace")

    def call(self, method, **params):
        self.msg_id += 1
        mid = self.msg_id
        self._send(json.dumps({"id": mid, "method": method, "params": params}))
        # DevTools interleaves events with replies, so skip until our own id returns.
        for _ in range(500):
            message = json.loads(self._recv_frame())
            if message.get("id") == mid:
                if "error" in message:
                    raise RuntimeError(method + ": " + json.dumps(message["error"]))
                return message.get("result", {})
        raise RuntimeError("no reply to " + method)

    def evaluate(self, expression):
        result = self.call(
            "Runtime.evaluate",
            expression=expression,
            returnByValue=True,
            awaitPromise=True,
        )
        return result.get("result", {}).get("value")

    def click(self, x, y):
        """A real mouse press and release at viewport coordinates."""
        self.call("Input.dispatchMouseEvent", type="mousePressed", x=x, y=y,
                  button="left", clickCount=1, buttons=1)
        self.call("Input.dispatchMouseEvent", type="mouseReleased", x=x, y=y,
                  button="left", clickCount=1, buttons=0)


def connect():
    for target in http_json("/json/list"):
        if target.get("type") == "page":
            return WS(target["webSocketDebuggerUrl"])
    raise RuntimeError("no page target on the DevTools endpoint")


if __name__ == "__main__":
    ws = connect()
    expression = sys.argv[1] if len(sys.argv) > 1 else "document.title"
    print(json.dumps(ws.evaluate(expression)))
