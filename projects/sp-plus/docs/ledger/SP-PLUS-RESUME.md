# SP+ RESUME — 2026-08-31 07:08 CDT (theme round trip, compact #2)

## 1. WHAT WE ARE DOING

Make the SP+ Welcome theme picker actually switch global themes, so Windows looks like
Windows and Breeze looks like Breeze. **Goal (Christopher, /goal, still active):** switching
to Windows, back to Breeze, then back to Windows again **without error, using only the
Welcome application on the Dell.** Keep working until that happens, then log what worked and
what did not.

Repo: `~/work/secureprospective-advisor-os` (a git worktree — do not cd to the original).
Work lives in `projects/sp-plus`. Branch as checked out; last commit `0270a00`.

**The Dell is ON and reachable** — this is new since the last resume, and the address changed:
`ssh -i ~/.ssh/id_ed25519 test@192.168.1.134` (NOT .124, which is stale in older docs).
Key auth works, no password. The Dell has passwordless sudo; the Beelink does not.
It is running `sp-plus-kde:test44` with a live Plasma 6.7 Wayland session.

## 2. AGENTS + HARNESSES

- **Bee** = `pi` on the Beelink, `--provider openai-codex --model gpt-5.6-luna --thinking max`.
- Briefs: `~/.pi/agent/spplus-brief-<id>.md`. Reports: `~/fleet/runs/REPORT-<id>.md` + `.DONE`.
- **Two runners, and the difference matters** — I lost a cycle to this:
  - `~/fleet/bin/run-bee-spplus-manifest.sh` — prompt says "audit task" + **read-only**.
    Bee will refuse to edit source. Use only for audits.
  - `~/fleet/bin/run-bee-spplus-impl.sh` — **NEW this session**, write-enabled. Use for
    implementation. Dispatch pattern:
    `systemd-run --user --unit=<name> --collect --property=TimeoutStartSec=infinity
     /bin/bash -lc 'TMO=5400 ~/fleet/bin/run-bee-spplus-impl.sh <brief-id>'`

## 3. IN FLIGHT RIGHT NOW — MOST PERISHABLE

**No Bee job is running.** `spplus-phase2c.service` completed at 07:09 with `Result=success`;
report `~/fleet/runs/REPORT-phase2c-lock.md` (3,941 B). Its fix is VERIFIED IN SOURCE but
NOT yet on hardware: `panel.locked = true` now sits at line 109, after every `addWidget`, in
BOTH windows light and dark, and `config/spplus-apply-theme` now accepts either
`org.kde.plasma.minimizeall` or `org.kde.plasma.showdesktop` (lines 66-67).

**On the Dell, deliberately running, leave alone:**
- `welcome-probe` transient unit — the Welcome app with
  `QTWEBENGINE_REMOTE_DEBUGGING=9222`. This is how the round trip gets driven.
- plasmashell is alive and was started via `systemctl --user start plasma-plasmashell.service`.
- The Dell still carries my staged copies under `~/stage` and `~/.local/share/...`, which are
  now STALE relative to the 2c fix — re-stage before testing (§9 step 2).

## 4. ARTIFACTS THAT EXIST AND WORK

- `~/fleet/runs/REPORT-phase2-windows.md` (24,773 B) — Bee's phase-2 report, honest, every
  claim marked "coded, unproven — needs the Dell".
- `~/fleet/runs/REPORT-phase2b-fixes.md` (4,496 B) — the read-only audit run (my dispatch
  error), but it did verify `gdbus -- -1` returns 0.
- **Screenshots, real evidence, in `~/logs/sp-plus/theme-shots/`**:
  `windows-FIXED-taskbar.png` (centred taskbar, Windows 11 logo, all five pins rendering),
  `windows-FIXED-window.png` (legible white-on-dark Dolphin, Windows title bar),
  `windows-FIXED-full.png`, plus earlier `windows-dark.png` / `breeze-dark.png`.
- **On the Dell**: `~/spplus-theme-capture.sh`, `~/spplus-theme-diff.sh`, `~/cdp.py`,
  `~/spplus-apply-theme` (staged helper), `~/stage/` (40 MB staged image root),
  `~/shots/*.png`, `~/.local/state/sp-plus/theme-events.jsonl` (helper correlation log).
- **On the Beelink**: `~/fleet/bin/spplus-theme-capture.sh`, `spplus-theme-diff.sh`,
  `spplus-build-push.sh`, `spplus-dell-switch.sh`, `run-bee-spplus-impl.sh`;
  scratchpad `cdp.py`, `welcome_roundtrip.py`.
- Registry `spplus-reg` (podman, :5000) holds `sp-plus-kde:test44`. **Keep it up.**

## 5. THE LAST BUG FOUND — panel lock ordering (root cause proven, fix in source)

Running the Windows dark layout through `org.kde.PlasmaShell.evaluateScript` returns verbatim:

