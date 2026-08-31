# SP+ RESUME — 2026-08-31 (theme switching DONE; ISO in flight)

## 1. WHAT WE ARE DOING

The stated goal -- switch to Windows, back to Breeze, back to Windows again without error
using ONLY the Welcome application on the Dell -- IS MET, twice, on shipped images. The
remaining work is a single deliverable: an ISO of the current source, verified and placed in
`~/Downloads` for Christopher to test in a VM.

- Repo: `/home/chris/work/secureprospective-advisor-os` (worktree; do NOT cd to the origin).
- Dell: `test@192.168.1.124` (DHCP; it has been .134 and .124 this session -- check both).
  Key `~/.ssh/id_ed25519`. Disk is LUKS: every reboot needs Christopher at the keyboard.
- Registry: `192.168.1.190:5000/sp-plus-kde:<tag>`.

## 2. AGENTS + HARNESSES

- `~/fleet/bin/run-bee-spplus-impl.sh <id>` -- WRITE-enabled Bee lane. Brief must be at
  `~/.pi/agent/spplus-brief-<id>.md`. Dispatch detached: `systemd-run --user --collect
  --unit=bee-<id> ~/fleet/bin/run-bee-spplus-impl.sh <id>`. Sentinel:
  `~/.pi/agent/spplus-IMPL-ALL.sentinel`. NEVER poll artifacts; wait on the sentinel.
- `~/fleet/bin/run-bee-spplus-manifest.sh` is the READ-ONLY audit lane. Using it for
  implementation work is a wasted cycle -- that mistake was made once already.
- `~/fleet/bin/spplus-build-push.sh <tag>` -- rootless build + push + registry verify.
- `~/fleet/bin/spplus-dell-switch.sh <tag>` -- detached bootc switch on the Dell. Honours
  `DELL_HOST`; currently hardcoded to .124.
- `~/fleet/bin/sp-plus-iso-build.sh` -- the ONLY sanctioned ISO path (DN-06), ROOTFUL.

## 3. IN FLIGHT RIGHT NOW

**`spplus-iso.service`** -- the ISO build, started 11:03 CDT, TimeoutStartSec=7200.

- Alive? `systemctl is-active spplus-iso`
- Progress: `journalctl -u spplus-iso --no-pager -n 30`
- Output lands in
  `projects/sp-plus/artifacts/spikeB-rootful/out/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/`
  NOTE: that directory ALREADY holds an ISO dated Aug 30 09:55 from a previous run. Check
  mtime and size before believing an ISO is this build's output.
- Watcher: background shell `bz4kq1tg4`, output
  `/tmp/claude-1000/-home-chris/33018ca6-b1dc-4bd0-8aa4-38a969ed6dae/tasks/bz4kq1tg4.output`.
  If compaction kills the watcher the SERVICE still runs -- re-poll it directly.
- When it finishes: verify, then copy (not move) into `~/Downloads` named for this build,
  and tell Christopher.

**Root cannot be obtained from this tool shell.** sudo issues per-tty tickets and the tool
shell has no tty, so `sudo -v` in Christopher's terminal does NOT carry over. The ISO build
was started by Christopher pasting a one-liner. If it must be restarted, give him:
`sudo systemd-run --unit=spplus-iso --collect --property=TimeoutStartSec=7200 --setenv=HOME=/home/chris /home/chris/fleet/bin/sp-plus-iso-build.sh`
The `--setenv=HOME` is REQUIRED: systemd-run starts with an empty environment and the script
dies on `HOME: unbound variable` without it.

## 4. ARTIFACTS THAT EXIST AND WORK

- Registry `sp-plus-kde:test45` = `sha256:240b7bd64fb45ed8b06e08ede2e654d6ff838e88add5deea6a2ebd35c261c70c`
- Registry `sp-plus-kde:test46` = `sha256:2478e5fc5e952b6570fe2fef4b29c4dc9a0e515418201c9a13750ff188b70663`
  The Dell is BOOTED on test46. Zero failed units.
- The eight staged preview screenshots, in the repo at
  `projects/sp-plus/welcome/app/assets/theme-previews/*.png`, committed in `e86310f`.
- Old ISOs in `~/Downloads`: `SP-PLUS-cycle43.iso`, `SP-PLUS-cycle39.iso` (Aug 29, PRE-dating
  all theme work). Do not hand either to Christopher as current.

**Digest gotcha:** `spplus-build-push.sh` prints podman's LOCAL manifest digest, which
differs from what the registry serves after push. Always verify a deployment against the
registry's `Docker-Content-Digest`, or a correct deployment looks like a mismatch.

## 5. THE CURRENT BUG

None open on the theme work. Two known environment defects, deliberately NOT folded in:

- Kickoff favourites are half-seeded from the user's `kactivitymanagerd-statsrc`, so Konsole
  and Discover appear in the menu even though the image sets `NoDisplay=true`. Confirmed to
  survive a fresh deployment: it is USER state, so no Containerfile change can fix it.
