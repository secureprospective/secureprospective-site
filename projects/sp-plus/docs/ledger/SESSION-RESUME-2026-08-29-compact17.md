# SP+ RESUME — compact 17 — 2026-08-29

## 1. WHAT WE ARE DOING

Getting SP+ Welcome working "on all fronts" so ISO **cycle40** can be tested on
bare metal. Function first, UI polish later (Christopher's explicit ordering).
Nine `data-stub` buttons must become real behaviour, plus three lifecycle
defects that break first boot.

Repo (Beelink): `~/work/secureprospective-advisor-os`, branch
`session/sp-plus-plan`, project under `projects/sp-plus`.
Beelink: `ssh chris@192.168.1.190`. CT105 is where I run. I am headbrain; all
coding goes to Bee.

## 2. AGENTS + HARNESSES

- `THINKING=high /root/run-bee.sh <brief.md> [timeout]` — dispatch to Bee
  (gpt-5.6-luna, provider openai-codex). **`run-bee.sh` defaults THINKING=low;
  Christopher wants high, so set it explicitly every time.**
- Briefs: `/root/briefs/`. Runs: `/root/bee-runs/<stamp>_<tag>/{out,err,verdict}`.
- **NEVER run two dispatches concurrently.**
- Bee edits the Beelink tree directly and does NOT commit. Its work shows as a
  dirty tree, not as output.

## 3. IN-FLIGHT RIGHT NOW (most perishable)

**Bee dispatch `spplus-welcome-lifecycle`** — started 2026-08-29T13:51:51Z,
timeout 2400s, expires ~14:32Z.
- Brief: `/root/briefs/spplus-welcome-lifecycle.md`
- Run dir: `/root/bee-runs/20260829T135151Z_spplus-welcome-lifecycle/`
- Alive check (transcript mtime, NOT artifacts):
  `ssh chris@192.168.1.190 'stat -c %y $(ls -t ~/.pi/agent/sessions/--home-chris--/*lifecycle* | head -1)'`
- Recovery if killed: that transcript IS the reasoning.
- **Hang tell:** transcript static + pi at 0% CPU = hung. Kill and continue;
  the tree work survives.

**Chain script `/root/queue-stubs.sh`** (pid was 1250263) — waits for the
lifecycle verdict, then auto-dispatches `spplus-welcome-all-stubs.md` at
THINKING=high, 2700s. Log: scratchpad `chain.log`.
- **If compaction kills it, re-arm by hand:** wait for the lifecycle verdict,
  then `cd /root && THINKING=high /root/run-bee.sh /root/briefs/spplus-welcome-all-stubs.md 2700`

**Guest VM `fedora-test39`** — running under `qemu:///session`, id 7.
Christopher's LMDE and win11-cowork are shut off; leave them alone.

## 4. GATES / STATUS

| Item | State |
|---|---|
| cycle39 ISO built, delivered | PASS, in `~/Downloads` |
| cycle39 pre-build gate | PASS 10/10 |
| Bridge verbs `apply-theme`, `ask` | working, shipped |
| Bridge verbs `install`, `browse-store` | code in tree, gates pass, **NOT live-verified** |
| `node --check app.js` | PASS |
| `python3 -m py_compile welcome.py` | PASS |
| Stubs converted to real code | **3 of 9** |
| Stubs live-verified | **0 of 9** |
| hero.js idle CPU spin | **PROVEN**, fix in flight |
| 3-instance defect | **PROVEN**, fix in flight |
| Welcome clean exit | **BROKEN**, fix in flight |
| Installer 8% bar | root cause measured, brief queued, NOT started |

## 5. ARTIFACTS THAT EXIST AND WORK

- **cycle39 ISO**: `/home/chris/Downloads/SP-PLUS-cycle39.iso`
  5,450,354,688 bytes,
  sha256 `bc2e5bf0789c6911b17c73f41297347a004580b5aee6073689243cabb6854f9d`
- Build log: `~/sp-plus-build-cycle39-20260829T122703Z.log`
- Prior ISOs in `~/Downloads`: cycle37, cycle38. **Christopher's. Do not delete.**
- Last commit: `707664d`. Uncommitted in tree: tools-lane code (app.css,
  app.js, index.html, welcome.py = 202 lines) + `tests/welcome-tools-source-gate.sh`
  + two ledger docs.

## 6. THE CURRENT WORK — three lifecycle defects, all PROVEN

**A. `app/hero.js` pins CPU at idle.** A `requestAnimationFrame` canvas loop,
~158,000 ops/sec, forever, with no interaction. Controlled A/B on the guest,
idle, renderer measured via `/proc` deltas:

    with hero.js     renderer = 28% idle
    without hero.js  renderer =  0% idle

With the window visible on a GPU-less machine: `welcome.py` 110%,
`kwin_wayland` 71%, renderer 28%. Welcome AUTOSTARTS onto the screen carrying
this canvas.

**MEASUREMENT TRAP:** a first A/B measured `welcome.py` and read 0% in BOTH
arms, which looks like "no defect". The burn is in the RENDERER. Measure the
renderer, with the window genuinely visible, or this reads as absent.
Also: `ps pcpu` is a LIFETIME AVERAGE — never use it for "is it busy now".

**B. Three Welcome instances can run at once.** `welcome.py` has NO
single-instance guard. Three launch paths: `/etc/skel` autostart, KDE's
`plasma-fallback-session-restore.desktop`, and the Applications menu entry.

**C. Welcome does not exit.** Processes and renderers found resident after
close. One instance ran 55 minutes at 111% CPU.

## 7. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **"The installer bar fix failed because of PATH resolution."** REFUTED. The
  wrapper DID run; `/var/log/anaconda/packaging.log` shows its output.
- **"The installer bar fix failed because the scratch bind fell through."**
  REFUTED. The bind succeeded: "bound /mnt/sysimage/boot to /var/tmp".
- **"bootc can report progress natively."** REFUTED. bootc 1.16.9 has no
  `--progress-fd` and no JSON progress. We must measure ourselves.
- **"Welcome does not spin at idle."** REFUTED — that reading came from
  measuring the wrong process (see the trap in section 6A).
- **"The 3 Welcome instances were just a Bee test artifact."** REFUTED. There
  is genuinely no single-instance guard and three independent launch paths.
- **"Bee was hung both times for unknown reasons."** REFUTED. Both runs blocked
  on a FOREGROUND Welcome launch that never returned.

## 8. DECISIONS

- Welcome must work on all fronts in ISO 40. **Function before UI polish.**
- **Lifecycle fix must be IN ISO 40** so first boot is correct (Christopher).
- Build the ISO only when things are good and ready (Christopher).
- **Reference hardware: 14-year-old Dell, no GPU, 8 GB RAM, spinning HDD.** It
  is the acceptance floor. Beelink numbers are NOT evidence for it.
- Email: **no Thunderbird, no IMAP wizard.** GWS/M365 via the browser, plus a
  launcher. SP+ never handles the advisor's email password.
- Office folder credentials: **KDE Wallet via GIO/gvfs, never plaintext.** My
  call, made to unblock the lane. Christopher has NOT reviewed it.
- Printer: exactly ONE physical test page; it prints in Christopher's office.
- All coding goes to Bee. I stay headbrain and protect context.

## 9. STANDING RULES LEARNED TODAY

- **Any brief that launches Welcome MUST background it under `timeout` and kill
  by PID afterwards.** Foreground launches have killed two dispatches.
- **Briefs must require per-step reporting, not one final block.** Two runs did
  real work and emitted zero bytes.
- `pkill -f <pattern>` over SSH kills your own session when the pattern appears
  in your command line. Kill by PID, or ship a script file.
- Nested heredocs through SSH break. Write locally, `scp`, then run.

## 10. LEDGER STATE

Committed: nothing new this session; HEAD is still `707664d`.
Written but NOT committed:
- `projects/sp-plus/docs/ledger/DEFECT-installer-progress-8pct.md`
- `projects/sp-plus/docs/ledger/REFERENCE-HARDWARE-dell.md`
- `projects/sp-plus/tests/welcome-tools-source-gate.sh`
- the tools-lane source changes

## 11. NEXT ACTIONS, IN ORDER

1. **Check the lifecycle run** — verdict in its run dir, or transcript mtime.
2. **Re-measure its claims myself.** Idle renderer CPU with the window visible
   must be at or near 0%. Do not take the report on trust.
3. **Verify single-instance**: launch twice, expect one window, one process set.
4. **Verify clean exit**: after close, zero `welcome.py`, zero
   `QtWebEngineProcess`, zero zygotes.
5. **Confirm the all-stubs dispatch fired** (chain script). If not, dispatch it
   by hand per section 3.
6. **Run the tools-lane live verification** if Bee still has not: install
   Bitwarden and Signal for real, prove with `flatpak info --user`.
7. Dispatch `/root/briefs/spplus-installer-progress-v3.md`.
8. Gates green, then commit everything on `session/sp-plus-plan`.
9. **Build cycle40** via `/home/chris/sp-plus-iso-build.sh`, deliver to
   `~/Downloads/SP-PLUS-cycle40.iso` with sha256.
10. Dell bare-metal test: Secure Boot on, **no MOK screen** (Gate 0.B), plus
    mDNS printer discovery, which the VM structurally cannot verify.

## 12. RELAY / ENVIRONMENT NOTES

- **Guest SSH: `ssh -p 2239 test@127.0.0.1` FROM the Beelink.** Key auth works,
  `sudo -n` returns root, Fin IS connected.
- **The forward at 127.0.0.1:2239 was added LIVE to the running QEMU process
  via the monitor and is NOT in the domain XML. If `fedora-test39` is powered
  off, the forward is GONE.** Re-add with:
  `virsh -c qemu:///session qemu-monitor-command fedora-test39 --hmp "hostfwd_add hostnet0 tcp:127.0.0.1:2239-10.0.2.15:22"`
- Guest password is `password` (test user) if key auth is ever lost. No
  `sshpass` on the Beelink; drive the prompt with a Python `pty` script.
- Beelink `sudo` is passwordless ONLY for podman (`/etc/sudoers.d/sp-plus-podman`).
- Printer: HP DeskJet 2800 at `192.168.1.210`, IPP 631 and raw 9100, both
  reachable from the guest. **mDNS is NOT reachable from the guest** (QEMU NAT
  drops multicast).
- Beelink `/home` at 82%, 80 GB free. Watch it; each ISO is ~5.4 GB.

## 13. HONEST STATUS

**Two hours of session time produced 3 of 9 stubs in code, none live-verified,
plus three proven root causes.** That is thin, and the cause was mine: the
first brief told Bee to launch Welcome without saying to background it, and
Welcome never exits, so two dispatches blocked and returned zero bytes.

Genuinely unproven right now:
- Every one of the 9 stubs. None has been demonstrated working on a real system.
- The lifecycle fix. In flight, not yet measured by me.
- The installer progress fix. Not started; two prior attempts shipped broken
  because they were verified by reading code instead of watching an install.
- mDNS printer discovery. Cannot be proven anywhere but the Dell.

ISO 40 is **not** close to buildable yet. The realistic gate is: lifecycle
verified + stubs live-verified + gates green.
