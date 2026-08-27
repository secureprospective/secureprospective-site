# SP+ RESUME — compaction #5, 2026-08-27 08:41 CDT

## 1. WHAT WE ARE DOING
Building **SP+ (Secure Prospective Advisor OS)**, a Fedora Kinoite 44 bootc/image-mode
distro for financial advisors. Christopher demos it at **09:30 CST 2026-08-27** to an
important person. Repo `/home/chris/work/secureprospective-advisor-os`, branch
`session/sp-plus-plan`, build context `projects/sp-plus`. Never work on main, never
`--no-verify`.

## 2. IN-FLIGHT RIGHT NOW (most perishable)
- **`fedora-test` libvirt VM = CHRISTOPHER'S LIVE DEMO MACHINE. NEVER kill, reboot or
  disturb it.** Check: `virsh list --all`. It runs cycle29, fully dressed for the demo.
- Nothing else of mine is running. cycle30's install VM was shut down during this reap.
  Port 2299 is free.

## 3. HOW TO REACH CHRISTOPHER'S VM (hard-won, do not rediscover)
SSH is impossible: libvirt **user/slirp** networking, so its `10.0.2.15` is private to the
VM and unroutable from the host. Three channels exist, in order of usefulness:
- `~/sp-plus-bee/spb-guest '<cmd>'` — QEMU guest agent, runs as root but **SELinux-confined
  to `virt_qemu_ga_t`**: it CAN read world-readable files and write `/tmp`, it CANNOT write
  `/etc`, read `/var/home/test`, or run `systemctl`/`getenforce`.
- `~/sp-plus-bee/spb-type '<text>' [--enter]` — types into the focused window via
  `virsh send-key`. **One key per invocation** (send-key sends a chord, not a sequence).
- `virsh screenshot fedora-test out.ppm` — sees the panel.
- Combined trick that works: guest agent writes a script to `/tmp`, then `spb-type` runs
  `sudo sh /tmp/x.sh`. Sudo password for user `test` is `play123` (disposable test VM).
- Getting a terminal: Konsole is hidden (`NoDisplay=true`) so **KRunner will not find it**.
  Use Alt+F2 then `/usr/bin/kitty`. KRunner often reopens a stale previous result — clear
  the field with backspaces first, and verify with a screenshot before typing anything.

## 4. GATES / STATUS
| Gate | State |
|---|---|
| spb-packages image | PACKAGES_PASS=47 FAIL=0 |
| spb-branding image | BRANDING_PASS=11 FAIL=0 |
| spb-apps image | APPS_PASS=50 FAIL=0 WARN=0 |
| spb-packages live (cycle27) | END PACKAGE GATE (exit 0) |
| spb-apps live (cycle27) | END APPLICATION GATE (exit 0) |
| spb-login live | LOGIN_RESULT=SUCCESS |
| **live `run` checks** | **NEVER FIRED — gated behind SPB_LIVE=1. "installed + links cleanly" only, NOT "starts". Exit 0 overstates it.** |

## 5. ARTIFACTS
- `/home/chris/Downloads/bootc-sp-plus-1.0-cycle29.iso` — 5130055680 bytes,
  sha256 `ddd59c05497648629943ee42c80feb75e1cd5e2d4c5d6e73edc2e314f8b1426e`. THE SHIPPED ISO.
- `/home/chris/Downloads/...cycle28.iso` — 5130051584 bytes, superseded (has the wizard hang).
- `/home/chris/sp-plus-iso/cycle28/` — KEEP, DN-23's open-defect evidence.
- `/home/chris/sp-plus-iso/cycle30/` — install of cycle29; **its boot was never verified**.
- Build log `/home/chris/sp-plus-build-20260827T074438.log`.

## 6. THE CURRENT BUG — DN-23, OPEN, NOT FIXED
Christopher's real install: the wizard's final **Complete** button does not advance; the
artwork vanishes and the machine sits there. **Cause unknown. Not reproduced.** cycle29
does not fix it — it pre-creates `/etc/plasma-setup-done` so the wizard never runs at all.
Deleting that one file re-enables the whole branded first-run.
Caveat on any future theory: the wizard IS launched as user `plasma-setup` (uid 968),
`Session=plasma`, under display-manager autologin — NOT as a child of `plasma-setup.service`.

## 7. HYPOTHESES ALREADY REFUTED — DO NOT RETEST
1. **SELinux denies the wizard.** All 10 AVCs on a real cycle28 boot are `permissive=1` and
   belong to `bootupctl`/`bootupd_t`. None touch plasma-setup or KAuth.
2. **spplus-relabel runs too late.** It is `Before=systemd-user-sessions.service`;
   plasma-setup is `After=` it. Ordering is correct. New `/etc` files inherit `etc_t` anyway.
3. **removeautologin aimed at SDDM while plasmalogin is the live DM.**
   `/usr/libexec/plasma-setup-bootutil --remove-autologin` run by hand returns **0** and
   writes cleanly.
