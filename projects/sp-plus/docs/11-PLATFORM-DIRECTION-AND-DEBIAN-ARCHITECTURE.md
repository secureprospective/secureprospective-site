# SP+ — Platform Direction and Debian Architecture

**Status:** controlling direction, 2026-09-07
**Decision owner:** Christopher
**Scope:** concise product direction for the active Fedora/KDE path and the deliberate Debian/Cinnamon distribution path. It does not authorize implementation.

## 1. The decision

SP+ now has two deliberately different jobs:

1. **Fedora/KDE is the immediate product and proving ground.** Its bootc model gives SP+ a reproducible, image-based, strongly rollback-capable workstation while the product, Fin, evidence, support model, and advisor workflow are proven.
2. **Debian/Cinnamon is the long-term independent distribution path.** Secure Prospective will learn to build and maintain a conventional Debian workstation distribution that gives non-technical advisors a familiar, stable experience without depending on Fedora's release cadence or immutable-image model.

The Debian path is not a Butterknife fork, a Mint/Ubuntu hybrid, or a replacement for Fedora today. Butterknife is a valuable reference: it proves a practical Debian installer, Btrfs layout, Timeshift integration, and recovery-oriented user experience. SP+ may reuse verified ideas and test cases; code, assets, branding, configuration, and repositories require separate licensing and supply-chain approval.

The shared promise is unchanged: an advisor receives an encrypted, familiar workstation that works for browser-first business, is difficult to damage, can explain what happened, and has a clear recovery path. Neither platform is allowed to make unsupported security or compliance claims.

## 2. The Debian architecture: base to user experience

```text
Debian 13 Trixie
  -> stock Debian signed Secure-Boot chain
  -> live installer with LUKS2 and Btrfs
  -> controlled package maintenance plus verified local snapshots
  -> Cinnamon/X11 desktop and curated application profile
  -> Fin, help, evidence, and approval-gated support actions
  -> tested release and hardware-support process
```

### Base and boot

- **Base:** Debian 13 Trixie, amd64 first.
- **Desktop:** Cinnamon, with X11 as the supported session. Wayland is a separate test track, not a product promise.
- **Boot chain:** stock Debian shim, GRUB, and signed kernel. SP+ does not ship a custom kernel or out-of-tree kernel modules in the supported profile.
- **Installer form:** a branded live ISO with a graphical installer. It must create the target system from a reproducible package manifest, not from a captured disk image.
- **Secure Boot rule:** the standard install must boot and install with Secure Boot already enabled, with no firmware changes and no MOK enrollment. A machine that requires either is outside the supported hardware list until a product-approved path exists.

### Storage, encryption, and recovery

- The installer creates an unencrypted EFI System Partition and `/boot`, plus a LUKS2-encrypted Btrfs system volume. Product language must say **“encrypted system and user-data volume with unencrypted boot partitions,”** not claim literal encryption of every byte.
- The advisor creates a permanent LUKS passphrase. A recovery key is generated, shown once, confirmed, and never retained in logs, the ISO, or the installed system.
- Btrfs uses a clear subvolume layout: `@`, `@home`, `@var_log`, `@var_cache`, and `@var_tmp`. Timeshift creates local recovery snapshots. There is no snapshot boot menu: grub-btrfs is not packaged in any Debian suite and is out of scope (D33). Recovery is Timeshift restore, either from the running system or from the SP+ live USB. See `12-DEBIAN-LIVE-INSTALLER-AND-SUPPORT-PLAN.md`.
- Undoing the last update, permanent restore from the live USB, and external backup are three separate operations. Local snapshots are not a disk-failure backup and are not bootc-equivalent atomic rollback.
- TPM2 is convenience only. It is a later, separately gated capability and can never displace the passphrase and recovery key.

### Semi-immutable operating model

Debian is a writable package system. SP+ should not falsely market it as immutable. Its practical protection model is **controlled mutability**:

- The daily advisor account is not expected to use a terminal or install arbitrary system packages.
- Operating-system changes go through a visible SP+ maintenance path: check free space, create and verify a snapshot, apply the approved APT transaction, rebuild boot artifacts, retain a known-good kernel, record the result, and request a safe restart.
- If snapshot creation fails, the managed update stops or clearly reports degraded protection; it does not silently proceed as protected.
- Applications are delivered separately from the base where practical, so application freshness does not require mixing Debian suites.
- Fin may explain, diagnose, and offer signed, approval-gated actions. It must not silently add repositories, alter boot configuration, change encryption keys, or run arbitrary package commands.

This is less atomic than Fedora bootc. It is simpler to inspect and maintain for a Debian-based workstation, provided SP+ owns the update and recovery discipline.

### Repository and application profile

The stable application profile begins with as few trust roots as possible.

