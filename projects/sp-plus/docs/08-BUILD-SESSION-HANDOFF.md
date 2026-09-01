# SP+ — Build Session Handoff

**Session closed 2026-08-26. The next session begins the build.**

Read this first. It is written to be sufficient on its own: if you have read nothing else,
you can start from here and pick up the other documents as they are cited.

---

## 1. Where things stand

The research phase is complete. The rename to SP+ is complete. Nothing has been built
against the new architecture.

- **Repository:** `~/work/secureprospective-advisor-os` — a git worktree of
  `secureprospective-site`. Do not rename the directory; worktrees store absolute paths.
- **Branch:** `session/sp-plus-plan`, cut from `session/advisor-os-poc` at `48b033a`.
- **Unpushed.** Four commits: `f4d51b7` (rename + planning set), `8113af8` (reconciliation
  with the parallel research pass), `d06aa5c` (rename-log closeout), plus this handoff.
- **Subproject:** `projects/sp-plus/`.
- **Tests:** `./scripts/test-host.sh` passes, 3 tests, after the rename.
- **Untracked and not mine:** `grafix/hdri/`, `grafix/render/` — pre-existing, left alone.

Documents 1 through 7 are the plan. Document 7 changed documents 2 and 3 after a parallel
research pass; read it before acting on either.

---

## 2. What Christopher asked for, in his words

From 2026-08-26:

> "I would like an ISO that I could test from install in QEMU. I do have an old Dell
> laptop prepared to test our image on bare metal."

> "Fedora 45 lands 2026-10-20, which is good because our distro will likely adopt very
> slow at 1st and this will give us an opportunity to test 44 upgrades to 45."

Both are now decisions of record: **D29** (a QEMU-installable ISO is the first artifact,
before bare metal), **D30** (Secure Boot pre-tested in QEMU, gated on the Dell), and
**D28** (the F44→F45 migration is a scheduled rehearsal run while the fleet is small, not
a chore deferred to next year).

The third instruction — "log everything" — is why this document exists and why the F45
rehearsal's real deliverable is a written procedure, not a release.

---

## 3. Build host inventory (Beelink, verified 2026-08-26)

| Thing | State |
|---|---|
| OS | LMDE 7 (gigi), kernel 6.12.101+deb13-amd64 |
| `podman` | **MISSING.** `apt` candidate `5.4.2+ds1-2+b2`. Install it first — this is D11 |
| `buildah`, `skopeo` | MISSING; install alongside podman |
| `cosign` | MISSING; needed at Phase 3, not Phase 0 |
| `docker` | Present at `/usr/bin/docker`. **Do not use it for SP+ builds.** See §6 |
| `qemu-system-x86_64`, `qemu-img` | Present |
| `swtpm` | Present |
| `xorriso`, `mkisofs` | Present |
| `/dev/kvm` | Usable. `chris` is not in the `kvm` group, but an ACL grants `user:chris:rw-` |
| OVMF | `OVMF_CODE_4M.fd`, `OVMF_CODE_4M.secboot.fd`, `OVMF_VARS_4M.fd`, `OVMF_VARS_4M.ms.fd`, and `.snakeoil` variants, all under `/usr/share/OVMF/` |
| Disk | `/` 408 GB free (`/var/lib/containers` lands here); `/home` 155 GB free |

**The OVMF finding matters and corrects the earlier plan.** `OVMF_VARS_4M.ms.fd` ships
with Microsoft's KEK and db already enrolled. Paired with `OVMF_CODE_4M.secboot.fd` and
`-machine q35,smm=on`, Secure Boot is genuinely enforced in the VM: a Fedora shim signed
by the Microsoft UEFI CA validates, and a broken chain actually fails. That makes QEMU a
real pre-check rather than a gesture.

It is still not the Dell. It does not exercise that machine's own db and dbx contents, its
firmware quirks, its storage controller, or its TPM. QEMU is necessary; the Dell is the
gate.

**Never use the plain `OVMF_VARS_4M.fd` for a Secure Boot test.** It enrolls nothing and
will boot anything, which produces a confident false pass.

---

## 4. First commands of the next session

```bash
sudo apt install -y podman buildah skopeo
cd ~/work/secureprospective-advisor-os && git status && git log --oneline -5
```

