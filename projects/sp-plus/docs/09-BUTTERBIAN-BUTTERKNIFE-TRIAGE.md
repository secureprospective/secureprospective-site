# SP+ — Butterbian/Butterknife Research Triage

**Status:** durable research record  
**Date:** 2026-09-07  
**Decision owner:** Christopher  
**Scope:** Butterbian-XFCE, Butterknife, the JustAGuy ecosystem, and implications for SP+

## Executive decision

Butterbian-XFCE is **not an SP+ desktop or product foundation**. It is an excellent developer/reference environment and a useful technical specimen.

XFCE is therefore removed from the primary SP+ desktop path for now. It is not condemned technically; the decision is based on the hands-on finding that its strengths fit developers and power users better than SP+ advisors.

The current SP+ Fedora 44 product remains active and unchanged. A separate Debian/LMDE-style alternative remains exploratory. Cinnamon is the leading desktop candidate for that alternative, but Butterknife Cinnamon must be examined before that becomes a final decision.

No Butterbian or JustAGuy code, artwork, branding, copy, or configuration is being reused. Public source availability is not assumed to grant reuse rights; licensing must be confirmed before any reuse is considered.

## Combined research result

The parent research pass and the Bee subagent pass agree on the following:

- Butterbian is a personal Debian project associated with Drew/JustAGuyLinux, not an official Debian or Linux Mint distribution.
- Butterbian-XFCE is based on Debian 13 Trixie.
- The verified technical design is ordinary **Btrfs + Timeshift + grub-btrfs**. No separate filesystem named “ButterFS” was found.
- The current XFCE product uses Calamares, Btrfs, Timeshift, grub-btrfs, zram, Firefox ESR, PipeWire, and optional LUKS2 root encryption.
- The installer layout has an unencrypted EFI System Partition, a separate unencrypted ext4 `/boot`, and a LUKS2-protected Btrfs system volume.
- The filesystem uses Timeshift-style subvolumes similar to:

  ```text
  @          /
  @home      /home
  @var_log   /var/log
  @var_cache /var/cache
  @var_tmp   /var/tmp
  ```

- The project has no demonstrated SP+-level hardware matrix, support organization, reproducible-release process, or support SLA.
- Butterknife is a separate TUI installer and supports Btrfs, ext4, and XFS. Its Cinnamon installation is now being tested separately.
- Cinnamon is not currently a Butterbian-XFCE edition.

## Evidence and source quality

### Primary or near-primary evidence

- Butterbian website: <https://butterbian.org/>
- Butterbian-XFCE project: <https://justaguy.dev/drew/Butterbian-XFCE>
- JustAGuy ecosystem: <https://justaguy.dev/drew>
- Butter Lab: <https://lab.justaguylinux.com/>
- JustAGuy wiki: <https://justaguy.dev/drew/justaguywiki/wiki>
- Butterbian source tree, installer configuration, build scripts, and hooks
- Debian release and package documentation
- Timeshift documentation: <https://github.com/linuxmint/timeshift>
- grub-btrfs documentation: <https://github.com/Antynea/grub-btrfs>
- Debian Secure Boot documentation: <https://wiki.debian.org/SecureBoot>
- Debian Wayland documentation: <https://wiki.debian.org/Wayland>
- Xfce Wayland roadmap: <https://wiki.xfce.org/releng/wayland_roadmap>
- Linux Mint and LMDE release material

### Secondary or unverified evidence

- The local Gemini transcript at `~/Downloads/ButterFS-SPPlusMaybe.md` is useful for hypotheses but is not authoritative.
- Project websites and personal forum posts are claims from the project, not independent QA.
- Hands-on testing is strong evidence of user fit, but does not prove product-wide hardware or support behavior.

## What is useful for a developer environment

Butterbian-XFCE is a strong candidate for a disposable developer workstation or VM because it offers:

- A lean, responsive X11 desktop
- A conventional Debian package environment
- Btrfs snapshots for local recovery experiments
- A simple, understandable filesystem layout
- Low resource requirements
- A useful environment for testing destructive package operations and restore workflows
- A concrete reference for installer and snapshot UX

This does not make it a mandatory fleet baseline. Before using it for developer machines, confirm licensing, backup policy, hardware support, and whether the local third-party repository is needed. Do not install it on production or head-brain infrastructure merely because it is attractive as a workstation.

## Principles worth transferring to SP+

These are design principles, not copied implementation:

- Use a coherent base distribution rather than casually mixing releases.
- Make recovery understandable in plain language.
- Protect the system before destructive package changes.
- Distinguish temporary snapshot boot, permanent rollback, and backup.
- Use a signed Secure Boot chain.
- Use LUKS2 with a passphrase and recovery-key fallback.
- Test hardware and update behavior instead of promising compatibility.
- Pin and verify external sources in production builds.
- Treat recovery and evidence as product features, not afterthoughts.