| Layer | Allowed source | Purpose |
|---|---|---|
| Base OS and desktop | Official Debian `trixie`, `trixie-updates`, and `trixie-security` | Kernel, Cinnamon, core desktop, security fixes, print/network/audio stack |
| Hardware firmware | Debian `non-free-firmware` component, only where needed | Wi-Fi, graphics, Bluetooth, and device firmware without third-party driver modules |
| Tested exception packages | Official `trixie-backports`, pinned per package and release-tested | A specific hardware enablement or application need when Stable cannot meet it |
| User-facing desktop apps | One controlled Flatpak remote, initially a curated Flathub allowlist | Selected applications whose updates should not pull core Debian libraries forward |
| SP+ software | SP+ signed packages or a signed SP+ application channel | Fin, help, evidence, first-run, policies, and approved support tooling |

Rejected by default: Debian Testing/Forky, Sid, Mint repositories, Ubuntu repositories, PPAs, generic third-party APT repositories, and `butterrepo`. APT pinning does not make a mixed desktop stack safe.

The first application profile is deliberately ordinary:

- Cinnamon, NetworkManager, PipeWire/WirePlumber, CUPS, BlueZ, fwupd, archive and screenshot tools, and LibreOffice from Debian.
- Firefox ESR is the repository-first supported browser. It carries managed bookmarks, the SP+ web application, and installed PWA-style business workflows.
- A Chromium-family browser, including Brave, is an explicit compatibility exception only after carrier portals and PWAs require it, its update behavior is tested, its licensing is accepted, and its source is pinned and monitored. It is not a reason to add an uncontrolled repository to every machine.
- Flatpak applications are individually approved for their permissions. Password managers, video calls, and document tools are tested for printing, portals, file access, camera, audio, and desktop integration before entering the profile.

The advisor never chooses a repository, package format, desktop, or update channel. They see a small application catalog, plain-language setup, and one supported path for their work.

### User experience and Fin

Cinnamon supplies the familiar Windows-transition surface: task bar, start-style application menu, file manager, settings, printer setup, and predictable window behavior. SP+ supplies the product layer above it:

1. Boot the USB, select the clearly named internal disk, create the encryption passphrase, create the first user, and confirm the erase operation.
2. On first login, complete a plain-language welcome: network, recovery-key confirmation, supported browser sign-in, business web apps, printer setup, and help.
3. Work primarily in browser-based carrier portals, CRM, e-signature, office, video calls, and PWAs, with LibreOffice available for documents.
4. Use Fin for explanation, device health, evidence, and guided repair. Fin asks before an action, states what it will change, verifies the result, and records only sanitized evidence.
5. Receive updates and recovery guidance in ordinary language. The user is never asked to reason about subvolumes, package suites, PCRs, or GRUB entries.

AI-forward does not mean AI controls the computer. Fin is a constrained product capability: local status collection is allowlisted, cloud-bound information is redacted by code, actions are signed and approval-gated, and no client data or secrets are placed in the ISO or an external prompt by default.

## 3. Delivery gates

The Debian path proceeds one gate at a time. A later gate cannot be called passed by inference from Butterknife, Fedora, or a BIOS-only VM.

### Gate A — installer, encryption, and recovery

Build a disposable UEFI/Secure-Boot live installer test without TPM. It must install Debian/Cinnamon with the approved repository profile, LUKS2 passphrase, recovery key, Btrfs snapshots, and a documented permanent-restore path. Verify Secure Boot remains enabled and no firmware change or MOK enrollment was required.

### Gate B — TPM2 only

Add virtual TPM2 to the already-passing Gate A system. Test enrollment through the chosen initramfs path, normal unlock, failed TPM unlock, passphrase fallback, recovery-key fallback, kernel update, and firmware-state change. If it fails, TPM stays out of the product; Gate A remains valid.

### Gate C — managed update and recovery

Prove that the SP+ maintenance path blocks or plainly reports missing snapshots, records the update and snapshot identifiers, retains a bootable kernel, handles disk-pressure limits, and distinguishes undoing the last update on a running system from a permanent restore performed from the SP+ live USB.

### Gate D — advisor workflow and supportability

On supported hardware, prove Wi-Fi, Bluetooth, printing, external display, suspend, camera, audio/video calls, browser/PWA workflows, LibreOffice document fidelity, and Fin's bounded help/evidence behavior. Add a model to the hardware list only after its evidence is recorded.

## 4. What SP+ must maintain

A Debian distribution is not just an ISO. Secure Prospective must maintain the package manifest, installer configuration, signing and release process, snapshot/update tooling, supported-hardware list, security-update cadence, testing, support guidance, and a discontinuation path.

The maintenance advantage is not “looser” control. It is choosing where flexibility belongs: user-facing applications and advisor workflows may move through the curated profile; the operating-system base, boot chain, repositories, and recovery mechanics remain narrow, tested, and deliberately changed.

## 5. Current boundaries

- Fedora/KDE remains active; do not pause or rewrite it merely because the Debian path is promising.
- The Debian path starts from stock Debian and original SP+ work, not from copied Butterknife materials.
- No platform is released until its own installation, encryption, recovery, update, and hardware gates pass.
- Existing detailed records remain evidence: `09-BUTTERBIAN-BUTTERKNIFE-TRIAGE.md`, `10-BUTTERKNIFE-CINNAMON-AUDIT.md`, and the earlier Fedora planning set. This document is the short direction that governs their interpretation.
