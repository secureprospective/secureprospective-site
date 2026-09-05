# LLM-driven editing of raw recordings: what is actually possible

## Executive decision

Build a **headless, deterministic editing compiler**. The LLM should select and explain edits in a validated JSON plan; deterministic code should convert that plan into an edit timeline and execute FFmpeg. Use OTIO as an interchange/export format, not as the only internal contract.

Do **not** make the LLM write arbitrary FFmpeg commands, and do not make a GUI NLE the primary automation surface.

The practical stack is:

1. `ffprobe` and FFmpeg for ingest, stream selection, audio extraction, rendering, captions, loudness, and QC.
2. `whisper.cpp` as the first local ASR implementation, with AVX2 CPU inference and an experimentally enabled Vulkan backend for the Radeon 680M.
3. PySceneDetect or FFmpeg scene metrics for visual boundaries, used as evidence rather than authority.
4. A strict project/edit JSON schema, validated by Python or Rust.
5. An LLM for semantic decisions: what to keep, what to remove, what chapters to propose, which segments are possible highlights, and what captions or metadata to draft.
6. A low-resolution preview and human review before the final render.
7. Existing gates-and-evidence discipline extended to the full video pipeline.

The most important conclusion is that **an LLM is not needed for most mechanical editing**. Silence detection, audio levelling, caption timing, frame extraction, stream mapping, and rendering are deterministic problems. The LLM earns its cost by making editorial decisions over transcript, analysis data, and selected frames.

---

# 1. Landscape

## 1.1 FFmpeg

### Verified capability

FFmpeg directly supports the operations needed here:

- explicit stream mapping with `-map`;
- trimming and concatenation;
- audio filters such as `silencedetect`, `silenceremove`, `loudnorm`, `afade`, and `amix`;
- video filters such as `scale`, `crop`, `overlay`, `drawtext`, `subtitles`, `select`, and `scdet`;
- subtitle rendering through libass;
- VAAPI encoding using `h264_vaapi`;
- frame extraction and contact-sheet generation;
- machine-readable probing with `ffprobe`.

