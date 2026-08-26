# SP+ — Parallel Review and Debate Record

**Document 7 of the SP+ planning set (supporting record).**
Date: 2026-08-25.

Two agents researched the same question independently and simultaneously, without seeing
each other's work:

- **Claude (Opus 5)** on Beelink, which also wrote documents 1 through 6.
- **Bee (Pi, `gpt-5.6-luna`, thinking `max`)**, run from `~/run-bee-spplus.sh` against the
  brief at `~/.pi/agent/spplus-brief-A.md`. Its 80 KB report is at
  `~/.pi/agent/spplus-A.out` and is the primary source for everything attributed to Bee
  below.

The point of running two passes was to find the places where a confident answer was
actually a guess. It found four, and three of them changed the plan.

---

## 1. Where the two analyses agreed independently

Convergence from two different starting points is the strongest signal in this document.
Both concluded, without coordination:

- **bootc image mode is the right architecture**, with rpm-ostree as an obsolescing
  variant of the same idea and classic package mode as the fallback.
- **Golden-image capture must be rejected as a shipping mechanism**, for the same
  reasons and in the same order: duplicated LUKS header and unlock material, captured
  machine identity, no reproducibility, no update channel. Bee added that a TPM
  enrollment captured from the prototype is bound to the *prototype's* TPM, which is a
  sharper way of putting it than document 2 had.
- **Fedora's signed shim, GRUB, and stock kernel must be used unchanged**, and
  **no out-of-tree kernel modules in v1**, because MOK enrollment is a physical reboot
  into a firmware screen and that is not an experience this user survives.
- **The ISO can never contain the encryption secret.** LUKS2 is created on the user's
  machine with the user's passphrase during installation.
- **TPM2 enrollment and recovery-key generation are first-boot steps on the target
  machine**, never build-time and never installer-time.
- **A passphrase keyslot is retained permanently** as the fallback when PCR state
  changes.
- **Two images, one per desktop.** Never one ISO that asks the advisor to choose KDE or
  GNOME.
- **Cosign-signed OCI images with an enforced container signature policy**, and a signed
  ISO checksum, and these are four separate signing concerns that must not be conflated.
- **Fedora Remix, not Fedora Spin.** Replace `fedora-logos`, `fedora-release`, and
  `fedora-release-notes`.
- **Brave's native RPM over its Flatpak**, and browser policy at
  `/etc/brave/policies/managed/`.
- **Declaring success because an ISO file exists is the central anti-pattern.**

---

## 2. Disagreement 1 — which base image? **Resolved by evidence, Claude's position held**

**Claude's position (documents 2–3):** derive from the official Fedora Atomic Desktop
bootc images, `quay.io/fedora/fedora-kinoite:44` and
`quay.io/fedora/fedora-silverblue:44`, so Fedora maintains the desktop and SP+ maintains
only its delta.

**Bee's position:** build from `quay.io/fedora/fedora-bootc:44` plus a separate
`spplus-installer` image, on the grounds that it gives "a cleaner OCI source of truth and
fewer inherited desktop assumptions." Bee located the Atomic Desktop images at a
*different* address — `quay.io/fedora-ostree-desktops/kinoite:44` — and listed the
choice as an unresolved disagreement in its own report (its open question 14).

**How it was settled.** The registry was queried directly for the image config labels:

```
quay.io/fedora/fedora-kinoite:44  (amd64 manifest)
  containers.bootc              = 1
  ostree.bootable               = true
  ostree.linux                  = 7.1.10-200.fc44.x86_64
  org.opencontainers.image.version = 44.20260826.0
```

That settles it. `quay.io/fedora/fedora-kinoite:44` is bootc-compatible
(`containers.bootc=1`), bootable, carries a Fedora 44 kernel, and was rebuilt within the
last day — it is actively maintained, not a stale artifact. The
`quay.io/fedora-ostree-desktops/kinoite:44` tag Bee found is also current (last modified
2026-08-26); both namespaces are live, and `quay.io/fedora/` is the same namespace
convention `fedora-bootc` uses.

**Consensus:** derive from `quay.io/fedora/fedora-kinoite:44` and
`quay.io/fedora/fedora-silverblue:44`. Bee's concern about "inherited desktop
assumptions" is real but is the wrong trade for a team this size: inheriting Fedora's
desktop assumptions is precisely the point, because the alternative is owning the desktop
integration forever. Record `quay.io/fedora-ostree-desktops/*` as the equivalent
fallback address if the `quay.io/fedora/*` mirror is ever discontinued.

