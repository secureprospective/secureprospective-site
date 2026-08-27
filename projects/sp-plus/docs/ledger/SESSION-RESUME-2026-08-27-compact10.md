# SP+ RESUME — compaction #10, 2026-08-27 ~18:40 CDT

## 1. WHAT WE ARE DOING

SP+ (Secure Prospective Advisor OS), a Fedora Kinoite 44 bootc/image-mode Linux distribution
for independent financial advisors. **cycle35 is BUILDING RIGHT NOW.** It is the first cycle
that ships the SP+ Calm graphite theme as the default look and the SP+ Welcome application as
the first screen. Christopher has seen neither on a real machine; that is the entire point of
this cycle.

- Repo: `/home/chris/work/secureprospective-advisor-os`
- Branch: `session/sp-plus-plan`. **Never work on main. Never `git --no-verify`.**
- Host: Beelink (`com`, 192.168.1.190). CT105 (192.168.1.105) is head-brain; observe, never intervene.
- Tree is CLEAN at `8247c4c`. Everything below is committed.

## 2. IN-FLIGHT RIGHT NOW — most perishable

### spplus-build-cycle35.service — THE BUILD (RUNNING)

- Started 18:30:38 CDT via `~/sp-plus-gates/sp-plus-build-gated.sh` (the only sanctioned path).
- **Alive check:** `systemctl --user is-active spplus-build-cycle35`
- **Log:** `/home/chris/sp-plus-build-cycle35-20260827T183038.log`
  (path also in `$SCRATCH/cycle35.logpath`)
- **ISO lands in:** `projects/sp-plus/artifacts/spikeB-rootful/out/`
- Pre-build gate passed 10/10 before it started. ~15 minutes total; expect completion ~18:46.
- A Monitor (task `b8eq7csqt`) watches for every gate string and for failure signatures, and
  reports whether an ISO actually appeared WITH ITS SIZE. **Monitors do not reliably survive
  compaction — if no notification arrives, check by hand.**
- **ALL PAYLOAD GATES PASSED.** Verbatim:
  - `AUDIT_SSH_KEY_OK test-cycle only, remove before any advisor image`
  - `WSDD_OK wsdd-0.8-6.fc44.noarch`
  - `TOOLS_OK btop , fastfetch, flameshot configured out of the box`
  - `DEBLOAT_OK enabled_units=78`  (was 77 on cycle34; +1 is wsdd)
  - `AUTOSTART_OK count=13`
  - `FLATHUB_OK vendor remote shipped in the image`
  - `CALM_DEPS_OK paper-icon-theme-1.5.0 jetbrains-mono-fonts-2.304`
  - `CALM_DEFAULT_OK themes=10`
  - `DN24_FIRST_LOGIN_OK look-and-feel is applied, not merely named`
  - `WELCOME_OK primal=ABSENT fallback=NotoSansCondensedBlack`
  - `MENU_OK visible_entries=29`  (was 28 on cycle34; +1 is SP+ Welcome)
- Reached step 89/98 of the payload container. **Remaining work is the installer container and
  the ISO assembly**, which is where the dracut lines below come from.
- **Observed and NOT yet judged:** `dracut-install: Failed to find module 'bochs_drm'` with
  companion `dracut[E]: FAILED` lines. Earlier cycles produced the same class of dracut noise
  and still produced a bootable ISO, so the leading reading is non-fatal. **That is a
  hypothesis, not a conclusion** — if the ISO is missing or will not boot, read this first.

### spplus-review-serve.service — KEEP RUNNING

`python3 -m http.server 8899 --directory /home/chris/sp-plus-bee/review-serve`, on
0.0.0.0:8899. It is how Christopher sees everything. Live pages:

- `http://192.168.1.190:8899/calm.html` — the graphite theme, glow evidence, contrast tables
- `http://192.168.1.190:8899/v5.html` — SP+ Welcome, all 9 views at 1366x768
- `http://192.168.1.190:8899/v4.html` — the superseded v4 screens, on the real VM

### Bee — IDLE. All jobs finished and landed.

Working dir `/home/chris/sp-plus-bee/`. Nothing running. Reports `REPORT-welcome-v4.md`,
`REPORT-welcome-v5.md`, `REPORT-calm-graphite.md`, `REPORT-calm-glow.md` are all complete and
their output is already committed into the repo. **Do not re-dispatch any of them.**

## 3. AGENTS + HARNESSES

