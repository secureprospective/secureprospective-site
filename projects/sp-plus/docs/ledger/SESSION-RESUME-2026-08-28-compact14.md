# SP+ RESUME — compact-14, 2026-08-28

## 1. WHAT WE ARE DOING

Driving SP+ (Secure Prospective Advisor OS) toward Beta. This window installed
cycle36 on a UEFI guest, worked through every defect the install exposed, added
Zoom to the base application set, and left the tree green for the next build.

- Repo: `/home/chris/work/secureprospective-advisor-os` on the **Beelink**
- Branch: `session/sp-plus-plan` — **never work on main, never `git --no-verify`,
  never bare `git stash`, never cd to the main checkout**
- HEAD: `a9961c0`, working tree CLEAN
- Reach the Beelink: `ssh chris@192.168.1.190`

## 2. THE TEST GUEST — IT IS STILL RUNNING

`spplus-uefi` on `qemu:///session` on the Beelink. This is the machine every
finding below was proven on. It survives compaction; it is a VM, not a process
of mine.

- **UEFI with Secure Boot firmware** (`OVMF_CODE_4M.ms.fd`, `secure='yes'`).
  This was the last release-gate failure and it is now satisfied.
- Networking is **passt**, not slirp, with a port forward `127.0.0.1:2222 -> 22`.
  Plain `type='user'` will NOT accept `<portForward>`; it needs
  `<backend type='passt'/>`. That cost a cycle.
- From the Beelink: `ssh -p 2222 test@127.0.0.1`
- LUKS passphrase: `spplus-test`   Login: `test` / `password`
  (disposable, sanctioned for this throwaway guest only — must never reach the
  repo or the image)
- Drive the console with `virsh send-key spplus-uefi --codeset linux --holdtime 60 KEY_X`.
  **Use `--holdtime 60` and `sleep 0.5` between keys.** Without them keystrokes
  double up — 11 characters arrived as 16 and the passphrase was rejected.
  Screenshot with `virsh screenshot`; the output is already PNG despite the
  `.ppm` name, so `convert` it, do not reach for ffmpeg (not installed).

Christopher watches the console and will say "you're at the passphrase" or
"you're at the login". Take him at his word rather than sleeping blind.

## 3. WHAT SHIPPED THIS WINDOW — 7 COMMITS

| Commit | What |
|---|---|
| `5342130` | Screenshot portal permission granted per app id (mislabelled DN-25, is DN-30) |
| `4a1045e` | field-inspect stops calling LUKS absent when merely not root |
| `6707105` | Cursor ships as `/etc/xdg/kcminputrc`, not a first-login write |
| `d486e86` | Welcome close gate, wsdd root guard, curated launcher favourites |
| `679337c` | Zoom as a declared Flatpak (DN-26) |
| `2b3b037` | config-preflight resolves visudo instead of assuming PATH |
| `a9961c0` | DN-30 ledger record; portal wedge marked REFUTED |

## 4. GATES

| Gate | Result |
|---|---|
| Pre-build gate | 10 passed, 0 failed — "Gate clear" |
| Config preflight | 13 passed, 0 failed — "Safe to build" |
| Package preflight | 62 packages resolve — "Safe to build" |
| field-inspect on the guest | only remaining PROBLEMs are the two SELinux lines, which are install-method artifacts |
| Release gate | **has still never returned PASS. Never run end to end.** |

Run them from the repo root:
`bash projects/sp-plus/tests/preflight-gate.sh`,
`config-preflight.sh`, `pkg-preflight.sh`.

## 5. ARTIFACTS

- ISO: `/home/chris/Downloads/SP-PLUS-cycle36.iso`
  5451173888 bytes, sha256 `cc3555e6e4b7e075bdc658c84cd44e12e2fb6a1c7b51ac6af829365a61db57ce`
- Installer branding evidence:
  `~/sp-plus-bee/theme-evidence/installer-branding-uefi-cycle36.png` and
  `installer-grub-uefi-cycle36.png` — these prove the branding landed, keep them.
- 41 investigation PNGs in `~/sp-plus-shots/`.
- Christopher's: `Downloads/`, `QEMU/`, `SP-PLUS-CHRIS-TEST.iso`, and every VM.
  **Never kill a VM named `chris`. Treat every VM as his unless told otherwise.**

## 6. HYPOTHESES REFUTED THIS WINDOW — DO NOT RETEST

- **"The portal wedges on a screenshot request."** REFUTED, and the defect file
  now carries that header. The portal was answering correctly and denying a
  request recorded as denied. The `libEGL ... dri2` line is noise present on
  every Qt and Flatpak launch in this guest, including ones that work.
- **"Print Screen is not bound / not firing."** It fires. kglobalaccel holds
  key `16777225` on `flameshot-capture.desktop` and starts
  `app-flameshot-capture@.service`. Verified by raw `/dev/input` read: keycode
  99 arrives, press and release.
- **"Spectacle is stealing Print."** No. Its `allShortcutInfos` shows `16777225`
  only in the DEFAULTS column; its active shortcut is `33554431`, Qt's
  no-shortcut sentinel. Read both arrays before concluding.