**This is also the correction to the 2026-08-25 build.** That session used
`quay.io/fedora/fedora-bootc:43`, which is Bee's recommendation one version back, and the
result was that the session had to assemble a KDE desktop by hand.

---

## 3. Disagreement 2 — which ISO image type? **Bee was right; documents corrected**

**Claude's position (original document 3):** build the pilot ISO with
`image-builder --type anaconda-iso`, supplying a deliberately minimal kickstart so
Anaconda stays interactive.

**Bee's position:** `anaconda-iso` is the historical path. The current image-builder
image type is **`bootc-generic-iso`**, and the new CLI rejects `anaconda-iso` in some
bootc modes.

**How it was settled.** Fetching the current image-builder documentation directly
(`doc/20-advanced/20-bootc/10-isos.md` on `main`) confirms Bee. The current type is
`bootc-generic-iso`. It also documents a hard contract the container must satisfy, which
Claude's version of the plan did not mention at all:

- a kernel at `/usr/lib/modules/*/vmlinuz` with `initramfs.img` beside it
- the UEFI vendor directory under `/usr/lib/efi/shim/*EFI/$VENDOR`
- `shimx64.efi`, `mmx64.efi`, `gcdx64.efi` under `/boot/efi/EFI/$VENDOR`
- `/usr/share/grub2/unicode.pf` and `/usr/lib/grub/i386-pc`
- executables `podman`, `mksquashfs`, `xorriso`, `implantisomd5`, `grub2-mkimage`,
  `python`
- an `iso.yaml` at `/usr/lib/image-builder/bootc/`
- Anaconda and its dependencies installed **into the installer container**, because
  image-builder does not supply them
- `--bootc-installer-payload-ref` to embed the SP+ payload into the ISO's container
  storage so installation needs no registry

**Consensus:** the ISO is built with `bootc-generic-iso` from a purpose-built SP+
installer container. Documents 3 and 6 are corrected. Bee's exact command shape:

```
image-builder build \
  --bootc-ref localhost/spplus-installer \
  --bootc-installer-payload-ref localhost/spplus-kde:44 \
  --bootc-default-fs ext4 \
  bootc-generic-iso
```

**Credit where it is due to the 2026-08-25 session.** That session already had
`installer/iso.yaml` and `installer/interactive-defaults.ks`, and had already discovered
the `--bootc-default-fs ext4` requirement and the EFI path change by hitting them.
It was on the correct modern path for the ISO mechanism. Its error was the base image,
not the ISO tooling.

---

## 4. Disagreement 3 — live ISO with a third-party installer, or Anaconda? **Converged, with Bee's position taking priority**

**Claude's position (original document 3, Track 2):** for the public v1.0, build a live
ISO with `ublue-os/titanoboa` and a branded graphical installer
(`projectbluefin/bootc-installer`), so the advisor can boot the stick and *try* SP+ on
their own laptop before touching their disk, and so LUKS2 and TPM2 can both be handled in
one friendly GUI.

**Bee's position:** Anaconda is the installer. It already understands Fedora, bootc, and
LUKS2; it owns disk selection and the destructive-operation confirmation; and it is
maintained by people who are not us. Bee did not evaluate titanoboa or bootc-installer at
all — they were not in its brief — but it made the general argument directly about
Calamares: using a non-Anaconda installer means owning "the bootc payload, storage,
encryption, bootloader, and post-install modules" that Anaconda already implements.

**Assessment.** Bee's argument is the stronger one and Claude's original Track 2 was
overconfident. Making the *only* public install path depend on two young third-party
projects — titanoboa self-describes as experimental, bootc-installer is a hard fork of a
fork — is an unacceptable single point of failure for a product whose failure mode is a
non-technical user with client PII on an unbootable laptop. Claude's own document 6
already flagged this as "the largest technical risk in the plan" (Q5), which was the
right instinct followed by the wrong decision.

The "try before you install" argument is still genuinely valuable for this ICP, and Bee's
Anaconda flow does not provide it.

**Consensus:**

1. **Anaconda is the installer of record for v1**, via `bootc-generic-iso`, for both the
   pilot and the public release. Bee's five-decision flow (destination, encryption
   passphrase, user account, confirmation, reboot) is the target UX, with locale,
   keyboard, timezone, network, filesystem layout, payload, SELinux, and root-account
   lock all preselected.
