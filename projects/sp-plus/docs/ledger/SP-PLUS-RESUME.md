# SP+ RESUME — written 2026-09-01 ~06:40, mid-session

## 1. WHAT WE ARE DOING

Finish the SP+ Welcome app to a standard that can be stood behind, then ship an
ISO. The app work is DONE and an ISO is delivered. The remaining thread is the
in-app manual: GPT is writing it and the corpus can be regenerated and a second
ISO built once it stops.

Repo: `/home/chris/work/secureprospective-advisor-os` (a worktree; do NOT cd to the
original checkout). Branch `session/sp-plus-plan`. Project dir
`projects/sp-plus`.

Test VM: `ssh -p 2222 test@127.0.0.1` — **CONFIRMED ALIVE at 06:40**. Christopher
said he might kill it to install the new ISO; if it is gone, gates that need a
running desktop cannot run and the Dell is the fallback.

## 2. AGENTS + HARNESSES

**GPT (Christopher's, not mine)** is writing the manual, one verified article per
commit, updating `docs/HELP-CORPUS-LEDGER.md` in the same commit. It is racing a
**five-hour usage cooldown** that was at 18% remaining around 06:35. Christopher's
instruction: *let it finish, do not interfere.* Do not touch `knowledge/`, the
ledger, or hold the git index for long.

**Bee is finished.** Its run ended `EXIT=124` (timeout), commit `24d9b5c`, no
report written. Its work has already been reviewed and merged — see §6. Do not
re-dispatch it for this work.

Bee's runner is `~/fleet/bin/run-bee-spplus-impl.sh`; briefs in `~/.pi/agent/`;
sentinels `~/.pi/agent/spplus-<id>.sentinel`.

## 3. IN-FLIGHT RIGHT NOW

- **Background task `b6emzaxxj`** — polls the ledger every 2 min, fires when
  TODO+DRAFTED <= 3, else gives up after ~64 min. Output:
  `/tmp/claude-1000/-home-chris/33018ca6-b1dc-4bd0-8aa4-38a969ed6dae/tasks/b6emzaxxj.output`.
  It only reads a file; killing it costs nothing.
- **QEMU `fedora-test`** (pid 1319034) — the test VM. Christopher's to kill.
- Nothing else. Podman is idle; the ISO build finished at 06:16.

## 4. ARTIFACTS THAT EXIST AND WORK

- **`~/Downloads/sp-plus-2026-09-01-0616.iso`, 5,498,066,944 bytes.** Verified
  `cmp`-identical to the build output and reported bootable by `file`. Built from a
  clean detached worktree at `a2e50ee`. Its build printed
  `WELCOME_HELP_OK search ships, the answer bar stays hidden, corpus intact`.
  **This is the ISO to test with.**
- Build worktree `/home/chris/work/sp-plus-build`, detached at `a2e50ee`, still
  holds the 5.2G ISO (root-owned; `sudo -n` only permits podman, so it cannot be
  deleted from here — harmless, the next build overwrites it).
- **DO NOT TEST** `~/Downloads/sp-plus-2026-08-31-1152.iso` — it still carries the
  broken `:edge` update origin that made the Software Library crash. The two
  `SP-PLUS-cycle*.iso` files are older still.

## 5. GATES

| Gate | Where it runs | State |
|---|---|---|
| `welcome-layout-gate.sh` | VM | PASS on 17-corpus; **NOT re-run on the 34-corpus** |
| `welcome-help-search-gate.sh` | VM | PASS on 17-corpus; **NOT re-run on the 34-corpus** |
| `welcome-help-corpus-gate.sh` | VM | PASS on the 34-article corpus, all 34 open and read |
| `service-link-gate.sh` | VM | PASS |
| `welcome-close-gate.sh`, `welcome-lifecycle-gate.sh` | VM only | PASS |
| `config-preflight.sh` | Beelink | 27/28; only failure is "git tree is dirty" from GPT's in-flight edits |
| stubs / tools / cycle36 / theme-phase2 | Beelink | PASS |

Every gate above was mutation-tested: broken deliberately, seen to fail on the
right line, restored. Gates run on the VM against `~/sp-plus-welcome-src/welcome`
(rsync the repo's `welcome/` there first).

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **"The crash dialogs were caused by something Christopher clicked."** No. Bee was
  launching Welcome over SSH with no display; Qt `qFatal()` aborts, drkonqi shows a
  crash dialog. 16 aborts, all `could not connect to display`. Fixed twice: a guard
  in `welcome.py` (verified — unguarded run produced a fresh core dump, guarded run
  produced none) and `~/.bashrc.d/sp-plus-test-display.sh` on the VM so SSH inherits
  the session display. That bashrc file is **test-rig only and must never ship**.
- **"`sudo` is blocked on the Beelink."** No. `/etc/sudoers.d/sp-plus-podman` grants
  passwordless **podman only**. `sudo -n true` fails, `sudo -n cp` fails, every
  command the build actually runs works.
- **"`systemctl is-active` exit 3 means dead."** No — `activating` is normal for a
  oneshot for its whole run. Compare the state STRING.
- **"No output means an agent is stalled."** No. Bee wrote only to the VM and ran
  `pi --no-session`, so there is no transcript and the repo stays quiet. Judge it by
  fresh screenshot mtimes on the VM.
- **"The layout gate passing means the screen is fine."** It only proved the resting
  state until it was extended; search and article-reading states clipped while it
  said PASS. It now covers 8 screens x 2 sizes + 2 search states + 2 help depths.
- **`.welcome-screen` is NOT the screen selector** — only screen 0 has it. The real
  one is `.screen`. Measuring with the wrong selector produced a page with no active
  screen and meaningless "no overflow" numbers.
- **The theme helper is `/usr/libexec/spplus-apply-theme THEME_ID (--layout|--no-layout)`.**
  Passing `1` exits 64 with a usage line and silently changes nothing. Windows id is
  `org.secureprospective.spplus.windows11.dark`.
- **`pkill -f '<pattern>'` kills this session's own shell** when the pattern appears
  in the command being run. It happened twice (exit 144). Kill by PID.

## 7. DECISIONS

- Christopher supplied the test-rig passphrase/login so a restart is not a blocker.
  It is deliberately NOT written down here.
- Let GPT finish; do not interfere with its budget or the git index.
- The manual is 40 ledger rows but only **37 articles** — G1/G2/G3 are
  infrastructure tasks, and they were implemented in this session, so GPT does not
  need to do them.
- The corpus generator MERGES a partial manual rather than refusing it, because GPT
  routinely stops short against the cooldown.

## 8. LEDGER STATE

HEAD `b7574de`. Everything of mine is committed. Deliberately uncommitted:
`docs/HELP-CORPUS-LEDGER.md` and `knowledge/security/your-encryption-and-recovery-key.md`
are **GPT's in-flight files — do not touch**; `welcome/app/help-data.json` is a
regenerated 34-article corpus that will simply be regenerated again.

## 9. NEXT ACTIONS, IN ORDER

1. **Wait for `b6emzaxxj`** or for Christopher to say GPT has stopped. Do not poll
   GPT and do not run anything that competes for its budget.
2. **Regenerate the corpus:** `python3 scripts/build-help-data.py` from
   `projects/sp-plus`. It merges, so a partial manual is fine. Read its summary.
3. **Re-run the three VM gates against the new corpus** — corpus, layout, search —
   after `rsync -a welcome/ test@127.0.0.1:~/sp-plus-welcome-src/welcome/` (port
   2222). The corpus gate has passed on 34 articles; layout and search have NOT.
4. **Commit the corpus** once those pass.
5. **Rebuild the ISO** from a clean worktree:
   `git -C /home/chris/work/sp-plus-build checkout --detach <HEAD>` then
   `SPPLUS_REPO=/home/chris/work/sp-plus-build bash ~/fleet/bin/sp-plus-iso-build.sh`.
   Copy to `~/Downloads/sp-plus-2026-09-01-<HHMM>.iso` with plain `cp` (the file is
   world-readable; sudo is not available for cp) and verify with `cmp`.
6. **Tell Christopher which ISO to use** and that the older ones must not be tested.

## 10. ENVIRONMENT

- VM: `ssh -p 2222 test@127.0.0.1`, user `test`, repo at
  `/var/home/test/work/secureprospective-advisor-os/projects/sp-plus`, my gate copy
  at `~/sp-plus-welcome-src/welcome`.
- Gates need `QT_QPA_PLATFORM=offscreen`; PySide6 is on the VM, **not** on the
  Beelink, so gates cannot run here.
- Never launch a GUI on the Beelink.
- Build script honours `SPPLUS_REPO` (added this session).

## 11. HONEST STATUS

The app is finished and the ISO is delivered and verified. What is genuinely
unproven: the app has never been run on the **Dell**, which is the slow rig where
races and load times actually show — everything here is VM and offscreen evidence.
The **34-article corpus has passed only the corpus gate**; layout and search were
not re-run against it, so it is not yet fit to ship. GPT had 9 articles left with
roughly 50 minutes of cooldown remaining, which is borderline; if it stops short
the merge keeps whatever it finished and loses nothing.
