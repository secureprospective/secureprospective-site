# SP+ RESUME — written 2026-08-27 ~00:00 CDT, mid-session, before a compaction
**The session CONTINUES. This is not a close.** Resume at NEXT ACTIONS item 1.

## 1. WHAT WE ARE DOING
Ship an SP+ ISO Christopher installs live on a 2014 Dell Inspiron 5737 (spinning SATA
disk) in front of an important audience at **09:30 CST on 2026-08-27**. After install the
machine must: boot, log the advisor in, run the full app suite, carry SP+ branding
throughout, offer the SP+ Windows 11 global theme in System Settings, and run the
guardrailed on-machine assistant.

Repo `~/work/secureprospective-advisor-os`, branch `session/sp-plus-plan`, **local only,
no remote**. Test lane `~/sp-plus-bee/`. Dell is `ssh -i ~/.ssh/laptop-sweep
trader@192.168.1.201`, free to wipe. Beelink is Christopher's daily driver.

## 2. AGENTS + HARNESSES
- I am Headbrain on the Beelink. CT105 resumes the role tomorrow night.
- "Bee (Pi)" is a research agent (`~/run-bee-spplus.sh`, `pi` CLI, briefs in
  `~/.pi/agent/`). It is RESEARCH ONLY. It cloned the theme upstream into `/tmp` on the
  Pi, which is tmpfs, which is why the assets never reached the repo. Its reports live at
  `~/briefs/` and `~/tmp/spplus-v2-kde-theme-research/REPORT.md`.
- **Christopher's standing rule: delegated work PINGS BACK when done or when it is the
  driver's turn. Never poll.** Every long step here is launched detached with a watcher
  armed on its **pid**. Recorded in `~/sp-plus-bee/RUNBOOK.md`.

## 3. IN FLIGHT RIGHT NOW — MOST PERISHABLE
**`spb-cycle cycle10`, pid `1275137`**, started 2026-08-26 23:32 CDT.
- Alive? `kill -0 1275137 && echo ALIVE`
- Log: `~/spb-cycle10.log`; ISO build log `~/sp-plus-build-cycle10.log`
- It runs, unattended: ISO build -> spb-sha -> install -> boot -> spb-packages live ->
  spb-branding live -> spb-apps live -> spb-evidence. ~30 min end to end.
- When it finishes: read `grep -E "SPB:|PACKAGES_|BRANDING_|APPS_|^FAIL" ~/spb-cycle10.log`.
  **The two lines that matter most are `FIRSTBOOT_PROMPT_ON_CONSOLE=` and
  `FIRSTBOOT_PASSWORD_SET=`** — they say whether the DN-17 fix works.
- If it is dead and the log is truncated, do NOT re-run blind; read the log tail first.

## 4. GATES / STATUS
| Gate | Mode | Result |
|---|---|---|
| spb-packages | image | **32/0 PASS** |
| spb-branding | image | **11/0 PASS** |
| spb-apps | image | **41/0 PASS** |
| spb-packages/branding/apps | live | **NEVER YET RUN SUCCESSFULLY** — blocked by DN-17 |
| Login on an installed system | — | **NEVER ACHIEVED** |
| release-gate.sh | — | not run |

