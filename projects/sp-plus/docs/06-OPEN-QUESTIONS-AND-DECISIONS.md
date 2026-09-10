# SP+ — Decision Register and Open Questions

**Document 6 of 6 in the SP+ planning set.**
Status: living document. Last updated 2026-09-07.

Part I records decisions that are made, so they are not relitigated. Part II records
questions that are open, with who decides and what evidence would settle them. Part III
records what must be verified before anything is built.

---

## Part I — Decisions of record

| # | Decision | Rationale | Reversible? |
|---|---|---|---|
| D1 | Product is named **SP+** | Chosen by Christopher, 2026-08-25 | No |
| D2 | **Fedora 44/KDE is the active delivery base; Debian 13 Trixie/Cinnamon is the separate long-term distribution path** | Fedora bootc proves the immediate product; Debian provides a stable conventional-workstation path that Secure Prospective must deliberately learn to maintain. Document 11 | Yes, at cost |
| D3 | Fedora uses **image mode (bootc)**; Debian uses **controlled mutability** rather than a false immutability claim | Fedora provides reproducible atomic deployments. Debian uses a constrained repository profile, managed updates, verified Btrfs snapshots, and explicit restore semantics. Document 11 | Yes, before either public release |
| D4 | Derive the active Fedora edition from **`quay.io/fedora/fedora-kinoite:44`** (KDE); do not build a GNOME edition in the current direction | Fedora maintains the KDE desktop; SP+ maintains only its delta. Cinnamon is the Debian-path desktop. `quay.io/fedora-ostree-desktops/*` remains the equivalent fallback address | Yes, before Phase 1 |
| D5 | **No out-of-tree kernel modules, no custom kernel** in v1 | Preserves stock Fedora Secure Boot with zero MOK enrollment. Document 2 §4 | Only with a designed MOK flow |
| D6 | **Golden-image capture is a discovery technique, never a shipping mechanism** | Encryption, identity, and reproducibility all fail. Document 2 §1 Option D | No |
| D7 | Encryption is established **on the user's machine at install time**, never preseeded | An ISO cannot hold a secret | No |
| D8 | Recovery-key generation is a mandatory post-install step; TPM2 is separately gated | Fedora adds recovery key and TPM2 at first boot because Anaconda cannot enroll TPM2. Debian must prove its passphrase/recovery path before adding TPM2. Document 11 | No |
| D9 | A **passphrase keyslot is retained permanently** alongside TPM2 | Firmware changes invalidate PCR 7 | No |
| D10 | Fedora install media is **`bootc-generic-iso` with a purpose-built SP+ installer container carrying Anaconda**. Debian install media is a separately gated graphical live installer | Anaconda remains Fedora's installer of record. Debian must prove its own live-installer path before it becomes product infrastructure. Document 11 | Yes |
| D11 | **Podman is a prerequisite** on any build host; the Docker path is deleted | Document 5 Part I §3 | No |
| D12 | Three channels: `edge`, `next`, `stable`, with a canary ring | Document 4 §2 | Yes |
| D13 | Images are **cosign-signed** and a signature policy ships in the image. **CORRECTED 2026-09-10 — the second half was never built.** Publishing signs by digest and verifies, but the installed machine carries stock `insecureAcceptAnything`: no policy, no key in `/etc/pki/containers`, no ghcr.io entry in `registries.d`, and zero signature references in the 2,921-line Containerfile. Measured on alpha4; see `ledger/POSTURE-2026-09-10-alpha4.md` §2 and `14-THREAT-MODEL.md` §4. Phase S of `15-DEFENSE-IN-DEPTH-ROADMAP.md` closes it | Supply-chain integrity | No |
| D14 | Telemetry is **off by default and opt-in** | Client PII, regulatory exposure | Yes |
| D15 | **No compliance claims** on any surface | Legal exposure | No |
| D16 | Eligibility is **never enforced inside the installed OS** | From the build brief; hostile and an operational liability otherwise | No |
| D17 | Fedora branding packages are **replaced**; SP+ may use the **"Fedora Remix"** secondary mark | Fedora trademark guidelines. Document 5 Part III | No |
| D18 | Phases do not overlap; each has a demonstrated gate | The failure mode of 2026-08-25. Document 3 | No |
| D19 | **Dual boot is not supported in v1** | Support surface. Anaconda can do it, but guiding a non-technical user through shrinking an existing Windows partition is a class of support call SP+ should not open | Yes |
| D20 | Release artifacts come from **CI, not from the Beelink host** | Reproducibility | No |
| D21 | **`--target-imgref` is mandatory** in the Anaconda `bootc` kickstart, and is a release gate | Without it the fleet installs and silently never updates | No |
| D22 | **SELinux stays enforcing** on the installed system; `selinux=0` is installer-side only | Upstream examples leak it | No |
| D23 | The **recovery key is never persisted to disk** by SP+ - displayed once, acknowledged, transient copies removed | It is a plaintext unlock credential for the disk it sits on | No |
| D24 | **No `dnf update` in the Containerfile**; pin the base by digest and rebuild | Reproducibility; kernel and bootloader handling | No |
| D25 | Desktop defaults ship as **system defaults** (`/etc/dconf/db/local.d/` plus locks for GNOME; `XDG_CONFIG_DIRS` plus `[$i]` for KDE), never written into `/home` | Otherwise it only reaches users who do not exist yet | No |
| D26 | SP+ ships **its own release and logos packages**, not `generic-release` | `generic-release` sets `ID=generic` | No |
| D27 | The **certified hardware list is exhaustive**: untested is unsupported, and the download page says so | "Works on most laptops" is a support-cost promise nobody can keep | No |
| D28 | The **Fedora 44 to 45 migration is a scheduled rehearsal**, run on the canary ring the week F45 ships (2026-10-20), not deferred | Christopher, 2026-08-26: slow early adoption means a small blast radius, which is exactly when you want to run this for the first time. Document 4 §5 | No |
| D29 | The **first testable artifact is an ISO that completes an Anaconda install in QEMU** under enforced Secure Boot, before any bare-metal attempt | Christopher, 2026-08-26. A failed VM install costs a minute; a failed laptop install costs an evening. Document 3 §2.3 | No |
| D30 | **Secure Boot is pre-tested in QEMU** using `OVMF_CODE_4M.secboot.fd` with `OVMF_VARS_4M.ms.fd`, and **gated on the Dell** | The MS-key VARS file enrolls Microsoft's KEK and db, so the shim signature is genuinely validated. Real firmware still gates. Document 3 §2.3-2.4 | No |
| D31 | **Two-track platform direction:** Fedora/KDE is immediate; Debian Trixie/Cinnamon is the long-term distribution path | The platforms share the SP+ security, Fin, evidence, and advisor-workflow goals but have separate low-level update and recovery mechanisms. Document 11 is controlling. | Yes, before either public release |
| D32 | The Debian installer is **stock Calamares 3.3 driven by a `calamares-settings-spplus` package that supplies `partition.conf` and `mount.conf`**; SP+ writes no installer *code*, but does own the full storage configuration | Debian ships Calamares 3.3.14-1 in Trixie. Verified 2026-09-07: upstream Calamares defaults to `luksGeneration: luks1` and `defaultFileSystemType: ext4`, and `calamares-settings-debian` ships **no `partition.conf` at all** and no `btrfsSubvolumes` in its `mount.conf`, so Debian stock takes upstream's LUKS1/ext4 partition defaults and the mount module's code fallback of `/@` and `/@home` only. The SP+ layout (LUKS2, Btrfs, `@ @home @var_log @var_cache @var_tmp`) is therefore obtained only by overriding both files. **Corrected 2026-09-07:** the prior wording claimed Debian stock produces an `@rootfs` subvolume; no such layout exists in any source consulted. Document 12 §0, §4.2 | Yes, before Phase A. **Durable architecture decision: expert-AI panel before the first build.** |
| D33 | **No grub-btrfs and no snapshot boot menu.** Recovery is Timeshift restore, from the running system or from the SP+ live USB | grub-btrfs is not packaged in any Debian suite, so shipping it means owning a boot-critical third-party component. Two named restore operations are simpler to document, to test, and to explain to a non-technical advisor. Document 12 §3 | Yes, at cost |
| D34 | **Fin ships on Debian as `sp-plus-fin`**, vendoring a pinned Node 22 from the nodejs.org tarball, SHASUMS-verified, plus a pinned `pi`. npm is not present on the installed machine | Trixie carries nodejs 20.19.2 and there is no backport; `pi` requires Node >= 22.19.0. Vendoring inside one package keeps the runtime pinned and auditable, and keeps a second ecosystem's package manager off the advisor machine. Document 12 §2 | Yes, before Phase D |
| D35 | **Debian artifacts are built on the Beelink with reproducibility gates and published to Cloudflare R2.** CI is deferred to Phase E | The Fedora lane is already Beelink-built and there is no `.github/` in the repository. This records a deliberate tension with D20: the build host is a single machine until the release lane exists. Document 12 §5 | Yes, at Phase E |
| D36 | The managed update path is **fail-closed: snapshot creation and verification precede any APT transaction**, and a failure stops the update and is reported as degraded | A snapshot that was never verified is not protection, and silently proceeding is the failure this product exists to prevent. Document 11 semi-immutable operating model; Document 12 §3 | No |
| D37 | **Debian trust roots are Debian and the SP+ repository only**, enforced by APT pinning. Backports are enabled per package, never as a suite | Every additional origin is a permanent supply-chain obligation. Pinning makes the boundary mechanical rather than a matter of discipline. Document 11 repository profile; Document 12 §2 | Yes, per package |
| D38 | **The platform base stays Debian 13 Trixie stable.** Cinnamon is the version Trixie ships (6.4.10-2). A newer Cinnamon is a per-package backport under D37, and only when a **named feature** requires it — never as a standing posture | Christopher's ruling, 2026-09-07. A rolling desktop is the largest single source of unplanned breakage on advisor machines, and every such break lands on Secure Prospective. D36's fail-closed update path assumes a base that does not move underneath it. Timeshift needs no action: Trixie's 24.06.6-2 is upstream's current line. Document 12 §0 | Yes, per named feature |
| D39 | **Firmware is carried in both the live image and the installed target**, from an explicit package list. `firmware-b43-installer` and `firmware-b43legacy-installer` are excluded and older Broadcom b43 hardware is unsupported | Enabling the `non-free-firmware` archive area makes firmware *available*; it installs nothing. A live ISO without wireless firmware has no network on exactly the laptops this decision protects, so installation must be self-sufficient. The b43 packages download at install time and cannot work offline. Document 12 §4.6 | Yes, before Phase A |
| D40 | **A laptop model is "supported" only after it passes the §4.6 firmware gate and is recorded in the ledger** with its model, wireless chipset and firmware package | The plan names HP as the common advisor hardware but no SP+ document names a single model or chipset. Until the mapping exists the supported list is empty rather than broad, and untested must never be reported as supported. Document 12 §4.6, §5.8 | Yes, per model |
| D41 | **The Debian lane keeps DN-30's cadence**: fortnightly staging on even ISO weeks (Friday 15:00) with the apply and conditional restart on the following Sunday (04:00) | Christopher's ruling, 2026-09-07. A draft of document 12 described a weekly schedule and called it a verbatim reuse of DN-30; it was neither. The one genuine Debian difference is the restart predicate: DN-30 conditions reboot on a staged bootc deployment, and Debian has no such object, so restart is conditional on the recorded APT result instead. Document 12 §3 | No |
| D42 | **`sp-plus-fin` is `Architecture: amd64`, and the SP+ Debian edition targets amd64 only for now** | Christopher's ruling, 2026-09-07. Two reasons of different weight. The narrow one: `pi` needs Node >= 22.19.0 and upstream Node ships no architecture-independent binary, so a package embedding one runtime cannot honestly be `Architecture: all`. That alone is cheap to reverse. The binding reason is platform enablement — arm64 laptops boot per-device rather than through the generic UEFI/ACPI path, so there is no single arm64 ISO that installs across a class of machines; each model needs its own device tree and firmware, peripheral support is weakest exactly there, and Gate A's Secure Boot guarantee may not be achievable. The office SP+ is securing today is almost entirely x86. **Scoped to today's hardware, not to the architecture** — see Q20. Document 12 §2, §4.6 | Reviewable — see Q20 |
| D43 | **The Fedora/KDE bootc lane is the sole target of security-architecture work. Debian is parked.** | Christopher's ruling, 2026-09-10. Secureblue, the closest reference implementation of every control SP+ wants, is Fedora Atomic — so the Fedora lane is where the work is cheapest as well as where the product is. Doc 11 named Debian the controlling long-term direction and the 2026-09-10 Beelink handoff called it parked; this ruling settles the contradiction. Documents 11-13 remain valid as a parked design, not as current direction | Yes, at cost |
| D44 | **Nothing may break day one.** A security control that breaks printing, printer discovery, Wi-Fi, Brave, PWAs, audio, camera, microphone, suspend/resume, external display or Bluetooth is **rejected outright**, however strong it is | Christopher's ruling, 2026-09-10. This restates doc 01 principle 1 as a hard gate rather than a preference: a control that breaks printing gets uninstalled by the advisor, at which point it protects nothing. It is the rule that rejects five of Secureblue's controls outright. Document 15 §0 | No |
| D45 | **Brave is fixed for the current lane**; security work hardens around it rather than replacing it | Christopher's ruling, 2026-09-10. Q1 and Q17 remain open on their own schedule and are not reopened by this. Document 15 §0 | Reviewable via Q1/Q17 |
| D46 | **Every security control ships with an assertion in `tests/runtime-posture-gate.sh`, mutation-tested red before green.** A control without an assertion does not ship | The gate exists because a build gate grepped a config file, reported `WSDD_OK` on every build, and smbd was listening on `0.0.0.0:445` regardless. A control proven only by the text that configures it has not been proven. Document 15 §1 | No |

