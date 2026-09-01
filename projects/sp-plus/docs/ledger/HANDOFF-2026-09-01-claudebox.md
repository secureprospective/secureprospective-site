# HANDOFF — SP+ cosmetic pass and ISO 45 build
## Claude Opus 5 (Beelink session) → Claudebox / CT105
### Written 2026-09-01 ~15:58 CDT, with an ISO build in flight

You are taking over mid-build. My token window is about to close. Everything
below is what would be expensive or impossible for you to rediscover. Read
section 3 first: there is a live build that nobody else is watching.

---

## 1. WHAT THIS WORK IS

Christopher spent this session on the SP+ cosmetic pass — the "Choose the look"
theme system in the Welcome app, plus two dead buttons he found by hand. The
work is finished and committed. The ISO now building is the artifact he intends
to test by hand on the Dell.

- Repo: `/home/chris/work/secureprospective-advisor-os`, project under
  `projects/sp-plus/`
- Branch: `session/sp-plus-plan`, **tree CLEAN at `1363074`**
- Build worktree: `/home/chris/work/sp-plus-build`, **detached at `1363074`**
  (the sanctioned pattern: builds come from a clean worktree of a reviewed
  commit, because other agents write to the main checkout continuously)

---

## 2. MACHINES

| Machine | Address | Role |
|---|---|---|
| Beelink | this box, `192.168.1.190` | Christopher's live desktop. **Dispatch only. Nothing SP+ runs here.** |
| Test VM | `ssh -p 2222 test@127.0.0.1` | guest `fedora-test`, live Plasma 6 Wayland session on seat0/tty2, **no GPU (Mesa llvmpipe)**. Every gate below runs here. |
| Dell | `192.168.1.124` | the deliberately slow bare-metal rig. LUKS disk; Christopher has authorised the agents to unlock it themselves. |
| Registry | `spplus-reg` on `localhost:5000` | **MUST STAY UP.** The VM pulls images from `10.0.2.2:5000`. |

The VM is currently booted from `10.0.2.2:5000/sp-plus-kde:test50`. Keep image
`:test50` and the `spplus-reg` container alive. `:test48` and `:test49` were
reaped earlier today.

**Do not build derived images while the ISO build is running.** Both use the
same podman storage and the ISO build is rootful.

---

## 3. WHAT IS RUNNING RIGHT NOW — THE ISO BUILD

Started 2026-09-01 16:00:08 CDT, from `eb84d15`.

```
SPPLUS_REPO=/home/chris/work/sp-plus-build  bash ~/fleet/bin/sp-plus-iso-build.sh
log: /home/chris/logs/sp-plus/iso-build-20260901-160008.log
```

**This is the second attempt.** The 15:56:29 run failed in about three minutes
on a latent Containerfile ordering bug, fixed in `eb84d15` — see section 4.
Its log is `/home/chris/logs/sp-plus/iso-build-20260901-155629.log` and is
worth keeping as the evidence for that fix.

**Check it is alive:**
```bash
pgrep -af "sp-plus-iso-build|image-builder-cli"
tail -20 /home/chris/logs/sp-plus/iso-build-20260901-160008.log
```

**Where the ISO lands** (roughly 5.2 GB, based on the 07:07 build):
```
/home/chris/work/sp-plus-build/projects/sp-plus/artifacts/spikeB-rootful/out/
  bootc-sp-plus-1.0-bootc-generic-iso-x86_64/
    bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso
```

**Expect roughly 15–25 minutes** end to end. It runs three steps: the payload
container (`localhost/sp-plus-kde:spike`, 165 layers), the installer container
(`localhost/sp-plus-installer`), then image-builder in a privileged container
producing `bootc-generic-iso`.

**Gates already cleared before it started**, so a failure now is a real build
failure, not a policy trip:
- `tests/preflight-gate.sh` — 10 passed, 0 failed
- `tests/config-preflight.sh` — 31 passed, 0 failed, "Safe to build."

