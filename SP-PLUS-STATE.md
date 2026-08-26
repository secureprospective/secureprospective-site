# SP+ LIVE STATE
**Auto section regenerated 2026-08-26T21:47:09Z by `spb-state`. Do not hand-edit above the marker.**

## Machine truth
```
ISO on disk : 6a593d7082614e56  (4135002112 bytes)
repo HEAD   : 5eeb80e SP+: match the plus shading to the S/P letters (round 4)
branch      : session/sp-plus-plan
uncommitted : 12 files
RAM avail   : 14 GB
disk free   : 104G
VMs running : 1
```

## Cycle directories
```
cycle6                                     8362 MB  running=no  bserial=150854 B
cycle7                                     7977 MB  running=yes  bserial=122974 B
```

## Latest evidence headline
```
log: /home/chris/sp-plus-iso/cycle7/bserial.log  (122974 bytes)
avc: 0 lines  [MEANINGLESS unless semodule -DB was run]
failed units seen:
  Failed to start [0;1;39mspplus-firstboot-p…[0m first-boot advisor password setup
```

<!-- ===== NARRATIVE BELOW — spb-state NEVER TOUCHES THIS ===== -->
## HEADLINE FOR WHOEVER READS THIS COLD
DN-16 (unlabeled `/etc`) is **probably closed** but the login was never completed, so it
is NOT confirmed. DN-17 (the first-boot password service fails, so no credential exists
and nobody can log in) is **new, open, and the top blocker**. DN-15 (invisible LUKS
prompt on the local screen) is **open and untouched** and is the one that will embarrass
a live demo. **Next move: get a root shell without auth and read
`journalctl -u spplus-firstboot-password.service -b`.**

## HEADLINE — READ FIRST
**DN-18 is the top blocker: the ISO contains NO SP+ software.** The package gate says
17 pass / 14 fail against `localhost/sp-plus-kde:spike` — no Brave, no sddm, no
`/usr/libexec/sp-plus` runtime, no PWA, no playbooks, no Brave policy, **no advisor
account**. The build installs `images/kde/Containerfile` (four lines: Kinoite + cups +
firewalld) while the real product lives in `projects/sp-plus/Containerfile`, which is
never built. That also explains DN-17: there is no advisor account to set a password on.
**Next move: merge the real Containerfile into the payload image, on Fedora 44, with the
advisor account LOCKED (DN-13 — the existing file ships `advisor-poc`, which violates it),
then `spb-packages image` before spending 15 minutes on a build.**

## Where it stands
The T-13 ISO (`6a593d70…`) installs fully unattended onto Dell-like SATA and boots to a
working login prompt under SELinux Enforcing with zero AVC denials in 122 KB of serial.
Every unit that DN-16 was denying now starts clean. But `spplus-firstboot-password.service`
is the single failed unit, so root and the advisor account have no credential at all and
every login returns `Login incorrect`. The machine is unusable for a new reason.

## What I did since the last update (Claude/CT105, 2026-08-26 evening)
- **Fixed `spb-boot`** through four versions. The GRUB countdown is 1 s and only starts
  after several seconds of OVMF POST, so both "set up socat first" and "fire 250 keys
  immediately" miss it. v4 hammers `end` continuously in the background and enters the
  editor with `home` `e` **while the hammer still runs**, because `e` is what stops the
  countdown permanently. Evidence: `GRUB_MENU_SEEN=yes`, `IN_EDITOR=yes`,
  `LUKS_PROMPT_ON_SERIAL=yes after 21s`, 122,974 bytes of serial.
- **Built the T-13 ISO** — sha `6a593d70…`, 4,135,002,112 bytes. Differs from b04
  `afc0f9c7…`, so the relabel fix is genuinely in it.
- **Ran cycle7 install fully unattended** — 8,339,324,928 bytes, plateaued at 420 s,
  final screen stddev 9068 (a real UI). First time Anaconda was driven with no human.
- **Built the Bee lane** (`~/sp-plus-bee/`): `spb-sha|build|install|boot|shell|evidence
  |hygiene|state`. Whole lane runs unprivileged; root lives inside the guest.
- **Found DN-17** from the serial log.

## Next move
Boot cycle7 with `./spb-boot "enforcing=0 systemd.unit=emergency.target"` (or `rd.break`),
get a root shell without authentication, and read
`journalctl -u spplus-firstboot-password.service -b`. Then read the unit's definition in
the installer tree. **DN-13 is binding: the fix is never a shipped default password.**

## Blocked on
Nothing. DN-17 is diagnosable tonight.

## Tried and rejected, with why — NEVER DELETE ENTRIES
- **"SELinux Enforcing deadlocks the boot"** (recorded as DN-14, since corrected). FALSE.
  A single-variable A/B where the harness typed the LUKS passphrase on a timer and it
  landed differently between runs. It boots to a login prompt under Enforcing.
- **The first-boot password unit causes the boot hang.** Masking it gave a byte-identical
  hang. (Note: that unit is now implicated in DN-17, a *different* failure. It does not
  hang the boot.)
- **The system asks for the LUKS passphrase twice.** It does not.
- **"`/etc` is fully labeled"** — a `find`/`ls -Z` survey said 4820 files, 0 unlabeled.
  The survey was wrong; `ls -Z` prints in columns so `?` is not at line start.
  **The kernel AVC log is the authority, never a filesystem survey.**
- **Fedora 44 removed local graphical installs.** False.
- **A missing RPM caused the grey installer screen.** False — it was `TMPDIR=/mnt/sysimage/boot`.
- **`/.autorelabel` is the fix.** It is not; the ostree root is read-only (bootc #1087).
- **`chcon` in the Containerfile.** OCI layers do not carry `security.selinux` xattrs.
- **`spb-boot` v1/v2/v3 GRUB timing** — see above; do not re-derive, v4 works.
