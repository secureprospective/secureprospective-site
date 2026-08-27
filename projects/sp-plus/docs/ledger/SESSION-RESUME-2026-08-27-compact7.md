# SP+ RESUME — compaction #7, 2026-08-27 ~13:35 CST

## 1. WHAT WE ARE DOING

SP+ (Secure Prospective Advisor OS): Fedora Kinoite 44 bootc/image-mode distro for
financial advisors. Today's work: fixing what cycle32 testing exposed, opening Fin up,
and theming. **cycle34 is being verified and built by Bee right now.**

- Repo: `/home/chris/work/secureprospective-advisor-os` (a WORKTREE — never `cd` to the
  original root). Branch `session/sp-plus-plan`. **No work on main, ever. Never
  `git --no-verify`.**
- Christopher's next focus, stated: **get the first-boot wizard 100% right**, because a
  working wizard is the vehicle for first-timer orientation.

## 2. IN-FLIGHT RIGHT NOW (most perishable)

**Bee is building cycle34.**
- Unit: `systemctl --user is-active bee-cycle34` (transient, started ~13:30).
- Brief: `~/sp-plus-bee/BRIEF-cycle34.md` (also committed at
  `projects/sp-plus/tests/bee-lane/BRIEF-cycle34.md`).
- Runner: `~/sp-plus-bee/run-cycle34.sh`. Log: `~/sp-plus-bee/bee-cycle34.log`.
- Bee verifies 10 preflight items, THEN starts `systemd-run --user --unit=spplus-build-cycle34`
  (log `~/sp-plus-build-cycle34.log`) and waits ~15 min.
- **Sentinel:** `~/sp-plus-bee/REPORT-cycle34.md` + `REPORT-cycle34.DONE`.
- A watcher was running in this session; it dies with compaction. Re-check by hand:
  `ls ~/sp-plus-bee/REPORT-cycle34.DONE` and `systemctl --user is-active bee-cycle34`.
- If Bee died: its reasoning is only in its own pi session; re-dispatch with
  `systemd-run --user --unit=bee-cycle34 --collect -p TimeoutStartSec=infinity ~/sp-plus-bee/run-cycle34.sh`.
- **When the report lands:** read it, confirm gates, confirm `~/Downloads/SP-PLUS-cycle34.iso`
  exists with a sha256, and hand it to Christopher.

**cycle32 VM still running** (pid was 3408107, `spplus-cycle32-boot`).
- SSH: `ssh -p 2232 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  -o IdentitiesOnly=yes -i ~/.ssh/id_ed25519 spbtest@127.0.0.1`
- My key is installed in that guest. Serial pty: `/home/chris/sp-plus-iso/cycle32/bserialpty`.
- Useful as the live inspection box. NOT precious — cycle33/34 supersede it.

**Christopher has cycle33 booted** in his libvirt VM `fedora-test`. **NEVER kill
`fedora-test` or a VM named `chris`.** Read-only look: `virsh screenshot fedora-test out.ppm`.

## 3. ARTIFACTS

| What | Path | Bytes | sha256 |
|---|---|---|---|
| cycle32 ISO | `~/Downloads/SP-PLUS-cycle32.iso` | 5244141568 | `b7780868abab4a0cff058b98884a5546f3c81144ccdda7a9ca13279b774d2529` |
| cycle33 ISO | `~/Downloads/SP-PLUS-cycle33.iso` | 5279907840 | `282f6a15b4b624e6860cee525173dc23faf28d8fd6feb01f5513de0a2e19edf2` |
| cycle34 ISO | pending Bee | — | — |

cycle33 booted image digest: `sha256:a1a99a6baa313f2ed074c0591f89bb3432d8b3a90761af403a58382aa642e1b0`.

## 4. WHAT IS IN cycle34 (all committed, none built yet)

1. **DN-24 wallpaper** — first-login reads the config back and retries; no stamp on failure.
2. **Print Screen → flameshot** — `flameshot-capture.desktop` (`Exec=flameshot gui`) bound to
   Print; stock entry explicitly unbound; daemon autostarted for Wayland.
3. **fastfetch logo** moved out of `/etc/skel` into `/usr/share/sp-plus/branding/`.
4. **Full LibreOffice** — impress, draw, base, math added.
5. **Fin coaching tips** — 20 tips, 3 stages, one per session, `fin --tips on|off|list`.
6. **`/techhelp`** — 3 problems + open option. NO "can't get online" option (Fin is cloud).
7. **Fin admin rights** — `%wheel NOPASSWD` + `spplus-grant-admin.service` every boot.
8. **3D block logo** — extruded, 4 colour slots, symmetric 7x7 plus.
9. **fastfetch panel** — 4 sections incl. PROTECTION; PROTECTION must stay LAST (see §6).
10. **starship ribbon** — v1.26.0 pinned by sha256, U+258C transitions, no nerd glyphs.
11. **LibreOffice MS-Office defaults** — ribbon, Colibre, docx/xlsx/pptx, font substitution.

## 5. GATES / STATUS

| Surface | State |
|---|---|
| cycle33 built, all gates green | PASS (`MENU_OK visible_entries=28`) |
| cycle33 installs, boots, themed desktop | **PROVEN on Christopher's VM** |
| DN-24 wallpaper | **FIXED, proven visually on cycle33** |
| `/etc/skel` copied by the wizard | **PROVEN** — btop themed on a wizard account |
| Fin runs, banner correct, key prompt | PROVEN |
| Print Screen first-press behaviour | **UNPROVEN** — fix is in cycle34, unbuilt |
| Fin admin rights | **UNPROVEN** — never run against a wizard account |
| Coaching tips / techhelp | verified on a pty locally; unproven on a real install |
| LibreOffice defaults | unproven; never opened LibreOffice on any SP+ machine |
| 10 SELinux AVCs (bootupctl/lsblk, `/boot`) | OPEN, deliberately deferred |

