# SP+ RESUME — compact-safe 2026-08-28 ~07:00 CDT

Session continues. This exists so the next context window resumes mid-stride.

## 1. WHAT WE ARE DOING

SP+ (Secure Prospective Advisor OS), Fedora Kinoite 44 bootc/image-mode Linux for
independent financial advisors. **cycle35 is installed and swept; all its defects are fixed
and gated; we are NOT yet building cycle36** because Christopher is iterating on the SP+
Calm global theme with Bee first.

- Repo (git worktree): `/home/chris/work/secureprospective-advisor-os`
- Branch: `session/sp-plus-plan`  HEAD: `758aa29`  tree CLEAN
- **Do NOT cd to the main checkout.** Never `git --no-verify`. Never bare `git stash`.
- Installed VM: `fedora-test35`, running, user `test` (uid 1000, wheel, passwordless sudo)
- SSH into it: `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p 2235 test@127.0.0.1`

## 2. AGENTS + HARNESSES

- **Bee** = `pi` agent. Model **MUST** be `openai-codex/gpt-5.6-luna --thinking high`.
- **Christopher is driving Bee himself** in a terminal on the Beelink desktop:
  **pid 3540763, pts/7, cwd `/home/chris`**. Do not disturb it. Do not edit theme files.
- My dispatch pattern: `systemd-run --user --unit=<timestamped>` + brief file + sentinel
  (`REPORT-*.md` then `touch REPORT-*.DONE`) + a Monitor watcher. Never poll.
- Add `--session-dir /home/chris/sp-plus-bee/sessions` so the resolved model is auditable.
- Briefs live in `/home/chris/sp-plus-bee/`.

## 3. IN-FLIGHT RIGHT NOW (most perishable)

| What | State | How to check | If it dies |
|---|---|---|---|
| **Bee, theme work** | pid 3540763 pts/7, alive, 1 HTTPS conn, **has written NOTHING yet** | `ps -o pid,etime,stat -p 3540763`; `find <repo>/projects/sp-plus/theme/sp-plus-calm -newermt '-10 minutes'` | Christopher restarts it; point it at `AUTHORITY-calm-theme.md` |
| `spplus-review-serve` | active, port **8899** | `systemctl --user is-active spplus-review-serve` | Only channel for him to view HTML reviews — keep up |
| VM `fedora-test35` | running, **in use by Christopher** | `virsh domstate fedora-test35` | Never reboot/reset it |
| SSH forward `:2235` | OPEN, **hot-added, not persisted** | `echo > /dev/tcp/127.0.0.1/2235` | Re-add WITHOUT restart: `virsh qemu-monitor-command fedora-test35 --hmp 'hostfwd_add hostnet0 tcp:127.0.0.1:2235-:22'` |

**Monitor watchers armed** (do not survive compaction reliably — re-arm if needed):
- `byh9a27vk` — any write to repo or `sp-plus-bee/`, re-runs Calm validator, fires on
  `/home/chris/sp-plus-bee/THEME-APPROVED.DONE`
- `btnusqcy3` — older, narrower theme watcher (superseded by the above)

## 4. ARTIFACTS THAT EXIST AND WORK

- `/home/chris/Downloads/SP-PLUS-cycle35.iso` — 5,385,265,152 bytes
  sha256 `7adc341c2660bc09ad0af7a1dcb17fbb831bf05b17d4cf0a67c7e4cfd90314ea`
- `/home/chris/Downloads/SP-PLUS-cycle34.iso` — the diff baseline; **the only surviving
  cycle34 artifact** (see §6)
- Sweep evidence: `/home/chris/sp-plus-bee/sweep35-evidence/` — **357 files**, ~162 PNG
  screenshots taken host-side with `virsh screenshot` (unfakeable by the agent)
