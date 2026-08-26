# SP+ SESSION RESUME — 2026-08-26 (compact #2)

**Read this first. Christopher will say "we are back". Resume at §9 NEXT ACTIONS item 1.**
Do not recap, do not re-derive, do not re-test §6.

---

## 1. WHAT WE ARE DOING

Building **SP+**, a Fedora-Kinoite-44-derived immutable (bootc/image-mode) Linux distro for
financial advisors. Session goal: an ISO with a **working GRAPHICAL installer** that completes
an encrypted install. **Mile marker 1 (graphical installer) IS HIT.** Now closing out the
security properties.

- **Repo (Beelink only):** `chris@192.168.1.190:~/work/secureprospective-advisor-os`
- **Branch:** `session/sp-plus-plan` (local only, no remote)
- **Subproject:** `projects/sp-plus/`
- **SSH:** `ssh -i /root/.ssh/beelink chris@192.168.1.190`
- **Dell (HW-00, bare-metal target, FREE TO WIPE):** `ssh -i /root/.ssh/laptop-sweep trader@192.168.1.201`
  2014 Inspiron 5737, UEFI+GPT, Secure Boot present but disabled, **NO TPM**, i5-4200U,
  7.6 GB RAM, single 931 GB **mechanical SATA** HDD (presents `sda`, NOT `vda`).
- **Beelink is Christopher's DAILY DRIVER, not a build server.** Keep our side tidy (OP-18).

## 2. AGENTS + HARNESSES (on CT105 `/root/`)

| Harness | Purpose |
|---|---|
| `run-bee.sh <tag> [secs]` | Luna RESEARCH (`gpt-5.6-luna`). Pointer says "write nothing to disk" |
| `run-bee-build.sh <tag> [secs]` | Luna BUILD (may create/commit). **Default timeout 1500s is TOO SHORT for a build loop — always pass e.g. 14400** |
| `run-tom.sh` / `run-tom-collect.sh` | Tom (Claude Code, Opus) independent verification |

Briefs: `/root/briefs/`. Runs: `/root/bee-runs/`. Decisions: `/root/briefs/DECISIONS-LIVE.md`.
**Luna session transcripts (the recovery channel):**
`chris@192.168.1.190:~/.pi/agent/sessions/--home-chris--/*_spb-<tag>.jsonl`

## 3. 🔴 IN-FLIGHT RIGHT NOW — dispatch `spplus-b04-finish`

- **Started** 2026-08-26 19:00 UTC (14:00 CDT), **4-hour window** (ends ~18:00 CDT), 8-cycle cap.
- **Brief:** `/root/briefs/spplus-b04-finish.md` (also on Beelink `~/briefs/`)
- **Local log:** `/root/bee-b04.log` (written only when the harness exits)
- **Transcript:** `~/.pi/agent/sessions/--home-chris--/2026-08-26T19-00-30-993Z_spb-spplus-b04-finish.jsonl`
- **Working dirs:** `~/sp-plus-iso/cycle5` (currently cycle 5)

**IS IT ALIVE?** Poll the TRANSCRIPT MTIME, not artifacts (OP-17 — artifacts persist after an
agent dies):
```bash
ps -eo args | grep "bee[-]build.*b04" | grep -v grep          # harness alive?
ssh -i /root/.ssh/beelink chris@192.168.1.190 \
  'F=$(ls -t ~/.pi/agent/sessions/--home-chris--/*b04* | head -1); \
   echo "age: $(( $(date +%s) - $(stat -c%Y "$F") ))s"'
```
**Age under ~5 min = working. Over ~12 min with the process alive = BLOCKED, kill and re-scope.**

**If it is killed/stalled,** recover its reasoning from the transcript before re-dispatching:
```bash
grep -oE '"(text|command)":"[^"]{40,}"' <transcript> | tail -8
```
**Reap immediately after any kill** (`~/sp-plus-gates/reap.sh --apply`) — orphans from a killed
dispatch once held 7.7 GB for an hour.

**What to do with its result:** verify every claimed gate against the TREE and the SCREEN before
believing the report (OP-03). Then commit held ledger entries and decide on the Dell.

## 4. GATES / STATUS

