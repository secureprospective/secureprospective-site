# SP+ — Butterknife Cinnamon Installation Audit

**Status:** initial read-only audit  
**Date:** 2026-09-07  
**Test target:** local KVM guest `debian13-Buttertest`  
**ISO:** `butterknife-0.3.1-trixie-20260824.iso`  
**ISO SHA-256:** `e47d978deb2cd29020e8f5410b09c17a0046350adc0549290c664e70a2fcd63c`

This audit examined the completed Butterknife Cinnamon installation over SSH. It did not modify the installed system. A temporary localhost-only SSH forward was used and removed after the audit.

## Important test limitation

The guest was configured for legacy BIOS, not UEFI:

- no EFI variables were available;
- `/boot` contains `i386-pc` GRUB files;
- `mokutil` could not report Secure Boot;
- no TPM device was presented.

Therefore this audit **does not prove Secure Boot, UEFI installation, TPM2 enrollment, or Secure Boot plus LUKS interaction**. Those require a separate OVMF/Secure Boot VM with a virtual TPM.

The ISO itself contains both BIOS and UEFI El Torito boot images.

## Verified installed system

```text
OS:       Butterbian GNU/Linux 13 (trixie)
Kernel:   6.12.101+deb13-amd64 (also 6.12.107 installed)
Desktop:  Cinnamon 6.4.10
Session:  Cinnamon on Xorg/X11
Login:    LightDM
Disk:     20 GiB virtual disk
Memory:   4 GiB
CPU:      4 vCPU
```

Repositories are coherent Debian Trixie repositories:

- `trixie`
- `trixie-updates`
- `trixie-security`
- `trixie-backports`

No `butterrepo` entry was found in the installed APT sources. No Butterknife or Butterbian package was installed as a normal Debian package; the product identity is supplied through the distribution image and configuration.

The image includes a useful conventional workstation bundle:

- Cinnamon, Muffin, Nemo
- Firefox ESR
- LibreOffice
- PipeWire and WirePlumber
- NetworkManager
- CUPS and printer support
- Bluetooth
- fwupd
- apt-listchanges
- Timeshift
- grub-btrfs integration

A Wayland Cinnamon session file exists, but this audit only observed and tested the X11 session.

## Storage and encryption

The installed layout is:

```text
/dev/vda1       2 GiB ext4 /boot
/dev/vda2      18 GiB LUKS2
  cryptroot    Btrfs
    @          /
    @home      /home
    @var_log   /var/log
    @var_cache /var/cache
    @var_tmp   /var/tmp
zram0           1.9 GiB swap
```

The Btrfs mount uses `compress=zstd` and `noatime`.

LUKS metadata:

- LUKS2
- AES-XTS
- Argon2id passphrase KDF
- one active passphrase keyslot
- no enrolled token
- no TPM2 token
- no recovery-key token

This confirms the Butterbian design previously found in source: encrypted system/data volume with a separate unencrypted `/boot`. It is not literal encryption of every non-firmware byte.

The use of Argon2id is workable here because `/boot` is outside the encrypted volume and GRUB does not need to unlock the LUKS2 device. It still needs an explicit SP+ boot-chain decision and hardware testing.

## Snapshot implementation

Timeshift is configured for Btrfs mode:

```json
"include_btrfs_home_for_backup" : "true",
"include_btrfs_home_for_restore" : "false",
"count_monthly" : "12",
"count_weekly" : "8"
```

Two snapshots were present after installation and testing:

- `pre: apt upgrade`
- `pre: apt install btop`

Each snapshot contains both `@` and `@home`. The configured restore policy excludes `/home`, even though home is included in the snapshot data. This is an important distinction: a system restore is not necessarily a user-state restore.

The snapshots are on the same encrypted 18 GiB system volume. The test system had approximately 14.3 GiB free. They are not protection against disk loss.

`grub-btrfsd.service` is enabled and active. It regenerated `/boot/grub/grub-btrfs.cfg` after the test snapshots. Each snapshot menu contains entries for both installed kernels:

- `6.12.101+deb13-amd64`
- `6.12.107+deb13-amd64`

This is useful evidence that the snapshot menu is operational. It is not proof that permanent rollback is safe. `/boot` is still outside the snapshot, and no persistent restore was performed during this read-only audit.

## APT transaction behavior

The image contains:

```text
/etc/apt/apt.conf.d/80timeshift
/usr/local/sbin/timeshift-apt-hook
```

The hook creates a Timeshift snapshot before APT package changes and labels it with the triggering command. The post-invoke hook regenerates the grub-btrfs snapshot menu.

