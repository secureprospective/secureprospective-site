# Debian Image-Based Distribution Alternatives

**Status:** research note
**Purpose:** record the answer to whether Debian has a Silverblue-like “build your own distro” workflow.

## Conclusion

Yes, but Debian does not currently provide one single official, polished equivalent to Fedora Silverblue/bootc.

The closest usable option is **Vanilla OS**, using its **Vib** image builder and **ABRoot** update/rollback system. Vanilla OS 2 moved its base from Ubuntu to **Debian Sid**. Its custom-image template supports building a derivative OCI image from a Vanilla OS desktop image, publishing it through GitHub Actions, and switching an installed system to that image with ABRoot.

This is a different implementation from Fedora Silverblue:

- Fedora Atomic/Silverblue historically uses OSTree/rpm-ostree; newer Fedora image workflows use bootable OCI images and bootc.
- Vanilla OS uses OCI system images plus ABRoot's A/B root-filesystem transactions.
- Neither is equivalent to ordinary Debian package management with a few snapshots added.

For SP+, this research **does not change the existing Debian direction**. The controlling architecture deliberately uses Debian 13 Trixie with controlled mutability, managed APT transactions, verified Btrfs/Timeshift snapshots, and explicit restore operations. See `11-PLATFORM-DIRECTION-AND-DEBIAN-ARCHITECTURE.md` and decision D3 in `06-OPEN-QUESTIONS-AND-DECISIONS.md`.

## 1. Vanilla OS: closest match

### Components

- **Vib (Vanilla Image Builder):** defines an image as a YAML recipe made of stages and modules. Recipes can install Debian packages, build software, run commands, and add files.
- **ABRoot:** maintains two root filesystems and applies OCI images atomically. Its documented model provides immutable/atomic system updates and local atomic package changes.
- **Custom-image template:** a ready-made starting repository for building a derivative image on top of official Vanilla OS images such as the desktop image.

The custom-image template's workflow is approximately:

1. Fork the template.
2. Change `recipe.yml` and add modules or packages.
3. Let the included GitHub Action build and publish the OCI image to GHCR.
4. Point ABRoot at the published image.
5. Run the ABRoot upgrade/rebase operation.

A minimal recipe can use either a Vanilla OS image or a Debian base, depending on the desired ownership boundary. The Vib examples include `debian:sid-slim` as a base, while the custom-image template starts from `ghcr.io/vanilla-os/desktop:main`.

### Sources

- [Vanilla OS custom-image template](https://github.com/Vanilla-OS/custom-image)
- [Vib image builder](https://github.com/Vanilla-OS/Vib)
- [Vib documentation](https://docs.vanillaos.org/collections/vib)
- [ABRoot](https://github.com/Vanilla-OS/ABRoot)
- [Vanilla OS 2 release notes](https://github.com/Vanilla-OS/live-iso/releases/tag/2.0)

### Caveats

- Vanilla OS uses Debian Sid rather than Debian Stable. That is a poor fit for SP+'s decided Trixie-stable maintenance boundary.
- Adopting it would mean adopting Vanilla OS's update, installer, image, and support assumptions—not merely borrowing a build tool.
- It is the best candidate for a **separate prototype** if the goal is to explore a Debian OCI desktop, not an immediate replacement for the SP+ Debian plan.

## 2. Lower-level Debian OSTree options

These are closer to Silverblue's original OSTree model but are more DIY and do not provide Vanilla OS's complete desktop product surface.

### apt2ostree

`apt2ostree` builds Debian/Ubuntu package trees as OSTree commits. Its stated goals include reproducible, space-efficient image creation and keeping package inputs version-controlled. This is a promising build primitive for a Debian OSTree system, but it is not a complete desktop distribution, installer, update service, or support model.

Source: [stb-tester/apt2ostree](https://github.com/stb-tester/apt2ostree)

### Garden Linux OSTree image builder

`gardenlinux/ostree-image-builder` contains a proof-of-concept OSTree image build using Garden Linux tooling. Its Debian build takes packages from Debian repositories and currently belongs in the experimental/research category rather than the product-base category.

Source: [gardenlinux/ostree-image-builder](https://github.com/gardenlinux/ostree-image-builder)

### Debian OSTree images

`cheese/debian-ostree-images` demonstrates a Silverblue-compatible OSTree image based on Debian Bookworm with GNOME. It is useful as a reference and proof of feasibility, not evidence of a maintained Debian desktop ecosystem.

Source: [cheese/debian-ostree-images](https://github.com/cheese/debian-ostree-images)

## 3. Debian bootc options

`bootc` is the modern “bootable operating system as an OCI image” approach used in the Fedora ecosystem. Debian bootc experiments exist, including `bootcrew/debian-bootc`, but that repository is marked deprecated and moved to another repository. This makes Debian bootc a promising technical direction, not a mature Debian distribution foundation today.

Sources:

- [bootc project](https://github.com/bootc-dev/bootc)
- [Debian bootc reference — deprecated/moved](https://github.com/bootcrew/debian-bootc)

## 4. What does not count as an equivalent

- **Debian live-build:** excellent for producing a customized Debian ISO, but it does not provide atomic image upgrades or rollback by itself.
- **Btrfs plus Timeshift:** provides local snapshots and recovery, but it is not image-based deployment and is not bootc-equivalent.
- **A custom Debian package manifest:** reproducible input is valuable, but ordinary APT still leaves a writable, mutable installed system.

These are still appropriate for SP+'s current Debian path because its product promise is controlled mutability rather than false immutability.

## Recommendation

Do not replace the current SP+ Debian 13/Trixie architecture with Vanilla OS or an experimental Debian OSTree/bootc stack.

If an image-based Debian prototype is wanted later, run one bounded experiment using the **Vanilla OS custom-image template and Vib**, with the following explicit questions:

1. Can the image be based on a supported Debian Stable input rather than Sid?
2. Can it preserve SP+'s signed supply-chain and release requirements?
3. Can installation, hardware support, recovery, and support evidence be owned without importing Vanilla OS assumptions?
4. Does the result reduce maintenance enough to justify abandoning the current controlled-mutability plan?

Until that experiment answers those questions, the existing Debian design remains the safer product path.