| Gate | Status |
|---|---|
| P0.0 toolchain | ✅ PASS |
| P0.1 ledger | ✅ PASS (verified by me AND Tom) |
| 0.A image builds + boots | ✅ PASS — boots to KDE Plasma |
| 0.B(install) text mode | ✅ PASS |
| **0.B(install) GRAPHICAL** | ✅ **PASS — MILE MARKER 1 HIT** |
| Automatic encrypted partitioning (D36) | ✅ install completes, LUKS passphrase prompt at boot |
| Boots to KDE Plasma from encrypted disk | ✅ "Welcome to Plasma Desktop" |
| **SELinux Enforcing on installed system** | ❌ **FAIL — was `Disabled`; fix in b04, UNVERIFIED** |
| **Advisor account locked (no default pw)** | ❌ was `spplus-advisor`; fix in b04, UNVERIFIED |
| **Advisor home dir created** | ❌ missing → login loop; fix in b04, UNVERIFIED |
| Gates wired into build path (T-12) | ⏳ in b04 |
| SATA/`sda` rehearsal for the Dell (T-09/G9) | ⏳ in b04, NEVER YET RUN |
| 0.B(update) | ⏸ DEFERRED (D32) — registry not live, tracked as T-06 |

## 5. ARTIFACTS

- **OS image:** `localhost/sp-plus-kde:spike`, ROOT podman store,
  digest `sha256:da47edacbf5f4759f7b8613f0548ea8f583f530123de3aa7536a087a8a21c6fe`
- **Builder (digest-pinned):** `ghcr.io/osbuild/image-builder-cli@sha256:55ce154eaad86a4fcd43998588ccb6e15c801d25e392dab5c8073627f22ae37e`
- **Build script (rootful — DN-06, NEVER build rootless):** `~/sp-plus-iso-build.sh`
- **ISO output path:** `projects/sp-plus/artifacts/spikeB-rootful/out/bootc-fedora-44-bootc-generic-iso-x86_64/bootc-fedora-44-bootc-generic-iso-x86_64.iso`
- **Christopher's frozen test ISO:** `~/sp-plus-iso/SP-PLUS-CHRIS-TEST.iso`
  sha256 `3142901c5479ede15888631120e3dd9d...` — launchers `chris-test.sh`, `chris-boot.sh`
- **Gates/tools:** `~/sp-plus-gates/{preflight-gate.sh,release-gate.sh,reap.sh}` and in-repo at
  `projects/sp-plus/tests/` (+ `field-inspect.sh`, `field-diff.sh`, `vmtype.sh`)
- **reap.sh runs every 15 min from cron on the Beelink.**

## 6. HYPOTHESES REFUTED — DO NOT RETEST

1. ❌ `/LiveOS/squashfs.img` wrong layout — Anaconda's search order supports ours.
2. ❌ Initramfs missing the anaconda dracut module — extraction proved all modules present.
3. ❌ Missing Anaconda scaffolding in the Containerfile — every step already there.
4. ❌ CD attach method — SATA `-cdrom` and USB hang identically.
5. ❌ GRUB cursor editing — arrow-down and `ctrl-n` ignored; only `ctrl-e` works. Use
   `-kernel`/`-initrd`/`-append` instead.
6. ❌ **Fedora 44 removed local graphical installs** — FALSE. F42 made Anaconda a native Wayland
   client; RDP replaced VNC for REMOTE only. Local `inst.graphical` is supported.
7. ❌ **A missing RPM caused the grey screen** — FALSE. `mesa-dri-drivers`, `systemd-pam`,
   `gnome-kiosk`, `gnome-remote-desktop`, `gnome-settings-daemon`, `gsettings-desktop-schemas`,
   `librsvg2`, `anaconda-install-img-deps` all verified present. **Never add
   `xorg-x11-server-Xorg`** — contrary to F42+ architecture.

**ROOT CAUSES ACTUALLY FOUND (all fixed):**
- **Loader hang** = `selinux=0` REMOVED from the installer cmdline → systemd PID 1 froze
  (`Failed to allocate manager object`). It is REQUIRED on the installer (DN-09).
- **Grey screen** = service-wide `TMPDIR=/mnt/sysimage/boot` in `installer/bootc-wrapper.sh`
  pointed at a path that does not exist pre-storage → GTK aborted → GNOME Kiosk painted its
  default `#808080`. Scoped to `/var/tmp`. **If the screen goes uniform grey again, this
  regressed.**
- **SELinux disabled + no home dir + wrong default target** = ONE cause: `%post` guarded on
  `grubby`, which does NOT exist in a bootc image, so `%post` exited at line 3 and everything
  below it silently never ran, while Anaconda still reported success (DN-12).

**MECHANICAL SCREEN GATE (calibrated on real data):**
```bash
echo "screendump /path/T.ppm" | socat - UNIX-CONNECT:<monitor.sock>
identify -format "%[standard-deviation]" /path/T.ppm
```
**stddev = 0 → uniform grey → BROKEN. stddev > 500 → something rendered.** (grey=0, real UI≈9000-12000)

