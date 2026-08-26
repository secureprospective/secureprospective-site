# SP+ — Decision Register and Open Questions

**Document 6 of 6 in the SP+ planning set.**
Status: living document. Last updated 2026-08-25.

Part I records decisions that are made, so they are not relitigated. Part II records
questions that are open, with who decides and what evidence would settle them. Part III
records what must be verified before anything is built.

---

## Part I — Decisions of record

| # | Decision | Rationale | Reversible? |
|---|---|---|---|
| D1 | Product is named **SP+** | Chosen by Christopher, 2026-08-25 | No |
| D2 | Base is **Fedora 44** | Current stable since 2026-04-28; ~13-month support window | Yes, at cost |
| D3 | Build architecture is **image mode (bootc)** | Reproducible, atomic, rollback-capable, registry-delivered. Document 2 §1-2. Independently reached by both research passes | Yes, before Phase 1 |
| D4 | Derive from **`quay.io/fedora/fedora-kinoite:44`** (KDE) and **`quay.io/fedora/fedora-silverblue:44`** (GNOME) | Fedora maintains the desktop; SP+ maintains only its delta. Confirmed bootc-compatible by registry label inspection (`containers.bootc=1`, `ostree.bootable=true`, kernel `7.1.10-200.fc44`, rebuilt 2026-08-26). `quay.io/fedora-ostree-desktops/*` is the equivalent fallback address | Yes, before Phase 1 |
| D5 | **No out-of-tree kernel modules, no custom kernel** in v1 | Preserves stock Fedora Secure Boot with zero MOK enrollment. Document 2 §4 | Only with a designed MOK flow |
| D6 | **Golden-image capture is a discovery technique, never a shipping mechanism** | Encryption, identity, and reproducibility all fail. Document 2 §1 Option D | No |
| D7 | Encryption is established **on the user's machine at install time**, never preseeded | An ISO cannot hold a secret | No |
| D8 | TPM2 enrollment and recovery-key generation are **first-boot steps** | Anaconda cannot do it. Document 2 §5 | No |
| D9 | A **passphrase keyslot is retained permanently** alongside TPM2 | Firmware changes invalidate PCR 7 | No |
| D10 | Install media is **`bootc-generic-iso` with a purpose-built SP+ installer container carrying Anaconda**, for both pilot and public release. A live "try SP+" ISO is a later optional artifact | `anaconda-iso` is the historical type; Anaconda already understands bootc, LUKS2, and destructive-operation confirmation, and is maintained by people who are not us. Revised after the parallel pass, document 7 §3-4 | Yes |
| D11 | **Podman is a prerequisite** on any build host; the Docker path is deleted | Document 5 Part I §3 | No |
| D12 | Three channels: `edge`, `next`, `stable`, with a canary ring | Document 4 §2 | Yes |
| D13 | Images are **cosign-signed** and a signature policy ships in the image | Supply-chain integrity | No |
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

**Open.** `bootc-fetch-apply-updates.timer` will, by default, stage and reboot into a new
image within hours. An unattended reboot during a client appointment is unacceptable.
Options: download-only staging plus an "install on next shutdown" prompt; a maintenance
window the advisor chooses in the first-boot wizard; or a nag that escalates after N
days. Some form of deferral is mandatory, and unbounded deferral is also unacceptable
because the machine holds client PII.

*Owner:* engineering. *Deadline:* Phase 3.

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

---

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
| 2026-08-25 | Revised after the parallel research pass (document 7). D10 rewritten: Anaconda via `bootc-generic-iso` is the installer of record, and the live-ISO route is demoted to optional. D4 confirmed by registry label inspection. D21-D27 added. Q5 reframed. Q12-Q15 opened. Q1 extended to cover Brave's updater behavior on an immutable root. |
