# SP+ Headbrain handoff — Tom (Beelink) → Claudebox (CT105), 2026-08-28

You are taking over **Headbrain** duties for **SP+ (Secure Prospective Advisor OS)**,
Christopher's Fedora Kinoite 44 bootc/image-mode Linux distribution for independent
financial advisors. The previous Headbrain session ran out of weekly tokens mid-cycle.

Read this whole file before touching anything. The single most valuable section is
**§7 REFUTED HYPOTHESES** — it is what stops you re-walking a day of dead ends.

---

## 1. IMMEDIATE STATE — do this first

**The cycle36 build FAILED and has been fixed but NOT re-run.** That is your first action.

- Build unit `spplus-build-cycle36.service` exited `rc=2` at **step 52 of 107**.
- Cause: a stale assertion `grep -q '^_launch=Print,none,' /etc/xdg/kglobalshortcutsrc`
  survived at the tail of that RUN. It asserted the OLD Flameshot Print Screen
  binding, which the DN-28/screenshot work replaced. My patch fixed the block it
  matched and left this trailing duplicate. **Entirely my error, and the lesson is:
  when you change a shipped config, grep the WHOLE Containerfile for every
  assertion about it, not just the one you edited.**
- Fixed and committed as `f4666e0`. Tree is CLEAN, `config-preflight` says
  **13 passed, 0 failed — "Safe to build."**

**Restart the build:**

```bash
cd /home/chris/work/secureprospective-advisor-os
LOG="/home/chris/sp-plus-build-cycle36-$(date +%Y%m%dT%H%M%S).log"
systemd-run --user --unit=spplus-build-cycle36 \
  --setenv=HOME=/home/chris \
  --working-directory=/home/chris/work/secureprospective-advisor-os \
  bash -c "~/sp-plus-gates/sp-plus-build-gated.sh > '$LOG' 2>&1"
```

Then arm a watcher on the log; **do not poll**. Watch for `_OK ` gate strings and for
`Error:|FAILED|Killed|OOM|No space`. A build is ~15 min for the container plus the
ISO. **Never edit the repo while a build runs** — `podman build` reads COPY sources
from the working tree as each step executes.

The gate strings already seen passing before the failure: `AUDIT_SSH_KEY_OK`,
`WSDD_OK`, `TRIM_OK usr_bytes=7881672828 packages=2006`, `GROUPS_OK count=84`,
`DN21_RPC_LOOPBACK_OK`, `FIN_SCHOOL_OK`, `NODE_INTL_OK`, `SENSORS_OK`,
`FIN_AGENT_OK pi 0.84.3`, `STARSHIP_OK starship 1.26.0`.

---

## 2. ENVIRONMENT

- **Repo (git worktree):** `/home/chris/work/secureprospective-advisor-os`
  Branch `session/sp-plus-plan`. HEAD `f4666e0`.
  **Run all commands from this directory. Do NOT cd to the main checkout.**
- **No work on main, ever. Never `git --no-verify`. Never bare `git stash`** (the
  stash stack is shared with other worktrees and other agent sessions).
- Beelink is **Debian** — there is no `dnf` here. Fedora work happens in a guest or
  on `bird`.
- `sudo -n` works for **podman only**. There is no password sudo.
- **`bird`** (`ssh bird`, 192.168.1.175, user `x`) is Christopher's own working
  Fedora 44 KDE machine. **When a desktop app misbehaves in SP+, diff against bird
  before theorising.** It disproved two of my hypotheses in minutes. Read its config
  freely; change nothing on it, and avoid anything that captures its screen.
- Build entry point: `~/sp-plus-gates/sp-plus-build-gated.sh` — the ONLY sanctioned
  path. It runs `preflight-gate.sh` (10 checks), then `~/sp-plus-iso-build.sh`.
- ISO output: `projects/sp-plus/artifacts/spikeB-rootful/out/`

---

## 3. THE TEST VM IS GONE — you need a new one

`fedora-test35` was destroyed and undefined at 2026-08-28T14:09:42Z and its disk
removed. **Christopher did this deliberately** ("I closed 35") — it is not a fault
and needs no investigation. The SSH forward on `127.0.0.1:2235` is dead with it.

Consequence: there is **no guest to install cycle36 into**. Ask Christopher how he
wants the new VM created before creating one. Note the previous forward was
hot-added via
`virsh qemu-monitor-command <dom> --hmp 'hostfwd_add hostnet0 tcp:127.0.0.1:2235-:22'`
and did not survive a restart.

**Never kill a VM named `chris`.** Treat every VM as his unless told otherwise.

---

