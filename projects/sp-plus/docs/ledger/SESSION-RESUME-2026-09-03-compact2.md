# SP+ RESUME — compact #2, 2026-09-03 ~14:30 CDT
Written by the compact-safe skill. **The session CONTINUES.** Resume at NEXT ACTIONS item 1.

## 1. WHAT WE ARE DOING
Stress-testing SP+ (immutable KDE/Fedora-bootc advisor OS) for its FIRST PUBLIC RELEASE.
Two motions: drive **Tom** to fix the installer/app-install path, drive **Bee** (gpt-5.6-luna,
high thinking) to test the update lane + Discover/Flatpak stores in a VM. Loop until a clean
ISO, which goes to `~/Downloads` for a fresh install on the Dell.

- Repo (BEELINK IS ACTIVE): `chris@192.168.1.190:~/work/secureprospective-advisor-os`
- Branch: `session/sp-plus-plan`   ·   Project dir: `projects/sp-plus`
- SSH to Beelink: `ssh -n -i /root/.ssh/beelink chris@192.168.1.190`
- SSH to test VM (from the Beelink):
  `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p 2222 test@127.0.0.1`
- **Beelink is CDT, the VM clock reads EDT — one hour apart. I mis-flagged this as a
  contradiction once. Same moment, different zone. Do not re-derive it.**

## 2. IN-FLIGHT WORK
**NOTHING IS RUNNING.** No build, no dispatch, no agent. Verified with
`pgrep -af "sp-plus-iso-build|run-bee|pi -p|tom-run"` -> (none).

