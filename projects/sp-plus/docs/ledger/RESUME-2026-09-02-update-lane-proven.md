# SP+ RESUME — update lane repaired end to end (2026-09-02)

## 1. WHAT WE ARE DOING

Christopher's non-negotiable: **system/app/Pi updates must be user-controlled and just work**,
Discover flawless, auto-rules kept. Root cause was found and fixed; the whole lane is now proven
on a real machine. What remains is shipping the last two fixes into an image.

Repo: `~/work/secureprospective-advisor-os/projects/sp-plus` on the **Beelink** (192.168.1.190).
Branch `session/sp-plus-plan`. `ssh -i /root/.ssh/beelink chris@192.168.1.190`.

## 2. AGENTS + HARNESSES

- **Bee**: `~/fleet/bin/run-bee.sh <fid>`; brief at `~/.pi/agent/bee-<fid>.md`, output
  `bee-<fid>.out`, sentinel `bee-<fid>.sentinel`. Ran `usbhelp`, EXIT=0 PROMOTED 2572 bytes.
  Output already saved into the repo (commit `e29177c`) — the run dir is no longer load-bearing.

## 3. GATES / STATUS

| Thing | State |
|---|---|
| `UPDATE_GUARD_GATE_OK` | PASS (8 checks + 4 new parser checks) |
| `UPDATE_LANE_GATE_OK` | PASS in image |
| `STORE_GATE_OK` | PASS after removing the contradictory rpm-ostree assertion |
| `WELCOME_UPDATE_WIRING_OK` | PASS |
| `USB_ENCRYPTION_GATE_OK` | PASS (test54, 169/169) |
| Signature ENFORCEMENT on machines | **NOT DONE** — we sign, nothing verifies at install |
| Help page wired into Help | **NOT DONE** — draft on disk only |

## 4. ARTIFACTS THAT EXIST AND WORK

- `ghcr.io/secureprospective/sp-plus-kde:latest` = **`sha256:ca2fad9e46420e4754a5fb00e895d5d6272526c69e2d2e0b83afbb5ec5ecf46b`**
  (test54, created 2026-09-02T01:37:19Z), also tagged `20260902b`, `testlane`. **Signed**, and
  the signature verifies offline against `~/.config/sp-plus-signing/cosign.pub`.
- Previous good image `sha256:89c2347a4a3d17df13d9e408f58eb6a8c2a248149b66edce2036ae86fe894e38`
  (test53, tag `20260902`) — the rollback target if `latest` ever needs reverting.
- Local: `localhost/sp-plus-kde:test53`, `:test54` on the Beelink (rootless store).
- Signing: `~/.config/sp-plus-signing/{cosign.key,cosign.pub,password,signing-config.json}`;
  cosign at `~/vendor/cosign/cosign`. `gh` at `~/vendor/gh/bin/gh` (NOT on PATH).
- Help draft: `projects/sp-plus/knowledge/advisor-help/encrypting-a-usb-stick.md` (2572 bytes).

## 5. THE CURRENT SITUATION (not a bug — a shipping gap)

**The published image `ca2fad9e` still contains BOTH bugs fixed after it was built:**
1. the cachedUpdate parser bug (`871b144`) — that image would say "up to date" forever;
2. the low-urgency notification (`8fcf7bb`) — popup vanishes before it can be clicked.

Tonight's end-to-end proof used the FIXED helper (`/tmp/uc`) and FIXED notifier
(`/tmp/notify-fixed`) copied onto the VM by hand. **The fixes are in git, not in any image.**
A rebuild + publish is required before this is done. That is NEXT ACTION 1.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- ❌ "`bootc upgrade --check` clears cachedUpdate." **FALSE** — it POPULATES it. This wrong
  belief was written in a code comment and hid the parser bug for hours. Comment now corrected.
- ❌ "SP+ notifications are broken / don't render." **FALSE** — Christopher SAW them. `virsh
  screenshot` cannot capture notification popups (overlay surfaces), though it captures windows
  and KRunner fine. **Never conclude anything about notifications from a virsh screenshot.**
- ❌ "`pgrep -c notify-send` tells you if a notification is waiting." **FALSE** — the process is
  named `timeout` (`timeout 3600 notify-send …`). Always `pgrep -f "notify-send --app-name"`.
  This produced a false "notification answered" report.
- ❌ "The publish needs Christopher's sudo." **FALSE** — build and publish run ROOTLESS. Log in
  with `~/vendor/gh/bin/gh auth token | podman login ghcr.io -u secureprospective --password-stdin`
  and pass `PODMAN_BIN=podman`.
- ❌ "cosign `--tlog-upload=false` disables the transparency log." **REFUSED** by this cosign;
  use an empty signing config (`cosign signing-config create --out …`), already saved.
- ❌ "The DNS build failure was transient." **FALSE** — rootful podman bridge DNS is broken on
  the Beelink, cause still unknown. `--network=host` is the working workaround; rootless is fine.
