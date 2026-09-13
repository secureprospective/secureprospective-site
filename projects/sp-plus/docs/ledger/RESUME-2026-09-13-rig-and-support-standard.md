# SP+ RESUME — 2026-09-13 (mid-session, compact-safe #2)

## 1. WHAT WE ARE DOING
First real simulation of distribution support for SP+ (image-mode Fedora for
insurance advisors). The v0.11.5 update goal is **MET**. Current work: get
`SP-Alpha-Rig` (the filming VM) onto the current version and tuned for 1080p
capture — Christopher films on it THIS WEEK.

- Repo: `~/work/secureprospective-advisor-os` on the **Beelink** (192.168.1.190),
  branch `session/sp-plus-defense-in-depth`. CT105 has NO copy of sp-plus.
- Beelink: `ssh -i /root/.ssh/beelink chris@192.168.1.190`
- Dell (SP+ test laptop, UPDATED + VERIFIED): `ssh dell@192.168.1.234` from the
  Beelink. User `dell`, password `password`, LUKS `password`.
- Target image: `ghcr.io/secureprospective/sp-plus-kde:latest` =
  `sha256:384e2c8afbf1fdd485ea9555f258c1999decdf8e7158382e59955c4d304c3d3d`
  (`SP+ 1`, BUILD_ID 20260913, built 2026-09-13T06:21:09Z)

## 2. IN-FLIGHT RIGHT NOW
**A. SSH waiter on SP-Alpha-Rig** — background id `bow9icqo4`, script
`/root/w3.sh`. Polls every 20s for 8 min for SSH on the rig after an unlock
attempt. Output: `/tmp/claude-0/-root/dcc958f4-.../tasks/bow9icqo4.output`.
Domain state at write time: **running**, unlock result UNCONFIRMED.
If dead, just re-run `/root/w3.sh`.

**B. Tom site+standard dispatch** — Christopher runs this in HIS OWN Tom session.
Brief: `~/fleet/briefs/tom-spplus-site-and-standard.md` (also `/root/tom-site.md`).
Not launched by me; do not double-launch.

Nothing else is running. Tom's p0/p1/p3/rig dispatches all COMPLETED.

## 3. STATUS
| Item | State |
|---|---|
| v0.11.5 built, signed, pushed | DONE — refused under a wrong key (mutation-tested) |
| ISO in R2 `sp-plus/sp-plus-0.11.iso` | DONE — content-verified by byte range |
| Dell updated as an advisor would | **DONE** — booted 384e2c8a, BUILD_ID 20260913 |
| Advisor notification on screen | **DONE** — screenshot captured |
| Advisor login after update | **DONE** — real greeter, real PAM auth |
| Ledger written | DONE — commits `d25326d`, `7575e6b` |
| SP-Alpha-Rig updated | **NOT STARTED** — cannot boot past LUKS yet |
| R2 token rotation | NOT DONE |

## 4. THE CURRENT BUG — SP-Alpha-Rig will not unlock
Domain `SP-Alpha-Rig` (`virsh -c qemu:///session`) sits at the Plymouth prompt
"Enter your passphrase to unlock this computer".

- Christopher says the passphrase is **`password`**. NOT yet proven.
- **Tom PROVED `spplustest` is WRONG** offline: FUSE read-only export of the
  qcow2, LUKS2 header extracted, `cryptsetup luksOpen --test-passphrase`.
  Control test the same minute: `spplustest` DOES unlock
  `spplus-v0.11.4.qcow2`. So the method is sound and the rig's passphrase
  genuinely differs. ~30 other candidates also rejected.
- Rig appears REBUILT 2026-09-11 (qcow2 mtime; domain now 12 vCPU/12 GiB while
  `RIG-PROFILE.md` still says 8 vCPU/8 GB/2048x1152 — **the profile is STALE**).
- Boot menu (seen from dracut emergency) reads `SP+ 1 (20260902)` — the rig is
  OLD, older than the Dell was. Inference from a boot label, not a booted digest.

**MY OWN ERROR, do not repeat:** I used `rig line "..."` to send the passphrase.
`rig line` writes to the SERIAL console; the SP+ LUKS prompt is drawn by
**Plymouth on the GRAPHICAL console**, so the keystrokes went nowhere and the VM
looked hung. The `rig` source says exactly this at the `unlock)` verb, line ~309.
**USE `RIG_DOM=SP-Alpha-Rig ~/fleet/bin/rig unlock "password"`.**

## 5. HYPOTHESES REFUTED — DO NOT RETEST
1. **"Memory exhaustion wedges the Dell during staging."** REFUTED with 167
   fork-canary samples: 167 OK / 0 FAIL, MemAvailable never below 5,261 MiB,
   swap never moved one page, memory PSI total never incremented, no OOM kill.
   **It is I/O saturation**: PSI io to 56 (`io full` tracking `io some`), load
   5.88 at CPU PSI 0.00, SSH RTT 0.45s -> 17.0s -> 0.59s tracking the curve.
2. **"A stale cache makes the old script install a build we never released."**
   WRONG, withdrawn. The old script's `stage)` delegates to `bootc upgrade`,
   which re-resolves the tag. Stale cache is the TRIGGER, never the PAYLOAD.
