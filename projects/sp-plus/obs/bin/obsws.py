#!/usr/bin/env python3
"""Minimal obs-websocket v5 client for the SP+ rig.

Exists because hand-editing the scene collection JSON is unsupported: OBS
rewrites scene-item transforms on save, and the internal JSON layout is an
implementation format rather than a stable editing API. Every transform change
goes through SetSceneItemTransform instead.

The password is read from OBS's own plugin config and never printed.
"""
import asyncio
import base64
import hashlib
import json
import os
import sys

import websockets

CONFIG = os.path.expanduser(
    "~/.var/app/com.obsproject.Studio/config/obs-studio/"
    "plugin_config/obs-websocket/config.json"
)


def _creds():
    d = json.load(open(CONFIG))
    return d.get("server_port", 4455), d.get("server_password", ""), d.get("auth_required", True)


def _auth_string(password, salt, challenge):
    secret = base64.b64encode(
        hashlib.sha256((password + salt).encode("utf-8")).digest()
    ).decode()
    return base64.b64encode(
        hashlib.sha256((secret + challenge).encode("utf-8")).digest()
    ).decode()


class OBS:
    def __init__(self):
        self.port, self._password, self._auth_required = _creds()
        self.ws = None
        self._rid = 0

    async def __aenter__(self):
        self.ws = await websockets.connect(
            "ws://127.0.0.1:%d" % self.port, max_size=8 * 1024 * 1024
        )
        hello = json.loads(await self.ws.recv())          # op 0
        ident = {"op": 1, "d": {"rpcVersion": 1}}
        auth = hello.get("d", {}).get("authentication")
        if auth:
            ident["d"]["authentication"] = _auth_string(
                self._password, auth["salt"], auth["challenge"]
            )
        await self.ws.send(json.dumps(ident))
        got = json.loads(await self.ws.recv())            # op 2
        if got.get("op") != 2:
            raise RuntimeError("identify failed: %s" % got)
        return self

    async def __aexit__(self, *exc):
        if self.ws:
            await self.ws.close()

    async def call(self, request_type, data=None):
        self._rid += 1
        rid = "r%d" % self._rid
        await self.ws.send(json.dumps({
            "op": 6,
            "d": {"requestType": request_type, "requestId": rid,
                  "requestData": data or {}},
        }))
        while True:
            msg = json.loads(await self.ws.recv())
            if msg.get("op") == 7 and msg["d"]["requestId"] == rid:
                status = msg["d"]["requestStatus"]
                if not status.get("result"):
                    raise RuntimeError("%s failed: %s %s" % (
                        request_type, status.get("code"), status.get("comment")))
                return msg["d"].get("responseData") or {}


# --- the RIG 1:1 geometry, measured 2026-09-05 -----------------------------
# virt-viewer window 1972x1179; guest content 1920x1080 at offset (26, 70),
# leaving right 26 / bottom 29.
SCENE = "02 RIG"
SOURCE = "RIG — SP+ console"
CROP = {"cropLeft": 26, "cropTop": 70, "cropRight": 26, "cropBottom": 29}


async def fix_rig():
    async with OBS() as obs:
        ver = await obs.call("GetVersion")
        print("connected: OBS %s / obs-websocket %s" % (
            ver["obsVersion"], ver["obsWebSocketVersion"]))

        # The source's own crop settings must be zero, or they compound with
        # the scene-item crop below.
        await obs.call("SetInputSettings", {
            "inputName": SOURCE,
            "inputSettings": {"crop_left": 0, "crop_top": 0,
                              "crop_right": 0, "crop_bot": 0},
            "overlay": True,
        })
        print("source-level crop zeroed")

        item = await obs.call("GetSceneItemId",
                              {"sceneName": SCENE, "sourceName": SOURCE})
        iid = item["sceneItemId"]

        before = await obs.call("GetSceneItemTransform",
                                {"sceneName": SCENE, "sceneItemId": iid})
        t = before["sceneItemTransform"]
        print("before: %.0fx%.0f source, scale %.4f, bounds %s %.0fx%.0f" % (
            t["sourceWidth"], t["sourceHeight"], t["scaleX"],
            t["boundsType"], t["boundsWidth"], t["boundsHeight"]))

        transform = dict(CROP)
        transform.update({
            "positionX": 0.0, "positionY": 0.0, "rotation": 0.0,
            "alignment": 5,                       # OBS_ALIGN_TOP | OBS_ALIGN_LEFT
            "boundsType": "OBS_BOUNDS_SCALE_INNER",
            "boundsAlignment": 0,                 # centre
            "boundsWidth": 1920.0, "boundsHeight": 1080.0,
        })
        await obs.call("SetSceneItemTransform", {
            "sceneName": SCENE, "sceneItemId": iid,
            "sceneItemTransform": transform,
        })

        after = await obs.call("GetSceneItemTransform",
                               {"sceneName": SCENE, "sceneItemId": iid})
        a = after["sceneItemTransform"]
        w = (a["sourceWidth"] - a["cropLeft"] - a["cropRight"]) * a["scaleX"]
        h = (a["sourceHeight"] - a["cropTop"] - a["cropBottom"]) * a["scaleY"]
        print("after:  crop %d/%d/%d/%d  scale %.4f  bounds %s %.0fx%.0f" % (
            a["cropLeft"], a["cropTop"], a["cropRight"], a["cropBottom"],
            a["scaleX"], a["boundsType"], a["boundsWidth"], a["boundsHeight"]))
        print("RENDERED SIZE: %.1f x %.1f" % (w, h))
        print("VERDICT: %s" % ("PASS - 1:1" if abs(w - 1920) < 1 and abs(h - 1080) < 1
                               else "FAIL - not 1920x1080"))


if __name__ == "__main__":
    asyncio.run(fix_rig())