- `/home/chris/sp-plus-bee/REPORT-cycle35-total-sweep.md` (281 lines)
- `/home/chris/sp-plus-bee/REPORT-cycle36-fixes.md`
- `/home/chris/sp-plus-bee/REPORT-installer-brand-progress.md`

## 5. CYCLE36 FIX SET — ALL COMMITTED AND GATED

`be4ae98` (Bee) + `758aa29` (my correction) + `030e82c` (docs) + `66ce0c9` (installer brand).

| Fix | Change |
|---|---|
| **Node ICU (was the Fin crash)** | `nodejs22-full-i18n` added to Containerfile:316; the segfault reproducer runs as a build gate |
| **Calm not applying** | `library=org.kde.kwin.aurorae` -> **`org.kde.kwin.aurorae.v2`** (Plasma 6.7 needs `.v2`); first-login now reads back ColorScheme/widgetStyle/library/theme, retries 3x, and stamps the sentinel ONLY on full success |
| **wsdd unhardened** | drop-in resets `ExecStart=` and states `--discovery --no-host --listen 127.0.0.1:5357` literally so `/etc/sysconfig/wsdd` cannot disarm them; clears Samba `BindsTo=` |
| **Screen lock** | `kscreenlockerrc` `Autolock=false` — **Christopher explicitly said keep as is** |
| **Welcome 1.3 GiB leak** | `closeEvent` now tears down the WebEngine view and calls `QApplication.quit()` |
| **Sensors** | `lm_sensors` + runtime gate |
| **Discover** | wrapper pins backends to `flatpak,rpm-ostree`; PackageKit deliberately not enabled on bootc |

**Gates:** `tests/cycle36-source-gate.sh` **8/8 PASS**; Calm validator **13/13**;
config-preflight says *"Safe to build."*

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **Fin's crash is NOT the clipboard.** `clipboard.linux-x64-gnu.node` threads are parked in
  `syscall` — idle workers. It is `Intl.Segmenter` -> `v8::internal::JSSegments::Create`
  SIGSEGV, from missing `nodejs22-full-i18n`. Christopher's own 06:05:14 crash matches.
- **Fin's crash is NOT the missing API key, and NOT the terminal closing.** Both were my
  hypotheses; both wrong.
- **The firewall "Authorization failed" is NOT a defect.** polkit binds to the logind
  session; a desktop process gets `FirewallD1.config -> polkit.result=yes`. Every failure
  came from SSH-launched processes in a remote tty session. Bee was right, I was wrong.
- **System Settings SIGABRT is NOT a defect** — coredump cmdline is `systemsettings --help`
  from an SSH tty. Same artifact class as my own `plasma-apply-lookandfeel --list` crash.
- **Bluetooth failure is NOT an image defect** — `/sys/class/bluetooth` does not exist; the
  VM has no adapter.
- **`/` at `composefs 40M 100%` is NORMAL** for the immutable root, not a full disk.
- **Flathub is present and working** — an early "empty" reading was a guest-agent permission
  artifact.
- **The Anaconda progress bar CANNOT be driven from bootc output.** `DeployBootcTask.steps`
  returns 1, progress callbacks discard step numbers, bar is `step/Steps`. My proposed fix
  was wrong. Parsing output changes only the text.
- **cycle34's `disk.qcow2` was deleted at 03:15 on 2026-08-28, not by me.** Only `boot.pid`
  and `bserial.log` remain in `~/sp-plus-iso/cycle34/`. The ISO in Downloads survives.

## 7. DECISIONS (do not relitigate)

- **DN-27:** the global theme is the OS, NOT the brand. Judged on eye comfort over long
  sessions and window-state legibility, never on matching secureprospective.com.
- Glow stays **slight** — it must make the machine feel high-resolution on a modest monitor.
- Light mode is **warm paper (hemp/desert sand), never white**.
- **btop at default terminal size: IGNORE.** "that is always going to be like that."
- **Screen lock: keep as is** (`Autolock=false`).
- **Bee has full authority over the Calm theme** — see `AUTHORITY-calm-theme.md`.
- DN-13 (no human account ships), DN-23 (`/etc/plasma-setup-done`), DN-24 (naming a
  look-and-feel is not applying it), DN-25 (Fin), DN-26 (Welcome owns first screen).
