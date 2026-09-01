# SP+ RESUME — 2026-08-31 ~21:40 CDT

## 1. WHAT WE ARE DOING

Finishing the SP+ Welcome app to a state Christopher can install and test by hand,
then cutting an ISO. In parallel, doubling the in-app advisor manual from 17 to ~34
articles. He said tonight: "This time make sure we get a finished product on the
Welcome app... Triple check before calling it finished, theres no room for average."

Repo: `~/work/secureprospective-advisor-os` (a git WORKTREE — never cd to the
original checkout). Branch `session/sp-plus-plan`. Project: `projects/sp-plus`.
SP+ VM: `ssh -p 2222 test@127.0.0.1` (libvirt guest `fedora-test`).

## 2. AGENTS + HARNESSES

- **Bee** = `~/fleet/bin/run-bee-spplus-impl.sh <fid>`, runs `pi` on
  `gpt-5.6-luna`, thinking max. Brief must be at `~/.pi/agent/spplus-brief-<fid>.md`.
  Dispatch detached: `systemd-run --user --unit=bee-<name> --property=Type=oneshot`.
  Runner writes `~/.pi/agent/spplus-<fid>.sentinel` on exit REGARDLESS of what the
  agent does — **chain on that, not on an agent-authored file.**
- **GPT (sol, max thinking)** — Christopher is running it himself on the manual.
  Prompt: `~/fleet/briefs/PROMPT-gpt-sp-plus-manual.md` (also committed at
  `projects/sp-plus/docs/PROMPT-manual-writing.md`).
  Steering: `~/fleet/briefs/STEERING-gpt-stay-clear-of-bee.md`.
- Briefs live in `~/fleet/briefs/`, run output in `~/fleet/runs/`.

## 3. IN-FLIGHT WORK (most perishable)

**A. `bee-welcome-finish` — RUNNING.** Started ~21:14, elapsed ~22 min at write
time, timeout 7800s.
- Brief: `~/fleet/briefs/spplus-welcome-finish.md` (6,489 b).
- Alive check: `systemctl --user show bee-welcome-finish.service -p ActiveState --value`
  (**"activating" IS alive** for Type=oneshot; `is-active` exits 3 — compare the
  STRING, never the exit code).
- Verified genuinely driving the VM: repo synced to `/home/test/work/...`, and a
  Welcome instance running there (`welcome/welcome.py --force --screen 1`).
- Output: `~/.pi/agent/spplus-welcome-finish.{out,err,sentinel}`;
  report at `~/fleet/runs/REPORT-welcome-finish.md` + `.DONE`.
- On completion: **read the diff first**, then look at all eight screens' after-shots
  MYSELF. Do not accept the gate summary.

**B. GPT on the manual — RUNNING**, driven by Christopher, not by me. Works only in
`knowledge/` and `docs/HELP-CORPUS-LEDGER.md`. G1/G2/G3 are DEFERRED by the steering
prompt because they touch `app.js`.

**C. The SP+ VM is up and its sleep targets are masked.** It suspended earlier
mid-run and cost a whole pass; `sleep.target suspend.target hibernate.target
hybrid-sleep.target` are now masked and KDE idle timers zeroed.

**D. Queued, NOT dispatched** (both edit `app.js`; must run one at a time, after A):
- `~/fleet/briefs/spplus-welcome-help-links.md` → fid `welcome-help-links`
- `~/fleet/briefs/spplus-welcome-help-search.md` → fid `welcome-help-search`
- `~/fleet/briefs/spplus-welcome-consolidate-code.md` → fid `welcome-consolidate-code`
  (the slimming/snappier pass; baseline 3,045 lines across the four files)

## 4. ARTIFACTS THAT EXIST

- **ISO, built 20:56 tonight, HELD not delivered:**
  `projects/sp-plus/artifacts/spikeB-rootful/out/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso`
  5,498,103,808 bytes. Payload image `localhost/sp-plus-kde:spike` id `c69d0eef8c26`.
  **Verified inside the image**: `helpHome` present in app.js; 0 `href="http` in
  index.html; warmed copy string present; close-gate fix present; installer bakes
  `--target-imgref ghcr.io/secureprospective/sp-plus-kde:latest`.
  It does NOT contain the finishing pass, help links, or search.
- **Stale ISO in ~/Downloads: `sp-plus-2026-08-31-1152.iso` — DO NOT TEST WITH IT.**
  Built 11:52, predates all of tonight's work, still points at the broken `:edge`.
- Build: `~/fleet/bin/sp-plus-iso-build.sh` (rootful, DN-06). Logs
  `~/logs/iso-build-2035.log` (failed at 115) and `~/logs/iso-build-2110.log` (good).