## 7. CHRISTOPHER'S DECISIONS

- **D31** `--target-imgref` = `ghcr.io/secureprospective/sp-plus-kde:edge` (real, not live yet)
- **D32** Gate 0.B split; 0.B(update) deferred
- **D33** KDE/Kinoite 44 only through Phase 0
- **D34** LUKS2 on root + user data; `/boot` and ESP unencrypted
- **D35** Agents commit ONLY files their brief names
- **D36** **Partitioning is FULLY AUTOMATIC and ALWAYS ENCRYPTED. No advisor choice.** Custom
  layouts are a paid engagement. Only storage input is the LUKS passphrase. Disk selection must
  be automatic (Dell = `sda`). A LIVE installer is a future roadmap item, explicitly not now.
- **Standing:** no branding this session. No secrets in image/repo/git ever. Never `--no-verify`.
  No work on main. Cleanup is binary — if we are not coming back to it, it is gone (OP-18); do
  NOT build resource-arbitration machinery.

## 8. LEDGER STATE — all committed

`projects/sp-plus/docs/ledger/` — `DO-NOT.md` (DN-01..DN-13), `WORKS.md` (W-01..W-03),
`OPERATIONS.md` (OP-01..OP-18 + amendment), `TODO.md` (T-01..T-12), `HARDWARE-MATRIX.md`,
`field-reports/QEMU-poc3-2026-08-26.txt`, `runs/`.

Latest commits: `414a0b0` (OP-18 amendment), `17bd45e` (reap.sh), `266a6eb` (Luna's DN-12/DN-13
fix: BLS karg editing, decomposed `%post` recording failures to `/var/lib/spplus/%post-failed`),
`e89de78` (DN-12/DN-13/OP-16/OP-17 + gates).

Backbone (`/root/.claude`): `94c5b34` compact-safe skill, `161df91` memory cleanup rule.
**Nothing is held uncommitted.**

## 9. NEXT ACTIONS, IN ORDER

1. **Check b04** (§3). Alive → let it work. Stalled/finished → harvest transcript, verify gates
   against the tree and screen, then act.
2. **Verify its claims independently** — screendump the VM, run
   `tests/field-inspect.sh` inside the installed system, then `tests/release-gate.sh` on that
   report. **`getenforce` MUST be `Enforcing` and `selinux_arg_leaked` MUST be `no`.** Twice
   today a security fix looked right in the diff and did nothing in reality (DN-10, DN-12).
3. **Confirm the advisor can log in graphically** to Plasma with a self-set password, and that
   `/var/home/advisor` exists. This is the defect Christopher found by hand (DN-12).
4. **Run the SATA rehearsal (G9)** — QEMU with `-device ich9-ahci` + `ide-hd` so `sda` is
   exercised before the Dell ever sees this. NEVER YET RUN.
5. **Only then** consider the Dell (HW-00). Christopher's rule: the Dell is not discussed until
   he has personally done a graphical install in QEMU.
6. **Reap** after every cycle and after any kill.

## 10. RELAY / ENVIRONMENT

- Commands for Christopher go in `/root/paste.md` — ONE batch, overwrite each time, plain
  commands + `#` comments, no prose. Never real secrets.
- **QEMU GTK has no clipboard.** Drive a guest console with
  `~/sp-plus-iso/vmtype.sh <monitor.sock> '<command>'` (typing at a prompt is not privilege
  escalation). **NEVER pipe a password into `sudo`** — the runtime blocks it and the agent
  stalls silently (OP-17).
- `pgrep -f` / `pkill -f` MATCH THEIR OWN COMMAND LINE and will kill this shell (exit 144).
  Write PIDs to a file via `ps -eo pid,args | grep "patt[e]rn"` and kill from the file.
- A VM named `chris` belongs to Christopher — never kill it.

## 11. HONEST STATUS

**Mile marker 1 is genuinely hit**: graphical installer works, install completes, encrypted disk,
KDE Plasma boots. Verified by screenshot and serial log, not by report.

**NOT proven:** SELinux Enforcing, locked advisor account, working advisor home, gates wired into
the build path, and `sda` disk detection. All five are in b04 and **none has been verified by me**.
b04's fix looks correct in the diff — which is exactly the evidence that misled us twice today.
Believe none of it until `release-gate.sh` exits 0 against a live installed system.

The Dell has NOT been touched and must not be until Christopher does a graphical install himself.
