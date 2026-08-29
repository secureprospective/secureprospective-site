# SP+ — session resume (compact-20)  ·  2026-08-29T22:40Z

## 1. WHAT WE ARE DOING

Building SP+ (locked-down Fedora KDE bootc image for independent financial advisors) toward
**ISO 44**. Christopher's deadline: **Fedora 45, ~6 weeks out (mid-Oct 2026)** — he markets
openly then, so every step from here must be "good, well thought out, stable, verified."

- Repo: `chris@192.168.1.190:~/work/secureprospective-advisor-os`, branch **`session/sp-plus-plan`**
- The repo is ONLY on the Beelink. It is NOT on CT105.
- Payload owner is `projects/sp-plus/images/kde/Containerfile`. **`projects/sp-plus/Containerfile`
  is DEAD — nothing builds it.** (`sp-plus-iso-build.sh:15`)

## 2. AGENTS + HARNESSES

- `/root/run-bee.sh <brief> [timeout]` — RESEARCH lane (Bee = Pi/gpt-5.6-luna on Beelink, 272K ctx).
  Writes nothing to disk. `/root/run-bee-apply.sh` is the APPLY lane.
- Briefs: `/root/briefs/*.md`. Runs: `/root/bee-runs/<stamp>_<tag>/{out,err,verdict}`.
- **DO NOT run dispatches concurrently** — six parallel died at timeout (2026-08-23).
- `/root/bee-queue-next.sh <wait_pid> <brief> <tmo> <gap>` chains one behind another.

## 3. IN-FLIGHT WORK

**NOTHING IS RUNNING.** Zero dispatches, zero VMs, zero watchers. Verified with
`pgrep -af "run-bee|qemu|bee-queue"` → 0. Nothing will be orphaned by compaction.

## 4. GATES / STATUS

`bash projects/sp-plus/tests/config-preflight.sh` → **18 passed, 0 failed. Safe to build.**
(It FAILS on a dirty tree by design — commit first.)

| Gate | State |
|---|---|
| P-11 DN-29 home dirs | PASS — also proven on Dell + QEMU |
| P-12 DN-28 progress weighting | PASS |
| P-13 DN-32 tuner survey-only/image-safe | PASS — negative-tested both ways |
| P-14 DN-30 health check daily+persistent | PASS — negative-tested |

## 5. ARTIFACTS THAT EXIST AND WORK

- Dell (`sp-plus`, 192.168.1.124): digest **`sha256:dc85bfcd8852801c0520f13de398d5ae79f1b8bdf416941fcff6d9d5c17d5468`**
- `/var/lib/sp-plus/THIS-MACHINE.md` on the Dell — 74 lines, mode 0644, SELinux `var_lib_t`
- Dell EDID scope keys, **stable across reboot**: `eDP-1` 69bc89393efb3641 @1600x900,
  `HDMI-A-1` 862663c08a63e08c @1920x1080
- Bee reports worth keeping: `bee-runs/20260829T211906Z_spplus-tune-design/out` (18 KB design review)

## 6. COMMITS THIS WINDOW (all on session/sp-plus-plan, tree clean)

```
81ad422 ledger: triage D3 journal noise; theme metadata conversion deferred
2a1dd01 DN-30: daily update-health check, so a machine cannot fail silently
024a2b3 D1: Welcome installs Flatpaks in system scope, not user scope
1025845 DN-32: ship the tuner in the image, gate it, open ISO-44 test plan
ced4223 DN-32: spplus-tune v1 survey + machine record
```
Backbone (`/root/.claude`): `bb6bc22` homelab Dell entry. NOTE: `MEMORY.md` and `projects/`
are **gitignored** in the backbone (`.gitignore:5` and `:40`) — memory cards live on disk only,
do not try to commit them.

## 7. THE CURRENT BUGS

**BUG A — the Dell suspends despite my fix. UNRESOLVED.**
Set `~/.config/powerdevilrc` `[AC] AutoSuspendIdleTimeoutSec=7200`, called
`reparseConfiguration` + `refreshStatus` on PowerDevil (pid 2220). Machine slept anyway, well
inside 2 hours, while on AC (`AC online=1`).
*Leading hypothesis:* wrong key/section for Plasma 6.7, OR something else suspends it.
**CAVEAT: I never checked logind.** `/etc/systemd/logind.conf` had no overrides and I did not
check `HandleLidSwitch` / `IdleAction` defaults, nor whether the lid is closed. Check logind
BEFORE touching PowerDevil again. Key name `AutoSuspendIdleTimeoutSec` IS correct (read from
`kcm_mobile_power.so` symbols) — the unit is seconds, not the Plasma-5 milliseconds.

**BUG B — Welcome's single-instance lock blocks QC.** Bee returned all six C-tests UNVERIFIED
because a running `welcome.py` (pid 2357) owns `/tmp/spplus-welcome` and the brief forbids
killing it. Zero screenshots. Must be resolved in the brief before re-dispatch.

## 8. HYPOTHESES REFUTED — DO NOT RETEST

