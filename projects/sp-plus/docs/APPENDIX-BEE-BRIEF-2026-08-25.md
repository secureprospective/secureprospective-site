# Research brief — SP+ (Secure Prospective Advisor OS) distribution build & maintenance

You are Bee, a research agent on the Beelink node. This is a **research-only** task.
**Do not build anything. Do not modify any repository. Do not write files.** Print your
findings as your reply. Your reply IS the deliverable. Be long and specific.

You have `bash` + `curl`. You have no web-search tool, so fetch documentation directly.
Useful primary sources (fetch several, quote specifics, cite URLs):

- https://docs.fedoraproject.org/en-US/bootc/
- https://docs.fedoraproject.org/en-US/fedora-coreos/
- https://weldr.io/ / https://osbuild.org/docs/
- https://osbuild.org/docs/bootc/
- https://github.com/osbuild/bootc-image-builder
- https://docs.fedoraproject.org/en-US/quick-docs/creating-and-using-a-live-installable-spin/
- https://weldr.io/lorax/ and https://weldr.io/lorax/livemedia-creator.html
- https://pykickstart.readthedocs.io/ and https://anaconda-installer.readthedocs.io/
- https://fedoraproject.org/wiki/Releases/44/Schedule
- https://pagure.io/fedora-kickstarts
- https://docs.fedoraproject.org/en-US/fedora-silverblue/
- https://coreos.github.io/rpm-ostree/
- https://github.com/ublue-os/main and https://universal-blue.org/ (a real-world example of
  a maintained Fedora-derived custom image — study how they do build + update + signing)
- https://docs.fedoraproject.org/en-US/legal/ (trademark / remix rules)

## The product, in one paragraph

SP+ is a free, locked-down Linux workstation distribution given to independent insurance
and financial advisors as a member benefit of Secure Prospective. The users are
non-technical, mostly ex-Windows, often older, with low tolerance for disruption. They
live in a browser (Google Workspace / Microsoft 365 / carrier portals / e-sign / Zoom).
The OS must protect client PII, be immutable/rollback-capable, ship with everything
preinstalled and preconfigured (Brave with managed policy, Bitwarden, a local help PWA,
a Markdown knowledge base, a diagnostic assistant), full-disk encryption, Secure Boot,
and it must be **plug and play**: an advisor writes the ISO to a USB stick, boots it,
answers a couple of questions, and lands on a working desktop. Two desktop variants are
planned: KDE (Windows-familiar) and GNOME (Mac-familiar). Target base: **Fedora 44**.

A first attempt was made and produced an ISO that is NOT usable by the general public.
The mission now is to write the correct, complete plan.

## The core question you must answer

There are several fundamentally different ways to produce and maintain a custom Fedora
distribution. Evaluate each **on its merits for this specific product**, then make a
clear recommendation:

1. **Image mode / bootc** — define the OS as an OCI container (`Containerfile` FROM
   `quay.io/fedora/fedora-bootc:44`), build with podman, convert to installable media
   with `bootc-image-builder`. Updates via `bootc upgrade` pulling from a registry.
2. **rpm-ostree / Silverblue-derived** — derive from Fedora Kinoite/Silverblue, layer
   packages, ship an ostree repo as the update channel (the Universal Blue / Bazzite
   model, which has now largely moved to bootc — establish what the current state
   actually is in 2026, do not assume).
3. **Classic Kickstart + Lorax / livemedia-creator / pungi** — the traditional Fedora
   spin/remix path. Produces a live ISO with Anaconda and a Calamares-or-Anaconda
   install. Mutable dnf-based system, updates via dnf/`dnf-automatic`.
4. **"Golden image" capture** — install a prototype on real hardware or a VM by hand,
   configure everything, then capture the disk and turn it into installable media
   (e.g. an ISO wrapping a disk image, or `livemedia-creator --make-iso --disk-image`,
   or a Clonezilla/Foxclone-style restore image).
5. Anything else you find that is actually used in production for this class of product.

For each option address, concretely:

- **First-boot user experience.** What does the non-technical advisor actually see and
  click? Which options give a true "insert USB → few clicks → done" flow? What is the
  role of Anaconda vs. Calamares vs. an OEM/first-boot ("gnome-initial-setup",
  `systemd-firstboot`, Anaconda `%addon` / initial-setup) configuration pass?