## 5. THE CURRENT STATE — no open bug

Nothing is broken and unexplained right now. The open question is whether Bee's
finishing pass actually finishes the app. **Caveat: the last two passes each fixed
their brief and left the screen still not good** — the design pass moved emptiness
into the folder diagram, the contrast pass moved it into the service cards. Expect
to have to look at the screenshots and judge, not to accept a PASS.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

1. **"sudo is blocked, the ISO can't be built."** FALSE. `/etc/sudoers.d/sp-plus-podman`
   grants passwordless rootful podman. `sudo -n true` fails because `true` is not in
   the rule; every command the build actually runs works. Cost real time — do not
   re-derive.
2. **"`scripts/build-iso.sh` builds the SP+ ISO."** FALSE — it built `sp-plus:poc`
   from the root Containerfile with no Welcome in it. DELETED (`ff249cf`). The only
   path is `~/fleet/bin/sp-plus-iso-build.sh`.
3. **"The design pass died."** FALSE — it succeeded (`ff2246f`); it wrote its
   sentinel on the VM while my chain watched the Beelink.
4. **"`systemctl is-active` non-zero means the job died."** FALSE — exit 3 =
   "activating", the normal state of a Type=oneshot unit for its entire run.
5. **"The capability endpoint is missing."** FALSE — `/.well-known/sppl` is live.
6. **"5.4s service latency."** FALSE — a Beelink cfgate mitmproxy artifact. From the
   VM it is 0.12–0.38s. **Measure on the target, never here.**
7. **"`welcome-lifecycle-gate.sh` can't fail."** Already fixed; it handles the
   `/usr/bin/python3` form. The broken one was `welcome-close-gate.sh` (`774ad2a`).

## 7. DECISIONS MADE TONIGHT

- Update origin changed `:edge` → `:latest` because `:edge` was never published
  (GHCR 404). Reversible in one line if he wants a real edge channel.
- Help search will be **ONE input**, not two: search first, Fin as fallback, because
  the screen already has an Ask Fin box with the same placeholder phrasing.
- Manual = 7 categories proposed, but the trail grid is 3 cols at height:100%, so 7
  may break no-scroll. Fallback: fold "Your files" into "Everyday work".
- Manual work is split by category, resumable via `docs/HELP-CORPUS-LEDGER.md`,
  one article per commit.
- ISO waits for the finished app (his explicit order), even though one is built.

## 8. LEDGER STATE — all committed, tree clean apart from agents' live edits

`1361956` origin fix · `d3abe10` contrast+composition · `774ad2a` close gate ·
`ff249cf` decoy deleted · `53644e3` WIP copy (UNVERIFIED) · `98200ee` href fix ·
`2e2aceb` errant button · `d927598` manual plan · `bacd13d` ledger + GPT prompt.

## 9. NEXT ACTIONS, IN ORDER

1. **Wait for `bee-welcome-finish`.** On sentinel, read the diff, then LOOK at the
   eight after-screenshots myself and judge whether the screen reads as trustworthy.
2. **Read its control audit table.** It was told not to summarise as "all controls
   work". If it did, reject the pass.
3. **Verify the two things the WIP copy commit flags:** no-scroll with the longer
   strings, and whether "Nothing changes until you press Apply" matches the real
   control label.
4. **Dispatch `welcome-help-links`**, then `welcome-help-search`. One at a time.
5. **Then tell GPT that G1/G2/G3 are unblocked**, since app.js is free by then.
6. **Then rebuild the ISO** and copy it to `~/Downloads` with a dated name.
7. **Then `welcome-consolidate-code`** (the slimming pass) while he tests.

## 10. ENVIRONMENT NOTES

- Beelink is his LIVE DESKTOP. **Never launch a GUI here.** All SP+ execution and
  verification runs on the VM or the Dell.
- Before any image build, run the Welcome gate against the working tree first — the
  18-check loop that caught the `href` defect. Finding it at Containerfile STEP 115
  costs ten minutes.
- Two agents share this checkout. Never `git add -A`, never `git stash` (stack is
  shared machine-wide).
- CT105/Claudebox is DOWN until Thursday night; I am headbrain. The MACHINE is still
  reachable over SSH for the resume copy.

## 11. HONEST STATUS

The Welcome app is **not finished and not verified**. Composition has been through
two passes and still is not good. The copy is warmer but unproven. The help screen
has 69 broken cross-references and no search. The manual is 17 of ~34 articles.

What IS solid: the Software Library crash is genuinely fixed and verified inside a
built image; the errant button is fixed; the close gate can now fail; and an
installable ISO exists if he wants it tonight.

Nothing here should be reported as done. Bee's pass is unread.