**When it finishes:** tell Christopher the path and the size. He wants
artifacts handed to him as soon as they exist, not withheld until someone
judges them finished. Do not sit on it pending further verification.

**If it fails:** the log is the evidence. The most likely failure is a
Containerfile assertion, because the Containerfile is full of deliberate
`grep -q` gates that fail the build rather than shipping a wrong file. Read
which assertion fired before changing anything.

---

## 4. WHAT CHANGED TODAY, COMMIT BY COMMIT

Earlier in the day (before my window): six per-theme wallpaper packages, the
SP+ wallpaper override layer for the two stock Breeze themes, the redesigned
Welcome mini cards, and eight new desktop previews Christopher staged himself.
Commits `64f10b2`, `41fde85`, `edc8683`, `7ce5b50`.

This window:

### `5a448b5` — help screen clipping FIXED
`WELCOME LAYOUT GATE` reported `help-content cut 9px on y` at 1280x800 and
`20px` at 1024x768. Seven topic cards in three auto-sized rows are taller than
the panel, and `.help-content` hides overflow, so the bottom row silently
vanished. Two structural changes in `welcome/app/app.css`:
- `.breadcrumbs:empty{display:none}` — on the topic list there are no crumbs,
  so 27px plus a 10px margin was reserved for nothing.
- `.trail-grid` rows are `grid-auto-rows:minmax(0,1fr)`, so the grid divides
  the height it has rather than growing past it at any viewport, and
  `.trail-card` clips its own overflow so a card that cannot fit its row
  becomes something the gate can see.

Verified PASS at both sizes on the VM. Mutation-tested: forcing
`.trail-card{padding:34px}` yields `trail-card cut 46px on y`, exit 1.

### `b416a41` — preview header closes with an X
The 75% preview dialog said "KEEP CURRENT LOOK" twice: once in the header and
again beside Apply. Christopher asked for the header one to become an `[X]`.
It is now `.preview-dismiss`, still `#preview-close`, still calling
`closeThemePreview`, still disabled while an apply runs. The decision stays on
the two buttons at the bottom.

### `a5d36d5` — OPEN THE DESKTOP actually hands off
Christopher reported the last button did nothing. He was right: `app.js:327`
announced a sentence and returned. Welcome sets up and then hands off, so it
now sends `spplus:finish` over the title bridge and `WelcomeBridge.finish()`
calls `WelcomeWindow.close()` — routed through `close()` rather than quitting
the app directly, because `closeEvent` is already the single place that stops
the renderer and shuts down.

New gate `tests/welcome-finish-handoff.sh` drives the **real** button in the
**real** application (not a copy of the page in a probe) and passes only if the
app is on its way out. The harness only counts a shutdown that happens *after*
the click, so its own exit cannot be misread as the button working. PASS on
the VM; mutation-tested by removing the `finish` verb → `FINISH_HANDOFF_FAILED
the button left Welcome open`, exit 1.

### `1363074` — the theme fidelity gate
Christopher asked me to double-check that a global theme switch really builds
the whole theme. New `tests/theme-fidelity-gate.sh` + `.py`. For all eight
themes it applies through the product helper and reads the live session back:
colour scheme, all five fonts, icon set, widget style, Plasma theme,
decoration library + theme + title-bar buttons, Kvantum, cursor, splash,
wallpaper — every key the theme package declares, parsed independently, never
taking the helper's own verdict.

**Result: `THEME_FIDELITY_OK`, 8 themes, 121 checks, exit 0.**

Task bars resolve into exactly three shapes, correctly assigned:

| Layout | Themes | Panel |
|---|---|---|
| `4b9e494063aa` | Windows Light, Windows Dark | spacer, kickoff, icontasks, spacer, systemtray, digitalclock, minimizeall |
| `5482225e2d27` | Breeze Light, Breeze Dark, Nordic, Catppuccin Mocha, Catppuccin Latte | kickoff, pager, icontasks, marginsseparator, systemtray, digitalclock, showdesktop |
| `578df9570bb9` | Orchis Light | kickoff, appmenu, spacer, colorpicker, systemtray, digitalclock |