- ❌ "`bootc edit -f` can retarget the spec without staging." It **HUNG**; had to be pkill'd.
- ❌ `--download-only` is not a substitute: it stages LOCKED and needs `--from-downloaded`.

## 7. DECISIONS (do not relitigate)

- OS lane belongs to SP+; Discover keeps apps + firmware, rpm-ostree backend deleted.
- BlueBuild workflow disabled, repo kept. **Registry versions DELETED 2026-09-02** — 70 removed,
  6 kept. Christopher ran it (classifier blocked me from bulk registry deletes).
- USB encryption = **LUKS via GNOME Disks**, not a portable vault. Sticks are read back on SP+
  machines only. Cryptomator rejected: Flatpak can't see `/run/media` without an override and
  breaks repeatedly on FUSE. Revisit only if the cross-platform case becomes real.
- Notification urgency = `normal` + `--expire-time=0`. `critical` also works, rejected as
  too alarming for "your computer is ready to update".

## 8. LEDGER STATE — all committed, tree clean

```
e29177c Help: draft page for encrypting a USB stick (NOT yet wired into help-data)
8fcf7bb Notification: keep it on screen until the advisor answers it
871b144 Update guard: read cachedUpdate's real shape, or never offer an update again
ff08e01 publish: one signature check, not two, and the one that works
58a3625 Encrypted USB sticks: ship GNOME Disks; fix publishing's clock and signing
8d78ed3 Store gate: stop requiring the backend the update lane deletes
61dd7b9 spplus-update-control: add the simulate seam the guard gate depends on
23a9e53 containerignore: re-include the update-lane guard gate so its COPY resolves
```

## 9. NEXT ACTIONS, IN ORDER

1. **Rebuild** with the two fixes in it (Christopher approved starting this):
   `cd ~/work/secureprospective-advisor-os/projects/sp-plus && setsid nohup podman build
   --network=host --pull=missing -f images/kde/Containerfile --build-arg SPPLUS_RELEASE=1
   --build-arg SPPLUS_BUILD=20260902 -t localhost/sp-plus-kde:test55 . >
   ~/logs/sp-plus/build-test55.log 2>&1 < /dev/null &`
   Watch the REAL pid: `pgrep -f 'podman build --network=host' | head -1` (the launcher exits
   immediately and watching it reports a false completion).
2. **Verify in the log**: `USB_ENCRYPTION_GATE_OK`, `UPDATE_GUARD_GATE_OK` (12 checks now),
   `UPDATE_LANE_GATE_OK`, `STORE_GATE_OK`, `WELCOME_UPDATE_WIRING_OK`, 169/169.
3. **Publish**: `PODMAN_BIN=podman scripts/publish-image.sh localhost/sp-plus-kde:test55 20260902c`
4. **Re-prove on the VM with the SHIPPED image** (not /tmp copies): check → stage → notification
   → Restart now → digest changes. This is the only step that proves the fixes actually ship.
5. **Wire the help page** into `welcome/app/help-data.json` (id/category/title/source/markdown).
6. Deferred: signature ENFORCEMENT at install; the Dell rebuild; rootful podman DNS diagnosis.

## 10. RELAY / ENVIRONMENT NOTES

- **VM `fedora-test` on the Beelink** — hostname `sp-plus`, user `test`, password `password`.
  `ssh -p 2222 -i ~/.ssh/spvm test@127.0.0.1` from the Beelink (key I installed this session;
  `sudo -n` works via wheel NOPASSWD). **Port 2222 forward is LIVE-ONLY** and dies with the VM.
- If the key is ever lost: drive the console with `python3 /tmp/vmtype.py 'text'` (virsh
  send-key), `--keys KEY_LEFTCTRL KEY_LEFTALT KEY_F3` for a text login. Typing at a login prompt
  is the sanctioned path (OP-17). **Never pipe a password into sudo.**
- Mouse in the VM: `virsh qemu-monitor-command fedora-test --hmp "mouse_move X Y"` with absolute
  coords scaled to 32767, then `mouse_button 1` / `mouse_button 0`.
- **Nested ssh + quoting silently mangles commands** — hit ~5 times tonight. ALWAYS write a
  script file locally, `scp` it, run it. Never inline a heredoc through ssh.
- `sudo -n` on the Beelink does NOT work (timestamp expired); rootless avoids needing it.
- New dotfiles since baseline: `.npm`, `.sigstore` (from cosign). Benign; re-baseline when tidy.

## 11. HONEST STATUS

**Proven on real hardware tonight:** the poisoned tag is dead; `:latest` is real, signed SP+;
a machine took a genuine upgrade; the guard refuses older images; the notification's Restart
button really does reboot into the new version (VM came back on `ca2fad9e` with `gnome-disks`
present, 21:30:17).

**Genuinely unproven:** that the SHIPPED image does all of the above — because the two most
important fixes of the night are in git and not yet in any image. Until action 1–4 are done,
the fleet image would never offer an update at all. Do not describe this as finished.
