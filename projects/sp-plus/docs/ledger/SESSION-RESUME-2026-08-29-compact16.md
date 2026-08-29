# SP+ RESUME — compact 16 — 2026-08-29

## 1. WHAT WE ARE DOING

Turning Welcome into a first-class help application: an ask box in the help
station that sends the advisor's question to Fin (Pi, branded) and shows the
answer. cycle38 is built, installed on a real guest, and verified except for
one layout defect now out with Bee.

Repo (Beelink): `~/work/secureprospective-advisor-os`, branch
`session/sp-plus-plan`, project under `projects/sp-plus`.
Beelink: `ssh chris@192.168.1.190`. CT105 is where I run.

## 2. AGENTS + HARNESSES

- `/root/run-bee.sh <brief.md> [timeout]` — dispatch to Bee (Pi, gpt-5.6-luna,
  provider openai-codex) on the Beelink. **Run it as `/root/run-bee.sh`; a bare
  `./run-bee.sh` fails because the session cwd is `/root/.claude`.**
- Briefs: `/root/briefs/`. Runs: `/root/bee-runs/<stamp>_<tag>/{out,err,verdict}`.
- **NEVER run two dispatches concurrently.**
- `run-bee.sh` now appends a standing `NO_GUI` constraint to EVERY dispatch:
  no browser/Qt/GTK/xvfb/Playwright on the Beelink, render in the VM instead.
  Added 2026-08-28 after Bee launched Firefox and Chromium on Christopher's
  desktop mid-Zoom-call. Backup: `/root/run-bee.sh.bak-*`.

## 3. IN-FLIGHT RIGHT NOW (most perishable)

**Bee dispatch `spplus-answer-overlay`** — started 2026-08-29T01:09:15Z,
timeout 2400s, so it expires ~01:49Z.
- Brief: `/root/briefs/spplus-answer-overlay.md`
- Run dir: `/root/bee-runs/20260829T010915Z_spplus-answer-overlay/`
- Alive check (transcript mtime, NOT the artifacts):
  `ssh chris@192.168.1.190 'stat -c %y ~/.pi/agent/sessions/--home-chris--/2026-08-29T01-09-17-703Z_nrl-spplus-answer-overlay.jsonl'`
- Recovery if killed: that transcript IS the reasoning. `run-bee.sh` also pulls
  it to `session.json` automatically when stdout is under 1500 bytes.
- **Bee edits the Beelink tree directly and does not commit**, so its work shows
  as a dirty tree, not as output. Check `git -C ~/work/secureprospective-advisor-os status --short`.
- When it returns: triage the diff, then RE-MEASURE MYSELF with isolate.py.
  Do not take 6/6 on trust.

**Guest VM `spplus-c38`** — running, id 3. Christopher's own VMs (LMDE,
win11-cowork) are shut off; leave them alone.

## 4. GATES / STATUS

| Item | State |
|---|---|
| cycle38 build, all gates | PASS incl. FIN_GUARDRAILS_OK, WELCOME_EGRESS_OK |
| 19 Containerfile assertions replayed vs source | PASS |
| preflight gate (10 checks) | PASS |
| extension gate | 49/49 |
| cycle36 source gate | PASS |
| Fin `--ask` on real install | PASS, PONG in 5.25s |
| arg guards (0/empty/2 args) | PASS, rc=2 each |
| security S1–S4 on real install | PASS, guardrails refuse in plain language |
| ask-box states (5) | PASS |
| welcome-close-gate | PASS |
| Welcome starts/stops | PASS |
| **layout: 6 trail cards with an answer showing** | **FAIL — out with Bee** |

## 5. ARTIFACTS

- ISO: `/home/chris/Downloads/SP-PLUS-cycle38.iso`, 5,451,198,464 bytes,
  sha256 `b9bc1fd9f83dbd858773198f6ca08d2d5c3a5df4216fde96b83b75884596dfdd`
- Build log: `~/sp-plus-build-cycle38-20260828T225735Z.log`
- Guest disk: `~/.local/share/libvirt/images/spplus-c38.qcow2`
- Last commit: `55c7868 Welcome: make the ask box actually answer`

## 6. THE CURRENT BUG

Measured on the REAL install, maximised Welcome, viewport **1360x690**:

    ask box present, no answer yet ....... 6 of 6 cards visible
    ask form removed entirely ............ 6 of 6
    answer showing ....................... 3 of 6

The form costs nothing; **displaying an answer evicts the bottom row**, at every
pane height 40px through 100px. Worse: `.help-content` is `overflow:hidden` and
`askFeedback.hidden` is set to `false` in exactly one place and never back to
`true`, and RETURN TO TRAILS does not clear it. So after one question, three
help trails are clipped and unreachable for the rest of the session.

Fix chosen by Christopher: **the answer overlays the trails** rather than
displacing them, plus a dismiss control. Out with Bee now.

Acceptance is a number: `isolate.py` must report 6/6 cards WITH an answer
showing at 1360x690.