4. **Missing polkit grant.** `/usr/share/polkit-1/rules.d/plasma-setup-polkit.rules` is
   present and grants all eight actions to user `plasma-setup`.
5. **ki18n skips en_US as its source language.** FALSE — `libKF6I18n` has no en_US special
   case; it builds its list from `LANGUAGE`. Cycle26 failed only because Kinoite ships **no
   `/etc/locale.conf` at all**, so the list was empty.
6. **A systemd `Environment=` drop-in on plasma-setup.service reaches the wizard.** It cannot
   (see §6).
7. **`plasma-apply-lookandfeel -a <pkg>` applies the layout/wallpaper.** It does not; it needs
   `--resetLayout`, and even that did not import our favourites.
8. **Kickoff favourites can be set via `favorites=` in plasma-org.kde.plasma.desktop-appletsrc.**
   Tried three ways including `favoritesPortedToKAstats=false`; Kickoff ignored all of them.
9. **`/usr` can be remounted rw on this bootc system.** It cannot — composefs. `mount --bind`
   over an individual file DOES work and survives until reboot.
10. **`mouse_move` via the QEMU monitor drives the guest.** It does not, even with a
    usb-tablet added and selected. Button events land at the cursor's existing position only.

## 8. DECISIONS (do not relitigate)
- D: Fix DN-23 and keep the wizard was chosen first; when it could not be reproduced,
  Christopher chose **disable the wizard** and ship.
- D: Deliver ISOs to `~/Downloads/` as soon as they build, with an honest note — do not
  withhold pending my own verification.
- D: "**everything doesnt mean, almost everything**" before calling an ISO good.
- D: Fin is named Fin, ichthys icon, TUI in kitty. Fin's banner is a shoal of 12 small fish
  plus 2 large, blue+grey, The Chosen's palette.
- D: SP+ ships **no** human account (DN-13). Anaconda's user spoke creates it.
- D: Test fixtures stay obviously test ("Advisor Test Printer").
- D: Delegate execution; GPT-Luna does vision QC.

## 9. LEDGER STATE
Committed on `session/sp-plus-plan`: `d964dee` (DN-17/20/21), `eae0596` (DN-22),
`6de9753` (DN-23 bypass), `8a26f7e` (Fin school), `5f17298` (fuller shoal). Tree clean.

## 10. NEXT ACTIONS, IN ORDER
1. **Ask Christopher how the demo went** before starting anything — it may change priorities.
2. **Fix DN-24: the look-and-feel is never applied on a fresh install.** The theme is named in
   `/etc/xdg/kdeglobals` but never applied, so a new install gets Fedora's wallpaper and stock
   favourites. Ship a first-login systemd **user** unit (`/usr/lib/systemd/user/`) that runs
   `plasma-apply-lookandfeel --resetLayout` + `plasma-apply-wallpaperimage` once, guarded by a
   stamp file. This is the single biggest gap between the shipped ISO and the machine he demoed.
3. **Make the live `run` checks actually fire** (`SPB_LIVE=1` in `spb-apps live`) and re-run,
   so app coverage means "starts", not "links".
4. **Boot-verify cycle30** — the shipped ISO's install has never been booted.
5. Only then reopen DN-23, with the wizard re-enabled in a throwaway cycle.

## 11. ENVIRONMENT NOTES
- `sudo -n` works for **podman only**.
- `/tmp` on Beelink is a 16 GB tmpfs — never copy a repo into it.
- **Never `pkill -f <pattern>`** — it matches the shell running it. I killed my own shell with
  `pkill -f "http.server 8099"` this session. Kill by PID from `ss -ltnp`, or match on `comm`.
- **Never pipe `spb-boot` into anything** — it leaves qemu/socat children holding the pipe open
  and the reader never sees EOF. Cost 7 minutes once.
- Check port **2299** is free before any boot phase; a stale VM there kills qemu outright.
- Vision QC: `~/sp-plus-bee/spb-qc <png>` uses `openai-codex/gpt-5.6-luna`. It needs **up to 7
  minutes per image** — two earlier "failures" were only my own timeouts. `opencode-go/*` is
  429 quota-blocked until ~2026-09-06.
- Braille art must never be retyped — it silently loses dot 8. Copy it programmatically.

## 12. HONEST STATUS
The demo machine looks genuinely good: Windows 11 Bloom dark wallpaper, Windows-style taskbar,
Fin pinned and opening with the fish shoal, RPC loopback-only, clean desktop. **But that
machine was dressed by hand.** The cycle29 ISO in Downloads does NOT reproduce it — a fresh
install still comes up with Fedora's wallpaper, stock favourites, and the old single-fish Fin.
DN-23 remains unexplained and is only bypassed. The live application gate has never proven that
a single app actually *starts*. The Windows 11 Bloom wallpaper is Microsoft's artwork and is
deliberately NOT in the image; shipping it would be redistribution.
