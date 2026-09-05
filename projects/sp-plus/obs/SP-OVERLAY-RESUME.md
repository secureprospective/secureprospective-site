# SP+ OVERLAY — RESUME (compact-safe)

**Written:** 2026-09-05 · **Session continues.** This is NOT session close.
**Resume at NEXT ACTIONS item 1. Do not re-derive. Do not re-test the refuted list.**

---

## 1. WHAT WE ARE DOING

Building **custom animated OBS scene overlays for Secure Prospective** streams and
recordings — Christopher's bar: "forward and ultra cool, average is banned", completely
custom, inside the SP+ theme/voice. Eight scenes. He is on remote control, away from the
machine, so **ClaudeBox drives the Beelink terminal directly over SSH** (his standing
authorization this session).

- **Host:** Beelink `chris@192.168.1.190`, key `/root/.ssh/beelink`. X11 session on `:0`.
- **Repo:** `~/work/secureprospective-advisor-os`, branch **`session/sp-alpha-rig-profile`**,
  head `d1931b6`. OBS work lives in `projects/sp-plus/obs/`.
- **Guest VM:** `SP-Alpha-Rig` on `qemu:///session`, Plasma **Wayland** at 1920x1080.
  LUKS passphrase: NOT RECORDED HERE — see `/root/SP-OVERLAY-RESUME.md` on CT105, or ask Christopher. `rig unlock` with no arg does NOT work —
  `RIG_LUKS` in `rig.env` is empty/wrong; pass the passphrase explicitly.

## 2. AGENTS + HARNESSES

- **Bee** (`/root/run-bee.sh` on CT105, Luna `gpt-5.6-luna`, THINKING=high) — both research
  dispatches are **DONE**. Nothing in flight.
- **Bee has a web extension. Use it, never `curl`.** (Christopher, this session.)
- `run-bee.sh` backgrounded with `nohup ... &` **detaches and the Bash tool reports
  "completed" immediately** — that is NOT the dispatch finishing. Poll the run dir instead.

| Dispatch | Run dir | Bytes | Verdict |
|---|---|---:|---|
| Research (scene best practice) | `/root/bee-runs/20260905T202411Z_brief-obs-overlay-research/out` | 42,036 | ACCEPT |
| Build spec (implementation) | `/root/bee-runs/20260905T212137Z_brief-obs-overlay-build/out` | 29,833 | ACCEPT |

Briefs: `/root/.claude/briefs/brief-obs-overlay-research.md`,
`/root/.claude/briefs/brief-obs-overlay-build.md`.

## 3. GATES / STATUS

| Item | State | Proven by |
|---|---|---|
| Flatpak OBS 32.2.2 user-scope | PASS | `flatpak list --user` |
| Browser source / CEF | PASS | `obs-browser.so` + live `obs-browser-page` procs |
| VAAPI H.264 `ffmpeg_vaapi_tex` | PASS | OBS log |
| xcomposite capture in sandbox | PASS | live preview + recordings |
| Profiles + scene collection migrated | PASS | OBS titlebar, log |
| Recording (3 AAC tracks, MKV) | PASS | 4 real MKVs, ffprobe |
| Audio: mic + VM routed | PASS | tracks 1/2/3 measured −17.0 / −77.8 / −17.0 dB |
| **RIG 1:1 capture** | **PASS — survives restart** | crop 26/70/26/29, scale 1.0000, 1920x1080 |
| obs-websocket | PASS | port 4455, auth on, v5.7.4 |
| Overlay itself | **NOT STARTED** | — |
| Webcam | **FAIL — previews black** | pre-existing, unresolved |
| Live YouTube stream test | never run | — |

## 4. ARTIFACTS THAT EXIST AND WORK

On the **Beelink**:
- `~/fleet/bin/obsws.py` — obs-websocket v5 client. Reads password from OBS's own plugin
  config, **never prints it**. Has `OBS` async context manager + `fix_rig()`.
- `~/fleet/bin/sp-show` — launcher: guest awake → virt-viewer → clear `.sentinel` → OBS.
  `bash -n` clean. Flags: `--record`, `--live`, `--scene`.
- `~/fleet/bin/sp-show-prep.py.retired-json-editing` — **RETIRED, do not revive.** It edited
  scene JSON by hand and carried the WRONG crop.