3. **"The lane is simply broken."** Too coarse. EMPTY cache -> reports "up to
   date" forever, never contacts the registry. POPULATED cache -> stages the
   correct current image. Every fresh install starts empty; nothing fills it.
4. **"The missing `/run/sp-plus/update-staged` marker is a hole."** No — `/run`
   is tmpfs; it was cleared by a reboot. The marker works.
5. **"The Dell's disk is dying."** No. Reallocated 0, pending 0, uncorrectable 0,
   no ATA resets. Worn (Load_Cycle_Count 1.6M, normalized 001) but healthy. The
   real fragility is **WiFi** (`iwlwifi missed beacons`), which matches the
   earlier staging failure on `dial tcp i/o timeout`.
6. **"`spplustest` unlocks SP-Alpha-Rig."** REFUTED offline (see §4).
7. **"The prompt disappearing means the passphrase was accepted."** NO. It
   disappeared twice while the passphrase had NOT been delivered at all.
   **Gate on SSH returning a hostname, never on the screen.**

## 6. THE HEADLINE FINDING (already in the ledger)
**Every SP+ machine in the field is stranded.** Shipped `spplus-update-control`
(9,868 B) reports "up to date" whenever its cache is empty — the state every
fresh install begins in — and never contacts the registry. The Dell's own journal
shows 4 consecutive false "up to date" runs while genuinely behind. **The fix
ships INSIDE the update, so a broken machine cannot receive its own repair.**
Remediation (proven, and reversed cleanly on the Dell):
1. fixed script (14,255 B) -> `/var/lib/sp-plus/spplus-update-control`, root:root, 755
2. drop-in `/etc/systemd/system/spplus-stage-update.service.d/10-fixed-update-control.conf`
   with `Environment=SPPLUS_UPDATE_CONTROL=/var/lib/sp-plus/spplus-update-control`
3. `systemctl daemon-reload`; stage via `systemctl start spplus-stage-update.service`
4. after it boots the new image, REMOVE the drop-in (fix now ships in /usr)

## 7. OTHER MEASURED FACTS WORTH KEEPING
- Staging 5.5 GB on the Dell's 5400rpm HDD: **11m44s**, 2.1 G cgroup peak, machine
  stayed responsive.
- **Apply-at-shutdown takes ~16 minutes** (VM measured 990s). An advisor shutting
  down "to apply it later" faces a very long shutdown. Holding the power button
  there is the one user-reachable risk in the whole pipeline. UNTESTED.
- **LUKS makes unattended reboot impossible on EVERY SP+ machine.** No agent can
  answer the prompt. Plan for a human at every cold boot.
- Two greeter defects (Dell/VM): the lock-screen curtain hides the password field
  until the first keystroke; **a wrong password gives no error and writes NO
  journal line at all** — so absent failure lines can never prove first-attempt
  success.
- Device-side trust is enforced: `/etc/containers/policy.json` default **reject**,
  sp-plus-kde requires sigstoreSigned against `/etc/pki/containers/sp-plus-cosign.pub`.

## 8. DECISIONS (Christopher)
- Drive **Tom** for the work; **Bee** for research; I direct, observe, and log.
- The Dell's dying HDD is acceptable collateral — "take the good with the bad".
- Next test machine: an old **HP laptop** with hard-to-install WiFi drivers.
- Rig is the filming machine for THIS WEEK.
- Dell `sshd` stays ON for now (alpha); "sshd off" is a release-build item.

## 9. LEDGER STATE
Committed on `session/sp-plus-defense-in-depth` (NOT main — main is the LIVE
website and deploys on push):
- `d25326d` — the real shape of a distribution update, measured
- `7575e6b` — greeter gate closed; two new greeter defects
File: `projects/sp-plus/docs/ledger/2026-09-13-real-shape-of-a-distribution-update.md`

## 10. NEXT ACTIONS, IN ORDER
1. **Check `/root/w3.sh` output** — did the rig answer SSH? If yes, the passphrase
   `password` is confirmed.
2. If NOT up: **verify the passphrase offline** the way Tom did — shut the domain
   off, FUSE-export the qcow2 READ-ONLY, `cryptsetup luksOpen --test-passphrase`,
   and run a control test against a known-good image before trusting a negative.
3. Once unlocked: re-dispatch the rig brief —
   `~/fleet/bin/tom-run.sh /home/chris/fleet/briefs/tom-rig-update-and-tune.md rig-update-tune "Read,Grep,Glob,Bash" 7200`
   **First correct the brief's passphrase line to `password`.**
   Note the rig will need a human/`rig unlock` after its reboot to apply.
4. **Resolution is the filming blocker**: captures are 1280x800, RIG-PROFILE says
   2048x1152, OBS expects 1920x1080. Three numbers, at most one right. Query the
   live guest; propose domain XML changes, do not apply them silently.
5. Mask `spplus-update-notify.timer` for filming; RECORD THE UNMASK COMMAND.
6. Correct `RIG-PROFILE.md` (vCPU, RAM, framebuffer, passphrase).
7. Rotate the R2 token (exposed in a `ps` listing).

## 11. HONEST STATUS
The v0.11.5 support goal is genuinely met and evidenced. The rig is **not started
at all** — it has never booted this session, so nothing about its version,
resolution, or notification behaviour is known. Everything in §10 items 3-6 is
unproven. Do not let the Dell's success read as the rig being ready to film.