FFmpeg’s own documentation distinguishes stream copy from transcoding. Stream copy is fast and lossless but cannot apply filters and is not reliably frame-accurate for arbitrary cuts. FFmpeg seeks to the nearest keyframe when possible; with stream copy, the pre-roll before the requested position can remain in the output. Accurate transcript-based cuts, overlays, captions, scaling, and audio normalization therefore require decoding and re-encoding. [FFmpeg documentation](https://www.ffmpeg.org/ffmpeg.html)

FFmpeg’s concat demuxer requires compatible streams and depends on correct duration metadata. For a single recording with multiple selected source ranges, a generated filtergraph or a sequence of normalized intermediate clips is safer than assuming arbitrary MKV segments will concatenate perfectly. [FFmpeg formats documentation](https://www.ffmpeg.org/ffmpeg-formats.html)

`silencedetect` is useful for producing evidence, not for deciding editorially. It reports silence when the signal remains below a threshold for a configured duration. Its default threshold is approximately -60 dB and its default duration is two seconds; both are unsuitable as universal settings for speech recordings. [FFmpeg filters documentation](https://ffmpeg.org/ffmpeg-filters.html)

### Recommendation

Use FFmpeg as the execution engine, but never expose arbitrary shell construction to the LLM. Generate commands from a validated internal plan.

The compiler should always use explicit stream mappings. In this case, that means treating the OBS recording as:

- `0:a:0`: live mix;
- `0:a:1`: microphone-only;
- `0:a:2`: VM/desktop audio-only.

Those indices must be confirmed with `ffprobe`, because human track numbering and FFmpeg stream numbering are not interchangeable.

A typical ingest probe should collect:

```text
container format and duration
video stream index, codec, dimensions, frame rate, time base, start time
all audio stream indices, codec, sample rate, channel layout, language
attachments, metadata, rotation/display matrix
```

The mic-only track should be used for ASR, silence analysis, filler detection, and speech levelling. The final mix can either retain OBS’s live mix or be reconstructed from the isolated mic and desktop tracks. Reconstructing gives more control, but it also creates more opportunities for audio mistakes.

---

## 1.2 MoviePy

### Verified capability

MoviePy is a Python video-editing library. It handles clips, cuts, concatenation, titles, overlays, and custom effects. Its transformations are lazy: most work occurs during final rendering. It uses FFmpeg underneath and represents frames as NumPy arrays. [MoviePy documentation](https://zulko.github.io/moviepy/index.html)

MoviePy’s own documentation says that directly calling FFmpeg is preferable when the task is conversion or simple media processing because FFmpeg is faster and more memory-efficient. Its frame iteration APIs are intended more for computer vision and frame treatment than for high-performance editing. [MoviePy quick presentation](https://zulko.github.io/moviepy/getting_started/quick_presentation.html)

### Recommendation

Do not use MoviePy as the primary renderer.

It is reasonable for:

- a small custom analysis script;
- generating a simple contact sheet;
- prototyping an effect;
- producing an unusual image sequence.

It is the wrong abstraction for a 60-minute, multi-track, deterministic editorial pipeline. A Python compiler can calculate ranges and generate FFmpeg arguments without passing every video frame through Python.

---

## 1.3 `ffmpeg-python`

### Verified capability

`ffmpeg-python` constructs FFmpeg command lines and filter graphs from Python. It supports complex filter graphs and can print the generated command. It does **not** bundle, install, or validate the FFmpeg binary. [ffmpeg-python README](https://github.com/kkroening/ffmpeg-python)

### Recommendation

Use it only if its graph-building syntax materially improves maintainability. A direct `subprocess.run()` wrapper with argument arrays is likely clearer for this project because:

- every argument remains visible;
- no shell interpolation is required;
- command lines can be logged exactly;
- output can be captured;
- the compiler can generate a stable manifest alongside the command.

The important distinction is that `ffmpeg-python` is a command-builder, not an editing engine or a safety boundary.

---

## 1.4 `auto-editor`

### Verified capability

Auto-Editor is a CLI tool that analyzes audio loudness and motion, cuts inactive regions, changes speed, adds margins, and exports projects for Premiere, Resolve, Shotcut, and Kdenlive. It can also export its own timeline formats:

- v1: simple linear cuts and speeds;
- v2: linear cuts with action groups;
- v3: layered JSON-based timelines supporting multiple video and audio layers.

Its current documentation supports:

```bash
auto-editor input.mp4 --preview
auto-editor input.mp4 --export v3 -o timeline.v3
auto-editor timeline.v3 -o output.mkv
```

The v3 schema has source paths, rational timebase, source offsets, durations, tracks, layers, transitions, and effects. [Auto-Editor v3 format](https://auto-editor.com/docs/v3)

Auto-Editor also exports `.mlt`, `.kdenlive`, `.fcpxml`, and other editor formats. [Auto-Editor cookbook](https://auto-editor.com/docs/cookbook)

### Limitations

Auto-Editor’s default strengths are audio activity, motionlessness, and simple action rules. It does not understand whether a screen demonstration is correct, whether a joke worked, or whether a repeated take is editorially preferable.

A project discussion specifically describes the difficulty of applying the same cut list to separate screen and camera streams. The workaround was to give both streams the same audio or process them independently. That problem is less severe for Christopher’s OBS recording because the video is already composed, but it confirms that multi-stream assumptions need to be tested rather than inferred. [Auto-Editor discussion #710](https://github.com/WyattBlue/auto-editor/discussions/710)

The project is also moving quickly. Its 30.0.0 release notes mention that some releases may require license keys even though the CLI remains open source. Pin an exact version and test it before making it a production dependency. [Auto-Editor 30.0.0 release](https://github.com/WyattBlue/auto-editor/releases/tag/30.0.0)

### Recommendation

Use Auto-Editor as a **candidate analyzer and benchmark**, not as the canonical project format.

It is useful for:

- producing a first silence-cut proposal;
- comparing its cuts with Christopher’s desired pacing;
- generating a rough preview;
- quickly testing whether an edit is mostly dead air;
- exporting to an existing NLE when a human wants to continue manually.

The production source of truth should remain Christopher’s own schema, with the source hash and exact tool versions recorded.

---

## 1.5 MLT and `melt`

### Verified capability

MLT is a multitrack media framework. It supports producers, playlists, tractors, filters, transitions, XML project files, and command-line rendering. `melt` can author, inspect, serialize, and render MLT compositions. [MLT framework documentation](https://www.mltframework.org/docs/framework/) [Melt documentation](https://www.mltframework.org/docs/melt/)

Kdenlive and Shotcut use MLT. MLT XML represents multitrack arrangements and references external media rather than containing the media itself. [MLT XML documentation](https://www.mltframework.org/docs/mltxml/)

### Recommendation

Use MLT only when one of these is required:

- a Kdenlive/Shotcut project must be handed to a human;
- a complex multitrack composition is easier to express in MLT;
- a future review UI is already built around MLT.

For this use case, FFmpeg is simpler for:

- source-range cuts;
- a composed OBS video;
- caption burn-in;
- audio selection and normalization;
- deterministic renders;
- machine-readable execution logs.

MLT has more editorial power but a less direct command model. Its properties use MLT syntax rather than ordinary FFmpeg syntax, and options copied from an FFmpeg command do not necessarily mean the same thing in `melt`.

---

## 1.6 OpenTimelineIO

### Verified capability

OpenTimelineIO is an API and interchange format for editorial cut information. It represents timelines, tracks, clips, gaps, transitions, source ranges, and metadata while referring to external media. It is not a media container and it does not itself render the video. [OTIO documentation](https://opentimelineio.readthedocs.io/en/stable/)

OTIO has adapters for formats including Final Cut Pro XML, AAF, CMX 3600 EDL, and others. Conversion can be lossy, especially for effects and application-specific metadata.

### Recommendation

Use OTIO as an **export and interchange layer**, not as the only internal contract.

The internal JSON should explicitly capture things OTIO may not preserve consistently across adapters:

- caption styling;
- source stream selection;
- required audio track roles;
- source hashes;
- analysis evidence;
- confidence and review state;
- renderer settings;
- project policy;
- human decisions;
- exact tool versions.

The compiler can produce OTIO after validation, or use OTIO as a secondary representation for opening the cut in Kdenlive or another editor.

---

# 2. NLE automation on Linux

## 2.1 Kdenlive

### Verified capability

Kdenlive project files are XML based on MLT. MLT can render Kdenlive project files directly, ignoring Kdenlive-only UI metadata and using the underlying MLT timeline. [Kdenlive project file documentation](https://docs.kdenlive.org/en/project_and_asset_management/file_management/project_files.html)

Kdenlive can generate render scripts. Those scripts can be run later using `melt`, including in batch or overnight workflows. [Kdenlive rendering documentation](https://docs.kdenlive.org/en/exporting/render.html)

Kdenlive also has a `kdenlive_render` helper that renders a project detached from the main application. Its source shows that it creates a full Qt `QApplication`. The source explicitly says that some modules require a virtual display for headless rendering. [Kdenlive renderer source](https://github.com/KDE/kdenlive/blob/4f615d96/renderer/kdenlive_render.cpp)

### What actually works

- Rendering a prepared MLT project through `melt`: yes.
- Generating a project with XML: technically possible, but the format is not a stable high-level public authoring API.
- Launching Kdenlive itself as a reliable headless service: no.
- Using the GUI as an agent surface: brittle and inappropriate here.

### Recommendation

Use Kdenlive only as an optional human conform/review target. Generate a project for it if useful, but do not make it the production renderer.

---

## 2.2 Shotcut

### Verified capability

Shotcut projects are MLT XML. Shotcut documents command-line export using `melt`, for example:

```bash
LC_ALL=C melt project.mlt -consumer avformat:export.mp4
```

The Shotcut documentation warns that export properties are MLT consumer properties, not ordinary FFmpeg command-line options. It also recommends `LC_ALL=C` to prevent locale-dependent numeric parsing. [Shotcut command-line export](https://forum.shotcut.org/t/export-at-the-command-line/44067)

Shotcut can export an MLT job file from its GUI, after which `melt job.xml` can render it without opening Shotcut. [Shotcut batch rendering](https://forum.shotcut.org/t/batch-rendering-videos-without-gui/38615)

### Headless limitations

Shotcut’s plain MLT/melt rendering works for many projects. Qt-based services such as certain text, visualization, or crop filters may require a display server. A Shotcut forum response specifically mentions `xvfb-run` for some Qt services. That is unsuitable for this daily-driver machine and would only be appropriate on a dedicated render host.

### Recommendation

Shotcut is the most plausible GUI-adjacent Linux target among the listed NLEs because its underlying MLT job can be rendered with `melt`. It is still not the recommended core. Use it to hand a project to a human, not to drive editorial decisions through the GUI.

Third-party projects claiming MCP-driven Shotcut editing should be treated as unverified until tested against a real multi-track OBS MKV and a long render.

---

## 2.3 DaVinci Resolve

### Verified capability

DaVinci Resolve documents a `-nogui` launch mode in which the UI is disabled while scripting APIs continue to work. [Resolve scripting documentation](https://wiki.dvresolve.com/developer-docs/scripting-api)

Resolve also has Python and Lua APIs for projects, media pools, timelines, and rendering. Resolve must be running for the API connection to exist; this is not equivalent to a simple stateless `ffmpeg` command. The API is controlled through an application process and is therefore sensitive to version, database, licensing, environment, and application state.

External scripting is a Studio feature. The free version can run scripts from its internal console or menu, but it is not suitable for an external harness controlling Resolve. [Blackmagic forum: external scripting](https://forum.blackmagicdesign.com/viewtopic.php?f=21&t=87567)

### Linux-specific problems

Resolve Free on Linux does not support H.264/H.265 media import according to Blackmagic support responses. Resolve on Linux also has long-standing AAC limitations. The OBS source here is H.264 with multiple audio tracks, so this is a direct incompatibility risk. [Blackmagic forum: H.264/H.265 on Linux Free](https://forum.blackmagicdesign.com/viewtopic.php?f=21&t=111085)

Blackmagic’s official Linux environment is primarily Rocky Linux plus supported discrete GPU configurations. A Debian-based system with an AMD integrated GPU is outside the safest supported path. [Resolve on Linux discussion](https://forum.blackmagicdesign.com/viewtopic.php?f=21&t=194581)

### What actually works

- Resolve Free as a human NLE: potentially, after transcoding to a compatible intermediate.
- Resolve Free as an external headless agent target: no.
- Resolve Studio with `-nogui` and external Python: documented and possible, but stateful and license-dependent.
- Stateless command-line rendering from an arbitrary project without Resolve running: no.
- Reliable operation on this Beelink with the OBS MKV directly: not established and not recommended.

### Recommendation

Do not buy or deploy Resolve solely for this automation project.

If Resolve Studio is already available elsewhere, generate FCPXML/OTIO for human conform. Keep FFmpeg as the production render engine. Resolve is an optional endpoint, not the architecture.

---

# 3. Transcript-driven editing and ASR

## 3.1 Transcript-first tools

There are several self-hostable or Linux-capable projects:

- **Prune**: self-hosted, transcript-first web editor using Docker, FFmpeg, transcript cuts, preview, and NLE exports. [Prune](https://github.com/SloPOS/Prune/)
- **CutScript**: local-first Electron/FastAPI/WhisperX/FFmpeg editor with word-level editing and acoustic boundary refinement. [CutScript](https://github.com/juangrukat/CutScript)
- **Toaster**: local transcript-first editor with a Tauri/Rust/React stack and FFmpeg export. [Toaster](https://github.com/itsnotaboutthecell/toaster)
- **Kerf**: a newer editor exposing its editing engine to an embedded MCP server. [Kerf](https://github.com/OrellBuehler/kerf/blob/main/README.md)

### Verified versus believed

Their READMEs establish that the projects exist and describe the advertised architecture. They do not establish production reliability for:

- a 60-minute 1080p OBS MKV;
- three audio tracks;
- exact caption projection through cuts;
- long-running unattended exports;
- preservation of source timestamps;
- recovery from malformed media;
- compatibility with this Beelink.

They should be considered prototypes or candidates for a later review surface, not assumed infrastructure.

### Recommendation

Do not adopt a full transcript-first GUI initially. The required editing surface can be much smaller:

- transcript JSON;
- source-linked words;
- proposed keep/delete ranges;
- a list of boundary previews;
- a low-resolution preview video;
- accept/reject controls.

That review surface can be added after the deterministic compiler works. A transcript editor is useful, but it is not required for the first production pipeline.

---

## 3.2 Whisper-family implementations

### OpenAI Whisper

The reference Python implementation supports transcription, translation, and word timestamps. Its models range from tiny through large and turbo. The published table estimates approximately:

| Model | Parameters | Approximate VRAM |
|---|---:|---:|
| tiny | 39M | 1 GB |
| base | 74M | 1 GB |
| small | 244M | 2 GB |
| medium | 769M | 5 GB |
| large | 1.55B | 10 GB |
| turbo | 809M | 6 GB |

Those figures are for GPU-oriented use and do not directly describe RAM requirements on an integrated GPU. The reference implementation’s speed figures were measured on an A100 and should not be applied to the Beelink. [OpenAI Whisper README](https://github.com/openai/whisper)

### `whisper.cpp`

`whisper.cpp` is the best first fit for this machine.

Verified capabilities include:

- x86 AVX/AVX2 CPU inference;
- quantized models;
- CPU-only operation;
- Vulkan;
- AMD ROCm;
- VAD;
- JSON, CSV, SRT, VTT, and word output;
- experimental word-level timestamps using `-ml 1`.

[whisper.cpp README](https://github.com/ggml-org/whisper.cpp)

The project has demonstrated Vulkan inference on integrated AMD graphics. A reported Vulkan regression affecting integrated GPUs in version 1.8.0 was fixed in 1.8.1. This is evidence that the general path is viable, not proof that the exact Radeon 680M and current Mesa stack will work without testing. [Vulkan issue #3455](https://github.com/ggml-org/whisper.cpp/issues/3455)

The exact repository and release pages currently show multiple active version lines. Pin the exact release or commit and record:

```text
whisper.cpp version or commit
model filename and checksum
compiler
Vulkan enabled/disabled
number of threads
beam size
VAD model and checksum
Mesa/kernel version
```

### `faster-whisper`

`faster-whisper` uses CTranslate2. It is substantially faster than the reference Python Whisper on many systems, supports CPU INT8, and supports word timestamps:

```python
segments, _ = model.transcribe(
    "audio.wav",
    word_timestamps=True
)
```

Its published CPU benchmark for the small model used an Intel i7-12700K. The benchmark is not transferable to the 6900HX. [faster-whisper README](https://github.com/SYSTRAN/faster-whisper)

Officially documented GPU use is primarily CUDA. Recent CTranslate2 work discusses AMD ROCm support, but the setup is more fragile than CPU or whisper.cpp Vulkan, and the Radeon 680M is not a sensible first ROCm target.

### WhisperX

WhisperX combines:

1. VAD segmentation;
2. faster-whisper transcription;
3. wav2vec2 forced alignment;
4. optional pyannote speaker diarization.

It is valuable when exact word boundaries matter. Its paper and README explain that Whisper’s native timestamps are utterance-level and can drift, while forced alignment produces more precise word-level timings. [WhisperX GitHub](https://github.com/m-bain/whisperX) [WhisperX paper](https://www.robots.ox.ac.uk/~vgg/publications/2023/Bain23/bain23.pdf)

WhisperX has more dependencies, generally expects CUDA for its fast path, requires a language-specific alignment model, and adds memory and processing stages. On this hardware it is a fallback, not the baseline.

## ASR recommendation

Use this order:

1. `whisper.cpp` with a quantized `small.en` or `medium.en` model.
2. Test its Vulkan backend on a five-minute representative OBS recording.
3. Fall back to AVX2 CPU if Vulkan is unstable or steals too much memory from the resident VM.
4. Use WhisperX only if caption word timing from whisper.cpp is visibly inadequate.
5. Use hosted ASR only when local transcription time or accuracy is unacceptable.

For ordinary English talking-head recordings, `small.en` is the sensible starting point. The LLM can correct obvious transcript spelling in a separate editorial copy, but the original ASR word timings must remain immutable.

---

# 4. What the LLM can and cannot judge

## 4.1 Strong use cases

### Silence and filler removal

Silence detection is deterministic. The LLM should not be asked to listen to the entire audio and invent timestamps.

The LLM can add value by deciding:

- whether a pause is rhetorically intentional;
- whether a repeated filler should remain for natural delivery;
- whether the cut should be conservative or aggressive;
- whether a long pause is caused by waiting for the VM.

The audio analyzer should provide RMS, VAD, silence intervals, and mic-track evidence. The LLM chooses among those candidate intervals.

### Chapters

The LLM is good at proposing chapter titles from a grounded transcript. Every proposed chapter should include:

```text
source word range
source timestamp
proposed title
evidence excerpt
confidence
```

The compiler recalculates final output timestamps after cuts.

YouTube’s manual chapter rules require the first timestamp to be `00:00`, at least three timestamps in ascending order, and chapters of at least ten seconds. [YouTube chapters](https://support.google.com/youtube/answer/9884579)

### Titles, descriptions, and metadata

This is a strong use case if the LLM is constrained to the transcript and project brief. It should draft, not publish. The uploader should remain private-only, as it is now.

### Caption styling and segmentation

The LLM can choose a style:

- ordinary accessibility captions;
- two-line subtitles;
- word-punch captions;
- emphasis on technical terms.

The renderer must enforce:

- maximum characters per line;
- maximum lines;
- minimum and maximum cue duration;
- no overlapping cues;
- safe margins;
- readable contrast;
- correct output-time projection.

The LLM should never be trusted to emit final subtitle timecodes without deterministic validation.

### Highlight candidates

The LLM can rank candidates from:

- transcript novelty;
- problem/solution structure;
- strong opening sentence;
- audience relevance;
- audio energy;
- scene changes;
- frame evidence.

It should return several candidates with reasons rather than one supposedly definitive “best” clip.

### Retakes and mistakes

The system can find likely retakes using:

- repeated transcript phrases;
- “start over”, “sorry”, “let me redo that”;
- sudden changes in audio level;
- transcript confidence drops;
- near-duplicate visual sequences;
- long unexplained pauses;
- abrupt screen changes.

This is candidate detection only. It cannot prove that one take is wrong.

### B-roll placement

The LLM can place supplied assets where the transcript refers to a concept, provided it is given an asset catalog with descriptions and allowed time ranges. It should not invent B-roll files or silently download copyrighted media.

---

## 4.2 Weak use cases

The LLM will often fail at:

- whether a cut feels natural at the exact frame;
- whether a joke landed;
- whether a pause is emotionally important;
- whether the talking-head crop is flattering;
- whether a screen demo is legible at YouTube playback size;
- whether a pointer movement is distracting;
- whether the final audio sounds tiring;
- whether a transition is visually tasteful;
- whether a demo step actually succeeded;
- whether an apparent retake was intentional.

These are precisely the failures that explain why seven of ten technically passing shorts were rejected by eye.

The correct design is not “make the model better until it never fails.” The correct design is to ensure that its failures are cheap to discover and cheap to undo.

---

## 4.3 Can the model see the footage?

Yes, but only when the harness supplies visual representations.

There are three different cases:

1. **Transcript only**: the model cannot know what is on screen.
2. **Sampled frames**: the model can inspect appearance, layout, text, cursor position, and obvious visual defects at selected times.
3. **Video-capable hosted model**: the model may receive a video, but the provider samples it internally and charges for the resulting audio/video tokens. That still does not give human-like continuous editorial perception.

For local processing, use FFmpeg to produce:

- one frame every 10 seconds for an initial visual index;
- scene-boundary frames;
- frames around candidate cuts;
- denser samples around suspected mistakes;
- contact sheets with timestamps printed into the image.

A 60-minute recording sampled every ten seconds produces 360 frames. Sampling every five seconds produces 720. Sampling every second produces 3,600 frames and is usually wasteful for initial editorial analysis.

A frame every ten seconds can reveal:

- whether the recording is black;
- whether the screen changes;
- whether the camera is frozen;
- whether the cursor or overlay is present;
- whether major screen sections are visible.

It cannot reveal:

- a two-second cursor jump between samples;
- a brief visual glitch;
- timing between speech and screen action;
- whether a cut feels smooth;
- exact caption readability throughout the video.

Use dense sampling only around edit boundaries and high-risk segments.

---

# 5. Architecture comparison

## (a) LLM emits an edit plan; deterministic renderer executes it

### Strengths

- reproducible;
- testable;
- auditable;
- safe against shell injection;
- easy to preview;
- easy to compare revisions;
- independent of the chosen renderer;
- can target FFmpeg, MLT, OTIO, or Resolve later.

### Weaknesses

- requires a schema and compiler;
- requires thought about timebases and source ranges;
- initial implementation is more work than prompting an LLM for a command.

### Decision

**Recommended.**

---

## (b) LLM directly writes FFmpeg commands

### Strengths

- fast to prototype;
- useful for one-off experiments;
- no intermediate schema required.

### Weaknesses

- command syntax errors;
- wrong stream selected;
- shell quoting and injection risk;
- accidental overwrite;
- inconsistent encoder settings;
- poor reproducibility;
- hard to distinguish an editorial error from a renderer error;
- no reliable source-to-output mapping;
- LLM may issue a technically valid command with an aesthetically bad result.

### Decision

Reject as the production architecture. Permit only inside a tightly sandboxed development tool, never as the normal path.

---

## (c) LLM drives a GUI NLE

### Strengths

- human-friendly review;
- access to mature editing features;
- timeline can be inspected visually.

### Weaknesses

- requires a graphical session;
- stateful application behavior;
- brittle UI automation;
- version-dependent menus and widgets;
- difficult recovery after crashes;
- difficult reproducibility;
- Resolve licensing and Linux codec issues;
- GUI automation does not solve editorial judgment.

### Decision

Reject as the headless production architecture. Use an NLE as an optional human review/conform target.

---

## (d) Hybrid transcript-and-evidence compiler

This is the recommended refinement of (a):

1. deterministic analyzers generate facts;
2. LLM ranks or selects among facts;
3. validator compiles the selection;
4. preview renderer exposes the result;
5. human approves or rejects;
6. final renderer executes the approved plan.

This keeps the LLM at the decision layer and puts all irreversible work behind validation and review.

---

# 6. Recommended data contract

The LLM must never emit shell commands or arbitrary filesystem paths.

It should receive stable asset IDs and source-time evidence, then emit a JSON object conforming to a strict schema. `additionalProperties` should be forbidden.

A representative contract:

```json
{
  "schema": "edit-plan/v1",
  "project_id": "recording-2026-04-001",
  "source": {
    "asset_id": "raw-001",
    "sha256": "SOURCE_HASH",
    "duration_seconds": 3600.12,
    "video_timebase": "30/1",
    "video_stream_id": "v0",
    "audio_roles": {
      "mix": "a0",
      "mic": "a1",
      "desktop": "a2"
    }
  },
  "policy": {
    "style": "conservative",
    "minimum_pause_seconds": 0.35,
    "boundary_handle_seconds": 0.18,
    "never_cut_words": true,
    "allow_reordering": false,
    "allow_unverified_broll": false
  },
  "decisions": [
    {
      "id": "decision-001",
      "action": "remove",
      "source_start_frame": 8124,
      "source_end_frame": 8190,
      "reason": "long_pause",
      "evidence": [
        {
          "type": "audio_silence",
          "start_seconds": 270.80,
          "end_seconds": 273.00
        }
      ],
      "confidence": 0.94
    }
  ],
  "keep_ranges": [
    {
      "source_start_frame": 0,
      "source_end_frame": 8124
    }
  ],
  "audio": {
    "source_role": "mix",
    "mic_analysis_role": "mic",
    "desktop_gain_db": 0.0,
    "mic_gain_db": 0.0,
    "loudness_target_i": -14.0,
    "true_peak_limit": -1.0
  },
  "captions": {
    "enabled": true,
    "style": "accessible_two_line",
    "source_transcript_id": "transcript-001"
  },
  "metadata": {
    "title": "DRAFT",
    "description": "DRAFT",
    "chapters": []
  }
}
```

The production schema should also support:

- overlays;
- alternate audio roles;
- explicit rejected ranges;
- human overrides;
- source word IDs;
- output asset IDs;
- caption style parameters;
- per-decision evidence;
- model name and model version;
- plan revision;
- review state.

The LLM should preferably emit **keep ranges**, not a sequence of raw output timestamps. The compiler computes output positions by concatenating source ranges. This prevents drift and makes source provenance explicit.

## Validation stages

Before any long render:

1. **JSON Schema validation**
   - required keys;
   - enum values;
   - numeric types;
   - no unknown keys.

2. **Source validation**
   - source hash matches;
   - asset IDs exist;
   - stream IDs exist;
   - timebase matches the probe.

3. **Interval validation**
   - start < end;
   - no out-of-bounds ranges;
   - no accidental overlap;
   - no empty output;
   - no excessive cut density;
   - no source range crossing a forbidden boundary.

4. **Editorial policy validation**
   - preserve handles around speech;
   - do not cut inside words unless explicitly allowed;
   - enforce minimum retained clip length;
   - reject cuts that remove every frame of a required section;
   - enforce chapter ordering.

5. **Renderer compilation**
   - generate deterministic FFmpeg arguments/filtergraph;
   - generate OTIO or MLT as a secondary artifact;
   - calculate expected output duration;
   - calculate expected frame count;
   - record selected audio streams.

6. **Preview render**
   - render boundary snippets;
   - render a low-resolution full preview;
   - run automated QC;
   - human reviews.

7. **Final render**
   - only after review approval;
   - no overwrite/force flag;
   - output is written to a new delivery path.

The plan, compiler version, source hash, transcript hash, analysis parameters, renderer command, and review decision should all be retained in the evidence bundle.

---

# 7. Concrete end-to-end pipeline

## Stage 0: ingest and archive

Input:

```text
OBS MKV, H.264 VAAPI, 1920x1080p30, three audio tracks
```

Actions:

- verify the file exists and is complete;
- calculate SHA-256;
- run `ffprobe`;
- record all stream metadata;
- preserve the original MKV untouched;
- extract the mic track to 16 kHz mono PCM or FLAC for ASR;
- extract or retain the mix and desktop tracks for final audio.

The original recording should never be edited in place.

## Stage 1: deterministic analysis

Tools:

- FFmpeg/FFprobe;
- FFmpeg `silencedetect`, `astats`, or a small RMS analyzer;
- Silero VAD through whisper.cpp or a dedicated VAD;
- PySceneDetect 0.7.x or FFmpeg `scdet`;
- FFmpeg frame extraction;
- existing pointer and contact-sheet tools from the shorts pipeline.

Outputs:

```text
probe.json
audio-analysis.json
vad.json
scene-candidates.json
frames/
contact-sheet.jpg
transcript-input.flac
```

PySceneDetect supports content, adaptive, threshold, histogram, and perceptual-hash detectors. It recommends downscaling for performance and warns that frame skipping reduces frame-accurate boundary detection. [PySceneDetect documentation](https://www.scenedetect.com/docs/latest/)

For screen recordings, scene detection is weak evidence. A desktop animation, cursor movement, window redraw, or scrolling page can look like a scene cut. Use it to propose candidate boundaries, not to cut automatically.

## Stage 2: transcription

Preferred first implementation:

```text
whisper.cpp
quantized small.en or medium.en
mic-only audio
word timestamps enabled
VAD enabled after a baseline test
```

Output:

```json
{
  "transcript_version": "1",
  "source_audio_sha256": "…",
  "asr_engine": "whisper.cpp",
  "asr_version": "PINNED_VERSION",
  "model": "PINNED_MODEL",
  "language": "en",
  "segments": [
    {
      "id": "seg-0001",
      "start": 12.30,
      "end": 17.82,
      "text": "…",
      "words": [
        {
          "id": "word-0001",
          "text": "…",
          "start": 12.30,
          "end": 12.58,
          "confidence": 0.91
        }
      ]
    }
  ]
}
```

Never overwrite this raw transcript with an LLM-cleaned transcript. Store editorially corrected text as a separate layer.

## Stage 3: LLM planning

The LLM receives:

- transcript text and word IDs;
- silence/VAD ranges;
- scene candidates;
- audio statistics;
- selected frame contact sheets;
- project instructions;
- prior accepted/rejected edit examples;
- constraints and output schema.

The LLM returns:

- proposed keep/delete ranges;
- reasons and evidence;
- confidence;
- possible chapters;
- title and description drafts;
- caption style;
- highlight candidates;
- uncertain decisions requiring human attention.

It should not see or invent direct shell paths.

## Stage 4: compile

The compiler:

- converts word ranges to source frame ranges;
- adds speech handles;
- merges adjacent keep intervals;
- projects captions through the retained ranges;
- recalculates output timestamps;
- creates an OTIO representation;
- creates a deterministic FFmpeg render plan;
- predicts final duration and frame count.

For a 30 fps source, video edit decisions should use integer frame ticks. ASR times are floating-point seconds, so they must be quantized by a defined rule, for example:

```text
source_start_frame = floor(start_seconds * 30) - handle_frames
source_end_frame   = ceil(end_seconds * 30) + handle_frames
```

That rule must be recorded and never changed silently.

## Stage 5: pre-render verification

Render:

- a 360p or 480p full preview;
- 2–4 seconds before and after every edit boundary;
- selected high-risk sections;
- caption-only test frames;
- an audio-only normalized preview.

Automated checks should include:

- output exists and is non-empty;
- duration within expected tolerance;
- exactly the intended video stream;
- intended audio stream(s);
- 1920×1080 or chosen output dimensions;
- 30 fps and expected timebase;
- no missing audio;
- no black frames except allowed ranges;
- no frozen-frame run beyond a threshold;
- no caption cue overlap;
- captions inside safe margins;
- audio loudness and true peak;
- no unexpected silence gaps caused by a mapping error;
- output decodes from beginning to end.

These are gates, not proof of quality.

## Stage 6: human review

The review should be deliberately cheap:

1. inspect the contact sheet;
2. watch the low-resolution preview;
3. review all boundary snippets;
4. listen to the normalized audio;
5. check captions on representative screen-heavy, talking-head, and transition sections;
6. accept, reject, or modify individual decisions.

The human should not need to operate a timeline for routine edits. A rejected plan should be revised by changing the JSON decision set, not by manually reconstructing the edit.

## Stage 7: final render

Use FFmpeg with:

- explicit `-map`;
- a pinned encoder configuration;
- `h264_vaapi`;
- final audio normalization;
- captions burned in only if the chosen output requires it;
- a separate sidecar SRT/VTT for accessibility;
- `-movflags +faststart` for MP4 delivery where appropriate.

VAAPI is hardware-assisted encoding, but scaling, subtitles, compositing, and some filters may remain CPU-bound. The encode path must be benchmarked with a five-minute representative sample before promising throughput.

## Stage 8: final QC and delivery

Run the existing evidence pattern:

```text
evidence/<name>-<stamp>/
  source-probe.json
  source-sha256.txt
  transcript.json
  analysis.json
  plan.json
  compiled-plan.json
  otio/
  render-command.txt
  preview.mp4
  final.mp4
  final-probe.json
  contact-sheet.jpg
  boundary-snippets/
  qc.json
  review.json
```

The delivery command should deliberately have no force-overwrite option. YouTube upload remains private-only. Public release remains Christopher’s decision.

---

# 8. Hardware reality

The CPU is an 8-core/16-thread Ryzen 9 6900HX. The Radeon 680M is an integrated GPU sharing memory with the system. With 30 GiB total RAM and a 10 GiB VM often resident, large PyTorch models are a poor default.

## Expected workload profile

| Stage | Hardware | Likely cost for 60-minute source |
|---|---|---:|
| `ffprobe` | negligible | seconds |
| audio extraction | CPU, sequential | under 5 minutes |
| silence/RMS scan | CPU audio | seconds to a few minutes |
| frame sampling | decode plus scale | 2–15 minutes |
| scene detection | CPU, full video decode | 10–45 minutes |
| whisper.cpp small CPU | AVX2 | roughly 1–4 hours |
| whisper.cpp Vulkan | Radeon 680M, if stable | possibly 20–60 minutes |
| WhisperX CPU alignment | CPU/PyTorch | additional tens of minutes to several hours |
| low-resolution preview | VAAPI plus filters | 10–30 minutes |
| final 1080p render | VAAPI plus filters | roughly 30–120 minutes |

These are planning ranges, not measurements on this exact machine.

## ASR estimates

A published report for an AMD 680M-class integrated GPU described CPU real-time performance around 0.3× and Vulkan performance around 3–4× real time for whisper.cpp-style inference. That is useful evidence for the architecture but not a benchmark of this Beelink, its Mesa version, its memory pressure, or the selected model. [Phoronix report](https://www.phoronix.com/news/Whisper-cpp-1.8.3-12x-Perf)

The safe planning assumption is:

- `small.en` CPU: potentially one to several hours for 60 minutes;
- `medium` or larger CPU: overnight risk;
- Vulkan `small.en` or `medium`: potentially under an hour, but must be verified;
- Vulkan stability and shared-memory contention: unknown;
- WhisperX CPU alignment and diarization: overnight risk for large models.

The first cheap experiment is a five-minute representative sample containing:

- normal speech;
- silence;
- desktop audio;
- a screen transition;
- a retake;
- the noisiest portion of the recording.

Benchmark:

```text
small.en CPU
small.en Vulkan
medium.en CPU
medium.en Vulkan
```

Measure:

- wall-clock;
- real-time factor;
- peak RSS;
- GPU utilization;
- accuracy against a manually checked transcript;
- timestamp behavior with VAD;
- system responsiveness while the VM remains resident.

Do not change several variables in one experiment. Establish the CPU baseline first, then test Vulkan with the same model and settings.

## Frame analysis

A full 30 fps recording contains 108,000 frames per hour. A scene detector may decode every frame even when it only retains a small number of results. Downscaling reduces cost substantially. Sampling with `fps=1/10` or seeking to known times reduces output volume, but not always decode cost if the file must be scanned sequentially.

For screen recordings, full content-based scene detection may be less useful than:

- periodic frame sampling;
- detecting black/frozen frames;
- OCR or visual comparison at selected intervals;
- pointer-track evidence;
- transcript-linked frame inspection.

## Encoding

The Radeon 680M provides VAAPI H.264 and HEVC encoding, while AV1 is decode-only according to the machine brief. Use H.264 for the YouTube delivery path.

VAAPI improves throughput, but it does not guarantee that the whole filtergraph runs on the GPU. Burned-in captions, text, scaling, and overlays can force CPU processing before frames are uploaded to the encoder. Measure the full graph, not an isolated codec test.

A final 60-minute render should not begin until a short render has established:

```text
encoder actually selected
output quality acceptable
audio preserved
caption filter works
speed is acceptable
```

---

# 9. Cost and self-hosting

## Local path

Local processing has no per-hour API charge:

- FFmpeg: free and open source;
- whisper.cpp: MIT-licensed;
- PySceneDetect: open source;
- OTIO: open source;
- Auto-Editor: open source, but pin versions and inspect licensing changes;
- local LLM through Ollama or another runtime: no API metering, but hardware and electricity cost apply.

The real local cost is time, heat, memory contention, and engineering maintenance.

## Hosted ASR

Current published examples:

- OpenAI `gpt-transcribe`: approximately **$0.0045/minute**, or **$0.27/hour**;
- OpenAI `gpt-4o-transcribe`: approximately **$0.006/minute**, or **$0.36/hour**;
- Deepgram Nova-3: approximately **$0.0048/minute**, or **$0.29/hour** before add-ons;
- AssemblyAI Universal-2: approximately **$0.15/hour**;
- AssemblyAI Universal-3.5 Pro: approximately **$0.21/hour**.

OpenAI transcription returns verbose JSON with segments and word timestamps for supported models. [OpenAI pricing](https://developers.openai.com/api/docs/pricing) [OpenAI transcription API](https://developers.openai.com/api/reference/resources/audio/subresources/transcriptions/methods/create)

These prices are low enough that hosted ASR is a reasonable fallback when local ASR would delay publishing by hours. The privacy cost is more important than the dollar cost for sensitive recordings.

## Hosted vision

Google’s video-understanding documentation says video is sampled at approximately one frame per second by default, with audio processed separately. At default resolution, the documented token calculation is roughly 258 tokens per video frame plus audio tokens. [Gemini video understanding](https://ai.google.dev/gemini-api/docs/video-understanding)

A full one-hour video at one frame per second produces approximately 3,600 frames. That is technically possible, but it is wasteful for initial editing and can cost several dollars depending on the model and current rates.

A cheaper strategy is:

- local extraction every 10 seconds;
- send 360 resized frames;
- use dense frame batches only around uncertain boundaries.

Claude’s vision documentation gives a concrete image-token calculation. A 1920×1080 image on the standard tier is approximately 1,560 visual tokens. At 360 frames, that is approximately 562,000 input tokens. At a $1/M-token model rate, the visual input is about $0.56; at a $5/M-token rate, about $2.81, excluding text output and retries. [Claude vision documentation](https://platform.claude.com/docs/en/build-with-claude/vision)

The hosted model should receive **frames and evidence**, not the entire raw video by default.

A subscription to an agent harness does not automatically mean that arbitrary media API calls are free. Treat ASR and vision API credentials and billing as separate dependencies.

---

# 10. Things to keep in mind

These are not implementation tasks for the first pass, but they will become expensive if ignored.

## Asset and project naming

The source hash must be part of the project identity. A human-friendly name alone is not enough.

At minimum, distinguish:

```text
source asset
analysis bundle
transcript revision
edit-plan revision
preview render
approved delivery
published/private upload
```

## Raw archive versus disk usage

Raw OBS MKV should be archived as the source of truth. Lossless FFV1 intermediates are large and should be generated only where they provide a clear benefit. A one-hour 1080p lossless intermediate can consume a substantial portion of the remaining 109 GB.

## Reproducibility months later

Pin:

- FFmpeg version;
- whisper.cpp version and model checksum;
- VAD model;
- LLM model and settings;
- prompt version;
- schema version;
- encoder options;
- source hash;
- operating-system package versions where material.

An LLM alias is not a reproducible editorial dependency unless the exact model snapshot and prompt are recorded.

## Captions and accessibility

Always produce a sidecar SRT or WebVTT even when captions are burned in. Burn-in is presentation; sidecar captions are accessibility and YouTube functionality.

YouTube’s caption API supports upload, update, download, and draft tracks. Caption insertion requires OAuth and a video ID; the API upload limit is 100 MB. [YouTube captions API](https://developers.google.com/youtube/v3/guides/implementation/captions) [Captions insert](https://developers.google.com/youtube/v3/docs/captions/insert)

## Chapters

Chapters must be generated after the edit is compiled because source times change when material is removed. Never ask the LLM to write final chapter timestamps directly from the raw recording.

## Thumbnails

Thumbnail selection is partly visual and partly editorial. FFmpeg’s `thumbnail` filter can select a representative frame from a batch, but representative does not mean attractive, legible, or truthful. [FFmpeg thumbnail filter](https://ayosec.github.io/ffmpeg-filters-docs/9.0/Filters/Video/thumbnail.html)

Use the LLM to propose candidates, then inspect them.

## Music licensing

The LLM must only select music from an indexed, licensed asset catalog. It must not recommend an unverified track merely because it matches the mood.

## Unattended scheduling

Do not make the first version unattended. The existing shorts pipeline already demonstrates why. Schedule only after:

- source ingestion is idempotent;
- every output is private;
- failed jobs retain evidence;
- no job can overwrite a source or approved delivery;
- human review is still a required state transition;
- the system can resume after interruption.

---

# Final recommendation

Implement the smallest useful system as a **plan compiler**, not an AI NLE:

```text
OBS MKV
  -> ffprobe and source hash
  -> mic-track extraction
  -> whisper.cpp transcript
  -> deterministic audio/scene/frame analysis
  -> LLM emits validated edit-plan JSON
  -> compiler emits frame-accurate ranges and OTIO
  -> low-resolution preview and boundary snippets
  -> human accepts/rejects
  -> FFmpeg VAAPI final render
  -> QC gates and evidence bundle
  -> private-only upload
```

Start with conservative silence/filler proposals and transcript-grounded chapters. Do not begin with autonomous highlight selection, aesthetic grading, GUI automation, or full-video vision analysis.

The first implementation experiment should be a five-minute benchmark comparing whisper.cpp CPU and Vulkan on the actual Beelink, followed by a five-minute end-to-end render using one real OBS MKV. A passing benchmark proves speed and technical viability. It does not prove that the edit is good.