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

**`spplus-build45.service`** — building and pushing the image that carries every fix. Started
08:20 CDT. It is a detached systemd unit and **survives compaction**. Do not restart it.
- Alive?   `systemctl --user is-active spplus-build45.service`
- Result:  `systemctl --user show spplus-build45.service -p Result --value`
- Log:     `~/logs/sp-plus/build-test45-*.log` (the script tees to a timestamped file)
- Script:  `~/fleet/bin/spplus-build-push.sh test45` — builds rootless, pushes to
  `192.168.1.190:5000/sp-plus-kde:test45`, then CONFIRMS the tag is really in the registry
  rather than trusting push's exit code.
- Journal: `journalctl --user -u spplus-build45 --no-pager | tail -40`
- On success: `~/fleet/bin/spplus-dell-switch.sh test45`, reboot the Dell, re-run the round
  trip against the shipped image (§9).

**On the Dell (192.168.1.134), deliberately running:**
- `probe-dolphin.service` — a Dolphin left open by the receipt capture. Harmless.
- Current theme is `org.kde.breeze.desktop`. plasmashell is up.
- Staged copies that the tests currently depend on: `~/spplus-apply-theme`, `~/stage/`
  (image root), `~/welcome-new/` (the new Welcome app), `~/cdp.py`,
  `~/welcome_roundtrip.py`, `~/capture_receipts.sh`, `~/receipts/*.png`,
  `~/roundtrip-results.json`. These become redundant once test45 is installed.

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

## 5. NO OPEN BUG — the goal has been met on the staged build

The acceptance criterion PASSED at 08:07 CDT, driven entirely through the Welcome app by
real mouse events (DevTools `Input.dispatchMouseEvent`), so the app's JavaScript, its
window-title bridge and the apply helper all ran as they would for a person clicking:

```
t0  windows11.dark -> breezedark      OK
t1  breezedark     -> windows11.dark  OK
t2  windows11.dark -> breezedark      OK
t3  breezedark     -> windows11.dark  OK      VERDICT: PASS
```

Verified independently after each transition. KWin reported having LOADED
`aurorae.v2 / windows-modern-dark` for Windows and `org.kde.breeze` for Breeze. t1 and t3
identical; containments stayed at 1 panel / 0 orphaned; the shell survived all four.
Evidence: `~/roundtrip-results.json` on the Dell.

**The caveat, and it is the whole remaining job:** that run used the STAGED helper and theme
(`SPPLUS_APPLY_THEME=/home/test/spplus-apply-theme`, `SPPLUS_IMAGE_ROOT=/home/test/stage`,
`~/welcome-new/welcome.py`), NOT the shipped image. The Dell still runs `test44`. The honest
final proof is the same round trip on test45 after `bootc switch` + reboot.

**Open question for Christopher, not a defect:** Breeze keeps the Windows centred taskbar.
Only the Windows themes carry `data-layout-reset="true"`, so switching to Breeze changes
colours, icons, style and decoration but leaves the panel arrangement alone.

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
- **"`--resetLayout` breaks the panel."** REFUTED twice over. The empty panel was
  `panel.locked = true` before `addWidget`; `--resetLayout` writes the layout correctly.
- **"Windows Light has a layout bug."** REFUTED. Plasma's package loader silently IGNORES
  symlinked files inside a look-and-feel package. The light layout was a symlink to the dark
  one, so Plasma fell back to the stock default panel reporting no error. Both are real files
  now, and Light applies cleanly.
- **"The Start button shows the Windows logo."** WRONG when I first claimed it: that came
  from my own test layout. The shipped layouts asked for `start-here-kde-symbolic`, which
  `windows-modern` does not ship, so both Windows themes showed a KDE logo. Now `start-here`.
- **Upstream themes must be applied with `--no-layout`.** Only the two Windows packages ship
  an inspectable layout; asking for one on Breeze/Nordic/Catppuccin/Orchis fails validation.
  The Welcome app already gets this right via `data-layout-reset`.
- **Spectacle's `-o` works fine.** A run that wrote every screenshot to `btop.png` was my own
  bash bug: a helper function used `for name in ...`, and bash function variables are global
  by default, so it clobbered the caller's `$name`. Use `local`.
- **DevTools visibility must be judged by `getBoundingClientRect()`, not `offsetParent`.** The
  preview is a `position:fixed` modal and `offsetParent` is always null for fixed elements.
- **The theme cards have a zero-sized box until their wizard step is shown.** Navigate to
  "Choose the look" first or clicks silently hit nothing.
- **The preview modal stays open after an apply** and swallows the next click; close it
  between transitions. Close is legitimately disabled while an apply is in flight.

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

1. Check `spplus-build45.service` (§3). On success note the digest from the `BUILD OK` block.
   If it FAILED, read `~/logs/sp-plus/build-test45-*.log` — do not rebuild blindly.
2. Switch the Dell: `~/fleet/bin/spplus-dell-switch.sh test45`. It refuses early if the Dell
   cannot see the tag, and prints the boot-entry count before staging. Then poll
   `ssh ... test@192.168.1.134 'systemctl is-active spplus-switch'`.
3. Confirm TWO boot entries exist before any reboot (`ls -1 /boot/loader/entries/ | wc -l`),
   then reboot the Dell. That second entry is the rollback safety net.
4. After boot: `bootc status` shows test45; `systemctl --failed`; confirm
   `/usr/libexec/spplus-apply-theme` is the NEW helper and `/usr/share/icons/windows-modern/
   index.theme` carries the Papirus inherit line.
5. Re-run the acceptance round trip against the SHIPPED image — no `SPPLUS_APPLY_THEME`, no
   `SPPLUS_IMAGE_ROOT`, and the installed `/usr/bin/spplus-welcome`:
   launch it with `QTWEBENGINE_REMOTE_DEBUGGING=9222`, then
   `python3 ~/welcome_roundtrip.py`. Expect VERDICT: PASS.
6. Capture a screenshot after the final transition and LOOK at it. Legibility is pass/fail.
7. Log what worked and what did not, per the standing goal.
8. Raise the Breeze-keeps-the-Windows-taskbar question with Christopher (§5).

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

**The goal is met on the staged build and NOT yet on the shipped image.** The round trip
passed through the Welcome app with independent verification (§5), the source gate passes for
the first time, and eight preview receipts exist in the composition Christopher specified
(file manager over stock wallpaper, menu open, no Welcome window). What remains is
mechanical but real: test45 must build, install on the Dell, and repeat the same run without
any staging environment variables. Until that happens the claim is "proved on staged code",
not "proved on the product".
