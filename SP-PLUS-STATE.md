# SP+ LIVE STATE
**Auto section regenerated 2026-08-27T01:19:34Z by `spb-state`. Do not hand-edit above the marker.**

## Machine truth
```
ISO on disk : 9bb54a7658d0e06c  (5177253888 bytes)
repo HEAD   : 2651ff1 DN-17/DN-15: stop the getty stealing the prompt; ship panel KMS drivers
branch      : session/sp-plus-plan
uncommitted : 0 files
RAM avail   : 14 GB
disk free   : 104G
VMs running : 1
```

## Cycle directories
```
cycle10                                       1 MB  running=no  bserial=87778 B
cycle12                                       1 MB  running=no  bserial=- B
cycle13                                   11302 MB  running=no  bserial=136710 B
cycle14                                   11311 MB  running=yes  bserial=120763 B
cycle6                                        6 MB  running=no  bserial=150854 B
cycle7                                        1 MB  running=no  bserial=122974 B
cycle8                                        1 MB  running=no  bserial=78440 B
cycle9                                        1 MB  running=no  bserial=133215 B
```

## Latest evidence headline
```
log: /home/chris/sp-plus-iso/cycle14/bserial.log  (120763 bytes)
avc: 0 lines  [MEANINGLESS unless semodule -DB was run]
failed units seen:
```

<!-- ===== NARRATIVE BELOW — spb-state NEVER TOUCHES THIS ===== -->
## HEADLINE FOR WHOEVER READS THIS COLD (Tom/Beelink, 2026-08-26 night)
**DN-18, DN-19 and DN-20 are closed at the IMAGE level with numbers: PACKAGES 32/0,
BRANDING 11/0, APPS 41/0.** The payload image is now the real product — Brave, the SP+
runtime, the app suite, SP+ os-release and logos, an SP+ plymouth theme, and an advisor
account that ships LOCKED. None of that is proven on an INSTALLED system yet; the `live`
gates are a separate question and DN-17, DN-16 and DN-15 are all still open.
**Next move: read the output of `~/sp-plus-bee/spb-cycle cycle9`, which runs
build -> install -> boot -> the three live gates -> evidence unattended.**

## Where it stands
The root cause of DN-18 was two-layered. The product lived in
`projects/sp-plus/Containerfile` (Fedora 43) and was never built; but also
`~/sp-plus-iso-build.sh` **never built the payload image at all** — it listed
`sp-plus-kde:spike` in STEP 2 and consumed whatever stale copy sat in the root store.
Both are fixed: the product is merged into `images/kde/Containerfile` on Fedora 44 and
the build script has a STEP 0 that builds it.

ISO `504fe550af3735ed` (5,136,621,568 bytes) was the first ISO ever to contain the
product — 1 GB larger than T-13 `6a593d70…`. cycle8 installed from it at 11,485,118,464
bytes against cycle7's 8,339,324,928, which is the product landing on disk. cycle8 then
FAILED to boot; see below. cycle9 is building with the fix.

## What I did since the last update
- **Merged the product into the payload image** and added STEP 0 to the build script.
  Image gates went 17/14 -> 32/0.
- **Branding (DN-19) 1/10 -> 11/0** on the payload, and the same treatment applied to the
  installer image, whose build context moved to `projects/sp-plus` so it can reach
  `branding/`. Logo surfaces are enumerated from `rpm -ql fedora-logos`, and symlinked
  paths are `rm -f`'d before writing, because writing through a symlink modifies the
  target and leaves the link itself checksumming as stock.
- **App suite (DN-20) 14/27 -> 41/0.** The whole suite resolves on Kinoite 44.
- **DN-13 upheld:** `ARG POC_LOGIN_VALUE` and its `chpasswd` are deleted. The account is
  `useradd` + `passwd -l advisor`. Gate says `PASS dn13 advisor account is LOCKED`.
- **Fixed three instrument bugs my own changes caused or exposed** — see below.

## Next move
Read `~/spb-cycle9.log`. If the boot reaches a login prompt, run `semodule -DB`, then
attempt a REAL login and report whether it succeeded, not whether labels looked right.

## Blocked on
Nothing.

## Tried and rejected, with why — NEVER DELETE ENTRIES
- **"SELinux Enforcing deadlocks the boot"** (DN-14, corrected). FALSE — a timing
  artefact from typing the LUKS passphrase on a timer.
- **The first-boot password unit causes the boot hang.** Masking it gave a byte-identical
  hang. It is implicated in DN-17, a different failure.
- **The system asks for the LUKS passphrase twice.** It does not.
- **"`/etc` is fully labeled"** from a `find`/`ls -Z` survey. The survey was wrong;
  `ls -Z` prints in columns. **The kernel AVC log is the authority.**
- **Fedora 44 removed local graphical installs.** False.
- **A missing RPM caused the grey installer screen.** False — `TMPDIR=/mnt/sysimage/boot`.
- **`/.autorelabel` is the fix.** No; the ostree root is read-only (bootc #1087).
- **`chcon` in the Containerfile.** OCI layers do not carry `security.selinux` xattrs.
- **`spb-boot` v1/v2/v3 GRUB timing.** v4 works; do not re-derive.
- **NEW: rebuilding the initramfs without `--add ostree`.** Baking in the SP+ plymouth
  splash with a plain `dracut --force --no-hostonly` produced an initramfs with ZERO
  ostree content (`lsinitrd | grep -ci ostree` = 0) while `/usr/lib/dracut/modules.d/50ostree`
  existed. LUKS unlocked, then `[FAILED] Failed to start initrd-switch-root.service` and
  emergency mode. cycle8 is the evidence. The build now passes `--add ostree` and
  ASSERTS `lsinitrd | grep -q ostree`.
- **NEW: `systemctl enable sddm.service` on Kinoite 44.** Fails outright —
  `display-manager.service` already symlinks to `plasmalogin.service` from
  `plasma-login-manager-6.7.4`. Fedora 44 KDE ships plasmalogin, not sddm. We take the
  distro default; sddm stays installed so its unit file ships.
- **NEW: Brave's rpm on Kinoite.** `/opt` is a symlink to a `var/opt` that does not
  exist, so unpack fails with `cpio: mkdir failed`. `/opt` now points at `/usr/lib/opt`
  (bootc discussion #1038, approach 1: image content, read-only at runtime).

## Instrument bugs found tonight — the harness was keyed to the old branding
- **`spb-env` hardcoded the ISO filename.** Image-builder derives the output name from
  the payload's os-release, so branding renamed it `bootc-fedora-44-...` ->
  `bootc-sp-plus-1.0-...`. The lane would have silently kept testing the OLD ISO. It now
  takes the newest ISO under `out/` and honours `$SPB_ISO`.
- **`spb-boot` detected the GRUB menu by grepping for the literal `Fedora Linux`** — the
  boot entry title. Renaming the OS blinded it: `GRUB_MENU_SEEN=no` while the menu was
  demonstrably on screen and held. It now matches `GRUB version`.
- **A watcher written as `while pgrep -f "sp-plus-iso-build.sh"` matches its own command
  line** and loops forever. Watch on the **pid**. This is the same class of trap that
  killed two ssh sessions earlier today.

## New in the lane
- **`spb-cycle <name>`** runs build -> install -> boot -> live gates -> evidence
  unattended and reports in one block. Christopher's standing rule is that delegated work
  PINGS BACK when it is done or needs a turn; the driver must never sit polling. Recorded
  in RUNBOOK.md.
