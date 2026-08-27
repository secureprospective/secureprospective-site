# SP+ RESUME — 2026-08-26 ~21:12 CDT (compact #2)

## 1. WHAT WE ARE DOING
Ship a demonstrable SP+ ISO (Fedora Kinoite 44, bootc image-mode, for financial advisors).
Christopher demos at **09:30 CST 2026-08-27**, installing live on a 12-year-old Dell
Inspiron 5737 with a spinning SATA drive, in front of an important audience.
Repo: `/home/chris/work/secureprospective-advisor-os` (worktree), branch
`session/sp-plus-plan`. Test lane: `~/sp-plus-bee/`. All work is on the Beelink.

## 2. IN-FLIGHT RIGHT NOW (most perishable)
- **`spb-cycle cycle18`**, driver pid **1743854**, started 20:59 CDT.
  - Log: `~/spb-cycle18.log`. Guest serial: `/home/chris/sp-plus-iso/cycle18/`.
  - **Build already SUCCEEDED**; it is in the install step (VM pid 1803648).
  - Alive check: `ps -o etime= -p 1743854`.
  - It runs install -> boot -> 3 live gates -> evidence unattended, then exits.
  - **What to do with the result:** read `FIRSTBOOT`/`LUKS_PROMPT` lines and the three
    `_PASS=`/`_FAIL=` count lines VERBATIM. The live gates now FAIL on silence (fixed
    tonight), so an empty result is a real failure, not a pass.
- Watcher task `bdsm9iwrm` was armed on that pid; if compaction drops it, re-arm with an
  `until ! kill -0 <pid>` loop. **Never** watch with `pgrep -f` (matches itself).

## 3. STATUS
| Item | State |
|---|---|
| Installs, boots, LUKS unlocks, reaches graphical desktop | PROVEN |
| Branding on console + login screen | PROVEN (Christopher saw it) |
| **Login on an installed system** | **NEVER SUCCEEDED — DN-16, the blocker** |
| Apps actually run | NEVER MEASURED |
| Fin runs on real hardware | NEVER MEASURED |
| Theme selectable in System Settings | NEVER MEASURED |
| DN-15 passphrase prompt visible on panel | ROOT CAUSE FOUND, fix committed, UNPROVEN |
| DN-17 first-boot password | RETIRED — the account it served is gone |

## 4. ARTIFACTS
- **Current ISO** (cycle18, has DN-16 fix + no-advisor + micro/flameshot/kitty + Fin-in-kitty;
  does NOT have the DN-15 plymouth fix or hostname):
  `projects/sp-plus/artifacts/spikeB-rootful/out/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso`
  **5,199,175,680 bytes, sha256 `4fca86222e0529b0f987bcd8a4311b6c68bb34815b6346a2dc7044ef912bbb6c`**
- **T-13 fallback, last known-good, KEEP:** `bootc-fedora-44-...iso`, sha256 starts
  `6a593d7082614e56`. Nearly swept as stale during hygiene. It is the demo fallback.
- Evidence kept (disks reaped, logs/screens kept): cycle13/14 `bserial*.log`,
  `screen-luks.png`, `screen-settled.png`.

## 5. THE CURRENT BUG — DN-16
Christopher installed from ISO `9bb54a76` on his own VM. He left the pre-created `advisor`
account alone, created **his own user with a password he knows**, and **could not log in**.
Two accounts created by two different mechanisms, both refused. That is a system-wide
authentication failure, not a bad credential.

**Leading hypothesis:** `/etc` is `unlabeled_t`, so PAM cannot read `/etc/passwd` /
`/etc/nsswitch.conf` and a CORRECT password is rejected under Enforcing.
**Fix committed (unproven):** `spplus-relabel.service` runs `setfiles` over `/etc` and
`/var/home` on the RUNNING system at first boot, before `systemd-user-sessions` and the
display manager. Scoped to `/etc` + `/var/home` deliberately: a full `/var` relabel on a
spinning disk can take minutes and a machine that looks hung is its own defect.
**CAVEAT — DO NOT RECORD AS FIXED:** no login has ever succeeded. The enforcing-vs-permissive
probe returned `NO-ANSWER` twice; that was MY instrument failing (fixed sleeps, plus CPU
contention from a second VM — the console never reached a login prompt), not a result.