## 6. HYPOTHESES REFUTED / TRAPS — DO NOT REDISCOVER

- **`pgrep -f <pattern>` and `ps|grep` match your own shell.** Bit twice today; once I
  reported "VM UP" when it was down. Use `ps -eo pid,args | grep -F` and check the pid.
- **`pi` processes show in argv only as `pi`** — the `-n <name>` is NOT in the command line.
  Searching for the session name finds nothing and looks like a dead agent.
- **`pi -p` buffers output until it exits.** A near-empty log is NOT a stall.
- **A backgrounded qemu is reaped when the tool shell exits.** Use `systemd-run --user`.
  But `systemd-run` with a script that exits ALSO kills the VM (cgroup teardown) unless
  `-p RemainAfterExit=yes`.
- **`spb-boot` orphans survive their VM.** setsid'd GRUB hammer + typist typed into the
  NEXT run's VM, interleaving two `console=` args and corrupting `load_video` into
  `eload_video`. Fixed with an flock — and **qemu inherits fd 9 and holds the lock for
  its whole life**, so every long-lived child now closes it (`9>&-`).
- **`spb-shell` cut the log 1s after its marker**, before output flushed; the RPC health
  check reported FAIL for a service returning `ok:true`. Now waits for quiescence.
- **`spb-boot` hardcoded ssh port 2299** so a second cycle killed its own qemu. Now
  derived per cycle (cycle31→2231, cycle32→2232), `SPB_SSHPORT` overrides.
- **A keyless fastfetch `custom` module after a KEYED one inherits that key.** Section
  headers rendered as `System | HARDWARE`. PROTECTION is last to avoid it. `"key": ""`
  does NOT fix it — it renders the label "Custom".
- **fastfetch rejects a raw ESC byte in JSON.** Escapes must be the JSON escape sequence.
- **XML comments may not contain a double hyphen.** Broke the LibreOffice xcu once.
- **Comments inside a Dockerfile `RUN` chain** are a known trap; keep them above the RUN.
- **A `grep -A2` context window is fragile** — adding explanatory comments pushed the
  asserted line out of the window and failed the first cycle33 build. Use awk section scoping.
- **starship is NOT in Fedora 44 repos.** No nerd/powerline fonts in the image either
  (fc-list finds zero) — powerline arrows would render as tofu.
- **Carlito is already installed; Caladea and Tinos were NOT** (both now added).
- **podman has NO outbound network** on this box; the build uses `--network host`. Not fixed,
  not ours to fix. `sudo -n` works for podman only.

## 7. DECISIONS (do not relitigate)

- **D-Fin-1/2/3**: ship real Pi (not a lookalike); ask for the API key on first run, stored
  per-machine; do NOT change how keys are fetched.
- **docx/xlsx/pptx as defaults** — Christopher, explicitly. Nag suppressed.
- **`/techhelp` has no "can't get online" option** — the cloud AI cannot help an offline box.
- **Fin gets passwordless sudo out of the box.** Consequence recorded: anyone at an unlocked
  session is effectively root. Accepted; containment is architectural + LUKS.
- **Only well-maintained third-party components** ship in SP+.
- **Pi skills/extensions research is ON THE TABLE, not imminent.** Do not start it.
- **Bee does the work.** Christopher: "you need to push Bee to do the work, i see you have
  been doing everything." Brief it, dispatch detached, wait for the sentinel.

## 8. LEDGER STATE — all committed, tree clean

`fd8727f` wizard test plan · `4760138` theming · `e210cad` plus fix · `5ae3fb2` LibreOffice +
cycle34 brief. Research archived at `projects/sp-plus/docs/ledger/RESEARCH-libreoffice-msoffice.md`.
Pi skills report is at `~/sp-plus-bee/REPORT-pi-skills-extensions.md` — **NOT yet copied into
the repo.** Do that when it becomes relevant.

## 9. NEXT ACTIONS, IN ORDER

1. **Check Bee**: `ls ~/sp-plus-bee/REPORT-cycle34.DONE`; `systemctl --user is-active bee-cycle34`.
2. **Read `~/sp-plus-bee/REPORT-cycle34.md`** — gates, ISO path, sha256. If the build FAILED,
   fix the cause; do not retry blind.
3. **Deliver** `~/Downloads/SP-PLUS-cycle34.iso` to Christopher with its sha256.
4. **Then: the wizard.** Work `projects/sp-plus/docs/ledger/WIZARD-TEST-PLAN.md` in its stated
   order — `btop` (settled), `sudo -n true`, desktop, Print Screen, `fin` + `/techhelp`.
5. **Predicted wizard bug, written down before it happens:** `spplus-grant-admin` runs at boot
   and may run BEFORE the wizard creates the account. If sudo fails in the first session and
   works after a reboot, that is the cause; fix is to trigger on session start too.
6. Only after the wizard is right: first-timer orientation (Christopher's stated goal).

## 10. HONEST STATUS

cycle33 is real and good: it installs, boots, and the desktop is correctly themed on
Christopher's own machine. cycle34 exists only as source — **it has never been built, and
the moment Bee reports, that claim changes**. Everything in §4 items 5–11 has been verified
locally or by build gate ONLY. Nothing in cycle34 has been seen running on a real install by
anyone. Do not describe cycle34 as working until §9 items 1–3 are done.
