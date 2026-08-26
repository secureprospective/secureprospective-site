# Live QEMU installer test log

Date: 2026-08-25
Artifact: `artifacts/iso/advisor-os-installer.iso`
Mode: QEMU ISO installer with disposable install disk

## Issue 001 — Installation Source repository setup

**Observed:** Anaconda reaches Installation Source. Media verification can be run successfully. Clicking **Done** then displays **“Error setting up repositories.”**

**Current classification:** Open; likely installer network/repository initialization, not yet a LUKS2 or storage failure.

**First diagnostic action:** Enable the virtual Ethernet connection in Network & Host Name, wait for DHCP, return to Installation Source, and retry Done. This is a single-variable test before changing the ISO.

**Relevant implementation facts:**

- Installer repositories are moved from `/etc/yum.repos.d` to `/etc/anaconda.repos.d` in the installer image, matching the current image-builder bootc generic ISO example.
- Enabled repositories include Fedora, Fedora Updates, and Fedora Cisco openh264 metalink definitions.
- The ISO boot entry includes `inst.stage2=hd:LABEL=Secureprospective-Advisor-POC` but does not explicitly include `ip=dhcp`.
- The bootc payload is embedded in the ISO's squashfs and should be deployed by the bootc Kickstart line; this is not a conventional package-install DVD.

**Not yet tried:** booting with `ip=dhcp`, changing repository definitions, changing image type, or rebuilding. Collect `/tmp/packaging.log` and `/tmp/anaconda.log` if the network retry fails.

## Issue 001 update

**Result:** Enabling the virtual network alone did not clear the repository error. Selecting an explicit Fedora 43 network source in the Anaconda GUI allowed installation to start. This points to the default mirror/media repository selection as the immediate installer defect or usability problem; exact repository URL and any later errors should be captured from the live VM.

**Current test state:** Installation is in progress in the QEMU GUI. Continue capturing exact screen text and whether each issue blocks or allows continuation.

## Controlled reproduction

Bee launched the same ISO with a separate temporary qcow2, KVM, QEMU user networking, `ip=dhcp`, and serial/text Anaconda mode. The ISO booted successfully, mounted stage2, acquired the virtual network path, switched into the Anaconda environment, and exposed Anaconda's log panes. The text-mode path requires interactive selection and does not expose the full graphical Installation Source spoke, so this run did not reproduce the GUI click itself. No host VM or install disk was modified.

**Evidence:** `artifacts/repository-repro.log` and `artifacts/repository-repro-pexpect.log` are local ignored diagnostics.

## Fix iteration 001 — make the installer self-contained

**Defect found:** `interactive-defaults.ks` used `registry:localhost/advisor-os:poc`, but image-builder embeds the payload under `/var/lib/containers/storage` and the ISO storage manifest contains the image as `localhost/advisor-os:poc`. The installer therefore could not use the embedded payload as written.

**Change:** Use `containers-storage:localhost/advisor-os:poc`. Also enable DHCP in the ISO boot arguments, add a Kickstart DHCP network line, and provide an explicit Fedora 43 repository URL so Anaconda does not depend on the failing local-media/mirror default.

**Test credentials for the disposable POC payload:** username `advisor`; password `advisor-poc`.

**Status:** Rebuilding the ISO. This iteration must be tested separately from the prior ISO; do not call installation acceptance passed until the rebuilt ISO completes installation and reboot/unlock.

## Fix iteration 002 — use a bootc-capable Anaconda

**Defect found during controlled install:** Fedora 43 Anaconda 43.44 parses the `bootc` Kickstart command but has no bootc payload installation implementation. The automated run fell back to package installation and terminated with the exact error: `Not enough disk space to download the packages; size 827.77 MiB.` Increasing the target disk from 24 GiB to 48 GiB did not change the result.

**Additional finding:** A Kickstart `repo` command conflicts with the bootc payload path; it was removed. The reference generic bootc ISO pattern uses the installer image's `/etc/anaconda.repos.d` and only the `bootc` command.

**Change:** Build the installer environment from Fedora 44, whose Anaconda contains the bootc payload integration; retain DHCP and the embedded `containers-storage:` payload reference. Use no Kickstart `repo` directive.

**Status:** Rebuilding the installer ISO. The prior Fedora 43 ISO is not a valid bootc installer despite booting and showing the GUI.

## Fix iteration 003 — move bootc import temporary storage to disk

