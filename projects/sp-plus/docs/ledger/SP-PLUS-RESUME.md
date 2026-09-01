# SP+ RESUME — 2026-09-01, cosmetic pass, second compaction

## 1. WHAT WE ARE DOING

Finishing Christopher's cosmetic list so the next ISO can be built. This
window delivered per-theme wallpapers, the SP+ wallpaper override layer for
stock themes, redesigned Welcome mini cards, and eight new desktop previews
that Christopher staged himself.

- Repo: `/home/chris/work/secureprospective-advisor-os`, project under
  `projects/sp-plus/`
- Branch: `session/sp-plus-plan`, tree CLEAN at `7ce5b50`
- Test VM: `ssh -p 2222 test@127.0.0.1`, guest `fedora-test`, live Plasma
  session on seat0/tty2, Wayland, **no GPU (llvmpipe)**
- Registry `spplus-reg` on `localhost:5000` — MUST STAY UP, the VM pulls from it
- VM is booted from `10.0.2.2:5000/sp-plus-kde:test50`, which contains all of
  today's theme work
- **Nothing runs on the Beelink.** Standing and non-negotiable.

## 2. AGENTS + HARNESSES

- Bee (`pi`, gpt-5.6-luna, thinking max) did the mini-card design in two
  rounds. **Both are FINISHED**, units reset, nothing in flight.
- Briefs: `~/.pi/agent/spplus-brief-theme-cards.md` and
  `spplus-brief-theme-cards2.md`. Runner:
  `~/fleet/bin/run-bee-spplus-impl.sh`.
- Bee's own reports were read, acted on, and then DELETED from the repo root
  so preflight's dirty-tree check passes. Their content is summarised here.
- Design work goes to Bee, not to me. Christopher's standing instruction.

## 3. IN-FLIGHT WORK

**NOTHING IS RUNNING.** No dispatches, no builds, no background jobs.

| Thing | How to check | Why it matters |
|---|---|---|
| `fedora-test` VM | `ssh -p 2222 test@127.0.0.1 'echo ok'` | every gate runs here |
| `spplus-reg` | `podman ps \| grep spplus-reg` | the VM pulls images from it |
| image `:test50` | `podman images \| grep test50` | what the VM booted; base for derived builds |

`:test49` and `:test48` were reaped this window. `:spike` is kept because
`docs/HELP-CORPUS-REPORT.md` cites it.

## 4. GATES / STATUS

`cd projects/sp-plus && bash tests/config-preflight.sh` -> **31 passed, 0
failed, "Safe to build."**

| Gate | State |
|---|---|
| `tests/theme-wallpaper-roundtrip.sh` on the VM | PASS, 20 checks + crash check |
| `tests/welcome-layout-gate.sh`, theme screen | PASS after the 4px fix |
| `tests/welcome-layout-gate.sh`, HELP screen | **FAIL, pre-existing** (see 5) |
| `validate-global-themes.py` in a built image | PASS, themes=8/8 errors=0 |
| Real ISO build | **NEVER RUN.** Derived builds only. |

## 5. THE CURRENT BUGS

### 5a. Help screen clipping (Christopher's next task)

`WELCOME LAYOUT GATE` reports, verbatim:

```
--- 1280x800 ---
  screen 5 CLIPPED:
    help-content cut 9px on y
--- 1024x768 ---
  screen 5 CLIPPED:
    help-content cut 20px on y
```

**PRE-EXISTING, PROVEN.** Reproduced identically against the committed
pre-Bee `index.html` and `app.css` from `git show HEAD:`. It is not a
regression from the card work. It breaks the standing rule that every
Welcome screen fits one viewport with no scrolling.

### 5b. Task bars get stuck when switching themes (Christopher's report)

His words: "the global theme switching needs fixing as we broke something as
the task bars get stuck and dont change when switching".

**LEADING HYPOTHESIS, WITH ITS CAVEAT.** During the screenshot run I switched
themes seven times with `--no-layout`, on his instruction to stop the desktop
resetting between shots. `--no-layout` deliberately does not rebuild the
panel, so the task bar stayed on Windows Light's layout for every subsequent
theme. That would produce exactly the symptom he describes.

