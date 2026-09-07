## A. Section 0 fact rows

All URL checks below were performed 2026-09-07.

| Doc 12 line | Row claim | What the cited source actually says | Finding |
|---:|---|---|---|
| 17 | Trixie Calamares is `3.3.14-1`. | The [Debian Sources API](https://sources.debian.org/api/src/calamares/) lists `3.3.14-1` for Trixie and `3.4.2-1.1` for Forky/Sid. | **VERIFIED** |
| 18 | Trixie live-build is `1:20250505+deb13u1`. | The [Debian Sources API](https://sources.debian.org/api/src/live-build/) lists that version for Trixie. | **VERIFIED** |
| 19 | Trixie Timeshift is `24.06.6-2`; it is upstream’s current line and no newer Timeshift exists to pursue. | The [Debian Sources API](https://sources.debian.org/api/src/timeshift/) lists `24.06.6-2` for Trixie, but also lists newer `25.12.4-1` for Forky/Sid. The Trixie-version portion is right; the “no newer Timeshift” conclusion is false. | **WRONG** |
| 20 | Trixie Cinnamon is `6.4.10-2`; `6.4.10-2+deb13u1` is proposed-updates; newer suites have `6.6.9-2`. | The [Debian Sources API](https://sources.debian.org/api/src/cinnamon/) lists exactly those versions and suites. | **VERIFIED** |
| 21 | Trixie Node is `20.19.2+dfsg-1+deb13u2`; no Trixie-backports entry exists; newer Node 22/24 is only in Sid/Forky. | The [Debian Sources API](https://sources.debian.org/api/src/nodejs/) lists Trixie Node 20 and no Trixie-backports entry. It lists Node 22 in Sid and Node 24 in Forky/Sid. The collective wording is accurate. | **VERIFIED** |
| 22 | `pi` 0.85.1 requires Node `>=22.19.0`. | The package’s [npm metadata](https://registry.npmjs.org/@earendil-works%2fpi-coding-agent/0.85.1) declares `engines.node: >=22.19.0`. | **VERIFIED** |
| 23 | Node supplies separate `linux-x64` and `linux-arm64` binaries and no architecture-independent Linux tarball. | The [Node 22.19.0 distribution listing](https://nodejs.org/dist/v22.19.0/) contains separate architecture-labelled Linux artifacts and no generic architecture-independent Linux binary tarball. | **VERIFIED** |
| 24 | `grub-btrfs` is absent from Debian’s source index. | The stated [Debian Sources URL](https://sources.debian.org/src/grub-btrfs/) returns HTTP 404. That establishes absence from this Debian index, not from third-party repositories. | **VERIFIED** |
| 25 | Upstream Calamares 3.3 defaults to `luksGeneration: luks1` and `defaultFileSystemType: "ext4"`. | The cited [upstream packaged `partition.conf`](https://sources.debian.org/data/main/c/calamares/3.3.14-1/src/modules/partition/partition.conf) has `luksGeneration: luks1` at line 102 and `defaultFileSystemType: "ext4"` at line 210. | **VERIFIED** |
| 26 | Upstream Calamares 3.3 `mount.conf` defines `/@`, `/@home`, `/@cache`, and `/@log`; no `@var_tmp` or `@rootfs`. | The cited [upstream packaged `mount.conf`](https://sources.debian.org/data/main/c/calamares/3.3.14-1/src/modules/mount/mount.conf) defines those four sample-config subvolumes at lines 50–61. It contains neither `@var_tmp` nor `@rootfs`. | **VERIFIED** |
| 27 | `calamares-settings-debian` has no `partition.conf`; its `mount.conf` has only `extraMounts`; stock Debian therefore inherits LUKS1, ext4, and the upstream `@/@home/@cache/@log` list. | The cited [module listing](https://sources.debian.org/api/src/calamares-settings-debian/13.0.13-1/calamares/modules/) has no `partition.conf`, and its [mount.conf](https://sources.debian.org/data/main/c/calamares-settings-debian/13.0.13-1/calamares/modules/mount.conf) defines `extraMounts` but no `btrfsSubvolumes`. Those first two statements are right. The conclusion about inherited `@cache` and `@log` is wrong: Calamares 3.3.14’s [mount-module fallback](https://raw.githubusercontent.com/calamares/calamares/v3.3.14/src/modules/mount/main.py) uses only `/@` and `/@home` when `btrfsSubvolumes` is absent or empty, plus `/@swap` when a swapfile is selected. | **WRONG** |
| 28 | `calamares-settings-debian` is ISC-licensed and is an example settings package for derivatives. | The [package page](https://packages.debian.org/trixie/calamares-settings-debian) says it is an example for derivatives. Its [copyright file](https://sources.debian.org/data/main/c/calamares-settings-debian/13.0.13-1/debian/copyright) says `Files: *` are ISC, but also records CC-BY-SA artwork and a GPL-2+ QML file. Calling the whole package unqualifiedly “ISC-licensed” is too broad. | **WRONG** |
| 29 | Trixie full support ends 2028-08-09 and LTS ends 2030-06-30. | The [Debian releases page](https://www.debian.org/releases/) gives those dates for Debian 13. | **VERIFIED** |
| 30 | The listed Intel, Realtek, Atheros, Broadcom/Cypress, and MediaTek firmware packages are `20250410-2`; `firmware-sof-signed` is `2025.01-1`. | The package pages for [iwlwifi](https://packages.debian.org/trixie/firmware-iwlwifi), [Realtek](https://packages.debian.org/trixie/firmware-realtek), [Atheros](https://packages.debian.org/trixie/firmware-atheros), [brcm80211](https://packages.debian.org/trixie/firmware-brcm80211), [MediaTek](https://packages.debian.org/trixie/firmware-mediatek), and [SOF](https://packages.debian.org/trixie/firmware-sof-signed) show those versions. | **VERIFIED** |
| 31 | `firmware-b43-installer` and `firmware-b43legacy-installer` fetch firmware over the network and provide no offline coverage. | The [b43 package page](https://packages.debian.org/trixie/firmware-b43-installer) and [b43legacy package page](https://packages.debian.org/trixie/firmware-b43legacy-installer) describe retrieval/download of firmware during installation. They are not offline firmware payloads. | **VERIFIED** |
| 32 | Trixie `linux-image-amd64` is `6.12.107-1`; this is a driver baseline, not proof of firmware coverage. | The [Trixie package page](https://packages.debian.org/trixie/linux-image-amd64) lists `6.12.107-1`. The stated limitation is correct. | **VERIFIED** |
| 33 | TPM2 enrolment through `systemd-cryptenroll` requires dracut on Trixie and cannot be supported by initramfs-tools. | The [systemd-cryptenroll manual](https://www.freedesktop.org/software/systemd/man/latest/systemd-cryptenroll.html) documents TPM2 support. [Debian bug #1031254](https://bugs.debian.org/1031254) records TPM-related failures. Neither establishes the universal dracut requirement or proves initramfs-tools cannot support the design. | **UNVERIFIED — correctly marked.** |
| 34 | No CI exists for the Fedora lane. | The document accurately limits its observation to the absence of tracked `.github/` workflow files in this tree. That cannot establish absence of external CI, another repository, or a non-GitHub pipeline. | **UNVERIFIED — correctly marked.** |

### Section 0 conclusions

1. **The previous audit was wrong about upstream Calamares’ sample `mount.conf`.** Doc 12 line 26 is right: upstream’s sample list is `@`, `@home`, `@cache`, and `@log`, not the names claimed by the prior audit.

2. **The revision still makes a different Calamares error at line 27.** Debian’s settings package supplies no `btrfsSubvolumes`; therefore Calamares does not use upstream’s sample `@cache`/`@log` entries. It takes the mount module’s internal fallback: `@` and `@home`, with conditional `@swap`. The proposed SP+ layout still needs a full SP+-owned `mount.conf`, but the stock-layout explanation is false.

3. **The two explicit UNVERIFIED labels are honest.** No other row needs that label merely because it is future-sensitive. Rows 19, 27, and 28 are not unverified; their cited sources are sufficient to show their relevant assertions are wrong.

4. **Resolvable-source check:** all linked URLs resolve successfully except the intentional HTTP-404 `grub-btrfs` URL at line 24. The line-34 “This repository” source is not a URL, but that row is explicitly UNVERIFIED. Line 30’s “sibling package pages” wording is not a complete citation list, although the relevant sibling package URLs do resolve.

## B. Sections 1 through 3 coherence

### 1. Decisions cited or used incorrectly

- **Doc 12 line 36 overstates what the `grub-btrfs` negative proves.** D33 in [doc 06 lines 48–49](docs/06-OPEN-QUESTIONS-AND-DECISIONS.md#L48) is a product decision: no third-party boot-critical component and no snapshot boot menu. The absence of a Debian package supports that choice, but does not make “no snapshot boot menu” a matter of fact rather than taste. The factual part is only the Debian-index absence.

- **D32’s use is mostly consistent, but its fact rationale is not.** D32 at [doc 06 line 47](docs/06-OPEN-QUESTIONS-AND-DECISIONS.md#L47) says SP+ must own `partition.conf` and `mount.conf`; doc 12 lines 63–75 uses D32 that way. That is coherent. But doc 12 line 27’s claim that Debian stock inherits the upstream sample Btrfs layout conflicts with Calamares’ actual fallback behavior. The required SP+ override remains justified; the stated stock behavior does not.

- **D37 is semantically imprecise in doc 06.** D37 at [doc 06 line 52](docs/06-OPEN-QUESTIONS-AND-DECISIONS.md#L52) says Debian and SP+ trust roots are “enforced by APT pinning.” Doc 12 lines 99–100 correctly says pinning is candidate selection, while `Signed-By` identifies accepted signing keys. Trust roots are established by signing-key configuration; pinning can enforce a package-origin policy. The doc 12 treatment is technically better than D37’s wording, but the register should not retain the contrary shorthand.

- **D20 and D35 remain a recorded contradiction, not a resolved exception.** D20 at [doc 06 line 35](docs/06-OPEN-QUESTIONS-AND-DECISIONS.md#L35) says release artifacts come from CI, not Beelink, and marks that decision non-reversible. D35 at [doc 06 line 50](docs/06-OPEN-QUESTIONS-AND-DECISIONS.md#L50), and doc 12 lines 51 and 114, authorize Beelink builds and defer CI to Phase E. Calling this “a deliberate tension” does not identify which decision governs release artifacts before Phase E.

- **The Fin architecture use is correct.** Doc 12 lines 151–153 correctly distinguishes the five content/configuration packages from `sp-plus-fin`. An `Architecture: all` package embedding one `linux-x64` or `linux-arm64` Node runtime would be mislabelled and installable on an unsupported architecture. The options listed at line 153 are technically sound. This is not a conflict with D34; D34 decides to vendor Node 22, while the package architecture remains to be declared.

### 2. Supply-chain trust, section 1.4

- **The APT signature explanation is substantially correct.** Doc 12 lines 91 and 99 correctly distinguish:
  - repository authentication through a trusted Release/InRelease signing key;
  - `Signed-By` constraining the key material accepted for a source; and
  - pinning choosing package candidates rather than authenticating repositories.

  This matches [APT’s sources.list documentation](https://manpages.debian.org/trixie/apt/sources.list.5.en.html) and [APT preferences documentation](https://manpages.debian.org/trixie/apt/apt_preferences.5.en.html), checked 2026-09-07.

- **“The mechanism … is a signature, and only a signature” is overstated at doc 12 line 91.** APT normally verifies the signed Release/InRelease metadata and then verifies fetched package indexes and `.deb` files against checksums in that authenticated metadata. A package is not individually GPG-signed in the ordinary Debian repository model. “Signature establishes repository-metadata authenticity; signed metadata and hashes establish package integrity” is precise. The current wording is directionally right but technically compressed past accuracy.

- **“A package … does not install” at line 91 needs its normal-APT qualification.** It is true for an ordinary correctly configured APT client that rejects unauthenticated repositories. It is not an absolute property of APT under all administrator overrides or insecure-source configuration. The document should describe the required APT configuration, not present the behavior as self-executing.

- **The R2 sentence is appropriately limited but incomplete.** Doc 12 line 97 correctly says an R2 compromise without the signing key cannot forge a newly signed repository. It can withhold content and replay older signed content. The document correctly keeps `InRelease` cache behavior and freshness under Q19 at lines 103–110. That is not a settled operational trust model.

- **The document does not treat Q19 as settled.** Doc 12 lines 103–110 and [doc 06 lines 280–285](docs/06-OPEN-QUESTIONS-AND-DECISIONS.md#L280) consistently leave R2 behavior open. No contradiction found.

### 3. Package and support-boundary coherence

- **“Five genuinely architecture-independent packages” is a plan claim, not a demonstrated fact.** Doc 12 lines 114 and 151 are plausible for keyring, policy, configuration, scripts, and branding packages, but no package manifests exist in this plan to establish the contents. This should be phrased as a required package-architecture declaration, not as a currently verified property.

- **Timeshift is configured but not expressly made a dependency.** Doc 12 line 158 requires “Timeshift configuration,” while lines 81, 135, 260, and 314 require Timeshift to run and report snapshots. A configuration package alone does not ensure the binary is installed. The package manifest must name `timeshift`, or an explicit dependency must do so.

- **The `RELEASES.md` reference is ambiguous.** Doc 12 lines 158, 182, and 196 refer to `RELEASES.md` without a repo-relative path. The plan’s implementation tree is `projects/sp-plus/debian/` at lines 166–174. An implementer cannot tell from these lines whether `RELEASES.md` is in that tree, repository root, or `docs/ledger/`.

- **The advisor-account restriction is an intended control, not established behavior.** Doc 12 lines 218 and 301 say polkit and sudoers block direct APT/dpkg operations. That is not inconsistent with doc 11 lines 48–54, but it remains a configuration requirement. It cannot be counted as a completed boundary until the policy distinguishes the daily account, the sudo group, pkexec, and maintenance-service authorization.

### 4. Section 3 update cadence versus DN-30

- **The prose accurately identifies the policy difference.** Doc 12 line 242 correctly describes DN-30 as fortnightly, ISO-week-parity Friday staging with Sunday reboot. DN-30 lines 7–10 and 21–24 say exactly that.

- **The operative table still states a different, weekly policy.** Doc 12 lines 244–247 says “Friday 15:00” and “Sunday 04:00” with no fortnightly or ISO-week condition. The same paragraph says that, until Christopher rules, DN-30 “stands as written” and the Debian lane “inherits it unchanged.” Both cannot be the current operative schedule.

- **The revision partially fixed the prior incoherence by naming it, but did not remove the conflicting table.** To be coherent, the table must either say “every other Friday on even ISO weeks” and “the following Sunday,” or be explicitly labelled a rejected/proposed Debian divergence pending a new decision number.

- **DN-30’s conditional-reboot principle is preserved but its predicate changed.** DN-30 lines 36–42 make reboot conditional on a staged bootc deployment. Doc 12 line 247 makes restart conditional on the recorded APT result. That is a reasonable Debian-specific analogue, but it is another reason the Debian policy is not DN-30 “unchanged.”

### 5. Section 3 failure and recovery contract

- **The ordering is internally incomplete.** Doc 12 lines 265–267 write the result record before notification and conditional restart. Lines 291–295 say failure of notification or conditional restart is recorded with `degraded: true`. The plan gives no subsequent record-update step. A notification failure after step 7 cannot be recorded as a failed result under the defined sequence unless the record is reopened and rewritten.

- **Failure of record writing is not recordable by the stated mechanism.** Lines 265 and 295 require both “write the update record” and a failure record if record writing fails. That is impossible without an alternate durable log location or journal fallback. The failure contract needs an explicit secondary evidence path.

- **The kernel-retention mechanism is not specified.** Doc 12 line 263 refers to “the specified `apt-mark hold` rule” for `newest-1`, but no rule or package set is specified. `apt-mark hold` operates on package names, not an abstract version rank. The condition “two bootable kernels remain” is clear; the claimed mechanism is not.

- **The document correctly leaves Q18 open.** Doc 12 line 334 and [doc 06 lines 269–278](docs/06-OPEN-QUESTIONS-AND-DECISIONS.md#L269) agree that a non-technical live-USB Timeshift restore has not been proven. This is coherent.

- **The document correctly states `/boot` is outside Btrfs snapshots.** Doc 12 lines 336–346 is consistent with doc 11 lines 40–43: local snapshot restore is not a complete boot-path rollback. The rescue-kernel reinstall guidance is a proposed remedy, not evidence that the recovery path works; the document does not claim otherwise.

- **Q16 is correctly cited in sections 0–3, but doc 06 still prejudges it.** Doc 12 lines 33 and 346 call TPM2/dracut versus initramfs-tools UNVERIFIED/open. [Doc 06 lines 250–258](docs/06-OPEN-QUESTIONS-AND-DECISIONS.md#L250) labels Q16 “Open” but then asserts that TPM2 unlock “requires dracut” and that initramfs-tools ignores `tpm2-device`. The open-question wording and the asserted answer conflict. Doc 12’s UNVERIFIED treatment is the correct one.

## C. What the revision claims to have fixed but did not

The prior audit’s findings below are assessed only where they concern doc 12 sections 0–3 or decision records. Findings confined to sections 4–7 are outside this brief.

| Previous finding | Revision result | Audit result |
|---|---|---|
| Calamares Trixie version needed verification. | Line 17 now cites the package source and is correct. | **Resolved.** |
| live-build version needed verification. | Line 18 cites the package source and is correct. | **Resolved.** |
| Timeshift needed verification and a newer Debian version existed. | Line 19 preserves the correct Trixie version but says there is no newer Timeshift. Debian Sources lists `25.12.4-1`. | **Left; regression in wording.** |
| Cinnamon version/suite status needed verification. | Line 20 accurately names Trixie, proposed-updates, and newer-suite versions. | **Resolved.** |
| Node 20 in Trixie, no backport, and Pi’s Node requirement needed verification. | Lines 21–23 accurately support the Node 22 vendoring problem. | **Resolved.** |
| `grub-btrfs` absence needed scope qualification. | Line 24 correctly limits the claim to Debian’s source index and distinguishes third-party repositories. | **Resolved.** |
| Prior audit wrongly said upstream Calamares used different subvolume names from `@ @home @cache @log`. | Line 26 correctly restores the upstream sample list. | **Resolved; prior audit was wrong.** |
| Previous `@rootfs` stock-layout premise was wrong. | Line 38 correctly rejects `@rootfs`, but line 27 replaces it with another wrong stock-layout claim: that absent Debian configuration inherits upstream `@cache` and `@log`. Calamares instead falls back to `@` and `@home`. | **Partially resolved.** |
| LUKS1/encrypted-`/boot` claim was wrong. | Line 25 now correctly identifies upstream LUKS1/ext4 defaults; lines 318 and 338 correctly distinguish the recovery-key secret from snapshot coverage. | **Resolved within sections 0–3.** |
| `calamares-settings-debian` licensing and purpose needed qualification. | The “example for derivatives” part is now accurate, but line 28 still calls the package ISC-licensed without acknowledging included CC-BY-SA and GPL-2+ files. | **Partially resolved.** |
| The dracut requirement was not established. | Line 33 marks it UNVERIFIED and assigns Q16. This is the correct disposition. However, doc 06’s Q16 text still asserts the requirement as fact. | **Partially resolved.** |
| Trixie support dates were wrong. | Line 29 now gives Debian’s exact full-support and LTS end dates. | **Resolved.** |
| Lack of Fedora CI was inferred too broadly. | Line 34 now limits the observation to absent tracked workflow files and marks the larger claim UNVERIFIED. | **Resolved.** |
| DN-30 was wrongly treated as reusable verbatim. | Line 242 now plainly says the policies differ and that DN-30 remains standing. The table immediately below still encodes the proposed weekly schedule without the DN-30 parity condition. | **Partially resolved.** |
| Debian TPM work had been attached to Q15 rather than Q16. | Sections 0–3 now use Q16 at lines 33 and 346. | **Resolved.** |
| Stock Calamares was wrongly treated as implementing the SP+ storage layout. | Lines 63–75 and 232–234 now correctly say SP+ must own configuration and write no installer code. The fallback-layout explanation at line 27 remains false, but it does not change the requirement to ship SP+ configuration. | **Partially resolved.** |
| APT pinning had been treated as authentication. | Lines 99–110 now correctly separate pinning, signatures, and `Signed-By`; outstanding operation details are explicitly open. | **Resolved.** |
| The Node-vendored Fin package could not honestly be architecture-independent. | Lines 151–153 explicitly identify the problem and prevent Phase D until an architecture choice is made. | **Resolved.** |
| D20 and Beelink-produced artifacts conflicted. | D35 now records the conflict as a “deliberate tension,” but neither decision is superseded and doc 12 continues to rely on Beelink builds. | **Left.** |
| Recovery-key terminology and persistence boundary were ambiguous. | Lines 139, 318, and 338 improve the “not retained in logs, ISO, or installed system” wording, but still do not distinguish the retained LUKS keyslot from prohibited retention of a plaintext recovery credential. | **Partially resolved.** |
| The supply-chain section lacked a threat model. | Lines 85–110 now lead with the root-update threat, define the attacker, and state the remaining unowned controls. | **Resolved.** |