The hook explicitly does this:

```sh
/usr/bin/timeshift --create ... | logger -t timeshift-apt-hook
exit 0
```

The APT configuration also uses:

```text
DPkg::Pre-Invoke {"/usr/local/sbin/timeshift-apt-hook || true";};
DPkg::Post-Invoke {"/etc/grub.d/41_snapshots-btrfs >/dev/null || true";};
```

Therefore snapshot and menu-generation failures are fail-open. A package transaction may proceed even when the protective snapshot failed. This is acceptable as a personal project convenience but not as an SP+ recovery guarantee.

APT daily and daily-upgrade timers are enabled. The exact unattended-upgrade policy needs a separate check before copying this behavior into SP+.

## Boot and service observations

No systemd units were reported failed.

Observed warnings/errors include:

- `systemd-cryptsetup` reports the `initramfs` crypttab option as unknown at runtime. This may be harmless because the option is intended for the initramfs tooling, but it should be resolved or consciously accepted.
- LightDM reports that `/var/lib/lightdm/data` does not exist.
- LightDM reports a failed utmpx write.
- WirePlumber cannot create a node in this QEMU audio configuration.
- ALSA restore emits obsolete or ineffective udev rule warnings.
- The VM lacks a TPM and EFI variables, so security services cannot be assessed here.

The audio and graphics warnings are not yet product defects because this guest uses virtual hardware. They are still reminders that Cinnamon, PipeWire, suspend, and display behavior need bare-metal testing.

## What this validates for the alternative concept

The installation demonstrates that the following combination is technically practical:

```text
Debian 13 Trixie
Cinnamon 6.4
X11
Calamares/Butterknife-style installation
LUKS2 Argon2id root
Btrfs subvolumes
Timeshift snapshots
GRUB snapshot entries
zram
```

It also confirms that a Cinnamon-based Debian alternative can retain a normal workstation bundle rather than becoming a minimal developer distribution.

This supports keeping Cinnamon as the leading alternative desktop candidate. It does not yet establish that Butterknife itself can be used as SP+ code or product infrastructure.

## Changes required for an independent SP+ design

These are requirements for an SP+ implementation, not instructions to modify JustAGuy’s work:

### Critical

1. Use original SP+ code, branding, artwork, and configuration after licensing review.
2. Make encryption policy explicit and consistent with product wording.
3. Test UEFI and Secure Boot in a dedicated VM and on the hardware matrix.
4. Add a recovery key and retain a passphrase fallback.
5. Test TPM2 only through the actual chosen initramfs path.
6. Make managed-update snapshot creation verifiable and fail closed, or clearly disclose the degraded mode.
7. Define temporary snapshot boot, permanent restore, and backup as separate operations.
8. Define `/boot`, kernel, initramfs, `/var/lib`, and `/home` consistency during rollback.
9. Pin and verify external sources; do not clone an unpinned GitHub head during production builds.
10. Test disk-full behavior, snapshot retention, snapshot deletion, and disk failure backup recovery.

### Product and support

- Replace Butterbian identity with SP+ identity packages.
- Do not import `butterrepo` by default.
- Decide whether APT daily-upgrade remains enabled or becomes staged, user-visible SP+ maintenance.
- Add SP+ health/evidence reporting.
- Define assistant permissions before allowing any recovery or package automation.
- Test real advisor workflows: browser, PWAs, LibreOffice documents, printing, audio/video calls, external displays, Bluetooth, suspend, and Wi-Fi.
- Test Cinnamon Wayland separately; keep X11 as the supported default until it passes.

## Findings not yet proven

- UEFI boot success from the installed disk
- Secure Boot signature validation
- TPM2 enrollment and unlock
- Recovery-key enrollment and use
- Permanent snapshot restore
- Kernel/initramfs consistency after restore
- Snapshot behavior after a failed package transaction
- Automatic update policy and reboot behavior
- Bare-metal graphics, audio, Wi-Fi, Bluetooth, suspend, camera, and printer behavior
- Whether Cinnamon’s defaults meet SP+ advisor usability requirements
- Reproducibility of the Butterknife build
- Licensing boundaries for any reuse

## Next examination step

Run one separate disposable UEFI VM with:

- OVMF Secure Boot enabled
- virtual TPM2
- the same Butterknife Cinnamon ISO
- LUKS2 installation
- recovery-key and passphrase tests
- Secure Boot update test
- snapshot creation and menu test
- a deliberate package failure
- documented temporary boot and permanent restore behavior

Do not perform permanent restore or package-break tests on the current guest until its rollback state is intentionally disposable or a known-good disk snapshot exists.