Evidence gathered before compaction:

- The PRODUCT path is unchanged by me. All 8 cards still carry
  `data-layout-reset="true"`, and `welcome/welcome.py:399` maps that to
  `--layout`. I never edited either.
- A CLI `--layout` switch DOES rebuild the panel: applying Catppuccin-Mocha
  changed `plasma-org.kde.plasma.desktop-appletsrc` (md5 `3e31b142be68` ->
  `735c6f9c651f`) and the panel visibly changed from centred Windows-style
  icons to left-aligned Plasma ones. Applet count stayed 25 both sides.

**THE CAVEAT: this has NOT been reproduced through the Welcome app.** Every
observation above is from the command line. Christopher may have switched via
Welcome and seen it stick anyway, which would be a real product defect rather
than residue from my capture run. **Do not conclude it is my `--no-layout`
until a switch driven through Welcome has been watched.** That is the first
test to run.

### 5c. The eight committed previews carry the WRONG task bar

A direct consequence of 5b. Because the capture run used `--no-layout`, seven
of the eight previews show **Windows Light's panel** rather than each theme's
own. Compare the Mocha preview (centred Windows-style icons) with the
post-`--layout` panel captured afterwards (left-aligned).

Christopher said "we wont take new screen shots". **This still needs raising
before the ISO**, because a preview that shows the wrong task bar is exactly
the fidelity problem the previews exist to avoid. It is his call, not mine.

### 5d. plasmashell segfault, logged not fixed

Full detail in `docs/ledger/DEFECT-plasmashell-segv-theme-churn.md`. Three
SIGSEGVs in about 80 switches, in Mesa's software rasteriser on the GPU-less
VM. Needs a run on the Dell. Christopher's ruling was to log it.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

1. **"The new 7680x4320 wallpaper causes the plasmashell crash."** Refuted.
   Ten switches between the two Catppuccins, one of which ships that 8K
   image, produced zero crashes; ten on the old unchanged wallpaper also
   zero. The two captured backtraces are at DIFFERENT call sites
   (`llvmpipe_texture_layout` and `llvmpipe_draw_vbo`), which argues against
   one bad texture.
2. **"The machine ran out of memory."** Refuted. Zero kernel OOM kills,
   7.9 GB RAM with 5.5 GB available, zram swap unused.
3. **"All the crash dialogs were my test harness."** Half true. An early run
   without a session bus produced 21 `plasma-apply-lookandfeel` aborts, which
   were harness noise. The three `plasmashell` SIGSEGVs are real and occur in
   runs that otherwise pass every check.
4. **"The help clipping came from the mini-card redesign."** Refuted. It
   reproduces identically on the pre-Bee committed files.
5. **`grim` cannot capture this desktop.** It prints "compositor doesn't
   support the screen capture protocol": KWin does not implement the wlroots
   protocol. **Use `spectacle -f -b -n -o FILE`**, which works and yields
   2048x1152.
6. **`pi update` cannot work at runtime.** `/usr/bin/pi` is a symlink into
   `/usr/lib/node_modules`, which is read-only on bootc. The Containerfile
   already pins `PI_VERSION=0.84.4`, the latest published. The VM shows
   0.84.3 only because `:test50` derives from an older base. **Nothing to fix
   in source.**
7. **`pkill -f "<pattern>"` over SSH kills the SSH session itself** (exit
   255). It matched its own command line again this window. Use a bracketed
   pattern: `pkill -f "kitty --class [f]in"`.
8. **A `.xcd` or config grep matches the comment explaining the thing.**
   Cost build failures in the previous window; still true.

## 7. DECISIONS (Christopher's, do not relitigate)

- Each theme gets its own wallpaper, chosen by him one at a time.
- The two stock Breeze themes get theirs from an SP+-owned override table,
  NOT by editing their plasma-workspace defaults, which an RPM update would
  silently revert.
- Fin's first-run state stays in the previews as-is: "that's the real first
  run state", including "Fin is not connected to a provider yet".
