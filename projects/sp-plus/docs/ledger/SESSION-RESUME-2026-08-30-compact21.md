# SP+ RESUME — 2026-08-30 (compact #21)

## 1. WHAT WE ARE DOING
Testing a freshly built SP+ image ON THE DELL via `bootc switch` from a LAN registry
instead of building an ISO. Christopher is AT THE DELL and said "take the wheel".
Deadline: ~6 weeks to Fedora 45 = public launch.

Repo: **BEELINK ONLY** `chris@192.168.1.190:~/work/secureprospective-advisor-os/projects/sp-plus`
Branch `session/sp-plus-plan`. NOT on CT105. Tree was clean at last commit.
SSH: Dell `ssh -i /root/.ssh/spplus-test test@192.168.1.124` (from CT105)
     Beelink `ssh -i /root/.ssh/beelink chris@192.168.1.190`
     Beelink->Dell uses `~/.ssh/id_ed25519`
Beelink has NO passwordless sudo. Dell HAS `sudo -n`.

## 2. IN FLIGHT RIGHT NOW  <-- MOST PERISHABLE
**`bootc switch` staging the new image on the Dell.** Started ~00:31Z.
- Check:  `ssh -i /root/.ssh/spplus-test test@192.168.1.124 'systemctl is-active spplus-switch'`
  "activating" = still working. Anything else = done; then check
  `systemctl show -p Result --value spplus-switch`
- Log:    `sudo -n journalctl -u spplus-switch --no-pager -n 20`
- It is a systemd transient unit (`systemd-run --unit=spplus-switch --collect`), so it
  SURVIVES ssh dropping and survives this compaction. Do not restart it.
- Only 1.5 GB needed (65 of 122 layers already on disk). Slow because 5400rpm HDD.
- Background watcher on CT105: task bs4j1hfn3, output
  /tmp/claude-0/-root/ebccaac9-d445-4b19-bfe8-eeea190f6dc6/tasks/bs4j1hfn3.output

**Beelink LAN registry `spplus-reg` on :5000 MUST STAY UP** (podman container).
The Dell pulls from it and the rollback test may need it.
Restart if gone: `podman run -d --name spplus-reg -p 5000:5000 docker.io/library/registry:2`

## 3. THE IMAGE
`localhost/sp-plus-kde:test44`  digest **9ea70bb1b9cb**  11.1 GB  BUILD_RC=0
Pushed to `192.168.1.190:5000/sp-plus-kde:test44` (HTTP 200 from the Dell).
bootc lint: 9 passed, 4 warnings (non-blocking: var-log, var-tmpfiles).
**VERIFIED INSIDE THE IMAGE** (not inferred from exit code):
gvfsd-smb + gvfs-smb-1.60.2 present; tuner at /usr/libexec/spplus-tune; button in
index.html; both new timers ENABLED; wifi.powersave=2 in /usr/lib; SPPLUS_CAPTURE_DIR
present; `_await_async` present.

## 4. NEXT ACTIONS, IN ORDER
1. Check the switch finished (§2). Confirm `Result=success`.
2. **CONFIRM TWO BOOT ENTRIES EXIST** before telling Christopher to reboot:
   `ls -1 /boot/loader/entries/ | wc -l` must be **2**. It was 1 before the switch.
   This is his safety net. Do NOT tell him to reboot without checking this.
3. Tell Christopher to reboot. He is at the machine. Shift at boot = menu.
4. After boot: `bootc status` shows the test44 image; `systemctl --failed`;
   `test -x /usr/libexec/gvfsd-smb`; both timers armed with a real NEXT.
5. Run the headless self-test (see §7 for the exact command).
6. Have Christopher CLICK "HAVE FIN CHECK MY COMPUTER" himself.
7. **Then prove `bootc rollback`** — never tested on this project, it is the safety
   net under auto-updates. Christopher must be present.

## 5. DECISIONS (do not relitigate)
- Distribution = ISO on Cloudflare, unlocked per-advisor by contract. NOT a registry.
  The registry is ONLY how installed machines stay updated. I conflated these twice.
- NVIDIA explicitly unsupported.
- Brave STAYS an RPM. Moving it to Flatpak was REJECTED — see §6.
- Button is named "Have Fin check my Computer" (v1 surveys, changes nothing).
- Never re-add npm. Never layer packages at RUNTIME on an installed machine.
- Suspend masking is DELL-ONLY, deliberately not in the image (advisors need suspend).

