# BRIEF: OBS Studio production setup for the Beelink — research, not implementation

You are researching. Do NOT change anything on any machine. Output findings to STDOUT.

## The situation

Christopher produces YouTube content — both **live streams** and **recorded** video —
from a single Linux mini-PC ("the Beelink"). A KVM/QEMU virtual machine called
**SP-Alpha-Rig** runs on that same box and **must appear in frame** in the video: he
demonstrates the SP+ operating system by driving that VM while talking over it.

So the machine is simultaneously: the VM host, the capture source, the encoder, and
the streamer. That is the whole engineering tension in this brief. Everything you
recommend has to survive all four jobs happening at once.

He has never used OBS. He finds it confusing. He asked for a **plan first**, not a
config dump. Your findings feed that plan.

## MEASURED hardware and software facts (verified 2026-09-05 — do not re-derive, do not contradict without evidence)

| Fact | Value |
|---|---|
| CPU | AMD Ryzen 9 6900HX — 8 cores / 16 threads, max 4935 MHz |
| iGPU | AMD Radeon 680M (Rembrandt, `1002:1681`), Mesa 25.0.7 radeonsi, LLVM 19.1.7 |
| VAAPI **encode** (`VAEntrypointEncSlice`) | H.264 ConstrainedBaseline / Main / High; HEVC Main / Main10 |
| VAAPI **decode only** (`VAEntrypointVLD`) | AV1 Profile0 — **there is no AV1 encode entrypoint on this chip** |
| RAM | 30 GiB total. **15 GiB already in use, ~15 GiB available**, 3.4 GiB swap in use |
| VM allocation | SP-Alpha-Rig holds **12 vCPU and 12 GiB** of the above |
| OS | LMDE 7 "gigi", kernel 6.12.107+deb13-amd64 (Debian 13 base) |
| Desktop session | **X11**, Cinnamon (`Type=x11`, `Desktop=cinnamon`) — NOT Wayland |
| Displays | HDMI-A-0 primary **2560x1440 @ 59.95Hz**; total X screen 3640x1920 (dual head) |
| Audio | PipeWire 1.4.2 with the PulseAudio server API |
| Default sink/source | Jabra Evolve 65 **USB headset** (`iec958-stereo` out, `mono-fallback` in) |
| Other capture HW | Sonix "USB 2.0 Camera" (UVC webcam, has its own mic), 2x HD-Audio Generic |
| `v4l2loopback` | **not loaded, not installed** |
| OBS | **not installed** — neither native nor Flatpak |
| Disk | `/home` 458G, **109G free (75% used)**; `/` 457G, 332G free |
| VM display path | SPICE, software rendering (llvmpipe). virgl/SPICE-GL was tried and **rejected** — it breaks `virsh screenshot`. Do not recommend re-enabling it. |
| VM guest resolution | 1920x1080. Settled — Christopher has ruled this is enough. Do not propose raising it. |

## Questions — answer each explicitly, with a recommendation, not a survey

### 1. Install path: Flatpak vs. Debian repo vs. OBS PPA-equivalent
Which on LMDE 7 / Debian 13, given he needs **VAAPI hardware encoding** and likely
**plugins**? Address specifically: does the Flatpak get working VAAPI on radeonsi
without extra runtime extensions, and how do Flatpak's filesystem/portal sandbox
limits affect (a) capturing an X11 window belonging to virt-viewer, (b) reading
PipeWire audio, (c) writing recordings to `/home`. State the failure modes, not just
the happy path.

### 2. Capturing the VM window — the central question
The Rig is a SPICE window (`virt-viewer` / `virt-manager`) on the X11 desktop. Compare,
for **quality, CPU cost, and reliability**:
- OBS `xcomposite` Window Capture on the virt-viewer window
- Display Capture (`xshm`) of a region
- Any path that avoids the SPICE client round-trip entirely
Note: a 1920x1080 guest inside a window on a 2560x1440 screen will be **scaled**. Say
exactly how to avoid a soft, resampled-looking picture — what canvas/output resolution
and what OBS scale filter (bilinear/bicubic/Lanczos) — and whether he should size the
virt-viewer window to exactly 1:1 pixels.

### 3. Encoder settings — the hard constraint
The CPU is simultaneously running a 12-vCPU VM. Assume **only ~4 threads are truly free.**
- For **live streaming to YouTube**: VAAPI H.264 vs. x264. Give concrete OBS settings —
  resolution, fps, rate control (CBR/CQP/VBR), bitrate, keyframe interval, profile,
  B-frames, preset — and cite YouTube's own current ingest recommendations.
- For **local recording**: what to record in so it edits well and re-encodes once, not
  twice. Consider CQP VAAPI, and the container (`mkv` vs fragmented `mp4`) w.r.t. crash
  safety.
- Is HEVC encode useful here at all given YouTube ingest? Say plainly if it is not.
- Quantify roughly what headroom VAAPI buys over x264 on this specific part.

### 4. The RAM problem
15 GiB free with a 12 GiB VM already resident, and **3.4 GiB of swap already in use.**
Is that enough for OBS + browser + streaming? What actually breaks first, and what is
the earliest observable warning sign? Should the VM's 12 GiB be reduced during
production, and if so to what?

### 5. Audio routing — the part that silently ruins recordings
He needs, at minimum: his **mic** (Jabra headset), and **desktop/VM audio** as separate
tracks so they can be balanced in post. Under **PipeWire 1.4.2**, explain the concrete
setup — which OBS audio sources, how to get the VM's audio distinct from other desktop
audio, and how OBS multi-track recording maps to that. Flag the classic failure: mic
monitoring causing echo, and streaming a mix where his voice is buried.

### 6. Scene architecture for someone who finds OBS confusing
Propose a **small, named set of scenes** for this specific show (talking head + VM demo
+ transitions), and the **minimum** hotkeys. Bias hard toward few controls. Also cover
the Studio Mode question: does a solo operator want it on or off?

### 7. Live vs. recorded — what differs
What must change between the two modes, and is that better handled by OBS **profiles**,
**scene collections**, or both? Name the exact division.

### 8. Thermal and sustained-load reality
The 6900HX is a **45W mobile part in a mini-PC chassis.** What happens to a 60-minute
stream thermally, what should be monitored, and what is the practical fps/bitrate
ceiling for sustained work as opposed to a 5-minute benchmark?

### 9. Things to keep in mind for later — flag, do not solve
Anything with a long lead time or that would be expensive to retrofit: colour/levels
(limited vs full range, a classic washed-out-capture bug), fonts/overlays, vertical
9:16 Shorts from the same rig, replay buffer, stream keys and their handling, backup
recording during a live stream, YouTube latency modes.

## Rules of engagement

- **Cite sources** for anything version- or vendor-specific (OBS docs, YouTube Help,
  Mesa/radeonsi docs, Debian package state). Distinguish what you **verified** from
  what you **believe**.
- Where you are uncertain, say so explicitly and name the cheap experiment that would
  settle it. Do not present a guess in the register of a fact.
- Prefer **one clear recommendation with its rationale** over a menu of options.
- Call out anything in the measured-facts table above that you think is **wrong or
  incomplete**, and say what evidence would settle it.
- Length: thorough is fine, but every paragraph must carry a decision or a fact.
  No filler, no restating the brief back.
