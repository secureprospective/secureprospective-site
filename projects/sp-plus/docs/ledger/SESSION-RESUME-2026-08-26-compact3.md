# SP+ SESSION RESUME — 2026-08-26 (compact #3)

**Read this first. Christopher says "we are back" -> resume at §9 NEXT ACTIONS item 1.**
Do not recap, do not re-derive, do not re-test §6.

---

## 1. WHAT WE ARE DOING

Building **SP+**, a Fedora-Kinoite-44 bootc/image-mode Linux distro for financial advisors.
Session goal now: **make the installed system actually usable** — graphical installer is DONE.
Today's work found and fixed the real cause of the login loop Christopher hit by hand.

- **Repo (Beelink only):** `chris@192.168.1.190:~/work/secureprospective-advisor-os`
- **Branch:** `session/sp-plus-plan` (local only, no remote)
- **SSH:** `ssh -i /root/.ssh/beelink chris@192.168.1.190`
- **Dell (HW-00, FREE TO WIPE):** `ssh -i /root/.ssh/laptop-sweep trader@192.168.1.201`
  2014 Inspiron 5737, UEFI+GPT, Secure Boot present but DISABLED, **NO TPM**, i5-4200U,
  7.6 GB RAM, 931 GB **mechanical SATA** HDD -> presents `sda`.
- **Beelink is Christopher's DAILY DRIVER.** Keep our side tidy (OP-18). `/tmp` is a 16 GB
  **tmpfs** — never copy a repo into it (filled it today).

## 2. AGENTS + HARNESSES (on CT105 `/root/`)

| Harness | Purpose |
|---|---|
| `run-bee.sh <tag> [secs]` | Luna RESEARCH. **Brief must be copied to `chris@beelink:~/briefs/` FIRST** or it aborts |
| `run-bee-build.sh <tag> [secs]` | Luna BUILD. Default 1500s is TOO SHORT — pass 14400 |
| `run-tom.sh` | Tom (Claude Code, Opus) independent verification |

**Luna CANNOT sudo** — its runtime returns `Command escalates privileges; blocked (no UI for
confirmation)` and it does not report being blocked (OP-17). **Do not delegate anything needing
root on a guest to Luna.** Headbrain does inspection.

Transcripts: `chris@beelink:~/.pi/agent/sessions/--home-chris--/*_<tag>.jsonl`

## 3. IN-FLIGHT RIGHT NOW — the T-13 rebuild

- **Started** ~2026-08-26 15:55 CDT, detached via `setsid nohup`, survives compaction.
- **Log:** `chris@beelink:~/sp-plus-build-t13.log`
- **Script:** `~/sp-plus-iso-build.sh` (runs the preflight gate itself; gate passed **10/10**)
- **Takes ~13 min.** Was at the dracut stage at capture time.

**Is it alive / done?**
```bash
ssh -i /root/.ssh/beelink chris@192.168.1.190 \
 'ps -eo pid,etime,comm | grep -E "podman|buildah"; tail -5 ~/sp-plus-build-t13.log; \
  ls -la ~/work/secureprospective-advisor-os/projects/sp-plus/artifacts/spikeB-rootful/out/*/*.iso'
```
**The ISO is the evidence, never the exit code.** New ISO must have a DIFFERENT sha256 than
`afc0f9c7276ca08ae8fc9efcd333a60d22b7c19eaf05a66d31366e59c9f21c81` (the b04 ISO).

## 4. GATES / STATUS

| Gate | Status |
|---|---|
| 0.A image builds + boots | ✅ PASS |
| **0.B(install) GRAPHICAL** | ✅ **PASS — mile marker 1** |
| D36 automatic encrypted partitioning | ✅ PASS (verified on screen cycle6) |
| **G9 SATA/`sda` rehearsal for the Dell** | ✅ **PASS — guest showed `ATA QEMU HARDDISK / sda`, `%pre` auto-selected it** |
| DN-10 `selinux=0` stripped from installed entry | ✅ **PASS — read directly off the GRUB editor** |
| Boots to login with SELinux **Enforcing** | ✅ PASS (once the LUKS prompt is answered on serial) |
| **Any login works under Enforcing** | ❌ **FAIL — DN-16, the fix is building now** |
| **LUKS prompt visible on local screen** | ❌ **FAIL — DN-15, NOT yet fixed (T-16)** |
| Advisor account locked / first-boot password | ⏳ built, never observed working |
| 0.B(update) | ⏸ DEFERRED (D32) |

