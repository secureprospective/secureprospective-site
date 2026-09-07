# SP+ — Debian Live Installer and Support Plan

**Status:** plan, revision 2, 2026-09-07 — revised after an independent verification audit (`docs/ledger/AUDIT-2026-09-07-doc12-bee.md`) found three incorrect facts in §0, an incorrect premise under D32, and an unaddressed hardware-enablement gap
**Decision owner:** Christopher
**Scope:** the Debian live installer and the support infrastructure the Debian path requires. It authorizes nothing by itself; Phase 0 begins only on Christopher's approval.

Document 11 set the Debian direction and deliberately stopped there. This document turns its Gates A–D into buildable, sequential phases, and defines the support infrastructure the Debian path needs that the Fedora path received for free from bootc, Silverblue, and Flatpak: package building, a signed APT repository, a managed update path with verified snapshots, an installer configuration SP+ owns, and a release and test process. The whole of it is sized against one constraint — it must not bury Secure Prospective in maintenance debt — and it never describes the Debian system as immutable or as bootc-equivalent.

## 0. Fact base and re-verification list

Every row below was checked on 2026-09-07 against the cited source, and the observation recorded is what the source actually says rather than what the plan expected it to say. Each row carries the phase before which it must be checked again, because every one of them can change. The table is a re-verification list. It is not evidence that any build, gate, or test has passed.

A row marked **UNVERIFIED** is a claim this plan has not established. It may be true. It is not permitted to carry weight in a decision until it is checked, and any decision resting on one is provisional by construction.

