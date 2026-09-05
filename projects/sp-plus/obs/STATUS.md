# OBS production rig — status and handoff

**Last session:** 2026-09-05. **State:** built and verified; blocked on hardware.
Plan: `OBS-PRODUCTION-PLAN.md`. Research: `research/`.

---

## What is BUILT and VERIFIED (evidence, not assumption)

Screenshot evidence in `~/logs/sp-plus/obs/` on the Beelink.

| Piece | State | How it was proven |
|---|---|---|
| OBS 30.2.3.1 (Debian `trixie/main`) | installed | `obs --version` |
| VAAPI H.264 encode | **WORKS** | OBS's own log: `FFmpeg VAAPI H264 encoding supported`, `ffmpeg_vaapi_tex` |
| VAAPI HEVC | available (unused by choice) | same log |
| VAAPI AV1 | **not supported** — decode only | same log |
| Profile `SP+ YouTube Live` | CBR 10 Mbps, 2s keyint, High, 1080p30 | `basic.ini` + `streamEncoder.json` |
| Profile `SP+ Master Record` | CQP 18, MKV, 3 audio tracks (`RecTracks=7`) | `basic.ini` + `recordEncoder.json` |
| Scene collection `SP+ Show` | `00 HOLD`/`01 TALK`/`02 RIG`/`03 OUTRO` | loaded in OBS, seen in titlebar |
| **VM capture 1:1** | **WORKS** — preview showed the live guest desktop | screenshot, 30.00/30.00 FPS, CPU 0.4% |
| virt-viewer client area | **exactly 1920x1080** | `xwininfo` |
| Canvas == output == 1920x1080 | no scaling in the chain | OBS log `video settings reset` |
| RIG source scale filter | `disable` (no resampling) | scene JSON |
| Audio: mic -> tracks 1,2 | `mixers=3`, monitoring OFF | scene JSON + OBS log |
| Audio: VM -> tracks 1,3 | `mixers=5`, from `SPplusVM.monitor` | scene JSON + OBS log |
| `SPplusVM` null sink + loopback | live and persistent | `pactl`, PipeWire conf.d |
| Hotkeys F8/F9/F10/F11/F12 | bound | scene JSON + profile `[Hotkeys]` |
| VM memory 12 -> 10 GiB | live via virtio balloon, persisted | `dommemstat actual 10485760` |

**Existing OBS config was NOT touched.** Profiles `SecureProspective`, `TFM`, `Untitled` and the
`Untitled` scene collection are intact. Full backup:
`~/logs/sp-plus/obs-config-backup-20260905T165704Z.tgz` (1.2 MB).
The linked YouTube service+key was copied into the live profile at mode 600 and is
**deliberately not committed**.

---

## What is NOT working / NOT proven

1. **Webcam previews BLACK.** Cause unknown. Not a resolution bug — that was found and fixed
   (OBS `resolution: 0` had selected the smallest mode, 160x120; now pinned to 640x480@30).
   The v4l2 `failed to log status` warnings are benign on UVC devices and prove nothing.
   Unresolved: physical shutter? lens cover? genuine fault? **Do not report the camera as working.**
2. **No recording has ever been made.** The 10-minute local recording and the 60-minute
   sustained test in the plan have NOT been run.
3. **No audio has ever flowed through `SPplusVM`.** The sink, loopback and WirePlumber rule are
   built and loaded, but the guest has been silent. The routing is unproven end to end.
4. **Thermals unmeasured.** The 6900HX is a 45 W mobile part in a mini-PC chassis.

---

## Measured hardware facts (do not re-derive)

| Fact | Value |
|---|---|
| CPU / iGPU | Ryzen 9 6900HX 8c/16t · Radeon 680M, Mesa 25.0.7 |
| RAM | 30 GiB; ~15 GiB used with the VM at 10 GiB; **3.4 GiB swap already in use** |
| Session | **X11 + Cinnamon** (not Wayland) — this is why window capture is easy |
| Primary display | HDMI-A-0 2560x1440@59.95; X screen 3640x1920 |
| **WAN upload** | **28.7 Mbps** (n=3: 28.70/28.64/28.68 — a hard ISP cap, so predictable) |
| **LAN link** | `enp5s0` negotiated at **100 Mb/s, not 1000** — same downshift signature as the Proxmox uplink fault. Does not block streaming. |
| **USB 3 available** | **four EMPTY 10,000 Mb/s (USB 3.1 Gen2) root hubs**: usb2, usb4, usb7, usb9 |
| USB in use | webcam 480 Mb/s; Jabra 12 Mb/s; receiver 12 Mb/s — all on USB 2.0 |
| USB4/Thunderbolt | controller is "Rembrandt USB4" BUT **no thunderbolt domain and no typec class** — 40 Gb/s NOT confirmed. 10 Gb/s IS confirmed. |
| Guest audio path | `<audio type='spice'/>` — audio only appears as a stream when the guest plays sound AND a viewer is connected |

### The two hardware ceilings (being replaced)
- **Mic:** Jabra Evolve 65 offers ONLY `input:mono-fallback` in every card profile —
  **16 kHz mono**, telephone bandwidth. OBS log: `s16le, 16000 Hz, 1 channels`.