2. **A live "try SP+" ISO is a separate, optional, later artifact**, not the install
   path. It gets its own evaluation phase after the Anaconda path is accepted, and it is
   allowed to fail without endangering the product.
3. Claude's original two-track sequencing is replaced: there is one track, and the
   question of "how friendly can the installer be" is answered by preconfiguring
   Anaconda rather than by replacing it.

---

## 5. Disagreement 4 — what "classic package mode" actually means today. **Bee corrected a factual error**

Claude's document 2 described the fallback architecture as "Kickstart + Lorax /
livemedia-creator / Pungi", the traditional Fedora spin path.

Bee established that Fedora's own image definitions have moved: the `fedora-kickstarts` /
`spin-kickstarts` repository is **archived**, and Fedora's current image definitions live
in `releng/kiwi-descriptions` on Fedora Forge, built with **KIWI NG**, with Zuul/tmt CI.
The current definitions already include `KDE-Desktop-Live` and `Workstation-Live`
profiles, Anaconda live-install packages, signed shim packages, and scripts that clear
machine identity and set first-boot behavior.

Bee also flagged that Fedora's *documentation* still describes maintaining spins through
kickstart files, so the two sources disagree with each other; it recommends treating the
Forge KIWI repository as the current implementation reference.

**Consensus:** if SP+ ever falls back to package mode, the starting point is Fedora's
current KIWI descriptions, not the archived kickstarts. Document 2's Option C is
corrected accordingly. This does not change the recommendation — package mode remains the
fallback, not the plan.

---

## 6. Findings from Bee that Claude missed entirely, now folded into the plan

These are not disagreements. They are gaps in documents 1–6 that Bee's pass caught.

| # | Finding | Where it now lives |
|---|---|---|
| 1 | **`--target-imgref` is required.** The Anaconda `bootc` kickstart command takes both `--source-imgref` (what to install) and `--target-imgref` (what the machine updates from). Omit the target and the installed machine has no working update channel. This is the single most consequential detail on this list: it would produce a fleet that installs fine and silently never updates. | Docs 3, 6 |
| 2 | **image-builder documents that LUKS does not work with bootable containers in its own disk-image storage configuration.** This is the concrete reason the encryption must come from Anaconda's storage path rather than from the image-builder config, which document 2 asserted correctly but without a reason. | Docs 2, 3 |
| 3 | **`bootc install to-disk --block-setup tpm2-luks` exists and is a trap.** Its implementation creates a temporary passphrase, enrolls the TPM, and then **wipes all other key slots** — leaving no user passphrase and no recovery key. It is an appliance feature, not an SP+ feature. | Docs 2, 5 |
| 4 | **Fedora bootc base images contain no default interactive user.** An installed system can boot perfectly and have no way to log in. | Doc 5 anti-patterns |
| 5 | **`systemd-cryptenroll --tpm2-pcrs` defaults to empty** when enrolling directly, while `crypttab` documents a PCR 7 default in a different situation. Always state the PCR policy explicitly. PCR 7 (Secure Boot state), PCR 11 (kernel/UKI), and PCR 14 (shim/MOK) measure different things, and GRUB/BLS and systemd-boot/UKI systems do not measure identically. | Docs 2, 6 |
| 6 | **The passphrase-timing argument.** An encrypted root cannot boot far enough to reach a first-boot wizard unless something already unlocks it. Therefore the user passphrase must be set during installation — it cannot be deferred to first boot. This is the rigorous justification for a decision documents 2 and 3 had already made on weaker grounds. | Doc 2 |
| 7 | **"Full-disk encryption" needs a written definition.** Firmware requires an unencrypted EFI System Partition, and the standard Fedora layout may leave boot metadata outside the LUKS volume. Whether SP+ means "user and root data" or "every non-firmware byte including `/boot`" is undecided and is a boot-chain design question, not a checkbox. | Doc 6, new Q12 |
| 8 | **Do not write the recovery key to `/var`.** Display it, get acknowledgement, offer print or removable media, and remove transient copies. Never let it reach the journal, a support bundle, or a screenshot directory. Bee also notes `systemd-cryptenroll` can render it as a QR code. | Docs 3, 5 |
| 9 | **`dnf update` inside a bootc Containerfile harms reproducibility** and can mishandle kernel and bootloader updates. Pin and rebuild instead. | Doc 5 anti-patterns |
| 10 | **`selinux=0` appears in the upstream bootc ISO examples as an installer-side workaround.** It must not leak into the installed system; SELinux stays enforcing on the advisor's machine. | Doc 5 anti-patterns |
| 11 | **image-builder documents that a bootc system installed through Anaconda can fail `systemd-remount-fs.service`.** A known upstream wart that must be reproduced and either fixed or consciously accepted before release. | Doc 6, new Q13 |
| 12 | **The `inst.stage2=hd:LABEL=...` label must match the ISO label.** Mismatch produces an ISO that boots a kernel and then strands the user with no installer. | Doc 5 anti-patterns |
| 13 | **The shim-review process changed on 2026-06-27**: shims submitted to Microsoft can now only be signed by the Microsoft UEFI CA 2023. Combined with the reproducible-build, SBAT, security-contact, and revocation-response obligations, shipping an SP+-signed shim is an organizational commitment, not a task. Another argument for using Fedora's chain unchanged. | Doc 2 |
| 14 | **`generic-release` sets `ID=generic`.** Swapping `fedora-release` for `generic-release` satisfies the trademark rule but leaves the machine identifying as "generic". SP+ needs its own release package, not the generic one. Bee gives the upstream pattern: `dnf -y swap fedora-release generic-release --allowerasing`. | Doc 5 |
| 15 | **The Fedora Remix mark carries three required notices**: that SP+ contains modified Fedora materials, that SP+ is not provided or supported by Fedora or Red Hat, and where unmodified Fedora materials can be obtained. SP+'s own brand must also be more prominent than the Fedora reference. | Doc 5 |
| 16 | **Whether an unchanged Fedora-signed shim carrying Fedora vendor metadata needs additional trademark permission inside a modified image is unresolved.** Bee marks this `[UNVERIFIED]` and recommends asking the Fedora Council before public release. Good catch; nobody would have thought of it. | Doc 6, new Q14 |
| 17 | **Brave's updater behavior on an immutable root is unknown.** Brave's native RPM is the right choice, but whether its self-updater writes somewhere that works, breaks, or silently does nothing on bootc is untested. Decide whether SP+ rebuilds Brave or permits Brave's updater. | Doc 6, folded into Q1 |
| 18 | **Firmware is not a driver.** `linux-firmware` covers a great deal of Intel, AMD, Qualcomm/Atheros, MediaTek, and Realtek hardware, but it does not supply a missing kernel driver, a user-space graphics stack, or working suspend. Bee's per-vendor hardware table is more specific than document 3's and should be adopted wholesale when the matrix is written. | Doc 3 §7 |
| 19 | **`livemedia-creator --no-virt` can operate on real host devices and damage the build host.** Only relevant on the fallback path, but worth never learning the hard way. | Doc 5 anti-patterns |

