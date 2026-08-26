# SP+ — Distribution Architecture

**Document 2 of 6 in the SP+ planning set.**
Status: research baseline, 2026-08-25. Recommendation, not authorization to build.

This document answers the mission question: *how do we build and maintain a
distribution?* It evaluates the real options, states a recommendation, and records the
verified facts the recommendation rests on.

---

## 0. Verified fact base

Every fact below was checked on 2026-08-25. Anything not verified is marked
`[UNVERIFIED]` and must be re-checked before it is relied on.

| Fact | Value | Source |
|---|---|---|
| Fedora Linux 44 release date | 2026-04-28 (delayed twice from 2026-04-14) | [OSTechNix](https://ostechnix.com/fedora-44-release-date-confirmed/), [Fedora Magazine](https://fedoramagazine.org/announcing-fedora-linux-44/) |
| Fedora 44 is current stable as of today | Yes. Fedora 45 is in development (tags exist in registries) | quay.io tag listing |
| `quay.io/fedora/fedora-bootc:44` exists | Yes. Also tagged `latest`. Manifest list, 4 architectures. Last pushed 2026-08-24 | `quay.io/api/v1/repository/fedora/fedora-bootc/tag/` |
| `quay.io/fedora/fedora-kinoite:44` exists | Yes. Tags: `latest, 44, 44-x86_64, 44-aarch64, 43, 43-*, 45` | quay.io API |
| `quay.io/fedora/fedora-silverblue:44` exists | Yes, same tag shape | quay.io API |
| `bootc-image-builder` repo status | **Archived 2026-06-18.** Development merged into `osbuild/image-builder` | [osbuild/bootc-image-builder README](https://github.com/osbuild/bootc-image-builder/blob/main/README.md), [osbuild.org/docs/bootc](https://osbuild.org/docs/bootc/) |
| image-builder image types | `qcow2` (default), `raw`, `ami`, `vmdk`, `vhd`, `gce`, `anaconda-iso`, `bootc-installer`, `pxe-tar-xz` | bootc-image-builder README |
| Anaconda `bootc` kickstart command | Landed ~Dec 2025. `bootc --source-imgref=registry:<ref>`. Does filesystem population *and* bootloader via bootc. Supersedes `ostreecontainer` for bootc images | [Fedora Magazine](https://fedoramagazine.org/introducing-the-new-bootc-kickstart-command-in-anaconda/) |
| Anaconda `bootc` known limits | No multi-disk partitioning, limited custom mount points, no authenticated registry support | same |
| Anaconda Web UI in Fedora 44 | Default graphical installer. Four steps: Welcome, Installation method, Storage configuration, Review and install. Storage step has a single **"Encrypt my data"** checkbox for LUKS FDE | [Fedora Magazine](https://fedoramagazine.org/anaconda-installer-redesign/), F44 install walkthroughs |
| Interactive install from a bootc kickstart | Yes — a kickstart containing only the container-install command yields an interactive Anaconda session | Fedora Magazine; [supakeen](https://supakeen.com/weblog/building-interactive-installer-bootc/) |
| bootc and disk encryption | **bootc does not integrate encryption into its own tooling.** Encryption must come from the installer (Anaconda/LUKS) or a post-install enrollment step | [LWN 1042708](https://lwn.net/Articles/1042708/) |
| Anaconda TPM2 auto-unlock support | **Not available.** No kickstart or Web UI option to enroll TPM2 during install. Must be done post-install with `systemd-cryptenroll` | [Fedora Discussion](https://discussion.fedoraproject.org/t/anaconda-support-for-tpm2-auto-unlocking-with-luks/144609) |
| `systemd-cryptenroll` requires LUKS2 | Yes; it does not work with LUKS1 | [Fedora Magazine](https://fedoramagazine.org/automatically-decrypt-your-disk-using-tpm2/) |
| bootc automatic updates | `bootc-fetch-apply-updates.timer` → service; fetches, stages, reboots into new image. Default cadence roughly 1–3 hours | [bootc.dev upgrades](https://bootc.dev/bootc/upgrades.html), Red Hat docs |
| bootc rollback | `bootc rollback` (+ `--apply`), or select the prior deployment in GRUB. **Auto-update will revert a manual rollback** unless the timer is masked | [mankier bootc-rollback](https://www.mankier.com/8/bootc-rollback) |
| Universal Blue signing | cosign, on all images; signing enabled across the fleet | [universal-blue.org](https://universal-blue.org/) |
| Universal Blue Secure Boot | They sign their *custom kernel and akmods with their own key*, which forces users through **MOK enrollment** (password `universalblue`) | [Universal Blue forum](https://universal-blue.discourse.group/t/secure-boot-notice/405) |
| `ublue-os/isogenerator` | **Archived, unmaintained since April 2024. Does not support bootc images.** Do not use | [GitHub](https://github.com/ublue-os/isogenerator) |
| `ublue-os/titanoboa` | Active. Builds a **live ISO** directly from a bootc container image: rootfs extraction, dracut-live initramfs, squashfs/erofs, embedded container for offline install, flatpak preinstall, UEFI+BIOS. Self-described as **experimental** | [GitHub](https://github.com/ublue-os/titanoboa) |
| `projectbluefin/bootc-installer` | Active GTK4/libadwaita graphical installer for bootc. Supports unencrypted, **LUKS2 passphrase, TPM2 auto-unlock, and TPM2-primary-with-passphrase-fallback**. Detects live-ISO mode and installs offline from the embedded OCI image | [GitHub](https://github.com/projectbluefin/bootc-installer) |
| Readymade (Ultramarine/ublue) | Graphical installer with "Enable disk encryption" and an "Enable TPM" option layered on it | [Ultramarine wiki](https://wiki.ultramarine-linux.org/en/setup/installation/) |
| Fedora Remix trademark rule | Remove `fedora-logos`, `fedora-release`, `fedora-release-notes`; replace with `generic-logos` / `generic-release` / `generic-release-notes` or your own. Then no special permission is needed to use the "Fedora Remix" secondary mark | [Fedora wiki: Remix](https://fedoraproject.org/wiki/Remix), [Legal:Trademark guidelines](https://fedoraproject.org/wiki/Legal:Trademark_guidelines) |
| Brave managed policy on Linux | `/etc/brave/policies/managed/*.json`. Keys include `BraveRewardsDisabled`, `BraveWalletDisabled`, `BraveVPNDisabled`, `BraveAIChatEnabled`. Verify at `brave://policy` | [Brave Help Center](https://support.brave.app/hc/en-us/articles/360039248271-Group-Policy) |
| Flatpak preinstall in bootc images | `flatpak preinstall` + a `flatpak-preinstall.service` first-boot unit is the pattern Universal Blue/Bluefin use; bootc install copies system flatpaks from `/var/lib/flatpak` on the ISO to the target | Bluefin/Dakota documentation |

---

## 1. The four ways to build a distribution

There are, realistically, four architectures. They are not variations on a theme; they
produce different products with different lifetime costs.

### Option A — Image mode (bootc), derived from a Fedora Atomic Desktop base

Define the OS as an OCI container image:

```dockerfile
FROM quay.io/fedora/fedora-kinoite:44
RUN dnf install -y ... && dnf clean all
COPY etc/ /etc/
RUN systemctl enable sp-plus.service
RUN bootc container lint
```

Build with `podman build`. Push to a registry. Convert to installable media with
`osbuild/image-builder` (`--type anaconda-iso` or `--type bootc-installer`) or a live-ISO
builder. Installed machines update with `bootc upgrade`, pulling the new image from the
registry, staging it, and rebooting into it, with the previous deployment retained for
rollback.

**What you get.** `/usr` is read-only and byte-identical on every machine in the fleet.
The build is a Containerfile in git — completely reproducible, diffable, reviewable, and
buildable in CI on a normal runner. Updates are an image pull. Rollback is a reboot. The
same artifact is the dev image, the test image, and the production image.

**What it costs.** All software must be present at build time or installed as Flatpak /
Toolbx / Distrobox at runtime. Out-of-tree kernel modules require akmods baked into the
image at build time, which is where Secure Boot gets expensive (see section 4).
Configuration lives in `/usr/etc` defaults with a persistent `/etc` overlay, and you must
be deliberate about which files you ship and which the user may change.

### Option B — rpm-ostree derivation with an ostree repo

The pre-bootc Universal Blue model: derive from Silverblue/Kinoite, layer packages,
publish an ostree repository over HTTP as the update channel.

**Status in 2026: superseded.** bootc replaces ostree's HTTP transport with OCI registry
transport while keeping libostree as the storage backend. Universal Blue has moved to
bootc. Choosing raw ostree today means operating a bespoke HTTP repo and its GPG signing,
mirroring, and pruning, instead of using a container registry that already solves all
three. Option B is Option A with more infrastructure and fewer tools. **Rejected.**

### Option C — Classic Kickstart + Lorax / livemedia-creator / Pungi

The traditional Fedora spin path. A kickstart file lists packages and `%post` scripts;
`livemedia-creator` produces a live ISO with Anaconda; the installed system is an
ordinary mutable dnf system that updates with `dnf upgrade` or `dnf-automatic`.

**What you get.** Maximum familiarity, maximum flexibility, an enormous body of prior
art, and no constraints on kernel modules or filesystem layout.

**What it costs, specifically for SP+.**

- The installed system is **mutable and therefore diverges**. Within a year, no two
  advisor laptops are the same machine. Every support call becomes an investigation.
- **No rollback.** A bad `dnf upgrade` on a Tuesday morning is an outage with no undo,
  on a machine belonging to someone who cannot use a terminal.
- The image you tested is not the image the user is running after their first update.
- `%post` scripting is imperative and order-dependent — the classic source of "worked on
  my build machine" ISOs.
- You still have to solve preinstalled-app configuration, and you have to solve it twice
  (in the kickstart for new installs, in a config package for existing ones).

For a fleet of non-technical users with no IT function, mutability is the defect that
generates the support cost that kills the program. **Rejected as the shipping
architecture.** It remains valid for producing a *rescue/live-diagnostics ISO*, which is
a genuinely useful separate artifact.

### Option D — "Golden image" capture

Install a prototype by hand on a VM or a real laptop, configure everything until it is
perfect, then capture the disk and wrap it into installable media.

This is the option the mission statement explicitly asks about, so it deserves a direct
answer rather than a dismissal.

**Why it is seductive.** It is the only option where you configure the system the same
way a human uses it: click through the settings, install the apps, set the wallpaper,
see it working. There is no abstraction between what you did and what ships. For a small
team without distribution-engineering experience, that is a real advantage.

**Why it must not be the shipping mechanism.**

1. **A captured disk contains a captured LUKS header.** Either the image ships
   unencrypted (unacceptable), or it ships with an encryption key that every SP+ user
   shares (catastrophically worse than unencrypted, because it looks safe). Encryption
   must be established on the user's machine, with the user's secret, at install time.
   A disk capture structurally cannot do that.
2. **Machine identity leaks.** `/etc/machine-id`, SSH host keys, NetworkManager
   connection profiles with the build lab's Wi-Fi PSK, dconf caches, systemd random
   seed, journal from the build machine, `/var/lib/dbus`, browser profile GUIDs. Each of
   these has to be found and scrubbed, and the list is never complete. Miss one and
   every SP+ machine in the field shares an identity.
3. **It is not reproducible.** When CVE-2027-XXXX lands in the kernel, you cannot
   rebuild the image. You have to boot the prototype, update it, and re-capture — and
   the result differs from the last one in ways nobody recorded. There is no diff, no
   review, and no way to answer "what changed between 1.3 and 1.4".
4. **There is no update channel.** The ISO is a terminal artifact. Users are on
   whatever `dnf` gives them, which is Option C's problem plus a mystery starting point.
5. **Hardware bleed.** A capture from real hardware carries that hardware's assumptions:
   initramfs built for its storage controller, X/Wayland config, firmware quirks.
6. **It fails audit.** "Prove what is in the image you shipped to 400 advisors" has no
   good answer when the image is a disk snapshot of a machine somebody configured by
   hand eight months ago.

**Where it belongs.** As a *discovery* technique, it is excellent and should be used.
The correct workflow is:

> Build a throwaway prototype VM. Configure it by hand until an advisor would be happy.
> Then **transcribe every single change into the Containerfile** — every package, every
> dropped-in config file, every enabled unit, every dconf key — and rebuild from the
> Containerfile. Diff the prototype against the rebuilt image. Iterate until the diff is
> empty. Then throw the prototype away.

Prototype to *learn*. Never prototype to *ship*. This is the honest answer to the
mission's "do we install a prototype and compress it into an ISO?": you install a
prototype to find out what the ISO should contain, and then you build the ISO properly.

---

## 2. Recommendation

**Build SP+ as a bootc image derived from the official Fedora Atomic Desktop bootc base
images, built in CI from a Containerfile, signed with cosign, published to a container
registry, and installed from an ISO generated from that same image.**

Concretely:

```
                    ┌──────────────────────────────────────┐
                    │  git: sp-plus/  (Containerfile,      │
                    │  /etc drop-ins, policies, PWA, KB)   │
                    └────────────────┬─────────────────────┘
                                     │  CI (GitHub Actions)
                    ┌────────────────▼─────────────────────┐
   quay.io/fedora/  │  podman build                        │
   fedora-kinoite:44├─► ghcr.io/secureprospective/          │
   fedora-silverblue│    sp-plus-kde:44   (cosign-signed)   │
   :44              │    sp-plus-gnome:44 (cosign-signed)   │
                    └────────┬──────────────────┬───────────┘
                             │                  │
                 ┌───────────▼──────┐   ┌───────▼─────────────────┐
                 │ ISO build        │   │ bootc-fetch-apply-      │
                 │ (installer media)│   │ updates.timer on every  │
                 └───────────┬──────┘   │ installed machine       │
                             │          └─────────────────────────┘
                    ┌────────▼──────────┐
                    │ USB stick → user  │
                    └───────────────────┘
```

### Why `fedora-kinoite:44` / `fedora-silverblue:44` and not `fedora-bootc:44`

This is the most important correction to the first build attempt.

`fedora-bootc` is a **minimal server base**. Starting there means assembling an entire
desktop — display manager, session, Wayland stack, portals, PipeWire, NetworkManager
integration, theming, the hundreds of packages a desktop comp-group pulls in — by hand,
and then owning every integration bug in it forever. That is a distribution-engineering
project, and it is a large part of why the 2026-08-25 attempt produced an ISO that is
not usable by the public.

`quay.io/fedora/fedora-kinoite:44` and `quay.io/fedora/fedora-silverblue:44` are the
official Fedora Atomic Desktop images, published as bootc-compatible container images,
built and tested by Fedora, with KDE Plasma and GNOME respectively already integrated.
Deriving from them means SP+ inherits a working desktop, and the SP+ Containerfile is
only responsible for the SP+ delta: Brave and its policy, Bitwarden, the PWA and its
service, the knowledge base, the branding, the security defaults, and the first-boot
flow. That delta is small enough to be reviewed line by line.

It also makes the two-edition strategy nearly free: the same delta layer applies to two
different bases. The KDE and GNOME editions differ only in their `FROM` line and their
desktop-defaults layer, which satisfies the build brief's requirement that the lower
layers remain identical.

### Second choice, and when to switch

**Second choice: Option C (kickstart + Lorax), building a mutable Fedora 44 Workstation
remix.** Switch to it only if one of these turns out to be true after the Phase 0 spike
in document 3:

- The Atomic Desktop bootc images cannot be made to accept a required piece of software
  at all (a genuinely unavoidable third-party kernel module, an installer that refuses
  to work on an immutable `/usr`, or a VPN client with no Flatpak or in-tree path).
- Advisor hardware in the target matrix requires out-of-tree drivers frequently enough
  that Secure Boot cannot be preserved (see section 4), and the resulting MOK enrollment
  step is judged fatal to the plug-and-play requirement.

If the switch happens, the mutability problem must be answered explicitly — most likely
by pinning updates and shipping a config RPM — not waved away.

---

## 3. Installation media: how "plug and play" is actually achieved

An ISO is not a product. The install experience is. There are two viable tracks and they
should be sequenced, not chosen between.

### Track 1 — `anaconda-iso` with an interactive kickstart (use this first)

`image-builder --type anaconda-iso` embeds the SP+ container image inside an ISO whose
installer is Anaconda. The kickstart is deliberately *minimal*: it supplies the
container reference and locale defaults and nothing else, which leaves Anaconda in
interactive mode.

The user experience is Fedora 44's Anaconda Web UI: Welcome → Installation method →
Storage configuration (with a single **"Encrypt my data"** checkbox that turns on LUKS
full-disk encryption) → Review and install. It is four screens, it is graphical, and it
is maintained by Fedora rather than by us.

**Verdict: this is not yet "plug and play", but it is honest, it works, and it is
achievable now.** It gets a correctly encrypted, Secure-Boot-clean SP+ onto real hardware
so the rest of the product can be validated. Ship it to internal testers and the pilot
cohort. Do not ship it to the public and call it plug and play.

Note the documented limitation: `[customizations.user]` and
`[customizations.installer.kickstart]` cannot both be used. If a custom kickstart is
supplied, user creation must happen inside it — or, better for SP+, be deferred to a
first-boot wizard.

### Track 2 — Live ISO with a branded graphical installer (the public v1.0)

Two components, both from the Universal Blue ecosystem, both currently active:

- **`titanoboa`** builds a *live* ISO from a bootc container image: it extracts the
  rootfs, generates a `dracut-live` initramfs, compresses with squashfs or erofs, embeds
  the container image for offline installation, preinstalls Flatpaks, and assembles a
  UEFI+BIOS-bootable ISO. Live means the advisor can boot the stick and **try SP+ on
  their own laptop before touching their disk** — which for this ICP is worth more than
  any feature we could build.
- **`projectbluefin/bootc-installer`** is a GTK4/libadwaita graphical installer for
  bootc images. It supports unencrypted, LUKS2 with passphrase, TPM2 auto-unlock, and
  TPM2-primary-with-passphrase-fallback, and it detects live-ISO mode to install
  offline from the embedded image with no network. Readymade (Ultramarine) is the
  alternative with a comparable feature set.

That combination is the real answer to "plug and play": insert USB → boot → a working
SP+ desktop appears → click *Install SP+* → choose the disk → choose a password → done →
reboot into a first-run wizard.

**Both are third-party and both are young.** `titanoboa` describes itself as
experimental. `bootc-installer` is a hard fork of a fork. Depending on them is a real
risk and must be treated as one: vendor the versions used, pin by digest, and budget for
maintaining a fork. That risk is still smaller than writing an installer.

### What is rejected

- **`ublue-os/isogenerator`** — archived since April 2024 and explicitly does not support
  bootc images. It appears in a lot of search results. Do not use it.
- **Wrapping a captured disk image in an ISO** — see Option D above.
- **`bootc install to-disk --via-loopback` as a build step** — this is what the
  2026-08-25 session attempted first. It requires loop devices, privileged containers,
  and a matching root partition type, and it produces a disk image rather than
  installation media. It is a legitimate tool for building qcow2 test artifacts; it is
  not a path to a public ISO.

---

## 4. Secure Boot — the constraint that shapes the package list

This is the area where projects most often make false claims, so it is stated precisely.

**The mechanism.** Fedora ships a `shim` binary signed by Microsoft's UEFI CA, which is
trusted by essentially all retail PC firmware. `shim` validates GRUB2, which validates
the kernel, using the **Fedora signing key embedded in the shim**. The kernel then
enforces module signature checking, accepting modules signed by that same Fedora key.

**The consequence for SP+.** If SP+ derives from an official Fedora Atomic Desktop image
and uses the **stock Fedora shim, GRUB2, and kernel, with no out-of-tree kernel
modules**, then Secure Boot works out of the box, with zero user action, on any machine
that shipped with Secure Boot enabled. No MOK enrollment. No blue MokManager screen. No
firmware menu. This is worth a great deal for the ICP in document 1, and it is worth
sacrificing features to keep.

**What breaks it.** Any kernel module Fedora did not sign: NVIDIA proprietary drivers,
`broadcom-wl`, VirtualBox modules, ZFS, most VPN kernel modules, anything built with
DKMS or akmods. To ship those with Secure Boot on, SP+ would need its own signing key
and every user would need to complete **MOK enrollment**: a reboot into a blue text-mode
screen where they must type a password we gave them. Universal Blue does exactly this,
with the password `universalblue`, because they ship a custom kernel and akmods. For
gamers that is an acceptable ask. For a 62-year-old life insurance agent installing an
operating system for the first time, it is a support call and probably an abandonment.

**Therefore, a hard design rule for SP+ v1:**

> **SP+ ships no out-of-tree kernel modules and no custom kernel.** Any hardware that
> requires one is declared unsupported and excluded from the hardware matrix. NVIDIA
> discrete graphics falls back to `nouveau` or the machine is not on the list.

If a future release must break this rule, the MOK enrollment step becomes a mandatory,
designed, illustrated part of the install flow — not an accident discovered at first
boot.

**What must be verified in Phase 0**, not assumed: that the derived image actually boots
with Secure Boot enabled on real hardware, and that `mokutil --sb-state` reports
enabled. The 2026-08-25 QEMU pass used OVMF and swtpm, which is the right test
environment, but Secure Boot enforcement was not among the recorded results.

---

## 5. Encryption — how a preconfigured ISO can still be securely encrypted

This is the second place where a naive design fails badly, and it interacts with the
"preinstalled and preconfigured" requirement directly.

**The rule: an ISO can never contain the encryption secret.** Anything shipped in the
image is public. Therefore:

| Stage | What happens | Mechanism |
|---|---|---|
| Install | The user chooses a disk password. LUKS2 is created on their machine with their secret. | Anaconda "Encrypt my data" (Track 1) or the graphical installer's encryption pane (Track 2) |
| First boot | A recovery key is generated **on the machine**, added as a second LUKS keyslot, and displayed to the user in a wizard that will not continue until they confirm they have written it down or printed it. | `systemd-cryptenroll --recovery-key` from an SP+ first-boot unit |
| First boot | TPM2 is enrolled as an additional keyslot so the machine unlocks without a typed password on subsequent boots, bound to PCR 7 (Secure Boot state). | `systemd-cryptenroll --tpm2-device=auto --tpm2-pcrs=7` — **Anaconda cannot do this; it must be a post-install step** |
| Ongoing | The passphrase remains a valid keyslot as a fallback for firmware changes that invalidate the TPM binding. | LUKS2 multi-keyslot |

Two facts constrain this design and are verified:

1. **bootc has no encryption integration of its own.** Encryption comes from the
   installer, not from the image pipeline.
2. **Anaconda has no TPM2 enrollment**, in the Web UI or in kickstart. TPM enrollment is
   necessarily a first-boot step. `bootc-installer` (Track 2) does offer TPM2 modes,
   which is another argument for Track 2 at v1.0.

**PCR binding is a support hazard and must be designed for.** Binding to PCR 7 means a
firmware update, a Secure Boot key rollover, or a BIOS setting change can invalidate the
TPM keyslot and drop the user to a password prompt they have never seen. The recovery
key wizard and the knowledge-base article covering that exact screen are not optional
polish; they are the difference between a recoverable event and a lost laptop full of
client PII. The existing knowledge base already contains
`troubleshooting/computer-asks-for-recovery-key.md`, which is the right instinct.

---

## 6. Preinstallation and preconfiguration on an immutable system

"Preinstalled with what we need, apps preconfigured, protections in place" resolves into
five distinct mechanisms, each with different update semantics. Confusing them is a
common source of settings that mysteriously revert.

| What | Mechanism | Lives in | Survives an update? |
|---|---|---|---|
| System applications (Brave, CUPS, NetworkManager, the SP+ runtime) | `dnf install` in the Containerfile | `/usr` (read-only) | Yes — replaced wholesale by the new image |
| User-facing extras (LibreOffice, Zoom, Bitwarden desktop, media apps) | Flatpak, preinstalled via `flatpak preinstall` + a first-boot unit | `/var/lib/flatpak` | Yes — updated independently by Flatpak |
| Browser policy | JSON dropped at `/etc/brave/policies/managed/sp-plus.json` | `/etc` overlay, shipped as a default | Yes, and it is **enforced** — the user cannot turn it off |
| Desktop defaults (KDE/GNOME look, panel layout, scaling, screen lock) | dconf vendor defaults / `kdeglobals` defaults under `/usr/share`, **never** by writing to the user's home | `/usr` | Yes, and the user may still override them |
| Machine-local state (Wi-Fi profiles, printers, the user's files) | Created at runtime | `/var`, `/home` | Yes — untouched by image updates |

Three rules follow:

1. **Never configure by writing into `/home` from the image.** It only affects users who
   did not exist yet, it cannot be updated, and it breaks the moment a second user is
   added. Ship vendor defaults in `/usr`; let the user's `/home` override them.
2. **`/etc` is an overlay with three-way merge semantics on bootc.** Files shipped in
   the image land as defaults; a file the user modified is kept across updates. That is
   usually what you want, but it means an SP+ setting the user changed will *not* be
   corrected by a later release. For settings that must not drift (browser policy,
   firewall), prefer mechanisms that are enforced rather than merely defaulted.
3. **Brave policy is the primary hardening surface**, not the OS. Rewards off, Wallet
   off, VPN off, Leo off initially, extension allowlist with Bitwarden explicitly
   permitted, managed bookmarks, and the SP+ PWA set. Verify every deployment at
   `brave://policy` — there is a documented history of Brave policies not taking effect
   as expected, so this is a test case, not a config-and-forget.

**A note on Brave as an RPM.** Brave is proprietary-licensed in part and is not in the
Fedora repositories; it comes from Brave's own repo. That is a supply-chain dependency
on a third party's RPM signing, and it sits awkwardly against product principle 7
("open-source foundation"). It is a decision to make consciously — the alternative is
Firefox with policies, or Chromium — and it is recorded as an open question in document
6 rather than silently accepted.

---

## 7. What this architecture does *not* solve

Stated so nobody later discovers them as surprises:

- **Windows-only applications.** Nothing here helps. The answer is a pre-download
  screening question and an honest "SP+ is not for you" for advisors with a hard
  dependency.
- **Dual boot.** Anaconda can do it; the graphical bootc installers are weaker at it;
  and supporting it for non-technical users is a large support surface. Recommend
  refusing to support dual boot in v1 and instead recommending a second machine or a
  full migration, which the landing content already leans toward.
- **Fingerprint readers.** `fprintd` coverage is uneven and vendor-specific. Assume not
  working until tested per model.
- **Migrating data off Windows.** A separate tool and a separate document.
- **The advisor's phone.** Out of scope entirely.