- **Never send email without explicit per-message permission.** Thunderbird was excluded
  from the sweep on his instruction; the VM has no mail account configured anyway.

## 8. OPEN — CHRISTOPHER'S INSPECTION NOTES

In `/home/chris/sp-plus-bee/NOTES-cycle36-inspection.md`:

1. **Flameshot does not bind to Print Screen by default.** OPEN, undiagnosed. Note
   `field-inspect` 10b already checks Print Screen in `kglobalshortcutsrc`, so that check is
   absent, wrong, or passing falsely.
2. **Calm accent contrast** — *"The window beahvior accent colors need a lot more contrast.
   I am thinking we need more warm colors to contrast[.] the needs a ton of work."*
   Bee is iterating on this now.

## 9. NEXT ACTIONS, IN ORDER

1. **Wait for `THEME-APPROVED.DONE`.** Do not edit theme files — Bee and Christopher own
   them; we share one worktree.
2. **Read `THEME-APPROVED.md`**, confirm the Calm validator still passes 13/13 and that
   `aurorae.v2` was not reverted.
3. **Diagnose Flameshot / Print Screen** and fix, with a gate that executes rather than
   checks presence.
4. **Build cycle36** only when Christopher says so.
5. After install: re-run `tests/field-inspect.sh` and diff against cycle35.

## 10. STILL UNRESOLVED / NEEDS HIS DECISION

- **Installer progress bar** — supported path cannot drive it. Options: an Anaconda-side
  change, an honest indeterminate bar, or leave it. HIS CALL.
- **`spplus` uid is 958; the ledger says 960.** Unreconciled.
- **UEFI + LUKS + TPM completely untested** — cycle35 VM is legacy BIOS, unencrypted. That
  path is unexercised, not passing.
- **Primal font licence** — does not ship; gate needs `branding/brand/Primal.LICENSE`.
- **Sweep coverage was ~50%.** Never launched: micro, Flameshot, KHelpCenter, KeePassXC,
  Spectacle, LibreOffice Draw/Impress/Math. Okular blocked by the lock screen. Bee declared
  every gap honestly; a pass 2 was never run.

## 11. ENVIRONMENT NOTES

- `sudo -n` works for **podman only** on the Beelink.
- `/tmp` is a **16 GB tmpfs** — never copy a repo into it; files there consume RAM.
- **Hygiene done 2026-08-28:** pruned 739 dangling podman images, 46.88 GB -> 24.26 GB,
  `/` 73G -> 51G used (383G free). All tagged images kept. `/home` 77%, 101G free; its bulk
  is his (`.steam` 97G, `QEMU` 63G, `.local` 56G incl. the running VM at 22G).
- **Not reclaimed, awaiting his say-so:** `.cache` 4.3G, `.npm` 1.5G, `go/pkg` 1.3G, and
  24 GB of older tagged podman images (`spb-*:t`, `sp-plus-kde:cycle31`, `:dn24`).
- CT105 (192.168.1.105) is head-brain. Observe, write it down, report — do not intervene.
  It froze the sweep once at his order and auto-thawed it correctly.
- `QEMU/`, `Downloads/`, `SP-PLUS-CHRIS-TEST.iso` are HIS. Do not delete without asking.

## 12. HONEST STATUS

cycle36's fix set is real, committed and gated, and the gates now **execute** rather than
assert presence — which is the specific gap that let cycle35 ship a Node that segfaulted on
"hello", a theme that never applied, and a daemon with its hardening stripped.

**None of it is proven.** Nothing has been built or installed. Every claim above is
source-level or from the cycle35 install. The theme work is unfinished and Bee had written
nothing as of 06:55.
