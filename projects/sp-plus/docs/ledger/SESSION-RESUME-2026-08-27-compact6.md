# SP+ RESUME — compaction #6, 2026-08-27 ~11:00 CST

## 1. WHAT WE ARE DOING

SP+ (Secure Prospective Advisor OS): Fedora Kinoite 44 bootc/image-mode distro for
financial advisors. The demo Christopher was building toward has HAPPENED (his
`fedora-test` VM shut down cleanly at 10:48 local). Work since then is product work,
not demo prep: opening Fin up, and adding tools he asked for.

- Repo: `/home/chris/work/secureprospective-advisor-os` (a WORKTREE — never `cd` to the
  original root). Branch `session/sp-plus-plan`. Project dir `projects/sp-plus`.
- Machine: Beelink, local. Bee lane lives at `/home/chris/sp-plus-bee/`.
- `sudo -n` works for **podman only**. Root lives INSIDE the guests.

## 2. WHAT CHRISTOPHER ASKED FOR TODAY (all delivered into the image, none boot-verified)

- **Open Fin up.** "The fix options are good, but we need to keep it as a Pi TUI. its
  waaay to restrictive. We have a immutable OS so that by default keeps the user from
  doing anything really stupid." He chose **literally ship Pi** (not a Python lookalike)
  and **ask for the API key on first run** (not baked, not his key now).
- **btop, fastfetch, flameshot** installed AND configured out of the box.
- **Bee must report extensively** that a good ISO works as intended.
- **Disk hygiene** on Beelink — /home was filling.

## 3. IN-FLIGHT / RUNNING RIGHT NOW

**One VM, deliberately left up:**
- `spplus-cycle31-boot`, pid in `/home/chris/sp-plus-iso/cycle31/boot.pid`.
- It is a FULLY INSTALLED, BOOTED cycle31 machine with a working login account
  (`spbtest` / `spplus-test`), created via spb-mkuser. **This is expensive to recreate
  (~50 min). Do not kill it casually.**
- Talk to it: `cd ~/sp-plus-bee && CYCLE=cycle31 ./spb-shell '<cmd>'`
- Alive? `ps -p $(cat /home/chris/sp-plus-iso/cycle31/boot.pid)`

**Nothing else is running.** Bee's unit is stopped; its orphan VM was reaped.

## 4. THE BIG FINDING — THE TEST LANE WAS LYING

Three independent tooling defects were found today. **All were in MY tooling, none in
the product.** This is the highest-value section.

### 4a. `spb-shell` silently truncated output (ROOT CAUSE, now FIXED)
It sent `<cmd>; echo SPBMARK123` then waited for `SPBMARK123`. **The console echoes the
command line first**, so the marker matched instantly — before the command ran — and the
function returned only the echo. Fast commands sometimes won the race; slow ones
returned EMPTY and every gate scored them FAIL.

FIX (applied to `~/sp-plus-bee/spb-shell` and the repo copy): the marker is split across
a quote boundary — `printf '%s; echo "SPB""MARK%s"\n'` — so the echo reads `SPB""MARK123`
and only real output matches `SPBMARK123`. Proven on the exact command that failed.

**THIS BUG PREDATES TODAY.** Any earlier conclusion drawn through spb-shell may have
been based on truncated output. Treat historical spb-shell evidence as suspect.

### 4b. Gate checks matched their own command echo (FIXED)
`check "npm is NOT present" 'command -v npm || echo NPM_ABSENT' 'NPM_ABSENT'` matched
`NPM_ABSENT` inside the ECHO of its own command — it passed regardless of reality.
Caught because `fastfetch is installed — PASS` sat one line above
`fastfetch: command not found`. **The no-key-in-the-image check was one of the false
passes.** `check()` in spb-fin now strips the echoed command, the marker and the escape
noise before matching.

### 4c. Two writers on one serial pty produce interleaved garbage
Running `spb-shell` by hand while `spb-fin` was running made flameshot output appear in
a command that never asked for it. **Only one consumer of the serial pty at a time.**

## 5. VERIFIED BY HAND ON THE INSTALLED cycle31 MACHINE (trustworthy — raw output seen)

- `pi --version` → **0.84.3**; `node --version` → **v22.23.1**.
  → Fin's runtime SURVIVES npm being removed in the same build layer. This was the
  genuinely uncertain part of the Fin rewrite. It works.
- `systemctl is-active sp-plus.service` → **active**
- `ss -ltnp | grep 8765` → **LISTEN 127.0.0.1:8765 only** (DN-21 holds on real hardware)
- `curl 127.0.0.1:8765/api/health` → `{"fixture": true, "ok": true, "service": "sp-plus-rpc"}`
- `flameshot --version` → **Flameshot v14.0.0**
- `spb-login spbtest spplus-test` → **LOGIN_RESULT=SUCCESS**

## 6. NOT YET PROVEN — THE HONEST LIST