**Defect found:** Fedora 44 Anaconda correctly invoked bootc, but bootc failed while importing the embedded 6.8 GiB payload: `write /var/tmp/container_images_<id>: no space left on device`. This occurred with both 48 GiB target disks and 6 GiB/16 GiB VM RAM, proving the target disk was not the limiting resource; installer `/var/tmp` is RAM-backed.

**Change:** Set installer `TMPDIR=/mnt/sysimage`, the mounted target filesystem, so the temporary payload import uses disk capacity.

**Status:** Rebuilding the Fedora 44 installer ISO for another automated encrypted-install test.

## Fix iteration 003a — apply temp directory through Anaconda's systemd service

**Result:** Setting the image `ENV TMPDIR` did not affect the Anaconda process; the ISO still logged `/var/tmp/container_images_<id>` and failed with no space left.

**Change:** Add an `anaconda.service` systemd drop-in with `Environment=TMPDIR=/mnt/sysimage`, which is inherited by the bootc child after the target filesystem is mounted.

## Fix iteration 004 — diagnose the empty-root directory

**Result:** Redirecting temporary storage worked: the previous no-space error disappeared. The next bootc validation failure is `Found empty directory: <UUID>` even with explicit encrypted ext4 `/`, `/boot`, and `/boot/efi` partitions. The explicit layout confirms Anaconda created ext4 root and EFI correctly.

**Diagnostic change:** Add a temporary bootc wrapper that prints the mounted target directory tree immediately before the real bootc validation. This is diagnostic only and must be removed before a release image.

## Diagnostic wrapper attempt — rejected

A temporary `/usr/bin/bootc` wrapper was prepared to print the target tree, but it caused image-builder's preflight `bootc install print-configuration` to hang. It was removed and will not be included in the installer. The existing serial logs retain the exact bootc error; no wrapper build was treated as a valid artifact.

## Diagnostic wrapper retry

The first wrapper changed the real binary path, which interfered with image-builder preflight. Retry preserves the original binary at `/usr/bin/bootc-real` and limits the wrapper to Anaconda's service PATH. This is still diagnostic only.

## Fix iteration 005 — avoid creating the bootc temp directory in rootfs

**Finding:** The diagnostic tree showed only `/mnt/sysimage/boot` before bootc. The random UUID directory is created by bootc itself because `TMPDIR=/mnt/sysimage` makes bootc's own temporary directory a direct child of the root filesystem immediately before `require_empty_rootdir()`.

**Change:** Set `TMPDIR=/mnt/sysimage/var`. Anaconda's bootc integration treats `/var` as an allowed mount point, so bootc's temporary UUID directory will be contained within `/var` rather than appearing as an invalid root entry.

## Build loop — clean QEMU install path

The external build planner confirmed the rootfs UUID failure is caused by bootc allocating its temporary directory directly under `/mnt/sysimage` before empty-root validation. The first proposed `/var` layout did not work in this Anaconda path: the bootc wrapper observed no `/mnt/sysimage/var` mount and bootc reported `Inspecting filesystem /mnt/sysimage: No such file or directory`. A separate `/tmp` partition was rejected by Anaconda with `Bootc installation does not yet support user-specified mount points. Unsupported mount points: /tmp`.

The working POC path is now:

- 80 GiB QEMU install disk and 8 GiB RAM.
- UEFI QEMU boot with virtual TPM.
- 1 GiB EFI, 16 GiB ext4 `/boot`, encrypted LUKS2 ext4 root.
- Anaconda service `TMPDIR=/mnt/sysimage/boot` so bootc's Rust temporary UUID directory is below the mounted `/boot` filesystem.
- The temporary wrapper binds target `/boot` over installer `/var/tmp` during the large container-image import, unbinds it after `Deploying container image...done`, and invokes bootc's supported `--skip-finalize` because Anaconda owns final target cleanup.

Attempt `qemu-boot-skip-07` passed automated installation:

- LUKS2 and ext4 creation succeeded.
- Container image import succeeded without RAM-backed `/var/tmp` exhaustion.
- `Bootc deployment complete` and `Installation complete!` were recorded.
- The disposable installed disk rebooted under UEFI.
- The installed Fedora 43 system requested the LUKS passphrase `advisor-poc`, reached multi-user.target, started `advisor-os.service`, and accepted `advisor` / `advisor-poc` login on serial console.

Evidence: `artifacts/test-logs/qemu-boot-skip-07.log` and `artifacts/test-logs/qemu-installed-verify-07.log`.

This is a working POC install/test path, not release acceptance. The diagnostic wrapper, large `/boot` scratch design, `--skip-finalize`, and `selinux=0` remain release-cleanup items. Do not remove them until a supported replacement is tested.
