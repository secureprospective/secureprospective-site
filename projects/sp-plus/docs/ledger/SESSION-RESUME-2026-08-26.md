# SP+ SESSION RESUME — 2026-08-26

**Read this first after compaction. Christopher will say "we are back".**

---

## 1. WHAT WE ARE DOING

Building **SP+**, a Fedora-Kinoite-44-derived immutable Linux distro for financial advisors.
This session's goal: a working installer ISO Christopher tests in QEMU, then on a Dell laptop.

- **Repo:** Beelink only — `chris@192.168.1.190:~/work/secureprospective-advisor-os`
- **Branch:** `session/sp-plus-plan` (unpushed, local only)
- **Subproject:** `projects/sp-plus/`
- **SSH:** `ssh -i /root/.ssh/beelink chris@192.168.1.190`
- **Dell test machine:** `ssh -i /root/.ssh/laptop-sweep trader@192.168.1.201`
- **Registered** in `/root/.claude/backbone/index.md` (all 3 pillars), committed `e2832d2`

## 2. AGENTS + HARNESSES (all on CT105 /root/)

| Harness | Purpose |
|---|---|
| `run-bee.sh` | Bee/Luna **RESEARCH** (`gpt-5.6-luna`, 272K). Pointer says "write nothing to disk" |
| `run-bee-build.sh` | Bee/Luna **BUILD** (may create/commit files). Use `THINKING=high` |
| `run-tom.sh` | Tom (Claude Code, Opus, separate account) — independent verification, read-only |
| `run-tom-collect.sh` | Collect a detached Tom run |

Briefs live in `/root/briefs/`. Runs land in `/root/bee-runs/` and `/root/tom-runs/`.
Christopher's rule: **lean into Luna for token-heavy work; Tom always checks the work.**

## 3. GATES — CURRENT STATE

| Gate | Status |
|---|---|
| P0.0 toolchain | ✅ PASS — podman 5.4.2/buildah/skopeo; `sudo -n podman` NOPASSWD works |
| P0.1 ledger | ✅ PASS — verified by me AND independently by Tom |
| 0.A image builds+boots | ✅ **PASS** — qcow2 boots to KDE Plasma (screenshot verified) |
| 0.B(install) | ❌ **FAIL** — ISO builds fine, hangs before Anaconda. **CURRENT WORK** |
| 0.B(update) | ⏸ DEFERRED by D32 — registry not live. Tracked as T-06 |

## 4. THE ARTIFACTS THAT EXIST AND WORK

- **SP+ OS image:** `localhost/sp-plus-kde:spike`, ROOT store,
  digest `sha256:da47edacbf5f4759f7b8613f0548ea8f583f530123de3aa7536a087a8a21c6fe`
- **Builder (pinned):** `ghcr.io/osbuild/image-builder-cli@sha256:55ce154eaad86a4fcd43998588ccb6e15c801d25e392dab5c8073627f22ae37e`
- **ISO:** `~/sp-plus-iso/sp-plus-kde-44-poc1.iso` — 4,135,002,112 B,
  sha256 `72e2b90086394ffd3207ec6d99aac164e7801838bc3e6b76c754a0dde6751e1e`
- **ISO volume label:** `Secureprospective-Advisor-POC` (matches `inst.stage2` exactly — verified)
- **Build script (rootful, works):** `~/sp-plus-iso-build.sh` on Beelink
- Test launchers on Beelink: `1-install.sh`, `1-install-v2.sh`, `2-boot-installed*.sh`,
  `t-usb.sh`, `t-diag.sh`, `t-direct.sh`, `qkeys.sh`

## 5. 🔴 THE BUG — AND THE LEADING HYPOTHESIS

**Symptom:** ISO boots UEFI → GRUB 2.12 shows "Install SP+ POC" → kernel+initrd load →
dark Plymouth splash with 3-dot spinner **forever**. Disk never grows past 197,568 bytes.
CPU 20-45%. Screendumps minutes apart byte-identical. Identical via SATA `-cdrom` AND USB.

**Direct-kernel diagnostic boot (bypassing GRUB) produced the real error:**
```
Unable to fix SELinux security context of /dev/kmsg: Permission denied
Failed to set up the root directory for shared mount propagation: Permission denied
Failed to set SELinux security context ... for /run/systemd/units: Permission denied
Failed to allocate manager object: Permission denied
[!!!!!!] Failed to allocate manager object.
Freezing execution.
```
systemd PID 1 **dies during SELinux setup**.

### 🎯 LEADING HYPOTHESIS — `selinux=0` was removed and should NOT have been
DN-04 in our ledger says: *the upstream image-builder example sets `selinux=0` as an
**installer-side** workaround; it must not leak into the installed system.*
The Spike B dispatch **removed `selinux=0` from `iso.yaml` entirely** — over-correcting
DN-04. The installer environment genuinely needs it; without it systemd PID 1 cannot
allocate its manager object and freezes. **This fits every observed symptom.**

**FIX TO TRY FIRST:** restore `selinux=0` to the **installer** kernel cmdline in
`projects/sp-plus/installer/iso.yaml`, rebuild the ISO, and then VERIFY on the installed
system that `getenforce` says `Enforcing` and `/proc/cmdline` has no `selinux=0`.
That satisfies DN-04 correctly — the arg belongs on the installer, not the installed OS.

