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
log: ~/work/sp-plus/iso/cycle14/bserial.log  (120763 bytes)
avc: 0 lines  [MEANINGLESS unless semodule -DB was run]
failed units seen:
```

<!-- ===== NARRATIVE BELOW — spb-state NEVER TOUCHES THIS ===== -->
## HEADLINE FOR WHOEVER READS THIS COLD (2026-08-26, ~20:20 CDT)
**DN-17 IS CLOSED.** An installed SP+ machine now prompts the advisor for a password on
the console at first boot and SETS it: `FIRSTBOOT_PROMPT_ON_CONSOLE=yes`,
`FIRSTBOOT_PASSWORD_SET=yes`, and the guest console printed `Password set` (cycle14).
DN-13 held throughout -- the account still ships LOCKED.

**But the three `live` gates were passing on NOTHING all night.** cycle14 ran all three
against an empty guest response and every one exited 0. That is a false green and it
means the entire `live` column was never actually measured. Fixed: a live gate that
produces no `_PASS=`/`_FAIL=` line now exits 1. Verified -- all three return EXIT=1 on
silence. **Treat every previous "live green" in this ledger as UNMEASURED, not passing.**

**DN-16 remains unproven. No login has ever succeeded on an installed SP+ system.**

## The demo, and what is being tested right now
Christopher presents at 09:30 CST 2026-08-27, installing on a 12-year-old Dell Inspiron
5737 himself, live. He is burning ISO `9bb54a7658d0e06c` (5,177,253,888 bytes) to USB
tonight and installing on the real Dell. That test exists to answer **DN-15**, the one
thing a VM cannot answer.

## DN-15 -- the demo risk, captured for the first time
The lane was serial-only and therefore blind to the exact surface the defect lives on.
`spb-screen` now screendumps the QEMU panel; `spb-boot` captures it at the LUKS prompt
and once settled. At the moment the serial shows the passphrase prompt, the panel shows
"Booting a command list" on black -- byte-identical across cycle13 and cycle14.
**CAVEAT, do not drop it:** i915 and plymouth are BOTH already in the initramfs (123
plymouth entries, 122 drm), and the VM's emulated VGA has no KMS driver at all. So the
black screen may be a lane artifact rather than the Dell's failure. The Dell decides.

## Christopher's decisions tonight
- **Plasma's own first-run wizard is ADOPTED as the post-install experience.** It is more
  welcoming; rebranding it is later work and no wheels are to be spun on it now. Our text
  password prompt STAYS (it works and satisfies DN-13). They are sequential, not
  competing -- the wizard appears whether or not the password was set.
- **The assistant is named Fin**, with the simple Christian fish (ichthys) icon, opening
  as a TUI in a terminal. Not a browser app window. The terminal's look will be made
  friendlier later so a non-technical advisor can sit in front of it comfortably.

## What shipped since the last update
- **Fin** (`/usr/libexec/sp-plus/fin`): a terminal front-end over the existing allowlisted
  RPC, tested end to end (diagnose -> approve -> run). Adds NO privileges of its own.
  Pinned first on the taskbar and in Kickoff in both look-and-feel variants.
- **DN-17 fix:** the helper is IMAGE content now, not written by `%post`. The journal is
  what settled it -- `status=203/EXEC`, `Unable to locate executable`. Then cycle13 showed
  the prompt printing and `serial-getty@ttyS0` restarting mid-read; the unit now conflicts
  with BOTH gettys.
- **`spb-screen`** and the live-gate honesty fix (above).
- Panel KMS drivers (`bochs_drm virtio_gpu qxl cirrus i915 simpledrm`) added to dracut.
- Disk hygiene: 29 GB reclaimed. **T-13 `6a593d7082614e56` was nearly swept as stale --
  it is the last known-good ISO and it is KEPT as the demo fallback.**

## Tried and refuted TONIGHT -- never delete, never retest
- **"The firstboot unit is absent."** The enable symlink was present all along.
- **"`%post` cannot write `/usr` on bootc."** It CAN -- the files were on the deployment.
  The journal (`203/EXEC`) is what actually explained it, not the filesystem survey.
  Same lesson as DN-16: the kernel/journal is the authority, not a `find`/`ls`.
- **"Missing DRM drivers cause DN-15."** i915 and plymouth are already in the initramfs.

## Traps that bit tonight
- **`spb-boot` began with `rm -f bserial.log`** and DESTROYED cycle10's boot log when I
  re-ran it. It rotates to a timestamped name now. Never delete a log.
- **Killing `$!` after `nohup ... &` killed a WRAPPER, not the script.** cycle12 kept
  running for 20 minutes, and would have overwritten the ISO cycle13 was installing from.
  Kill the real script pid; verify with `pgrep -af`.
- **A gate that cannot fail is worse than no gate.** See the live-gate false green above.
- `spb-hygiene` reports a running cycle as `running=no`; its DROP rule only fires past
  12h. Do not trust it to protect a live VM. Fix after the demo.

## Next move
Wait on Christopher's Dell result. If the passphrase prompt is VISIBLE on the Dell panel,
DN-15 was a lane artifact and the demo path is clear. If the panel is BLACK, that is the
demo-killer and the mitigation is to make text visible at the cost of the branded splash.
Then, with a credential finally existing, run the live gates FOR REAL and settle DN-16
with an actual login -- `semodule -DB` first, then `ls -Zd /etc/passwd /etc/nsswitch.conf`.

## Blocked on
Christopher's Dell observation. Nothing else.