```
TypeError: Property 'writeConfig' of object
Error: Could not create the org.kde.plasma.panelspacer widget! is not a function at line 50
```

`addWidget` returns an Error, so the panel is built with **zero widgets** — that is the
`panels: [[]]` the helper polled for 90 s before rolling back.

**Cause:** the layout script sets `panel.locked = true;` BEFORE calling `addWidget`. A locked
panel refuses new applets.

**Proof, not hypothesis:** removing that one line and changing nothing else produced the
intended panel on the first attempt:
`panelspacer, kickoff, icontasks, panelspacer, systemtray, digitalclock, minimizeall`
with pins brave / thunderbird / dolphin / writer / okular.

Fixed in source by phase 2c: the lock now happens after every widget is added, in both
variants. **Caveat: that re-locked ordering has NOT been run on hardware yet.** It is the
first thing to verify (§9 step 1).

Second, smaller: `org.kde.plasma.showdesktop` is **not installed** on the image. Bee's
fallback correctly selects `org.kde.plasma.minimizeall`, but the helper's
`layout_expectation` still demands `showdesktop`, so a correct apply would fail its own
read-back. Reconciled in phase 2c: the helper now accepts either applet (lines 66-67).

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **"Black text on black background is a theme defect."** REFUTED. It was my artifact: I had
  killed plasmashell and launched apps from an SSH shell with no `XDG_CURRENT_DESKTOP`, so Qt
  never loaded the KDE platform theme. Launched properly via `systemd-run --user`, the Windows
  dark theme is fully legible (see `windows-FIXED-window.png`).
- **"`--resetLayout` is destructive / truncates configs."** REFUTED. A zero-byte
  `~/.config/<file>` is NORMAL: `plasma-apply-lookandfeel` writes theme values into
  `~/.config/kdedefaults/<file>` (the defaults layer) and reverts the user file. Every themed
  file had a populated kdedefaults counterpart. The old note at `config/kcminputrc:8` was a
  misdiagnosis.
- **"`--resetLayout` causes the empty panel."** REFUTED — it was the panel lock (§5).
  `--resetLayout` does stop plasmashell (unit `Result=success`, `NRestarts=0`, stays down),
  which is a real defect, and Bee has fixed it with a restart + D-Bus readiness poll.
- **"A stale decoration key leaks across themes."** REFUTED — harness artifact. `kreadconfig6`
  in an SSH shell reads a DIFFERENT cascade than the session unless `XDG_CONFIG_DIRS` includes
  `~/.config/kdedefaults`. The capture script now inherits it from plasmashell's `/proc` environ.
- **"`org.kde.plasma.panelspacer` is missing."** REFUTED. It ships as a compiled plugin at
  `/usr/lib64/qt6/plugins/plasma/applets/`, and `knownWidgetTypes` lists 69 types including it.
- **"Kvantum needs `theme=Windows-modernDark` for the dark LnF."** REFUTED — `widgetStyle=
  kvantum-dark` selects the Dark variant automatically. Bee's `theme=Windows-modern` is right.
- **Tunnelling DevTools off the Dell.** Does not work — QtWebEngine validates the Host header
  and resets. Run `cdp.py` ON the Dell instead.
- **`pkill -f <pattern>` where the pattern appears in my own SSH/bash command line kills my own
  shell.** Cost two aborted commands. Use a pattern that cannot match itself.

## 7. PROVEN ON HARDWARE (live Plasma 6.7 session) — do not re-derive

- `org.kde.KGlobalSettings` has **no bus owner**. It is signal-only, so the original
  `notifyChange` method calls could never have worked. Correct form is `gdbus emit`.
- `org.kde.KWin.reconfigure` is a real method; `supportInformation` returns a string and is
  the only way to prove which decoration KWin **actually loaded**.
- `org.kde.PlasmaShell` exposes `evaluateScript`, `dumpCurrentLayoutJS`,
  `loadLookAndFeelDefaultLayout`, `refreshCurrentShell`.
- `evaluateScript` applies a layout cleanly, keeps the shell alive, and **removes orphaned
  containments** (the Dell had 2 orphaned panels before any of this work).
- The theme round trip Breeze→Windows→Breeze→Windows is idempotent at the mechanism level:
  captures t1≡t3 and t2≡t4 IDENTICAL, and the differ was control-tested to prove it can fail.
- Icon fix: `theme/icons/windows-modern/index.theme` now
  `Inherits=Papirus,breeze,breeze-dark,hicolor`. Verified on screen — Brave and Thunderbird
  render; without Papirus they were blank because windows-modern ships neither.
- SP+ Kickoff favourites are only half-seeded: one instance has
  `favoritesPortedToKAstats=true` and reads stock Plasma defaults (kontact, konsole, discover)
  from `kactivitymanagerd-statsrc`. Separate defect; must not block the theme round trip.
