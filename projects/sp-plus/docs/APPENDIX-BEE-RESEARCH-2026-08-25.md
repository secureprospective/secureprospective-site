# Appendix — Bee (Pi) independent research report, 2026-08-25

Raw, unedited output of the parallel research pass described in `07-PARALLEL-REVIEW-AND-DEBATE.md`.
Agent: Bee (Pi) on `gpt-5.6-luna`, thinking `max`, run from `~/run-bee-spplus.sh` against the
brief at `~/.pi/agent/spplus-brief-A.md`. Exit 0, 80,020 bytes, ~19 minutes.

It is preserved verbatim because the reconciled documents necessarily compress it, and
because its `[UNVERIFIED]` markings are load-bearing: they mark exactly the claims that
must be re-checked before anything is built. Where this appendix and documents 1-6
disagree, documents 1-6 win and `07` records why.

---

## VERDICT

Recommend **bootc image mode**: build separate GNOME and KDE OCI images from Fedora 44 bootc, sign them with Cosign, and produce install media with the current `image-builder` `bootc-generic-iso` path containing Anaconda and an embedded payload. Use Anaconda for disk selection, the user’s LUKS2 passphrase, and account creation; enroll TPM2 and generate a recovery key only on the target machine, never in the public ISO. Reuse Fedora’s signed shim, GRUB, and stock kernel unchanged, and treat the current bootc/Anaconda/LUKS path as a release blocker requiring VM and physical-hardware testing. The second choice is a classic package-mode Fedora live installer built with current KIWI descriptions and Anaconda; switch if the exact bootc installer remains unreliable or mandatory third-party drivers require mutable post-install operation.

## FACT TABLE