- **"`NoDisplay=true` on flameshot-capture.desktop blocks the launch."** No.
  Overriding it in `~/.local/share/applications` changed nothing.
- **"plasma-apply-lookandfeel ordering wipes the cursor."** In first-login's
  exact order the cursor SURVIVED 40 s in a settled session. The wipe happens
  during early session startup, after the unit exits — first-login now reports
  "cursor verified on attempt 1" and the file is gone moments later. That is why
  the fix is a system default, not a retry.
- **"plasma-apply-lookandfeel core-dumping means it failed."** It core dumps
  over a bare SSH pipe. That run did nothing at all, so any conclusion drawn
  from it is void. Launch it with `systemd-run --user` to test it for real.
- **"field-inspect's `welcome_close_gate` failure is a product defect."** No.
  The gate captured the pre-existing pid list and ignored it, so it failed
  against the Welcome window the advisor is autostarted into.
- **"`sudoers-sp-plus is invalid`."** No. `visudo` is in `/usr/sbin`, off a
  non-root PATH. `/usr/sbin/visudo -cf` returns "parsed OK".
- **"SELinux disabled and multi-user.target are product defects."** They are
  artifacts of installing with MY kickstart, which bypasses the shipped
  `/usr/share/anaconda/interactive-defaults.ks`. That file DOES ship (it is in
  the squashfs) and its awk strips `selinux=0`, `console=ttyS0,115200` and
  `console=tty0` cleanly from this machine's real BLS entry — dry-run verified.
  **Still unproven end to end.**

## 7. TRAPS WORTH KEEPING

- `pgrep -f <pattern>` matches your own shell. Judge on `bwrap`/`comm`, not the
  grep line. Bit me again on the Zoom launch check.
- Flatpak `Branch=` is not optional in a `.preinstall` file. Omit it and flatpak
  defaults to a `master` branch that does not exist, then reports "Nothing to do"
  and exits 0 — a silent no-op.
- systemd `Persistent=` applies ONLY to calendar timers. Paired with
  `OnUnitActiveSec` it showed an empty `NEXT` and would never have re-fired.
- `/usr` is read-only on the guest. Test image changes via `/etc`, a user-level
  systemd drop-in, or `~/.local/share`, and remember the gate may then correctly
  report the image does not ship the file.
- Nested heredocs through ssh mangle content. Write the file locally, `scp` it.

## 8. DECISIONS

- **Zoom ships as a Flatpak, not a layered RPM** — Christopher's call,
  2026-08-28. Reason: Zoom enforces a minimum client version, `/usr` is
  read-only, so a layered RPM could never update and would eventually stop
  connecting. Zoom publishes no yum repo, so the Brave pattern does not transfer.
- **Zoom "just sits in the menu"** — no work needed to hide it. Settled.
- Test VM credentials are disposable and sanctioned for this guest only.

## 9. NEXT ACTIONS, IN ORDER

1. **Build cycle37.** All three preflights are green and the tree is clean.
   Use the exact gated build command in `~/sp-plus-gates/sp-plus-build-gated.sh`.
   Do not edit the repo while it runs.
2. **Deliver the ISO to `/home/chris/Downloads/`** — standing instruction. Plain
   `cp`; `sudo -n` on the Beelink is podman-only.
3. **Install it through the GRAPHICAL installer, not a kickstart.** This is the
   only way to close the SELinux and boot-target questions. Capture the installer
   screen host-side.
4. **Verify the favourites change** — the one item with no build assertion. Log
   in fresh and confirm Konsole is ABSENT from Favorites.
5. **Confirm Zoom converges.** The timer fires 90 s after boot then pulls ~1 GB.
   `flatpak list --system` should show `us.zoom.Zoom/x86_64/stable`.
6. **Run the release gate end to end** and get its first ever PASS.
7. Ask Christopher the **Anaconda profile** question — SP+ matches no profile,
   and adopting one changes partitioning and bootloader defaults.
8. Isolate the **Welcome theme bridge** using Bee's plan at
   `/root/bee-runs/20260828T142055Z_welcome-bridge-isolation/out`. Untouched.
9. Move `release-gate.sh` into the repo — it lives only on the Beelink.
10. Offer the **podman prune** again (27.8 GB reclaimable). **Do not prune
    unilaterally.** He has not answered three times now.

## 10. HONEST STATUS

The tree is green and the fixes are real, but **no build has run since any of
them.** Every Containerfile assertion I added this window is unexercised, and a
typo in my own build lines is exactly what cycle37 would catch first.

The favourites change is the one that could come out of a clean build unchanged
and still look fine, because favourites live in the kactivitymanagerd database
and the config key is only a one-time migration seed.

Unchased and not failing anything: `wsdd_listener` reports 0 while wsdd is
listening on 5357, and `bootc_booted_image` is UNKNOWN.

Open question for Christopher, raised and not yet answered: Zoom is the first
preinstalled app that phones home by design, and the Welcome app tells advisors
"NO DATA SENT". Worth deciding whether that wording needs qualifying before Beta.