**Bee** = the Pi agent on this machine. Briefs are `BRIEF-<job>.md`, runners `run-<job>.sh`,
dispatched detached with `systemd-run --user --unit=bee-<job>-$(date +%H%M%S)`. **Use a
timestamped unit name** — a fixed name collides with a `RemainAfterExit=yes` corpse.

- Engineering work: `--model openai-codex/gpt-5.6-luna --thinking high`
- Aesthetic work: `--model openai-codex/gpt-5.6-terra --thinking high`
- **The model flag is mandatory.** With no flag `pi` silently uses its own default.
- Bee returns **evidence, never a verdict**, and never edits the repo. Landing its output in
  the repo is Headbrain's job, and this session found real defects while doing that.

## 4. GATES / STATUS

| Gate | State |
|---|---|
| `tests/preflight-gate.sh` | 10/10 pass |
| `tests/config-preflight.sh` | 12/12 pass |
| `tests/pkg-preflight.sh` | pass, 58 packages resolve |
| `theme/tools/validate-spplus-calm.sh` | 13/13 pass |
| `tests/release-gate.sh` | **WILL FAIL BY DESIGN** while the audit SSH key is in the tree |
| cycle35 build | RUNNING |

## 5. WHAT CYCLE35 SHIPS THAT NOTHING BEFORE IT DID

1. **SP+ Calm Dark as the default look.** It had never been in ANY image: the Containerfile
   copied only the top-level `theme/` dirs, which hold the Windows 11 packages alone. This was
   an integration, not a default swap.
2. **`paper-icon-theme` + `jetbrains-mono-fonts` + `ibm-plex-sans-fonts`.** The first two were
   missing outright and the default theme would have half-applied without them.
3. **The graphite palette and the glow.** Accent off orange `#FF704C` onto `#76B4D4`; selection
   a tinted ground instead of a white-on-orange fill; a 3px graduated focus ramp in the frame
   padding; light mode on warm paper `#F2EEE5` with warm ink `#27231D`.
4. **Flathub as a shipped vendor remote** in `/usr/share/flatpak/remotes.d/`, not a runtime call.
5. **`wsdd`**, client-only, loopback, host mode off.
6. **SP+ Welcome packaged** — `/usr/bin/spplus-welcome`, desktop entry, `/etc/skel` autostart.
7. **Christopher's SSH key in `/etc/skel`** so the sweep can read the advisor's own config.
8. GNOME branches and every em dash removed from user-facing text.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **"The desktop theme should match secureprospective.com."** FALSE and explicitly corrected by
  Christopher. See DN-27. The global theme answers to eye comfort and state legibility. The
  brand governs the website and SP+ Welcome. Work had already started repalletting the desktop
  onto the site blue/gold when he stopped it.
- **"COSMIC's focus signal is a coloured bloom."** FALSE. Bee researched the source: COSMIC
  draws a **uniform 3px focused outline** and suppresses it entirely when inactive. Its corner
  is anti-aliased. Aurorae cannot blur or sample behind a window anyway, so a compositor-style
  bloom was never reachable and must not be attempted again.
- **"A colour scheme change repaints the window decoration."** FALSE. The Aurorae accent is
  hard-coded in 22 SVGs. Both mechanisms must be changed together, and only one of them is
  covered by the theme validator.
- **"`Impact` is a usable fallback for the Primal headlines."** FALSE. Impact is NOT in the
  image; every headline would have dropped silently to generic sans. The chain now falls back
  to `Noto Sans Condensed Black`, which IS present.
- **"The image ships no flatpak/Discover/PySide6."** FALSE, verified against
  `localhost/sp-plus-kde:spike`: flatpak 1.18.1, plasma-discover 6.7.4, PySide6 6.11.1 and
  qt6-qtwebengine are all present. Only the Flathub remote was missing.
- **"The QEMU guest agent can verify per-user config."** FALSE. It runs confined as
  `virt_qemu_ga_t` and SELinux denies it `user_home_t`. **Absence of a file through that channel
  is NOT evidence of absence.** This is exactly why the SSH key was added.
- **"`podman run` has DNS here."** It does NOT by default. Add `--network=host`.
- **"An empty `bee-*.log` means the agent died."** No. `pi -p` buffers output.
- **`plasma-setup` is load-bearing.** FALSE, and the Containerfile comment saying so is stale.
  DN-23 writes `/etc/plasma-setup-done` at build time so the wizard NEVER runs.

## 7. DECISIONS — Christopher's, do not relitigate

- **DN-27 (new, committed):** the global theme is the OS, not the brand. Graphite finish, calm
  dark, glow as a functional state signal. Light mode is warm paper, never white, and its glow
  needs MORE separation than dark because paper gives a faint treatment nothing to push against.