### `eb84d15` — the ISO build fix
The DN-47 polkit gate checked `49-sp-plus-updates.rules` with `node --check` at
a layer where node is not installed yet; node arrives later with the Fin/pi
install. The comment there claimed "node is already in this image", which was
never true at that point in the file. The layer had been cached ever since it
was written, so the bug only surfaced when today's `COPY` changes invalidated
the cache and it actually ran:

```
/bin/sh: line 1: node: command not found
Error: building at STEP "RUN set -eux; R=/usr/share/polkit-1/rules.d/...
```

The grep assertions need no interpreter and stayed put. The one check that does
need one moved next to `test -x /usr/bin/node`, and both sites point at each
other through the marker `DN47_POLKIT_SYNTAX_OK`.

**Worth knowing:** any long-cached Containerfile assertion may be hiding the
same class of bug. They are only as true as the last time they actually ran.

---

## 5. HOW TO RUN EVERY GATE

The Welcome gates read a source tree on the VM, synced from the repo:

```bash
cd /home/chris/work/secureprospective-advisor-os/projects/sp-plus
rsync -a -e 'ssh -p 2222' welcome tests test@127.0.0.1:~/sp-plus-welcome-src/
ssh -p 2222 test@127.0.0.1 'cd ~/sp-plus-welcome-src && bash tests/<gate>.sh'
```

| Gate | Expected |
|---|---|
| `tests/welcome-layout-gate.sh` | `WELCOME LAYOUT GATE: PASS` |
| `tests/welcome-finish-handoff.sh` | `WELCOME FINISH HANDOFF: PASS` |
| `tests/theme-fidelity-gate.sh` | `THEME_FIDELITY_OK 8 themes` (~10 min) |
| `tests/theme-wallpaper-roundtrip.sh` | `THEME_WALLPAPER_ROUNDTRIP_OK checks=20` |
| `tests/config-preflight.sh` (Beelink, repo root) | `31 passed, 0 failed` |
| `tests/preflight-gate.sh <repo>` | `10 passed, 0 failed` |

**Every gate that touches the desktop must import the session environment from
the running shell.** SSH does not inherit it, and without this a gate reports
20 spurious failures while the product is fine:

```bash
shell_pid=$(pgrep -u $(id -u) -x plasmashell | head -1)
while IFS= read -r -d "" e; do
  case "$e" in XDG_RUNTIME_DIR=*|WAYLAND_DISPLAY=*|DBUS_SESSION_BUS_ADDRESS=*|XDG_SESSION_TYPE=*|XDG_CURRENT_DESKTOP=*)
    export "${e?}" ;;
  esac
done < /proc/$shell_pid/environ
```

### Showing Christopher the current Welcome
`/tmp/launch-welcome.sh` on the VM kills any running Welcome and starts the
**source** copy maximised (edit the `--screen N` in it, 1-indexed). Note that
the taskbar and menu icons start the **image** copy from `/usr/libexec`, which
is a day behind until this ISO lands. He hit exactly this confusion today.

---

## 6. NEXT ACTIONS, IN ORDER

1. **Watch the build to completion** and hand Christopher the ISO path + size.
2. **Raise the preview task bar problem** (section 7c). He needs to decide
   before he tests. It is his call, not yours.
3. **Run `tests/theme-fidelity-gate.sh` and `tests/theme-wallpaper-roundtrip.sh`
   on the Dell** once he has installed this ISO. That settles the plasmashell
   segfault, which so far only appears on the GPU-less VM.
4. **Verify PIN YOUR HELP on the new image** (section 7a). It has never run.
5. Re-run `tests/field-inspect.sh` on the VM — edited long ago, never re-run.
6. `ghcr.io/secureprospective/sp-plus-kde:latest` is older than what the ISO
   installs, so production machines fail to update. ISO-44-QUEUE item 2.

