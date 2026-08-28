# SP+ SESSION RESUME — compaction 12, 2026-08-28

## 1. WHAT WE ARE DOING

SP+ (Secure Prospective Advisor OS), a Fedora Kinoite 44 bootc/image-mode Linux
distro for independent financial advisors. **The cycle36 ISO build is RUNNING RIGHT
NOW.** Everything in it is committed and gated; nothing in it is proven, because
nothing has been installed yet.

- Repo (git worktree): `/home/chris/work/secureprospective-advisor-os`
- Branch `session/sp-plus-plan`, HEAD `ba6a311`, tree CLEAN
- **Never work on main. Never `git --no-verify`. Never bare `git stash`** (shared stack).
- Reference machine: **`bird`** (`ssh bird`, 192.168.1.175, user `x`) — Christopher's
  own working Fedora 44 KDE box. Diff against it instead of theorising.

## 2. IN-FLIGHT WORK (most perishable — read first)

### spplus-build-cycle36.service — THE BUILD
- Started **2026-08-28T14:08:30Z** via `~/sp-plus-gates/sp-plus-build-gated.sh`,
  the only sanctioned path. Pre-build gate passed **10/10** before it started.
- **Alive check:** `systemctl --user is-active spplus-build-cycle36`
- **Log:** `/home/chris/sp-plus-build-cycle36-20260828T090830.log`
  (path also in `$SCRATCH/cycle36.logpath`)
- **Result when done:** `systemctl --user show spplus-build-cycle36 -p Result --value`
- **ISO lands in:** `projects/sp-plus/artifacts/spikeB-rootful/out/`
- 107 build steps; container ~15 min, then the ISO. Payload gates seen passing so
  far: `AUDIT_SSH_KEY_OK`, `WSDD_OK`.
- Monitor task `bez40hyrt` watches gate strings, failure signatures and whether an
  ISO appeared WITH ITS SIZE. **Monitors do not reliably survive compaction — if no
  notification arrives, check the unit and log by hand.**
- **Do NOT edit the repo while it runs.** `podman build` reads COPY sources from the
  working tree as each step executes.

### fedora-test35 — GONE, and not by me
- Domain log: `qemu-system-x86_64: terminating on signal 15 from pid 2798758
  (/usr/sbin/libvirtd)`, then `shutting down, reason=destroyed`, at
  **2026-08-28T14:09:42Z** — 72 seconds after the build started.
- Domain XML undefined; no `*test35*` disk survives under `/home/chris` or
  `/var/lib/libvirt/images`. destroy + undefine + storage removal together is the
  signature of virt-manager "Delete, including storage".
- I issued no destroy/undefine/delete. Reported to Christopher, not concluded.
- Consequence: the SSH forward `127.0.0.1:2235` is dead, and there is **no guest to
  install cycle36 into** until one is created. Ask before creating one.

## 3. GATES / STATUS

| Gate | Result |
|---|---|
| `tests/config-preflight.sh` | **13 passed, 0 failed — "Safe to build."** |
| `tests/cycle36-source-gate.sh` | **9/9 PASS** |
| `theme/tools/validate-global-themes.py --root <staging>` | **themes=8/8 errors=0** |
| Welcome viewport, 7 screens @1366x768 | no overflow |
| Pre-build gate | **10/10** |
| Release gate | **NOT RUN.** Needs the ISO installed. An ISO that has not passed it MUST NOT ship. |

## 4. WHAT IS IN CYCLE36

- **DN-28 theme set.** Custom SP+ Calm global theme withdrawn; SP+ wallpapers KEPT.
  Ships Fedora/Breeze defaults plus Windows 11 Light/Dark (lead, default =
  `org.secureprospective.spplus.windows11.dark`), Nordic, Catppuccin Mocha, Breeze
  Light, Orchis, Catppuccin Latte. Vendored themes in `theme/vendor/` with
  `PROVENANCE.md`.
- **`config/spplus-apply-theme`** — makes a theme switch change EVERY component.
- **Welcome** — real theme bridge (`WelcomeBridge`, title channel), 8-theme picker.
- **Print Screen → `config/spplus-screenshot`** (Spectacle region, clipboard + file).
  Flameshot daemon autostart REMOVED; absence asserted in the build.
- New fastfetch logo (`branding/logo-sp-plus.txt`), same palette. Christopher
  approved it: "thats the new fastfetch for build 36".
