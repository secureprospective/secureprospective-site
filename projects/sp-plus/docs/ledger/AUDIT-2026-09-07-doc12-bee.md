Audit complete. No files were modified.

## A. Section 0 factual verification

External sources were checked on 2026-09-07. Statuses are exactly `VERIFIED`, `WRONG`, or `UNVERIFIABLE`.

| Row | Claim | Observation | Status |
|---|---|---|---|
| 15 | Calamares `3.3.14-1` is the Trixie version; newer `3.4.2-1.1` exists elsewhere. | Trixie contains `3.3.14-1`; `3.4.2-1.1` was observed in newer suites. [Debian package API](https://sources.debian.org/api/src/calamares/) | **VERIFIED** |
| 16 | live-build is `1:20250505+deb13u1` in Trixie; `1:20250814` is newer. | Both values were observed in Debian package metadata. [API](https://sources.debian.org/api/src/live-build/) | **VERIFIED** |
| 17 | Timeshift is `24.06.6-2` in Trixie; `25.12.4-1` is newer. | Both values were observed. [API](https://sources.debian.org/api/src/timeshift/) | **VERIFIED** |
| 18 | Cinnamon is `6.4.10-2` in Trixie; `6.4.10-2+deb13u1` is proposed and `6.6.9-2` is newer elsewhere. | All three values were observed. [API](https://sources.debian.org/api/src/cinnamon/) | **VERIFIED** |
| 19 | Node.js is `20.19.2+dfsg-1+deb13u2`; Node 22 is not available in Trixie/backports. | Trixie exposes Node 20; no matching Node 22 or `trixie-backports` entry was found. The Pi package requires Node `>=22.19.0`. [Node package API](https://sources.debian.org/api/src/nodejs/) · [npm metadata](https://registry.npmjs.org/@earendil-works%2fpi-coding-agent/0.85.1) | **VERIFIED** |
| 20 | `grub-btrfs` is absent from Debian Sources. | `https://sources.debian.org/api/src/grub-btrfs/` returns HTTP 404. This establishes absence from that Debian Sources index, not absence from every external repository. | **VERIFIED** |
| 21 | Trixie’s stock Calamares configuration defaults to Btrfs `@rootfs`, `@home`, `@cache`, and `@log`. | Upstream Calamares examples use different names, while Debian’s packaged `mount.conf` does not define those Btrfs subvolumes. The source field is URL-less and only says “recorded 2026-09-07.” | **WRONG** |
| 22 | Calamares defaults to LUKS1 with encrypted `/boot`. | Upstream defaults are `luksGeneration: luks1` and `defaultFileSystemType: ext4`; no default `@rootfs` layout or separate encrypted `/boot` was observed. [Calamares partition configuration](https://sources.debian.org/src/calamares/3.3.14-1/src/modules/partition/partition.conf/) | **WRONG** |
| 23 | Debian’s Calamares settings package is an example for derivatives and contains the relevant module layout; license is ISC. | The package describes itself as a derivative-oriented settings package and its copyright data includes ISC material. It is not a complete SP+ implementation and does not provide the proposed partition configuration. [Package](https://packages.debian.org/trixie/calamares-settings-debian) · [Copyright](https://sources.debian.org/data/main/c/calamares-settings-debian/13.0.13-1/debian/copyright) | **VERIFIED** with scope caveat |
| 24 | TPM2 unlock requires `dracut`; `initramfs-tools` is insufficient. | `systemd-cryptenroll` supports TPM2 and recovery keys, and `dracut` exists, but the checked Trixie evidence does not establish that `dracut` is required or that the Debian initramfs path cannot support the target design. Bug #1031254 records TPM-related failures but does not prove the universal claim. [systemd-cryptenroll](https://www.freedesktop.org/software/systemd/man/latest/systemd-cryptenroll.html) · [Bug #1031254](https://bugs.debian.org/1031254) · [dracut](https://packages.debian.org/trixie/dracut) | **UNVERIFIABLE** |
| 25 | Trixie full support ends around June 2028 and EOL is around August 2028. | Debian lists full support through 2028-08-09 and LTS through 2030-06-30. [Debian releases](https://www.debian.org/releases/) | **WRONG** |
| 26 | The Fedora lane is already Beelink-built and there is no tracked CI workflow. | No tracked `.github/` files or workflow files were found locally. That does not prove there is no external CI or other pipeline. | **UNVERIFIABLE** |

Rows 21–26 are all effectively URL-less “recorded 2026-09-07” claims. Section 0’s statement that every row has a source therefore does not hold.

## B. Internal coherence and feasibility

- **DN-30 is not reused verbatim.** Doc 12 lines 215–224 and 552–553 describe weekly staging and a conditional Sunday reboot. [`DN-30`](../projects/sp-plus/docs/ledger/DN-30-UPDATE-POLICY.md) specifies every other Friday, ISO-week parity, and a Sunday reboot two days later. Doc 12 must distinguish the Debian policy from the Fedora/bootc decision rather than call it a reuse.

- **Q15 is the wrong question for the Debian lane.** Doc 6 lines 223–255 identify Q15 as Fedora PCR policy. Doc 12 lines 460 and 517–523 use Q15 while discussing Debian TPM2/initramfs work. Debian’s unresolved question is Q16, not Q15.

- **TPM2 is presented as both open and settled.** Q16 remains unresolved in Doc 6, while Doc 12’s Phase B treats “dracut required” as an implementation premise. The initramfs, crypttab, kernel-command-line, recovery-key, and measured-boot path need one tested target design.

- **Stock Calamares does not implement the proposed storage design.** The plan assumes LUKS2, Btrfs subvolumes, and the SP+ mount model, while the checked defaults are LUKS1/ext4. Debian’s packaged settings do not supply the required partition configuration. This is implementation work, not a configuration fact.

- **The image/package boundary is undefined.** Doc 11 says the target must be package-derived rather than a captured disk image. Doc 12 then relies on `unpackfs`, whose normal operation copies a squashfs filesystem. A reproducibly package-built squashfs may be acceptable, but the documents do not define that distinction or the proof required.

- **Timeshift compatibility is overstated.** The Trixie Timeshift README documents Btrfs support around Ubuntu-style `@` and `@home` layouts and excludes user files from snapshot handling. It does not establish support for `@rootfs`, `@cache`, `@log`, separate `/boot`, or the proposed recovery workflow. [Trixie Timeshift README](https://sources.debian.org/data/main/t/timeshift/24.06.6-2/README.md)

- **Timeshift is not explicitly installed.** Doc 12 names Timeshift as required, but the shown package inputs and Debian Calamares settings do not demonstrate that it is included in the final target. “Required” and “present” are currently separate claims.

- **Recovery-key wording is ambiguous.** The documents alternate between “recovery key,” “rescue key,” “printed,” and “never stored on disk.” A LUKS2 recovery credential is normally an enrolled keyslot; “not stored on disk” must mean that the plaintext/exported credential is not retained, not that the enrolled keyslot does not exist. The first-login enrollment timing also conflicts with any Gate A claim that recovery is already operational before first login.

- **Secure Boot package presence is not target-chain proof.** live-build can place signed GRUB/shim packages on UEFI media, but the plan does not establish that the installed target uses the signed chain, preserves Secure Boot variables, and boots after Calamares installation. The value `grub-efi` is also not enough to identify Debian’s signed-shim path.

- **APT pinning is treated as authentication.** Pinning selects package candidates; it does not authenticate the repository or constrain which signing key is trusted. The documents leave `Signed-By`, repository origin, priority values, key bootstrap, rotation, revocation, and compromise handling unresolved. [APT sources documentation](https://manpages.debian.org/trixie/apt/sources.list.5.en.html) · [APT preferences](https://manpages.debian.org/trixie/apt/apt_preferences.5.en.html)

- **D20 and D35 conflict in ownership.** Doc 6 makes CI and reproducible artifacts a non-reversible decision, while later text permits Beelink builds as an exception. The documents do not say whether Beelink is only a bootstrap builder, whether it is an authorized release signer, or when CI becomes mandatory.

- **The Node package cannot honestly be architecture-independent if it embeds one binary.** Debian’s Node 20 package does not satisfy the npm requirement. Official Node distributions provide separate `linux-x64` and `linux-arm64` artifacts. [Node v22.19.0 artifacts](https://nodejs.org/dist/v22.19.0/) An `Architecture: all` SP+ package must either contain multiple architecture-selected payloads, depend on an architecture-specific package, vendor a compatible version, or choose another supported agent version.

- **Gate C is less stringent than the requirements it is supposed to prove.** Doc 11 requires disk-pressure behavior, snapshot headroom, and the distinction between “no snapshot” and “snapshot exists but restore failed.” Doc 12’s Phase C gate does not explicitly exercise all three.

- **Gate D does not match the stated hardware scope.** The plan names HP systems and a broader hardware matrix, but the actual named acceptance machine is a Dell. No exact HP model/chipset matrix is supplied.

- **Release terminology is mixed.** “R2,” “ISO,” “repository,” “external machine,” and `RELEASES.md` are used across different release paths without defining which artifact is being promoted, signed, tested, or rolled back.

## C. Seams and unclear transitions

- Section 0 alternates between evidence, design decisions, and implementation assumptions without labeling the transitions. The incorrect Calamares rows are then reused as premises in later sections.

- The high-level architecture in lines 33–66 is repeated rather than connected to concrete Calamares files, package manifests, initramfs configuration, and release artifacts.

- The supply-chain section appears before the threat model and before the repository trust model is defined. It names tools but not the protected assets or trust roots.

- Recovery is spread across the architecture summary, Phase A, Phase C, and the support section. “Permanent restore,” “rescue,” and “recovery key” are not consistently separated.

- The snapshot section does not clearly separate root rollback, user-data preservation, `/boot` handling, and TPM enrollment persistence.

- The phase table compresses acceptance criteria into phrases such as “firmware path,” “unattended-by-config,” and “rollback proof” without defining the evidence artifact for each.

- The final support section repeats lifecycle and package facts but does not distinguish Debian release support, SP+ repository support, ISO refresh support, and hardware support.

- `RELEASES.md` is path-sensitive: the repository file is under `projects/sp-plus/docs/ledger/RELEASES.md`. The unqualified reference is ambiguous to an implementer.

- The documents do not cleanly distinguish Debian’s package-provider policy from the desired user-facing application set. `power-profiles-daemon` is provided by `tuned-ppd`, and Cinnamon task packages can pull broad recommendations; the exact final package closure is not shown.

## D. Decisions or gates that remain unowned

- **Storage contract:** choose and test the exact Calamares partition/encryption configuration: LUKS version, Btrfs subvolume names, separate `/boot` behavior, mount ordering, discard policy, and whether the design is compatible with Timeshift.

- **TPM2 contract:** choose the initramfs implementation and prove unlock, fallback recovery-key unlock, re-enrollment, kernel update behavior, and failure behavior on a clean installed target.

- **Recovery lifecycle:** define when the key is generated, where the only user-readable copy exists, what “not stored on disk” means, how a lost key is replaced, and how recovery works before first login.

- **Secure Boot:** identify the exact signed package chain for the installed target and require a post-install Secure Boot boot test, not merely signed live-media package presence.

- **Firmware policy:** define whether firmware is required in the live installer, target, or both; list the accepted packages; and test offline installation with no WLAN firmware loaded.

- **APT trust and pinning:** define repository origin, `Signed-By` key bootstrap, pin priorities, key rotation/revocation, package naming, and behavior when the SP+ repository is unreachable.

- **Architecture:** decide whether the Pi agent is vendored, downgraded to a Node-20-compatible version, split into architecture-specific packages, or removed from the base image.

- **CI authority:** decide whether Beelink may produce release artifacts or only development builds. Define signed artifact provenance, reproducibility evidence, and promotion authority.

- **Snapshot acceptance:** require a matrix covering extra subvolumes, `/home`, `/boot`, TPM state, failed restores, absent snapshots, and disk-pressure conditions.

- **Hardware matrix:** name exact HP models and installed WiFi/audio/Bluetooth/storage hardware, then map each to kernel and firmware packages.

## E. Firmware and hardware findings

External package observations below were checked on 2026-09-07.

| Hardware family | Relevant Debian Trixie package(s) | Finding |
|---|---|---|
| Intel WiFi | [`firmware-iwlwifi`](https://packages.debian.org/trixie/firmware-iwlwifi), observed `20250410-2` | Appropriate for Intel wireless families covered by the package; exact HP model coverage is not established. |
| Realtek WiFi | [`firmware-realtek`](https://packages.debian.org/trixie/firmware-realtek), observed `20250410-2` | Covers supported Realtek devices; exact HP SKU mapping is absent. |
| Qualcomm/Atheros | [`firmware-atheros`](https://packages.debian.org/trixie/firmware-atheros), observed `20250410-2` | Covers supported Atheros/Qualcomm families; exact HP SKU mapping is absent. |
| Broadcom/Cypress | [`firmware-brcm80211`](https://packages.debian.org/trixie/firmware-brcm80211), observed `20250410-2` | Covers supported brcm80211 devices, not every older Broadcom chipset. |
| Older Broadcom b43 | [`firmware-b43-installer`](https://packages.debian.org/trixie/firmware-b43-installer), [`firmware-b43legacy-installer`](https://packages.debian.org/trixie/firmware-b43legacy-installer) | These retrieve firmware from the network at install time. They do not provide offline coverage and are not supplied by the normal non-free-firmware-only path. |
| MediaTek | [`firmware-mediatek`](https://packages.debian.org/trixie/firmware-mediatek) | Relevant to newer wireless hardware; not listed in the current SP+ firmware policy. |
| Intel audio DSP | [`firmware-sof-signed`](https://packages.debian.org/trixie/firmware-sof-signed), observed `2025.01-1` | Relevant for Intel Sound Open Firmware devices. |
| Bluetooth | [`bluez-firmware`](https://packages.debian.org/trixie/bluez-firmware), observed `1.2-13` | Not a universal Bluetooth solution; chipset-specific firmware packages may still be required. |
| Kernel | [`linux-image-amd64`](https://packages.debian.org/trixie/linux-image-amd64), observed `6.12.107-1` | Provides the driver baseline, but does not guarantee firmware coverage. |
| Firmware updates | [`fwupd`](https://packages.debian.org/trixie/fwupd) | Required for a firmware-update policy, but no device-specific LVFS acceptance matrix is documented. |
| Graphics | `firmware-amd-graphics`, `firmware-intel-graphics`, and relevant NVIDIA path | Not explicitly mapped to the target HP models. |
| Camera, touchpad, suspend, storage, UEFI | Kernel drivers plus model-specific firmware/quirks | No acceptance matrix is present. |

Doc 12’s live-build defaults can include firmware, but inclusion depends on configured archive areas and package availability. The plan’s `non-free-firmware` source line is not itself proof that every required device firmware is in either the live image or the installed target.

If the live ISO lacks WiFi firmware, an offline installation may still proceed only if the installer and target payload already contain all required packages. Network-dependent firmware packages such as `firmware-b43-installer` will fail without connectivity. This behavior is not currently tested or specified.

The firmware gate therefore needs to prove:

- live-session WiFi operation;
- installation with no network;
- target reboot with WiFi and Bluetooth operational;
- audio initialization;
- suspend/resume;
- storage and UEFI boot;
- firmware-update behavior;
- exact HP models and chipsets covered;
- failure behavior when firmware is unavailable.
