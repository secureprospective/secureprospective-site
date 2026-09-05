#!/usr/bin/env python3
"""Generate the 'SP+ Show' OBS scene collection.

Written as a generator rather than hand-authored JSON because OBS scene items
carry a dozen mandatory fields each and a malformed collection fails silently:
OBS drops the bad source and shows an empty scene with no error.

Track layout (the 'mixers' bitmask):
    track 1 = live mix   -> everything
    track 2 = mic only   -> post
    track 3 = VM only    -> post
  mic = 1|2 = 0b011 = 3
  vm  = 1|4 = 0b101 = 5
monitoring_type 0 = OFF. Monitoring the mic through the Jabra is the classic
echo that ruins a first recording.
"""
import json, uuid

CANVAS_W, CANVAS_H = 1920, 1080
MIC_DEV = "alsa_input.usb-0b0e_Jabra_Evolve_65_50C275083546-00.mono-fallback"
VM_DEV  = "SPplusVM.monitor"
CAM_DEV = "/dev/v4l/by-id/usb-Sonix_Technology_Co.__Ltd._USB_2.0_Camera-video-index0"

def U(): return str(uuid.uuid4())

def source(name, sid, settings, *, mixers=0, monitoring=0, audio=False):
    s = {
        "prev_ver": 503382019, "name": name, "uuid": U(),
        "id": sid, "versioned_id": sid, "settings": settings,
        "mixers": mixers, "sync": 0, "flags": 0,
        "volume": 1.0, "balance": 0.5, "enabled": True, "muted": False,
        "push-to-mute": False, "push-to-mute-delay": 0,
        "push-to-talk": False, "push-to-talk-delay": 0,
        "hotkeys": {}, "deinterlace_mode": 0, "deinterlace_field_order": 0,
        "monitoring_type": monitoring, "private_settings": {},
    }
    return s

def item(src, idx, *, pos=(0,0), scale=(1.0,1.0), bounds=None, filt="disable"):
    it = {
        "name": src["name"], "source_uuid": src["uuid"],
        "visible": True, "locked": False, "rot": 0.0,
        "pos": {"x": float(pos[0]), "y": float(pos[1])},
        "scale": {"x": scale[0], "y": scale[1]},
        "align": 5, "bounds_type": 0, "bounds_align": 0,
        "bounds": {"x": 0.0, "y": 0.0},
        "crop_left": 0, "crop_top": 0, "crop_right": 0, "crop_bottom": 0,
        "id": idx, "group_item_backup": False,
        "scale_filter": filt, "blend_method": "default", "blend_type": "normal",
        "show_transition": {"duration": 0}, "hide_transition": {"duration": 0},
    }
    if bounds:
        it["bounds_type"] = 2  # scale to inner bounds, preserves aspect
        it["bounds"] = {"x": float(bounds[0]), "y": float(bounds[1])}
        it["bounds_align"] = 0
    return it

# ---- inputs ---------------------------------------------------------------
mic = source("MIC — Jabra", "pulse_input_capture",
             {"device_id": MIC_DEV}, mixers=3, monitoring=0)
vm_audio = source("VM — SP+ audio", "pulse_output_capture",
                  {"device_id": VM_DEV}, mixers=5, monitoring=0)
# capture_window is bound after virt-viewer is running -- an xcomposite source
# with an empty window simply shows black until it is set.
rig = source("RIG — SP+ console", "xcomposite_input",
             {"capture_window": "", "show_cursor": True,
              "include_border": False, "exclude_alpha": True})
cam = source("CAM — webcam", "v4l2_input",
             {"device_id": CAM_DEV, "input": 0, "pixelformat": 1448695129,
              "resolution": 0, "framerate": 0, "color_range": 0,
              "buffering": True, "auto_reset": True})
hold_bg = source("HOLD — background", "color_source_v3",
                 {"color": 4279505940, "width": CANVAS_W, "height": CANVAS_H})
hold_txt = source("HOLD — text", "text_ft2_source_v2",
                  {"text": "Starting shortly", "font": {"face": "IBM Plex Sans",
                   "flags": 1, "size": 72, "style": "Bold"}, "color1": 4294967295,
                   "color2": 4294967295})
outro_txt = source("OUTRO — text", "text_ft2_source_v2",
                   {"text": "Thanks for watching", "font": {"face": "IBM Plex Sans",
                    "flags": 1, "size": 64, "style": "Bold"}, "color1": 4294967295,
                    "color2": 4294967295})

# ---- scenes ---------------------------------------------------------------
# Webcam overlay on the RIG scene: bottom-right, 480x270 box, 32px margin.
CAM_W, CAM_H = 480, 270
cam_pos = (CANVAS_W - CAM_W - 32, CANVAS_H - CAM_H - 32)

def scene(name, items):
    s = source(name, "scene", {"custom_size": False, "id_counter": len(items),
                               "items": items})
    del s["mixers"]
    return s

sc_hold = scene("00 HOLD", [
    item(hold_bg, 1),
    item(hold_txt, 2, pos=(160, 480)),
])
sc_talk = scene("01 TALK", [
    item(cam, 1, bounds=(CANVAS_W, CANVAS_H)),
])
sc_rig = scene("02 RIG", [
    item(rig, 1, pos=(0, 0), filt="disable"),          # 1:1, NO scaling
    item(cam, 2, pos=cam_pos, bounds=(CAM_W, CAM_H)),
])
sc_outro = scene("03 OUTRO", [
    item(hold_bg, 1),
    item(outro_txt, 2, pos=(160, 480)),
])

collection = {
    "current_scene": "01 TALK",
    "current_program_scene": "01 TALK",
    "scene_order": [{"name": n} for n in ["00 HOLD","01 TALK","02 RIG","03 OUTRO"]],
    "name": "SP+ Show",
    "current_transition": "Fade",
    "transition_duration": 250,
    "transitions": [],
    "sources": [mic, vm_audio, rig, cam, hold_bg, hold_txt, outro_txt,
                sc_hold, sc_talk, sc_rig, sc_outro],
    "groups": [],
    "quick_transitions": [],
    "saved_projectors": [],
    "modules": {},
    "resolution": {"x": CANVAS_W, "y": CANVAS_H},
    "version": 2,
}
print(json.dumps(collection, indent=4, ensure_ascii=False))
