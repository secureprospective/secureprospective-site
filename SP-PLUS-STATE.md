# SP+ LIVE STATE
**Auto section regenerated 2026-08-27T04:46:25Z by `spb-state`. Do not hand-edit above the marker.**

## Machine truth
```
ISO on disk : 588e263f34b9e6ea  (5129928704 bytes)
repo HEAD   : 5786fd6 sp-plus: DN-15 real cause -- no rhgb, so plymouth never takes the panel
branch      : session/sp-plus-plan
uncommitted : 0 files
RAM avail   : 15 GB
disk free   : 102G
VMs running : 1
```

## Cycle directories
```
cycle10                                       1 MB  running=no  bserial=87778 B
cycle12                                       1 MB  running=no  bserial=- B
cycle13                                       2 MB  running=no  bserial=136710 B
cycle14                                       2 MB  running=no  bserial=125690 B
cycle15                                       1 MB  running=no  bserial=- B
cycle18                                       1 MB  running=no  bserial=- B
cycle20                                   11327 MB  running=no  bserial=121827 B
cycle24                                   11403 MB  running=yes  bserial=118346 B
cycle6                                        6 MB  running=no  bserial=150854 B
cycle7                                        1 MB  running=no  bserial=122974 B
cycle8                                        1 MB  running=no  bserial=78440 B
cycle9                                        1 MB  running=no  bserial=133215 B
```

## Latest evidence headline
```
log: /home/chris/sp-plus-iso/cycle24/bserial.log  (118346 bytes)
avc: 0 lines  [MEANINGLESS unless semodule -DB was run]
failed units seen:
```

<!-- ===== NARRATIVE BELOW — spb-state NEVER TOUCHES THIS ===== -->

# NARRATIVE — 2026-08-27, cycle20. Demo is 09:30 CST today.

## The headline: a login finally worked, and Fin ran.

cycle20 is the first SP+ build that has been logged into and audited from the inside.
Everything below was measured on the installed cycle20 system over SSH, not inferred.

ISO: `bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso`
  bytes  5234372608
  sha256 0a125deed919dd6a2bd82c40a3a9e979451b4ce569996f950ddbf76e99b24664

What this build carries (commits c88d8b9, 9af7f5a): sshd enabled, an attempted
hostname change, the package trim, and the DN-15 plymouth passphrase callback.

## PROVEN on the installed system

- A REAL LOGIN SUCCEEDED. `LOGIN_RESULT=SUCCESS (shell answered as spbtest)`, and the
  transcript shows `[spbtest@localhost /]$` answering `id -un`. Not labels. A shell.
- `systemctl is-system-running` -> `running`. ZERO failed units.
- SELinux Enforcing. `/etc/passwd` = passwd_file_t, `/etc/shadow` = shadow_t.
  `ausearch -m AVC -ts boot` -> `<no matches>`. spplus-relabel.service ran on first
  boot and stamped, and correctly skips afterwards.
- sshd active and listening on :22; SSH from the host works.
- sp-plus.service active, listening on 127.0.0.1:8765, and the RPC returns real data.
- FIN RUNS. Its TUI renders the fish banner and the four newbie menu items and exits
  cleanly. This is the first time Fin has been observed working on an installed system.
- Trim held: firefox, glibc-all-langpacks, mariadb-server and the CJK faces are ABSENT;
  glibc-langpack-en present. 1,914 packages. `/usr` 8.2G on disk.
- Boot: 1.165s kernel + 8.271s initrd + 6.514s userspace = 15.95s (on an SSD-backed
  VM; the Dell's spinning disk will be materially slower).

## OPEN DEFECTS, in the order they will hurt

1. DN-15 STILL OPEN — the LUKS passphrase prompt is INVISIBLE on the local panel.
   `screen-luks.png` is 1611 bytes (blank) on every boot of this build, even with the
   plymouth SetDisplayPasswordFunction callback compiled in. The capture instrument
   is fine: the settled screenshot is 741000 bytes. On the Dell, Christopher will be
   typing his passphrase into a black screen. This is the worst demo risk left.

2. NEW — 55 "Failed to resolve group" errors on the FIRST boot, before anything was
   touched: audio, disk, kvm, video, lp, tss. Cause: the standard system groups live
   only in `/usr/lib/group`, reachable through the altfiles NSS module, and early
   systemd-tmpfiles/udev cannot see them. Device nodes therefore fall back to root
   ownership. `lp` and `audio` matter for a demo that shows printing and calls.
   Fix direction: materialise the standard groups into `/etc/group` in the image.

3. NEW — the hostname change silently failed, and the build assertion was FALSE-GREEN.
   The image's `/etc/hostname` contains `6b6fdb11b1a5`, the container build ID. podman
   bind-mounts `/etc/hostname` during build, so `echo sp-plus > /etc/hostname` wrote to
   the bind mount and `test "$(cat /etc/hostname)" = sp-plus` read the same bind mount
   and passed. Nothing was committed to the image. DO NOT set the hostname in the
   Containerfile. Set it in the kickstart (`network --hostname=sp-plus`) instead.

4. The SP+ service account exists only in `/etc/passwd` and `/etc/group`, not in
   `/usr/lib/`. If `/etc/group` is damaged, sp-plus.service dies with `216/GROUP` and
   Fin never starts. Observed directly, because I caused exactly that damage (below).

## WHAT IS STILL UNPROVEN — do not claim these

- Anaconda's OWN user-creation path. The lane's account was written directly into the
  deployment's /etc, because driving Anaconda's user spoke would mean guessing at
  keystrokes. DN-16 did not reproduce here, but the mechanism Christopher actually
  used has NOT been retested. Only his install can settle that.
- The desktop. Nothing in this audit opened Plasma, applied the SP+ Windows theme, or
  clicked Fin's icon. Both look-and-feel packages are present on disk; that is all.
- Anything about the Dell's real hardware.

## LANE LESSONS (encoded in spb-mkuser; do not relearn these)

- `/sysroot` at pre-pivot is a READ-ONLY composefs overlay. The deployment's writable
  /etc is already mounted at `/sysroot/etc`, and var at
  `/sysroot/sysroot/ostree/deploy/default/var`. Writing under the deployment path fails.
- The dracut shell has NO chroot, head, wc, sync or blockdev.
- NOTHING IS FLUSHED. spb-boot kills QEMU outright, so page-cache writes are lost.
  Several passes silently lost their edits before this was found. The flush that works
  is `mount -o remount,ro` on the filesystem; XFS commits on remount.
- Never `sed -i` in that shell: sed cannot write its temp file, and it left /etc/group
  EMPTY. That truncation, not the product, caused the `216/GROUP` failure. Once
  /etc/group was restored to the image's contents, sp-plus.service came up active.
- A `pgrep -f "spb-boot ..."` watcher MATCHES ITS OWN SHELL and never exits. Match on
  `pgrep -a -x bash | grep`, or wait on a captured pid.

## RECOMMENDED FOR THE NEXT BUILD (Christopher decides)

- Fix DN-15 properly. It is the only defect the audience will see.
- Materialise standard groups into /etc/group.
- Move the hostname to the kickstart.
- Further trim, all verified to have ZERO reverse dependencies on the installed system:
  nvidia-gpu-firmware 101 MB, podman 49 MB, python3-pyside6 55 MB, openblas-openmp 44 MB.
  Riskier, same zero-reverse-dep result but likelier to be loaded at runtime rather
  than by rpm dependency: qt6-qtwebengine 277 MB, mesa-vulkan-drivers 169 MB.