1. **"Layering may still allow bootc upgrade"** (Bee said medium confidence). FALSE. Verbatim:
   `error: Upgrading: Deployment contains local rpm-ostree modifications; cannot upgrade via
   bootc.` plus `incompatible: true`. Hard refusal. Fixed with `rpm-ostree reset` (freed 160.4 MB).
2. **"The Dell is unreachable / Bee can't get in"** — FALSE. 79 `Permission denied` lines were
   `du` walking `/var/spool/cups`, `/var/roothome`, `systemd-private-*` as an unprivileged user.
   Benign noise from INSIDE the box.
3. **"Beelink→Dell SSH is broken"** — FALSE. It was an unknown host key only. Key auth worked
   the whole time. Fixed with `ssh-keyscan -H`.
4. **"ldconfig's 59.8s is a boot defect to fix"** — FALSE. `ConditionResult=no` on a normal boot;
   it only runs after a `/usr` change, and it MUST (stale linker cache otherwise). Boot is
   **2m6s** steady state, not the 2m56s first-boot figure.
5. **"`spplus-tune` sees no EDID"** — was a real bug, now fixed: sysfs reports `st_size 0` while
   reading back 128 bytes, so `[ -s ]` is always false. Read by byte count.

## 9. DECISIONS (do not relitigate)

- **DN-30:** stable branches only; update 15:00 local every other Friday; reboot 04:00 the
  following Sunday. Break-glass path approved but **NOT YET WRITTEN**.
- **DN-32 D2:** advisor's own settings are SACRED. Ownership cannot be inferred from a value
  comparison, so v1 has **no apply path at all** — sacredness by construction, per-item consent.
- **DN-32 D3:** provenance is a markdown machine record (Christopher's call), not JSON.
- **NVIDIA is explicitly UNSUPPORTED.** His words: "screw them anyways."
- **Never re-add npm to the payload.** Pi pinned 0.84.3; its self-updater failing is by design.
- **Distribution = ISO on Cloudflare**, download unlocked per contract from the back office.
  NOT a container-registry release. I got this wrong twice — do not re-propose PAT/CI/cosign
  as the *release* mechanism.
- Christopher is one man: **do not invent an ecosystem.** Use what exists.

## 10. OPEN QUESTION HE HAS NOT ANSWERED

**Where do already-installed machines pull their DN-30 update from?** Cloudflare ships the ISO
to new advisors; it does not feed `bootc upgrade` on an installed Dell, which currently points
at `ghcr.io/secureprospective/sp-plus-kde:edge` → `manifest unknown` (unpublished).
His steer was "stable dnf repository" — but **dnf cannot update the OS on an image-mode
system**; that is what broke the Dell today. Unresolved. Do not push a registry answer at him.

**Live proposal awaiting his yes/no:** move **Brave** from a build-time `dnf install`
(`Containerfile:40-42`) to a **Flathub Flatpak**, exactly as the project already did for Zoom
and documented in `config/flatpak/preinstall.d/`. Brave is currently frozen at image-build time,
which is the one component where slow patching actually endangers an advisor. Zero new
infrastructure.

## 11. NEXT ACTIONS, IN ORDER

1. **Ask Christopher** whether to chase the Dell suspend now or leave the machine alone.
2. **Diagnose the suspend properly** — check `logind` (`HandleLidSwitch`, `IdleAction`,
   `IdleActionSec`) and lid state FIRST, then PowerDevil. Prove the fix by watching the box
   stay up, not by reading the config back.
3. **Get his call on Brave→Flatpak**, then implement + gate it.
4. **Re-dispatch the six C-tests** only after resolving the Welcome single-instance lock.
5. **Write the DN-30 break-glass path** and compare notes with Bee (he asked for this before
   the build; still not done).
6. Answer the installed-machine update path (§10) — his decision, not mine.
7. Build ISO 44 once 1-5 land.

## 12. ENVIRONMENT

- Dell: `ssh -i /root/.ssh/spplus-test test@192.168.1.124` (created this session, works direct
  from CT105). Beelink→Dell also works. Host key `SHA256:i9VZWgU09z3w9QUoq9076tshoimvn1R1M5fWrt3Uj8s`.
- **Never reboot the Dell or restart its compositor** — Christopher works at it.
- **Do NOT touch the Dell while Bee is testing it.** I invalidated Bee's theme test by running
  rpm-ostree concurrently. One lane at a time.
- Repo work over SSH: **write scripts/messages to a FILE and `scp`** — nested heredocs through
  `ssh` have now mangled a git commit message and killed two Bee dispatches.

## 13. HONEST STATUS

The tuner, the health gate and the Flatpak fix are real, gated, and verified on hardware. But:
- **The entire Welcome app QC is still unverified** after three Bee attempts.
- **`bootc rollback` has never been proven** on any machine, and DN-30 depends on it.
- **No installed machine can currently receive any update**, because nothing is published and
  the update path itself is undecided. That, not features, is the critical path to Fedora 45.
- The harness has now said **ACCEPT over a worthless artifact three times today** (stale replay,
  then two all-UNVERIFIED reports). Byte count is not evidence. Read every report before
  believing it.