## 7. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **"The pane cap just needs to be smaller."** REFUTED. Swept 40/56/64/72/80/
  90/100px at the real viewport: 3/6 cards at every one.
- **"The guest was CPU-loaded, that is why pi was slow."** REFUTED. Guest load
  average was 0.08. I had misread lifetime CPU averages as current.
- **"pi hangs because stdin is left open."** REFUTED. Same command with stdin
  open and with `</dev/null` both completed in 11s and 7s.
- **"The guardrail extensions cause the pi hang."** REFUTED. It reproduces with
  NO extensions loaded (test D1, rc=124, 180s, zero bytes).
- **"SELinux disabled / no desktop is a cycle38 defect."** REFUTED. Caused by my
  own hand-rolled kickstart skipping the product's `%post`. Fixed by splicing
  the product's `%post` in verbatim; the reinstall gives Enforcing + graphical.
- **"`--ask` needs `--provider anthropic`."** REFUTED and removed; the
  interactive path pins no provider and the advisor may be logged in elsewhere.

## 8. DECISIONS

- Answer must OVERLAY the trails, with a dismiss control (2026-08-29).
- Light mode only, never dark. Accept the theme mismatch deliberately.
- All writes confined to `~/Documents/Fin`.
- Fin keeps full sudo; guardrails gate irreversibility, not privilege.
- NOPASSWD stripped from Fin's identity; privileged work behind a typed broker
  (DN-31 A1) — designed, NOT built.
- All coding goes to Bee. I stay headbrain and protect context.
- Bee must never launch a GUI on the Beelink.

## 9. LEDGER STATE

Committed: `55c7868`, `fe9d245`, and DN-31 + its amendment.
NOT yet written: a ledger note recording the `pi` hang (intermittent, alive at
0% CPU, no transcript, reproduces with no extensions) and the ostree
home-directory trap. Both should be written before session close.

## 10. NEXT ACTIONS, IN ORDER

1. **Read Bee's overlay report** in `/root/bee-runs/20260829T010915Z_spplus-answer-overlay/out`.
2. **Re-measure myself** with `isolate.py` in the guest. Require 6/6 with an
   answer showing. Do not trust the report's number.
3. **Check the dismiss actually resets** `hidden = true`, and that RETURN TO
   TRAILS clears the pane.
4. Run `node --check`, the em-dash check, `id="ask-fin"`=1, `NO DATA SENT`=0,
   and `tests/cycle36-source-gate.sh`.
5. Commit on `session/sp-plus-plan`.
6. Decide with Christopher whether the overlay needs a cycle39 ISO or whether
   the guest overlay test is enough.
7. Write the two ledger notes from section 9.

## 11. RELAY / ENVIRONMENT NOTES

- Guest: `ssh -o UserKnownHostsFile=/tmp/c38_kh -p 2222 test@127.0.0.1` FROM the
  Beelink. Key auth, passwordless sudo. Helper: `/tmp/g38.sh` on the Beelink
  pipes a heredoc into the guest.
- The 2222 forward was added live and **dies when the VM shuts down**. Re-add:
  `virsh qemu-monitor-command spplus-c38 --hmp "hostfwd_add hostnet0 tcp:127.0.0.1:2222-:22"`
- Guest screen is **1360x768**, giving a real maximised viewport of **1360x690**.
  A bare `QWebEngineView.resize(1366,768)` is NOT representative and is clamped
  by the screen; always measure the real maximised window.
- LUKS passphrase for the test guest: the disposable one already in the
  kickstart. Type it with `virsh send-key ... KEY_S KEY_P ...`.
- Graphical tests in the guest need
  `XDG_RUNTIME_DIR=/run/user/1000 WAYLAND_DISPLAY=wayland-0 QT_QPA_PLATFORM=wayland`.
- Ignore libEGL/libva/dri2/GPU/StagingBuffer noise; the VM has no GPU.
- **Quoting through ssh + heredoc + python breaks.** Write the script locally and
  scp it. This has cost time four separate times today.
- Beelink `git status` dirty is usually Bee working, not a mistake.
- On ostree, `/home` is `/var/home` and `/var` is re-initialised at first boot,
  so a user created at install time comes up with NO home directory. The
  product dodges this by shipping no account (DN-13).

## 12. HONEST STATUS

cycle38 is built, installed and verified on a real machine on everything except
the layout defect. The ask box genuinely works end to end: question, bridge,
QThread, Fin, answer, about 5 seconds.

Genuinely unproven:
- The overlay fix. Bee is writing it now; nothing has been measured yet.
- The `pi` hang. Intermittent, cause unknown, NOT our code. It degrades to a
  handled "Fin took too long" after 120s, which is why it is not a blocker.
- Whether cycle38 needs rebuilding after the overlay lands. The ISO on disk does
  NOT contain the overlay fix.
- Indirect prompt injection, and four other DN-31 findings, remain open.
