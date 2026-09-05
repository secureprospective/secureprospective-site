# OBS Studio production research brief

## Recommendation in one line

Use the **Debian OBS packages**, capture the SPICE client with **Xcomposite**, run a **1920×1080 30fps** production at first, encode with **VAAPI H.264**, reduce the VM to **10 GiB**, and keep the initial OBS layout to four scenes.

The first validation experiment should be a 60-minute private YouTube test with the VM active, OBS recording locally, and the exact intended audio routing.

---

## 1. Installation path

### Recommendation: Debian repository

Install `obs-studio` and `obs-plugins` from the Debian 13 repository. OBS itself recommends Flatpak on non-Ubuntu distributions, but this machine has a specific requirement—AMD VAAPI plus Linux plugins—where native Debian integration is preferable.

Debian 13 currently provides OBS 30.2.3 and a separate `obs-plugins` package containing PipeWire, ALSA, JACK, DeckLink, and VLC plugins:

- [Debian obs-studio package](https://packages.debian.org/trixie/obs-studio)
- [Debian obs-plugins package](https://packages.debian.org/trixie/obs-plugins)

Do **not** add the Ubuntu OBS PPA. OBS documents that PPA for Ubuntu, not Debian. There is no Debian equivalent that should be added casually.

### Flatpak VAAPI answer

Flatpak has enough device permissions in the published OBS manifest to reach the GPU:

- `--device=all`
- X11 socket access
- PulseAudio socket access
- `--filesystem=xdg-run/pipewire-0`
- `--filesystem=host`

See the [OBS Flathub manifest](https://github.com/flathub/com.obsproject.Studio/blob/master/com.obsproject.Studio.json) and [Flatpak sandbox permissions](https://docs.flatpak.org/en/latest/sandbox-permissions.html).

That does **not** prove that VAAPI will work. Flatpak uses its own OBS/FFmpeg/runtime combination, and VAAPI depends on:

1. The FFmpeg build containing `h264_vaapi` and `hevc_vaapi`.
2. The runtime loading a compatible Mesa VAAPI driver.
3. `/dev/dri/renderD*` being accessible.
4. The runtime and host driver agreeing on ABI and GPU support.

Therefore:

> The Flatpak should not be selected on the assumption that AMD VAAPI will work without additional runtime troubleshooting.

The failure mode is that OBS starts normally but the encoder list contains only x264, or VAAPI appears but fails during encoder initialization with a missing codec, VA device, or driver error. The cheap proof is to inspect OBS’s startup log and confirm that the VAAPI H.264 encoder initializes successfully, not merely that `vainfo` works on the host.

### Flatpak access consequences

| Requirement | Flatpak result | Failure mode |
|---|---|---|
| Capture X11 `virt-viewer` window | Should work with the published X11 and IPC permissions | Missing/overridden X11 permission gives no usable Xcomposite capture or a blank source |
| Read PipeWire audio | PulseAudio compatibility is exposed; PipeWire socket is also exposed | The PipeWire application-audio plugin may show no applications until `xdg-run/pipewire-0` access is granted and OBS is restarted |
| Write `/home` recordings | Published OBS manifest grants host filesystem access | A restricted/changed permission set limits writes to the Flatpak sandbox, commonly `~/.var/app/com.obsproject.Studio/`; file chooser portals may be needed |
| Install plugins | Use Flatpak extensions or the Flatpak OBS config directory | Native Debian `.so` plugins can fail to load because of ABI, library-path, or sandbox differences |

The PipeWire application-audio plugin explicitly documents the Flatpak override and restart requirement:

- [PipeWire Audio Capture plugin](https://github.com/dimtpap/obs-pipewire-audio-capture)

Native Debian OBS avoids most of these path and plugin issues.

---

## 2. Capturing the VM window

### Recommendation: Xcomposite Window Capture

Use OBS’s Linux **Window Capture (Xcomposite)** source targeting the `virt-viewer` window.

OBS describes Window Capture as capturing only the selected window, even when other windows overlap it. Xcomposite is available specifically on Linux/X11:

- [OBS Window Capture sources](https://obsproject.com/kb/window-capture-sources)

### Comparison

| Method | Quality | CPU cost | Reliability |
|---|---|---:|---|
| Xcomposite window capture | Best of the host-side choices; captures the client window directly | Lower than capturing the entire desktop | Best if the window remains mapped and on the active desktop |
| XSHM Display Capture plus crop | Same possible final quality, but more copying and more setup | Higher, especially if capturing the whole 3640×1920 root screen | Easier fallback; affected by windows moving over the region |
| Direct guest/framebuffer path | Potentially best technically | Requires a different VM/display architecture | Not currently a practical or validated OBS path |

Xcomposite may become blank or frozen if the target window is unmapped, closed, or affected by an X11/compositor issue. XSHM is the fallback if Xcomposite fails, but the VM window must remain visible and unobstructed.

The current SPICE software-rendering path necessarily presents the guest through the SPICE client before OBS captures it. `virsh screenshot` is a still-image facility, not a live video source. Re-enabling virgl/SPICE-GL is not appropriate because it was already rejected and breaks `virsh screenshot`.

Running OBS inside the guest would avoid host-side window capture, but it would add another encoder/capture workload and require transporting the result back to the host. It is not suitable for this single-box setup.

### Avoiding soft VM text

The guest is already 1920×1080. The correct layout is:

- Guest: **1920×1080**
- `virt-viewer` client content area: **exactly 1920×1080 physical pixels**
- OBS Base Canvas: **1920×1080**
- OBS Output: **1920×1080**
- Guest capture source: **1920×1080**
- Source scale filtering: **none**, because it is 1:1

Do not use a 2560×1440 OBS canvas and then shrink it to 1920×1080. That enlarges the guest first and then downsamples it, making SP+ text softer.

Window decorations must be cropped out. Size the **client content area**, not the outside edge of the decorated window. If a scale operation is unavoidable:

- Use **Lanczos** when quality is the priority and the source is being downscaled.
- Use **Bicubic** if Lanczos causes excess GPU cost or ringing around text.
- Avoid Bilinear for fine guest UI text except as a performance emergency.

OBS documents its source scaling filter options here:

- [OBS scaling/aspect-ratio filters](https://obsproject.com/kb/scaling-aspect-ratio-filter)

---

## 3. Encoder settings

### Live YouTube recommendation

Use:

| Setting | Recommendation |
|---|---|
| Resolution | 1920×1080 |
| Frame rate | **30fps initially** |
| Encoder | FFmpeg VAAPI H.264 |
| Rate control | CBR |
| Bitrate | **10,000 kbps** |
| Keyframe interval | 2 seconds |
| Profile | High |
| B-frames | 2, if OBS exposes them as supported; otherwise 0 |
| Preset | Not applicable to OBS’s VAAPI encoder |
| Pixel aspect | Square |
| Scan | Progressive |
| Reference frames | 1 |
| Entropy coding | CABAC |
| Color | Rec.709, 8-bit SDR |
| Audio | AAC, 128 kbps stereo, 48 kHz pipeline |

YouTube’s current live recommendations specify H.264 CBR, a 2-second keyframe interval, progressive scan, two B-frames, one reference frame, CABAC, and 10 Mbps for 1080p30:

- [YouTube live encoder settings](https://support.google.com/youtube/answer/2853702)

YouTube lists 12 Mbps for 1080p60. Do not begin there: the VM host, SPICE client, OBS compositor, and encoder all compete for resources. Move to 1080p60 only after the 30fps configuration passes a sustained test.

OBS’s VAAPI implementation supports CBR, CQP, VBR, and QVBR where the driver exposes them. It defaults to High profile, QP 20, automatic keyframe interval, and zero B-frames; the source code also shows that there is no x264-style `preset` setting:

- [OBS VAAPI encoder implementation](https://github.com/obsproject/obs-studio/blob/master/plugins/obs-ffmpeg/obs-ffmpeg-vaapi.c)

If the UI does not expose two B-frames, leave it at zero. Do not force unsupported options through custom FFmpeg arguments.

### x264 fallback

If VAAPI cannot initialize, use:

- x264
- 1920×1080
- 30fps
- CBR, 10,000 kbps
- Keyframe interval 2 seconds
- High profile
- `veryfast` preset

With only approximately four genuinely free host threads, x264 is a fallback, not the production recommendation. At 1080p30 it may be viable; at 1080p60 it is much more likely to compete with the VM.

### Approximate VAAPI headroom

This is a planning estimate, not a measurement on this machine:

- VAAPI encoding: roughly **0.5–1.5 host CPU cores** of overhead.
- x264 veryfast at 1080p30: roughly **2–4 host CPU cores**, depending on scene complexity.
- x264 at 1080p60: potentially **4–6 cores**.

The practical gain is approximately **1.5–3 free CPU cores** at 30fps, and more importantly less scheduling contention with the 12-vCPU VM. Capture, compositing, audio, and SPICE rendering still consume resources; VAAPI does not make the whole pipeline free.

### Local recording

Use:

- H.264 VAAPI
- CQP
- QP **18** as the first value
- High profile
- 1920×1080 at the same frame rate as the show
- 2 B-frames if supported
- AAC audio at 256–320 kbps per required track

QP 18 is a starting point, not a guaranteed quality target. A 10-minute test should be inspected at 100% scale for text ringing, block edges, and cursor clarity. Raise to QP 20 if files are too large; lower to QP 16 if text quality is inadequate.

### Container

Use **Hybrid MP4** if the installed OBS version provides it and the editor accepts the resulting multi-track files. Hybrid MP4 combines fragmented-write crash resilience with normal MP4 compatibility:

- [OBS Hybrid MP4](https://obsproject.com/kb/hybrid-mp4)

If Hybrid MP4 is unavailable or editor compatibility is uncertain, record to **MKV** and remux after stopping. MKV is the safest container for a machine already under sustained VM load. Remuxing changes the container and does not re-encode the video.

Do not record directly to ordinary MP4. A crash or power loss before finalization can make the file unusable. Fragmented MP4 is safer than ordinary MP4, but editor support is less universal than regular MP4.

### HEVC

For the baseline plan: **do not use HEVC for live streaming**.

YouTube now accepts H.265, but H.264 remains the safer interoperability choice and YouTube publishes the clearest H.264 bitrate guidance. HEVC could reduce local file size and is supported by the measured Radeon VAAPI capabilities, but it introduces more editor/player compatibility risk and provides no necessary benefit for this first workflow.

Revisit HEVC for local recording only after H.264 is stable and storage becomes the actual constraint.

---

## 4. RAM

### Recommendation: reduce the VM to 10 GiB for production

The current 15 GiB available is technically enough for OBS plus a modest browser, but it is not comfortable because:

- The VM already has 12 GiB allocated.
- 15 GiB is already in use.
- 3.4 GiB of swap is already occupied.
- Chromium/Firefox-class browsers can consume multiple GiB.
- OBS browser sources and CEF components can consume additional memory.

Reduce SP-Alpha-Rig from 12 GiB to **10 GiB** for the first production test. If SP+ remains responsive, keep 10 GiB. Try 8 GiB only if the guest workload demonstrably does not need 10 GiB.

The first thing likely to break is not OBS itself. It is host memory pressure causing swap-in/swap-out, followed by VM input lag, SPICE stutter, delayed window capture, and eventually OBS rendering or encoding lag. The final failure mode is the kernel OOM killer terminating a process.

The earliest observable warning is:

- Falling `MemAvailable`
- Increasing swap activity, not merely swap space already being occupied
- Rising major page faults
- VM interaction becoming sticky
- OBS Stats showing missed render frames or encoding lag

A browser should not be treated as free. Keep chat or research on another device during the first production runs, or use one lightweight tab only.

---

## 5. Audio routing

### Recommended source layout

Do not rely on OBS’s global “Desktop Audio” source. It makes duplication and track assignment easier to get wrong.

Add these explicit sources:

1. **`MIC — Jabra`**
   - OBS Audio Input Capture
   - Select the Jabra `mono-fallback` microphone.
2. **`VM — virt-viewer`**
   - PipeWire Application Audio Capture plugin
   - Select the `virt-viewer` application.
3. **`DESKTOP — other`**, only if needed
   - PipeWire Audio Output Capture or PulseAudio output capture
   - Use the default sink monitor after ensuring the VM stream is not included.

The PipeWire plugin supports application, input-device, and output-device capture and requires WirePlumber plus a working PipeWire compatibility layer:

- [PipeWire Audio Capture plugin](https://github.com/dimtpap/obs-pipewire-audio-capture)
- [WirePlumber documentation](https://pipewire.pages.freedesktop.org/wireplumber/)

If the VM application does not appear, verify that `virt-viewer` is producing audio and that it is using PipeWire’s PulseAudio compatibility server. The plugin documentation identifies missing `pipewire-pulse`, `pipewire-jack`, or `pipewire-alsa` compatibility as common causes.

The VM must not remain in the generic desktop monitor if the generic desktop source is also being captured. Use application capture for the VM, or route the VM to a dedicated virtual sink and capture that sink’s monitor. Do not capture both the application and its monitor, or the VM audio will be doubled.

### Track assignment

Use Advanced Audio Properties:

| Source | Track 1: live mix | Track 2: mic | Track 3: VM | Track 4: other desktop |
|---|---:|---:|---:|---:|
| Jabra mic | Yes | Yes | No | No |
| VM audio | Yes | No | Yes | No |
| Other desktop | Yes, if needed | No | No | Yes |

Track 1 is the live mix. The isolated tracks are for local recording and post-production. YouTube receives the live mix, not separate local tracks.

Use:

- Voice peaks approximately −12 to −6 dBFS.
- VM audio lower than the voice.
- No mic monitoring initially.
- 48 kHz throughout the PipeWire/OBS/editing chain.

The classic failure is setting the mic to **Monitor and Output**, hearing it through the Jabra headset, and creating an echo or feedback path. Set mic monitoring to **Monitor Off** unless there is a specific reason to monitor it. If monitoring is later required, use the headset and verify that acoustic or software feedback is impossible.

Another common failure is allowing the VM/desktop source to dominate Track 1. The isolated recording track does not rescue a bad live mix; watch the Track 1 meter during the test.

---

## 6. Scene architecture

Create one scene collection named **`SP+ Show`** with four scenes:

| Scene | Contents |
|---|---|
| `00 HOLD` | Static title card, mic muted or low |
| `01 TALK` | Webcam/talking head, title/name graphic |
| `02 RIG` | 1920×1080 VM capture, small webcam overlay |
| `03 OUTRO` | Webcam, closing graphic |

Use a simple 250 ms Fade as the default scene transition. Do not make a separate transition scene unless a later show format needs one.

Minimum hotkeys:

- `F8` — switch to `01 TALK`
- `F9` — switch to `02 RIG`
- `F10` — start/stop streaming
- `F11` — start/stop recording
- `F12` — mute/unmute mic

Add a dedicated “add chapter marker” hotkey later if the editor workflow benefits from it.

### Studio Mode

Leave Studio Mode **off initially**.

Studio Mode gives a preview/program split and is valuable when a producer can prepare scenes before taking them live. For a solo operator who already finds OBS confusing, it adds another visible control surface and another transition step. Add it later if Christopher needs to queue scene changes without showing setup work.

---

## 7. Live versus recorded operation

Use both **Profiles** and **one Scene Collection**, with a strict division:

### Scene Collection

`SP+ Show` stores:

- Scenes
- Sources
- Webcam placement
- VM placement
- Audio source definitions
- Global audio sources

OBS documents that Scene Collections store scenes and sources but not output settings:

- [OBS Scene Collections](https://obsproject.com/kb/scene-collections)

### Profiles

Create:

#### `YouTube Live — 1080p30`

- YouTube service/account
- 1920×1080 canvas/output
- 30fps
- VAAPI H.264
- CBR 10,000 kbps
- 2-second keyframes
- AAC 128 kbps
- Track 1 live mix

#### `Master Record — 1080p30`

- 1920×1080 canvas/output
- 30fps
- VAAPI H.264 CQP QP 18
- Hybrid MP4 or MKV
- Multiple audio tracks enabled
- Tracks 1–4 assigned as above
- No need to start a stream

Profiles store stream, video, and output settings; Scene Collections store the production layout:

- [OBS Profiles](https://obsproject.com/kb/profiles)

Do not create separate scene collections for live and recorded output yet. The visual show is the same. Make a second collection only when vertical Shorts, a different show layout, or a stripped-down recording layout is actually needed.

---

## 8. Thermal and sustained-load reality

A 60-minute run will reach the Beelink’s thermal equilibrium. The Ryzen 9 6900HX may initially boost, then settle to a lower sustained clock or power level as the 45 W mobile package and mini-PC cooling system stabilize. Exact temperature and throttling behavior cannot be predicted from the CPU model alone; chassis fan curve, heatsink, room temperature, dust, and firmware matter more.

Monitor during the test:

- CPU package temperature and clocks: `sensors`
- CPU pressure and swapping: `vmstat 1`
- Memory: `free -h`
- Disk throughput and temperature: `iostat`, SMART/drive tools
- GPU/video activity: `radeontop` or `amdgpu_top`, if available
- OBS Stats:
  - Dropped frames — network
  - Missed frames — rendering
  - Skipped frames — encoding
- VM input latency and visible SPICE stutter

OBS distinguishes rendering/compositing load from encoding load and recommends reducing output resolution or frame rate when necessary:

- [OBS encoding performance troubleshooting](https://obsproject.com/kb/encoding-performance-troubleshooting)

### Practical sustained ceiling

For the first production configuration, treat:

> **1080p30 H.264 VAAPI at 10 Mbps**

as the practical sustained ceiling.

1080p60 at 12 Mbps may work, but it is not established by the supplied measurements. Bitrate itself is not the main thermal variable; resolution, frame rate, VM rendering, SPICE composition, browser sources, and GPU copies matter more.

A passing 60-minute test means:

- No OBS rendering or encoding lag.
- No unexplained local frame loss.
- No sustained swap activity.
- No worsening VM interaction latency.
- Stable clocks and temperatures rather than progressive degradation.
- A valid local recording with all expected audio tracks.
- Correct YouTube audio/video playback in a private test.

---

## 9. Later retrofit concerns

These should be recorded as future decisions, not added to the first setup.

- **Color/range:** Use Rec.709, NV12, and limited range consistently. A full/limited mismatch produces the classic washed-out capture. Test with known black and white content before publishing.
- **Fonts and overlays:** Decide the font family, size, safe margins, and title-card style before making many scenes. Prefer static image/text sources over animated browser overlays.
- **Vertical Shorts:** Plan a separate 1080×1920 profile and probably a separate scene collection. Do not distort the 16:9 VM layout to serve vertical content.
- **Replay Buffer:** Defer it. It adds encoder/storage pressure and may increase memory use.
- **Stream keys:** Treat the YouTube stream key as a password. Do not expose it in screenshots, exports, or tutorials. YouTube documents resetting compromised keys here: [Manage live stream settings](https://support.google.com/youtube/answer/9854503).
- **Backup recording during live:** Valuable, but validate it after the baseline because recording and streaming together may add encoder, disk, and audio-track load.
- **Latency:** Start with Normal latency for stability. Use Low latency when audience interaction matters. Ultra-low latency increases buffering sensitivity. See [YouTube latency guidance](https://support.google.com/youtube/answer/7444635).
- **Storage:** 10 Mbps consumes about 4.5 GB/hour. A CQP recording can be substantially larger, so the 109 GB free home space should be monitored before long recording sessions.

---

## Facts verified versus facts still needing proof

The supplied hardware facts are internally coherent and should be treated as authoritative. No supplied fact needs to be contradicted.

The following are incomplete for a final implementation decision:

1. Host `vainfo` proves GPU driver capability, but not that the selected OBS build exposes and initializes `h264_vaapi`.
2. The exact Debian OBS package build and enabled FFmpeg encoders have not been tested.
3. The actual Flatpak runtime version and installed permissions are unknown.
4. Swap occupancy is a snapshot; active swap pressure needs `vmstat 1` during a representative workload.
5. The Beelink chassis’s sustained temperature, fan curve, power limit, and SSD temperature are unknown.
6. The physical display scaling factor and exact usable `virt-viewer` content dimensions are not stated.
7. The VM’s actual PipeWire application stream name and routing behavior are unknown.
8. Network upload capacity and YouTube ingest stability are not supplied.

The cheapest validating sequence is:

1. Native OBS installation.
2. Confirm `FFmpeg VAAPI H.264` appears and initializes.
3. Configure one Xcomposite VM source at 1:1.
4. Configure Jabra mic plus PipeWire application capture.
5. Make a 10-minute local recording and inspect every audio track.
6. Run the complete 60-minute private test before publishing or streaming publicly.