**CAVEAT (must check):** the error above came from a DIRECT kernel boot where I set the
cmdline myself and omitted `selinux=0`. Confirm the same error appears on the normal
GRUB path before declaring root cause. **Verify the mechanism (OP-02).**

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

1. ❌ **`/LiveOS/squashfs.img` is the wrong layout** — Anaconda searches `.treeinfo`,
   then `images/install.img`, then `LiveOS/squashfs.img`. Our layout is supported.
2. ❌ **Initramfs missing the anaconda dracut module** (Luna's HIGH-confidence answer) —
   extracted it: `27-parse-anaconda-repo.sh`, `30-parse-dmsquash-live.sh`,
   `dmsquash-live`/`livenet`/`ostree`/`bootc` modules all present.
3. ❌ **Missing Anaconda scaffolding in the installer Containerfile** — already present:
   install user, `list-harddrives`, `anaconda.target`→`default.target`,
   gpt-auto-generator removed, `ReserveVT=2`, and `dracut --force --add anaconda`.
4. ❌ **CD attach method** — SATA `-cdrom` and USB `usb-storage` hang identically.
5. ❌ **GRUB cursor editing** — arrow-down AND `ctrl-n` are both ignored in GRUB's editor;
   only `ctrl-e` works. Do not burn more time here. Use `-kernel`/`-initrd`/`-append`.

## 7. CHRISTOPHER'S DECISIONS (also in /root/briefs/DECISIONS-LIVE.md)

- **D31:** `--target-imgref` = `ghcr.io/secureprospective/sp-plus-kde:edge` (REAL address,
  not live yet, that's fine)
- **D32:** Gate 0.B SPLIT — 0.B(install) needs no registry; 0.B(update) deferred
- **D33:** KDE / Kinoite 44 only through Phase 0
- **D34:** LUKS2 on root + user data; `/boot` and ESP unencrypted; copy says "your files
  and system are encrypted", never "every byte"
- **D35:** Agents commit ONLY files their brief names

## 8. LEDGER (the durable output Christopher cares most about)

`projects/sp-plus/docs/ledger/`
- `DO-NOT.md` — DN-01..DN-08, product traps, verbatim error signatures required
- `WORKS.md` — W-01 (`--network host`), W-02 (installer container builds)
- `OPERATIONS.md` — **OP-01..OP-11, process lessons**, committed `5f21589`
- `TODO.md` — T-01..T-06
- `HARDWARE-MATRIX.md` — HW-00 = the Dell
- `runs/` — one append-only file per dispatch

**Pending ledger writes (NOT yet committed):**
- Extend **OP-02**: a well-cited HIGH-confidence diagnosis is still a claim until the
  artifact is checked. Luna gave 8 good citations and was wrong; its own mandatory
  "evidence against" section (`verify with lsinitrd`) is what caught it.
- New **DN-09**: over-correcting a do-not can cause a worse failure — removing `selinux=0`
  entirely (to satisfy DN-04) broke the installer. Scope the fix to where the rule applies.
- New **OP-12**: when GUI/console diagnostics are blocked, boot `-kernel`/`-initrd` with a
  controlled `-append` rather than fighting a bootloader UI.

## 9. THE DELL (HW-00) — free to wipe, confirmed by Christopher

Dell Inspiron 5737 (2014), BIOS A08, UEFI+GPT, Secure Boot **present but disabled**,
**NO TPM**, i5-4200U, 7.6 GB RAM, single 931 GB **mechanical** HDD.
Chosen deliberately as the **performance floor**. No TPM means Spike C (TPM2 enrollment)
cannot be gated there — QEMU+swtpm only (T-01).

## 10. NEXT ACTIONS, IN ORDER

1. Confirm the SELinux failure appears on the normal GRUB boot path too (not just my
   direct-kernel boot). **Verify the mechanism before acting.**
2. Restore `selinux=0` to the installer cmdline in `installer/iso.yaml`.
3. Rebuild the ISO via `~/sp-plus-iso-build.sh` (rootful — DN-06).
4. Boot it, confirm Anaconda's text/graphical UI actually appears.
5. Hand to Christopher for the real QEMU install (paste.md relay) — he sets the LUKS
   passphrase; only he does that.
6. Then: build `tests/field-inspect.sh` + `field-diff.sh` (brief already written at
   `/root/briefs/spplus-p03-fieldinspect.md`) — ONE script run on QEMU and the Dell so the
   two examinations are diffable. This is Christopher's two-contact-point plan.
7. Tom verifies each gate independently.

## 11. RELAY DISCIPLINE

`/root/paste.md` = the ONLY channel for commands Christopher runs himself. One batch,
overwrite each time, plain commands + `#` comments. A Stop hook enforces this and
false-positives on quoted error output containing `sudo` — refresh paste.md and continue.
Next real batch will be the USB write for the Dell + enabling Secure Boot in its BIOS.

## 12. ETA HONESTY

Told Christopher 4-8h wall clock. Gate 0.A landed at ~2.5h. The loader hang is a real bug;
I have told him it is unlikely to land inside 8h with a fully install-tested ISO. Keep
reforecasting out loud rather than letting the number slide.
