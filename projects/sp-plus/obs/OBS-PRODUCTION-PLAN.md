# OBS production plan — Beelink, with SP-Alpha-Rig in frame

**Status:** PLAN. Nothing installed yet. Awaiting Christopher's go-ahead.
**Date:** 2026-09-05
**Research:** Bee/Luna high-thinking, 21,989 bytes, verdict ACCEPT.
Run dir (CT105): `/root/bee-runs/20260905T163451Z_brief-obs-research/`
Brief: `projects/sp-plus/obs/brief-obs-research.md`

Bee's output was treated as **leads, not findings**. Every load-bearing claim below was
re-checked against the actual machine. Three of Bee's recommendations were WRONG for this
setup and are corrected here — see "Corrections".

---

## Measured facts (verified 2026-09-05, not inferred)

| Fact | Value | How verified |
|---|---|---|
| CPU | Ryzen 9 6900HX, 8c/16t, 4935 MHz max | `lscpu` |
| iGPU | Radeon 680M (Rembrandt), Mesa 25.0.7 radeonsi | `lspci`, `vainfo` |
| VAAPI **encode** | H.264 (CBL/Main/High), HEVC Main/Main10 | `vainfo` `VAEntrypointEncSlice` |
| AV1 | **decode only — no encode entrypoint** | `vainfo` |
| RAM | 30 GiB total, 15 GiB used, **3.4 GiB swap in use** | `free -h` |
| VM allocation | 12 vCPU, 12 GiB | domain XML |
| OS | LMDE 7 "gigi", kernel 6.12.107+deb13 | `/etc/os-release` |
| Session | **X11 + Cinnamon** (not Wayland) | `loginctl show-session 3` |
| Primary display | HDMI-A-0 **2560x1440 @ 59.95** (X screen 3640x1920) | `xrandr` |
| Audio | PipeWire 1.4.2 + pulse/alsa compat, WirePlumber 0.5.8 | `pactl`, `dpkg -l` |
| Default sink/src | Jabra Evolve 65 USB headset | `pactl info` |
| Webcam | Sonix "USB 2.0 Camera" (UVC, has own mic) | `/proc/asound/cards` |
| OBS available | **30.2.3+dfsg-3** in `trixie/main` (not installed) | `apt-cache policy` |
| Monitoring tools | `radeontop`, `sensors`, `iostat` all present | `command -v` |
| Disk | `/home` 109 GB free (75% used); `/` 332 GB free | `df -h` |
| **LAN link** | **enp5s0 negotiated at 100 Mb/s, not 1000** | `/sys/class/net/enp5s0/speed` |
| **WAN upload** | **28.7 Mbps** (n=3: 28.70 / 28.64 / 28.68) | curl POST to Cloudflare |

**On the n=3 upload test:** per [[lesson_perf_noise_floor_n1]], a single run proves nothing.
Three runs agreeing within 0.06 Mbps indicate a hard ISP tier cap, which is predictable and
therefore safe to plan against.

**On the 100 Mb/s LAN link:** same signature as [[project_pve_network_link]] — a downshift into
a 100M-only port. It does NOT block streaming (100 >> 10 Mbps) but it is the same underlying
cabling/switch fault and should be fixed with that work.

---

## Corrections to the research (caught before they became config)

### 1. The rig is displayed by `virt-manager`, NOT `virt-viewer`
Bee's plan named `virt-viewer` for both window capture and audio application capture.
The running process is `python3 /usr/bin/virt-manager` (PID 1693247 at time of check).

virt-manager wraps the guest console in a **tabbed window with a toolbar and menu bar**. Capturing
it means cropping chrome on every scene, and the content area is not a predictable size.

**Fix:** run the console as a standalone `virt-viewer` / `remote-viewer` window for production.
Separate window, no tab bar, and it can be sized to exact pixels for a 1:1 capture.

### 2. `obs-pipewire-audio-capture` is NOT in the Debian repo
`apt-cache search obs` returns no such plugin. Bee's "VM audio as its own track" design depends
on it. Building an unpackaged plugin creates a dependency that must be rebuilt on every OBS
upgrade.