## 5. ARTIFACTS

- **Installed disk that PROVES DN-15+DN-16:** `~/sp-plus-iso/cycle6/disk.qcow2` (8,759,803,904 B).
  **Do not delete** — reap.sh now keeps disks < `RETAIN_HOURS` (12).
- **The AVC evidence:** `~/sp-plus-iso/cycle6/bserial.log` (150,854 B).
- **b04 ISO (superseded):** sha `afc0f9c7…`, in `projects/sp-plus/artifacts/spikeB-rootful/out/…`
- **Gates:** `~/sp-plus-gates/{preflight-gate.sh,release-gate.sh,reap.sh}`, mirrored in
  `projects/sp-plus/tests/`.
- **Boot/test scripts on the Beelink** (`~/sp-plus-iso/`):
  `6-boot-serial.sh` (READ/WRITE serial console — **the instrument that solved today**),
  `sboot.sh` (GRUB-edit + boot + answer LUKS on serial), `gboot.sh` (GRUB-edit, keyboard),
  `c6.sh` (sendkey + screendump + stddev), `vmtype.sh` / `vmtype-noret.sh`.

## 6. HYPOTHESES REFUTED — DO NOT RETEST

1. ❌ **"SELinux Enforcing deadlocks the boot" (my own DN-14).** WRONG — the A/B was a false
   correlation; the harness typed the LUKS passphrase on a timer and it landed differently.
   With a serial console the system **boots to login under Enforcing**. DN-14 is corrected
   in the ledger.
2. ❌ The first-boot password unit causes the hang. Masking it -> byte-identical hang.
3. ❌ The system asks for the LUKS passphrase twice. Typing it a second time changed nothing.
4. ❌ "`/etc` is fully labeled" (a `find`/`ls -Z` survey said 4820 files, 0 unlabeled).
   **The survey was wrong; the kernel AVC log is the authority.**
5. ❌ Fedora 44 removed local graphical installs. FALSE.
6. ❌ A missing RPM caused the grey screen. FALSE (cause was `TMPDIR=/mnt/sysimage/boot`).
7. ❌ `/.autorelabel` is the fix — bootc discussion #1087: unreliable, ostree root is read-only.
8. ❌ `chcon` in the Containerfile — OCI layers do not carry `security.selinux` xattrs.

**GOTCHA:** SELinux `dontaudit` rules **hide** denials. A clean `grep avc:` proves nothing
until `semodule -DB` is active.

## 7. THE TWO REAL DEFECTS (today's finding)

- **DN-15 — the LUKS passphrase prompt is INVISIBLE on the local VGA console.**
  `fbcon: Deferring console take-over`; the prompt goes where the screen never shows it, so
  `systemd-cryptsetup` waits forever, `cryptsetup.target` never completes, `sysinit.target` is
  held, nothing starts. **Looks exactly like a dead laptop to an advisor. NOT FIXED (T-16).**
- **DN-16 — `/etc` on the installed system is `unlabeled_t`, breaking EVERY login.**
  Real kernel AVCs, `permissive=0`:
  `plasmalogin` denied read on `nsswitch.conf` + `passwd`; `local_login` denied `nsswitch.conf`;
  `getty` denied `localtime`; all `tcontext=system_u:object_r:unlabeled_t:s0`.
  **This is Christopher's login loop — the password was always right.**
  Cause: Anaconda writes `/etc` while the installer runs `selinux=0` (DN-09), so no context.

## 8. THE FIX THAT IS BUILDING (commit `44f14bb`)