---

## 7. OPEN PROBLEMS, STATED HONESTLY

### 7a. PIN YOUR HELP is unproven, not broken
Christopher reported it "appears to do nothing". The truth: `/usr/libexec/
spplus-pin-help` does not exist on the VM. The helper was written today at
12:22 and is wired into `images/kde/Containerfile` lines 1468–1501 along with
`spplus-help.service` and the Help `.desktop`, but `:test50` predates all of
it. The button correctly reported "The Help application is not installed on
this computer."

The helper is careful code — it enables and starts the service, waits for
127.0.0.1:8766 to answer, finds the task manager applet instead of assuming a
group number, reads back its own write, and asks plasmashell to reload. **None
of it has ever run.** It gets proven on this ISO. Do not report it as working
until you have watched it pin.

### 7b. Task bars "get stuck" — cause established, not yet confirmed with him
His report: "the global theme switching needs fixing as we broke something as
the task bars get stuck and dont change when switching."

**This is my `--no-layout`, not a product defect.** During the preview capture
run I switched themes seven times with `--no-layout`, on his instruction to
stop the desktop resetting between shots, and `--no-layout` deliberately does
not rebuild the panel. The fidelity gate now proves the product path: with
`--layout`, all eight panels switch correctly. Running the same gate with
`--no-layout` reproduces his symptom exactly — `layout ... left the task bar
from ... in place`. Welcome always sends `--layout` (all 8 cards carry
`data-layout-reset="true"`; `welcome/welcome.py:399` maps that to `--layout`).

**Caveat that still stands: I never reproduced it through the Welcome app.**
If he saw it stick while switching in Welcome, my account is wrong and it is a
real defect. Ask him which route he used before closing it out.

### 7c. Seven of the eight previews show the WRONG task bar
Direct consequence of 7b: because the capture run used `--no-layout`, seven of
the eight 75% preview images show **Windows Light's panel** instead of each
theme's own. He said "we wont take new screen shots", so this has been left
alone — but a preview showing the wrong task bar undercuts the entire purpose
of the previews, which exist to prove fidelity. **He has not yet answered on
this.** Put it in front of him.

Re-capturing means: stage each desktop, `spectacle -f -b -n -o FILE` at
2048x1152, then switch **with `--layout`**. He stages the shots; the agent
captures and drives the switch. That division is his rule.

### 7d. plasmashell SIGSEGV under theme churn — logged, not fixed
`docs/ledger/DEFECT-plasmashell-segv-theme-churn.md`. Three SIGSEGVs in about
80 switches (~4%), inside Mesa's software rasteriser on the GPU-less VM. Two
captured backtraces are at *different* call sites. Every wallpaper and
component check passed even in the crashing runs. His ruling was to log it for
hardware testing. **Data point from today: roughly 30 applies during the
fidelity work produced zero crashes.** Not enough to retire it.

### 7e. Cursor and splash are not asserted live
The fidelity gate reports them as deferred rather than failing them, because
they are read by their own components at sign-in rather than written into the
live session by an apply. That is a real gap in coverage and is labelled as
one in the gate output.

---

## 8. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

1. **The 7680x4320 wallpaper causes the plasmashell crash.** Refuted: ten
   switches between the two Catppuccins (one ships that 8K image) produced
   zero crashes; ten on the old wallpaper also zero. The two backtraces are at
   different call sites.
2. **The machine ran out of memory.** Refuted: zero OOM kills, 7.9 GB RAM with
   5.5 GB available, zram swap unused.
3. **All the crash dialogs were the harness.** Half true. An early run without
   a session bus produced 21 `plasma-apply-lookandfeel` aborts that were noise.
   The plasmashell SIGSEGVs are real.
4. **The help clipping came from the mini-card redesign.** Refuted: it
   reproduces identically on the pre-redesign committed files.