Then Phase 0 of `docs/03-ISO-BUILD-PLAN.md`, in order. Do not skip ahead; the phase gates
are the correction for what went wrong on 2026-08-25.

**0.2 Spike A — does the derived desktop build and boot?**
Ten-line Containerfile `FROM quay.io/fedora/fedora-kinoite:44`, `bootc container lint`,
build a qcow2, boot it in QEMU. Gate: reaches an SDDM login on a KDE session unattended.

**0.3 Spike B — the ISO Christopher asked for.**
Build a second `sp-plus-installer` container carrying Anaconda, then
`image-builder --type bootc-generic-iso` with `--bootc-installer-payload-ref` pointing at
the OS image. Run a complete Anaconda install in QEMU with `q35,smm=on`, KVM, swtpm, and
the secboot/ms OVMF pair. Tick encryption, set a passphrase, create a user, reboot into
the installed disk. The exact QEMU invocation is in document 3 §2.3.

Gate: installs, reboots, unlocks with the passphrase, and on the installed system
`mokutil --sb-state` says `SecureBoot enabled`, the root is LUKS2, and
`bootc upgrade --check` reaches the SP+ channel.

**0.4 Spike B2 — the same ISO on the Dell.**
Write it to USB, install with Secure Boot enabled in firmware. **Gate 0.B: no MOK
enrollment screen at any point.** Record the Dell's model, generation, firmware version,
CPU, GPU, Wi-Fi chipset, and TPM version before starting — it becomes row zero of the
hardware matrix, and "an old Dell" is not a row.

**0.5 Spike C** — recovery key and TPM2 enrollment on the Dell, then invalidate PCR 7 by
changing a BIOS setting and confirm both the passphrase and the recovery key still work.

**0.6 Spike D** — Wi-Fi, suspend/resume, external display over HDMI and USB-C, audio,
microphone, webcam, and a driverless IPP printer.

---

## 5. The three things most likely to bite, in order

1. **`--target-imgref` omitted from the Anaconda `bootc` kickstart.** The machine installs
   perfectly and then silently never updates, and nobody finds out for weeks. Both
   `--source-imgref` and `--target-imgref` are required. Check this before declaring
   Spike B passed — it is in the gate for exactly this reason.
2. **The `inst.stage2=hd:LABEL=…` kernel argument not matching the ISO label.** GRUB boots
   a kernel, Anaconda never finds its runtime, and the failure looks nothing like a label
   typo.
3. **`selinux=0` leaking from the installer into the installed system.** It appears in the
   upstream image-builder example as an installer-side workaround. The advisor's machine
   runs SELinux enforcing (D22).

Full list: 48 numbered anti-patterns in `docs/05`, §Part II.

---

## 6. Standing rules for the build

- **Podman, not Docker.** The 2026-08-25 session routed around a missing Podman with a
  Docker → `docker save` → privileged image-builder detour and lost most of a session to
  it. Docker's image store is not interchangeable with the `containers/storage` that
  image-builder reads. Install Podman; delete the Docker path rather than keeping it as a
  fallback.
- **`FROM quay.io/fedora/fedora-kinoite:44`**, not `fedora-bootc`. The desktop images
  carry `containers.bootc=1` and `ostree.bootable=true` and are rebuilt daily. Building a
  desktop by hand on the minimal base is the central error being corrected.
- **`bootc-generic-iso`**, not `anaconda-iso`. The latter is the historical type and the
  archived README that documents it is still the top search result.
- **The Containerfile is the product.** If a change is not in git, it did not happen. A
  hand-configured VM is a way to *discover* what the image needs; transcribe every
  discovery and destroy the prototype.
- **No out-of-tree kernel modules, no custom kernel.** This is what keeps Secure Boot
  working with zero MOK enrollment, and it is worth sacrificing features for.
- **Never `dnf update` in the Containerfile.** Pin the base by digest and rebuild.
- **No secrets in the image, ever.** No AI credentials, no signing keys, no recovery keys,
  no client data.
- **Record negative results.** "This failed and here is the error" is a deliverable. The
  2026-08-25 session did this well and it is why a useful postmortem was possible.
- **Every "passed" names the artifact digest and the environment.** "Booted" is not a
  result.

---

## 7. Calendar