- **No clean `spb-fin` run exists.** Runs 1–3 are all void (4a/4b/4c). Run 4 never
  started: `nohup ./spb-fin` failed with `No such file or directory` because cwd was the
  repo, not `~/sp-plus-bee`. **This is NEXT ACTION #1.**
- **cycle32 has NEVER been installed successfully.** Its ISO is built and good; the
  install was destroyed (see 7b).
- **DN-24 (first-login theme) is unobserved.** No screenshot of an SP+ wallpaper on a
  fresh install. cycle31 contains the unit but nobody has looked at the desktop.
- **Print Screen → flameshot is UNVERIFIED and is the single most likely thing to be
  wrong.** `kglobalshortcutsrc` shipped as a defaults layer; whether Plasma honours it
  for a *launch* binding has not been observed. cycle31 does not even contain it.
- **btop/fastfetch/flameshot config: never seen on an installed machine.** cycle32 only.
- **DN-23 remains open and bypassed, not understood** (unchanged from compaction #5).

## 7. ARTIFACTS

### 7a. THE GOOD ISO — cycle32, built, gated, NOT installed
```
/home/chris/work/secureprospective-advisor-os/projects/sp-plus/artifacts/spikeB-rootful/out/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso
5244141568 bytes
sha256 b7780868abab4a0cff058b98884a5546f3c81144ccdda7a9ca13279b774d2529
```
Contains: Fin-as-Pi, DN-24, btop, fastfetch, flameshot config, Print binding.
Build gates all passed: `FIN_AGENT_OK`, `DN24_FIRST_LOGIN_OK`, `TOOLS_OK`,
`FIN_SCHOOL_OK`, `DN21_RPC_LOOPBACK_OK`, `MENU_OK`, `MIME_OK`.
Container image: `localhost/sp-plus-kde:cycle31` and `:spike`.

### 7b. Why cycle32's install does not exist
Anaconda reported `Complete!` at 10:23 (`cycle32/install-end.png` — kept). The disk was
then **recreated at 10:29 at 197 KB**. `spb-install` begins with `qemu-img create`, so
re-running it over a finished install destroys it. Bee appears to have re-run it, then
spent its remaining steps patching boot scripts against an empty disk.

### 7c. cycle31 — installed, booted, has an account
12.3 GB at `/home/chris/sp-plus-iso/cycle31/disk.qcow2`. Contains Fin + DN-24 but NOT
the three tools. Login `spbtest` / `spplus-test`.

## 8. HYPOTHESES REFUTED TODAY — DO NOT RETEST

1. "`pi` is broken on the installed machine." **False.** Gate artifact of 4a. `pi
   --version` returns 0.84.3 by hand.
2. "The SP+ RPC service is not running." **False.** Gate artifact of 4a. active +
   listening + healthy.
3. "The dracut `bochs_drm` error drops the GPU drivers." **False.** `--no-hostonly`
   includes the full module set anyway; `lsinitrd` shows bochs, virtio-gpu, qxl,
   cirrus-qemu, i915 all present. Stale names only, cosmetic. Real names for later
   tidying: `bochs`, `cirrus-qemu`, `virtio-gpu`; `simpledrm` is built-in.
4. "Root can log in over serial." **False and by design.** `rootpw --iscrypted` with a
   random hash generated at install and discarded (DN-13). `spb-mkuser` is MANDATORY.
5. "`spb-mkuser` needs the VM powered off." **False** — this was my own wrong note. It
   types into a VM ALREADY in a `rd.break=pre-pivot` dracut shell. Correct sequence:
   `./spb-boot 'rd.break=pre-pivot'` → `./spb-mkuser spbtest spplus-test` → kill from
   pidfile → `./spb-boot`. At the pre-pivot prompt you must press Enter once
   ("Press Enter for system maintenance") before the shell answers.
6. "podman networking is fine." **False.** Containers have NO outbound network at all on
   this box (not DNS — TCP to anything fails, including the LAN gateway). Host is fine,
   ip_forward=1, firewalld inactive. Could not confirm nftables because `sudo -n` is
   podman-only. **All builds must use `--network host`.** `~/sp-plus-iso-build.sh`
   already does. Ledger note committed: `b5523a1`. NOT fixed — reported only, per the
   standing rule that CT105 owns state on this box.
7. "`dnf remove npm` removes npm." **False.** Matches nothing on Fedora 44 and exits 0.
   Real names: `nodejs22-npm` + `nodejs22-npm-bin` (verified with `--assumeno`; nodejs
   itself stays).
8. "npm can run at build time." **False** without help: `/root` is a dangling symlink to
   `/var/roothome` and `/var` is empty during build → `ENOTDIR: mkdir '/root'`. Needs
   `HOME=/tmp/npmhome npm_config_cache=/tmp/npmcache`.
9. "Bee died because of a bad prompt." **False.** First dispatch was backgrounded inside
   the tool's shell and got REAPED mid-turn. Must run as a `systemd-run --user` unit.
10. "A green build proves a cold build." **False.** The DN-24 build reported success
    entirely from cache while the network was down.

## 9. DECISIONS (Christopher's, do not relitigate)

- **D-Fin-1:** Fin ships as the REAL Pi agent (Node + `@earendil-works/pi-coding-agent`,
  pinned `0.84.3`), not a Python lookalike. Cost ~88 MB of Node accepted.
- **D-Fin-2:** API key is asked for on FIRST RUN and stored per-machine
  (`/etc/sp-plus/fin.env`, else `~/.config/sp-plus/fin.env` 0600). **No credential in
  the ISO, ever.**
- **D-Fin-3:** the vetted playbooks stay, as a Pi skill + keyless `spplus-fix printer`.
- Standing: immutable OS is the guardrail; do not re-cage the assistant at the app layer.
- Standing: `/QEMU` (63 GB), `Downloads` (14 GB), `SP-PLUS-CHRIS-TEST.iso` are HIS —
  do not delete without asking.

## 10. LEDGER STATE

Committed today: `6b4f5b0` (DN-24 + Fin-as-Pi), `b5523a1` (podman network note),
`6137068` (build-gate fixes), `52f3efd` (btop/fastfetch/flameshot), `cfcf7b4` (spb-env
sync).

**UNCOMMITTED — commit these:** `tests/bee-lane/RUNBOOK.md` (spb-mkuser step + corrected
sequence), `tests/bee-lane/spb-fin` (echo-stripping + tightened expectations),
`tests/bee-lane/spb-shell` (the marker fix — MOST IMPORTANT), and untracked
`tests/bee-lane/BRIEF-cycle32.md`.

## 11. NEXT ACTIONS, IN ORDER

1. **Run the gate properly on cycle31** — the cwd bug is why no clean run exists:
   `cd ~/sp-plus-bee && CYCLE=cycle31 ./spb-fin 2>&1 | tee ~/sp-plus-iso/cycle31-fin5.log`
   Expect: Fin checks PASS; btop/fastfetch/skel/Print checks FAIL because cycle31
   predates them. That shape = healthy.
2. **Commit the four Bee-lane files** listed in §10.
3. **Install cycle32 cleanly**, with NOTHING else touching QEMU or the serial ports:
   `cd ~/sp-plus-bee && export CYCLE=cycle32 && ./spb-install`
   then pre-pivot → `./spb-mkuser spbtest spplus-test` → kill → `./spb-boot` → `./spb-fin`.
   **Never re-run `spb-install` over a finished install — it wipes the disk.**
4. **Look at the desktop** (`spb-screen`): is the wallpaper SP+ or Fedora's? That is
   DN-24's only real proof.
5. **Press Print Screen in a real session.** flameshot, Spectacle, or nothing?
6. **Re-dispatch Bee** for the extensive report Christopher asked for, on a QUIET
   machine: `systemd-run --user --unit=bee-cycle32 ... ~/sp-plus-bee/run-cycle32.sh`.
   Brief is `~/sp-plus-bee/BRIEF-cycle32.md` (already corrected: real ISO sha, mkuser
   step, no `tail -f` sentinel). Watch `~/sp-plus-bee/REPORT-cycle32.DONE`.
7. **Deliver the ISO to `~/Downloads/`** once something has actually booted and passed.

## 12. ENVIRONMENT NOTES / TRAPS

- **`pkill -f` and `pgrep -f` match your own shell.** Bit again today: a `pgrep -f
  spb-mkuser` liveness check matched the monitor's own command line. Kill from pidfiles.
- **Never pipe `spb-boot`** — it leaves children holding the pipe open.
- **`spb-boot` hardcodes host port 2299.** Two concurrent boots collide. One VM at a time.
- **Only one writer on a serial pty.**
- **Bee/pi is a Node process — `stdbuf` does NOT unbuffer it.** A zero-byte log proves
  nothing. Poll the session transcript instead:
  `/home/chris/.pi/agent/sessions/--home-chris-sp-plus-bee--/*.jsonl`
- Bee dispatch must be a systemd unit, not a backgrounded child.
- `~/sp-plus-iso-build.sh` does NOT print "ISO build complete" — don't wait for it.
- Disk: /home at 84%, 73 GB free after today's reclaim (~27 GB total).

## 13. HONEST STATUS

The cycle32 ISO is built and every build-time gate passes, and the one genuinely risky
thing about the Fin rewrite — whether `pi` still runs after npm is removed — is PROVEN
on real installed hardware. But **no complete gate run has ever succeeded**, cycle32 has
never been installed, and nobody has LOOKED at the desktop or pressed Print Screen.

The day's real story is that the test lane was reporting false passes and truncated
output, and that was found by noticing two adjacent contradictory lines rather than by
the tooling catching itself. The product held up better than the tools that were
measuring it. Do not tell Christopher the ISO is good until §11 items 1–5 are done.