| Area | Verified fact | Source |
|---|---|---|
| Fedora lifecycle | Fedora releases approximately every six months and maintains each release for approximately 13 months; EOL is normally four weeks after the next-next release. | [Fedora release life cycle](https://docs.fedoraproject.org/en-US/releases/lifecycle/) |
| Fedora 44 release | Fedora Linux 44 was announced as released on April 28, 2026. | [Fedora Magazine: Fedora 44 release](https://fedoramagazine.org/announcing-fedora-linux-44) |
| Fedora 44 EOL | The F44 schedule currently lists June 2, 2027 as EOL; the page explicitly says the date can change. | [F44 schedule](https://fedorapeople.org/groups/schedule/f-44/f-44-key-tasks.html) |
| Fedora 45 status on 2026-08-25 | F45 had branched from Rawhide on August 11, reached Bodhi activation and code-complete milestones on August 25, and entered Beta Freeze at 14:00 UTC on August 25. Beta was scheduled for September 15 and the current final target for October 20. It was not GA on the requested date. | [F45 schedule](https://fedorapeople.org/groups/schedule/f-45/f-45-key-tasks.html) |
| Fedora 45 EOL | The current F45 schedule lists November 24, 2027 as EOL and calls the date changeable. | [F45 schedule](https://fedorapeople.org/groups/schedule/f-45/f-45-key-tasks.html) |
| Fedora bootc tag | Quay exposes `quay.io/fedora/fedora-bootc:44`, along with architecture-specific `44-x86_64`, `44-aarch64`, `44-ppc64le`, and `44-s390x` tags. | [Quay tag API](https://quay.io/api/v1/repository/fedora/fedora-bootc/tag/?limit=100), [Quay tag list](https://quay.io/v2/fedora/fedora-bootc/tags/list) |
| Fedora bootc image contents | The F44 manifest identifies a bootable image and includes kernel, bootc, systemd, NetworkManager, Podman, LUKS-related tools, firmware packages, GRUB, and shim. | [F44 manifest](https://quay.io/v2/fedora/fedora-bootc/manifests/44) |
| Fedora Atomic Desktop tags | Quay exposes F44 tags for `fedora-ostree-desktops/silverblue` and `fedora-ostree-desktops/kinoite`. | [Silverblue Quay API](https://quay.io/api/v1/repository/fedora-ostree-desktops/silverblue/tag/?limit=50), [Kinoite Quay API](https://quay.io/api/v1/repository/fedora-ostree-desktops/kinoite/tag/?limit=50) |
| Silverblue/Kinoite media | Fedora’s F44 release tree contains `Fedora-Silverblue-ostree-x86_64-44-1.7.iso` and `Fedora-Kinoite-ostree-x86_64-44-1.7.iso`. | [F44 release tree](https://dl.fedoraproject.org/pub/fedora/linux/releases/44/) |
| bootc-image-builder status | The original `osbuild/bootc-image-builder` repository is archived and says it was merged into `osbuild/image-builder`. | [Archived repository](https://github.com/osbuild/bootc-image-builder), [migration README](https://raw.githubusercontent.com/osbuild/bootc-image-builder/main/README.md) |
| Current ISO image type | Current image-builder documentation recommends `bootc-generic-iso`; the old `anaconda-iso`/`iso` path is historical or compatibility-only in the new CLI. | [image-builder ISO documentation](https://github.com/osbuild/image-builder/blob/main/doc/20-advanced/20-bootc/10-isos.md), [image type definitions](https://github.com/osbuild/image-builder/blob/main/data/distrodefs/bootc-generic/imagetypes.yaml) |
| Current image-builder command | The current CLI defines `--bootc-ref`, `--bootc-installer-payload-ref`, and `--bootc-default-fs`. | [image-builder CLI](https://raw.githubusercontent.com/osbuild/image-builder/main/cmd/image-builder/cmd.go) |
| Generic ISO contract | A bootc generic ISO expects one kernel under `/usr/lib/modules/*/vmlinuz`, an adjacent `initramfs.img`, EFI vendor data, shim/GRUB files, GRUB modules, `mksquashfs`, `xorriso`, `implantisomd5`, `grub2-mkimage`, and Python. The container is converted to SquashFS at `/LiveOS/squashfs.img`. | [Generic ISO documentation](https://github.com/osbuild/image-builder/blob/main/doc/20-advanced/20-bootc/10-isos.md) |
| Embedded payload | `--bootc-installer-payload-ref` embeds a payload container into the installer’s container storage so installation need not fetch the target image from a registry. | [Generic ISO documentation](https://github.com/osbuild/image-builder/blob/main/doc/20-advanced/20-bootc/10-isos.md), [image-builder source](https://raw.githubusercontent.com/osbuild/image-builder/main/pkg/manifest/os_from_container.go) |
| Fedora bootc users | Fedora bootc base images do not contain a default interactive user or hardcoded credentials. | [Fedora bootc authentication](https://docs.fedoraproject.org/en-US/bootc/authentication/) |
| Bootc updates | Fedora bootc enables a stock `bootc-fetch-apply-updates.timer` and service by default; `bootc upgrade` stages an A/B deployment and `bootc rollback` selects the previous deployment. | [Fedora bootc auto-updates](https://docs.fedoraproject.org/en-US/bootc/auto-updates/), [bootc upgrade](https://raw.githubusercontent.com/bootc-dev/bootc/main/docs/src/man/bootc-upgrade.8.md), [bootc rollback](https://raw.githubusercontent.com/bootc-dev/bootc/main/docs/src/man/bootc-rollback.8.md) |
| Bootc filesystem semantics | `/usr` is read-only when deployed; `/etc` and `/var` are persistent mutable state. `/etc` uses three-way merge semantics; content written into `/var` in a container generally copies only at initial installation. | [Fedora bootc filesystem](https://docs.fedoraproject.org/en-US/bootc/filesystem/) |
| Runtime DNF | Runtime `dnf install` on a deployed bootc system normally fails because `/usr` is read-only. `bootc usroverlay` creates a transient writable overlay whose changes are lost on reboot. | [Fedora bootc DNF](https://docs.fedoraproject.org/en-US/bootc/dnf/) |
| Bootc installation paths | Fedora documents Anaconda, a bootc-image-builder-generated ISO, and `bootc install` as separate installation paths. `bootc install to-filesystem` is intended for externally prepared storage, including complex layouts. | [Fedora bootc bare metal](https://docs.fedoraproject.org/en-US/bootc/bare-metal/), [bootc installation](https://raw.githubusercontent.com/bootc-dev/bootc/main/docs/src/bootc-install.md) |
| Anaconda bootc Kickstart | Pykickstart lists `bootc` as added in Fedora 43. `--source-imgref` selects the installation source, while `--target-imgref` identifies the image used for later updates. The documentation says the target reference is currently needed for bootc updates. | [Pykickstart bootc command](https://pykickstart.readthedocs.io/en/latest/kickstart-docs.html#bootc) |
| Anaconda encryption | `autopart --encrypted --luks-version=luks2` and encrypted `part`/`logvol` commands are supported. A Kickstart `--passphrase` is plaintext unless separately protected and must not contain a shared public secret. | [Pykickstart storage commands](https://pykickstart.readthedocs.io/en/latest/kickstart-docs.html#autopart), [Fedora LUKS guide](https://docs.fedoraproject.org/en-US/quick-docs/encrypting-drives-using-LUKS/) |
| Current Anaconda bootc implementation | Current Anaconda source explicitly collects kernel arguments including LUKS UUIDs before invoking `bootc install to-filesystem`. | [Anaconda bootc deployment source](https://github.com/rhinstaller/anaconda/blob/main/pyanaconda/modules/payloads/payload/rpm_ostree/installation.py) |
| Image-builder LUKS limitation | Current image-builder bootc documentation warns that LUKS configurations do not currently work with bootable containers in its image-building storage configuration. | [image-builder configuration sources](https://github.com/osbuild/image-builder/blob/main/doc/20-advanced/20-bootc/05-sources-of-configuration.md) |
| systemd-cryptenroll | `systemd-cryptenroll` supports LUKS2 enrollment of regular passphrases, recovery keys, TPM2 devices, FIDO2 tokens, and PKCS#11 tokens. Recovery keys are computer-generated and can be displayed as QR codes. | [systemd-cryptenroll man page](https://man7.org/linux/man-pages/man1/systemd-cryptenroll.1.html) |
| TPM2 enrollment | TPM2 enrollment stores a randomized unlock key in LUKS2 JSON metadata, encrypted by a TPM-derived key. PCR binding is configurable with `--tpm2-pcrs`. | [systemd-cryptenroll man page](https://man7.org/linux/man-pages/man1/systemd-cryptenroll.1.html), [crypttab TPM2 documentation](https://www.freedesktop.org/software/systemd/man/latest/crypttab.html) |
| Bootc TPM2-LUKS shortcut | Current bootc has `bootc install to-disk --block-setup tpm2-luks`. Its implementation creates a temporary random passphrase, enrolls the local TPM, wipes all other slots, and configures TPM unlocking. It does not itself provide a user passphrase plus recovery-key workflow. | [bootc install-to-disk](https://raw.githubusercontent.com/bootc-dev/bootc/main/docs/src/man/bootc-install-to-disk.8.md), [bootc baseline installer source](https://raw.githubusercontent.com/bootc-dev/bootc/main/crates/lib/src/install/baseline.rs) |
| First-boot scope | `systemd-firstboot` initializes machine ID, locale, keyboard, timezone, hostname, root password/shell, and kernel command line. It does not present itself as a LUKS provisioning tool. | [systemd-firstboot](https://www.freedesktop.org/software/systemd/man/latest/systemd-firstboot.html) |
| Anaconda firstboot | Kickstart `firstboot --enable` starts the Setup Agent and requires `initial-setup`; the default is disabled when unspecified. | [Pykickstart firstboot](https://pykickstart.readthedocs.io/en/latest/kickstart-docs.html#firstboot) |
| Secure Boot chain | Fedora’s Secure Boot documentation states that Fedora’s shim loads Fedora GRUB and kernel packages, and that a Fedora Remix or Fedora-based distribution can ship Fedora shim, GRUB, and kernel unchanged. Customized packages require signing. | [Fedora Secure Boot wiki](https://fedoraproject.org/wiki/Secureboot) |
| Unsigned modules | Fedora’s Secure Boot documentation states that lockdown prevents loading kernel modules not signed by a trusted key. | [Fedora Secure Boot wiki](https://fedoraproject.org/wiki/Secureboot) |
| MOK | Fedora’s MOK guide instructs the user to enroll a generated key through the firmware boot screen; after enrollment, modules signed by that key are trusted transparently. | [Fedora MOK enrollment](https://docs.fedoraproject.org/en-US/quick-docs/mok-enrollment/) |
| Own shim | Current shim-review guidance requires reproducible source/builds, SBAT data, security contacts, boot-chain details, and Microsoft signing. It states that from June 27, 2026 shims sent to Microsoft can only be signed by the Microsoft UEFI CA 2023. | [shim-review README](https://raw.githubusercontent.com/rhboot/shim-review/main/README.md), [submission guide](https://raw.githubusercontent.com/rhboot/shim-review/main/docs/submitting.md) |
| Fedora RPM signing | Fedora says stable RPMs are OpenPGP-signed and that DNF and graphical update tools reject invalid or unsigned packages. | [Fedora security](https://fedoraproject.org/security/) |
| DNF repository signing | DNF has separate `gpgcheck` for RPMs and `repo_gpgcheck` for repository metadata; metadata keys are stored separately from package-signing keys. | [DNF configuration reference](https://dnf.readthedocs.io/en/latest/conf_ref.html) |
| Container signing | Cosign supports keyless Sigstore signing, self-managed keys, KMS/hardware keys, signing by digest, registry storage, and verification. | [Cosign README](https://raw.githubusercontent.com/sigstore/cosign/main/README.md) |
| Bootc image policy | Current bootc supports `--enforce-container-sigpolicy`; the policy is the containers/image `policy.json`, which can require `signedBy` or `sigstoreSigned`. | [bootc install-to-filesystem](https://raw.githubusercontent.com/bootc-dev/bootc/main/docs/src/man/bootc-install-to-filesystem.8.md), [containers policy](https://raw.githubusercontent.com/containers/image/main/docs/containers-policy.json.5.md) |
| Current Universal Blue model | Universal Blue describes itself as producing continuously delivered desktop/server images using bootc. Its current `main` repository says that since September 2025 it builds base, Kinoite, and Silverblue images, and its Containerfile runs `bootc container lint`. | [Universal Blue](https://universal-blue.org/), [uBlue README](https://raw.githubusercontent.com/ublue-os/main/main/README.md), [uBlue Containerfile](https://raw.githubusercontent.com/ublue-os/main/main/Containerfile) |
| uBlue signing model | The uBlue workflow verifies source images, builds in GitHub Actions, pushes to GHCR, signs published images by digest with Cosign, and uses the legacy simple-signing format for compatibility with bootc, rpm-ostree, and containers/image. | [uBlue workflow](https://raw.githubusercontent.com/ublue-os/main/main/.github/workflows/reusable-build.yml), [uBlue Justfile](https://raw.githubusercontent.com/ublue-os/main/main/Justfile) |
| Current Fedora image compose | Fedora’s old `fedora-kickstarts` repository is archived/retired. Fedora’s current Forge repository is `releng/kiwi-descriptions`; its README documents KIWI builds and Zuul/tmt CI. | [Archived kickstarts](https://forge.fedoraproject.org/releng/spin-kickstarts), [current KIWI descriptions](https://forge.fedoraproject.org/releng/kiwi-descriptions/raw/branch/rawhide/README.md) |
| Fedora current KIWI profiles | The current Fedora KIWI definitions include `KDE-Desktop-Live`, `Workstation-Live`, corresponding disk profiles, Anaconda live-install packages, signed shim packages, and scripts to clear machine identity and set first-boot behavior. | [Fedora KIWI definitions](https://forge.fedoraproject.org/releng/kiwi-descriptions/raw/branch/rawhide/VARIANTS.md), [live install component](https://forge.fedoraproject.org/releng/kiwi-descriptions/raw/branch/rawhide/components/liveinstall.xml), [config script](https://forge.fedoraproject.org/releng/kiwi-descriptions/raw/branch/rawhide/config.sh) |
| Calamares | Calamares is distribution-agnostic and intentionally requires substantial distribution-side customization; development moved from the archived GitHub repository to Codeberg. | [Calamares README](https://codeberg.org/Calamares/calamares/raw/branch/calamares/README.md), [current project](https://calamares.codeberg.page/) |
| Live media creator | `livemedia-creator` runs Anaconda and Kickstart, normally through QEMU, to create a disk image and then uses Lorax to create the final ISO. | [Lorax livemedia-creator](https://weldr.io/lorax/livemedia-creator.html) |
| KIWI requirements | Current KIWI documentation describes ISO, VM, cloud, container, and live-image output, supports Fedora 40+, recommends QEMU, and recommends at least 15 GB free build space. | [KIWI documentation](https://osinside.github.io/kiwi/) |
| Firmware package | Fedora’s `linux-firmware` package contains firmware required by some devices and has related packages such as `amd-gpu-firmware`, `atheros-firmware`, and `brcmfmac-firmware`. | [Fedora linux-firmware package](https://packages.fedoraproject.org/pkgs/linux-firmware/linux-firmware/) |
| Fingerprints | Fedora packages `fprintd` and `libfprint`; libfprint’s supported-device list warns that the list is from the development version and that drivers may not be in the stable release. | [fprintd package](https://packages.fedoraproject.org/pkgs/fprintd/fprintd/), [libfprint package](https://packages.fedoraproject.org/pkgs/libfprint/libfprint/), [supported devices](https://fprint.freedesktop.org/supported-devices.html) |
| Printing | CUPS supports IPP Everywhere, AirPrint, Printer Applications, legacy PPD drivers, local USB printers, and network printers. | [OpenPrinting CUPS](https://openprinting.github.io/cups/) |
| Brave package/policy | Brave recommends its native Fedora RPM repository over its Flatpak because the Flatpak is less mature and modifies Chromium sandboxing; Linux managed policy files are read from `/etc/brave/policies/managed/` as JSON. | [Brave Linux installation](https://brave.com/linux/), [Brave Group Policy API article](https://support.brave.com/api/v2/help_center/en-us/articles/360039248271.json) |

## OPTION ANALYSIS

### 1. Image mode / bootc

#### Architecture

The clean implementation is two related images per desktop:

1. `spplus-kde` or `spplus-gnome`: the final operating system.
2. `spplus-installer`: a Fedora bootc-derived image containing Anaconda, Lorax/GRUB ISO tooling, the installer configuration, and no user data.

The final image should contain the desktop, firmware, browser, policy, support tools, static help content, systemd units, and default configuration. The installer image should contain the Anaconda runtime and reference the final payload. The payload should be embedded into the ISO so a normal installation does not depend on an external registry.

The current generic ISO documentation demonstrates this pattern: install Anaconda and its dependencies in the container, add an `iso.yaml`, add `/usr/share/anaconda/interactive-defaults.ks`, and invoke `image-builder` with `bootc-generic-iso`.

A current-style command is:

```text
sudo image-builder build \
  --bootc-ref localhost/spplus-installer \
  --bootc-installer-payload-ref localhost/spplus-kde:44 \
  --bootc-default-fs ext4 \
  bootc-generic-iso
```

The exact payload transport used in `interactive-defaults.ks` must be validated against the selected image-builder version. The current documentation embeds the payload in local container storage but its example Kickstart references a registry transport; do not assume those two pieces work together without an install test. **[UNVERIFIED]**

#### First-boot UX

This option can deliver the required USB workflow, but bootc itself is not the UX. Anaconda is the UX:

- Firmware boots Fedora’s signed shim and GRUB from USB.
- GRUB loads the installer kernel and initramfs.
- Anaconda starts in graphical mode.
- The advisor selects the internal disk, accepts the destructive erase warning, enters the encryption passphrase, creates the local user, and starts installation.
- Anaconda invokes `bootc install to-filesystem` against the prepared target filesystems.
- The system reboots into the installed image.

With preselected locale, keyboard, timezone, DHCP, partition defaults, and embedded payload, this can be reduced to a few meaningful decisions. It is not literally “two clicks”: disk destruction, a user credential, and an encryption credential must be explicit.

#### Encryption

The current image-builder storage configuration warns that LUKS is unsupported for bootable-container disk images. Therefore the public installer should not depend on image-builder’s own LUKS partition description.

Use Anaconda’s storage path instead:

- Let Anaconda create a fresh GPT layout.
- Keep the EFI System Partition available to firmware.
- Use LUKS2 for the root storage containing `/var/home`.
- Leave no shared passphrase in the ISO or Kickstart.
- Have Anaconda prompt for the passphrase interactively.
- After the first successful boot, enroll TPM2 and a recovery key.

A fully unattended `bootc install to-disk --block-setup tpm2-luks` installation is not sufficient by itself. The current implementation creates a temporary passphrase and replaces it with a TPM enrollment, leaving no user recovery workflow. It is useful as a backend example, not as the complete SP+ user design.

#### Secure Boot

This is the strongest architecture if the final image retains Fedora’s stock kernel, GRUB, and shim unchanged. Apps, `/etc` files, systemd units, and user-space configuration do not require a new Microsoft-signed shim.

Do not add DKMS or unsigned kernel modules to the base image. NVIDIA and other out-of-tree drivers require a separate signed-module strategy.

#### Preinstallation

RPMs and system files are installed in the Containerfile. `/usr` content is part of the immutable image and changes atomically with the image update. `/etc` remains persistent mutable state with merge behavior. `/var` holds user data, logs, Flatpak installations, and application state.

This is a good match for:

- Brave native RPM plus managed policy.
- CUPS, NetworkManager, firmware, cryptsetup, fprintd.
- Static SP+ help/knowledge-base content.
- Systemd services for first boot, diagnostics, and update notifications.
- Desktop defaults and locked settings.

#### Updates and rollback

The update is one signed OCI image, rather than an independently solved set of RPM transactions on every endpoint. A release can contain:

- Fedora package updates.
- Browser updates.
- Policy changes.
- Support-tool updates.
- Desktop configuration changes.
- Kernel and initramfs updates.

`bootc upgrade` stages a new deployment; reboot activates it. The previous deployment remains available for rollback. This is materially better for low-disruption users than a long sequence of mutable package updates.

The limitation is that `/var` and user data do not roll back with `/usr`. A bad application migration can therefore survive an OS rollback. **[UNVERIFIED]** The product should make application state migration backward-compatible or keep application state outside the rollback-sensitive path.

#### CI and privilege

Building the OCI image is straightforward in GitHub Actions or a self-hosted runner. Producing an ISO is more demanding:

- Linux host.
- Podman/buildah.
- `osbuild-selinux` or equivalent SELinux policy.
- Loop-device access.
- Usually privileged container execution.
- Sufficient disk space.
- QEMU/KVM and OVMF for boot testing.
- A virtual TPM for TPM enrollment testing. **[UNVERIFIED]**

The image-builder README documents `--privileged`, `label=type:unconfined_t`, storage mounts, and an experimental `--in-vm` rootless mode using KVM.

#### Failure modes

The current image-builder source is not a sign that the public path is fully production-hardened. Its bootc ISO tests include skipped KVM boot-install tests. The current generic ISO documentation also warns that a bootc system installed through Anaconda may fail `systemd-remount-fs.service`.

This architecture is the best product fit, but it requires a real acceptance test before launch.

#### Assessment

**Best fit.** It gives SP+ the desired immutable root, atomic updates, rollback, reproducible image definition, and a standard container-registry delivery model. The cost is owning the Anaconda integration and testing a young bootc ISO path.

---

### 2. rpm-ostree / Silverblue-derived

#### Architecture

Fedora Silverblue and Kinoite are official image-based desktops:

- Silverblue is GNOME-based.
- Kinoite is KDE Plasma-based.
- The root filesystem is read-only.
- Flatpak is the primary GUI application mechanism.
- rpm-ostree provides image updates, rollback, package layering, and rebasing.

The official Atomic Desktop documentation says the experience is intended to feel like a normal Fedora desktop while keeping the operating system image-based.

A custom image could be derived from:

```text
quay.io/fedora-ostree-desktops/silverblue:44
quay.io/fedora-ostree-desktops/kinoite:44
```

or composed independently with rpm-ostree.

#### First-boot UX

Official Atomic Desktop ISOs already use the normal Fedora installation flow. Fedora documents automatic partitioning as recommended and warns that dual boot and manual partitioning are not fully functional.

Silverblue’s current first run asks for third-party repository choices, location services, and user creation. Kinoite uses its own first-run/welcome experience. Those are useful references but should not be assumed to survive unchanged in a custom image.

For SP+, Anaconda remains the safer place to handle:

- Disk selection.
- Encryption passphrase.
- User creation.
- Installer completion.

#### Encryption

The Anaconda encryption screen is mature relative to a custom bootc disk-image path. TPM2 enrollment and recovery-key display still need a target-machine first-boot mechanism.

Package-mode and rpm-ostree-derived systems do not eliminate the fundamental rule: a preseeded public image cannot contain a shared encryption passphrase.

#### Secure Boot

The official Atomic Desktop path already demonstrates Fedora’s signed boot artifacts. Third-party modules still require MOK or another signing path.

The RPM Fusion NVIDIA documentation specifically notes that OSTree systems require special handling for akmods and Secure Boot. That is a warning against treating package layering as a frictionless universal driver solution.

#### Preinstallation

System packages can be:

- Included in the composed image.
- Added by `rpm-ostree install` as a persistent layer.
- Installed as Flatpaks.

The official Atomic Desktop guide says:

- Flatpak is the primary GUI-app mechanism.
- Toolbx is primarily for command-line/development tools.
- Package layering is for system-level packages such as drivers and libvirt.

For a managed product, relying on endpoint package layering is undesirable because every machine can acquire a different support state. Build the supported package set into the image instead.

#### Updates and rollback

The official commands are:

```text
rpm-ostree upgrade
rpm-ostree rollback
rpm-ostree rebase fedora:fedora/44/x86_64/silverblue
```

Atomic Desktop documentation says updates are downloaded in the background and applied on reboot. It also says only one major release should be upgraded at a time; skipping major releases is not supported for all variants.

This is mature and well-documented. However, rpm-ostree’s own documentation says development focus has shifted to bootc, DNF, and the bootable-container ecosystem, while rpm-ostree remains widely used and supported.

#### Current state of Universal Blue

Universal Blue is not evidence that the old pure-ostree model is the future default. Its current project language is bootc-oriented, and uBlue’s current build files run `bootc container lint`. Bazzite still uses rpm-ostree commands and composes chunked OCI images, but its current CI also signs bootc-compatible images by digest.

The practical conclusion is:

- rpm-ostree remains a valid deployment technology.
- Official Fedora Atomic Desktops remain real and supported.
- New third-party image projects increasingly use OCI/bootc as the source and transport model.

#### Assessment

**Strong second architecture.** It has the most mature Fedora desktop precedent and a good installer, but its custom composition, update references, package layering, and future migration story are less unified than a bootc OCI source-of-truth model.

---

### 3. Classic Kickstart + Lorax / livemedia-creator / pungi

#### Architecture

This is the traditional Fedora route:

- Kickstart describes the installation.
- Anaconda performs the installation.
- Lorax creates boot media.
- `livemedia-creator` runs Anaconda, often under QEMU, to build a filesystem/disk image and then creates the ISO.
- Pungi orchestrates larger distribution composes.

Lorax documentation explicitly describes a two-stage process: install into a disk image, then construct boot media from that image.

This path is still technically usable. However, Fedora’s own image-definition infrastructure has moved. The old `fedora-kickstarts` repository is archived and says Fedora image definitions were migrated to KIWI.

#### First-boot UX

A classic live ISO normally behaves as:

1. Boot into a live desktop.
2. Click “Install.”
3. Run Anaconda.
4. Select disk and encryption.
5. Create user.
6. Reboot into the installed system.

This can be a good nontechnical experience, especially if the live desktop includes a large installer launcher and clear defaults.

Kickstart can automate everything, but every omitted command can cause Anaconda to prompt. A partially automated public installer is often worse than a deliberately interactive one.

Calamares can replace Anaconda as the GUI installer, but it is not a Fedora payload installer by itself. The distribution must provide the module configuration, storage integration, bootloader setup, and post-install logic.

#### Encryption

Anaconda’s LUKS2 workflow is the principal advantage of this path. A public Kickstart can set:

```text
autopart --encrypted --luks-version=luks2
```

while intentionally omitting `--passphrase`, causing Anaconda to ask the user.

A Kickstart containing a known passphrase is unacceptable. It creates a common key across every installed machine and may expose the key in the ISO, logs, or generated Kickstart.

TPM2 enrollment can be performed after installation with `systemd-cryptenroll`, but the same target-machine first-boot concerns apply.

#### Secure Boot

The path can reuse Fedora’s signed shim, GRUB, and kernel. Custom kernels and modules have exactly the same Secure Boot constraints as bootc.

#### Preinstallation

RPMs belong in `%packages`; system changes belong in `%post`; services can be enabled there. Flatpaks can be installed in `%post`, but this introduces network and remote-signing dependencies unless the Flatpak repository or content is included locally.

Configuration is easier to understand because `/usr` is mutable. It is also easier to drift:

- Local RPM changes can diverge from the composed image.
- Updates can overwrite files owned by RPMs.
- A failed package transaction can leave the system partially changed.
- There is no built-in whole-OS rollback equivalent to bootc/rpm-ostree.

#### Updates

`dnf-automatic` can download, install, and optionally reboot after updates. Its documentation exposes separate notify-only, download-only, and install timers.

That is operationally familiar but not atomic at the OS level. A bad update can affect the running system before the next reboot. Recovery requires package repair, snapshots, reinstall media, or a separately implemented filesystem snapshot system.

#### CI

Lorax’s documentation says:

- QEMU is needed for the normal virtualized `livemedia-creator` path.
- `--no-virt` runs Anaconda directly on the build host.
- `--no-virt` is most reliable when host and target releases match.
- A bug can operate on real host devices; it warns that the host could be damaged.

Therefore, use QEMU/KVM rather than `--no-virt` for production builds.

#### Assessment

**Good fallback, poor long-term product architecture.** It offers the strongest familiar installer and mature Anaconda encryption workflow, but lacks immutable system behavior, atomic updates, and low-risk rollback.

---

### 4. Golden-image capture

#### Architecture

A prototype is installed and configured by hand, then captured as:

- A raw disk image.
- A compressed filesystem.
- An ISO wrapping the image.
- A Clonezilla/Foxclone-style restore image.
- A `livemedia-creator --disk-image` input.

This is not a distribution build system. It is a snapshot of one machine’s state.

#### First-boot UX

A restore workflow can be very short, but it does not automatically become a safe public installer. It must know:

- The target disk.
- The target firmware mode.
- The target partition layout.
- Whether the disk is larger or smaller.
- Whether the target hardware has the same drivers.
- Whether machine identity and keys must be regenerated.

#### Encryption

Golden images are particularly dangerous for FDE:

- Capturing an unencrypted prototype produces an unencrypted restored system unless a second provisioning phase encrypts it.
- Capturing a LUKS-encrypted prototype duplicates the LUKS header and unlock material.
- A TPM enrollment from the prototype is tied to the prototype’s TPM, not the recipient’s TPM.
- A common passphrase or recovery key can affect every deployed machine.

A per-device secure provisioning stage could rekey each target, but that is no longer a simple golden-image restore system.

#### Secure Boot

The captured boot chain works only if its shim, GRUB, kernel, and modules are already acceptable to Secure Boot. Any hand-built boot component has the same signing problem as every other architecture.

#### Updates

There is no native update channel. Choices are:

- Replace the whole image.
- Run mutable DNF updates inside the restored system.
- Build a new capture and reinstall.
- Add a separate image-update mechanism.

All options require substantial additional work.

#### Reproducibility and maintenance

Hand configuration is not reproducible. It captures:

- Machine ID.
- Random seed.
- User account.
- SSH keys.
- Browser profile.
- Caches.
- Logs.
- Installer artifacts.
- Hardware-specific initramfs state.
- Potential credentials.

A golden image can be useful for a factory appliance with identical hardware and a controlled provisioning line. It is unsuitable as the public SP+ distribution source of truth.

#### Assessment

**Reject for SP+.** Use only as a disposable prototype or identical-hardware factory image.

---

### 5. KIWI NG, osbuild, and other production patterns

#### KIWI NG

KIWI is now directly relevant because Fedora’s current image definitions use it. The Fedora Forge `releng/kiwi-descriptions` repository provides:

- Live ISO profiles.
- OEM/disk profiles.
- Workstation, KDE, Xfce, and other desktop profiles.
- Anaconda live-install packages.
- Signed shim packages.
- Zuul/tmt CI.

The current Fedora definitions clear machine identity, remove the root password, set the graphical target, configure live sessions, and manage first-run behavior. This is a much better starting point for a new classic Fedora package-mode image than copying the obsolete Pagure kickstarts.

KIWI itself is an image builder, not a complete update-service design. A KIWI-produced mutable image still needs DNF update policy; a KIWI-produced bootc-compatible image still needs bootc integration.

#### osbuild/image-builder

osbuild is a useful lower-level image construction engine, and the current image-builder project supports bootc, disk images, cloud formats, and ISO generation. It is a good artifact builder but not the product’s update service. The source-of-truth should remain the versioned OCI image and its build inputs.

#### CoreOS Assembler / Fedora CoreOS

CoreOS Assembler and Ignition are production-grade for Fedora CoreOS-style systems, but the model is aimed at automatically configured servers and nodes rather than nontechnical graphical workstations. Fedora CoreOS’s auto-update, Ignition, and rollback model is informative; its desktop UX is not a suitable direct foundation.

#### Calamares

Calamares is useful when a distribution wants to own a highly customized installer UI. It should be treated as an installer frontend, not as an alternative to bootc, rpm-ostree, or DNF. For SP+, using Calamares would mean implementing and maintaining the bootc payload/storage integration that Anaconda already understands.

## FIRST-BOOT UX DESIGN

The target should be **one ISO per desktop**, not one ISO that asks users to choose KDE or GNOME. Publish:

```text
SP+-44-KDE-x86_64.iso
SP+-44-GNOME-x86_64.iso
```

### Before boot

1. The advisor downloads the ISO and its signed checksum.
2. The download page gives a single recommended USB-writing tool.
3. The writing tool verifies the image after writing.
4. The download page warns that the selected internal disk will be erased.

Fedora’s live-media documentation recommends Fedora Media Writer and explains that `dd` destroys the destination drive. The same operational warning applies to SP+.

### USB boot

1. Advisor inserts the USB stick.
2. Firmware boot menu selects the USB device.
3. Secure Boot remains enabled.
4. GRUB displays one prominent entry: **Install SP+ KDE** or **Install SP+ GNOME**.
5. A secondary troubleshooting entry can boot a basic hardware-test environment.

The ISO must be tested in both UEFI Secure Boot and ordinary UEFI modes. Legacy BIOS support should not be promised unless it is separately tested. **[UNVERIFIED]**

### Anaconda screens

The installer should preselect:

- English or detected locale.
- Keyboard layout.
- Timezone.
- DHCP.
- The embedded SP+ payload.
- The intended filesystem layout.
- Graphical installation.
- SELinux enabled in the installed system.
- Root account locked.

The user should explicitly complete:

1. **Installation destination**  
   Show the internal disk by model and capacity. Do not silently erase all disks.

2. **Encryption**  
   Explain that the disk passphrase protects the laptop when powered off. Ask for it twice. Do not reuse the login password by default.

3. **User account**  
   Ask for display name, username, and login password. Create one normal user. Do not create a shared default account.

4. **Install confirmation**  
   Restate the target disk and the fact that existing data will be destroyed.

5. **Reboot**  
   Tell the user to remove the USB stick when prompted.

The advisor should not be asked to configure repositories, choose a desktop environment, edit partitions, enter registry credentials, or use a terminal.

### First boot

The initial installed boot should have:

1. LUKS passphrase prompt.
2. Login screen for the account created by Anaconda.
3. A one-time SP+ setup wizard.

The wizard should:

- Confirm that the user saved the disk recovery key.
- Offer TPM2 automatic unlock.
- Detect whether a TPM2 device is present.
- Run a hardware baseline check.
- Confirm network connectivity.
- Display the support/help PWA.
- Explain that OS updates are downloaded automatically and applied after a controlled reboot.
- Show where the advisor can find the diagnostic assistant.

### Recovery-key flow

The privileged first-boot helper should:

1. Identify the LUKS2 device backing `/`.
2. Ask for the existing LUKS passphrase through a GUI-controlled privileged helper, not a shell command line.
3. Run `systemd-cryptenroll --recovery-key`.
4. Capture the generated key without writing it to the journal.
5. Display the key in large text and as a QR code.
6. Require the user to acknowledge that it was saved.
7. Offer printing or saving to an external removable device.
8. Only then enroll TPM2.
9. Verify that the passphrase, recovery key, and TPM key each unlock successfully.
10. Remove any temporary working files.

If a TPM is absent or enrollment fails, retain the normal LUKS passphrase and recovery key. Do not make TPM the only unlock method.

### TPM2 policy

Use an explicit PCR policy rather than relying on defaults. The current systemd documentation distinguishes:

- PCR 7: Secure Boot policy and firmware trust database state.
- PCR 11: kernel/UKI boot measurements.
- PCR 14: shim/MOK state.

A GRUB/BLS system and a systemd-boot/UKI system do not have identical measurement behavior. Do not bind production recovery solely to a brittle PCR set until the exact boot chain has been tested across kernel, shim, firmware, and major-release updates.

### GNOME and KDE setup agents

Do not make SP+ dependent on an unmodified `gnome-initial-setup`, `initial-setup`, or Plasma setup screen.

- `systemd-firstboot` is for basic system settings, not the complete graphical user journey.
- Anaconda’s `firstboot` option requires the Setup Agent package.
- Fedora Atomic desktops have variant-specific first-run behavior.

Use a small SP+ first-run service or application whose only job is machine-specific provisioning. Disable it after success.

### Success criteria

The installed machine passes only if:

- `mokutil --sb-state` reports Secure Boot enabled.
- The root filesystem is LUKS2.
- The user passphrase unlocks it.
- The recovery key unlocks it.
- TPM2 unlock works when enabled.
- `bootc status --format=json` reports a booted deployment.
- `bootc upgrade --check` can inspect the update channel.
- The next boot uses the expected image.
- `brave://policy` shows the managed policy.
- Network, audio, display scaling, suspend/resume, printing, and help tools work.
- A bad test deployment can be rolled back.

## ENCRYPTION AND SECURE BOOT

### LUKS2 design

The public ISO must never contain:

- A fixed LUKS passphrase.
- A fixed recovery key.
- A private TPM key.
- A private signing key.
- A machine-specific disk header.

Use per-device LUKS2 creation during Anaconda installation. Anaconda’s documented encryption options include LUKS2 selection, encryption passphrase entry, PBKDF settings, and escrow support.

A practical v1 arrangement is:

- Unencrypted EFI System Partition.
- Separate `/boot` if required by the selected bootc/Anaconda layout.
- LUKS2 root storage.
- `/var/home` inside the encrypted root.
- Swap either inside the encrypted volume or configured with an appropriate encrypted-swap mechanism.
- No separate unencrypted home partition.

The phrase “full-disk encryption” needs a written definition. Firmware needs access to an EFI System Partition, and the normal Fedora boot layout may leave boot metadata outside the LUKS data volume. If SP+ requires every non-firmware byte, including `/boot`, to be encrypted, that is a separate boot-chain design and is not established by the fetched bootc documentation. **[UNVERIFIED]**

### Passphrase timing

A passphrase can be enrolled at first boot only if the machine already has another unlock path. An encrypted root cannot boot to the first-boot wizard without one of:

- A user passphrase entered during installation.
- A temporary random passphrase carried securely from installation into first boot.
- A TPM/FIDO2/PKCS#11 unlock enrolled during installation.
- A secure external provisioning service.

`systemd-firstboot` does not solve this. It configures basic system settings and root credentials; it does not turn an unencrypted root filesystem into a securely bootable encrypted root.

The recommended workflow is therefore:

1. User enters the LUKS passphrase during Anaconda installation.
2. First boot generates and displays a recovery key.
3. First boot optionally enrolls TPM2.
4. The original passphrase remains as a fallback.

### Recovery key

The current systemd documentation says recovery keys are:

- Randomly generated.
- High entropy.
- Designed to be easier to type than arbitrary binary keys.
- Displayable as QR codes.
- Intended as a recovery method alongside a hardware token.

The recovery key must be shown once and stored by the user. Do not automatically copy it into:

- `/home`.
- `/var`.
- A support bundle.
- A cloud account.
- A screenshot directory.
- The system journal.

A support technician should be able to guide a user through recovery without receiving the key.

### TPM2 enrollment

`systemd-cryptenroll` enrolls a randomized LUKS unlock key into TPM2-protected metadata. The TPM seed and primary key remain in the TPM; the encrypted random key is stored in the LUKS2 header.

Use:

```text
systemd-cryptenroll \
  --tpm2-device=auto \
  --tpm2-pcrs=7 \
  /dev/...
```

only as an example. The exact PCR set must follow the selected boot chain and be tested through updates.

The current `systemd-cryptenroll` documentation says its `--tpm2-pcrs` default is empty when enrolling directly. The `crypttab` documentation describes a PCR 7 default in a different automatic-unlock situation. Always specify the intended PCR policy explicitly.

### Bootc’s built-in TPM shortcut

Current bootc supports:

```text
bootc install to-disk --block-setup tpm2-luks /dev/...
```

The implementation creates a temporary UUID-derived passphrase, formats LUKS, enrolls TPM2, and wipes all other key slots. That is attractive for an appliance that trusts its TPM completely, but unsuitable for SP+ unless extended to retain:

- User passphrase.
- Recovery key.
- TPM2 enrollment.

The current command is also a simple `to-disk` path. Anaconda remains preferable because it owns disk selection, user prompts, and the installer’s destructive-operation confirmation.

### Secure Boot chain

The recommended chain is:

```text
UEFI firmware
  -> Fedora-signed shim
      -> Fedora-signed GRUB
          -> Fedora-signed stock kernel
              -> initramfs
                  -> LUKS2 root
                      -> bootc deployment
```

Fedora’s Secure Boot documentation explicitly states that a Fedora Remix or Fedora-derived distribution can ship Fedora shim, GRUB, and kernel unchanged. This is the route SP+ should use.

Do not modify:

- `shimx64.efi`.
- GRUB EFI binaries.
- The kernel PE image.
- Fedora’s signed bootloader components.

A modified EFI binary needs a valid signature trusted by the firmware or shim. A Fedora RPM signature proves package provenance; it does not make an altered PE binary acceptable to Secure Boot.

### Kernel modules and MOK

Secure Boot lockdown rejects unsigned modules. The choices are:

1. Use only Fedora in-tree modules and stock kernel packages.
2. Sign third-party modules with a key enrolled as a MOK.
3. Build and maintain a custom signed boot chain.
4. Disable Secure Boot.

For SP+ v1, choose option 1 wherever possible.

MOK enrollment requires a physical reboot and user interaction with the firmware/shim enrollment screen. Fedora’s documented flow is:

- Generate/import a key.
- Reboot.
- Select **Enroll MOK**.
- Select **Continue** and **Yes**.
- Enter the enrollment password.
- Reboot again.

That is not a good default experience for older nontechnical users. Put NVIDIA and other out-of-tree drivers into a separately tested optional image or support path.

### Own shim

An SP+-signed shim would require:

- A reproducible build.
- A maintained shim source and patch set.
- SBAT data.
- Security contacts.
- Key protection.
- Microsoft signing.
- Long-term revocation and vulnerability response.

The current shim-review process is an engineering and organizational commitment, not a one-time binary download. Reusing Fedora’s already-signed chain avoids this burden.

### Container signing is separate

Cosign signatures protect the OCI image and its updates. Secure Boot protects the early EFI boot chain. Neither replaces the other.

The final system should therefore have:

- Fedora-signed shim/GRUB/kernel.
- Cosign-signed SP+ OCI images.
- A bootc/container policy requiring SP+ signatures.
- GPG-signed ISO checksum files.
- GPG-checked RPM repositories and metadata.
- Flatpak remote signature verification.

## PREINSTALL AND PRECONFIGURATION MECHANICS

| Component | Recommended mechanism | Persistence/update behavior |
|---|---|---|
| Fedora system packages | Install RPMs in the bootc Containerfile. | Included in `/usr`; replaced atomically by a new image. |
| Brave | Install Brave’s native Fedora RPM rather than the Flatpak for v1. | Brave recommends native packages over its Flatpak. Rebuild SP+ for controlled updates. |
| Brave policy | Place JSON policy in `/etc/brave/policies/managed/`. | Brave reads the directory automatically. On bootc, `/etc` is persistent and mutable; a local root change can override the image default. |
| Bitwarden | Use a signed, tested RPM or system Flatpak. | Exact official Linux packaging choice requires verification. **[UNVERIFIED]** |
| Flatpak remote | Put a `.flatpakrepo` in `/usr/share/flatpak/remotes.d/` or `/etc/flatpak/remotes.d/`. | Flatpak repository configuration is system-wide; `.flatpakrepo` includes repository details and its GPG key. |
| Preinstalled Flatpaks | Use `flatpak preinstall` definitions in `/usr/share/flatpak/preinstall.d/`. | Flatpak synchronizes preinstalled apps at startup; system-wide content lives under `/var/lib/flatpak`. |
| Offline Flatpaks | Embed the required Flatpak repository/content or use a sideload repository on the installation media. | Exact image-builder preservation and first-boot behavior must be tested. **[UNVERIFIED]** |
| Static help PWA | Put immutable HTML/CSS/JS in `/usr/share/spplus/help`; serve it through a local system service or launch it as a browser app. | Content updates with the OS image; writable state belongs in `/var/lib/spplus` or the user’s home. |
| Markdown knowledge base | Ship read-only baseline content under `/usr/share/spplus/knowledge`; copy user changes to `/var/home/<user>`. | Vendor content is versioned; user notes survive image updates. |
| Diagnostic assistant | Ship executable code/configuration in `/usr`; store only sanitized reports and local state in `/var`. | Do not transmit client data by default. |
| GNOME defaults | Use dconf keyfiles under `/etc/dconf/db/local.d/`, then run `dconf update`. | System defaults can be locked via `/etc/dconf/db/local.d/locks/`; user settings normally have higher precedence unless locked. |
| KDE defaults | Use system-level KDE configuration under the cascading `XDG_CONFIG_DIRS` paths. KDE supports immutable keys with `[$i]`. | User-level configuration can override defaults unless the relevant key/group/file is locked. |
| Systemd services | Install units under `/usr/lib/systemd/system`; enable them during the image build. | Unit definitions update with `/usr`; local overrides belong under `/etc/systemd/system`. |
| NetworkManager | Include NetworkManager and firmware; embed only generic defaults. Use keyfiles for genuinely static configuration. | Generic DHCP should be runtime behavior; machine-specific profiles belong in `/etc/NetworkManager/system-connections/`. |
| Desktop target | Set `graphical.target` and enable the selected display manager in the final image. | GNOME and KDE need separate images to avoid mixed desktop packages and support states. |
| Branding | Replace Fedora release/logos packages with generic or SP+ packages before release. | `/usr/lib/os-release` should identify SP+ while retaining Fedora ancestry through `ID_LIKE=fedora`. |

### Brave policy details

Brave’s current documentation states:

```text
/etc/brave/policies/managed/
```

and says JSON files in that directory use policy-name keys and values.

Example:

```json
{
  "IncognitoModeAvailability": 1
}
```

The policy directory is under `/etc`, so it is not immutable on bootc. That is acceptable against an ordinary user who lacks root, but it is not protection against a compromised or authorized administrator account. A stronger enforcement model would need separate privilege controls and possibly SELinux policy. **[UNVERIFIED]**

### Flatpak choice

Flatpak is attractive for GUI applications because it separates application payloads from the host and provides sandbox permissions. Flatpak’s default sandbox denies network, broad host filesystem, device, process, and unrestricted D-Bus access.

Those restrictions can conflict with:

- Password-manager integration.
- Browser-native keyring access.
- Printing.
- Smart cards.
- File-system access.
- Browser extensions.
- Hardware tokens.

Brave specifically warns that its Flatpak modifies Chromium sandboxing in ways not vetted by Brave or Chromium security teams. Use the native Brave RPM for the browser. Use Flatpak selectively for apps whose sandbox permissions have been reviewed.

### Configuration placement rule

Use this rule:

- **Immutable vendor content:** `/usr/share`, `/usr/lib`, `/usr/bin`.
- **Machine configuration:** `/etc`.
- **Machine/user state:** `/var`, `/var/home`.
- **Temporary diagnostics:** `/run` or `/var/tmp`.
- **Never:** secrets in `/usr`, container layers, ISO build logs, or public metadata.

## MAINTENANCE MODEL

### Ownership

SP+ must own the complete release process:

- Fedora base-image tracking.
- Package and dependency changes.
- Desktop integration.
- Brave and Bitwarden integration.
- Encryption and first-boot behavior.
- Secure Boot regression testing.
- ISO production.
- OCI signing.
- Release hosting.
- User support and rollback procedures.

Fedora does not maintain the SP+ image or guarantee the SP+ application set.

### Source control

Keep one source repository containing:

- Two final-image Containerfiles or one parameterized build.
- One shared configuration layer.
- GNOME-specific files.
- KDE-specific files.
- Installer Containerfile.
- `iso.yaml`.
- Interactive Kickstart/defaults.
- First-boot service and UI.
- Branding/release package.
- CI workflows.
- Hardware test definitions.
- SBOM and license inventory.
- Release notes.

Pin:

- Fedora base images by digest.
- Builder image by digest.
- Third-party container inputs by digest.
- Cosign action versions.
- Major build-tool versions.
- External repository keys.
- Any binary application inputs.

The Fedora bootc documentation specifically warns against floating DNF repositories and recommends image pinning for predictability.

### Release lanes

Use at least:

```text
testing  ->  pilot  ->  stable
```

Recommended flow:

1. Build after Fedora package/security changes.
2. Run static checks and `bootc container lint`.
3. Boot and install in QEMU.
4. Test encrypted installation with a virtual disk.
5. Test Secure Boot.
6. Test upgrade and rollback.
7. Test both desktops.
8. Test supported physical laptops.
9. Publish to a testing registry.
10. Canary a small pilot group.
11. Promote the exact digest to stable.
12. Build and sign the corresponding ISO.

Do not rebuild the ISO from a floating `:stable` tag after testing. Promote the exact tested digest.

### OCI image naming

Use immutable version tags plus human-friendly aliases:

```text
ghcr.io/secureprospective/spplus-kde:44.20260825.0
ghcr.io/secureprospective/spplus-kde:testing
ghcr.io/secureprospective/spplus-kde:stable
```

The client should ultimately install a digest or a controlled stable reference whose signature policy is scoped to the SP+ repository.

### User updates

The default bootc update timer is deliberately simplistic. Fedora’s documentation says that nontrivial deployments should replace it with management tooling that understands rollout, application state, and reboot coordination.

For SP+:

- Download in the background.
- Notify the user that an update is ready.
- Reboot only inside a maintenance window or after user confirmation.
- Never interrupt an active video call or browser session without warning.
- Keep the previous deployment.
- Provide a visible **Restart to finish update** action.
- If health checks fail after reboot, present a recovery action or automatically select the previous deployment. **[UNVERIFIED]** Automatic health-triggered rollback is not provided by the cited basic bootc timer and needs implementation/testing.

### Rollback

The low-level commands are:

```text
bootc status
bootc rollback
bootc rollback --apply
```

The user-facing support flow should not require the advisor to open a terminal. Provide:

- A recovery entry in the support UI.
- A documented keyboard route to the previous boot deployment.
- A support-assisted recovery process.
- A clear warning that user data under `/var/home` remains present.

### Flatpak and browser updates

Keep the update planes explicit:

1. OS image updates.
2. Flatpak application/runtime updates.
3. Brave security updates.
4. SP+ help/diagnostic content updates.

The safest support model is to rebuild the SP+ image for Brave and core application updates, while allowing Flatpak applications to update through their signed remote. Exact Brave updater behavior on bootc, especially where it writes its update payload, requires testing. **[UNVERIFIED]**

### Bootloader updates

Fedora bootc documentation currently says bootloader updates through `bootupd` are not automatic. It documents:

```text
bootupctl status
bootupctl update
systemctl enable bootloader-update.service
```

SP+ must monitor this explicitly. A Secure Boot image with stale bootloader components is not maintained merely because the root OCI image updates.

### Fedora major releases

F44 reaches scheduled EOL in June 2027. Do not wait until EOL.

Start the F44→F45 migration several months before the F45 stable release:

1. Build new images from Fedora 45.
2. Rebuild the installer with Fedora 45 Anaconda.
3. Re-test LUKS2 and TPM2 enrollment.
4. Re-test shim/GRUB/kernel signatures.
5. Re-test Brave and Bitwarden.
6. Re-test GNOME and KDE.
7. Re-test every certified laptop.
8. Test upgrade and rollback with `/etc` changes.
9. Publish F45 as a separate tested channel.
10. Migrate users deliberately.

Major-version changes can affect:

- Desktop package groups.
- Anaconda screens and Kickstart syntax.
- Kernel/initramfs paths.
- GRUB/shim placement.
- TPM PCR measurements.
- Browser packaging.
- Flatpak runtimes.
- Firmware and graphics behavior.
- SELinux policy.
- Network profile behavior.

The Fedora Atomic Desktop documentation recommends one major release at a time. Apply the same rule to SP+.

### Build reproducibility

For bootc:

- Pin base images by digest.
- Use deterministic source timestamps where possible.
- Avoid `dnf update` in the Containerfile.
- Install explicitly selected package sets.
- Preserve build manifests and SBOMs.
- Run `bootc container lint`.
- Keep the exact image digest associated with the ISO.

The bootc documentation warns that `dnf update` can produce non-predictable results and can mishandle kernel/bootloader updates. The Fedora base-image documentation also discusses timestamp drift and rechunking.

### CI requirements

A practical pipeline has two classes of runner:

- **Ordinary container runner:** builds and lints the OCI image.
- **Privileged image runner:** builds ISO/disk artifacts with loop devices, SELinux policy, and QEMU/KVM.

GitHub-hosted runners can run the first class. The second class may need a self-hosted Linux runner because of disk space, privileged access, KVM, and repeatable firmware testing. Exact GitHub-hosted runner support for SP+’s selected image-builder version is **[UNVERIFIED]**.

The current bootc documentation notes that bootc images can exhaust GitHub Actions disk space and recommends removing large unused tool directories. Bazzite demonstrates a real GitHub Actions model with disk cleanup, scheduled builds, image matrices, ISO generation, Cosign signing, and object-storage publication.

### Signing and delivery

#### RPM repositories

For every SP+ RPM repository:

```text
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://...
```

Use separate keys or at least separate operational roles for:

- RPM package signing.
- Repository metadata signing.
- ISO checksum signing.
- OCI image signing.
- Secure Boot module/shim signing.

DNF documents that `gpgcheck` verifies packages and `repo_gpgcheck` verifies repository metadata.

#### OCI images

Sign by digest:

```text
cosign sign \
  --key env://COSIGN_PRIVATE_KEY \
  --new-bundle-format=false \
  --use-signing-config=false \
  ghcr.io/secureprospective/spplus-kde@sha256:...
```

The legacy simple-signing flags are important because current uBlue documentation says bootc, rpm-ostree, and containers/image compatibility still requires them in its workflow.

Use a registry policy that rejects unsigned images by default and permits only the SP+ repositories. Test the policy with a deliberately unsigned image and a correctly signed image.

#### ISO

Publish:

```text
SP+-44-KDE-x86_64.iso
SP+-44-KDE-x86_64.iso-CHECKSUM
SP+-44-KDE-x86_64.iso-CHECKSUM.sig
```

Fedora’s current security page recommends verifying a signed checksum file with `gpgv` or `sq`, then running `sha256sum -c --ignore-missing`.

Cosign can also sign the ISO as a blob; Bazzite currently does this in its ISO workflow. A small organization should provide GPG verification first because it is easier for ordinary Linux users and support technicians.

#### Key operations

A realistic small-organization model is:

- Offline GPG release key with an online signing subkey for checksum files.
- Cosign key stored in a KMS or protected CI secret.
- Public keys published in the repository and release site.
- Key fingerprints included in release documentation.
- Key rotation procedure tested before launch.
- No private key in the ISO, OCI image, Git repository, or GitHub artifact.

Exact KMS pricing and registry egress cost are **[UNVERIFIED]**. The cost shape is clear: initial ISO downloads are large, while OCI updates benefit from layer reuse; registry and object-storage egress will dominate as the fleet grows.

## HARDWARE MATRIX AND GAPS

| Hardware area | Expected position | Gaps and required action |
|---|---|---|
| Dell Latitude, HP EliteBook/ProBook, Lenovo ThinkPad with Intel iGPU | Strong first certification target. Linux kernel documentation lists broad i915 support, and Intel’s iwlwifi documentation lists AX200/201/210/211 and Wi-Fi 7 BE200/BE201/BE202 support. | Exact model BIOS, display, suspend, webcam, fingerprint, and Wi-Fi revisions still require physical testing. **[UNVERIFIED]** |
| AMD Ryzen business laptops | Strong candidate with stock AMDGPU and Mesa. The kernel AMDGPU documentation covers GCN, RDNA, and CDNA families. | Exact firmware, suspend, docking, display, and Wi-Fi combinations require testing. **[UNVERIFIED]** |
| Recent Intel Wi-Fi | Generally the best target. Intel driver and firmware support is integrated into the Fedora kernel/firmware stack. | Confirm firmware is present in both installer and installed image. Test resume, roaming, WPA2/WPA3, and captive portals. |
| Qualcomm/Atheros Wi-Fi | ath11k documents QCA6390, WCN6855, QCA206x, QCA6698AQ, and related hardware; ath12k documents QCN9274 and WCN7850. | Firmware board files and exact OEM calibration can matter. Test each SKU rather than assuming family-level support. |
| MediaTek Wi-Fi | Fedora’s F44 firmware changelog includes MT7922 and MT7925 updates. | Exact kernel/firmware pairing and Bluetooth coexistence need testing. **[UNVERIFIED]** |
| Realtek Wi-Fi | Fedora firmware includes Realtek-related updates and Linux Wireless documents several in-tree drivers. | Consumer OEMs use many revisions. Avoid promising every Realtek device. **[UNVERIFIED]** |
| Broadcom Wi-Fi | Some Broadcom hardware works with in-tree `brcmfmac`, `brcmsmac`, or `b43`; Linux Wireless documents that firmware is required separately. | Older b43 devices, unsupported chips, missing NVRAM, or proprietary Broadcom-WL requirements remain gaps. `linux-firmware` does not guarantee every Broadcom SKU. |
| `linux-firmware` | Covers many Intel, AMD, Qualcomm/Atheros, MediaTek, Realtek, audio, GPU, and other device firmware files. The F44 package has updates explicitly mentioning Dell, Lenovo, HP, Intel, AMD, Qualcomm, and MediaTek hardware. | Firmware is not a kernel driver, not a user-space graphics stack, and not a guarantee of working suspend or OEM ACPI behavior. |
| Fingerprint readers | Fedora provides `fprintd` and `libfprint`; many Synaptics, ELAN, Goodix, FPC, Realtek, Validity, and other IDs appear on the development support list. | The upstream list warns it may describe development drivers unavailable in stable releases. Make fingerprint support optional; never require it for login or disk recovery. |
| Suspend/S0ix | The Linux kernel supports suspend-to-idle when configured and provides multiple sleep states. | S0ix behavior is firmware, driver, and model-specific. Test lid close/open, sleep battery drain, external displays, Wi-Fi resume, Bluetooth, audio, and encrypted reboot. |
| HiDPI and fractional scaling | GNOME and KDE are appropriate desktop candidates. | Exact scaling quality on mixed-DPI multi-monitor and older Intel hardware is **[UNVERIFIED]**. Test both desktops separately. |
| Printers | CUPS supports driverless IPP Everywhere/AirPrint and legacy PPD/Printer Application paths. | Test network discovery, USB printers, scanners, PDF printing, and printers requiring vendor drivers. |
| NVIDIA | Fedora’s standard open-source stack may cover some hardware; proprietary RPM Fusion akmods are available. | RPM Fusion states Secure Boot requires signing the NVIDIA kmod or disabling Secure Boot and warns an unsigned driver can result in a blank screen. Immutable images require prebuilt, kernel-matched, signed modules or a separate image. |
| Consumer Dell/HP/Lenovo | Some will work because they share Intel/AMD/Wi-Fi components with business systems. | Do not advertise universal support. Firmware bugs, Broadcom Wi-Fi, NVIDIA Optimus, unusual storage controllers, and fingerprint hardware create model-specific exceptions. **[UNVERIFIED]** |
| Recent Intel/AMD laptops | Stock Fedora kernel and firmware are a sensible baseline. | Secure Boot, TPM2, modern standby, USB-C docks, OEM firmware updates, and audio amplifiers must be tested per model. **[UNVERIFIED]** |
| Immutable driver effect | In-tree drivers and firmware can be baked into the image. | DKMS, NVIDIA akmods, Broadcom-WL, DisplayLink, OpenRazer, and vendor security modules are harder because runtime DNF is unavailable and modules must match/sign against the image kernel. |

### Hardware policy

Ship a certified list, not a vague “works on most laptops” promise.

Start with:

- Two Dell Latitude models.
- Two HP EliteBook/ProBook models.
- Two Lenovo ThinkPad models.
- One AMD business laptop.
- One recent Intel Wi-Fi 7 laptop.
- One older supported Intel laptop.

Reject a model from certification if any of these are unreliable:

- Cold boot networking.
- LUKS unlock.
- Suspend/resume.
- External display.
- Audio/video call.
- Printing.
- Firmware update.
- Recovery-key unlock.

## ANTI-PATTERNS

1. **Building a container and renaming it `.iso`.**  
   An OCI bootc image is not bootable installation media. It needs a kernel, initramfs, EFI bootloader, ISO tree, and installer path.

2. **Using the default `qcow2` image type when an ISO is required.**  
   The current image-builder default is a disk image, not a public USB installer.

3. **Using the archived `anaconda-iso` path without checking the current CLI.**  
   Current image-builder documentation recommends `bootc-generic-iso`; the new CLI rejects `anaconda-iso` in some bootc modes.

4. **Omitting Anaconda from the installer container.**  
   The generic ISO contract expects Anaconda and its install/runtime dependencies. Missing them can produce an ISO that boots a kernel but has no working installer.

5. **Omitting `initramfs.img` beside the kernel.**  
   The current generic ISO documentation explicitly requires it.

6. **Omitting or misplacing shim/GRUB files.**  
   The ISO builder expects specific EFI vendor directories and file names. A visually complete ISO can fail before Anaconda starts.

7. **Using the wrong ISO label in `inst.stage2=hd:LABEL=...`.**  
   GRUB can boot the kernel but Anaconda cannot find its stage-2 runtime if the label and kernel argument differ.

8. **Failing to set a Fedora bootc root filesystem type.**  
   Fedora bootc images may not define a default root filesystem. Current documentation says to provide `--rootfs`, such as `ext4`, when required.

9. **Failing to embed or correctly reference the target payload.**  
   The installer may boot successfully and then fail when it cannot find the bootc payload or registry.

10. **Leaving the default bootc image userless.**  
    Fedora bootc base images do not contain a default interactive user. The installed result can boot successfully but have no usable login.

11. **Preseeding one encryption passphrase in Kickstart.**  
    Every machine receives the same key. The key may also be visible in the ISO, Git history, logs, or generated Kickstart.

12. **Assuming `systemd-firstboot` creates encrypted storage.**  
    It initializes basic system settings and root credentials; it is not a complete LUKS provisioning workflow.

13. **Using bootc’s TPM2-LUKS shortcut as the complete recovery design.**  
    The current implementation replaces temporary passphrase slots with TPM enrollment. It does not automatically give SP+ a user passphrase and recovery-key workflow.

14. **Trying to enroll a target TPM during image build.**  
    A build runner’s TPM is not the advisor’s TPM. TPM enrollment must happen on the target device.

15. **Generating a recovery key and writing it to `/var`.**  
    That leaves a plaintext unlock credential on the disk. Display it, obtain acknowledgement, and remove transient copies.

16. **Relying on TPM2 without a fallback.**  
    Firmware changes, PCR changes, TPM resets, motherboard replacement, or TPM failure can make automatic unlock unavailable. Retain a passphrase and recovery key.

17. **Using a custom kernel under Secure Boot without signing it.**  
    Fedora’s Secure Boot documentation says customized boot packages require signing. Firmware or shim will reject the chain.

18. **Installing NVIDIA akmods without a tested MOK/signing flow.**  
    RPM Fusion explicitly warns that an unsigned NVIDIA kmod can disable the driver and produce a blank screen.

19. **Assuming a Fedora-signed shim signs SP+ binaries.**  
    Fedora’s signature authenticates the Fedora shim itself. It does not authenticate arbitrary modified shim, GRUB, kernel, or module binaries.

20. **Treating Cosign as Secure Boot signing.**  
    Cosign signs OCI artifacts. It does not make an EFI binary trusted by firmware.

21. **Using `selinux=0` as a permanent product workaround.**  
    The bootc ISO examples use installer-specific workarounds, but SP+ should retain SELinux enforcing in the installed system.

22. **Running `dnf update` inside every bootc Containerfile.**  
    Fedora bootc documentation warns this harms reproducibility and can mishandle kernel and bootloader updates.

23. **Running `dnf install` on the deployed immutable root.**  
    It normally fails because `/usr` is read-only. Rebuild the image or use a deliberate rpm-ostree layer.

24. **Writing vendor content into `/var` and expecting later image updates to replace it.**  
    Bootc treats `/var` as persistent machine state. Put versioned vendor content under `/usr`.

25. **Installing managed Brave policy only in a user profile.**  
    It is not a machine policy and can disappear when the user profile is reset.

26. **Installing Flatpaks with broad permissions without review.**  
    Flatpak sandbox permissions can expose home files, network, printing, smart cards, or devices. Review every permission.

27. **Assuming the Flatpak and native Brave packages are equivalent.**  
    Brave currently recommends its native Fedora package and warns about the Flatpak sandbox differences.

28. **Failing to configure network behavior in the installer.**  
    A remote payload, remote Kickstart, or external repository requires installer networking. F44’s Anaconda behavior changed which network profiles are created; explicitly test both installer and installed-system networking.

29. **Assuming `linux-firmware` supplies a driver.**  
    Firmware files do not replace a missing kernel driver, user-space graphics stack, or vendor-specific utility.

30. **Using `livemedia-creator --no-virt` on a valuable build host.**  
    Lorax warns that direct Anaconda operation can interact with real host devices and may damage the host.

31. **Declaring success because an ISO file exists.**  
    Current bootc-image-builder ISO boot tests include skipped cases. Boot the ISO, install it, boot the installed system, update it, and roll it back.

32. **Ignoring the current `systemd-remount-fs.service` bootc warning.**  
    The generic ISO documentation warns that a bootc system installed through Anaconda can fail this service.

33. **Capturing a configured prototype as the product image.**  
    Machine IDs, user accounts, browser state, random seeds, SSH keys, logs, and disk keys can leak into every deployment.

34. **Publishing only an unsigned SHA256 file.**  
    An unsigned checksum detects accidental corruption but does not authenticate the checksum source. Sign the checksum file.

35. **Using a floating `:latest` or `:stable` tag during release promotion.**  
    The tested digest and the released digest can differ. Promote the exact digest.

36. **Building one image containing both KDE and GNOME.**  
    This increases size, package conflicts, display-manager ambiguity, and support-state permutations. Build separate variants.

37. **Leaving Fedora release identity and logos in a modified public remix.**  
    This creates trademark and user-confusion problems. Replace the release and logo packages before redistribution.

## LEGAL AND BRANDING

Fedora’s current trademark guidelines distinguish unmodified Fedora materials, official Spins, and modified downstream work.

### SP+ should be a Fedora Remix, not an unofficial Fedora Spin

A Fedora Spin is part of Fedora’s official release process. The current Fedora documentation requires, among other things:

- Fedora account and contributor agreement.
- A Self-Contained Change proposal.
- Release Engineering coordination.
- Website and design coordination.
- Media Writer coordination.
- Ongoing maintainer response.

SP+ should not call itself a Fedora Spin unless it goes through that process.

Because SP+ modifies Fedora and adds non-Fedora software, the practical legal category is a downstream Fedora Remix. The Fedora trademark guidelines permit downstream distributors to use the Fedora Remix word mark if they:

- Clearly state that users receive modified Fedora materials.
- Explain where unmodified Fedora materials are available.
- Feature their own name and brand more prominently.
- Do not imply Fedora or Red Hat sponsorship, endorsement, or support.
- Follow Fedora brand standards.

### Packages to remove or replace

Fedora’s trademark guidance says modified combinations must remove:

- `fedora-logos`
- `fedora-release`
- `fedora-release-notes`

Fedora’s package sources confirm:

- `fedora-logos` contains Fedora marks and can be used in an official Fedora Spin but not a Fedora Remix.
- `generic-logos` is the replacement package and conflicts with `fedora-logos`.
- `generic-release` identifies the system as `ID=generic`, `ID_LIKE=fedora`, and conflicts with `fedora-release`.

Fedora’s bootc documentation gives the replacement pattern:

```text
dnf -y swap fedora-release generic-release --allowerasing
```

SP+ should also:

- Replace `/usr/lib/os-release` branding with SP+ identity.
- Replace Fedora wallpapers, boot splash, installer text, desktop menu names, release notes, and support URLs.
- Audit EFI/GRUB menus and Plymouth themes.
- Remove Fedora trademark artwork from the product UI.
- Retain accurate attribution that the system is derived from Fedora.
- Avoid using Fedora’s visual trade dress as SP+ branding.

Whether an unchanged Fedora-signed shim containing Fedora vendor metadata requires additional trademark permission in this specific modified image is a legal interpretation not resolved by the fetched sources. **[UNVERIFIED]** Ask Fedora Council/legal before public release.

### Required notices

The current guidelines require prominent notices that:

- SP+ contains modified Fedora materials.
- SP+ is not provided or supported by Fedora or Red Hat.
- Official Fedora materials are available from the Fedora Project.

Use the Fedora trademark attribution statement required by the guidelines on the website, packaging, and release materials.

Brave, Bitwarden, Google Workspace, Microsoft 365, Zoom, carrier portals, and other third-party names/logos have separate trademark and redistribution rules. SP+ must not imply endorsement by those vendors. **[UNVERIFIED]**

## OPEN QUESTIONS AND DISAGREEMENTS

1. **Exact F44 bootc/Anaconda/LUKS result — [UNVERIFIED].**  
   Current Anaconda source handles bootc and LUKS kernel arguments, but the fetched sources do not prove that the exact Fedora 44 package set works end-to-end with the current generic ISO builder.

2. **Generic ISO payload transport — [UNVERIFIED].**  
   The builder embeds payload content in local container storage, while the current example Kickstart uses a registry transport. Confirm the correct `containers-storage:` or equivalent reference in the exact installer build.

3. **Current generic ISO production maturity — [UNVERIFIED].**  
   The current image-builder repository contains skipped boot-install tests. A reasonable engineer may reject the path for initial public launch until those tests are enabled and passing.

4. **`systemd-remount-fs.service` warning.**  
   This is explicitly documented by image-builder and must be reproduced and resolved or accepted with a tested workaround before release.

5. **TPM PCR policy — [UNVERIFIED].**  
   PCR 7 alone, PCR 7 plus PCR 11, or a signed PCR policy may be appropriate depending on whether SP+ uses GRUB/BLS or UKIs. The correct choice must be tested through kernel, bootloader, firmware, MOK, and Fedora major-version updates.

6. **“Full-disk encryption” definition — [UNVERIFIED].**  
   Confirm whether SP+ means encrypted user/root data or literally every disk sector outside firmware-required areas. The standard Fedora UEFI layout does not establish the latter.

7. **First-boot recovery-key UI — [UNVERIFIED].**  
   No fetched source provides a complete graphical workflow that generates, displays, confirms, and securely discards a recovery key. SP+ must implement and test this.

8. **Initial-setup packages in F44 — [UNVERIFIED].**  
   Pykickstart documents `initial-setup`, but the fetched sources do not establish whether SP+’s exact F44 GNOME/KDE image should use it.

9. **Brave updater behavior on bootc — [UNVERIFIED].**  
   Brave’s native RPM is recommended, but the fetched sources do not establish whether its updater writes safely into SP+’s immutable/persistent filesystem model. Decide whether SP+ rebuilds Brave or permits Brave’s updater.

10. **Bitwarden distribution format — [UNVERIFIED].**  
    Bitwarden confirms Linux desktop availability, but the fetched source does not establish the preferred signed RPM, Flatpak, or other format for SP+.

11. **Hardware certification scope — [UNVERIFIED].**  
    Driver-family documentation cannot substitute for testing exact Dell, HP, Lenovo, consumer, Wi-Fi, fingerprint, NVIDIA, suspend, and dock combinations.

12. **Fedora compose documentation disagreement.**  
    Fedora release documentation still describes maintaining Spins through Kickstart files, while the current Fedora Forge repositories say Fedora image definitions migrated to KIWI. Treat the Forge KIWI repository as the current implementation reference, but confirm the intended Release Engineering path before adopting official Fedora infrastructure.

13. **Calamares versus Anaconda.**  
    An engineer may reasonably prefer Calamares for a polished nontechnical UI. The tradeoff is owning custom bootc payload, storage, encryption, bootloader, and post-install modules. Anaconda is less visually controllable but already understands Fedora and bootc.

14. **Silverblue/Kinoite versus raw Fedora bootc.**  
    Starting from official Atomic Desktop images offers stronger desktop precedent. Starting from `fedora-bootc:44` gives a cleaner OCI source-of-truth and fewer inherited desktop assumptions. Both require a real build/install test.

15. **Cosign format compatibility — [UNVERIFIED].**  
    Universal Blue currently uses legacy simple-signing Cosign output because of bootc/rpm-ostree compatibility. Confirm the exact Fedora 44 `containers/image`, bootc, and Cosign versions before enforcing the policy.

16. **Registry and object-storage economics — [UNVERIFIED].**  
    Exact Quay, GHCR, CDN, and object-storage pricing, quota, and acceptable-use terms were not verified. Model costs from actual ISO downloads and OCI layer egress before opening distribution broadly.