## 5. ARTIFACTS
- ISO under test (cycle9's): sha256 `06d6d1ad060eb74f7352ab7b5f98f3cbd7e75fde57b8c6b806c74575be0321d8`,
  5,137,588,224 bytes, `projects/sp-plus/artifacts/spikeB-rootful/out/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/`.
  Earlier: `504fe550af3735ed…` (first ISO ever to contain the product). Superseded: t13
  `6a593d70…`, b04 `afc0f9c7…`.
- Payload image `localhost/sp-plus-kde:spike` (last id `cb1809572f65`, rebuilt since).
- Cycle evidence logs KEPT: `~/sp-plus-iso/cycle{6,7,8,9}/bserial.log`
  (150854 / 122974 / 78440 / 133215 bytes). **Their qcow2 disks were reaped; the logs are
  the evidence and they are intact.**
- Repo HEAD `8986245`. Everything below is COMMITTED.

## 6. THE CURRENT BUG — DN-17, the only thing standing between us and everything else
```
[FAILED] Failed to start spplus-firstboot-p… first-boot advisor password setup.
```
It is the ONLY failed unit. Consequence: no credential exists, so nothing can log in, so
**every live gate returns nothing** and DN-16 cannot be proven. cycle9's live gates simply
echoed the probe text at the login prompt.

Cause found: the unit ran `exec </dev/tty1 >/dev/tty1` with `TTYPath=/dev/tty1`.
Fix shipped (uncertain until cycle10 reports): it now runs on `/dev/console`, quits
plymouth first, `Conflicts=getty@tty1.service`, three attempts, and writes the reason to
`/var/lib/spplus/firstboot-error`. **Caveat: this is a hypothesis with a fix attached. It
has not yet been observed working.** I was already wrong once tonight predicting DN-17
would resolve when the advisor account appeared — it did not.

## 7. HYPOTHESES ALREADY REFUTED — DO NOT RETEST
Inherited (cost most of 2026-08-26):
1. "SELinux Enforcing deadlocks the boot" (DN-14). FALSE, timing artefact.
2. The first-boot password unit causes the boot hang. Masking it: byte-identical hang.
3. The system asks for the LUKS passphrase twice. It does not.
4. "`/etc` is fully labeled" from a `find`/`ls -Z` survey. The survey was WRONG.
   **The kernel AVC log is the authority, never a filesystem survey.**
5. Fedora 44 removed local graphical installs. FALSE.
6. A missing RPM caused the grey installer screen. FALSE — `TMPDIR=/mnt/sysimage/boot`.
7. `/.autorelabel`. No — ostree root is read-only (bootc #1087).
8. `chcon` in the Containerfile. OCI layers carry no `security.selinux` xattrs.
9. `spb-boot` v1/v2/v3 GRUB timing. v4 works.
Found tonight:
10. **Rebuilding the initramfs without `--add ostree`.** Baking in the plymouth splash with
    plain `dracut --force --no-hostonly` gave an initramfs with ZERO ostree content; LUKS
    unlocked then `[FAILED] initrd-switch-root.service` -> emergency mode. cycle8 proves
    it. Build now passes `--add ostree` and ASSERTS `lsinitrd | grep -q ostree`.
11. **`systemctl enable sddm.service` on Kinoite 44.** Fails: `display-manager.service`
    already symlinks to `plasmalogin.service` (`plasma-login-manager-6.7.4`). F44 KDE ships
    plasmalogin. We take the distro default.
12. **Brave's rpm on Kinoite.** `/opt` is a symlink to a nonexistent `var/opt`; unpack fails
    `cpio: mkdir failed`. `/opt` now points at `/usr/lib/opt` (bootc discussion #1038).
13. **"DN-17 will fix itself once the advisor account exists."** MINE, and WRONG. The
    account exists and the unit still failed.
Instrument bugs (my branding blinded my own harness):
14. `spb-env` hardcoded the ISO filename; branding renamed the output
    `bootc-fedora-44-…` -> `bootc-sp-plus-1.0-…`. Now takes the newest ISO.
15. `spb-boot` detected GRUB by grepping the literal `Fedora Linux` boot-entry title. Now
    matches `GRUB version`.
16. `spb-shell` logged in as `root`. SP+ ships no root password (DN-13), so it could never
    work. Now logs in as `advisor` and takes root via sudo.
17. A watcher written `while pgrep -f "sp-plus-iso-build.sh"` matches its OWN command line
    and loops forever. **Watch on the pid.**

## 8. DECISIONS — DO NOT RELITIGATE
- **DN-13: SP+ ships NO default password, ever.** advisor account ships LOCKED; the advisor
  sets their own at first boot. `POC_LOGIN_VALUE`/`chpasswd` deleted from the product.
- **D36:** partitioning is automatic and always LUKS2-encrypted. Passphrase is the only
  storage input.
- No secrets in the image/repo/git history. `spplus-test` is disposable, test-VM only.
- No work on main. Never `git --no-verify`.
- Display manager: Kinoite 44's plasmalogin, not sddm (see refuted #11).
- Theme: vendored audited subset of KDE-Windows-Modern (GPL-3.0, upstream Jeysef) as
  `org.secureprospective.spplus.windows11.{dark,light}`. **Excluded deliberately:** the C++
  System Tray and Icon Tasks applets, the patched login manager, the lock-screen shell
  overlay, all Microsoft artwork. Matches Bee's audit in
  `~/tmp/spplus-v2-kde-theme-research/REPORT.md`.
- Wallpaper: **variant B** (oversized SP+ watermark right, lockup lower left), Christopher's
  pick. Variants kept at `projects/sp-plus/branding/wallpaper-variants/`. **NOT in cycle10** —
  cycle10's payload was built before the swap.
- `spb-branding`'s Fedora-string scan excludes `ID_LIKE=` only. ID_LIKE=fedora stays;
  tooling depends on it. Every other check untouched.

## 9. LEDGER STATE
All committed on `session/sp-plus-plan`: `e67810e` (product into payload + STEP 0),
`ae31344` (state), `b87806e` (DN-17 console fix + theme), `8986245` (wallpaper B).
Nothing uncommitted. `~/SP-PLUS-STATE.md` narrative is current as of `ae31344` and is one
cycle behind — refresh it after cycle10.

## 10. NEXT ACTIONS, IN ORDER
1. **Read `~/spb-cycle10.log`.** Report `FIRSTBOOT_PROMPT_ON_CONSOLE=`,
   `FIRSTBOOT_PASSWORD_SET=`, then the three live count lines, verbatim.
2. **If FIRSTBOOT_PASSWORD_SET=yes:** run `~/sp-plus-bee/spb-shell 'semodule -DB; getenforce;
   ls -Zd /etc/passwd /etc/nsswitch.conf; systemctl --failed'` and state plainly **whether a
   login actually succeeded** — not whether labels looked right. That closes DN-16 and DN-17.
3. **If FIRSTBOOT_PASSWORD_SET=no:** the guest wrote the reason to
   `/var/lib/spplus/firstboot-error`. Do not guess; get that file.
4. Wire the assistant for out-of-the-box operation: `sp-plus.service` running as advisor,
   the PWA opening on first login, the printer-reconnect playbook demonstrable. Guardrails
   are the RPC's allowlist — `runtime/spplus_rpc.py` is deliberately not a shell bridge.
   **Christopher's words: guardrails to stop a user doing something destructive, but a
   capable tech buddy that can diagnose and fix.**
5. Verify the Windows 11 theme is selectable and functional in System Settings > Global
   Theme on the LIVE machine, not just present in the image.
6. Rebuild with wallpaper B, run one clean cycle, `release-gate.sh` exit 0.
7. Hand the ISO to Christopher. **He installs on the Dell himself** — that is the real
   acceptance test and his standing rule.

## 11. ENVIRONMENT
- Whole lane runs as `chris`, no host root. Root lives INSIDE the guest via `spb-shell`.
  Only `spb-build` uses rootful podman, wrapped once.
- `/tmp` is a 16 GB tmpfs. Never put a repo or a clone you care about there — that is
  exactly how the theme assets were lost the first time.
- A VM named `chris` is Christopher's. Never kill it. Stop VMs from their **pidfile**.
- Each cycle disk is ~11 GB, each running VM holds 6 GB RAM. Disk was at 77 G free before
  this reap, 104 G after.

## 12. HONEST STATUS
The installer, the product payload, the branding and the app suite are real and gate-green
**in the image**. The machine boots, reaches a login prompt, and unlocks LUKS on serial.
**Nobody has ever logged into an installed SP+ system.** Until FIRSTBOOT_PASSWORD_SET=yes
and a shell comes back, the live gates, DN-16, the assistant and the theme are all unproven
on real hardware. DN-15 (the LUKS prompt invisible on the local VGA screen) is untouched and
is the one that makes the laptop look bricked in front of an audience — the plymouth-quit
added for DN-17 may incidentally help, but that is a hope, not a finding.
Roughly 9.5 hours to the demo.