## 4. WHAT IS IN CYCLE36 (all committed, none proven)

**DN-28 — the custom SP+ Calm global theme is WITHDRAWN.** SP+ now ships stock and
vendored themes. **The SP+ wallpapers are explicitly KEPT.**

Shipped set, in SP+ Welcome's order (default is Windows 11 Dark):

| # | Welcome order | look-and-feel id | Source |
|---|---|---|---|
| 1 | Windows Light | `org.secureprospective.spplus.windows11.light` | SP+ |
| 2 | Windows Dark (default) | `org.secureprospective.spplus.windows11.dark` | SP+ |
| 3 | Breeze Dark | `org.kde.breezedark.desktop` | stock |
| 4 | Nordic Dark | `Nordic` | vendored |
| 5 | Catppuccin Mocha | `Catppuccin-Mocha` | vendored |
| 6 | Breeze Light | `org.kde.breeze.desktop` | stock |
| 7 | Orchis Light | `com.github.vinceliuice.Orchis` | vendored |
| 8 | Catppuccin Latte | `Catppuccin-Latte` | vendored |

Vendored packages live in `projects/sp-plus/theme/vendor/` with a `PROVENANCE.md`
recording upstream, pinned tag, licence and exactly what we changed and why. **Every
upstream theme was published incomplete** — see §7.

Other cycle36 content:
- `config/spplus-apply-theme` — makes a theme switch change EVERY component.
- Welcome app: real theme bridge (`WelcomeBridge`, title channel) + 8-theme picker.
- Print Screen → `config/spplus-screenshot` (Spectacle region → clipboard AND file).
  Flameshot daemon autostart REMOVED; its absence is asserted in the build.
- New fastfetch logo, `branding/logo-sp-plus.txt`. Christopher approved it verbatim:
  "thats the new fastfetch for build 36". Do not restyle it.
- Carried from earlier: Node full ICU (`nodejs22-full-i18n`), wsdd hardening,
  screen-lock default, Welcome close/exit fix, lm_sensors, Discover backends.

---

## 5. GATES

| Gate | Command | Status |
|---|---|---|
| Config preflight | `bash projects/sp-plus/tests/config-preflight.sh` | 13/13 "Safe to build." |
| cycle36 source | `bash projects/sp-plus/tests/cycle36-source-gate.sh` | 9/9 PASS |
| Global themes | `python3 projects/sp-plus/theme/tools/validate-global-themes.py --root <image root>` | 8/8 errors=0 |
| Pre-build | `~/sp-plus-gates/preflight-gate.sh` | 10/10 |
| **Release gate** | `~/sp-plus-gates/release-gate.sh --ssh '<args>'` | **NOT RUN** |

**An ISO that has not passed the release gate MUST NOT ship.** It judges the
INSTALLED system, so it needs the ISO installed in a guest first.

The governing lesson about gates on this project: **cycle35 shipped a Node that
segfaulted on "hello", a theme that never applied, and a daemon with its hardening
stripped — because every gate asserted PRESENCE rather than BEHAVIOUR.** When you
add a check, make it execute the thing. Example just fixed: `field-inspect.sh`
grepped `^_launch=.*Print` file-wide, which Spectacle's own lines also match, so it
passed while Print Screen was broken. It now reads the binding from the correct
group AND takes a real capture, and both failure modes were negative-tested.

---

## 6. NEXT ACTIONS, IN ORDER

1. **Re-run the cycle36 build** (§1). Arm a watcher; do not poll.
2. When it lands, record the ISO's **exact byte size and sha256**, and report the
   payload gate strings verbatim.
3. **Ask Christopher** how he wants the new test VM created, then install cycle36.
4. Run the **release gate**. No ship without it.
5. Run `bash projects/sp-plus/tests/field-inspect.sh` on the installed system and
   diff against cycle35. New checks to watch: `printscreen_bound_spplus_wrapper`,
   `screenshot_capture_works`, `portal_responsive`.
6. **Resolve the Welcome collision.** Christopher has a SEPARATE project updating the
   Welcome app. My theme work modified all four files — `welcome.py` (+56 lines,
   `WelcomeBridge`), `app.js`, `index.html`, `app.css`. Offer to isolate the bridge
   into its own module so their rewrite can drop it in cleanly. **Raise this before
   either side does more Welcome work.**
7. Verify the whole 8-theme picker end to end on the installed system — the picker
   click path was proven in the old guest, which no longer exists.

---

## 7. REFUTED HYPOTHESES — DO NOT RETEST

### Theme switching ("selecting a theme only changes the colours")
- **"Our look-and-feel packages are malformed."** NO. Stock Breeze Dark, whose
  defaults file is complete and correct, produces the identical partial result.
