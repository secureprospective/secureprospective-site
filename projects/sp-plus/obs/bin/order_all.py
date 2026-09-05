#!/usr/bin/env python3
"""Set the full bottom-to-top render order of every scene explicitly.

Applied TOP-DOWN. Going bottom-up does not converge: each SetSceneItemIndex
renumbers the items above it, so an item placed early gets pushed by the next
one and the stack settles in the wrong order. Placing the highest index first
leaves everything already-placed untouched.

Index 0 is the BOTTOM of the render stack. This was established by picture,
not by reading: with the plate at index 0 the four new scenes rendered no
overlay at all.
"""
import asyncio, os, sys
sys.path.insert(0, os.path.expanduser("~/fleet/bin"))
from obsws import OBS

OVERLAY = "SP+ Overlay — persistent"
MIC, VMA = "MIC — Christopher", "VM — SP+ audio"
CAM, RIG = "CAM — webcam", "RIG — SP+ console"

# Bottom first. Audio-only items sit under the plate; only their order
# relative to the video sources is meaningless, not their presence.
ORDER = {
    "00 HOLD":      ["HOLD — background", "HOLD — text", MIC, VMA, OVERLAY],
    "01 TALK":      ["BASE — TALK", CAM, MIC, VMA, OVERLAY],
    "02 RIG":       [RIG, CAM, MIC, VMA, OVERLAY],
    "03 OUTRO":     ["HOLD — background", "OUTRO — text", MIC, VMA, OVERLAY],
    "04 SLATE":     ["BASE — SLATE", MIC, VMA, OVERLAY],
    "05 BRB":       ["BASE — BRB", MIC, VMA, OVERLAY],
    "06 TALK+RIG":  [RIG, CAM, MIC, VMA, OVERLAY],
    "07 TECHNICAL": ["BASE — TECHNICAL", MIC, VMA, OVERLAY],
}

async def main():
    async with OBS() as o:
        for scene, desired in ORDER.items():
            for want_index, name in reversed(list(enumerate(desired))):
                lst = (await o.call("GetSceneItemList", {"sceneName": scene}))["sceneItems"]
                hit = [i for i in lst if i["sourceName"] == name]
                if not hit:
                    continue
                await o.call("SetSceneItemIndex", {
                    "sceneName": scene, "sceneItemId": hit[0]["sceneItemId"],
                    "sceneItemIndex": want_index})
            lst = (await o.call("GetSceneItemList", {"sceneName": scene}))["sceneItems"]
            got = [i["sourceName"] for i in sorted(lst, key=lambda i: i["sceneItemIndex"])]
            ok = "OK " if got == [d for d in desired if d in got] else "MISMATCH "
            print("%s%-14s %s" % (ok, scene, " | ".join(got)))

asyncio.run(main())
