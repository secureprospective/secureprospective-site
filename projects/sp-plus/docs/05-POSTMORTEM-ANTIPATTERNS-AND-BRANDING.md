# SP+ — Postmortem, Anti-Patterns, and Branding

**Document 5 of 6 in the SP+ planning set.**
Status: research baseline, 2026-08-25.

---

## Part I — Postmortem of the 2026-08-25 build attempt

The first build session produced a large amount of correct, careful work and an ISO that
cannot be given to a member. Both halves of that sentence are true and both are worth
understanding. This is a postmortem of a process, not of a person; the session's own logs
are unusually honest about what was and was not verified, which is why a useful
postmortem is possible at all.

### What went right

- The build brief was treated as the scope baseline and largely respected.
- Negative results were recorded rather than hidden: the loopback install failure, the
  EFI path change, the missing `DefaultRootFs`, the loopback-bound service that made the
  QEMU port-forward test invalid.
- The session refused to claim gates it had not passed. The log states plainly that
  LUKS2 acceptance was not run and that the qcow2 is not proof of encrypted installation.
- The knowledge base, the landing content and disclaimers, the RPC boundary design, and
  the printer workflow are genuinely good and survive into the new plan largely intact.
- Host tests, playbook verification, and RPC smoke tests all pass and still pass after
  the SP+ rename.

### What went wrong, in order of consequence

**1. The wrong base image was chosen.** Building `FROM quay.io/fedora/fedora-bootc:43`
means starting from a minimal server base and assembling an entire KDE desktop by hand.
The official Fedora Atomic Desktop bootc images — `quay.io/fedora/fedora-kinoite:44` and
`quay.io/fedora/fedora-silverblue:44` — already exist, are maintained by Fedora, and map
exactly onto the two-edition strategy. Almost all of the integration difficulty in the
session was self-inflicted by this one decision.

**2. Fedora 43 instead of 44.** Fedora 44 released 2026-04-28 and has been stable for
four months. Building on 43 starts the project one version behind, with a shorter support
window and a migration due sooner.

**3. Podman was missing, and the response was to route around it rather than install
it.** The Docker → `docker save` → privileged image-builder with an internal Podman
store path is an elaborate workaround for a package that is one `dnf install` away. It
consumed most of the session, it is unreproducible in CI, and it is not the path anyone
else uses, so no upstream documentation applies to it. **Missing tooling is a
prerequisite to satisfy, not an obstacle to engineer around.**

**4. There was no plug-and-play install path in the design at all.** The session built a
"generic bootc installer ISO". A generic installer ISO is a developer artifact. Nothing
in the plan addressed what the advisor sees between inserting a USB stick and reaching a
desktop, which is the actual product. This is why the resulting ISO is not usable by the
general public — not because it was built badly, but because nobody had specified the
thing the public needs.

**5. Encryption was deferred past the point where it could be validated.** LUKS2, the
recovery key, and TPM2 enrollment are the core value proposition (document 1 §2.1) and
the constraint that most shapes the install architecture. They were left as "the next
gate" while effort went into the PWA and the printer workflow. The order should have
been inverted.

**6. Secure Boot was never tested.** QEMU with OVMF and swtpm was used, which is the
right environment, but Secure Boot enforcement is not in the recorded results, and no
test ran on physical firmware. Secure Boot is the constraint that determines what may be
in the package list, so it needed to be settled first.

**7. Everything was attempted at once.** Base image, desktop, browser policy, RPC
runtime, PWA, knowledge base, playbooks, evidence export, qcow2 build, ISO build, and
QEMU harness — in one session. When the ISO turned out to be unusable, there was no
gate to point at and say "this is where it went wrong", because there were no gates.

**8. 4.5 GB of disposable build artifacts accumulated in the project directory.** They
are gitignored, so this is untidiness rather than a defect, but it obscures the small
amount of content that actually matters.

### The single-sentence lesson

> The session optimized for building the things it knew how to build, rather than for
> answering the questions that could invalidate the architecture — and the question it
> never asked was "what does the advisor see when they put in the USB stick?"

Phase 0 in document 3 exists specifically to prevent a recurrence.

---

## Part II — Anti-patterns

Specific mistakes that produce an unusable ISO. Numbered so they can be cited in review.

### Architecture

1. **Starting from a minimal base to build a desktop.** Derive from an official desktop
   image. You are not qualified to maintain a desktop integration and neither is anyone
   else on a team this size.
2. **Shipping a captured disk image.** It carries a shared LUKS key or no encryption, a
   shared `machine-id`, the build lab's Wi-Fi credentials, and no way to rebuild. See
   document 2, Option D.
3. **Choosing a mutable base for a fleet of non-technical users.** Within a year no two
   machines are alike and every support call is an investigation.
4. **Building the update channel last.** An ISO with no update path is a liability the
   day after it ships.
5. **Treating the ISO as the product.** The install *experience* is the product.

### Build process

6. **Routing around missing tooling.** Install Podman. Install the SELinux policy
   package. A second, divergent build path is a permanent tax.
7. **Manual steps that are not in the Containerfile.** If it is not in git, it will not
   survive the next rebuild and nobody will know it is missing.
8. **Referencing images by tag in anything that ships.** Tags move. Pin by digest.
9. **Rebuilding at promotion time.** You then ship an artifact nobody tested.
10. **Forgetting `bootc container lint`.** It catches a class of image defects that
    otherwise surface as a machine that will not boot.

### Installation and first boot

11. **Shipping any encryption secret in the image.** A preseeded passphrase is worse
    than no encryption because it looks safe.
12. **Assuming Anaconda can enroll TPM2.** It cannot. This must be a first-boot step.
13. **Not forcing the recovery key to be recorded.** An advisor who has never seen the
    recovery-key prompt and does not have the key will lose the machine and the data on
    it — and that data is client PII.