## 6. REFUTED TONIGHT — DO NOT RETEST
- **"The firstboot unit is absent."** The enable symlink was there all along.
- **"`%post` cannot write `/usr` on bootc."** It CAN; files were on the deployment. The
  journal (`status=203/EXEC`, `Unable to locate executable`) is what actually explained it.
- **"Missing DRM drivers cause DN-15."** i915 AND plymouth are both already in the initramfs
  (123 plymouth entries, 122 drm). Shipping more KMS drivers changed nothing.
- **"No home directory causes the login failure."** `/home -> var/home` exists, homes exist.
- Everything in HEADBRAIN section 6 remains refuted (autorelabel, chcon, sddm, etc.).

## 7. DECISIONS (Christopher's, do not relitigate)
- **No pre-created human account.** `advisor` removed entirely; the user creates their own in
  the installer. Service identity is `spplus` (system account, uid<1000, /sbin/nologin).
  DN-13 is now absolute. The whole first-boot password prompt was deleted with it.
- **Plasma's own setup wizard is the post-install experience.** Do not spend time rebranding
  it now.
- **The assistant is named Fin**, ichthys icon, opens as a **TUI in kitty**.
- **Keep** plasma-workspace-wallpapers, java-25-openjdk-headless, ibus+cldr-emoji-annotation,
  python3-botocore. **Trim** (verified dependency-safe, ~790 MB, NOT yet applied): firefox,
  glibc-all-langpacks, google-noto CJK fonts, mariadb-server.
- **Working ISO first.** Feature polish only after frictionless install + login + apps open.
- **Never hand him a multi-step workaround.** Fix it, and ask questions rather than guess.

## 8. LEDGER
Branch `session/sp-plus-plan`, clean. Recent: `b1f80ba` DN-15 plymouth prompt ·
`4ffe59e` Fin in kitty · `b66a5c3` micro/flameshot/kitty + relabel scope ·
`3957c21` remove advisor · `92b851a` DN-16 relabel · `46bb805` state.
`~/SP-PLUS-STATE.md` narrative is current as of 46bb805 (one cycle behind).

## 9. NEXT ACTIONS, IN ORDER
1. **Read `~/spb-cycle18.log`** when the driver exits. Report `LUKS_PROMPT_ON_SERIAL=`, then
   the three `_PASS=`/`_FAIL=` count lines VERBATIM. Empty output is now a FAIL, not a pass.
2. **Answer Christopher's open question** (asked, unanswered): let cycle18 finish and fold
   DN-15 + hostname + trim + sshd into one later build, or kill it and roll DN-15 in now.
3. **Give him the ISO path + sha256** so he can test in a VM. He tests VM first, then Dell.
4. **Prove DN-16 with a REAL login** — not labels. There is no `advisor` account any more, so
   the lane must create a user: use `spb-boot "rd.break=pre-pivot"` (passwordless root shell,
   `/sysroot` mounted) and `useradd` inside the deployment, or automate Anaconda's user spoke.
5. **Then** audit the installed system for errors and bloat (he asked). ~790 MB trim list is
   ready; `sshd` is installed but DISABLED, so SSH into his VM needs a build first.
6. Update `~/SP-PLUS-STATE.md` narrative + commit after the cycle.

## 10. ENVIRONMENT
- `pkill -f` / `pgrep -f` match your own shell. Kill from pidfiles. `kill $!` after
  `nohup ... &` kills a WRAPPER, not the script — verify with `pgrep -af`.
- `sudo -n` works for podman only; `modprobe`/`qemu-nbd`/`rm` of root files need a password.
- `spb-boot` rotates boot logs now (it used to `rm` them and destroyed cycle10's).
- `spb-hygiene` reports a RUNNING cycle as `running=no`; do not trust it near a live VM.
- Port 8765 is already in use on the Beelink by something that is not ours. Left alone.
- Disk: 126 G free after reaping cycle13/14/15 disks (~33 GB).

## 11. HONEST STATUS
Demo is ~12 hours out. The install path works and looks like SP+. **Nobody has ever logged
into an installed SP+ system.** Everything below the login screen — apps, Fin, the theme,
printing — is asserted at image build and completely unverified, because the live gates were
passing on empty output all night until that was fixed. DN-16's fix is reasoned and committed
but unproven; DN-15's root cause was found late (our own plymouth theme had no
`SetDisplayPasswordFunction`) and its fix is committed but not in any built ISO yet.
