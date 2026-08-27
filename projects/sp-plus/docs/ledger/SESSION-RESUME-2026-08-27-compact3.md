# SP+ RESUME #3 — written 2026-08-26 ~23:15 CDT, mid-cycle24. DEMO IS 09:30 CST TODAY.

## 1. WHAT WE ARE DOING
Ship a demonstrable SP+ ISO (Fedora Kinoite 44 bootc) that Christopher installs live on a
12-year-old Dell Inspiron 5737 (spinning SATA) at 09:30 CST 2026-08-27.
Repo: /home/chris/work/secureprospective-advisor-os   Branch: session/sp-plus-plan
Lane: /home/chris/sp-plus-bee (spb-* scripts). NO WORK ON MAIN. NEVER --no-verify.

## 2. IN FLIGHT RIGHT NOW — most perishable, read this first
**cycle24** — the build that should land. Driver pid **2074843**, `bash ./spb-cycle cycle24`.
  alive?   for p in $(pgrep -x bash); do tr '\0' ' ' < /proc/$p/cmdline; echo; done | grep cycle24
  logs     /home/chris/spb-cycle24.log  and  /home/chris/sp-plus-build-cycle24.log
  watcher  background task bopn16o24 pings on driver exit
  on result: read the assertion lines, then the ISO sha, then LUKS screenshot.
**cycle20 boot VM** — qemu pid **1954485**, the WORKING audited reference system. KEEP IT
  until cycle24 is proven. SSH: port 2299, user spbtest, password spplus-test.
  ssh -p 2299 spbtest@127.0.0.1 (no sshpass/expect on this box; use SSH_ASKPASS, see §10)

## 3. PID MATCHING — THIS BIT ME THREE TIMES TONIGHT
`pgrep -af "spb-cycle cycleN"` MATCHES YOUR OWN SHELL and returns the nohup wrapper first.
A watcher armed on the wrapper reported "EXITED" 9 seconds into a 15-minute build.
ALWAYS resolve the driver by reading /proc/<pid>/cmdline and matching `bash ./spb-cycle cycleN`.

## 4. STATUS TABLE
| Thing | State |
|---|---|
| Real login on installed SP+ | **PROVEN** (cycle20) — a shell answered as spbtest |
| Zero failed units, is-system-running=running | PROVEN (cycle20) |
| SELinux Enforcing, correct auth labels, 0 AVCs | PROVEN (cycle20) |
| sshd listening, SSH works | PROVEN (cycle20) |
| sp-plus.service active on 8765, RPC returns data | PROVEN (cycle20) |
| **Fin runs** (TUI renders, clean exit) | PROVEN (cycle20) |
| DN-15 LUKS prompt visible on panel | **FIX BUILT, NOT YET OBSERVED** — cycle24 |
| Standard groups / hostname / debloat | assertions PASS at build; runtime UNVERIFIED |
| Anaconda's own user-creation path | **UNPROVEN — only Christopher's install settles it** |
| Desktop: apps opening, SP+ theme selectable, Fin icon | **UNPROVEN** |