- `/etc/xdg/kwinrc` in the image hard-codes the **Windows** Aurorae decoration as the
  system-wide default. Worth revisiting; not blocking.

## 8. DECISIONS — do not relitigate

- DN-43 theme wins on everything it declares, SP+ policy fills gaps only. The Papirus
  inheritance link obeys this: windows-modern keeps the icon role, Papirus only fills gaps.
- DN-44 75% preview before applying; do NOT promise Kickoff favourites restoration.
- DN-45 Windows must be familiar, not counterfeit.
- Acceptance = the repeated round trip, not one successful apply.
- Code standard: clean, no shortcuts, no swallowed errors, no fixed sleeps for readiness.
- "Coded" is not "works." Report what was OBSERVED.
- **Legibility is pass/fail**, not cosmetic (Christopher, this session): "simply changing
  themes without error is the goal, but if its not usable thats not a passing grade."

## 9. NEXT ACTIONS, IN ORDER

1. Re-stage to the Dell and re-run the apply:
   ```
   scp config/spplus-apply-theme test@192.168.1.134:/home/test/spplus-apply-theme
   rsync -a theme/look-and-feel/ test@192.168.1.134:/home/test/stage/usr/share/plasma/look-and-feel/
   rsync -a theme/icons/         test@192.168.1.134:/home/test/stage/usr/share/icons/
   ```
   then on the Dell, with the session env exported from plasmashell's `/proc/<pid>/environ`
   and `SPPLUS_IMAGE_ROOT=$HOME/stage`:
   `python3 ~/spplus-apply-theme org.secureprospective.spplus.windows11.dark --layout`
   Expect a success verdict and the seven-applet sequence.
2. Run the round trip THROUGH the Welcome app:
   `scp scratchpad/welcome_roundtrip.py test@…:/home/test/ && ssh … python3 ~/welcome_roundtrip.py`
   It dispatches real mouse events via CDP, so the app's JS + title bridge + helper all run.
   Requires the `welcome-probe` unit running with `QTWEBENGINE_REMOTE_DEBUGGING=9222`.
3. Capture the eight preview receipts required by
   `welcome/PREVIEW-CAPTURE-CONTRACT.md` — the source gate FAILS until all eight exist
   (`tests/theme-phase2-source-gate.sh`, currently: `FAIL missing applied-session preview
   receipt: windows-light.png`). Captures must come from a real applied session AFTER a
   success verdict, showing panel + decoration + wallpaper + an open app.
4. Commit everything (nothing from this session is committed yet — see §10).
5. ONE build: `~/fleet/bin/spplus-build-push.sh test45` (builds + pushes + verifies the tag
   is actually in the registry). Then `~/fleet/bin/spplus-dell-switch.sh test45`, reboot the
   Dell, and run the acceptance round trip on the shipped image.

## 10. LEDGER STATE

**Nothing from this session is committed.** Uncommitted and wanted:
- `projects/sp-plus/config/spplus-apply-theme` (Bee phase 2 + 2b + 2c)
- `projects/sp-plus/config/spplus-first-login`, `welcome/*`, `theme/*`, `tests/*`
- `projects/sp-plus/theme/icons/windows-modern/index.theme` — **my** Papirus inheritance fix
- `projects/sp-plus/docs/ledger/DELL-PREFLIGHT-2026-08-30.md` — written by me, uncommitted
- `projects/sp-plus/welcome/PREVIEW-CAPTURE-CONTRACT.md`, `theme/wallpaper/` (untracked)

The `tests/bee-lane/*` modifications are **Christopher's own from 10:39–10:41 on 08-30** —
confirmed by mtime. Leave them.

## 11. ENVIRONMENT NOTES

- Dell session env must be inherited from plasmashell's `/proc/<pid>/environ`, not hand-built.
  Without `XDG_CURRENT_DESKTOP`/`XDG_CONFIG_DIRS` both apps and probes read the wrong thing.
- Restart the shell with `systemctl --user start plasma-plasmashell.service`, never `pkill` +
  `setsid` — the latter produces a shell with no desktop environment.
- `spectacle -b -n -f -o <path>` takes a headless screenshot; needs `WAYLAND_DISPLAY`.
- The Beelink has `websockets` 15.0.1; the Dell has neither websockets nor websocket-client,
  hence the dependency-free `cdp.py`.
- CT105 (192.168.1.105) is head-brain; its activity here is normal. Do not "fix" it.

## 12. HONEST STATUS

**The goal has NOT been met.** Nothing has yet been switched through the Welcome app end to
end. What is genuinely proven: the switch mechanism works and is idempotent, Windows now looks
like Windows and is legible (screenshots), the centred taskbar and correct pins can be built,
and three real defects have been found and two fixed. The panel-lock fix is in source but its
re-locked ordering is unverified on hardware. The build has not been made; the Dell still runs
`test44`. The eight preview receipts do not exist and the source gate fails without them.