- **DN-26 extended:** every Welcome screen fits ONE VIEWPORT, no scrolling, proven by
  `scrollHeight` vs `clientHeight` at 1366x768. "Choose the look" centres on GLOBAL THEMES, with
  wallpaper and palette as subordinate tuning that resets when the theme changes.
- Tailscale is OUT of Welcome; Signal Desktop (`org.signal.Signal`) is in.
- Flathub open, chosen over a curated allowlist, tension recorded in DN-26.
- **"I drive and delegate; Bee executes."** Mechanical work goes out as a brief.

## 8. NEXT ACTIONS, IN ORDER

1. **Check the build finished.** `systemctl --user is-active spplus-build-cycle35`, then look
   for `BUILD COMPLETE` and an ISO in `projects/sp-plus/artifacts/spikeB-rootful/out/`. Every
   payload gate ALREADY PASSED (section 2); what remains is the installer container and ISO
   assembly. If it failed there, the payload image `localhost/sp-plus-kde:spike` in the ROOT
   store is still good and only the ISO steps need re-running.
2. **Hand Christopher the ISO the moment it exists** — copy to `~/Downloads/`, give path, byte
   size and sha256. Do not withhold it pending further checks.
3. **He installs it himself** and creates his account in Anaconda's user spoke (that is what
   makes `/etc/skel` land, including the SSH key).
4. **SSH in and run the full sweep**: `projects/sp-plus/tests/field-inspect.sh`. It now asserts
   the theme was APPLIED (reads the user's own `kdeglobals` and `appletsrc`), `wsdd` active with
   `--no-host` in the RUNNING process, no orange residue in the Aurorae SVGs, Flathub live,
   Welcome installed and autostarting, `fin` on PATH, Print Screen bound to Flameshot.
5. **Diff against cycle34** with `tests/field-diff.sh` so only real changes get read.
6. Take his aesthetic verdict on graphite, the glow, warm paper, and Welcome.

## 9. OPEN QUESTIONS FOR CHRISTOPHER — still unanswered

- **The Primal font licence.** It carries no embedded licence string and does NOT ship. The gate
  includes it only when `branding/brand/fonts/Primal.LICENSE` exists. See `welcome/PRIMAL-FONT.md`.
- **`qemu-guest-agent` is installed** and we never asked for it; it comes from the base. Bee used
  it to kill `kscreenlocker` and walk past the lock screen. On any SP+ machine running as a VM
  the hypervisor can drop the screen lock. Keep for the lane, or drop from production images?

## 10. RELAY / ENVIRONMENT NOTES

- **Never `pkill -f <pattern>` or `ps | grep <pattern>`** — they match your own shell. Kill from
  a pidfile or match on `comm`.
- `sudo -n` works for **podman only**.
- `/tmp` on this box is a 16 GB tmpfs. Never copy a repo into it.
- `spplus-test` is the disposable test LUKS/root passphrase. Never in the ISO, repo or committed
  config. **No secrets in the image, ever.**
- A VM named `chris`, `fedora-test` or `fedora-test34` is Christopher's. **Never kill one.**
  Note: no VM was registered under either libvirt URI at compaction time.
- `~/Downloads/SP-PLUS-cycle34.iso` and `QEMU/` are his. Do not delete without asking.
- **Never delete a disk or log an open defect's evidence came from.**
  `/home/chris/sp-plus-iso/cycle34/` (12G) is kept deliberately: the grey-screen install stall
  is still unexplained, and cycle34 is the diff baseline for this sweep.
- Reaped this compaction: one stale `sp-plus-cycle34-build-141814` unit corpse. Nothing else was
  touched, because the build is live and cycle34 is evidence. 107G free.

## 11. HONEST STATUS

**cycle35 has not finished building and must not be described as working.** Nothing in section 5
has been seen on a booted machine. The build gates prove files are installed and correctly
named; they cannot prove the theme is comfortable to look at or that Welcome appears on first
login, which are the two things this cycle exists to find out.

Specifically unproven: that `wsdd.service` reaches `active` on real hardware, that the Print
Screen fix works, that SP+ Welcome autostarts for an Anaconda-created account, that the
look-and-feel actually applies rather than merely being named, and that the graduated glow reads
as intended on a real panel rather than in a deterministic 1x render. The grey-screen install
stall from cycle34 was never reproduced and remains unexplained; it may recur.

The dracut `bochs_drm` messages in the build log are noise on the leading reading and have not
been properly investigated.