- **"`plasma-apply-lookandfeel -a` applies everything."** NO. It applies the colour
  scheme and leaves icons, widget style, Plasma theme, decoration, cursor and fonts
  to the running session. That IS the defect.
- **"Write the keys, then call Plasma."** NO — `-a` RESETS user keys and silently
  discards writes made before it. **Plasma must run FIRST**, then write.
- **"A custom URL scheme can bridge the web view to the shell."** NO. QtWebEngine
  resolves the navigation itself and REPLACES the page. Use the window-title channel
  (`document.title = 'spplus:apply-theme?theme=...'`), which is what ships.
- The Welcome picker was never applying anything at all — `welcome.py` had no bridge
  of any kind; the cards only set CSS classes.
- Aurorae themes live in `~/.local/share/aurorae/themes/`, NOT `aurorae/`.
- The binary is `qdbus-qt6`, not `qdbus`.
- `plasma-apply-lookandfeel --list` core-dumps over SSH with no display. Display
  artifact, not a defect. I called this a "smoking gun" once and was wrong.

### Upstream themes were all shipped incomplete (measured, not assumed)
- All four named the **Plasma 5 decoration plugin** `org.kde.kwin.aurorae`; Plasma
  6.7 needs `.v2`. This is the same one-line defect that made SP+ Calm silently fail
  for a whole cycle. **Both SP+ Windows 11 packages had it too.**
- None declared fonts. Nordic shipped NO `metadata.json` (Plasma 5 `.desktop` only).
  Catppuccin's `Id` did not match its directory, so Plasma could not resolve it.
  Nordic and Orchis named icon themes and cursors they do not ship.

### Print Screen / Flameshot
- **"`App info not found for ''` is our packaging bug."** NO. Expected noise from ANY
  non-Flatpak host app touching a portal. I wrongly blamed a missing desktop file.
- **"The Flameshot daemon is the cause."** NO. Stopping it entirely still times out.
- **"A cached permission denial blocks it."** NO. The permission store was empty.
- **"The compositor/GPU cannot capture."** NO. `spectacle -b -n -f -o` produced a
  1.1 MB PNG instantly on the same session.
- **Actual cause:** a portal Screenshot request **permanently wedges
  `xdg-desktop-portal-kde`** — proven by restart bisection (wedged → restart →
  instant → one attempt → wedged again). It breaks ALL portal consumers: Flatpak file
  pickers, screen sharing, the settings portal. Spectacle uses a private KWin
  protocol and is structurally exempt.
- **CAVEAT, do not state as fact:** `bird` runs Flameshot 14.0.0 fine on real
  hardware with identical portal packages. The wedge coincided with an EGL failure
  from the guest's software-rendered virtio GPU, so it may be a VM artifact. **Not
  proven either way.** `field-inspect` now watches `portal_responsive` so it will
  show up on hardware if it is real.

### Other
- **"Okular has a password prompt."** NO. A test PDF opened clean. What Christopher
  saw was the screen lock, which he chose to keep as-is.
- **"fastfetch is broken in the VM."** NO. It works. He was seeing the OLD logo
  because the guest ran the cycle35 image and `/usr` is read-only on bootc — repo
  changes are simply not present until a rebuild. **Remember this whenever he says
  "I can't see your change": show him, don't argue.**

---

## 8. DECISIONS — do not relitigate

- **DN-28** — stock/vendored global themes; custom Calm withdrawn; **SP+ wallpapers kept**.
- **DN-27** — the global theme is ergonomic, NOT a brand surface. Do not repalette the
  desktop onto secureprospective.com. Brand lives on the website and in SP+ Welcome.
- **DN-13** — SP+ ships **no human account at all**; service identity `spplus`
  (`/sbin/nologin`) must never gain admin rights.
- **DN-25/26** — the assistant is **Fin** (Christian ichthys icon, a terminal program);
  Welcome owns the first screen.
- Print Screen = Spectacle region mode (he chose it over keeping Flameshot).
- Screen lock stays as-is.
- btop unusable at default Kitty size (71×20) is **WONTFIX** — his call.

---

## 9. HOW CHRISTOPHER WANTS YOU TO WORK

These are standing preferences he has stated, several more than once:

- **Drive, delegate execution.** His division of labour is that Headbrain decides,
  writes the brief, and judges evidence; subordinate fleet agents do the typing,
  builds and verification. He has had to say this more than once: *"you need to push
  Bee to do the work, i see you have been doing everything."* Dispatch detached under
  `systemd-run --user`, with a brief that ends in a sentinel (`REPORT-<job>.md` then
  `touch REPORT-<job>.DONE`) and a watcher that pings back. **Never poll delegated
  work.** (Note: his Bee session was closed on 2026-08-28 — *"its clearly lying to
  me"* — so execution came back to Headbrain for the last stretch.)
- **Verification must be watchable and unforgeable.** Testing must happen where he can
  see it, on his screen, and every claimed pass must be anchored to evidence the
  agent cannot fabricate — host-side `virsh screenshot` rather than an agent's word.
  *"gpt likes to lie and cut scorners."*
- **No workarounds. Fix it, or ask.** When he reports something does not work, the
  answer is "let me fix it", never a multi-step workaround for him to perform. Do not
  make him run diagnostics you can run yourself. And **do not guess at a fix** —
  *"dont guess on the fix, ask me more questions if you are unsure on the fix. Lets
  make each build count."* A build is ~15 minutes and a full cycle nearly an hour, so
  a guessed fix burns a cycle and teaches nothing. Asking is cheap and welcome.
- **Batch fixes.** The build is the bottleneck; accumulate several verified fixes
  before starting one.
- **Everything means everything.** Partial coverage is not completion.
- **Hand him artifacts as soon as they exist** so he can test them himself; do not
  withhold until you judge them finished.
- **Build for people who know nothing.** SP+ targets non-technical advisors.
- **Only well-maintained third-party dependencies ship.** Maintenance status is a
  selection criterion, not a footnote. This is precisely why the custom theme was
  dropped for upstream ones.
- **Test fixtures must read as tests.** *"If its test, keep it reading like test, we
  are not in production now, and we arent trying to fool anyone."*
- **Search for a known fix before engineering a custom one.**
- When he hands over work from another session, **build from it** rather than
  reviewing it and asking for another round.

## 10. HARD SECURITY CONSTRAINTS

- **Never send email without his explicit permission for that specific message.**
  Nonnegotiable, covers replying/forwarding/scheduling by any route, plus read
  receipts, calendar invites/RSVPs and list confirmations. Composing an unsent draft
  is the correct way to help. Permission is per-message and does not carry forward.
- **No secrets in the image, ever** — not in a layer, a Containerfile, a build arg, or
  git history. **The ISO must never contain the encryption secret.**
- `spplus-test` is a disposable test-only LUKS passphrase and must never appear in the
  ISO, the repo, or committed config.
- Never weaken SELinux or the firewall to make a test pass.
- Never guess passwords against a real account.
- `pkill -f <pattern>` and `ps | grep <pattern>` **match your own shell** — kill from a
  pidfile or match on `comm`. I produced garbage output this way once.
- `/tmp` on the Beelink is a **16 GB tmpfs**. Never copy a repo into it.
- Never delete a disk or log that an open defect's evidence was drawn from. Evidence
  currently kept: `/home/chris/sp-plus-bee/theme-evidence/` (23 PNGs, cited by ledger).
- `QEMU/`, `Downloads/`, `SP-PLUS-CHRIS-TEST.iso` are his — do not delete without asking.

## 11. A NOTE ON CT105 ITSELF

The Beelink's standing instructions treat **CT105 (Claudebox) as the head-brain** and
tell local agents not to interfere with it. **You are now that head-brain**, so that
guidance is about you, not for you. Two things still apply: record any file move,
rename or deletion on the Beelink as an explicit old→new entry (`~/MOVED.md`,
`~/archive/MANIFEST.md`, and your own `/root/.claude/backbone/context.md`), because
your context holds hardcoded absolute Beelink paths and cannot discover a relocation;
and prove a path is live from evidence (systemd units, `/proc/*/cwd`, `docker ps`,
`git worktree list`) before moving or deleting anything.

---

## 12. HONEST STATUS

**Nothing in cycle36 is proven.** No ISO exists. Nothing has been installed. The
release gate has not run. Every claim in §4 is source-level, verified in a guest that
no longer exists, or both.

What WAS genuinely verified in the old cycle35 guest, with host-side screenshots:
all 8 themes applying all 8 components through the real Welcome app; the Spectacle
capture producing a 1,162,491-byte PNG plus `image/png` on the clipboard; and all 7
Welcome screens fitting 1366×768. Those results are real but were obtained on the
cycle35 image with staged files, not on a cycle36 install.

Full detail, with the same refuted-hypotheses section, is committed at
`projects/sp-plus/docs/ledger/SESSION-RESUME-2026-08-28-compact12.md`
and the DN-28 and portal-wedge defect records are alongside it in `docs/ledger/`.