---

## Part II — Open questions

Each carries an owner, a decision deadline expressed as a phase, and the evidence that
would settle it.

### Q1 — Brave, or something else?

**Open.** Brave is not in the Fedora repositories, parts of it are not open-source
licensed, and including it creates a supply-chain dependency on Brave's own RPM signing.
That sits against product principle 7. Against that: Brave's privacy defaults are strong,
its enterprise policy surface is good, and the existing design and knowledge base assume
it.

Alternatives: **Firefox** with enterprise policies (in Fedora, fully open source, weaker
default privacy posture, uncertain long-term direction) or **Chromium** (in Fedora,
policy surface identical to Brave's Chromium base, no built-in ad blocking).

*Owner:* Christopher. *Deadline:* before Phase 1. *Evidence needed:* whether the
advisor's actual carrier portals, quoting engines, and e-signature tools work correctly
in each candidate, tested against a real list.

**Extension to this question.** If Brave is chosen, use the native RPM, not the Flatpak:
Brave's own documentation recommends the native package and warns that its Flatpak alters
Chromium sandboxing in ways neither the Brave nor the Chromium security teams have
vetted. A second unknown then opens, namely whether Brave's self-updater behaves correctly
on an immutable root. Either SP+ rebuilds the image to ship browser updates (slower, but
consistent with the architecture) or Brave's updater is permitted and its write path is
verified. Untested either way.

### Q2 — Which cloud AI provider, and under whose credentials?

**Open**, and correctly deferred in the build brief. The unresolved sub-questions are
retention, training use, jurisdiction, and whether the advisor or Secure Prospective
holds the credential. A Secure Prospective AI gateway would centralize the redaction
enforcement and the audit trail, which is architecturally attractive and operationally a
new service to run.

*Owner:* Christopher. *Deadline:* before Phase 2 ships to the pilot.

### Q3 — RPM Fusion and patent-encumbered codecs?

**Open.** Advisors will watch carrier training videos and join calls. Without RPM Fusion,
some media will not play. With it, SP+ redistributes patent-encumbered software, which
has a jurisdictional dimension. Universal Blue includes them; Fedora does not.

*Owner:* Christopher, possibly with counsel. *Deadline:* before Phase 1.

### Q4 — Auto-update reboot policy

**DECIDED 2026-09-01 by Christopher: stage silently, install on shutdown.** Implemented
as DN-46.

`bootc-fetch-apply-updates.timer` stays disabled, and the image asserts that it is,
because it runs `bootc upgrade --apply` and reboots on its own schedule. SP+ ships
`spplus-stage-update.timer` instead: daily, persistent, randomised, running `bootc
upgrade` **without** `--apply`. That writes a staged deployment, which
`ostree-finalize-staged.service` applies at shutdown. The advisor gets the new version by
turning the machine off at the end of the day, which they already do, and no reboot is
ever imposed on them.

The advisor is told once per staged image by a user-session notifier
(`spplus-update-notify.timer`), in plain words: "A new version has been downloaded. It
will be in place the next time you restart or shut down. Nothing to do now." Nothing is
asked of them, because nothing is required.

The deferral concern in the original question is answered by construction rather than by
a nag: the update is already downloaded and applies on the next shutdown, so deferral
lasts exactly as long as the advisor leaves the machine running. `spplus-update-health.timer`
remains the check that reports a machine that has fallen off the update path entirely.

Verified end to end on the fedora-test VM, 2026-09-01: a new image pushed to the tracked
tag was staged without reboot, the marker and notification appeared, the notification did
not repeat, and the staged deployment applied on the next restart.

*Owner:* engineering. *Status:* CLOSED.

### Q5 — How mature is the bootc generic-ISO path, really?

**Reframed after the parallel pass.** This originally read "how much do we depend on
titanoboa and bootc-installer?". That dependency is gone: Anaconda is the installer of
record (D10) and the live-ISO route is optional. What remains open is the maturity of the
`bootc-generic-iso` path itself.

The concern is concrete. image-builder's own repository contains **skipped** KVM
boot-install tests for bootc ISOs, and its documentation carries the
`systemd-remount-fs.service` warning (Q13). A reasonable engineer could argue this path is
not ready for a public launch aimed at non-technical users. The Phase 0 spike exists to
answer that with evidence rather than opinion; the fallback if it fails is document 2's
second choice.

*Owner:* engineering, with Christopher on the risk acceptance. *Deadline:* Phase 0.

### Q6 — Which hardware is on the matrix?

**Open.** Document 3 §7 proposes a first tier, but it is a guess. The right input is what
Secure Prospective members actually own.

*Owner:* Christopher. *Evidence needed:* a survey of the member base. *Deadline:* Phase 5,
but the survey should start now because it takes calendar time.

**Row zero exists.** Christopher has an old Dell laptop prepared for bare-metal testing.
Record its exact model, generation, firmware version, CPU, GPU, Wi-Fi chipset, and TPM
version at Phase 0 and treat it as the first entry in the matrix. It is also, usefully, a
worst case: if SP+ works well on an old Dell, the newer machines advisors actually own are
a softer target.

### Q7 — Tailscale versus Headscale

**Open**, carried forward from the build brief. Hosted Tailscale's control plane is not
fully open source. If a fully open-source control plane is required by principle 7,
Headscale must be evaluated, and operating it is a new obligation.

*Owner:* Christopher. *Deadline:* before remote support (support tier 3) is offered.

### Q8 — LibreOffice, and the Microsoft 365 question

**Open.** Advisors receive `.docx` and `.xlsx` attachments from carriers and expect them
to open and to look right. The web versions of Word and Excel work in a browser, which
fits the architecture. LibreOffice's fidelity on carrier-produced documents is the
unknown, and it is testable.

*Owner:* engineering. *Deadline:* Phase 1.

### Q9 — What happens to the advisor's existing data?

**Open, and larger than it looks.** Migrating from Windows means moving files, browser
bookmarks and passwords, and often a local email store. This may need its own tool and
certainly needs its own document. It is currently unowned.

*Owner:* unassigned. *Deadline:* before the pilot.

### Q10 — Where does the member portal end and the OS begin?

**Partly settled** (D16: no eligibility enforcement in the OS) but the download,
signature verification, and USB-writing experience is a portal responsibility that
nobody has designed. A non-technical user verifying a detached GPG signature is not a
realistic expectation; the portal needs to solve this some other way.

*Owner:* Christopher / portal team. *Deadline:* Phase 4.

### Q12 — What does "full-disk encryption" mean, precisely?

**Open.** Firmware requires an unencrypted EFI System Partition, and the standard Fedora
layout may leave some boot metadata outside the LUKS volume. Whether SP+ means "root and
user data are encrypted" or "every non-firmware byte including `/boot` is encrypted" is a
boot-chain design decision with real consequences, and the marketing copy must match
whichever is chosen, exactly.

*Owner:* engineering, with Christopher signing off on the wording. *Deadline:* Phase 0.

### Q13 — The `systemd-remount-fs.service` wart

**Open.** image-builder's own documentation warns that a bootc system installed through
Anaconda can fail `systemd-remount-fs.service`. Reproduce it, then either fix it or
consciously accept it with a tested workaround. It must not be discovered by an advisor.

*Owner:* engineering. *Deadline:* Phase 0.

### Q14 — Does an unchanged Fedora shim need extra trademark permission?

**Open.** SP+ ships Fedora's signed shim unchanged, and that binary carries Fedora vendor
metadata in its EFI vendor directory. Whether that constitutes a trademark use requiring
permission inside a modified image is not answered by the published guidelines. Ask the
Fedora Council or Fedora Legal. Cheap to ask, awkward to discover later.

*Owner:* Christopher. *Deadline:* before public release.

### Q15 — Which PCR policy?

**Open.** `systemd-cryptenroll --tpm2-pcrs` defaults to empty when enrolling directly, so
the policy must be stated explicitly. PCR 7 measures Secure Boot policy and firmware
trust state; PCR 11 measures kernel/UKI boot; PCR 14 measures shim and MOK state. A
GRUB/BLS system and a systemd-boot/UKI system do not measure identically. The right set
for SP+ depends on the boot chain actually shipped, and can only be settled by testing
whether enrollment survives kernel, bootloader, firmware, and Fedora major-version
updates.

*Owner:* engineering. *Deadline:* Phase 1, and re-tested at every Fedora bump.

### Q11 — Does the assistant run at all in v1?

**Worth asking honestly.** The assistant, the RPC boundary, the redaction gateway, the
playbook signing, and the PWA are the most novel and highest-risk components in SP+, and
none of them are in the top four reasons an advisor would adopt it (document 1 §2). A
version of SP+ that is *only* an encrypted, immutable, preconfigured, well-supported
workstation with a static knowledge base and an evidence report would deliver three of
the four outcomes and could ship far sooner.

*Owner:* Christopher. *Deadline:* before Phase 2. *This is a scope question, not a
technical one, and it deserves a deliberate answer rather than momentum.*

### Q16 — dracut or initramfs-tools as the Debian product default?

**Open.** An earlier version of this entry asserted that TPM2 unlock through
`systemd-cryptenroll` *requires* dracut on Trixie and that initramfs-tools ignores
`tpm2-device`. **That assertion is not established by any source checked on 2026-09-07** and
has been removed: `systemd-cryptenroll` documents TPM2 support and dracut is packaged, but
Debian bug #1031254 records TPM-related failures without proving the general claim. Document
12 §0 records it as UNVERIFIED. An open question may not carry its own presumed answer — that
is what made this one look settled while it was not. initramfs-tools is Debian's default and
the better-trodden path for everything else, and the first task under this question is to
establish by test whether it can support the design at all. Swapping the initramfs generator is a
boot-critical change, so it is confined to Gate B and does not touch Gate A. If Gate B
fails, initramfs-tools stands and TPM stays out of the product.

*Owner:* engineering. *Deadline:* Gate B.

### Q17 — Firefox ESR or a Chromium-family browser on Debian?

**Open.** This inherits Q1 rather than reopening it. Firefox ESR is the repository-first
supported browser on the Debian path. A Chromium-family browser, including Brave, remains
a compatibility exception that must be earned by carrier-portal and PWA evidence, and it
must not become a reason to add an uncontrolled APT repository to every machine.

*Owner:* Christopher. *Deadline:* Gate D, on Q1 evidence.

### Q18 — What does Timeshift restore look like for a non-technical advisor?

**Open.** With no snapshot boot menu (D33), the rescue path is: boot the SP+ live USB,
unlock the LUKS volume, open Timeshift, select a snapshot, restore. Each of those steps is
a place an advisor can stall, and the LUKS unlock in particular happens before any
familiar interface appears. The question is whether this is walkable with a printed card
and the help corpus, or whether it needs a purpose-built rescue front end.

*Owner:* Christopher, with engineering evidence. *Deadline:* Gate A, since Gate A already
requires proving a permanent restore from the USB.

### Q19 — Is Cloudflare R2 a sound APT origin?

**Open.** APT clients revalidate `InRelease` on every update, and object-storage caching
and TLS behaviour differ from a conventional mirror. Unverified: how R2 handles
conditional requests for `InRelease`, whether stale caching can serve an out-of-date index
alongside fresh packages, and what that does to APT's own freshness checks. This must be
tested with a real client before any machine outside the lab updates from it.

*Owner:* engineering. *Deadline:* Phase E.

---


### Q20 — When does arm64 become a supported SP+ target?

**Open.** ARM is the growth architecture in mobile computing, and advisor laptops are mobile
computing. D42 makes SP+ amd64-only, and treating that as permanent would be wrong: it is a
judgement about cost today, not a statement about what SP+ is.

The cost today is not the Fin package — that is half a day's work, since upstream Node ships
`linux-arm64`. The cost is that supporting an arm64 laptop means a hardware-enablement project
per model — device tree, firmware, boot chain — on platforms whose Linux support is still
moving, and on which SP+ may not be able to keep Gate A's promise of Secure Boot enabled with
no MOK enrolment.

**Review triggers.** Any one of these reopens this question rather than waiting for a scheduled
review:

1. An advisor or prospect arrives with an arm64 laptop as their working machine.
2. Debian ships a generic arm64 desktop installer that boots mainstream Qualcomm or comparable
   laptops without per-model enablement.
3. The Secure Boot and full-disk-encryption path in Gate A becomes demonstrable on an arm64
   laptop with vendor-signed boot components.
4. Two or more mainstream business laptop lines an advisor would plausibly buy ship arm64 as
   the default configuration.

**What must be re-checked when it reopens**, because none of it is stable: mainline kernel
support for the specific SoC; whether Debian's installer and signed boot chain cover it;
firmware packaging and redistribution terms; and whether Timeshift, LUKS2 and the SP+ subvolume
layout behave the same on that platform. No answer recorded before a trigger fires should be
trusted.

**Interim position:** arm64 is unsupported, and the advisor-facing purchasing guidance says so
plainly so that nobody buys hardware SP+ cannot run. Unsupported is not a judgement about ARM.
It is a statement about what has been tested — the same bar D40 applies to every model.

*Owner:* Christopher. *Deadline:* trigger-based, not scheduled.


### Q21 — Does sshd ship enabled to advisors?

**Open.** Measured on alpha4: sshd listens on `0.0.0.0:22` and firewalld's public zone permits
the `ssh` service. No advisor workflow requires it; it is development convenience that has
followed the image into the product. Advisors work on hotel and airport Wi-Fi, so this is an
open port on a hostile network by default.

The question is not only whether to close it but what replaces it. If remote support (support
tier 3) later needs a way in, that is a designed feature with its own gate and its own consent
model, not a port left open from development. See also Q7, Tailscale versus Headscale.

*Owner:* Christopher. *Deadline:* before the first non-lab machine. *Evidence needed:* whether
any current support workflow depends on it.

### Q22 — What is the backup story?

**Open, and currently unowned.** Snapshots and bootc rollback are not backups. A rollback
restores the operating system; it does not restore a client file the advisor deleted, and it
does not survive a disk failure or ransomware that reaches the user's home directory.

`14-THREAT-MODEL.md` §6 item 7 records this as residual risk. Doc 01 §3 puts backup below the
line for v1, which is a defensible scoping decision — but it is not currently *said* anywhere the
advisor would see it, and an advisor who believes "immutable with rollback" means their files are
safe has been misled by omission rather than by a claim.

Two separable questions: what SP+ ships, and what SP+ tells the advisor it does not ship. The
second has no cost and should not wait for the first.

*Owner:* Christopher. *Deadline:* the second half before the pilot; the first is a v2 scope call.

## Part III — Facts to re-verify before building

Every one of these was true on 2026-08-25 and every one can change.

1. `quay.io/fedora/fedora-kinoite:44` and `fedora-silverblue:44` still published and still
   bootc-compatible.
2. Fedora 44 still supported; Fedora 45's release date and the resulting migration window.
3. `osbuild/image-builder` — the current container reference, the current CLI invocation,
   and which image types it supports. The old `bootc-image-builder` repo is archived; do
   not follow its README. As of 2026-08-25 two builder containers are published and both
   respond: `ghcr.io/osbuild/image-builder-cli:latest` (successor, and what the
   2026-08-25 session used) and `quay.io/centos-bootc/bootc-image-builder:latest`
   (predecessor, still tagged `latest`). Confirm which one Fedora 44 bootc images are
   actually expected to be built with before committing the build scripts to either.
4. Whether Anaconda has gained TPM2 enrollment. If it has, the first-boot design in
   document 2 §5 simplifies considerably.
5. Whether image-builder's skipped bootc ISO boot-install tests have been enabled and are
   passing, and whether the `systemd-remount-fs.service` warning still stands. If the
   optional live-try ISO is revisited, whether `titanoboa` and
   `projectbluefin/bootc-installer` are still maintained.
6. Brave's current Linux policy key names and whether they take effect — verified at
   `brave://policy`, not from documentation.
7. Fedora's current trademark guidelines and whether `generic-logos` / `generic-release`
   still exist under those names.
8. `bootc`'s current auto-update unit names and its signature-policy configuration
   format.
9. Whether the stock Fedora 44 kernel still covers the hardware matrix without
   out-of-tree modules.

---

## Part IV — Change log for this register

| Date | Change |
|---|---|
| 2026-08-25 | Created. D1-D20 recorded; Q1-Q11 opened. |
| 2026-08-26 | Session close. D28 (F45 as a scheduled rehearsal), D29 (QEMU-installable ISO is the first artifact), D30 (Secure Boot pre-tested in QEMU, gated on the Dell) recorded from Christopher's direction. Q6 gains row zero, the Dell. |
| 2026-08-25 | Revised after the parallel research pass (document 7). D10 rewritten: Anaconda via `bootc-generic-iso` is the installer of record, and the live-ISO route is demoted to optional. D4 confirmed by registry label inspection. D21-D27 added. Q5 reframed. Q12-Q15 opened. Q1 extended to cover Brave's updater behavior on an immutable root. |
| 2026-09-07 | D2-D4, D8, and D10 scoped to the active Fedora/KDE path and D31 added. Debian 13 Trixie/Cinnamon becomes the separately gated long-term distribution path. See `11-PLATFORM-DIRECTION-AND-DEBIAN-ARCHITECTURE.md`. |
| 2026-09-07 | D32-D37 recorded and Q16-Q19 opened, covering the Debian live installer, the fail-closed managed update path, the SP+ package set, and the release lane. See `12-DEBIAN-LIVE-INSTALLER-AND-SUPPORT-PLAN.md`. |
| 2026-09-07 | **D41** (DN-30 cadence stands for the Debian lane), **D42** (`sp-plus-fin` is `Architecture: amd64`; the Debian edition is amd64-only for now) and **Q20** (when arm64 becomes a supported target, with named review triggers) recorded after a second independent audit. **Q16 corrected**: its asserted dracut requirement was not established by any source and has been removed — an open question may not carry its own presumed answer. See `docs/ledger/AUDIT-2026-09-07-doc12-terra.md`. |
| 2026-09-07 | **D32 corrected** after independent verification: Debian stock Calamares inherits upstream LUKS1/ext4 defaults and defines no Btrfs subvolumes, and the previously recorded `@rootfs` layout does not exist. D38 records the stable-base ruling; D39 and D40 record firmware carriage and the supported-hardware bar. See `docs/ledger/AUDIT-2026-09-07-doc12-bee.md`. |
| 2026-09-10 | **D13 corrected** after direct measurement of an installed alpha4: the signature policy it records has never been built, so published images are signed and no machine verifies them. **D43-D46** recorded from Christopher's rulings (Fedora-only, nothing-breaks-day-one, Brave fixed, every control gated). **Q21** (sshd exposure) and **Q22** (backup story) opened. New documents 14 (threat model) and 15 (defense-in-depth roadmap); evidence in `ledger/POSTURE-2026-09-10-alpha4.md` and `ledger/SECUREBLUE-INVENTORY-2026-09-10.md`. |