- **How full-disk encryption is configured non-interactively but still securely** —
  LUKS2, TPM2 binding via `systemd-cryptenroll`, recovery key generation and how the
  user is shown/stores it, and whether a passphrase can be set at first boot rather
  than at install time (this matters enormously: a preseeded ISO cannot ship a known
  encryption passphrase).
- **Secure Boot.** What is actually required to ship a bootable-with-Secure-Boot-on
  custom image? Can a third party use Fedora's signed shim/GRUB/kernel? What breaks it
  (custom kernel modules, DKMS, custom kernels)? What are the real options (use stock
  signed Fedora kernel; MOK enrollment; paying for/obtaining a signed shim). Be precise
  and cite sources — this is a common place people make false claims.
- **How preinstalled apps and preconfiguration are baked in** — RPMs vs Flatpak vs
  browser policy JSON (`/etc/brave/policies/managed/`), dconf/KDE defaults, systemd
  units, /etc vs /usr on immutable systems, and what survives an update on each
  architecture.
- **Update and maintenance model over years.** Who rebuilds, how often, how do users
  get updates, how do you roll back a bad release, how do you sign artifacts, what is
  the hosting/bandwidth cost shape, and what breaks at a Fedora major-version bump
  (44 → 45 → 46).
- **Build reproducibility and CI.** Can it be built unattended in CI (GitHub Actions,
  or a self-hosted runner)? What are the privilege requirements (loop devices,
  `--privileged`, nested virt)?
- **Effort and failure modes.** Where do teams actually get stuck.

## Also research and report on

- **Fedora 44 status as of 2026-08-25.** Is it released? What is its lifecycle/EOL
  date, and what is the release schedule for 45? Is `quay.io/fedora/fedora-bootc:44`
  published? Are Kinoite/Silverblue 44 shipped? Verify, do not assume.
- **Fedora trademark and remix rules.** What may a derivative be called and what
  branding must be removed (`generic-release`, `fedora-logos` vs `generic-logos`)?
  What are the "Fedora Remix" vs "Fedora Spin" rules and what does SP+ need to comply
  with to be redistributed publicly and for free?
- **Hardware enablement reality** for advisor-grade laptops (Dell Latitude, HP
  EliteBook/ProBook, Lenovo ThinkPad, plus consumer Dell/HP/Lenovo and recent Intel/AMD
  laptops): Wi-Fi firmware, fingerprint readers (fprintd), suspend/S0ix, HiDPI,
  printers (CUPS + driverless IPP), Broadcom Wi-Fi, NVIDIA. What does shipping
  `linux-firmware` cover and what does it not? Where does an immutable image make
  third-party drivers harder?
- **Anti-patterns / why a first attempt produces an unusable ISO.** From the docs and
  from real projects, list the specific mistakes that produce an ISO that boots to a
  broken installer, a black screen, an unencrypted install, or a desktop with no
  network.
- **Signing and delivery.** GPG signing of repos, cosign/sigstore signing of container
  images, `bootc` image verification policy, ISO checksum + signature publication, and
  what a small organization can realistically operate.

## Output format

Print a structured report with these sections, in this order:

1. `## VERDICT` — your single recommended build architecture in 5 sentences or fewer,
   plus your recommended *second* choice and the condition under which you'd switch.
2. `## FACT TABLE` — verified facts with source URLs (Fedora 44 status, EOL, image
   names/tags that actually exist, tool names and current commands).
3. `## OPTION ANALYSIS` — one subsection per option above.
4. `## FIRST-BOOT UX DESIGN` — how the plug-and-play experience is actually achieved on
   your recommended architecture, step by step from USB insert to working desktop.
5. `## ENCRYPTION AND SECURE BOOT` — precise, cited.
6. `## PREINSTALL AND PRECONFIGURATION MECHANICS`
7. `## MAINTENANCE MODEL` — the multi-year operating plan.
8. `## HARDWARE MATRIX AND GAPS`
9. `## ANTI-PATTERNS` — numbered list of specific mistakes to avoid.
10. `## LEGAL AND BRANDING`
11. `## OPEN QUESTIONS AND DISAGREEMENTS` — anything you could not verify, and any
    point where you expect a reasonable engineer to disagree with you and why.

Mark every claim you could NOT verify from a fetched source with `[UNVERIFIED]`.
Do not pad. Do not restate this brief back to me. Findings only.