## 6. REFUTED — DO NOT RETEST
- "Layering might still allow bootc upgrade" — FALSE. Verbatim:
  "error: Upgrading: Deployment contains local rpm-ostree modifications; cannot upgrade via bootc."
- "The Dell never suspends" — FALSE, my error. It suspended at 18:58 and never resumed
  ("PM: suspend entry (deep)", journal ends there). I checked at 18:44, before it happened,
  and generalised a snapshot into a law. Cost an hour on WiFi.
- "WiFi powersave explains the disappearances" — FALSE. Powersave gives slow replies, not
  `No route to host`. Two separate problems.
- "Move Brave to Flatpak for updateability" — REJECTED. Flatpak Brave would drop the managed
  policy at /etc/brave/policies/managed/sp-plus.json (blocks all extensions, disables password
  manager/wallet/AI). Also breaks 6 MIME handler mappings + a build gate + 2 test manifests.
  And the premise was wrong: the blocker was never packaging, it was that NOTHING auto-updated.
- `systemctl reload NetworkManager` does NOT apply wifi.powersave. Nor does
  `nmcli device reconnect`. Only a full RESTART (or a boot). **`nmcli connection show`
  reported "0 (default)" in BOTH directions and is useless here — use `iw dev wlp2s0
  get power_save` for effective state.**
- Timer NEXT showing "-" right after enable is the transition instant, NOT the
  OnUnitActiveSec trap. After settling: NEXT +4h, Persistent=yes.

## 7. EXACT COMMANDS THAT WORK
Headless self-test (staged copy lives at /tmp/sptest on the Dell):
```
export XDG_RUNTIME_DIR=/run/user/1000 WAYLAND_DISPLAY=wayland-0
export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus QT_QPA_PLATFORM=wayland
export SPPLUS_SELFTEST_SHARE_UP=192.168.1.124 SPPLUS_SELFTEST_SHARE_DOWN=203.0.113.1
export SPPLUS_TUNE=/usr/libexec/spplus-tune
cd /tmp/sptest && python3 welcome.py --self-test
```
Screenshots (7 PNGs): `SPPLUS_CAPTURE_DIR=/tmp/spcaps python3 welcome.py --screenshots`
(do NOT add --self-test-close; it kills capture at 1s)

## 8. COMMITS THIS SESSION (branch session/sp-plus-plan)
851c670 DN-33 --system source gate | 0b1be8a DN-34 flatpak update timer
a28d6f4 DN-36 wifi powersave | de00200 DN-32 the Fin button
d43f03d DN-37 capture path | 0417edd DN-38 headless self-test
dc6807f DN-39 async share fix | 3730c1c DN-40 ship GVFS
26f2059 ISO-44 test plan ledger | 0488ecc hardware verification results
Preflight: **24 gates, 0 failed, "Safe to build."**

## 9. MACHINE-LOCAL DRIFT ON THE DELL (remove before treating it as representative)
- `/etc/containers/registries.conf.d/99-spplus-lan-test.conf` (insecure LAN registry) TEST ONLY
- `/etc/NetworkManager/conf.d/90-spplus-wifi-powersave.conf` — **/etc SHADOWS /usr/lib**, so
  delete this to test the SHIPPED copy or the post-install test is meaningless.
- Masked sleep targets + /etc/systemd/logind.conf.d/10-spplus-never-sleep.conf + ~/.config/powerdevilrc
- /tmp/sptest (staged welcome app copy)

## 10. HONEST STATUS
- `bootc rollback` NEVER tested. It is the safety net under everything in the update plan.
- The office share has NEVER been tested against a real server with real credentials.
- Human-only verbs untested: apply-theme, launch-fin, browse-store, connect-email, install.
- Bee's harness said ACCEPT four times today over reports containing zero verified tests.
  Byte count is not evidence. Do not quote ACCEPT as if it means something.
- I claimed a dispatch was "still running" three times after it had exited. CHECK, don't assert.
- Still blocked on Christopher: ghcr package must be PUBLIC (currently 401 anonymous),
  a `:stable` tag, one push token. Then bootc-fetch-apply-updates.timer + signing.
- Image bloat noticed, not addressed: firebird (a database) and blueman are in the image.