- `/etc/xdg/kwinrc` hard-codes the Windows Aurorae decoration as system default. Worth
  revisiting now that every theme owns its layout.

Open question for Christopher, raised but not answered: **Orchis Light leaves the desktop
with a top panel only -- no taskbar -- plus a large desktop clock.** That is genuinely its
author's design, and his rule is that creator intent outranks SP+ normalisation, but it is a
jarring result for an advisor choosing from a gallery.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

1. "plasmarc is truncated / the theme apply damaged config." NO. `plasma-apply-lookandfeel`
   writes `~/.config/kdedefaults/<file>` and reverts the user file. Normal cascade.
2. "A stale decoration key leaks between themes." NO -- harness artifact. `kreadconfig6` in an
   SSH shell reads a different cascade; inherit env from plasmashell's `/proc/<pid>/environ`.
3. "Black text on black background is a theme defect." NO -- it was contamination from killing
   plasmashell and relaunching apps without `XDG_CURRENT_DESKTOP`. The shipped theme is fine.
4. "`--resetLayout` breaks the panel." NO -- the panel was empty because `panel.locked = true`
   ran BEFORE `addWidget`. `--resetLayout` does stop plasmashell, which is a separate defect,
   fixed by restarting the unit and polling for the D-Bus name.
5. "The Welcome app failed to launch / test45 is broken." NO, twice: (a) plasmashell had hit
   systemd's start-rate limiter because a delegated agent was restarting it concurrently;
   (b) the Welcome app is SINGLE-INSTANCE and a second copy exits 0 silently while the
   autostart copy holds the socket.
6. "The build did not push / the Dell staged the wrong image." NO -- I queried the wrong repo
   path (`sp-plus` instead of `sp-plus-kde`), and separately compared a local digest to a
   registry digest. Both were my error.
7. "The Dell came back after the reboot." NO -- false positive: the watcher polled SSH three
   seconds before a scheduled reboot took effect. A reboot watcher MUST wait for the host to
   go DOWN before waiting for it to come back.

## 7. DECISIONS (Christopher's rulings this session)

- **All eight themes must reset to their own paneling**, not just the two Windows packages,
  "as advisors assume trust in 1st class applications". Windows and Breeze were the pilot
  "because its the tallest hill to climb".
- **Christopher composes the preview screenshots himself.** An automated Fin/Dolphin placement
  was rejected on sight: "stop the screen shots are bad. Let me stage them please." The split
  is: I apply themes and prepare the machine, he arranges windows, I capture and verify.
- **Deliver complete work, not caveated work.** "I would like to test your best work, not
  '...but not that'." Time pressure was explicitly removed: "take your time".
- Fin must appear in preview shots at its welcoming banner so advisors are "comfortable with
  Fin, not be afraid of it because its the Terminal".

## 8. LEDGER STATE — all committed

- `081c774` every global theme owns its panel layout (Bee)
- `87277a7` what worked and what did not, for future sessions
- `becc3dc` test46 round trip with per-theme paneling verified
- `e86310f` the eight staged previews + capture contract records manual composition
- `418091d` capture harness defaults to the installed helper

Nothing is written-but-uncommitted for the SP+ theme work. Many unrelated files show as
modified in `git status` and predate this session -- leave them.

## 9. NEXT ACTIONS, IN ORDER

1. **Check `spplus-iso.service`.** If active, wait. If failed, read
   `journalctl -u spplus-iso` -- do not blindly restart, and remember only Christopher can
   start it (section 3).
2. **Verify the ISO is THIS build**, by mtime and size, against the stale Aug 30 artifact in
   the same directory.
3. **Copy it into `~/Downloads`** with a name that distinguishes it from `SP-PLUS-cycle43.iso`
   and `SP-PLUS-cycle39.iso`, and record the sha256.
4. **Tell Christopher it is there**, with its size and what is in it.
5. Optionally raise the Orchis-no-taskbar question and the Kickoff-favourites defect.

## 10. RELAY / ENVIRONMENT NOTES

- `pkill -f <pattern>` matches the very SSH command line running it and kills the session.
  Kill by PID. This has bitten three times.
- Bash function variables are GLOBAL; a helper looping over `name` clobbered a caller's
  `$name`. Use `local`.
- Drive the Welcome app over CDP with `QTWEBENGINE_REMOTE_DEBUGGING=9222`; it must run ON the
  Dell because QtWebEngine validates the Host header.
- Never run two agents against the Dell's Plasma session at once.

## 11. HONEST STATUS

The goal is MET and independently verified on two shipped images -- not on staged code. What
is NOT yet proven is the ISO: it is still building, no ISO of this source has been produced,
booted, or installed, and the installer path has not been exercised since these changes. The
round trip was proven on a machine upgraded in place via `bootc switch`, which is not the
same as a fresh install from this ISO. Say so plainly rather than implying the ISO is tested.