In `%post`, `spplus_relabel_targets()`: `setfiles -F` over `/etc` and `/var` using the TARGET
policy `/etc/selinux/targeted/contexts/files/file_contexts`, then **verifies** that
`nsswitch.conf`, `passwd`, `shadow`, `localtime` are no longer unlabeled, recording a durable
failure to `/var/lib/spplus/%post-failed` if not. Verified present in the image before use:
`setfiles` ✅, `policycoreutils-3.11-2.fc44` ✅, `file_contexts` (420 KB) ✅.

Preflight gate: stale DN-10 detector fixed (it only knew `grubby` vocabulary, which DN-12
replaced with BLS editing — it was FAILING a build that was actually correct), and a new DN-16
check added. **Negative-tested:** a copy with `setfiles` stripped -> gate FAILS and aborts.

## 9. NEXT ACTIONS, IN ORDER

1. **Check the build** (§3). Confirm a NEW ISO with a sha different from `afc0f9c7…`.
2. **Install it** — `~/sp-plus-iso/6-install-sata.sh` builds a SATA VM from the repo ISO path,
   then drive Anaconda with `c6.sh` (Continue `alt-c` -> pre-release dialog `tab ret` ->
   Destination `left up ret` -> `alt-d` -> passphrase `spplus-test` twice -> `ret` -> `alt-d`
   -> `alt-b`). ~15 min to "Complete!".
3. **Boot it with `6-boot-serial.sh`**, answer the LUKS prompt by writing to `bserialpty`,
   then **`grep -ac "avc:  denied" bserial.log` — it must be 0**, and log in on serial.
4. **Then run `tests/field-inspect.sh` and judge with `tests/release-gate.sh`.** Release-gate
   exiting 0 is the ONLY verdict that counts.
5. **T-16 (DN-15)** — make the passphrase prompt visible on the local console. **This blocks
   the Dell independently of T-13.** Likely plymouth/fbcon console hand-off.
6. **Only then** the Dell (HW-00), and only after Christopher does a graphical install himself.

## 10. RELAY / ENVIRONMENT

- `/root/paste.md` — ONE batch, overwrite, plain commands + `#` comments, never real secrets.
- **`pkill -f` / `ps|grep <pattern>` MATCH YOUR OWN SHELL** when the pattern appears anywhere in
  the command line — this killed the ssh session TWICE today (exit 255). **Kill from a pidfile**
  or match on `comm`. (OP-20 — and I still repeated it after writing it.)
- **An open forwarded port is NOT a listening service** — QEMU slirp accepts the connect
  regardless. Prove sshd with a **banner grab** (OP-21).
- A VM named `chris` belongs to Christopher — never kill it.
- Test-only credentials, disposable, never in the ISO/repo: LUKS `spplus-test`, root `spplus-test`.

## 11. HONEST STATUS

**Mile marker 1 (graphical installer) is genuinely done, and G9/SATA now passes** — the two
biggest unknowns for the Dell are closed.

**But SP+ still cannot be used by an advisor.** Two defects block it: the invisible LUKS prompt
(DN-15, unfixed) and unlabeled `/etc` (DN-16, fix building but **never yet observed working**).
The DN-16 fix looks right and was negative-tested at the gate — which is exactly the evidence
that misled me twice today. Believe nothing until `release-gate.sh` exits 0 against a live
installed system with zero AVC denials.

**Biggest process lesson (OP-22):** most of this session was spent A/B-testing a black screen on
a screendump stddev that could say "bad" but never "why". A read/write serial console answered
the entire question in one boot. **Buy observability before testing another hypothesis.**

---

## ADDENDUM (captured at hand-off)

**The build log contains `Failed to create directory or subvolume "/usr/local/sbin":
Read-only file system`. This is NON-FATAL.** Step 1 of `sp-plus-iso-build.sh` carries
`|| exit 2`, and the build proceeded past it into STEP 3 (image-builder copying blobs). Do not
chase this line. Judge the build by **the ISO existing with a new sha256**, not by log noise
(OP-03: the artifact is the evidence, never the exit code and never the report).