**Fix (Christopher's decision, D-OBS-2):** route the VM to its **own PipeWire virtual sink** and
capture that sink's monitor. All native, nothing third-party, same end result.

### 3. Upload bandwidth was unverified
Bee correctly flagged this as unsupplied and it is the one fact that could invalidate the whole
encoder plan. Now measured at 28.7 Mbps. A 10 Mbps stream is 35% of capacity — safe.

---

## Decisions taken

| ID | Decision | Rationale |
|---|---|---|
| D-OBS-1 | **Debian repo OBS 30.2.3**, not Flatpak | Flatpak VAAPI on radeonsi is unproven; sandbox complicates window capture and plugins |
| D-OBS-2 | **Virtual sink** for VM audio, no third-party plugin | No unpackaged build to maintain across upgrades |
| D-OBS-3 | **1080p30** first; 1080p60 only after a passing 60-min test | CPU shares the box with a 12-vCPU VM |
| D-OBS-4 | **VAAPI H.264**, x264 only as fallback | ~1.5-3 cores saved, less contention with the VM |
| D-OBS-5 | **MKV** for local recording, remux after | Survives a crash; plain MP4 does not |
| D-OBS-6 | Rig reduced **12 GiB -> 10 GiB** during production | 3.4 GiB swap already in use before OBS exists |
| D-OBS-7 | Studio Mode **OFF** | Solo operator; fewer controls |
| D-OBS-8 | **No HEVC, no replay buffer, no Shorts profile** initially | Defer until baseline is stable |

---

## Target configuration

### Video path — 1:1, no scaling anywhere
```
SP+ guest          1920x1080
virt-viewer        content area EXACTLY 1920x1080 physical px (crop decorations)
OBS Base Canvas    1920x1080
OBS Output         1920x1080
Scale filter       NONE (source is already 1:1)
```
**Do not** use a 2560x1440 canvas and downscale. That upsamples the guest and then resamples it
down, which is what makes SP+ text look soft. If a scale ever becomes unavoidable, use Lanczos.

### Profile `YouTube Live — 1080p30`
| Setting | Value |
|---|---|
| Encoder | FFmpeg VAAPI H.264 |
| Rate control | CBR |
| Bitrate | 10,000 kbps (35% of measured 28.7 Mbps upload) |
| Keyframe interval | 2 s |
| Profile | High |
| B-frames | 2 if exposed, else 0 — do NOT force via custom args |
| Colour | Rec.709, NV12, **limited** range |
| Audio | AAC 128 kbps stereo, 48 kHz |
| Latency | Normal |

### Profile `Master Record — 1080p30`
| Setting | Value |
|---|---|
| Encoder | FFmpeg VAAPI H.264 |
| Rate control | **CQP, QP 18** (start point — inspect at 100%, raise to 20 or drop to 16) |
| Container | **MKV**, remux to MP4 after stopping |
| Audio | Multi-track, AAC 256-320 kbps |

Profiles store output/encoder settings; the Scene Collection stores the layout. One collection
(`SP+ Show`) serves both modes — the visual show is identical.

### Scene collection `SP+ Show`
| Scene | Contents |
|---|---|
| `00 HOLD` | Static title card, mic muted |
| `01 TALK` | Webcam, name/title graphic |
| `02 RIG` | 1920x1080 VM capture 1:1, small webcam overlay |
| `03 OUTRO` | Webcam, closing graphic |

250 ms Fade as default transition.

### Hotkeys (five, deliberately)
```
F8   -> 01 TALK          F9   -> 02 RIG
F10  start/stop STREAM   F11  start/stop RECORD
F12  mute/unmute MIC
```

### Audio
| Source | Type | Track 1 (live mix) | Track 2 | Track 3 |
|---|---|---:|---:|---:|
| `MIC — Jabra` | Audio Input Capture | Yes | Yes | No |
| `VM — SP+` | monitor of dedicated virtual sink | Yes | No | Yes |

- Voice peaks **-12 to -6 dBFS**; VM audio sits under the voice.
- **Mic monitoring OFF.** Monitor-and-Output through the Jabra is the classic echo that ruins a
  first recording.
- 48 kHz end to end.
- Track 1 is what YouTube receives. The isolated tracks are for post only — an isolated track
  does not rescue a bad live mix, so watch the Track 1 meter during the test.

---

## Build order

1. `apt install obs-studio obs-plugins` (Debian repo).
2. Launch OBS once; **confirm in the log that FFmpeg VAAPI H.264 initializes** — not merely that
   `vainfo` works on the host. This is the go/no-go for D-OBS-4.
3. Create the dedicated PipeWire virtual sink for the VM; route the guest's audio to it.
4. Start the guest console as standalone `virt-viewer`, sized to exactly 1920x1080 content.
5. Build scene collection `SP+ Show` (4 scenes) and both profiles.
6. Configure audio sources, tracks, and monitoring-off.
7. Set the five hotkeys.
8. Reduce the Rig 12 GiB -> 10 GiB.
9. **10-minute local recording.** Inspect every audio track and text sharpness at 100%.
10. **60-minute private YouTube test** with the VM active and the real audio routing.

---

## Gate — what "passing" means (define before he tests, per doctrine)

The 60-minute test passes only if ALL hold:
- OBS Stats: no encoding lag, no rendering lag, no unexplained dropped frames.
- No sustained swap **activity** (`vmstat 1` si/so columns, not merely swap occupancy).
- VM interaction latency does not degrade over the hour.
- CPU clocks/temps stabilise rather than progressively decline (`sensors`).
- Local recording is valid and every expected audio track is present and correctly balanced.
- YouTube private playback: correct A/V sync, no audio dropouts.

**Uploads land PRIVATE.** Christopher flips them public in Studio himself.

---

## Honest status / unproven

1. **VAAPI in the Debian OBS build is unproven.** Host `vainfo` proves the driver, not that this
   OBS build exposes and initializes `h264_vaapi`. Step 2 settles it. If it fails, fall back to
   x264 `veryfast` CBR 10 Mbps and re-evaluate — at 1080p30 that is viable, at 1080p60 it is not.
2. **Thermals are unknown.** The 6900HX is a 45 W mobile part in a mini-PC chassis. Chassis fan
   curve, dust and ambient matter more than the model number. Only the 60-min test answers this.
3. **The guest's PipeWire stream name and routing behaviour are unmeasured.** Step 3 may need
   iteration.
4. **QP 18 is a starting point, not a quality guarantee.**
5. **Swap occupancy is a snapshot.** Active pressure needs `vmstat 1` under real load.
6. B-frame support in OBS's VAAPI UI is unconfirmed on this driver.

## Deferred — flagged, not solved
Colour/limited-range mismatch (the washed-out-capture bug — test with known black/white before
publishing) · fonts, safe margins and title-card style (decide before making many scenes) ·
vertical 9:16 Shorts (separate 1080x1920 profile AND scene collection; never distort the 16:9
layout) · replay buffer · **stream key is a password — never in a screenshot, export or tutorial**
· backup recording while live · low-latency mode · storage burn (10 Mbps ~= 4.5 GB/hour; CQP
recordings substantially larger, against 109 GB free).