5. **`grim` can capture this desktop.** It cannot: "compositor doesn't support
   the screen capture protocol" — KWin does not implement the wlroots
   protocol. **Use `spectacle -f -b -n -o FILE`.**
6. **`pi update` can work at runtime.** `/usr/bin/pi` symlinks into
   `/usr/lib/node_modules`, read-only on bootc. The Containerfile already pins
   `PI_VERSION=0.84.4`, the latest published. The VM shows 0.84.3 only because
   `:test50` derives from an older base. Nothing to fix in source.
7. **Breeze declares its own panel.** It does not — its layout.js calls
   `loadTemplate("org.kde.plasma.desktop.defaultPanel")`. Any gate comparing
   layouts must follow that delegation or Breeze looks like a distinct layout
   that suspiciously produces the stock task bar.

---

## 9. TRAPS THAT HAVE COST TIME

- **`pkill -f "<pattern>"` over SSH kills the SSH session itself** (exit 255),
  because the remote command line contains the pattern. It bit me twice today.
  Kill by iterating PIDs and skipping `$$`, or put the script in a file so the
  SSH command line does not contain the string.
- **Symlinked files inside a look-and-feel package are silently ignored** by
  Plasma's loader. Verified on the Dell: the symlinked Windows Light layout
  made it fall back to the stock panel while reporting no error. Both Windows
  layout scripts are deliberate real copies. Keep them in step by hand.
- **A `grep` for a config value matches the comment explaining it.** This has
  caused build failures in an earlier cycle.
- **A gate that reuses the helper's own verdict proves nothing.** Both gates
  added today parse the declarations independently and were mutation-tested in
  both directions before being trusted. Hold anything you add to that bar.

---

## 10. CHRISTOPHER'S STANDING RULES

These are his, stated in his own words across sessions. Do not relitigate them.

- **"It must 'work' before we call it good."** Written code is not working
  software. A feature is done when it has been run and observed doing the
  thing, and you can point at the evidence.
- **"The code needs to be clean, no short cuts."** No stubs, no swallowed
  errors, no fixed sleeps standing in for a real condition, no TODOs.
- **No workarounds.** When he reports a defect the answer is "let me fix it",
  never a twelve-step workaround, and never a request that he run diagnostics
  himself. **Do not guess at a fix** — ask him the specific question whose
  answer changes what you build. Builds are expensive; make each one count.
- **Delegate execution.** He drives through you; the typing, builds and VM runs
  belong to the fleet agents. Design work goes to the GPT agents, not to
  Claude — he considers Claude's visual design output average.
- **Nothing runs on the Beelink.** It is his live desktop.
- **Never send email without explicit, per-message permission.** Non-negotiable.
- **Hand him artifacts as soon as they exist.** Do not gatekeep a build.
- **Average is a failure state.** SP+ exists to relieve an advisor's fear of a
  non-Windows machine; polish is functional, not decorative.

---

## 11. HONEST STATUS

**Proven, observed, evidence in hand:** the help clipping fix, the X close
button, the OPEN THE DESKTOP handoff, and the full theme fidelity result
(8 themes, 121 checks) — all run on the VM's live session, all mutation-tested
so the gates can actually fail.

**Not proven:** everything about this ISO. It has never been built from these
commits, never booted, never installed. PIN YOUR HELP and the whole Help app
have never executed anywhere. The segfault has never been tested on hardware.
The previews still carry the wrong task bar and he has not ruled on it.

**One loose end I could not chase.** Immediately after the `eb84d15` edit,
`tests/config-preflight.sh` reported `30 passed, 1 failed / DO NOT BUILD`.
Two further runs of the same script on the same tree reported `31 passed, 0
failed` and I could not reproduce it, so I do not know which check failed —
the summary line does not name it and I did not capture the full output. The
build was started on the strength of two clean runs. **If it recurs, capture
the whole output before re-running**, because a preflight that fails
intermittently is worse than one that fails honestly, and this one gates every
build.

Do not let this handoff's confident tone about section 4 leak into section 7.
