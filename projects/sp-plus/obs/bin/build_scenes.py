#!/usr/bin/env python3
"""Create the four new scenes and wire the persistent overlay into all eight.

Everything here goes through obs-websocket. Hand-editing the scene collection
JSON is unsupported -- OBS rewrites scene-item transforms on save, which is
what defeated three earlier attempts at the RIG geometry.

Additive and re-runnable: existing scenes and sources are reused, the two
text_ft2 sources are hidden rather than deleted (the overlay now draws that
text, and hiding leaves Christopher a way back).
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.expanduser("~/fleet/bin"))
from obsws import OBS  # noqa: E402

OVERLAY = "SP+ Overlay — persistent"
OVERLAY_URL = "http://127.0.0.1:59536/index.html?v=5"

MIC = "MIC — Christopher"
VMA = "VM — SP+ audio"
CAM = "CAM — webcam"
RIG = "RIG — SP+ console"

# color_source_v3 takes ABGR. Brand hex reversed byte-wise, alpha 0xFF.
BASES = {
    # Match the HOLD/OUTRO background exactly: #141414.
    "BASE — TALK": (0xFF141414, "01 TALK"),
    "BASE — SLATE": (0xFF141414, "04 SLATE"),
    "BASE — BRB": (0xFF141414, "05 BRB"),
    "BASE — TECHNICAL": (0xFF141414, "07 TECHNICAL"),
}

NEW_SCENES = ["04 SLATE", "05 BRB", "06 TALK+RIG", "07 TECHNICAL"]

# The RIG 1:1 geometry, measured through OBS's own screenshot. Bee's spec
# carried 26/24/26/75, which came from a measurement taken while the guest was
# blanked and so missed virt-viewer's header bar.
RIG_CROP = {"cropLeft": 26, "cropTop": 70, "cropRight": 26, "cropBottom": 29}
RIG_TRANSFORM = dict(RIG_CROP, positionX=0.0, positionY=0.0, rotation=0.0,
                     alignment=5, boundsType="OBS_BOUNDS_SCALE_INNER",
                     boundsAlignment=0, boundsWidth=1920.0, boundsHeight=1080.0)


async def ensure_scene(o, name, scenes):
    if name not in scenes:
        await o.call("CreateScene", {"sceneName": name})
        print("created scene: %s" % name)


async def ensure_input(o, name, kind, settings, inputs, home):
    # CreateInput insists on a home scene; an input cannot be created
    # free-floating. It is added to the other scenes afterwards as a reference.
    if name not in inputs:
        await o.call("CreateInput", {
            "inputName": name, "inputKind": kind,
            "inputSettings": settings, "sceneName": home,
        })
        print("created input: %s" % name)
    else:
        await o.call("SetInputSettings", {
            "inputName": name, "inputSettings": settings, "overlay": True})


async def items(o, scene):
    got = await o.call("GetSceneItemList", {"sceneName": scene})
    return {i["sourceName"]: i for i in got["sceneItems"]}


async def ensure_item(o, scene, source):
    have = await items(o, scene)
    if source in have:
        return have[source]["sceneItemId"]
    res = await o.call("CreateSceneItem", {
        "sceneName": scene, "sourceName": source, "sceneItemEnabled": True})
    print("  + %s -> %s" % (source, scene))
    return res["sceneItemId"]


async def main():
    async with OBS() as o:
        scenes = [s["sceneName"] for s in (await o.call("GetSceneList"))["scenes"]]
        inputs = [i["inputName"] for i in (await o.call("GetInputList"))["inputs"]]

        # Scenes first: an input needs a home scene to be created into.
        for name in NEW_SCENES:
            await ensure_scene(o, name, scenes)

        for name, (abgr, home) in BASES.items():
            await ensure_input(o, name, "color_source_v3",
                               {"color": abgr, "width": 1920, "height": 1080},
                               inputs, home)

        await ensure_input(o, OVERLAY, "browser_source", {
            "url": OVERLAY_URL,
            "width": 1920, "height": 1080,
            "fps_custom": True, "fps": 30,
            "shutdown": False,            # keep the page alive across cuts
            "restart_when_active": False,  # a reload would restart every animation
            "reroute_audio": False,
        }, inputs, "00 HOLD")

        # Source stacks, bottom-first.
        stacks = {
            "00 HOLD": ["HOLD — background"],
            "01 TALK": ["BASE — TALK", CAM],
            "02 RIG": [RIG],
            "03 OUTRO": ["HOLD — background"],
            "04 SLATE": ["BASE — SLATE"],
            "05 BRB": ["BASE — BRB"],
            "06 TALK+RIG": [RIG, CAM],
            "07 TECHNICAL": ["BASE — TECHNICAL"],
        }

        for scene, stack in stacks.items():
            print("scene %s" % scene)
            for src in stack:
                await ensure_item(o, scene, src)
            await ensure_item(o, scene, OVERLAY)
            for src in (MIC, VMA):
                await ensure_item(o, scene, src)

        # --- geometry ---------------------------------------------------
        for scene in ("02 RIG", "06 TALK+RIG"):
            have = await items(o, scene)
            if RIG in have:
                await o.call("SetInputSettings", {
                    "inputName": RIG,
                    "inputSettings": {"crop_left": 0, "crop_top": 0,
                                      "crop_right": 0, "crop_bot": 0},
                    "overlay": True})
                await o.call("SetSceneItemTransform", {
                    "sceneName": scene, "sceneItemId": have[RIG]["sceneItemId"],
                    "sceneItemTransform": dict(RIG_TRANSFORM)})
                print("  RIG 1:1 transform applied in %s" % scene)

        # The overlay is a full-frame plate: 1:1, top-left, no bounds.
        for scene in stacks:
            have = await items(o, scene)
            await o.call("SetSceneItemTransform", {
                "sceneName": scene, "sceneItemId": have[OVERLAY]["sceneItemId"],
                "sceneItemTransform": {
                    "positionX": 0.0, "positionY": 0.0, "rotation": 0.0,
                    "scaleX": 1.0, "scaleY": 1.0, "alignment": 5,
                    "boundsType": "OBS_BOUNDS_NONE",
                    "cropLeft": 0, "cropTop": 0, "cropRight": 0, "cropBottom": 0,
                }})
            # Index 0 is the top of the OBS source list, which renders last.
            await o.call("SetSceneItemIndex", {
                "sceneName": scene,
                "sceneItemId": have[OVERLAY]["sceneItemId"],
                "sceneItemIndex": 0})

        # Camera geometry: native 4:3 at native size in TALK, 0.7 in TALK+RIG.
        cam_geom = {
            "01 TALK": (128.0, 224.0, 1.0),
            "06 TALK+RIG": (1328.0, 576.0, 0.7),
        }
        for scene, (x, y, s) in cam_geom.items():
            have = await items(o, scene)
            if CAM in have:
                await o.call("SetSceneItemTransform", {
                    "sceneName": scene, "sceneItemId": have[CAM]["sceneItemId"],
                    "sceneItemTransform": {
                        "positionX": x, "positionY": y, "rotation": 0.0,
                        "scaleX": s, "scaleY": s, "alignment": 5,
                        "boundsType": "OBS_BOUNDS_NONE",
                        "cropLeft": 0, "cropTop": 0,
                        "cropRight": 0, "cropBottom": 0,
                    }})
                print("  CAM placed in %s at %d,%d x%.1f" % (scene, x, y, s))

        # The overlay now draws this text; the baked-in ft2 sources would
        # double it. Hidden, not deleted.
        for scene, src in (("00 HOLD", "HOLD — text"), ("03 OUTRO", "OUTRO — text")):
            have = await items(o, scene)
            if src in have:
                await o.call("SetSceneItemEnabled", {
                    "sceneName": scene, "sceneItemId": have[src]["sceneItemId"],
                    "sceneItemEnabled": False})
                print("  hid %s in %s" % (src, scene))

        print("\n=== final ===")
        for s in (await o.call("GetSceneList"))["scenes"]:
            n = s["sceneName"]
            lst = (await o.call("GetSceneItemList", {"sceneName": n}))["sceneItems"]
            print("%-14s %s" % (n, [(i["sceneItemIndex"], i["sourceName"],
                                     i["sceneItemEnabled"]) for i in lst]))


asyncio.run(main())