- **Camera:** Sonix USB 2.0 Camera offers ONLY YUYV, max **640x480**. No MJPG, no 720p, no 1080p.

**Why the camera is capped:** uncompressed 1080p30 is ~995 Mb/s; USB 2.0 carries 480 Mb/s.
A YUYV-only camera physically cannot do 1080p30. MJPG compresses in-camera, which is the
deciding spec when buying.

---

## Purchase research (`research/bee-av-hardware-2026-09-05.md`)

- **Webcam:** Logitech **C922 Pro Stream**, $80–90. MJPG 1920x1080@30. UVC quirk already in
  kernel (`046d:085c`) — do NOT add `uvcvideo quirks=`. No privacy shutter.
  ⚠️ Alternate C920s revision `046d:08e5` has a documented **MJPG truncation bug at 1080p30**;
  kernel 6.12.107 may not contain the fix. `lsusb` on arrival and test before the return window.
- **Headset:** HyperX **Cloud Stinger 2 wired**, ~$50, via **3.5 mm analog**, not USB.
  Rationale: the onboard codec is a known-good 48 kHz stereo path, bypassing `mono-fallback`.

### ⚠️ OPEN QUESTION that gates the headset purchase
Does the Beelink's **front 3.5 mm jack carry a mic contact**?
- The codec pin table advertises front-mic (`0x02a11041`) AND front-HP (`0x02211030`), but that
  is a desktop-tower layout mini-PCs often inherit spuriously.
- Baseline with nothing plugged in: `analog-input-front-mic: not available`,
  `analog-output-headphones: not available` — so **jack detection works on those pins**.
- **The test:** plug a 3.5 mm plug into the front jack, then
  `pactl list cards | grep -E "front-mic|headphones"`.
  Only `headphones` flips -> headphone-out only, the splitter plan FAILS.
  Both flip -> true combo TRRS jack, headset plugs straight in. Best case.

### Also open
Which of the four 10 Gb/s hubs is the **front USB-C** port, and whether it is data-capable.
Test: plug any USB device into it and read which bus it lands on.
**Note:** at $70–120 essentially every webcam is USB 2.0 anyway. Exploiting 10 Gb/s
(uncompressed 1080p60, 4K) means the ~$150–200 tier. Bandwidth is not the constraint; budget is.

---

## Editing research (`research/bee-llm-video-editing-2026-09-05.md`, 49 KB)

**Verdict: build a plan compiler, NOT an AI NLE.** The LLM emits a validated JSON edit plan;
deterministic code compiles it to frame-accurate ranges and runs FFmpeg. Do not let the LLM write
arbitrary FFmpeg commands. Do not automate a GUI NLE.

> An LLM is not needed for most mechanical editing. Silence detection, audio levelling, caption
> timing, frame extraction, stream mapping and rendering are deterministic problems.

Pipeline: `OBS MKV -> ffprobe+hash -> mic-track extract -> whisper.cpp -> deterministic analysis
-> LLM edit-plan JSON -> compiler -> low-res preview -> HUMAN accept -> VAAPI render -> QC gates
-> private upload`.

On the gates lesson: *"The correct design is not 'make the model better until it never fails.'
The correct design is to ensure that its failures are cheap to discover and cheap to undo."*

**Timing reality for a 60-minute source (planning ranges, NOT measured here):**
whisper.cpp `small.en` CPU **1–4 h** · Vulkan on the 680M possibly 20–60 min but **unverified** ·
scene detection 10–45 min · final 1080p VAAPI render 30–120 min.
Hosted ASR is ~$0.27–0.36/hour of video — cheap enough to be a real fallback; the cost that
matters is privacy, not dollars.

⚠️ **VAAPI does not make the whole filtergraph free.** Burned-in captions, text and scaling can
force CPU work before frames reach the encoder. Measure the full graph, never an isolated codec test.

---

## NEXT ACTIONS, in order

1. **Christopher:** plug a 3.5 mm plug into the front jack and run the `pactl` test above.
   This decides the headset purchase.
2. **Christopher:** plug something into the front USB-C and report, to identify the bus.
3. Diagnose or write off the black webcam (moot if it is being replaced).
4. Buy camera + headset once 1 and 2 are answered.
5. Record a **10-minute local test**: inspect text sharpness at 100% and confirm all three audio
   tracks are populated and correctly balanced.
6. Play audio in the guest and prove `SPplusVM` -> track 3 while remaining audible.
7. Run the **60-minute sustained test** against the written pass conditions in the plan.
8. Only then: whisper.cpp CPU-vs-Vulkan benchmark on a five-minute real sample, one variable at
   a time, CPU baseline first.

## Do NOT retry (already refuted)
- **virgl / SPICE-GL** — breaks `virsh screenshot`.
- **A LAN bridge for the VM** — two attempts took the Beelink off the network on 2026-09-05.
  NetworkManager gives a bridge its own MAC. Do not bridge the host's only live NIC.
- **Raising guest capture resolution above 1920x1080** — Christopher has ruled it sufficient, and
  higher drops frames (llvmpipe, not ffv1).
- **`obs-pipewire-audio-capture`** — not packaged in Debian; the virtual-sink route replaces it.