| Fact, as verified 2026-09-07 | Source | Re-verify before |
|---|---|---|
| Calamares in Trixie is **3.3.14-1**. | [sources.debian.org/src/calamares](https://sources.debian.org/src/calamares/) | Phase 0 |
| live-build in Trixie is **1:20250505+deb13u1**. | [sources.debian.org/src/live-build](https://sources.debian.org/src/live-build/) | Phase 0 |
| Timeshift in Trixie is **24.06.6-2**. Newer suites carry 25.12.4-1; per D38 the Trixie version is the target and a newer Timeshift is a per-package backport only if a named feature requires it. | [sources.debian.org/src/timeshift](https://sources.debian.org/src/timeshift/) | Phase C |
| Cinnamon in Trixie is **6.4.10-2** (6.4.10-2+deb13u1 staged in proposed-updates). Newer suites carry 6.6.9-2. Per D38 the Trixie version is the target. | [sources.debian.org/src/cinnamon](https://sources.debian.org/src/cinnamon/) | Phase A |
| Node.js in Trixie is **20.19.2+dfsg-1+deb13u2**, and there is **no trixie-backports entry** — only sid and forky carry Node 22 and 24. | [sources.debian.org/src/nodejs](https://sources.debian.org/src/nodejs/) | Phase D |
| `pi` (`@earendil-works/pi-coding-agent` 0.85.1) requires **Node >= 22.19.0**, which Trixie cannot supply. | [registry.npmjs.org metadata](https://registry.npmjs.org/@earendil-works%2fpi-coding-agent/0.85.1) | Phase D |
| Node upstream ships **separate `linux-x64` and `linux-arm64` binaries**; there is no architecture-independent Node tarball. | [nodejs.org/dist/v22.19.0](https://nodejs.org/dist/v22.19.0/) | Phase D |
| **grub-btrfs is absent from the Debian source index.** The source-package query returns HTTP 404. This establishes absence from Debian, not absence from every third-party repository — which is sufficient for D33, since D37 admits no third-party repositories. | [sources.debian.org/src/grub-btrfs](https://sources.debian.org/src/grub-btrfs/) — HTTP 404 | Phase C |
| Upstream Calamares 3.3 defaults to **`luksGeneration: luks1`** and **`defaultFileSystemType: "ext4"`**. | [partition.conf lines 102, 210](https://sources.debian.org/data/main/c/calamares/3.3.14-1/src/modules/partition/partition.conf) | Phase 0 |
| Upstream Calamares 3.3 `mount.conf` defines `btrfsSubvolumes` as **`/@`, `/@home`, `/@cache` (at `/var/cache`), `/@log` (at `/var/log`)**. There is no `@var_tmp` and no `@rootfs`. | [mount.conf lines 50–61](https://sources.debian.org/data/main/c/calamares/3.3.14-1/src/modules/mount/mount.conf) | Phase 0 |
| `calamares-settings-debian` **ships no `partition.conf` at all**, and its `mount.conf` defines only `extraMounts` — no `btrfsSubvolumes`. Debian stock therefore takes upstream's LUKS1 and ext4 partition defaults, but **not** the subvolume list in the row above: with `btrfsSubvolumes` absent, the mount module falls back **in code** to `/@` and `/@home` only, plus `/@swap` when a swapfile is selected. The row above describes an example configuration file, not runtime behaviour. | [module directory listing](https://sources.debian.org/api/src/calamares-settings-debian/13.0.13-1/calamares/modules/) · [its mount.conf](https://sources.debian.org/data/main/c/calamares-settings-debian/13.0.13-1/calamares/modules/mount.conf) · [mount/main.py lines 137–143](https://sources.debian.org/data/main/c/calamares/3.3.14-1/src/modules/mount/main.py) | Phase 0 |
| `calamares-settings-debian` is licensed **ISC for `Files: *`**, with CC-BY-SA artwork and one GPL-2+ QML file — it is not wholly ISC, and reuse must be assessed per file. It is described upstream as a settings package for derivatives. It is a starting point for layout and packaging conventions; it is **not** an implementation of the SP+ storage design. | [package](https://packages.debian.org/trixie/calamares-settings-debian) · [copyright](https://sources.debian.org/data/main/c/calamares-settings-debian/13.0.13-1/debian/copyright) | Phase 0 |
| **Trixie full support ends 2028-08-09; LTS ends 2030-06-30.** | [debian.org/releases](https://www.debian.org/releases/) | Phase E |
| Firmware packages exist in Trixie at **20250410-2** for Intel (`firmware-iwlwifi`), Realtek (`firmware-realtek`), Atheros/Qualcomm (`firmware-atheros`), Broadcom (`firmware-brcm80211`) and MediaTek (`firmware-mediatek`); Intel audio DSP is `firmware-sof-signed` 2025.01-1. | [packages.debian.org/trixie/firmware-iwlwifi](https://packages.debian.org/trixie/firmware-iwlwifi) and sibling package pages | Phase A |
| `firmware-b43-installer` and `firmware-b43legacy-installer` **fetch firmware over the network at install time**. They provide no offline coverage. | [packages.debian.org/trixie/firmware-b43-installer](https://packages.debian.org/trixie/firmware-b43-installer) | Phase A |
| The Trixie kernel is **`linux-image-amd64` 6.12.107-1**. It sets the driver baseline; it does not imply firmware coverage. | [packages.debian.org/trixie/linux-image-amd64](https://packages.debian.org/trixie/linux-image-amd64) | Phase A |
| **UNVERIFIED —** that TPM2 enrolment via `systemd-cryptenroll` *requires* dracut on Trixie and that initramfs-tools cannot support it. `systemd-cryptenroll` supports TPM2 and dracut is packaged, but no source checked establishes the requirement. Bug #1031254 records TPM-related failures without proving the general claim. Q16 owns this. | [systemd-cryptenroll(1)](https://www.freedesktop.org/software/systemd/man/latest/systemd-cryptenroll.html) · [Bug #1031254](https://bugs.debian.org/1031254) | Phase B — **must be settled before any TPM work is scheduled** |
| **UNVERIFIED —** that no CI exists for the Fedora lane. `git ls-files \| grep '^\.github/'` returns nothing in this repository as of 2026-09-07, which proves only that this tree tracks no workflow files. | This repository, 2026-09-07 | Phase E |

Three rows are load-bearing negatives. grub-btrfs is absent from Debian, which removes the option of shipping it without taking on a boot-critical third-party component. D33's product choice — no snapshot boot menu — rests on that cost, not on the absence alone. Node 22 is absent from Trixie and its backports, and no architecture-independent Node binary exists, which together set the terms of D34. And Debian's stock Calamares settings supply no `partition.conf` and no `btrfsSubvolumes`, so the installed layout would be LUKS1, ext4, `/@` and `/@home` — which is why SP+ must ship its own `partition.conf` and `mount.conf`, the subject of D32.

The two UNVERIFIED rows are recorded as such deliberately. This table has now been wrong twice about the same fact. The first draft asserted a `@rootfs` stock layout, which exists in no source at all. The second asserted that Debian stock inherits upstream's `@cache` and `@log` — a real file, but the wrong one: it is an example configuration, and the runtime fallback in `mount/main.py` uses `/@` and `/@home`. Both errors came from reading a configuration file and assuming it described behaviour. **Where a claim is about what the software does, the deciding source is the code that consumes the configuration, not the configuration shipped beside it.**

Existing Fedora assets that port to Debian unchanged: `knowledge/`, `helpapp/`, `welcome/`, `playbooks/`, `runtime/spplus_rpc.py`, the Fin prompt, skills and extensions, `branding/`, the LibreOffice `.xcd` files, and the `tests/` gates covering them. Everything bootc-specific — `spplus-stage-update*`, `spplus-update-control`, `spplus-update-health`, the polkit rules, and the `bootc status` evidence path — needs a Debian equivalent, and §3 is where that equivalent is designed.

## 1. What Fedora gave us for free, and what Debian makes us own

Fedora/KDE provides the immediate proving ground through the bootc model. The Debian path starts from stock Debian and original SP+ work. It must build the parts that bootc, Silverblue, and the existing Flatpak workflow provide as platform facilities on Fedora.

| Concern | Fedora bootc | Debian SP+ must build | Size |
|---|---|---|---|
| Base image reproducibility | Containerfile + digest pin | live-build config in git + `packages.list` manifest + `apt-mark showmanual` diff gate | small |
| Install media | `bootc-generic-iso` | live-build ISO + `calamares-settings-spplus` | medium |
| Atomic update + rollback | `bootc upgrade` / `rollback` | `spplus-maintain`: snapshot-verify → apt → kernel-retain → record → offer restart; fail-closed | **large — the real infra** |
| Supply-chain trust | cosign policy in image | GPG-signed APT repo (`reprepro` on Beelink → R2), key in `sp-plus-keyring` with two-key overlap | medium |
| Product software delivery | image layers | 6 `.debs`, five arch-all (§2) | medium |
| Apps | Flatpak on immutable root | same: one Flathub allowlist, Firefox ESR from Debian | small |
| Evidence report | `bootc status` + LUKS + `mokutil` | `apt` state + Timeshift snapshot list + LUKS + `mokutil` | small |
| Fin | pi via npm in image | `sp-plus-fin` `.deb` with vendored Node 22 | small, off critical path |

### 1.1 Reproducibility boundary

The Fedora input is a Containerfile with digest pinning. The Debian input is a live-build configuration held in git, an explicit `packages.list` manifest, and an `apt-mark showmanual` diff gate. The live-build configuration defines the installer media. The package manifest defines the intended package input.

The `apt-mark showmanual` result supplies the declared-manual-package comparison used by the build gate. The Debian installer must create the target system from that reproducible package manifest. It must not create the target from a captured disk image. All six SP+ packages use the same `BUILD_ID`. The build lane therefore has one release identifier across the package set and the live media. The build lane does not claim that Debian has Fedora's image-level atomicity.

### 1.2 Installer media and configuration ownership

Fedora has `bootc-generic-iso` as its installation form. Debian requires a live-build ISO and a SP+-owned Calamares configuration. `calamares-settings-spplus` contains the installer configuration and branding required by the Debian path. The installer configuration owns the erase-disk policy, the LUKS2 and Btrfs choices, the subvolume layout, the first-user settings, the live-only package removal, and the signed GRUB EFI selection.

The configuration is separate from the live-build media configuration. The live-build configuration supplies the live environment and package list. The Calamares configuration controls the target installation choices specified in §4.

D32 is the installer boundary:

- stock Calamares 3.3;
- `calamares-settings-spplus`;
- no custom installer code.

D32 is durable and requires an expert-AI panel before the installer build as a quality gate. This plan does not replace that panel.

### 1.3 Atomic update versus controlled mutability

Fedora uses `bootc upgrade` and `bootc rollback` as the comparison point. Debian remains a writable package system. SP+ must not describe the Debian system as immutable. The Debian protection model is controlled mutability.

The daily advisor account is not expected to use a terminal or install arbitrary system packages. Operating-system changes use `spplus-maintain`. The managed path checks free space, creates and verifies a snapshot, applies the approved APT transaction, retains a known-good kernel, rebuilds boot artifacts, records the result, and offers a safe restart. Snapshot verification precedes the APT transaction.

If snapshot creation or verification fails, the update stops or reports degraded protection. It does not silently proceed as protected. This is less atomic than Fedora bootc. The design instead makes the Debian package system inspectable through one visible maintenance path. The size label `large` in the table identifies the update and recovery path as the main support infrastructure.

### 1.4 Supply-chain trust

**What this protects, and from what.** Every SP+ machine will, on a schedule, download software and run it as root. That is the update path, and it is the most dangerous thing the product does routinely. The question this section answers is: *when the machine installs a package, how does it know that package came from us and not from someone else?*

The threat is not an advisor doing something careless. It is an attacker who can answer the machine's download request — a hostile network, a compromised mirror, a stolen hosting account — and hand it a package that installs cleanly and does whatever they want. The advisor sees a normal update. There is nothing to notice.

**The mechanism that answers it is a signature, and the chain of checksums it anchors.** SP+ operates a GPG-signed APT repository. Individual `.deb` files are not GPG-signed; what is signed is the repository's `InRelease` metadata. APT verifies that signature against a key the machine already holds in `sp-plus-keyring`, and the authenticated metadata then carries checksums for the package indexes, which in turn carry checksums for each `.deb`. Break the chain anywhere and the install stops.

Two qualifications matter, because both are configuration rather than physics. This holds for a **correctly configured** APT: an administrator can override it, and a source configured to allow unauthenticated packages defeats it entirely. The SP+ configuration must therefore forbid those overrides explicitly rather than rely on the default — §5 owns that as part of the APT trust decision.

The bookkeeping matters because the key is a long-lived secret that can be lost or stolen:

- `sp-plus-keyring` carries **two key slots**, so a key can be replaced while the old one is still accepted. Without overlap, rotating a key strands every machine that has not updated yet.
- The `repo/` configuration in this repository contains **no private keys**, and never will.
- `reprepro` on the Beelink assembles and signs the repository; R2 hosts the result. **Hosting is not trust** — R2 serves bytes, and the signature is what makes those bytes safe. A compromised R2 bucket cannot forge a package, only withhold or replay one.

**What pinning does and does not do.** D37 names two trust roots, Debian and SP+, and APT pinning enforces that boundary. Pinning selects *which candidate wins* when two repositories offer the same package. It is a policy about preference, **not an authentication mechanism** — it does not verify a signature and does not decide which keys are trusted. That job belongs to `Signed-By` in the deb822 source entry, which binds a repository to a specific key. Earlier drafts of this plan blurred the two; they are separate controls and both are required.

Backports are per-package exceptions under D37, never a standing source.

**What is still unowned.** This section defines the shape of the trust model, not its operation. The following are open and must be settled before the repository carries a real update — they are grouped under the APT trust decision in §5:

- the exact `Signed-By` binding and how the keyring reaches a machine during installation, before any network update has run;
- pin priority values, and what happens when the SP+ repository is unreachable — the update must fail closed, not silently fall through to another source;
- key rotation and revocation procedure, and the response if a signing key is believed compromised;
- Q19: whether R2 is a sound APT origin, including `InRelease` caching behaviour and TLS.

Until those are settled, this plan describes an intended trust model and not an operating one.

### 1.5 Product software delivery

Fedora supplies product software through image layers. Debian supplies the six SP+ packages described in §2. They are built with `dpkg-deb` and `debhelper` on Beelink. Five of the six are to be declared architecture-independent; `sp-plus-fin` is `Architecture: amd64` (D42), and §2 states why.

`sp-plus-base` supplies the operating-system overlay and package policy. `sp-plus-desktop` supplies Cinnamon defaults and desktop configuration. `sp-plus-maintain` supplies the maintenance, evidence, first-login, welcome, and help path. `sp-plus-fin` supplies Fin outside the critical update path.

`calamares-settings-spplus` supplies the installer configuration and branding. The six-package set is the initial support boundary. Package additions are subject to the cap in §7.

### 1.6 Applications

The application model is shared where it is practical. Flatpak applications use one controlled remote and an individually approved Flathub allowlist. Firefox ESR comes from Debian and is the repository-first supported browser. The profile carries managed bookmarks, the SP+ web application, and installed PWA-style business workflows.

A Chromium-family browser is not part of the default profile merely because a browser portal exists. Brave is an explicit compatibility exception only after the required carrier-portal and PWA evidence, update testing, licensing acceptance, and source monitoring exist. Q17 remains open: Firefox ESR versus Brave on Debian. Q17 inherits Q1.

Until that evidence exists, Firefox ESR remains the supported browser and Brave remains outside the default profile. Password managers, video calls, and document tools enter the profile only after testing for the specified permissions and desktop integration. The application profile must not require mixing Debian suites.

### 1.7 Evidence and Fin

The Fedora evidence comparison is `bootc status` plus LUKS and `mokutil`.

The Debian evidence report uses:

- APT state;
- the Timeshift snapshot list;
- LUKS state;
- `mokutil` state.

The evidence collector is part of `sp-plus-maintain`. Evidence is sanitized. Recovery keys are not retained in logs, the ISO, or the installed system. Fin is delivered in `sp-plus-fin`.

Fin uses the pinned Node 22 and pinned pi described in §2. Fin can explain state, diagnose, and offer signed approval-gated actions. Fin does not silently add repositories. Fin does not alter boot configuration.

Fin does not change encryption keys. Fin does not run arbitrary package commands. Fin is off the critical path for the initial package and installer gate.

### 1.8 Ownership boundary

The Debian support surface is larger than the ISO. Secure Prospective must maintain the package manifest, installer configuration, repository signing and release process, snapshot and update tooling, supported-hardware list, security-update cadence, testing, support guidance, and discontinuation path. The Debian plan therefore treats the installer, package channel, maintenance path, evidence path, and support corpus as one product boundary. No one component can be called complete while the listed gate still depends on an unowned component.

## 2. SP+ package set

Five of the six packages are `Architecture: all`. All six are built with `dpkg-deb` and `debhelper` on Beelink.

**`sp-plus-fin` is `Architecture: amd64` (D42).** It vendors a Node runtime, and upstream Node ships separate `linux-x64` and `linux-arm64` binaries with no architecture-independent build (§0). A package declaring `Architecture: all` while embedding one architecture's binary is mislabelled and would install on hardware it cannot run on.

The consequence is larger than one package and is stated here rather than buried: **while Fin ships in the base image, the SP+ Debian edition is amd64-only.** arm64 is not a supported target. That is a decision about today's hardware and today's enablement cost, not a statement about the architecture — Q20 owns when it is revisited, and carries the triggers that reopen it. An arm64 machine fails at boot rather than partway through installation, which is the safe failure and needs no recovery path.

The five remaining packages carry configuration, policy, scripts and branding, and are declared `Architecture: all`. That declaration is a requirement on their manifests, not a property this plan has verified — no manifests exist yet.

| Package | Required contents |
|---|---|
| `sp-plus-keyring` | Repository signing public keys, with two slots for rotation. |
| `sp-plus-base` | An `os-release` overlay with `ID=sp-plus`, `ID_LIKE=debian`, and `VERSION_ID`/`BUILD_ID` following the `projects/sp-plus/docs/ledger/RELEASES.md` scheme; APT sources in deb822 form for Trixie, Trixie updates, Trixie security, and `non-free-firmware`; no backports by default; APT pinning that blocks anything not from Debian or SP+; unattended-upgrades disabled; Timeshift configuration; zram. |
| `sp-plus-desktop` | Cinnamon defaults through dconf `local.d` and locks in the D25 spirit; branding; wallpapers; Firefox ESR `policies.json`; LibreOffice `.xcd`; printer, Bluetooth, and PipeWire tuning ported from `config/`. |
| `sp-plus-maintain` | The managed update path in §3; the evidence collector; the first-login service; the Welcome app; and the help app. |
| `sp-plus-fin` | Pinned Node 22 under `/usr/lib/sp-plus/node`; pinned pi; the Fin launcher; prompts, skills, and extensions. |
| `calamares-settings-spplus` | Installer configuration and branding described in §4. |

### 2.1 The shared Debian tree

The package and installer work uses one git tree:

```text
projects/sp-plus/debian/
├── packages/<name>/
├── live/
├── repo/
└── scripts/
```

`repo/` contains the `reprepro` configuration. `repo/` contains no keys. `live/` contains the live-build configuration. The package directories contain the six package trees.

`scripts/` contains the build and publication scripts. The tree is the ownership boundary for the Debian artifact lane. The tree does not contain copied Butterknife code, assets, branding, configuration, or repositories. Verified ideas and test cases may inform the work only through separate licensing and supply-chain approval.

### 2.2 Package versioning

Every package uses the same `BUILD_ID`. The `BUILD_ID` is also used in the SP+ base identity fields specified in `sp-plus-base`. The package version and ISO release records must remain aligned with the `projects/sp-plus/docs/ledger/RELEASES.md` scheme. The initial scaffold contains six empty-but-installable packages. “Empty-but-installable” describes the Phase 0 scaffold gate. It does not mean the Phase 0 scaffold has passed the later installer, update, recovery, or advisor gates.

### 2.3 `sp-plus-keyring`

`sp-plus-keyring` carries the public keys required to verify the SP+ APT repository. It provides two key slots for rotation. The two-key overlap is part of the repository trust design. Key generation for Phase 0 is performed offline. The package contains public keys, not repository configuration. Repository configuration remains under `repo/`.

### 2.4 `sp-plus-base`

`sp-plus-base` supplies the SP+ identity overlay.

The required identity values are:

- `ID=sp-plus`;
- `ID_LIKE=debian`;
- `VERSION_ID` according to the `projects/sp-plus/docs/ledger/RELEASES.md` scheme;
- `BUILD_ID` according to the same scheme.

The package supplies deb822 APT sources for:

- `trixie`;
- `trixie-updates`;
- `trixie-security`;
- `non-free-firmware`.

Backports are absent from the default configuration. APT pinning blocks sources outside Debian and SP+. Unattended-upgrades is disabled. The managed update path in `spplus-maintain` owns the supported operating-system transaction. `sp-plus-base` also supplies Timeshift configuration and zram. **It must additionally `Depends: timeshift`** — configuring a tool does not install it, and every recovery promise in §3 assumes the binary is present.

### 2.5 `sp-plus-desktop`

`sp-plus-desktop` supplies the Cinnamon desktop defaults. The dconf configuration uses `local.d` and locks in the D25 spirit. The package supplies SP+ branding and wallpapers. It supplies Firefox ESR `policies.json`.

It supplies the LibreOffice `.xcd` configuration. It carries the printer, Bluetooth, and PipeWire tuning ported from `config/`. The desktop package does not add a second desktop edition. It does not turn Wayland into a product promise.

### 2.6 `sp-plus-maintain`

`sp-plus-maintain` is the managed update path. Its sequence is defined in §3. It includes the evidence collector. It includes the first-login service.

It includes the Welcome app. It includes the help app. The advisor account reaches operating-system maintenance through this path. Direct `apt` and `dpkg` use by the advisor account is blocked by polkit and sudoers. Fin's approved actions also use this path.

### 2.7 `sp-plus-fin`

`sp-plus-fin` carries Fin separately from the Debian base transaction where practical.

Node 22 is pinned under:

```text
/usr/lib/sp-plus/node
```

pi is pinned. The Fin launcher, prompts, skills, and extensions are packaged with the Debian edition. D34 requires the vendored Node 22 and pinned pi to be SHASUMS-verified. npm is not on the machine. Fin remains off the critical path for the initial installer and package scaffold.

### 2.8 `calamares-settings-spplus`

`calamares-settings-spplus` contains the SP+-owned Calamares configuration. It contains the partition, mount, user, package, bootloader, and shell-process choices described in §4. It contains the branding configuration. It does not contain a custom installer implementation. The installer implementation remains stock Calamares 3.3.

## 3. Managed update and recovery (`spplus-maintain`)

`spplus-maintain` is the load-bearing Debian infrastructure. The wrapper owns the supported operating-system update path. The path is visible to the user through Welcome, help, notifications, and evidence. The path is fail-closed. Snapshot verification must precede every APT transaction in the managed path.

### 3.1 Trigger and cadence

**D41: the Debian lane keeps DN-30's cadence.** An earlier draft of this section described a weekly schedule and called it a verbatim reuse of DN-30; it was neither. DN-30 specifies a fortnightly stage keyed to ISO-week parity with the reboot on the Sunday two days later, and the table below now states that cadence. Christopher ruled on 2026-09-07 that DN-30 stands.

One thing genuinely does change, and it is not a cadence change. DN-30 makes the reboot conditional on a **staged bootc deployment**; on Debian there is no such object, so the restart is conditional on the **recorded result of the APT transaction** instead. The trigger is the Debian analogue of DN-30's, not a relaxation of it — the reboot still happens only when there is something to reboot into.

| Event | When | Debian action |
|---|---|---|
| Stage | **Every other Friday, even ISO weeks**, 15:00 | `apt-get -d dist-upgrade`, download only |
| Apply | **The following Sunday**, 04:00 | The sequence in §3.2, followed by conditional restart |

On Debian, “stage” means download only. On Debian, “apply” means the full sequence below. The stage command does not replace the apply sequence. The apply path creates and verifies the Timeshift snapshot before applying the APT transaction.

The scheduled path remains the supported path for the advisor account. Unattended-upgrades remains disabled. Direct package commands by the advisor account do not bypass this cadence or sequence.

### 3.2 Apply sequence

The sequence is ordered. A later step does not begin merely because an earlier command returned. The stated check for each step is part of the step.

| Order | Action | Required condition |
|---|---|---|
| 1 | Check free space. | At least `2× download + snapshot headroom` is available. |
| 2 | Create a Timeshift snapshot with `timeshift --create --comments "spplus BUILD_ID"`. | The create operation completes. |
| 3 | Verify the snapshot. | The snapshot exists and lists `@` and `@home`. |
| 4 | Apply `apt-get dist-upgrade`. | The verified snapshot check has passed. |
| 5 | Confirm kernel retention. | At least two bootable kernels remain; the specified `apt-mark hold` rule applies to `newest-1`. |
| 6 | Rebuild boot artifacts with `update-grub`. | The command completes after the kernel-retention check. |
| 7 | Write the update record. | A JSON record with `{build_id, snapshot_id, packages, result}` is written under `/var/lib/sp-plus/updates/`. |
| 8 | Notify. | The result is surfaced to the supported user-facing path. |
| 9 | Restart conditionally. | The restart follows the recorded result rather than ignoring a failed step. |

The snapshot verification is a distinct step. A Timeshift command returning is not sufficient evidence by itself. The verification must confirm both snapshot existence and the presence of `@` and `@home`. The APT transaction is not permitted before that verification.

The kernel check must confirm two bootable kernels. The maintenance path must not delete the kernel a snapshot expects. The boot-artifact step is `update-grub`.

The record belongs under:

```text
/var/lib/sp-plus/updates/
```

The record includes the `BUILD_ID`, snapshot identifier, package information, and result.

A failed result adds:

```text
degraded: true
```

The record is part of the evidence path.

### 3.3 Failure contract

If any step fails, the managed update stops. The failure is recorded with `degraded: true`. Welcome surfaces the condition in plain words. The system does not silently proceed as protected.

The sequence contains no `|| true`. The failure contract applies to the snapshot step. It applies to snapshot verification. It applies to the APT transaction.

It applies to kernel retention. It applies to `update-grub`. It applies to record writing. It applies to notification and the conditional restart path.

If snapshot creation fails, the managed update does not continue to the APT transaction. If snapshot verification cannot confirm `@` and `@home`, the managed update does not continue to the APT transaction. A degraded record is not a successful protected update. The Welcome app must state the degraded condition without requiring the advisor to interpret APT output, Btrfs subvolumes, or GRUB entries.

### 3.4 Privilege and action boundary

The daily advisor account does not use direct `apt` or `dpkg` commands for operating-system maintenance. Polkit and sudoers block those direct package operations for the advisor account. Fin's approved actions go through `spplus-maintain` only. Fin may explain the maintenance state.

Fin may diagnose the maintenance state. Fin may offer a signed, approval-gated action. Fin must not silently add a repository. Fin must not alter boot configuration.

Fin must not change encryption keys. Fin must not run arbitrary package commands. The user-facing path therefore exposes one supported maintenance route rather than a collection of package commands.

### 3.5 Evidence record

The Debian evidence report uses the state that the maintenance and recovery path already needs to inspect.

| Evidence area | Required report input |
|---|---|
| Package state | APT state |
| Local recovery | Timeshift snapshot list |
| Encryption | LUKS state |
| Secure Boot | `mokutil` state |

The report records sanitized evidence. The report does not retain the recovery key. The recovery key is not placed in the log, ISO, or installed system. The evidence collector is part of `sp-plus-maintain`.

Fin can explain the report and guide the supported next action. The evidence report does not authorize an action by itself. An action remains signed and approval-gated.

### 3.6 Recovery operations

D33 defines recovery as Timeshift restore from a running system or from the SP+ USB. The help corpus uses three named operations.

| Operation | Starting point | Action |
|---|---|---|
| **Undo last update** | Running installed system | Timeshift restore |
| **Rescue restore** | SP+ USB | Boot the SP+ USB and perform a Timeshift restore |
| **Backup** | External storage | Separate external backup operation; not v1 |

These operations are separate. A local snapshot is not an external backup. An external backup is not a snapshot boot path. A permanent restore is not a boot-menu selection.

The plan contains no snapshot boot menu. The supported recovery choices are the two Timeshift restore paths and the separately named external-backup future path. Phase A must prove the permanent restore path from the SP+ USB. The USB restore path is part of the installer and recovery gate, not a later support assumption. Q18 remains open: the Timeshift restore experience for a non-technical user from the live USB. The help corpus must not treat Q18 as resolved before that workflow is tested.

### 3.7 Kernel and initramfs consistency

`/boot` is outside the Btrfs snapshots. The update and recovery rules must account for that boundary.

The rule is:

> Never delete the kernel a snapshot expects.

The documented failure mode is restoring `@` from an older state while the running system's kernel modules are from a newer state. The documented fix is to reinstall the kernel meta-package from rescue. The fix belongs in the rescue guidance. The kernel-retention check in §3.2 is part of preventing that failure mode.

The recovery procedure must not assume that restoring `@` also restores `/boot`. The installer, maintenance path, and help corpus must use the same wording for the `/boot` boundary. The later initramfs decision is not made in Gate A. Q16 remains open: dracut versus initramfs-tools as the product default for Gate B.

### 3.8 User-facing recovery language

The advisor sees named actions.

The advisor is not asked to reason about:

- Btrfs subvolumes;
- package suites;
- PCRs;
- GRUB entries;
- snapshot identifiers.

Welcome reports whether protection is available or degraded. Help distinguishes **Undo last update**, **Rescue restore**, and **Backup**. Fin explains the state before offering an action. Fin asks before an action.

Fin states what the action will change. Fin verifies the result. Fin records only sanitized evidence.

## 4. Installer (`calamares-settings-spplus` + live-build)

The Debian installer is a stock Calamares 3.3 configuration owned by SP+. D32 excludes custom installer code. The installer configuration and live-build configuration are separate inputs to the ISO. The product installation path is UEFI-first.

### 4.1 live-build configuration

The live-build input uses the following settings.

| Input | Required value |
|---|---|
| Distribution | `--distribution trixie` |
| Archive areas | `--archive-areas "main non-free-firmware"` |
| Debian installer | `--debian-installer none` |
| Bootloader | `--bootloaders grub-efi` |
| BIOS support | BIOS only if trivial; UEFI is the product |
| Boot components | Stock signed shim, GRUB, and kernel |
| Package list | Cinnamon task, all six §2 packages, and Calamares |
| Cache | Pinned by a `snapshot.debian.org` date for reproducibility |

The package list is the Cinnamon task plus the §2 package set and Calamares. The installer is not built from a captured installed disk. The ISO is built from the live-build configuration and package inputs. The signed Debian boot components remain the supported boot chain.

A custom kernel is not added. Out-of-tree kernel modules are not added to the supported profile. The UEFI path is the product path. BIOS support is considered only if it is trivial. The cache date must be recorded as part of the reproducibility input.

### 4.2 Calamares target layout

Calamares owns the target layout through the specified configuration files. **Every setting in the table below is an override.** Stock Calamares 3.3 defaults to LUKS1 and ext4, and `calamares-settings-debian` ships no `partition.conf` at all and no `btrfsSubvolumes` in its `mount.conf` — so Debian's stock installer inherits those upstream defaults (§0). Nothing in the SP+ storage design is obtained by installing an existing package and accepting what it does.

This is the substance of D32. The work is *settings-package configuration*, not writing installer code: `calamares-settings-spplus` supplies the module configuration that stock Calamares then executes. That distinction is what keeps the maintenance burden bounded, and it is also why the layout below is unproven until Gate A actually installs it. A configuration file asserting `luks2` is not evidence that the installed target is LUKS2; `cryptsetup luksDump` on the installed machine is.

The delta from stock, stated plainly:

| Setting | Debian stock behaviour | SP+ requires |
|---|---|---|
| LUKS generation | `luks1` | `luks2` |
| Root filesystem | `ext4` | `btrfs` |
| Btrfs subvolumes | `/@` and `/@home` only (code fallback — see §0) | five, mapped explicitly below |

**Subvolume names alone are not a configuration.** `mount.conf` takes `{mountPoint, subvolume}` pairs, and a bare list of names does not tell an implementer where anything mounts. The required entries are exactly:

| `subvolume` | `mountPoint` |
|---|---|
| `/@` | `/` |
| `/@home` | `/home` |
| `/@var_log` | `/var/log` |
| `/@var_cache` | `/var/cache` |
| `/@var_tmp` | `/var/tmp` |

Stock Calamares creates and mounts arbitrary subvolume entries when root is Btrfs, so **this layout needs no custom module and no installer code** — which is what makes D32 achievable. What it does need is for `calamares-settings-spplus` to *own* the files in `/etc/calamares/modules/`. Calamares does not merge configuration from two settings packages; the SP+ package must therefore declare the appropriate `Conflicts`/`Replaces` against `calamares-settings-debian`, and Phase 0 must verify which configuration actually loaded rather than assume the SP+ one won.

Timeshift's documented Btrfs support is written around `@` and `@home`, and the three additional subvolumes are separately mounted — so restoring a snapshot of `@` does **not** by itself establish rollback semantics for `/var/log`, `/var/cache` or `/var/tmp`. Combined with `/boot` living outside Btrfs entirely, "restore" needs its semantics defined before it can be promised. This is Phase C gate work, not an assumption this section may make.

| Configuration | Required setting |
|---|---|
| `partition.conf` encryption | `luksGeneration: luks2` |
| `partition.conf` filesystem | `defaultFileSystemType: btrfs` |
| Disk selection | Erase-disk only |
| Partition modes | No manual or replace mode; no dual boot, following D19 |
| Encryption control | Pre-checked and locked on |
| Boot partitions | Separate unencrypted EFI System Partition and ext4 `/boot` |
| `mount.conf` subvolumes | `@ @home @var_log @var_cache @var_tmp` |
| `mount.conf` mount options | `compress=zstd:1 noatime` |
| `users.conf` account count | Single user |
| `users.conf` login | Autologin off |
| `users.conf` privilege | Sudo group |
| `packages.conf` | Remove live-only packages |
| `bootloader.conf` | `grub-efi` |
| `shellprocess` | Run `spplus-firstboot-prepare` |

The erase-disk-only rule implements the no-dual-boot direction. Manual partitioning is not part of the supported installation path. Replace-partition mode is not part of the supported installation path. The encryption checkbox is on when the installer opens. The encryption checkbox cannot be turned off.

The product wording is:

> encrypted system and user-data volume with unencrypted boot partitions

The product wording does not claim encryption of every byte. The EFI System Partition is unencrypted. `/boot` is unencrypted ext4. The system volume is LUKS2-encrypted Btrfs.

The Btrfs subvolumes are:

- `@`;
- `@home`;
- `@var_log`;
- `@var_cache`;
- `@var_tmp`.

The mount options are:

```text
compress=zstd:1 noatime
```

The user configuration creates one user. Autologin is off. The user is in the sudo group. The advisor's direct APT and dpkg path is still blocked by the policy in §3. `packages.conf` removes packages needed only by the live environment. `bootloader.conf` selects `grub-efi`. That value names the bootloader family, **not** Debian's signed-shim chain; the exact signed packages on the installed target, and a post-install boot test with Secure Boot still enabled, are required by the Secure Boot decision in §5. Signed boot components being present on the live medium is not proof that the installed system uses them.

### 4.3 Recovery-key timing

The installer creates the permanent LUKS passphrase during installation. Recovery-key generation is first login, not installer execution.

The `shellprocess` job runs:

```text
spplus-firstboot-prepare
```

The first-login service handles the first-login path. The recovery key is generated, shown once, and confirmed at first login. Calamares cannot safely show a recovery key once during installation under the D8 rule. The key is not retained in logs.

The key is not retained in the ISO. The key is not retained in the installed system. The first-login path must therefore be part of the Gate A test.

### 4.4 Branding

Branding uses:

```text
branding.desc
```

Slides come from:

```text
branding/
```

The branding package supplies SP+ branding and wallpapers. Debian logos are not used. The trademark hygiene follows the D17 and D26 direction. Butterknife branding is not used. Butterknife configuration is not used as an implementation dependency.

### 4.5 ISO acceptance

ISO acceptance follows the existing `tests/preflight-gate.sh` pattern.

| Acceptance check | Required result |
|---|---|
| Signature | The ISO signature is checked |
| SHA-256 | The ISO SHA-256 is checked |
| ISO manifest | An `xorriso -indev` manifest is checked |
| Firmware path | The ISO boots in QEMU under OVMF Secure Boot with Microsoft variables |
| Secure Boot interaction | No MOK prompt appears |
| Product boot path | The UEFI path remains enabled throughout the test |

The acceptance check does not replace the installation gate. A signed ISO that does not install the target layout has not passed. A manifest that does not match the intended package input has not passed. A BIOS-only result does not pass the UEFI product gate. A path that requires firmware changes or MOK enrollment is outside the supported hardware list until a product-approved path exists.

### 4.6 Hardware enablement and firmware

Advisors buy the laptop they buy. HP business and consumer models are common in this market, and the machine that arrives is chosen by a purchasing decision SP+ does not control. A product that installs cleanly in a virtual machine and cannot bring up wireless on the advisor's actual laptop has not shipped.

**Enabling an archive area is not installing firmware.** §2 puts `non-free-firmware` in the deb822 sources, and earlier drafts of this plan treated that as the hardware story. It is not. The archive area makes firmware packages *available to install*; it does not place a single firmware file in the live image or on the installed system. Those are separate acts and each needs its own package list.

The distinction has a sharp consequence. If the live ISO does not itself carry wireless firmware, then on a laptop whose only network is that wireless chip, **the installer boots with no network at all**. Every step that assumes connectivity — fetching packages, reaching the SP+ repository, validating the keyring against a live source — fails on exactly the hardware this section exists to support. The installation must therefore be self-sufficient: everything the target needs is on the medium before it boots.

**Firmware packages, verified present in Trixie 2026-09-07.** Versions are `20250410-2` unless noted.

| Coverage | Package |
|---|---|
| Intel wireless | `firmware-iwlwifi` |
| Realtek wireless | `firmware-realtek` |
| Qualcomm / Atheros wireless | `firmware-atheros` |
| Broadcom / Cypress wireless | `firmware-brcm80211` |
| MediaTek wireless | `firmware-mediatek` |
| Intel audio DSP | `firmware-sof-signed` (2025.01-1) |
| Bluetooth | `bluez-firmware` (1.2-13) |
| AMD / Intel graphics | `firmware-amd-graphics`, `firmware-intel-graphics` |
| NVIDIA discrete graphics (nouveau) | `firmware-nvidia-graphics` |
| Miscellaneous kernel drivers | `firmware-misc-nonfree` — Debian's catch-all collection; omitting it leaves gaps that are hard to predict per model |
| Older Marvell/NXP 88W8xxx wireless | `firmware-libertas` |
| CPU microcode | `intel-microcode` / `amd64-microcode` — **a policy decision, not an oversight**: these carry security fixes and are accepted or rejected explicitly in the firmware decision in §5, never left undecided |

**Explicitly excluded: `firmware-b43-installer` and `firmware-b43legacy-installer`.** These are firmware *installer* packages: they carry no usable offline payload and depend on `wget` to fetch the firmware during installation. They cannot work in the offline case above, and a package that silently requires connectivity in an installer designed to work without it is worse than an unsupported chipset — it fails late, in front of the advisor, with no clear cause. Older Broadcom b43 hardware is therefore **outside the supported hardware list** until a package-complete path exists.

**How firmware actually reaches the target.** Calamares' `unpackfs` module copies the live filesystem into the target root, so firmware present in the live squashfs normally *does* reach the installed system. An earlier draft of this section claimed the two never inherit from each other; that is wrong as a mechanism. The flow is one-directional: live to target, never target to live.

That makes the requirement narrower and more precise than "maintain two lists":

1. declare the firmware set in the live-build configuration, so it is in the squashfs;
2. ensure nothing in the target-install path removes it — `packages.conf` strips live-only packages, and firmware must not be caught by that;
3. verify after first reboot that the firmware packages and files are actually present on the installed system.

Step 3 is the one that matters, because steps 1 and 2 are assertions and only step 3 is evidence.

**What is not yet established.** The package list above is the coverage Debian offers, not proof that any specific machine works. No SP+ document currently names a single HP model, and no chipset in any advisor's actual laptop has been mapped to a package. That mapping is the substance of the hardware decision in §5, and until it exists the supported hardware list is empty rather than broad.

**The firmware gate.** Phase A does not pass on a virtual machine alone. On at least one real target laptop, all of the following must be observed and recorded:

| # | What must be proven | What counts as passing |
|---|---|---|
| 1 | Wireless in the **live session**, before installation | Associates to WPA2/WPA3, gets a DHCP lease, resolves a name, and completes an HTTPS fetch |
| 2 | Installation with **no network at all** | No Ethernet carrier and no wireless association for the whole run; installation completes; the firmware package and its files are present on the target afterwards |
| 3 | Wireless and Bluetooth on the installed system after first reboot | Wireless as row 1. Bluetooth discovers a device, pairs, and carries real traffic — audio or input |
| 4 | Audio and microphone | Playback through the internal speakers, capture from the internal microphone, and correct default device selection after a reboot. Video-call readiness, not a test tone |
| 5 | Suspend and resume | Returns to a working desktop with wireless re-associated, audio working, and the LUKS volume still mounted. Recorded for both lid-close and idle suspend |
| 6 | Storage and UEFI boot | The specific NVMe/SATA controller and device recorded; install and reboot succeed; LUKS unlock succeeds; Secure Boot enabled with no MOK enrolment, evidenced by `mokutil --sb-state` |
| 7 | Firmware update path | `fwupdmgr refresh` retrieves LVFS metadata and `fwupdmgr get-devices` reports at least one device as updatable or explicitly unsupported. Enumeration alone is not a pass |
| 8 | Input and display | Touchpad and keyboard including function keys; internal display; one external display over the machine's native output; one USB-C dock if the model has one |
| 9 | Power | Battery level and charge state report correctly; the machine runs on battery through a suspend/resume cycle |
| 10 | Wired Ethernet | Link, DHCP and an HTTPS fetch, on the built-in port or the dock if there is no built-in port |
| 11 | Camera | Captures an image in a normal application |
| 12 | **Hardware recorded in the ledger** | Model, and the identifiers from `lspci -nn` and `lsusb` for wireless, Bluetooth, audio, GPU, storage, camera and dock controller, each mapped to the firmware package supplying it |
| 13 | Behaviour when firmware is **absent** | A named component reports the missing firmware to the user in the SP+ evidence path — not only in `dmesg`. The test removes a firmware package deliberately and observes what the advisor would see |

Row 12 is what turns a passing test into a supported-hardware entry. A model that has not been through this table is not supported; it is untested, and the two must never be reported as the same thing.

## 5. Phases and gates

The phases are sequential. Each phase blocks the next. There is no overlap, following D18. A later gate cannot be passed by inference from Butterknife, Fedora, or a BIOS-only virtual machine.

The phase table is:

| Phase | Deliverable | Gate |
|---|---|---|
| 0 Scaffold | `debian/` tree, 6 empty-but-installable packages, repository signing key generated offline, `build-live.sh`, `build-packages.sh`, `publish-repo.sh` that refuses unsigned or older artifacts and mirrors `publish-image.sh` | Packages install on a stock Trixie VM; the repository verifies from a second VM |
| A Installer + encryption + recovery | Live ISO installs unattended-by-config into a disposable OVMF Secure Boot VM with no TPM | Document 11 Gate A: LUKS2 passphrase, first-login recovery key shown once and works, Secure Boot stays on, no MOK, Timeshift snapshot and permanent restore from the SP+ USB proven, `mokutil --sb-state` and `cryptsetup luksDump` recorded |
| B TPM2 | initramfs implementation per Q16, plus `systemd-cryptenroll --tpm2-pcrs` policy | Document 11 Gate B; if it fails, Gate A stands |
| C Managed update | `spplus-maintain` end to end on the Gate A VM | Document 11 Gate C: fail-closed behavior proven by deliberately breaking snapshot creation; record written; two kernels retained; DN-30 timers fire |
| D Advisor workflow | Fin, Welcome, help, evidence, Firefox ESR PWAs, and the LibreOffice parity gate ported; bare metal on HW-00 Dell | Document 11 Gate D; Christopher uses it |
| E Release lane | R2 hosting, portal download, mile-marker tagging, quarterly ISO | The first external machine updates from R2 |

### 5.1 Phase 0 — Scaffold

Phase 0 creates the Debian support tree.

The deliverable is:

- `projects/sp-plus/debian/`;
- six empty-but-installable packages;
- the offline-generated repository signing key;
- `build-live.sh`;
- `build-packages.sh`;
- `publish-repo.sh`.

`publish-repo.sh` refuses unsigned artifacts. `publish-repo.sh` refuses older artifacts. Its refusal behavior mirrors `publish-image.sh`. The package build uses `dpkg-deb` and `debhelper`.

The package set is `Architecture: all` except `sp-plus-fin` (§2). All six packages use the same `BUILD_ID`. The live-build configuration is present in `live/`. The repository configuration is present in `repo/`.

The repository configuration contains no keys. The script and package trees are present in `scripts/` and `packages/<name>/`. D32 is a quality gate before the installer build. The expert-AI panel must review the durable stock-Calamares decision before that build begins. Christopher's approval is also required before Phase 0 begins. The Phase 0 gate has two checks.

| Check | Required result |
|---|---|
| Package installation | The six packages install on a stock Trixie VM |
| Repository verification | The repository verifies from a second VM |

A package installation result is not an installer gate. A repository verification result is not a recovery gate. Phase 0 is complete only when both listed checks have evidence.

### 5.2 Phase A — Installer, encryption, and recovery

Phase A uses a disposable OVMF Secure Boot VM with no TPM. The live ISO installs unattended-by-config into that VM. The test begins with Secure Boot enabled. The test does not use a firmware-change workaround. The test does not use MOK enrollment.

The Gate A checklist is:

| Requirement | Required evidence |
|---|---|
| Encryption mode | LUKS2 passphrase path |
| Recovery key | First-login key shown once and works |
| Secure Boot | Secure Boot remains enabled |
| Firmware and enrollment | No firmware change and no MOK |
| Local recovery | Timeshift snapshot exists |
| Permanent restore | Permanent restore from the SP+ USB is proven |
| State records | `mokutil --sb-state` and `cryptsetup luksDump` are recorded |

The installed layout must match the Calamares configuration. The system and user-data volume uses the stated LUKS2 and Btrfs layout. The unencrypted boot partitions remain outside that encrypted volume. The first-login recovery key path must be exercised.

The recovery key must not appear in the logs, ISO, or installed system after the test. The Timeshift snapshot must be tested. The permanent restore must start from the SP+ USB. A successful boot in a BIOS-only VM does not pass Phase A.

A Fedora result does not pass Phase A. A Butterknife result does not pass Phase A. If any required Gate A result is missing, Phase B does not begin.

### 5.3 Phase B — Later unlock experiment

Phase B is the later TPM2 experiment.

The planned implementation is a dracut swap with:

```text
systemd-cryptenroll --tpm2-pcrs
```

Q15 is the Fedora PCR-policy question and does not govern this lane. The Debian question is **Q16**: dracut versus initramfs-tools as the product default. The dracut requirement is recorded as UNVERIFIED in §0, so Phase B begins by settling Q16 with a test, not by assuming its answer.

The Phase B tests are:

- enrollment through the chosen initramfs path;
- normal unlock;
- failed TPM unlock;
- passphrase fallback;
- recovery-key fallback;
- kernel update;
- firmware-state change.

Phase B does not replace the passphrase. Phase B does not replace the recovery key. If Phase B fails, TPM stays out of the product. Gate A remains valid if Gate B fails. The Gate B result cannot weaken the Gate A installation and recovery path.

### 5.4 Phase C — Managed update and recovery

Phase C runs `spplus-maintain` end to end on the Gate A VM. The test uses the actual sequence in §3. The test uses the DN-30 timers. The test deliberately breaks snapshot creation.

The expected result of that deliberate break is fail-closed behavior. The APT transaction must not proceed as protected after the snapshot failure. The degraded record must be written. Welcome must surface the degraded state in plain words.

The test also verifies:

- the update record;
- the snapshot identifier;
- the package information;
- the result;
- the two-kernel retention rule;
- the `update-grub` step;
- the conditional restart;
- the DN-30 stage timer (even ISO weeks, Friday 15:00) and the apply-plus-restart timer on the following Sunday at 04:00.

**Doc 11's Gate C requires four cases that a single deliberate snapshot break does not cover.** They are part of this test, not deferred:

| Case | Set up by | Passes when |
|---|---|---|
| No snapshot exists | Delete all snapshots before the run | The update refuses to proceed and says *no snapshot*, distinctly from the case below |
| Snapshot exists but restore fails | Corrupt or remove the snapshot's backing subvolume, then attempt restore | The failure is reported as a **failed restore**, in different words from *no snapshot*. A user who cannot tell these apart cannot act on either |
| Disk pressure | Fill the filesystem to the point where a snapshot cannot be created | The update refuses before the APT transaction, not partway through it |
| Snapshot headroom | Run with free space above and below the configured threshold | The threshold is enforced, and the machine reports which side of it it is on before an update is attempted |

The distinction in row 2 is the substance of doc 11's requirement. "Recovery unavailable" is not an acceptable message for either case.

D36 is the managed-update rule:

> Snapshot verification precedes any APT transaction, and the managed update is fail-closed.

The Phase C gate does not accept a passing update that silently bypasses snapshot verification. The Phase C gate does not accept a passing update that deletes the kernel a snapshot expects. The Phase C gate does not accept a passing update that omits the record.

### 5.5 Phase D — Advisor workflow and supportability

Phase D moves from the disposable VM to supported hardware. The bare-metal test target is HW-00 Dell.

The workflow gate covers:

- Wi-Fi;
- Bluetooth;
- printing;
- external display;
- suspend;
- camera;
- audio and video calls;
- Firefox ESR browser workflows;
- PWA workflows;
- LibreOffice document fidelity;
- Fin's bounded help behavior;
- Fin's evidence behavior.

The supported application profile must be tested through the same package, browser, portal, printing, camera, audio, and file-access boundaries intended for the advisor workflow. A model is added to the supported-hardware list only after its evidence is recorded. The hardware list is not inferred from a VM result. The hardware list is not inferred from a different Dell model. Christopher uses the result. The Gate D result therefore includes the advisor workflow rather than only an installation result.

### 5.6 Phase E — Release lane

Phase E supplies the release lane.

The deliverable includes:

- R2 hosting;
- portal download;
- mile-marker tagging;
- quarterly ISO production.

D35 records that Debian artifacts are built on Beelink with reproducibility gates and published to Cloudflare R2. CI is deferred to Phase E. The tension with D20 remains explicit. This plan does not resolve that tension by introducing CI earlier.

The Phase E gate is the first external machine updating from R2. The external-machine test covers the published repository path rather than only the local repository verification in Phase 0. The ISO download path and APT update path are separate release checks. A portal download does not by itself prove that an external machine can update. An external update does not by itself prove that the quarterly ISO acceptance checks pass.

### 5.7 Gate handoff rule

A phase is complete only when its listed gate has evidence. The next phase does not begin before that gate passes. A failure is recorded against the current phase. A later phase cannot be used to excuse a missing earlier result.

If Gate B fails, Gate A remains the product baseline. If Gate C fails, the managed update path remains unapproved. If Gate D fails, the hardware and advisor workflow remain outside the supported profile. If Gate E fails, the release lane remains unapproved.


### 5.8 Decisions that must be owned before their phase begins

Two audits on 2026-09-07 (`docs/ledger/AUDIT-2026-09-07-doc12-bee.md` and `docs/ledger/AUDIT-2026-09-07-doc12-terra.md`) found parts of this plan that named an outcome without naming who decides it or what would prove it.

**Design blocks the start; evidence blocks the finish.** An earlier draft said every row below blocks its phase from beginning, which was circular for the rows whose evidence that phase produces — a hardware matrix cannot block the phase that populates it. The rule is therefore split: the **design** column blocks the phase from starting, the **evidence** column blocks it from being called complete.

| # | Decision | Owner | Design blocks start of | Evidence blocks completion of |
|---|---|---|---|---|
| 1 | **Storage implementation** — the SP+ `mount.conf`/`partition.conf` content, package ownership against `calamares-settings-debian`, and which configuration actually loads. D32 already decides LUKS2 and the five subvolumes; this is implementation and proof | Claude, ratified by Christopher | Phase 0 | Phase A — `cryptsetup luksDump` and `btrfs subvolume list` on the installed target |
| 2 | **TPM2 contract** — the initramfs implementation (Q16). §0 records the dracut requirement as UNVERIFIED and doc 06's Q16 text must stop asserting it | Christopher | Phase B | Phase B — unlock, recovery fallback, re-enrolment and a kernel update on a clean target |
| 3 | **Recovery lifecycle** — when the key is generated, where the only readable copy exists, what "not stored on disk" means given that a LUKS2 recovery credential *is* an enrolled keyslot, and what recovery means before first login | Christopher | Phase A | Phase A — an observed recovery on a machine whose passphrase is unknown |
| 4 | **Secure Boot chain** — the target needs `shim-signed`, `grub-efi-amd64-signed`, the unsigned GRUB support binaries and Debian-signed kernels, with the ESP populated. `grub-efi` names a family, not a chain | Claude | Phase A | Phase A — post-install boot, Secure Boot on, no MOK, via `mokutil --sb-state` |
| 5 | **Firmware scope** — the accepted package list including the microcode policy. D39 already decides that firmware is carried in both live image and target | Christopher | Phase 0 | Phase A — §4.6 gate rows 1–13 on real hardware |
| 6 | **Hardware matrix** — which HP models SP+ will support, and the test plan for each | Christopher | Phase A (the *list* of target models) | Phase D (a ledger row per model, per D40) |
| 7 | **APT trust contract** — `Signed-By` binding, keyring bootstrap during installation before any network update, pin priorities, and fail-closed behaviour when the SP+ repository is unreachable | Christopher | **Phase 0** — Phase 0 verifies the repository from a second VM and cannot do so without this | Phase C — a real APT transaction, plus a fail-closed test with the repository deliberately unavailable |
| 8 | **R2 as an APT origin** (Q19) — `InRelease` caching, freshness and TLS behaviour. Separable from row 7 and genuinely later | Christopher | Phase E | Phase E |
| 9 | **CI authority** — whether the Beelink may produce *release* artifacts or only development builds. D20 says CI is non-reversible; D35 authorises Beelink builds. One of them governs release artifacts before Phase E and the plan does not say which | Christopher | Phase 0 | Phase E |
| 10 | **Snapshot acceptance matrix** — the three additional subvolumes, `/home`, `/boot`, TPM state, failed restores, absent snapshots and disk pressure. Doc 11 Gate C requires disk-pressure limits and distinguishing "no snapshot" from "snapshot exists but restore failed"; §5.4 must *execute* these, not merely list them here | Claude | Phase C | Phase C |
| 11 | **Release terminology** — which artifact is promoted, signed, tested and rolled back when this plan says "release": the ISO, the repository, or both | Christopher | Phase E | Phase E |
| 12 | **Package manifests** — the six packages' actual contents and declared architectures, including `timeshift` as a real dependency rather than a configured assumption | Claude | Phase 0 | Phase 0 |

Rows marked **Claude** are drafted by Claude and ratified by Christopher; rows marked **Christopher** are his to decide and cannot be inferred from the plan.

Resolved since the first draft of this table: the update cadence is D41 (DN-30 stands) and the Fin package architecture is D42 (`amd64`). Both were open here and are now decisions of record.

None of these is a research task to be deferred indefinitely. Each has a phase attached, and the phase is the deadline.

## 6. Support obligation, Debian edition

Debian point releases, approximately two-monthly, and Trixie's support window — full support to **2028-08-09**, LTS to **2030-06-30** (§0) — replace Fedora's six-month bump. The plan treats this as the cheaper cadence. The cadence is not a removal of support work. The Debian edition still requires an owned package, installer, update, release, hardware, and discontinuation process.

### 6.1 Standing calendar

| Cadence or event | Required work |
|---|---|
| Approximately two-monthly Debian point release | Track the Debian point-release event against the supported package and ISO process |
| Monthly | `debsecan` and DSA review |
| Quarterly | ISO rebuild |
| Annual | Signing-key rotation |
| Trixie to Forky | Migration rehearsal owned like D28 |
| Discontinuation | Apply the discontinuation plan from document 04 §9 unchanged |

The point-release cadence replaces the Fedora six-month bump in this plan. The quarterly ISO rebuild remains a standing obligation. The annual key rotation uses the two-key overlap in `sp-plus-keyring`. The Trixie-to-Forky rehearsal is not an implicit migration. It is an owned rehearsal following D28. The discontinuation plan from document 04 §9 applies unchanged.

### 6.2 Maintained support surfaces

| Surface | Required maintenance |
|---|---|
| Package manifest | Maintain the declared Debian and SP+ package inputs |
| Installer configuration | Maintain live-build and `calamares-settings-spplus` inputs |
| Signing | Maintain repository keys, two-key overlap, and verification |
| Release process | Maintain build, publication, tagging, portal, and ISO steps |
| Snapshot and update tooling | Maintain `spplus-maintain`, verification, records, and recovery guidance |
| Supported hardware | Maintain the evidence-backed hardware list |
| Security cadence | Maintain the `debsecan` and DSA review |
| Testing | Maintain the phase and gate evidence |
| Support guidance | Maintain Welcome, help, recovery, and Fin behavior |
| Discontinuation | Maintain the document 04 §9 path |

A Debian distribution is not complete when only the ISO exists. The package manifest, repository, maintenance path, recovery path, evidence path, and support guidance remain part of the edition. Support scope follows the evidence-backed hardware list. The product does not make unsupported security or compliance claims.

### 6.3 Ongoing work this plan creates

The audits found the support accounting understated. These are recurring obligations, not one-time build tasks, and each lands on Secure Prospective:

| Obligation | Cadence |
|---|---|
| Per-model firmware and kernel regression after Debian security and firmware updates | Every point release, and any firmware package update |
| LVFS/fwupd metadata, update, rollback and Secure Boot interaction testing | Per supported model, per release |
| Signing-key **emergency** revocation and re-keying — not only scheduled rotation | Procedure maintained continuously; exercised annually |
| Node and `pi` security and compatibility maintenance, **outside Debian's security stream** | Continuous. This is the debt D34 creates and it does not shrink |
| Reproducibility inputs: `snapshot.debian.org` availability and build-dependency expiry | Per build |
| Calamares and live-build update testing, and installer migration when Debian moves | Per Debian release, and on Calamares major versions |
| ISO security refresh when a fix cannot wait for the quarterly rebuild | Trigger-based — a quarterly rebuild alone ships new installers carrying known-fixed vulnerabilities |

The last row is a gap rather than a cadence: the trigger that forces an out-of-band ISO rebuild is not yet defined, and belongs with the release terminology decision in §5.8.

## 7. Tech-debt boundaries

This plan refuses the following shortcuts. The boundaries are product constraints, not unowned future work.

| Boundary | Refusal |
|---|---|
| Butterknife implementation | No Butterknife fork, copied code, copied assets, copied branding, copied configuration, or `butterrepo` implementation dependency |
| Debian identity | No Mint/Ubuntu hybrid and no replacement of Fedora today |
| Debian suites | No Debian Testing/Forky or Sid in the supported profile |
| APT sources | No Mint repositories, Ubuntu repositories, PPAs, or generic third-party APT repositories |
| Default browser | No Brave as a default browser; no Brave before Q1 evidence |
| Snapshot boot | No snapshot boot menu |
| Recovery integration | No `grub-btrfs`; recovery is Timeshift restore from a running system or the SP+ USB |
| Gate A kernel path | No custom kernel or dracut in Gate A |
| Automation | No CI before Phase E (D35); the Phase D boundary stated in an earlier draft was wrong; CI is deferred to Phase E |
| Desktop session | No Wayland product promise |
| Desktop editions | No GNOME edition |
| Hardware profile | No per-machine artistry |
| Package surface | Package count is capped; add a package only against a document 1 §2 outcome |

The Debian path starts from stock Debian and original SP+ work. The Fedora/KDE path remains active. The Debian path does not pause or rewrite Fedora merely because the Debian path is promising. The package count remains bounded until a documented product outcome requires an addition.
