# OUTPUT CONTRACT — READ FIRST

**Your reply IS the deliverable.** Write the full report as your final message.

- Do NOT reply with a status line. A previous run of this exact brief replied
  "No further action required." and was auto-rejected at 28 bytes. That is a
  failed dispatch regardless of how much work preceded it.
- Do NOT write the report to a file. Do NOT summarise. Do NOT ask to proceed.
- There is no VM to test in for this task and none is needed. This is desk
  research: read documentation and the web, then write the report.
- Expected length: several thousand words. Anything under 1500 bytes is rejected
  automatically by the harness.

# BRIEF: LLM-driven video editing of raw recordings — what is actually possible

Research only. Change nothing on any machine. Findings to STDOUT.

## The problem

Christopher records raw video — screen demos of an operating system, with a talking-head
camera and voice-over — and **has no time to edit it.** Editing is the bottleneck that
stops content shipping. He wants LLM agents to do the editing work, driven headlessly
from a harness, with him reviewing the result rather than operating a timeline.

This is NOT a request for "AI video generation." The footage is real and already shot.
The job is **cutting, assembling, captioning, and polishing existing recordings.**

## What already exists (do not re-invent this — build on it)

He runs a fleet of agent harnesses:
- **Claude Code** — head brain, tool-calling agent, runs shell, reads/writes files.
- **Pi / Luna** (you) — a 272K-context agent on the Beelink with shell and web access.
- Dispatch doctrine: the brief is a FILE, STDOUT is the findings channel, the artifact
  on disk is the evidence and never the exit code.

He also already has a **working automated shorts pipeline** (`~/work/sp-plus-shorts`):
- Drives a VM through a scripted scenario, capturing the screen.
- `spshorts-capture-raw` -> ffv1 lossless intermediate.
- Renders a vertical composition, then runs **quality gates** (`spshorts-verify`) —
  motion, crop-region checks, contact sheets, a pointer track.
- `spshorts-deliver` produces the final file; it has **deliberately no `--force`**,
  because a human reviews frame by frame before anything ships.
- Evidence for each run lands in `~/content/evidence/<name>-<stamp>/`.
- A separate uploader posts to YouTube **private only**; he flips public himself.

**A hard lesson from that pipeline, which must shape your answer:**
> All ten shorts passed every automated gate. Seven were then rejected by eye.
> **Gates prove not-empty; they never prove good.**

So any workflow you propose must assume automated checks are necessary but NOT
sufficient, and must keep a human review step that is cheap to perform.

## The machine

| Fact | Value |
|---|---|
| CPU | AMD Ryzen 9 6900HX, 8c/16t |
| GPU | Radeon 680M — **VAAPI H.264 and HEVC encode**, AV1 **decode only** |
| RAM | 30 GiB total, and a 10 GiB VM often resident |
| OS | LMDE 7 (Debian 13), kernel 6.12, **X11 + Cinnamon** |
| Audio | PipeWire 1.4.2 |
| Disk | ~109 GB free on /home |
| New footage | OBS -> **MKV, H.264 VAAPI CQP 18, 1920x1080p30, MULTI-TRACK audio** |

**The multi-track detail matters:** recordings carry track 1 = live mix, track 2 = mic
only, track 3 = VM/desktop audio only. An editing workflow that can exploit the isolated
voice track (for transcription, silence detection, levelling) has a real advantage.

## Questions

### 1. The landscape — what are the actual options?
Survey and then RECOMMEND. Cover at least:
- **Programmatic/CLI editing an agent can drive**: ffmpeg pipelines, MoviePy, `auto-editor`,
  `ffmpeg-python`, melt/MLT, and the OpenTimelineIO (OTIO) interchange format.
- **NLE automation**: Can Kdenlive, Shotcut, or DaVinci Resolve be driven headlessly or
  scripted on Linux? Resolve has a Python API — does it work headless, and is the free
  version usable for this? Be concrete about what actually works versus what is claimed.
- **Transcript-driven editing** (edit the text, the video follows): what exists that is
  self-hostable or Linux-native?
- **Whisper-family ASR** for transcription/subtitles — which implementation on this
  hardware (whisper.cpp, faster-whisper, WhisperX), CPU vs the 680M, realistic speed,
  and word-level timestamps for caption burn-in.

### 2. The architecture — how should an LLM actually be in the loop?
This is the core question. Compare, with a clear recommendation:
- **(a) LLM writes an edit decision list (EDL/OTIO/JSON), a deterministic renderer executes it.**
- **(b) LLM directly writes and runs ffmpeg commands each time.**
- **(c) LLM drives a GUI NLE via automation.**
- **(d) Something else you identify.**

For the recommended one, specify the **data contract** — what exactly the LLM emits, what
validates it, and what renders it. Address determinism, reproducibility, and how a bad
edit is caught before it wastes a 20-minute render.

Bias strongly toward: the LLM makes DECISIONS, deterministic tooling does EXECUTION.
Justify if you disagree.

### 3. What can an LLM genuinely judge, and what can it not?
Be honest and specific. Where can a model add real value —
silence/filler removal, chapter detection, pacing, choosing highlights, writing titles,
descriptions, chapter markers, caption styling, B-roll placement, detecting mistakes and
retakes in the raw footage?

And where will it fail or hallucinate — visual aesthetics, timing feel, whether a joke
landed, whether a demo step is actually legible on screen?

**Can a model even SEE the footage?** Address frame sampling into a vision model,
what cadence is affordable, and what that does and does not reveal. Separate what is
possible today from what is marketing.

### 4. The concrete pipeline
Propose an end-to-end flow for: raw multi-track MKV in -> finished YouTube video out.
Name the tool at each stage, what the LLM does at each stage, where the human reviews,
and roughly how long each stage takes on THIS hardware. Include how the existing
gates-and-evidence pattern should extend to this.

### 5. Hardware reality
Encoding uses VAAPI. But what about the CPU-bound parts — ASR, scene detection, silence
detection, frame sampling? What is realistic for, say, a **60-minute source recording** on
this machine, and what would the wall-clock actually be? Flag anything that would need
to run overnight.

### 6. Cost and self-hosting
Prefer **free and self-hostable**. Where a paid API (a hosted ASR, a vision model) is
genuinely better, say so and give the rough per-hour-of-video cost so he can judge. Do
not silently assume a subscription.

### 7. Things to keep in mind — flag, do not solve
Anything expensive to retrofit: project/asset naming and directory layout · keeping the
raw footage archived versus disk burn · reproducibility of an edit months later ·
captions/accessibility · YouTube chapters · thumbnails · music licensing · whether this
should eventually run on a schedule unattended.

## Rules of engagement

- **Cite sources**, and prefer current documentation and real Linux user reports over
  blog listicles. Note version numbers and dates — this space moves fast and stale advice
  is worse than none.
- **Separate VERIFIED from BELIEVED.** If you have not confirmed a tool does something,
  say so and name the cheap experiment that would settle it.
- Call out anything that looks impressive in a demo but breaks on a real 60-minute
  recording.
- One clear recommendation per question. Give the reasoning, not a menu.
- If you think the entire premise is wrong — that this should not be LLM-driven at all,
  or that a much simpler deterministic tool solves 80% of it — **say that plainly.**
  A well-argued "you do not need an LLM for most of this" is a valuable finding, not a
  failure to answer.