| When | What |
|---|---|
| Next session | Phase 0. Podman, Spike A, the QEMU-installable ISO, then the Dell |
| ~2026-09-15 | Fedora 45 Beta. Open the `edge-next-fedora` branch and start the migration procedure (document 4 §5) |
| 2026-10-20 | Fedora 45 GA. **Run the F44→F45 rehearsal on the canary ring that week** (D28) while the fleet is small |
| ~2027-05-19 | Fedora 44 EOL. The fleet must be on 45 or later well before this |

The two questions the F45 rehearsal exists to answer, neither of which can be answered
from documentation: does the LUKS2 TPM2 keyslot survive the rebase, or does the
bootloader change move PCR 7 and drop advisors to a passphrase prompt they have never
seen — and does `/etc` three-way merge cleanly, or does it silently keep SP+ files at
their old contents?

---

## 8. Open decisions Christopher owns

None of these block Phase 0. All of them block something later.

| # | Question | Blocks |
|---|---|---|
| Q1 | Brave, or Firefox, or Chromium? And if Brave, does its self-updater behave on an immutable root? | Phase 1 |
| Q3 | RPM Fusion and patent-encumbered codecs? | Phase 1 |
| Q6 | Which hardware is on the matrix? The member survey takes calendar time — start it now | Phase 5 |
| Q11 | **Does the assistant ship in v1 at all?** An SP+ that is only encrypted, immutable, preconfigured, and well-supported delivers three of the four adoption drivers and ships far sooner | Phase 2 |
| Q12 | What does "full-disk encryption" mean precisely — root and user data, or every non-firmware byte? The marketing copy must match | Phase 0 |
| Q14 | Ask the Fedora Council whether an unchanged Fedora-signed shim needs trademark permission inside a modified image | Public release |

---

## 9. Housekeeping left undone, deliberately

- **4.5 GB of qcow2, ISO, and QEMU state** under `projects/sp-plus/artifacts/`. Gitignored,
  disposable, superseded. **Not deleted — Christopher's call.** Only the text logs are
  worth keeping, and those are already under `docs/`.
- **The branch is unpushed.** Pushing is a deliberate act and was not requested.
- **CT105 has not been touched.** Per the standing instruction, Beelink does not reach
  into Claudebox's backbone. A dated entry in `/root/.claude/backbone/context.md`
  recording the SP+ rename is still owed, and the source material for it is
  `docs/RENAME-LOG-2026-08-25.md`.
- **`~/.pi/agent/settings.json`** is dirty from pre-existing runtime state and was left
  uncommitted; it is not this session's to change.

---

## 10. What was written this session

In `projects/sp-plus/docs/`:

| File | What it is |
|---|---|
| `01-PRODUCT-DEFINITION.md` | The advisor, why they would adopt SP+, the ten day-one jobs, success criteria |
| `02-DISTRIBUTION-ARCHITECTURE.md` | The verified fact base, four ways to build a distribution, the recommendation, Secure Boot and encryption constraints |
| `03-ISO-BUILD-PLAN.md` | Six phases, each with a blocking gate; Phase 0 is next |
| `04-MAINTENANCE-AND-RELEASE.md` | Channels, signing, the F45 rehearsal, support tiers, cost, discontinuation plan |
| `05-POSTMORTEM-ANTIPATTERNS-AND-BRANDING.md` | Why 2026-08-25 produced an unusable ISO, 48 anti-patterns, Fedora trademark obligations |
| `06-OPEN-QUESTIONS-AND-DECISIONS.md` | D1–D30 and Q1–Q15, with owners and deadlines |
| `07-PARALLEL-REVIEW-AND-DEBATE.md` | The independent second research pass, four disagreements, how each was settled |
| `08-BUILD-SESSION-HANDOFF.md` | This file |
| `APPENDIX-BEE-*.md` | The second pass's raw 80 KB report and the brief it was given |
| `RENAME-LOG-2026-08-25.md` | Advisor OS → SP+, every path and identifier |

Elsewhere: `~/MOVED.md` and `~/archive/MANIFEST.md` carry the move entries;
`~/.pi/agent/memory/project_sp_plus.md` and `~/.pi/agent/backbone/context.md` carry Bee's
copy of the same conclusions; `~/fleet/briefs/sp-plus-build-brief.md` is the renamed baseline;
`~/run-bee-spplus.sh` and `~/.pi/agent/spplus-brief-A.md` are the reusable parallel-research
harness.
