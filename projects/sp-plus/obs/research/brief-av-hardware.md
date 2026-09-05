# BRIEF: webcam + headset-mic purchase research for a Linux YouTube rig

Research only. Change nothing on any machine. Findings to STDOUT.

## What this is for

Christopher produces YouTube content — live and recorded — from a Linux mini-PC. The
screen-capture half of the rig is already built and verified. The two things that are
now the quality ceiling are **his camera and his microphone**, both old and both
measured as inadequate. He is buying replacements.

**Linux compatibility is PARAMOUNT.** A device that needs Windows-only software to
configure, ships firmware defaults that Linux cannot change, or relies on a vendor
driver, is DISQUALIFIED — not listed with a caveat. He will never boot Windows to
configure a microphone.

## Budgets (per item, USD)

| Item | Budget |
|---|---|
| Webcam | **$70–120** |
| Headphones with a microphone | **$20–60** |

Do not exceed these. If something outstanding sits just outside a range, you may
mention it in ONE line, but the recommendation itself must be inside budget.

## The exact machine (measured 2026-09-05 — do not re-derive)

| Fact | Value |
|---|---|
| OS | LMDE 7 "gigi", Debian 13 base, kernel **6.12.107+deb13-amd64** |
| Desktop | X11 + Cinnamon |
| Audio stack | **PipeWire 1.4.2**, WirePlumber 0.5.8, pipewire-pulse + pipewire-alsa |
| Capture app | **OBS Studio 30.2.3** (Debian package), `v4l2_input` and `pulse_input_capture` |
| USB | USB 2.0 ports in use for A/V today; the box is a Ryzen 9 6900HX mini-PC |
| Production format | 1920x1080 **30fps**, H.264 VAAPI |
| CPU headroom | LIMITED — a 12-vCPU VM runs on the same box during recording |

## Why the current gear failed — these are the exact traps to avoid

### Microphone: Jabra Evolve 65 (USB)
`pactl list cards` shows this headset offers **only** these input options:
```
output:analog-stereo+input:mono-fallback
output:iec958-stereo+input:mono-fallback
input:mono-fallback
```
Every profile's input is `mono-fallback`. OBS opens it and logs:
```
pulse-input: Audio format: s16le, 16000 Hz, 1 channels
```
**16 kHz mono — telephone bandwidth.** There is no better profile to select.

So the critical question for any headset you recommend is NOT "does the mic work on
Linux" — almost any UAC device enumerates. It is:

> **Does it present a USB Audio Class input that PipeWire/ALSA exposes at 48 kHz (or at
> least 44.1 kHz), rather than collapsing to a 16 kHz `mono-fallback` profile?**

Explain WHY that collapse happens (UAC1 vs UAC2, HSP/HFP-style profiles, ALSA UCM
handling, `api.acp` profile selection) and how to tell BEFORE buying. If a candidate is
known-good or known-bad on this specific point, say which and cite where you saw it.

### Camera: Sonix "USB 2.0 Camera"
Full enumeration of its ONLY capture format:
```
YUYV 4:2:2 — 640x480, 352x288, 320x240, 176x144, 160x120  (max 30fps)
```
No MJPG. No 720p. No 1080p. It is a VGA camera.

So for any camera you recommend, state the **actual v4l2 format list you expect**, and
specifically:
- Does it offer **MJPG at 1920x1080 30fps**? (USB 2.0 cannot carry uncompressed 1080p30,
  so a cam that only offers YUYV will be capped at low resolution or a few fps — this is
  exactly the trap that caught the current one.)
- Does it ALSO offer NV12/YUYV at useful sizes?
- Any known kernel 6.12 / UVC quirks, and whether `uvcvideo` needs a quirks parameter.

## Questions

### 1. Webcam — recommend ONE, with two alternates
For each: exact model, street price, the v4l2 formats/resolutions/framerates you expect
on Linux, autofocus/fixed-focus behaviour, low-light performance, field of view, whether
exposure/white-balance/focus are adjustable through **v4l2 controls** (not vendor
software), and whether it has a privacy shutter.

Flag explicitly any model whose good settings are only reachable through a Windows app.

Note: he sits at a **2560x1440 primary display** in what is likely typical indoor room
lighting. Low-light behaviour matters more than headline resolution — a 4K sensor that
smears in dim light is worse than a good 1080p one.

### 2. Headset with mic — recommend ONE, with two alternates
USB or 3.5mm? Note the machine has a **separate analog input** (`alsa_input.pci-0000_06_00.6.analog-stereo`,
48 kHz stereo) as well as USB. If a 3.5mm headset into the onboard jack avoids the
`mono-fallback` trap entirely and sounds better for the money, **say so** — that is a
legitimate and possibly superior answer at this budget.

Address: mic sample rate as Linux sees it, sidetone/monitoring support, comfort for
long sessions, whether it is detachable/boom, and cable length.

### 3. The combination question
He will wear headphones AND talk. Cover: avoiding the mic picking up headphone bleed,
whether an open-back is a mistake here, and whether a headset mic at this budget beats
the alternative of a cheap standalone USB mic plus separate headphones. **Give a
straight opinion**, do not just lay out the space.

### 4. What to verify on arrival
The exact commands to confirm a new device is behaving, before the return window closes:
`v4l2-ctl --list-formats-ext`, `pactl list cards`, what GOOD output looks like versus the
failure signature above. Write these as a short checklist he can run.

### 5. Things to keep in mind — flag, do not solve
Lighting (probably a bigger quality lever than the camera itself at this budget) ·
USB bandwidth if camera and headset share a USB 2.0 controller · mic stand/boom arm ·
acoustic treatment · whether a future 1080p60 plan changes the camera choice.

## Rules of engagement

- **Cite sources.** Prefer Linux-specific evidence: the UVC device list, ALSA/PipeWire
  bug trackers, Arch/Debian wiki, real user reports on Linux — not marketing copy or
  Windows-centric review sites.
- **Verified vs believed must be separated.** If you cannot confirm a device's v4l2
  format list, say "unverified" and name what would confirm it. Do not present a
  plausible spec as a measured one.
- Prices: give street price and note that availability varies; do not invent exact
  current prices you cannot source.
- **Availability check:** prefer models currently in production, not discontinued ones
  that only appear used.
- One clear recommendation per category, with the reasoning. Not a survey.