- The plasmashell segfault is logged for hardware testing, not chased now.
- He stages every preview composition; I capture and drive the switch.
- No new screenshots in the next window.

## 8. LEDGER STATE

Committed this window, tree CLEAN:

- `64f10b2` per-theme wallpapers + the override layer + thumbnails
- `41fde85` the theme wallpaper round-trip gate
- `edc8683` new previews, redesigned mini cards, the segfault defect log
- `7ce5b50` Windows Light preview re-take

Nothing is written-but-uncommitted.

## 9. NEXT ACTIONS, IN ORDER

1. **Fix the help screen clipping** (5a). 9px at 1280x800, 20px at 1024x768.
   Verify with `tests/welcome-layout-gate.sh`, which already detects it.
2. **Reproduce the task bar bug THROUGH THE WELCOME APP** before changing
   anything (5b). If it only reproduces from my `--no-layout` CLI calls,
   there is no product defect and the fix is to the previews, not the code.
   If it reproduces through Welcome, it is real. Do not guess.
3. **Raise 5c with Christopher**: seven previews show Windows Light's panel.
   He has said no new screenshots; he needs to know before the ISO anyway.
4. **Build the ISO** once 1 and 2 are settled, and confirm everything from
   today is in it: both `.xcd` files, the six wallpaper packages, the
   override table, the help app, the new previews and cards.
5. **Run `tests/theme-wallpaper-roundtrip.sh` on the Dell** to settle the
   segfault (5d).
6. Re-run `tests/field-inspect.sh` on the VM, edited long ago, never re-run.
7. `ghcr.io/secureprospective/sp-plus-kde:latest` is older than what the ISO
   installs, so production machines fail to update. ISO-44-QUEUE item 2.

## 10. RELAY / ENVIRONMENT NOTES

- **Getting a desktop session over SSH**: import the environment from the
  running shell, do not assume it. This one-liner is used by every gate:
  `shell_pid=$(pgrep -u $(id -u) -x plasmashell | head -1); while IFS= read -r -d "" e; do case "$e" in XDG_RUNTIME_DIR=*|WAYLAND_DISPLAY=*|DBUS_SESSION_BUS_ADDRESS=*|XDG_SESSION_TYPE=*) export "${e?}";; esac; done < /proc/$shell_pid/environ`
  Without it `spplus-apply-theme` fails correctly and a naive gate reports 20
  false failures.
- Screenshots: `spectacle -f -b -n -o FILE`, then `sleep 4` before reading it.
- `spplus-apply-theme` CLI is `THEME_ID (--layout|--no-layout)`, positional.
  There is no `--theme` flag.
- Welcome source for gates goes to `~/.spplus-test/sp-plus-welcome-src/welcome`
  and `SPPLUS_WELCOME_SRC` **must include the trailing `/welcome`**.
- Test scaffolding on the VM lives in **`~/.spplus-test/`**, hidden, so it
  cannot appear in a preview screenshot. The visible home must stay at 8
  folders. Preview captures are in `~/.spplus-test/theme-previews/`.
- Qt gates need `QT_QPA_PLATFORM=offscreen`. libEGL/libva/dbus warnings are
  noise.
- Derived builds: `podman build --network host --tls-verify=false`, base
  `localhost:5000/...` not `127.0.0.1:5000`. Switch the VM with
  `sudo bootc switch --transport registry 10.0.2.2:5000/sp-plus-kde:TAG`
  then reboot; it comes back in about 40 seconds.

## 11. HONEST STATUS

The wallpapers are genuinely proven: applied through the real helper on a
real Wayland session, read back from the live plasmashell applet config,
20 of 20 including the double round trip, from a booted image rather than an
overlay. The previews are real staged desktops. The cards were verified by
rendering Welcome at 1366x768 and looking at it, and by the layout gate.

**What is unproven or wrong:** nothing has been through a real ISO build, so
the new Containerfile blocks have never run in sequence. Seven of the eight
previews carry the wrong task bar (5c). The task bar bug has not been
reproduced through the Welcome app (5b). The segfault has never been seen on
hardware. Nothing today has been touched on the Dell.