- Carried from earlier: Node full ICU, wsdd hardening, screen-lock default, Welcome
  close fix, lm_sensors, Discover backends.

## 5. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

**Theme switching**
- "Our look-and-feel packages are malformed." NO. Stock Breeze Dark, whose defaults
  file is complete and correct, produces the identical partial result.
- "`plasma-apply-lookandfeel -a` applies everything." NO. It applies the colour
  scheme and leaves the rest to the session.
- "Write the keys then call Plasma." NO — `-a` RESETS user keys, discarding writes
  made before it. Plasma must run FIRST.
- "A custom URL scheme can bridge the web view to the shell." NO. QtWebEngine
  resolves the navigation itself and REPLACES the page. Use the title channel.
- Aurorae themes live in `~/.local/share/aurorae/themes/`, not `aurorae/`.
  The binary is `qdbus-qt6`, not `qdbus`.

**Print Screen**
- "`App info not found for ''` is our packaging bug." NO. Expected noise from any
  non-Flatpak host app touching a portal.
- "The Flameshot daemon is the cause." NO. Stopping it entirely still times out.
- "A cached permission denial blocks it." NO. The permission store was empty.
- "The compositor/GPU cannot capture." NO. `spectacle -b -n -f -o` produced a 1.1 MB
  PNG instantly on the same session.
- **Actual cause:** a portal Screenshot request permanently wedges
  `xdg-desktop-portal-kde` — proven by restart bisection. It breaks ALL portal
  consumers, not just Flameshot. Spectacle uses a private KWin path and is exempt.
  Caveat: `bird` runs Flameshot fine on real hardware, so the wedge may be a
  software-GPU artifact of the guest. NOT proven either way.

**Other**
- "Okular has a password prompt." NO. A test PDF opened clean; it was the screen
  lock, which Christopher chose to keep.
- "fastfetch is broken in the VM." NO. It works; the guest was running the cycle35
  image, so repo changes were simply not present in read-only `/usr`.
- `plasma-apply-lookandfeel --list` core-dumps over SSH with no display. Display
  artifact, not a defect.

## 6. DECISIONS

- **DN-28** — stock/vendored global themes, custom Calm withdrawn, SP+ wallpapers kept.
- Print Screen = Spectacle region mode (he chose it over keeping Flameshot).
- New fastfetch logo approved for build 36.
- Screen lock stays as-is.
- btop at default Kitty size is WONTFIX.

## 7. NEXT ACTIONS, IN ORDER

1. **Check the build.** `systemctl --user is-active spplus-build-cycle36`, then the
   log tail. Confirm an ISO exists in `artifacts/spikeB-rootful/out/` and record its
   **byte size and sha256**.
2. **Report the payload gate strings** actually seen in the log, verbatim.
3. **Ask Christopher** how to install cycle36 — `fedora-test35` and its disk are gone.
4. After install: run `~/sp-plus-gates/release-gate.sh --ssh '<args>'`. **No ship
   without it.**
5. Re-run `tests/field-inspect.sh` on the installed system and diff against cycle35.
   New checks to watch: `printscreen_bound_spplus_wrapper`,
   `screenshot_capture_works`, `portal_responsive`.
6. **Resolve the Welcome collision** — Christopher has a separate project updating
   the Welcome app. My theme work modified all four files
   (`welcome.py` +56 lines incl. `WelcomeBridge`, `app.js`, `index.html`, `app.css`).
   Offer to isolate the bridge into its own module so their rewrite can drop it in.

## 8. OPEN / UNPROVEN

- **Nothing in cycle36 is proven.** No ISO yet; no install; release gate not run.
- Whether the portal wedge occurs on real hardware. Unknown, and now harder to test
  since the guest is gone.
- UEFI + LUKS + TPM path still untested.
- Primal font licence — does not ship; gate wants `branding/brand/Primal.LICENSE`.
- `spplus` uid 958 vs ledger 960.
- cycle35 sweep reached only ~50% coverage; a pass 2 never ran.

## 9. ENVIRONMENT

- Build host is Debian (no dnf). Fedora work happens in a guest or on `bird`.
- `sudo -n` works for **podman only**; no password sudo.
- Evidence kept: `/home/chris/sp-plus-bee/theme-evidence/` (23 PNGs, cited by ledger).
- CT105 (192.168.1.105) is head-brain; observe and report, never correct it.