## Findings explicitly rejected for SP+

Do not carry these into SP+ without a separate design and proof:

- XFCE as the primary advisor desktop
- Butterbian or JustAGuy branding, artwork, copy, or code
- `butterrepo` as a production dependency
- Unpinned shallow clones of external sources during image builds
- Fail-open snapshot hooks
- Optional encryption as the default security posture
- Claims that local snapshots are backups
- Claims that grub-btrfs snapshot entries provide bootc-equivalent rollback
- Claims that Debian TPM2 unlocking works merely because `systemd-cryptenroll` exists
- Stable-plus-Testing package mixing to obtain a newer desktop

## Snapshot and rollback limits

Butterbian’s APT integration uses `DPkg::Pre-Invoke` and `DPkg::Post-Invoke` to create a Timeshift snapshot and refresh the grub-btrfs menu. The inspected hook allows failures with `|| true`. It is therefore best-effort protection, not a hard transaction guarantee.

Important limits:

1. APT hooks do not necessarily cover direct `dpkg` operations.
2. `/boot` is outside the Btrfs snapshots.
3. An old root snapshot may be paired with a newer kernel or initramfs.
4. Restoring `@` does not necessarily restore `@home`.
5. `/var/lib` services and databases need an explicit consistency policy.
6. Same-disk snapshots do not protect against disk failure.
7. Snapshot retention can consume the system disk.
8. A grub-btrfs menu entry is not automatically a permanent restore.

For SP+, any snapshot system must verify snapshot creation before allowing the managed update, record the snapshot ID, retain a known-good boot path, and separately test permanent restore.

## Encryption, Secure Boot, and TPM2

Butterbian’s layout should be described precisely as:

> LUKS2-encrypted system and user-data volume with unencrypted boot partitions.

It is not literal encryption of every non-firmware byte. Secure Boot verifies the signed boot chain; it does not encrypt `/boot`, validate every configuration file, or make Btrfs snapshots atomic.

For the SP+ alternative:

- Keep the LUKS2 passphrase permanently.
- Generate a recovery key during installation.
- Never embed secrets in the ISO.
- Never log or persist the recovery key on the installed system.
- Provide an offline LUKS header backup.
- Treat TPM2 convenience unlock as a separate gated experiment.
- Do not claim TPM2 support until the actual initramfs path works through firmware changes, kernel updates, failed unlock, and passphrase fallback.

## Base and desktop direction for the alternative

The first serious alternative candidate remains:

```text
Debian 13 Trixie or LMDE 7
Cinnamon
X11 default
Btrfs
LUKS2
Debian signed Secure Boot chain
```

Do not pull a Cinnamon desktop core from Debian Testing/Forky into Trixie with APT pinning. Either use the coherent stable base, tested backports, or choose Testing as the whole base and accept its support model.

Cinnamon currently better matches the SP+ goal of a familiar, integrated Windows-transition workstation. That is a working hypothesis, not a final product decision. Butterknife Cinnamon is the next direct evidence source.

Wayland remains a test track. Cinnamon Wayland is maturing but not yet the only supported session; XFCE Wayland remains less mature. X11 should remain the production default until display, graphics, screen sharing, accessibility, suspend, and remote-support behavior pass.

## Hands-on test currently in progress

Christopher is installing Butterknife with Cinnamon. This must be evaluated independently from Butterbian-XFCE rather than inferred from the XFCE result.

The examination should record:

- Installer clarity and failure recovery
- Disk layout and encryption behavior
- Secure Boot behavior
- TPM2 and recovery-key behavior, if offered
- Cinnamon defaults and Windows-transition fit
- Update behavior and snapshot creation
- Restore and rollback semantics
- Hardware and peripheral behavior
- Network, audio, Bluetooth, display, printing, and suspend
- Package/repository choices
- What is Butterknife-specific versus upstream Debian/Cinnamon behavior
- Any code, branding, or licensing boundary relevant to SP+

Do not copy or integrate anything from that installation until the behavior is documented and licensing is understood.

## Current next move

1. Finish the Butterknife Cinnamon installation.
2. Examine it as a product experience and technical system.
3. Compare it against SP+ advisor workflows, not against personal developer preference.
4. Keep Butterbian-XFCE available as a developer/reference environment.
5. Do not start an SP+ XFCE edition or alter the Fedora 44 product based on this research.
6. Before selecting the Debian/LMDE alternative, prove in a disposable UEFI VM: LUKS2, recovery key, Secure Boot, Btrfs snapshot creation, broken-update recovery, permanent restore, and kernel/initramfs consistency.

This record is a triage decision, not an implementation authorization.