One VM exists and is RUNNING: `spplus-test` (virsh -c qemu:///session list --all).
**It is the OLD test56 install.** It is due to be destroyed and replaced with RC1c —
that is NEXT ACTION 3. Nothing of value is in it; Bee-1 already reported off it.

## 3. AGENTS + HARNESSES
- `~/fleet/bin/run-bee.sh <fid>` — Bee dispatch. Reads `~/.pi/agent/bee-<fid>.md`,
  writes `.out`/`.err`/`.sentinel` alongside. **FIXED TODAY: keeps a session transcript.**
- `~/fleet/bin/tom-run.sh` — generic Tom (Claude Opus) dispatch.
- `~/fleet/bin/sp-plus-iso-build.sh` — THE sanctioned ISO build path (rootful, DN-06).
  Runs preflight-gate.sh first; requires a clean tree.
- `~/fleet/bin/spplus-testvm.sh` — persistent QA VM (install/boot/ssh :2222).
- `~/fleet/bin/vmshot` — PNG of the VM screen (no window opens on the host).
- `~/fleet/bin/vmtype` — drive the VM console: text/key/login/run.
- `~/fleet/bin/vmunlock <pass>` — answer the GRAPHICAL LUKS prompt via virsh send-key.
- **`~/fleet/bin` is NOW a git repo (`9e1c02b`) and IS backed up** — see section 8.

### Bee transcript recovery (NEW — this is why run-bee.sh was changed)
`run-bee.sh` used `--no-session`, so a killed Bee left NOTHING to read back. It now uses a
FRESH UUID per dispatch (`--session-id`/`--session-dir`), which keeps a transcript AND still
avoids the replay bug (a brief-derived id resumed the previous session and replayed stale
findings — [[lesson_bee_session_id_replay]]).
- Transcripts: `~/.pi/agent/sessions/<ISO8601>_<uuid>.jsonl`
- The path is recorded in the sentinel: `cat ~/.pi/agent/bee-<fid>.sentinel`
- **Liveness = transcript mtime**, not the `.out` file (OP-17). `pi -p` buffers stdout until
  completion, so a 0-byte `.out` means NOTHING about whether Bee is alive.
- Proven twice: two runs of the same brief -> two different UUIDs, two transcripts, fresh
  answers (no replay).

## 4. GATES / STATUS
| Item | State |
|---|---|
| RC1c ISO build | **PASS** — 174/174, `Image build successful`, 5.2G |
| STORE_GATE_OK (new tree sweep) | **PASS** in RC1c |
| UPDATE_LANE_GATE_OK (notifier removal) | **PASS** in RC1c |
| welcome-lifecycle-gate.sh incl. new busy-close | **PASS**, exit 0 |
| tests/cycle36-source-gate.sh | **PASS** |
| All 56 Containerfile RUN blocks `bash -n` | **PASS** |
| Filing gate (`~/.reorg/tools/check-filing.sh`) | **PASS**, exit 0 |
| Bee-2 dispatch | **NOT STARTED** — brief written and staged |
| RC1c installed in a VM | **NOT DONE** |
| Idle RAM on a LOGGED-IN desktop | **UNMEASURED** |

## 5. ARTIFACTS THAT EXIST
- **RC1c ISO** (both fixes, the current candidate):
  `~/work/secureprospective-advisor-os/projects/sp-plus/artifacts/spikeB-rootful/out/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso`
  5.2G, 14:22 CDT. **NOT yet copied to ~/Downloads, NOT yet sha256'd.**
  NOTE: the build script overwrites this same path every run. RC1a and RC1b are gone.
- Payload image in the ROOT podman store: `localhost/sp-plus-kde:spike` (this is RC1c's payload).
- Keepers in `~/Downloads` (Christopher's ruling — never delete):
  `sp-plus-1.0-20260901.iso`, `sp-plus-1.0-test55-20260902.iso`, `sp-plus-1.0-test56-20260902.iso`
- Bee-1 report: `~/.pi/agent/bee-spplus-lanes-20260903.out` (15,718 bytes)
- Bee-2 brief (READY TO DISPATCH): `~/.pi/agent/bee-spplus-desktop-20260903.md` (9,633 bytes)
  also filed at `~/fleet/briefs/bee-spplus-desktop-2026-09-03.md`
- Build logs: `~/logs/sp-plus-iso-rc1b.log`, `~/logs/sp-plus-iso-rc1c.log`,
  `~/logs/sp-plus-iso-rc1-prefix.log.bak`

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST
**From Bee-1's report (3 of its 5 "defects" did not survive review):**
1. "`rpm-ostree` is installed = defect" — **REFUTED.** It cannot be removed; bootc requires
   ostree/libostree. Containerfile:238 already records this. The design removes Discover's
   *plugins*, not the package. Not a defect.
2. "`spplus-update-notify.timer` does not exist" — **REFUTED.** It is a **USER** unit
   (`/usr/lib/systemd/user/`, `systemctl --global enable`). Bee queried SYSTEM scope.
   Verified live: `systemctl --user list-unit-files` -> enabled, `is-active` -> active,
   and the symlink `/etc/systemd/user/timers.target.wants/...` exists.
3. "normal-user `flatpak install` fails" — **PROBABLY REFUTED.** Bee ran it over SSH, which
   has no polkit agent, so `Deploy not allowed for user` is expected. Must be retested through
   the Discover GUI before anything is "fixed". Do NOT loosen polkit based on this.
4. "S-1 CONFIRMED" — **OVERSTATED.** Bee never observed a real exit-1 being converted to
   success; Flatpak short-circuited on `already preinstalled; skipping`. S-1 remains a
   SOURCE-LEVEL finding (`SuccessExitStatus=0 1`), with no behavioural proof.

**From earlier in the session (still standing):**
5. Brave: policy files, missing runtime deps, disabled network units, `wifi.powersave`
   — all six causes tested and refuted with line-level evidence. The ONE live lead is
   SELinux: `/opt` -> `/usr/lib/opt` (Containerfile:66) puts Brave's binaries under `lib_t`,
   outside every upstream rule, and nothing relabels it.
6. Bee-1 DID observe Brave launch cleanly on Wayland with a blank tab, +369.1 MiB, and
   zero coredumps/segfaults/DrKonqi records all session. That is NOT a rendering test.

## 7. THE THINGS THAT ARE ACTUALLY BROKEN (open)
- `flatpak update` prints `Error updating: ... DeployAppstream not allowed for user` and
  **exits 0**. An exit code that lies. REAL, unfixed.
- S-1: `spplus-flatpak-preinstall.service` AND `spplus-flatpak-update.service` both carry
  `SuccessExitStatus=0 1`, so a failed run records as success. Source-level, unfixed.
- Boot errors at `err` priority: missing `tss` user (tpm2-tss-fapi tmpfiles), and
  `/home`,`/srv`,`/root` "already exists and is not a directory" (our symlink layout).
- **Idle RAM: UNKNOWN.** Bee-1's 1,709.8 MiB measured the **plasmalogin GREETER**, not a
  logged-in desktop (`plasma-login-wallpaper` 529MB + `plasma-login-greeter` 325MB were the
  top two). Against 1536 MiB target that number is NOT the answer. A logged-in desktop is
  likely HIGHER. Two of Bee's top-3 cut targets are greeter processes that should exit at
  login anyway. Needs a logged-in run AND a 4 GiB-constrained run.
- Deferred, real: D-5 (Pi npm tree unpinned, install scripts run as root at build),
  D-9 (starship + pi unowned by rpm, on no update lane).
- **Gate flake, NOT root-caused:** one run of `welcome-lifecycle-gate.sh` hit its 300s outer
  timeout; the identical run afterwards passed in 40s. Hypothesis (unproven): contention with
  Welcome processes left running from manual tests. Watch for it.

## 8. WHAT WAS COMMITTED TODAY
Repo `~/work/secureprospective-advisor-os`, branch `session/sp-plus-plan`, **tree clean**:
- `96a5209` — store gate sweeps the whole Discover plugin tree for OS-lane plugins.
  Removes `/usr/lib64/qt6/plugins/discover-notifier/rpm-ostree-notifier.so` (shipped from the
  separate package `plasma-discover-rpm-ostree`, in a directory the old gate never looked at;
  the notifier daemon autostarts every login via
  `/etc/xdg/autostart/org.kde.discover.notifier.desktop`). Gate now sweeps both plugin dirs
  for `*rpm-ostree*`/`*packagekit*`. The two old single-filename tests were KEPT because
  `tests/cycle36-source-gate.sh:78` greps their literal failure strings.
- `9946a6f` — SP+ Welcome: closing during work no longer freezes the app or parks a live
  worker. See section 9.

Repo `~/fleet/bin` (NEW, local-only, no remote):
- `9e1c02b` — 62 files tracked, `.gitignore` for `*.log/*.out/*.err/*.sentinel`, README.
- Backed up: `/root/backup-beelink-repos.sh` now discovers `beelink-fleet-bin`. Mirror
  verified at `/mnt/storage/claudebox/backup/beelink-mirrors/beelink-fleet-bin.git`
  (1 ref, commit 9e1c02b, 62 files, `run-bee.sh`/`vmshot`/`vmtype`/`vmunlock` all present).
  Script backed up to `/root/backup-beelink-repos.sh.bak-20260903`.

## 9. THE WELCOME FIX (9946a6f) — measured, not inferred
Two defects in `Bridge.shutdown()` (`welcome/welcome.py`), both confirmed against the SHIPPED
file on the test56 guest:
- **W-1** shutdown() ran on aboutToQuit (the UI thread) and used `QThread.wait()`, freezing the
  app for the worker's whole runtime with the window already gone. Measured: 45s worker ->
  **0 timer ticks delivered** during a 30s drain.
- **W-2** the bound was `THEME_APPLY_TIMEOUT + 30` = 630s, but `UpdateWorker` action `stage`
  and `FlatpakInstallWorker` both carry **1800s** subprocess limits, so closing during those
  parked a LIVE worker by arithmetic. Measured: bound 30s vs 45s worker -> parked, every time.

Fix: `DRAIN_BOUND_MS = max(THEME_APPLY_TIMEOUT, 1800) + 30`; drain on a nested `QEventLoop`;
`_draining` refuses new dispatches; `_send` drops payloads during the drain.

**A third defect was created BY the fix and caught by running the real binary:** once the event
loop runs during the drain it processes the `view.deleteLater()` that closeEvent posted, so a
worker finishing afterwards raised
`RuntimeError: libshiboken: Internal C++ object (QWebEngineView) already deleted`.
Process still exited 0 with nothing parked — it would have shipped as a journal traceback.
Hence the `_send` guard, and hence the gate greps for `Traceback|RuntimeError`.

After: 45s worker -> **87 ticks during the drain, 0 parked, worker completed.**
End-to-end through real `main()`: exit 0, 21s for a 20s worker, `WELCOME_PARKED_WORKERS=0`,
zero tracebacks, zero leftover `welcome.py`/`QtWebEngineProc`. Idle close unchanged.

New gate section in `tests/welcome-lifecycle-gate.sh` asserts: exit 0, **elapsed >= worker
runtime** (the drain must WAIT, not abandon a half-written system Flatpak install),
`WELCOME_PARKED_WORKERS=0`, no traceback, no leftover processes. Env seams:
`SPPLUS_WELCOME_LAUNCHER`, `SPPLUS_WELCOME_PATTERN`, `SPPLUS_PIN_HELP`, `BUSY_WORKER_SECONDS`.
**Why it was needed:** every gate in the repo closed an IDLE Welcome via `--self-test-close`
(1s after launch, `self._workers` empty), so the drain was a no-op and had NEVER been executed
by a test.

## 10. CHRISTOPHER'S RULINGS — do not relitigate
- Manual system update must complete with ZERO errors; Discover + Flatpak must work FLAWLESSLY.
- The goal is a flawless ADVISOR experience, not just CLI correctness.
- Bee must watch NOTIFICATIONS — crash reports land there.
- gpt-on-pi drifts to the Beelink host: ALL work happens in the VM only.
- Give Bee vision on the VM (vmshot + `pi @shot.png`).
- Keep sshd, key-only auth; Christopher's key comes from the INSTALLER, not `/etc/skel`.
- Run efficiently on all steps; be systematic.
- Minimum basic install must idle at ~1.5 GB RAM or less (RAM at idle, out of the box).
  MEASURE NOW, ACT AFTER the release blockers.
- Podman prune: dangling only; rootless done earlier, rootful after the build (DONE, 6.4 GB).
- ISOs: keep test55, test56, 20260901. The 0721 one was dropped.
- Permissions on ClaudeBox were loosened (settings.local.json rewritten; `ask` beats `allow`
  was the root cause of the prompt spam).

## 11. NEXT ACTIONS, IN ORDER
1. **Verify RC1c's payload in the IMAGE, not the log:**
   `sudo -n podman run --rm --entrypoint /bin/sh localhost/sp-plus-kde:spike -c "ls -l /usr/lib64/qt6/plugins/discover-notifier/; grep -c DRAIN_BOUND_MS /usr/libexec/sp-plus/welcome/welcome.py"`
   Expect: only `FlatpakNotifier.so`, and DRAIN_BOUND_MS present.
2. **Copy RC1c to `~/Downloads/sp-plus-1.0-rc1c-20260903.iso`**, record sha256 + byte size.
3. **Destroy the test56 VM and install RC1c:** `~/fleet/bin/spplus-testvm.sh`.
   The generated kickstart MUST keep the `poweroff` delta — without it Anaconda stops at
   "Press ENTER to quit", the VM reboots with ISO+OEMDRV still attached and a SECOND
   unattended install destroys the first (observed 2026-09-03, ESP GUID changed).
   The LUKS prompt is GRAPHICAL: use `vmunlock spplustest`, not the serial console.
4. **Get the VM to a LOGGED-IN desktop** (test/testtest), not the greeter. This is what
   corrupted Bee-1's RAM measurement.
5. **Dispatch Bee-2:** `~/fleet/bin/run-bee.sh spplus-desktop-20260903`
   (brief already at `~/.pi/agent/bee-spplus-desktop-20260903.md`).
   Then poll the transcript mtime, not the `.out`.
6. Collect Bee-2, triage findings against source before repeating any of them.
7. Loop to a clean ISO; the good one stays in `~/Downloads` for the Dell.

## 12. OPEN QUESTIONS FOR CHRISTOPHER
- `CLAUDE.md` says "Coverage (extended 2026-08-30): **14 repos**". It is now **16**
  (`/root/backup-beelink-repos.sh --list`). Foundation doc — proposed, not edited.
- The PoC `projects/sp-plus/Containerfile` (reachable from `scripts/build-qcow2.sh`) creates
  account `advisor` with known password `advisor-poc`, unpinned-curls Brave, targets Fedora 43.
  Delete, or move under a marked `poc/`? Still unanswered.

## 13. HONEST STATUS
Two release blockers are fixed, committed, gate-proved, and **present in a built ISO for the
first time (RC1c)**. That is genuinely further than the last compact, when nothing had been
built with a fix in it.

**But: no fix has ever been booted.** RC1c has not been installed, no VM has run it, and every
behavioural QA result on record still describes test56 — the OLD build. The notifier fix is
defensible on contract grounds but the bogus-notification it prevents was never actually
observed firing. The Welcome fix is measured thoroughly, but only offscreen and only through
the harness — never by a human closing a window on a real desktop.

The 1.5 GB RAM question is still **unanswered**, and the one number we have is from the wrong
screen. Assume the real figure is worse than 1,709 MiB until measured logged-in.