14. **Binding LUKS to TPM without keeping a passphrase keyslot.** A firmware update
    invalidates PCR 7 and the machine becomes unopenable.
15. **Leaving no first-boot flow at all**, so the advisor lands on a bare desktop with
    no account, no Wi-Fi, no browser sign-in, and no idea what to do.
16. **An unattended kickstart when you meant an interactive install**, so the installer
    silently wipes a disk, or conversely an interactive installer that presents Linux
    partitioning vocabulary to someone who has never partitioned anything.

### Secure Boot and kernel

17. **Adding any out-of-tree kernel module.** It forces MOK enrollment on every user:
    a blue text-mode screen, a typed password, at first boot. For this ICP that is an
    abandonment event.
18. **Claiming Secure Boot works because it booted in QEMU.** OVMF is a good pre-check,
    not a substitute for real firmware.
19. **Shipping a custom kernel.** Same consequence as 17, with more maintenance.

### Configuration

20. **Writing configuration into `/home` from the image.** It reaches nobody who already
    exists, cannot be updated, and breaks with a second user. Ship vendor defaults in
    `/usr`.
21. **Assuming a browser policy applied because you dropped the file in.** Verify at
    `brave://policy`. There is documented history of Brave policies not taking effect.
22. **Confusing `/etc` defaults with enforcement.** A user-modified `/etc` file is
    preserved across updates and will not be corrected by a later release.
23. **Treating Markdown policy documents as a security boundary.** They are readable
    policy. The boundary is the redaction gateway, the tool allowlist, and the signed
    action broker — all in code.

### Testing and claims

24. **Recording "booted" as a result** without naming the artifact digest, the hardware,
    and the firmware settings.
25. **Testing a loopback-bound service through a port forward** and counting the failure
    as a product defect, or the absence of a failure as a pass.
26. **Calling a checked-in SHA-256 manifest "signing".**
27. **Treating QEMU as hardware certification** for Wi-Fi, Bluetooth, webcams, suspend,
    docks, or physical printers.
28. **Declaring a phase complete without its gate.** This is the meta-anti-pattern that
    produces all the others.

---

## Part III — Legal, trademark, and branding

### Fedora trademark obligations

SP+ is a derivative of Fedora and is redistributed publicly. Fedora's trademark
guidelines apply, and they are simple to satisfy.

**Required for any redistributed derivative:**

- Remove the `fedora-logos`, `fedora-release`, and `fedora-release-notes` packages and
  replace them with equivalents — either the `generic-logos`, `generic-release`, and
  `generic-release-notes` packages that Fedora provides for exactly this purpose, or
  SP+'s own branding packages. SP+ should ship its own, since it wants Secure Prospective
  branding anyway.
- Do not call the product "Fedora" or use the Fedora logo as the product's mark.
- `/etc/os-release` must identify SP+, not Fedora. `NAME`, `PRETTY_NAME`, `ID`, `HOME_URL`,
  `BUG_REPORT_URL`, and `SUPPORT_URL` all need SP+ values. Note that `ID_LIKE=fedora` is
  appropriate and useful — it is an accurate technical statement, not a trademark use.
- Replace boot splash, wallpapers, and the installer branding.

**Permitted, and worth using:**

- The **"Fedora Remix"** secondary mark. Once the rebranding above is done, no special
  permission is needed to describe SP+ as a Fedora Remix. This is the honest and
  legally clean way to signal the lineage.
- Stating that SP+ is "derived from Fedora" or "built on Fedora Linux 44", provided the
  genuine Fedora repositories are used.

**Practical consequence for the Containerfile:** the branding swap is a small, explicit
layer, and it must be done in Phase 1 rather than left to the end, because it touches
the installer, the boot splash, and the desktop — three places that are easy to miss.

### Other licensing and distribution matters

- **Brave** is not in the Fedora repositories and parts of it are not under an
  open-source license. Including it is a deliberate exception to product principle 7,
  and it creates a supply-chain dependency on Brave's own RPM repository and signing.
  This is recorded as an open question in document 6. Firefox with enterprise policies
  and Chromium are the alternatives.
- **Redistribution of third-party RPMs** inside the image is generally fine for
  freely redistributable software, but each non-Fedora package needs its license checked
  before it goes in. Maintain a `LICENSES.md` in the repository listing every non-Fedora
  component, its source, and its license.
- **RPM Fusion** brings patent-encumbered codecs. Universal Blue includes them; whether
  SP+ should is a business decision with a jurisdictional dimension, and it belongs in
  document 6, not in a Containerfile that someone adds quietly.
- **Tailscale's** control plane is not fully open source. The client may ship; if a
  fully open-source control plane is required, Headscale must be evaluated. This is
  already noted in the build brief and remains open.
- **The GPL source obligation.** SP+ redistributes GPL binaries. Publishing the
  Containerfiles and pointing at Fedora's source repositories satisfies this in
  practice, but it should be stated on the download page rather than assumed.
- **No compliance claims.** This is a legal exposure, not just a product principle. The
  approved-vs-banned language table in `docs/SP_PLUS_LANDING_CONTENT.md` is the
  controlling reference and applies to every surface, including this repository, support
  email, and anything an SP+ engineer says in public.

### Naming

- Product name: **SP+**. Expanded on first use in member-facing material as
  *"SP+, the Secure Prospective advisor workstation"*.
- Internal identifiers: `sp-plus` for paths, services, image names, and repositories;
  `SPPLUS_` for environment variables; `SPPlus` where a camel-case identifier is needed.
- Retired names: "Advisor OS", "Secureprospective Advisor OS", "OpsPilot". The rename
  mapping is recorded in `docs/RENAME-LOG-2026-08-25.md`.