- Recordings: `~/Videos/sp-plus/SP-master 2026-09-05 *.mkv` (4 files).
- Evidence: `~/logs/sp-plus/obs/rig-source-raw-20260905.png` (the OBS-view measurement basis,
  1972x1179) and `rig-1to1-verified-20260905.png` (the 1:1 proof).
- Config backup: `~/logs/sp-plus/obs-config-backup-20260905T202747Z.tgz` (1,607,128 bytes).
- OBS config root: `~/.var/app/com.obsproject.Studio/config/obs-studio/`.

On **CT105**: the two Bee outputs above; briefs in `/root/.claude/briefs/`.

**Motion preview artifact (live, private, phone-accessible):**
`https://claude.ai/code/artifact/21792d07-ab95-4103-98b7-83a55f0a9d97`
Source: `/tmp/claude-0/-root/bb196fdf-09e3-42e1-bff8-4ba7445fbc60/scratchpad/registration-sweep.html`
(scratchpad is volatile — **re-create from the artifact if needed**).

## 5. THE CURRENT BUG

**None open.** The RIG 1:1 defect is CLOSED and verified across a restart.

Remaining known-bad, both pre-existing and out of scope so far:
- Webcam previews black (`Sonix USB 2.0 Camera`, 640x480 YUYV only). Cause unknown.
- Guest blanked after ~25 min and OBS recorded 1920x1080 of black with no error. KDE
  autolock/DPMS disabled in-guest via `kwriteconfig6`, but **not re-verified after a guest
  reboot** — treat as unproven.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

1. **Setting the scene-item transform by editing `SP+ Show.json`.** REFUTED 3x. OBS rewrites
   scene-item transforms on save; every edit came back as `scale 1.4371` (= 1920/1336).
   The supported path is `SetSceneItemTransform` over obs-websocket. Bee: the JSON layout is
   an implementation format, not a stable editing API.
2. **`bounds_type: 2` with `bounds {0,0}`.** REFUTED — renders the item at ZERO SIZE, giving a
   fully black frame (6 KB PNG). Bounds must be explicitly non-zero.
3. **Crop `26/24/26/75`.** REFUTED — wrong. Measured with `import -window` *while the guest
   was blanked*, so virt-viewer's GTK header bar was invisible. **Correct crop is
   `26/70/26/29`** (guest content x 26–1945, y 70–1149 inside a 1972x1179 window).
4. **Measuring capture geometry with `import -window`.** REFUTED as a basis. Measure through
   the capturing app: `GetSourceScreenshot` over obs-websocket.
5. **Verifying the transform by reading `scaleX`.** REFUTED as a test — stale/normalized when
   bounds are active; it printed FAIL on a correct transform. **The rendered picture is the
   test.**
6. **`STATUS.md` claims** — three are FALSE: "VM capture 1:1" (it was 1.437x), "audio mic/VM
   routed, verified" (the Debian scene JSON had ZERO audio sources, all `mixers=0`), "VM
   12→10 GiB" (it is back at 12 GiB — `size=12582912k`).
7. **Cloudflare Pages for the preview.** BLOCKED — `wrangler` not installed on CT105 and auth
   needs a browser OAuth flow Christopher cannot reach remotely. Used a Claude artifact.
8. **`rig gui '<cmd>'`.** Does not exist — there is no `gui` subcommand. Use `rig run` with
   `XDG_RUNTIME_DIR=/run/user/1000 WAYLAND_DISPLAY=wayland-0`.
9. **"Guest boots at 2048x1152."** FALSE — it is already 1920x1080, scale 1.
10. **`--disable-shutdown-check` alone.** Insufficient — a `.sentinel` DIRECTORY in the config
    root makes OBS abort at startup ("Crash or unclean shutdown detected", 1-line log) and
    never load scenes. Must `rm -rf` it.