## 5. ARTIFACTS
cycle20 ISO (audited, working, NOT carrying tonight's fixes):
  5234372608 bytes  sha256 0a125deed919dd6a2bd82c40a3a9e979451b4ce569996f950ddbf76e99b24664
Known-good fallback ISO: sha256 6a593d7082614e56... (bootc-fedora-44-...). DO NOT DELETE.
Screenshots kept: cycle20/screen-awake.png (the "Welcome to Plasma Desktop" first screen),
screen-wiz2.png (wizard Language step), screen-luks.png (1611 bytes = BLANK, the defect).

## 6. DN-15 — SOLVED IN TWO PARTS, BOTH NOW BUILT (this is the night's main find)
The LUKS passphrase prompt was invisible because it was TWO stacked defects:
 (a) The SP+ theme declares ModuleName=script. The interpreter is script.so from
     **plymouth-plugin-script**, which was never installed. `plymouth-scripts` is a
     DIFFERENT package and is not a substitute. /usr/lib64/plymouth/ had no script.so.
 (b) Even installed, the image only made the default.plymouth SYMLINK. dracut asks
     plymouth's OWN tooling, which reads /etc/plymouth/plymouthd.conf -- still `bgrt`.
     So dracut shipped two-step.so and left script.so out.
Fix: install the plugin AND run `plymouth-set-default-theme sp-plus`, asserted before dracut.
Verified in a container BEFORE building:
     default theme BEFORE: bgrt / AFTER: sp-plus / plymouth/script.so now IN the initramfs.
Build assertion `DN15_PLUGIN_OK` passed in cycle23.
CAVEAT: a prompt has still NEVER been SEEN on a panel. Only a screenshot settles it.

## 7. HYPOTHESES ALREADY REFUTED — DO NOT RETEST
- "KMS drivers missing" -> added bochs_drm/i915/etc, panel STILL blank. Not the cause.
- "The theme lacks SetDisplayPasswordFunction" -> added it, STILL blank. Not sufficient alone.
  (Both were downstream of §6: the script was never executed at all.)
- "216/GROUP is a product defect" -> NO. Caused by MY `sed -i` truncating /etc/group in the
  dracut shell. Restoring /etc/group made sp-plus.service active. Do not chase it.
- "The home directory is broken on SP+" -> NO. My initramfs-era writes were never flushed.
  Created properly with sudo it came back correctly labelled user_home_dir_t.
- "These 6 packages have zero reverse deps" -> **WRONG EVIDENCE**. `dnf repoquery
  --whatrequires` on the INSTALLED system returns empty for everything. ONLY
  `dnf remove -y --assumeno <pkg>` against the IMAGE tells the truth. Confirmed unsafe:
  podman(takes bootc+rpm-ostree), openblas-openmp(takes spectacle), python3-pyside6
  (takes akonadi-server), qt6-qtwebengine(takes khelpcenter/plasma-discover/kdeplasma-addons).
  Only nvidia-gpu-firmware is safe.
- "Setting /etc/hostname in the Containerfile works" -> NO. podman BIND-MOUNTS /etc/hostname
  during build, so the write AND the assertion reading it back both hit the bind mount and
  nothing reaches the image. Image /etc/hostname contained the container ID `6b6fdb11b1a5`.
  It is now set in the kickstart instead.

## 8. DRACUT PRE-PIVOT SHELL — hard-won facts (encoded in spb-mkuser)
- /sysroot is a READ-ONLY composefs overlay. The writable deployment /etc is ALREADY at
  **/sysroot/etc**; var at **/sysroot/sysroot/ostree/deploy/default/var**. Writing under
  $DEP/etc fails with "Read-only file system".
- NO chroot, head, wc, sync or blockdev exist in that shell.
- NOTHING IS FLUSHED — spb-boot kills QEMU, page-cache writes vanish. The flush that works is
  `mount -o remount,ro <fs>`; XFS commits on remount. Several passes silently lost edits.
- NEVER `sed -i` there: it cannot write its temp file and TRUNCATES the target.

## 9. DECISIONS (do not relitigate)
- DN-13 absolute: SP+ ships NO human account. Service identity is spplus (system, uid<1000).
- Working ISO first; polish after frictionless install/login/app-open.
- KEEP: plasma-workspace-wallpapers, java-25-openjdk-headless, ibus+cldr-emoji-annotation,
  python3-botocore. Plasma's setup wizard STAYS (rebranding parked).
- Fin = the assistant, ichthys icon, opens as a TUI in kitty.
- NOT TOUCHED ON PURPOSE: sssd and systemd-homed (auth path, DN-16 cost a day), avahi
  (printer discovery IS the demo), thermald/tuned/smartd (old laptop, old drive), oomd,
  mesa-vulkan-drivers (kwin software-rendering risk not worth 169 MB).

## 10. ENVIRONMENT
- No sshpass and no expect on the Beelink. Use:
  SSH_ASKPASS=<script echoing the password> SSH_ASKPASS_REQUIRE=force setsid -w ssh -p 2299 \
    -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PreferredAuthentications=password \
    spbtest@127.0.0.1 '<cmd>'
- spplus-test is a DISPOSABLE test credential. Never in the ISO, the repo, or committed config.
- sudo -n works for podman only. /tmp is a 16 GB tmpfs — never copy a repo there.
- A VM named `chris` belongs to Christopher. NEVER kill it.
- CT105 (192.168.1.105) is head-brain: observe and report, never intervene.

## 11. LEDGER STATE — all committed on session/sp-plus-plan
669c5e0 cut the trim back to what is safe (podman takes bootc)
5b5cb5a DN-15 second half (plymouth-set-default-theme)
f658cd9 group merge after the spplus account exists
d7d5202 DN-15 root cause + standard groups + startup/autostart debloat
879e79d cycle20 audit ledger
Working tree clean at the time of writing.

## 12. NEXT ACTIONS, IN ORDER
1. Read cycle24's result (§2). Quote the assertion lines VERBATIM, never a verdict.
2. If the build passed, let install+boot finish, then LOOK AT cycle24/screen-luks.png.
   >100 KB and showing the prompt = DN-15 closed. ~1611 bytes = still blank, still open.
3. Create the lane account: CYCLE=cycle24 spb-boot 'rd.break=pre-pivot', then
   CYCLE=cycle24 spb-mkuser spbtest spplus-test, then CYCLE=cycle24 spb-boot,
   then CYCLE=cycle24 spb-login spbtest spplus-test.
4. SSH in and confirm at runtime: hostname is sp-plus, `getent group lp` resolves,
   journalctl -b -p err has NO "Failed to resolve group", enabled units ~76.
5. Re-run the three live gates now that an account exists.
6. Update ~/SP-PLUS-STATE.md narrative + commit. CT105 resumes tonight on that file alone.
7. Tell Christopher plainly which ISO to burn and what is still unproven on it.

## 13. HONEST STATUS
Two ISOs exist that boot, log in and run Fin — but NEITHER has been seen to show the LUKS
prompt on a screen, and NO desktop has ever been driven. cycle24 carries every fix and has
never been installed. If cycle24 fails, the fallback Christopher can still demo is the
cycle20 ISO (0a125dee...), which is audited and works but shows a BLANK screen at the
passphrase prompt. Four builds tonight died on their own assertions, each within ~2 minutes.