---

## 7. Where Claude's pass was stronger

Recorded for symmetry, and because these shaped the plan more than any technical finding.

- **The user.** Bee's report is a distribution-engineering document and barely mentions
  who the advisor is. Document 1 — a 62-year-old life agent with client SSNs and bank
  routing numbers in a downloads folder, who abandons anything that makes them slower —
  is what makes the Secure Boot and out-of-tree-module rules obviously correct rather
  than merely defensible.
- **The postmortem.** Bee had no access to the 2026-08-25 session and could not diagnose
  why it produced an unusable ISO.
- **Phase gates.** Bee's maintenance model is excellent but assumes a project already
  underway. The single most important thing about the plan is that Phase 0 exists and
  Secure Boot on real firmware blocks everything behind it.
- **The scope question (Q11).** Whether the assistant belongs in v1 at all is not a
  technical question and Bee did not raise it.
- **The discontinuation plan.** An obligation to advisors holding client PII on a machine
  that would stop receiving patches.

---

## 8. Net effect on the plan

Nothing in the architecture changed. bootc image mode, derived from an official Fedora
44 image, signed, registry-delivered, installed by Anaconda with user-supplied LUKS2, TPM
enrolled at first boot, Fedora's signed boot chain untouched, no out-of-tree modules.

Three things changed inside it:

1. The ISO is built with **`bootc-generic-iso`** from a **purpose-built SP+ installer
   container** carrying Anaconda, not with `anaconda-iso`.
2. **Anaconda is the installer for v1.** The live-ISO plus third-party-graphical-installer
   route is demoted from "the public v1.0 plan" to "a later optional artifact."
3. **`--target-imgref` is mandatory**, and its absence is now the first thing to check if
   an installed machine never updates.

And one thing was confirmed rather than changed: the base image. Two independent passes
disagreed about it, and the registry settled it.
