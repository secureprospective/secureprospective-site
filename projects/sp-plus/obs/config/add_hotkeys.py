#!/usr/bin/env python3
"""Bind the five production hotkeys.

Scene-switch and mute hotkeys live INSIDE the scene collection, attached to the
source they act on. Output hotkeys (stream/record) live in the PROFILE's
basic.ini. Splitting them is not a style choice -- OBS looks for each in only
one place, and a binding written to the wrong file is silently ignored.
"""
import json, os, sys

p = os.path.expanduser("~/.config/obs-studio/basic/scenes/SP+ Show.json")
d = json.load(open(p))

SCENE_KEYS = {"01 TALK": "OBS_KEY_F8", "02 RIG": "OBS_KEY_F9"}
n_scene = n_mic = 0
for s in d["sources"]:
    if s.get("id") == "scene" and s["name"] in SCENE_KEYS:
        s["hotkeys"] = {"OBSBasic.SelectScene": [{"key": SCENE_KEYS[s["name"]]}]}
        n_scene += 1
    if s.get("name") == "MIC — Jabra":
        # push-to-mute/talk left empty on purpose: a toggle is one less thing
        # to hold down while demoing with both hands on the VM.
        s["hotkeys"] = {
            "libobs.mute":   [{"key": "OBS_KEY_F12"}],
            "libobs.unmute": [{"key": "OBS_KEY_F12"}],
            "libobs.push-to-mute": [],
            "libobs.push-to-talk": [],
        }
        n_mic += 1

json.dump(d, open(p, "w"), indent=4, ensure_ascii=False)
print(f"scene hotkeys bound: {n_scene} (expected 2)")
print(f"mic mute bound: {n_mic} (expected 1)")
if n_scene != 2 or n_mic != 1:
    sys.exit("FAIL: expected bindings not applied")
