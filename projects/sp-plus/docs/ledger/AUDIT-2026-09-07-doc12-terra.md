All linked external sources checked **2026-09-07**. No files changed.

## A. §4.6 firmware and hardware

1. **Named-package check — correct.** Lines 497–508 name Trixie packages at the stated versions: the five wireless packages, AMD/Intel graphics packages are `20250410-2`; `firmware-sof-signed` is `2025.01-1`; `bluez-firmware` is `1.2-13`.  
   Sources: [iwlwifi](https://packages.debian.org/trixie/firmware-iwlwifi), [realtek](https://packages.debian.org/trixie/firmware-realtek), [atheros](https://packages.debian.org/trixie/firmware-atheros), [brcm80211](https://packages.debian.org/trixie/firmware-brcm80211), [mediatek](https://packages.debian.org/trixie/firmware-mediatek), [SOF](https://packages.debian.org/trixie/firmware-sof-signed), [BlueZ](https://packages.debian.org/trixie/bluez-firmware), [AMD](https://packages.debian.org/trixie/firmware-amd-graphics), [Intel graphics](https://packages.debian.org/trixie/firmware-intel-graphics).

2. **b43 claim — substantively correct; wording needs precision.** Lines 510–511 correctly exclude both packages for an offline installer: their Debian descriptions explicitly say they *download and install* firmware and depend on `wget`; Debian’s b43 documentation says an Internet connection is required. Calling them “not firmware packages” is imprecise: they are firmware-installer packages, but contain no usable offline firmware payload.  
   Sources: [firmware-b43-installer](https://packages.debian.org/trixie/firmware-b43-installer), [firmware-b43legacy-installer](https://packages.debian.org/trixie/firmware-b43legacy-installer), [Debian bcm43xx documentation](https://wiki.debian.org/bcm43xx).

   Exclusion is the correct response **if b43 hardware is unsupported**, as stated. There is no Debian package-complete offline replacement. A possible product path would be a legally reviewed, pre-carried vendor firmware archive plus `b43-fwcutter`; that is a new supplied artifact and support obligation, not an alternative Debian package. The Debian wiki documents manual acquisition/extraction. Same source, checked 2026-09-07.

3. **The list is not sufficient to call mainstream HP coverage established.** Lines 501–508 cover common current Intel, Realtek, Qualcomm/Atheros, Broadcom/Cypress, and MediaTek WLAN families, but no model/PCI-ID mapping exists. Line 514 correctly says the supported list is empty.

   Specific omissions from the explicit set:
   - `firmware-nvidia-graphics` for HP laptops with an NVIDIA dGPU using nouveau. [Package](https://packages.debian.org/trixie/firmware-nvidia-graphics), checked 2026-09-07.
   - `firmware-misc-nonfree`, Debian’s collection for miscellaneous kernel drivers; it also recommends Intel graphics, Intel miscellaneous, MediaTek, and NVIDIA firmware. [Package](https://packages.debian.org/trixie/firmware-misc-nonfree), checked 2026-09-07.
   - `firmware-libertas` for older Marvell/NXP 88W8xxx WLAN hardware. [Package](https://packages.debian.org/trixie/firmware-libertas), checked 2026-09-07.
   - CPU microcode has no stated policy: `intel-microcode` or `amd64-microcode` should be explicitly accepted or rejected. AMD’s package supplies CPU microcode and AMD platform firmware. [amd64-microcode](https://packages.debian.org/trixie/amd64-microcode), checked 2026-09-07.

   Storage firmware cannot be responsibly inferred from package category alone. The plan needs exact NVMe/SATA controller and SSD model evidence; `fwupdmgr get-devices` does not prove update support or a successful firmware-update path.

4. **“Neither inherits it from the other” is technically wrong for this proposed live-Calamares flow** (line 512). Calamares’s `unpackfs` module unsquashes/copies the live filesystem into the target root. Therefore firmware files included in the live squashfs normally reach the target unless excluded or removed by target-install configuration. The installed target does not, conversely, add firmware back to the already-running live session.  
   Sources: [Calamares unpackfs configuration](https://sources.debian.org/data/main/c/calamares/3.3.14-1/src/modules/unpackfs/unpackfs.conf), [Debian settings’ unpackfs configuration](https://sources.debian.org/data/main/c/calamares-settings-debian/13.0.13-1/calamares/modules/unpackfs.conf), checked 2026-09-07.

   The correct gate is: declare firmware in the live build, ensure the target-copy path does not remove it, and verify it is installed after reboot. Requiring two separately maintained lists may be prudent, but it is not an inheritance fact.

5. **Firmware gate defects, lines 520–528.**
   - Rows 1 and 3: “works” is untestable. Define association, DHCP, DNS, and a real network transaction; for Bluetooth define discovery plus pairing and an actual device use.
   - Row 2 is ambiguous. “Wireless unconfigured” can still mean associated from the live session. Require **no active Ethernet or Wi-Fi link** throughout installation, then verify the target’s firmware package/file is present.
   - Row 4 omits microphone and input-device selection. “Audio initialises and plays” does not prove video-call readiness.
   - Row 6, “internal storage … behave,” has no pass criterion. It needs the tested controller, device, install/reboot, and LUKS unlock result.
   - Row 7 can pass while `fwupdmgr` merely enumerates devices. It does not prove LVFS metadata refresh, supported-device status, or a safe update policy.
   - Row 8 records only WLAN. It must record Bluetooth, audio, GPU, storage, camera, and relevant dock/USB-C controller identifiers as well.
   - Row 9 is not executable as written. It needs a defined negative test, expected user-facing message, and responsible component. Kernel logs are not “the machine says so plainly.”

   Missing real-laptop gates: touchpad/keyboard, camera, microphone, battery/power profile, wired Ethernet, USB-C/dock, external display, sleep/resume LUKS behavior, and firmware-update handling. These are product requirements, not just Phase D workflow concerns.

## B. §4.2 storage layout

1. **The LUKS/ext4 delta is correct; the stock Btrfs-subvolume delta is not.** Lines 389–401 correctly identify upstream partition defaults as LUKS1 and ext4. However, `calamares-settings-debian` supplies `/etc/calamares/modules/mount.conf`, and it contains no `btrfsSubvolumes`; Calamares then falls back in code to only `@` and `@home`. It does **not** merge the upstream example’s `@cache` and `@log` entries as the document claims.  
   Sources: [Debian settings file list](https://packages.debian.org/trixie/all/calamares-settings-debian/filelist), [Debian mount.conf](https://sources.debian.org/data/main/c/calamares-settings-debian/13.0.13-1/calamares/modules/mount.conf), [Calamares mount fallback, lines 126–154](https://github.com/calamares/calamares/blob/v3.3.14/src/modules/mount/main.py#L126-L154), checked 2026-09-07.

   So line 399 should not describe stock as `/@`, `/@home`, `/@cache`, `/@log`. The revision fixed the earlier fictitious `@rootfs` premise, but it still reaches the wrong stock-layout conclusion.

2. **SP+’s five-subvolume layout is achievable in stock Calamares configuration; no custom module is required.** `mount.conf` accepts arbitrary `{mountPoint, subvolume}` entries and stock Calamares creates and mounts them when root is Btrfs. The required entries are, precisely, `/@ → /`, `/@home → /home`, `/@var_log → /var/log`, `/@var_cache → /var/cache`, and `/@var_tmp → /var/tmp`.  
   Sources: [Calamares mount.conf](https://sources.debian.org/data/main/c/calamares/3.3.14-1/src/modules/mount/mount.conf), [Calamares mount implementation](https://github.com/calamares/calamares/blob/v3.3.14/src/modules/mount/main.py#L280-L320), checked 2026-09-07.

   The document’s bare names in line 411 are insufficient configuration: they omit each mount-point mapping. The settings package must own the actual `/etc/calamares/modules/*.conf` files, rather than assume automatic overlay/merge with `calamares-settings-debian`. This is still D32-compatible, but requires package-conflict/replacement and configuration-load testing.

3. **Timeshift treatment is directionally right, but the risk is more concrete than “additional subvolumes.”** Lines 401 and 692 correctly defer proof. Timeshift supports Ubuntu-style `@`/`@home`; it says other layouts are unsupported. Separate `/boot` needs backup/restore hooks. Separate `@var_log`, `@var_cache`, and `@var_tmp` are separate mounted subvolumes, so restoring a root `@` snapshot does not automatically establish rollback semantics for them.  
   Source: [Timeshift supported configurations and limitations](https://github.com/linuxmint/timeshift), checked 2026-09-07.

   What can break: snapshot creation refusal, incomplete restoration, or a target booting with restored root state but newer `/boot`; the latter is already acknowledged at lines 346 and 692. Phase C is the right proving phase, but Gate A cannot claim a meaningful permanent Timeshift restore until the layout’s restore semantics are defined.

4. **Secure Boot statement, line 442, is correct.** `grub-efi` identifies a bootloader family, not a complete signed chain. For amd64 Debian Secure Boot, the target needs at least `shim-signed`, `grub-efi-amd64-signed`, the unsigned GRUB support binaries, and Debian-signed kernel packages, with the ESP populated correctly. `shim-signed` is Microsoft-signed; Debian’s signed GRUB package is intended for shim.  
   Sources: [shim-signed](https://packages.debian.org/trixie/shim-signed), [grub-efi-amd64-signed](https://packages.debian.org/trixie/grub-efi-amd64-signed), [Debian Secure Boot documentation](https://wiki.debian.org/SecureBoot), checked 2026-09-07.

## C. §§5–7 phases, support, debt

1. **Gate drift from document 11 remains.**
   - **Gate A:** Doc 11 lines 97–100 specifies a disposable UEFI/Secure-Boot installer test. Doc 12 lines 516–530 additionally makes real-hardware firmware evidence mandatory for Phase A. That is stricter, not equivalent, while line 541 still labels it “Document 11 Gate A.”
   - **Gate C:** Not fixed in the executable gate. Doc 11 line 107 requires disk-pressure limits and distinguishing missing snapshots from failed permanent restore. Doc 12 lines 621–641 only deliberately break snapshot creation. Line 702 identifies the missing cases, but putting them in a “decision that blocks Phase C” does not put them in the Phase C test.
   - **Gate D:** The functional list now matches doc 11 lines 109–111. The Dell HW-00 designation is a reasonable initial target, but it is not a hardware-support matrix.

2. **§5.8 has a phase-order defect.** It says every listed decision blocks the phase from beginning (line 688), while rows 6 and 11 require evidence that the blocked phase itself is supposed to produce:
   - Row 6 says the hardware matrix blocks Phase D, but Phase D is where bare-metal workflow evidence is collected.
   - Row 11 says the snapshot matrix blocks Phase C, but its settlement says the Phase C gate must exercise it.
   - §4.6 says Phase A cannot pass on a VM alone, while row 6 does not require hardware mapping until Phase D.

   These are circular gates. The matrix/test design can block phase start; its execution evidence must block phase completion.

3. **§5.8 does not identify owners.** Despite its title, lines 690–703 have no owner column. Only rows 8 and 10 name Christopher in prose. The remaining eleven decisions have no accountable decider.

4. **Decisions already answered but reopened as unresolved.**
   - Row 1 reopens LUKS2 and the named subvolumes already decided by D32; the genuinely open matters are implementation and Timeshift proof.
   - Row 5 reopens the core live-and-target firmware policy already decided by D39; the open part is package scope/model evidence.
   - Row 8 reopens Fin architecture despite D34 selecting `sp-plus-fin` with a vendored Node 22. If alternatives remain open, D34 is not a decision of record.
   - Row 9 correctly exposes the unresolved D20/D35 conflict, but it cannot be called a settled release policy.

5. **Missing/too-late decision: APT trust.** Row 7 blocks Phase E, but Phase 0’s second-VM repository verification and Phase C’s real APT update path require working key bootstrap and `Signed-By` binding earlier. The external-R2 behavior can block Phase E; the repository trust contract must block Phase 0 or, at latest, Phase C. `Signed-By` constrains valid keys; APT pinning only selects candidates.  
   Sources: [APT sources.list(5)](https://manpages.debian.org/trixie/apt/sources.list.5.en.html), [APT preferences(5)](https://manpages.debian.org/trixie/apt/apt_preferences.5.en.html), checked 2026-09-07.

6. **Support accounting understates ongoing work.** Lines 709–737 omit:
   - per-model firmware/kernel regression after Debian security and firmware updates;
   - LVFS/fwupd metadata, update, rollback/failure, and Secure-Boot interaction testing;
   - emergency signing-key compromise/revocation, not only annual rotation;
   - Node/pi security and compatibility maintenance outside Debian’s security stream;
   - expiry/reproducibility maintenance for snapshot.debian.org inputs and build dependencies;
   - Calamares/live-build update testing and installer migration work;
   - explicit ISO security-refresh trigger. Quarterly rebuild alone can leave new installers carrying known fixes late.

7. **Internal CI conflict remains.** Line 675 says CI is deferred to Phase E. Line 755 says “No CI before Gate C,” which permits CI in Phase D. D35 says CI is deferred to Phase E. These need one schedule.

## D. Readability failures

- **Lines 389–401 — missing definition.** “Inherits upstream defaults” assumes a Debian packaging/configuration merge model that is both unexplained and wrong. Define which package owns which `/etc/calamares` file and how Calamares selects it.
- **Lines 399 and 411 — missing example.** The reader sees subvolume names but not their mount-point mappings. A technical non-packaging reader cannot determine that `@var_tmp` means `/var/tmp`.
- **Lines 493–495 — missing stated boundary.** The archive-area explanation is clear, but it does not say whether target construction copies the live squashfs or installs packages afresh. That missing mechanism causes the incorrect inheritance statement at line 512.
- **Lines 520–528 — missing passing definition.** Nearly every row uses “works,” “behave,” or “reports” without observable acceptance criteria.
- **Lines 686–705 — missing ownership and reordering.** A section titled “decisions that must be owned” names no owners and mixes pre-phase design decisions with evidence generated by the blocked phase.
- **Lines 709–722 — missing purpose.** “Cheaper cadence” has no stated operational meaning: which updates trigger an ISO rebuild, model retest, or support advisory is not explained.
- **Lines 745–759 — missing definition.** “Package count is capped” gives no cap or approval rule, and “No CI before Gate C; CI deferred to Phase E” presents contradictory timing without explaining the intended boundary.