11. **`pkill -f "run-bee.sh"` from the Bash tool.** Kills your OWN shell (the pattern matches
    the tool's command string). Exit 144.
12. **Nested heredocs / quoting python inline over ssh.** Broke twice. Write the script
    locally and `scp` it.

## 7. DECISIONS (Christopher's rulings — do not relitigate)

- **D1** Flatpak OBS with browser source, over pre-rendered alpha WebM.
- **D2** Build all four extra scenes: BRB, TALK+RIG split, SLATE, TECHNICAL DIFFICULTIES.
- **D3** Preview must reach his phone. (Cloudflare preferred → artifact used, D3 satisfied.)
- **D4** Overlay completely custom, "shockingly good", inside theme/voice. Average is banned.
- **D5** Bee uses its web extension, never `curl`.
- **D6** ClaudeBox drives the terminal directly, sudo included if needed. (Sudo turned out
  unnecessary — flathub is a **user** remote, PipeWire confs are user-scope.)
- **D7** The new OBS must carry the same settings as the old. Done and verified.
- **D8** Test settings end-to-end BEFORE any overlay work. Done.
- **D9** Do not burn tokens hand-centering the capture. (Later closed properly via websocket.)

## 8. LEDGER STATE

- Repo `secureprospective-advisor-os` @ `session/sp-alpha-rig-profile`, head `d1931b6`,
  `projects/sp-plus/obs/` clean — **but nothing from this session is committed yet.**
- **NOT committed / NOT in any repo:** `~/fleet/bin/obsws.py`, `~/fleet/bin/sp-show`,
  the corrected crop numbers, and the STATUS.md corrections. These live only on the Beelink
  filesystem. **This is the biggest exposure.**
- Backbone `~/fleet/backbone` head `d8af790` — untouched this session.
- Memory cards NOT yet written (see NEXT ACTIONS 5).

## 9. NEXT ACTIONS, IN ORDER

1. **Build `sp-overlay-bridge.py`** per Bee's Q1/Q2 spec: obs-websocket v5 client + localhost
   HTTP/SSE server. Keeps the ws secret out of the page, solves `file://` limits, carries
   non-OBS state (chapter, countdown, topic) with a JSON schema.
2. **Build the overlay page** — one **persistent** browser source reused by all eight scenes
   (Bee's decision: avoids CEF reload per cut, preserves the sweep's ambient phase).
   Tree in Bee Q1: `index.html`, `css/{reset,tokens,layout,motion}.css`,
   `js/{app,state,obs-events,renderer,dash-field}.js`, self-hosted IBM Plex woff2.
3. **Create the four new scenes** in OBS via obs-websocket (never by JSON edit).
4. **Commit** `obsws.py`, `sp-show`, the overlay tree and the corrected crop into
   `projects/sp-plus/obs/`; correct the three false claims in `STATUS.md`.
5. **Memory cards to write:** the JSON-editing lesson, the measure-from-the-capturing-app
   lesson, the `.sentinel` startup abort, and corrections to
   `project_sp_plus_shorts_on_rig` (no `rig gui`; guest already 1920x1080) and
   `project_obs_production_rig` (STATUS.md overstatements).
6. Only then: webcam black, and a real YouTube stream test.

## 10. RELAY / ENVIRONMENT NOTES

- `paste.md` relay is **not needed this session** — D6 stands, drive SSH directly.
- OBS control: `python3 ~/fleet/bin/obsws.py` (port 4455, auth on, password read from
  `plugin_config/obs-websocket/config.json` — never echo it).
- OBS stop: `kill -TERM $(pgrep -f "^obs --disable")`, then `flatpak kill com.obsproject.Studio`
  if it lingers. **Always `rm -rf .sentinel` before the next launch.**
- Brand constants: blue `#0033A0`, gold `#D4AF37`, yellow `#FFD700`, platinum `#E5E4E2`,
  ink `#222222`. IBM Plex Sans Bold display. **Primal banned.** Logo ≥720px on dark ground.
- Hero algorithm (the motion signature): 28px row pitch, 10x2px dash, 8px gap, alternating
  row direction, 0.37 row phase offset, 0.012 phase increment/frame, gold above the upper
  brightness threshold.
- Compression budget: 10 Mbps ÷ 30fps = ~41,667 bytes/frame ≈ 0.161 bits/pixel, ~41 bits per
  16x16 block. Safe grid: x 96–1824, y 96–936, bottom 144 reserved, 240 off the right edge.

## 11. HONEST STATUS

The **migration and settings parity are genuinely done and evidence-backed.** The RIG 1:1
defect is genuinely closed — verified across a restart, by the picture and not by a scalar.

**The overlay itself does not exist yet.** Not one line. Everything so far is environment,
research and a motion study. Bee's build spec is leads, not findings — triage it against
reality as it is implemented; its Q6 diagnosis was right, but its crop numbers came from my
own earlier wrong measurement and it could not test anything.

Unproven and not to be reported as working: the webcam, any live YouTube stream, guest
screen-blanking after a reboot, and thermals under sustained load.

**Live processes on the Beelink that survive this compaction** (not orphans — working state):
OBS 32.2.2, `virt-viewer`, and the `SP-Alpha-Rig` VM. Leave them running.
