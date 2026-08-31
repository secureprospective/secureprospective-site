# SP+ RESUME — global theme picker rebuild (DN-43..45)

Written 2026-08-30 ~20:59 CDT, mid-session, before a context compaction.
**The session continues after this. Resume at NEXT ACTIONS item 1.**

## 1. WHAT WE ARE DOING

Making the SP+ Welcome global-theme picker actually apply the creator's theme instead of
only colours and window decorations. Piloting on Windows light+dark because it is the
hardest case; once it survives, the groundwork holds for every other theme.

- Repo: `/home/chris/work/secureprospective-advisor-os`, branch `session/sp-plus-plan`
- Project subdir: `projects/sp-plus`
- Build + hardware test: **the Dell** (GPT drives the GUI, Claude watches headless over SSH)

## 2. AGENTS + HARNESSES

- **Bee** = `pi` on the Beelink, `--provider openai-codex --model gpt-5.6-luna --thinking max`.
  Dispatcher: `~/fleet/bin/run-bee-spplus-manifest.sh <fid>` (allows file writes).
  Briefs: `~/.pi/agent/spplus-brief-<fid>.md`. Output: `~/.pi/agent/spplus-<fid>.{out,err,sentinel}`.
- **GPT/terra** — Christopher relays questions; findings land in `~/fleet/inbox/`.
- Reports + sentinels: `~/fleet/runs/REPORT-<id>.md` + `.DONE`.

## 3. IN FLIGHT RIGHT NOW — most perishable

**`spplus-phase2-windows.service`** — the implementation job.
- Started 2026-08-30 20:33:38 CDT. Timeout 10800s (3h) → hard stop ~23:33.
- Alive check: `systemctl --user is-active spplus-phase2-windows` and `ps -o pid,etime -C pi`
  (PID was 3648882).
- Brief: `~/.pi/agent/spplus-brief-phase2-windows.md` (257 lines).
- Output: `~/.pi/agent/spplus-phase2-windows.{out,err}`; sentinel written on exit.
- Report it must write: `~/fleet/runs/REPORT-phase2-windows.md` + `.DONE`.
- **Already producing work**: it has vendored the two missing Catppuccin Aurorae rc files
  (`theme/vendor/aurorae/Catppuccin{Mocha,Latte}-Classic/*rc`, untracked).
- A Monitor task (`bmei5nehi`) watches for the report/sentinel. **Monitors do not survive
  compaction reliably — re-arm or check by hand after resuming.**
- If it dies: recover reasoning from `~/.pi/agent/spplus-phase2-windows.out`, do NOT
  re-dispatch blind.

**NOT MINE — leave alone:** `pi` PID 3431213 (~3h28m elapsed). Christopher's own earlier
interactive session. Confirmed idle, cwd `/home/chris`, no repo file descriptors, cannot
collide with our work.

## 4. GATES / STATUS

| Item | State |
|---|---|
| Theme manifest audit, all 5 themes | **DONE**, all `EXIT=0` |
| Plasma 6.7 constraints research | DONE |
| Panel spec + preview copy (GPT) | DONE |
| Pinned apps + favourites restore research | DONE |
| Phase 2 implementation | **IN FLIGHT** |
| Anything working on hardware | **NONE. Nothing has been built or tested.** |

## 5. ARTIFACTS THAT EXIST

All under `projects/sp-plus/docs/theme-manifests/` (uncommitted, untracked):

    theme-windows.md    56946 B     theme-breeze.md     64583 B
    theme-catppuccin.md 64618 B     theme-nordic.md     54467 B
    theme-orchis.md     59697 B     PLASMA6-CONSTRAINTS.md          19949 B
    WINDOWS-PANEL-AND-PREVIEW-COPY.md 19633 B
    PINNED-APPS-AND-FAVOURITES-RESTORE.md 15895 B

Ledger (untracked): `DECISION-2026-08-30-theme-fidelity.md` (DN-43),
`-theme-preview.md` (DN-44), `-windows-familiar-not-counterfeit.md` (DN-45),
`DELL-THEME-ROUNDTRIP-TEST.md`. Modified: `theme/vendor/PROVENANCE.md`.

Existing ISOs (unrelated to this work, still valid): `~/Downloads/SP-PLUS-cycle43.iso`,
`SP-PLUS-cycle39.iso`, 5.45 GB each.

## 6. THE DEFECT — three confirmed root causes

1. `config/spplus-apply-theme` parses only `contents/defaults`; **no layout path at all**,
   so no picker choice can move a panel.
2. Its `notify()` calls `org.kde.KGlobalSettings.notifyChange` as a D-Bus **method**. It is
   a **signal**, with no method implementation — so every reload call has always failed.
   Working form is `gdbus emit`.
3. **Every** subprocess uses `check=False`; the script returns 0 having only ATTEMPTED its
   writes, so Welcome reports success with nothing landed.

Plus: `spplus-first-login` uses `--resetLayout` + fixed waits + incomplete read-back while
the picker omits `--resetLayout` entirely, so the same theme yields different desktops
depending how it was applied. Phase 2 collapses both onto one path.

## 7. REFUTED / SETTLED — DO NOT RETEST

- **`plasma-apply-lookandfeel --resetLayout` is NOT layout-only.** `lnftool` always applies
  `AppearanceSettings | BlendChanges`; its appearance phase calls `setCursorTheme()` which
  opens `kcminputrc` and `revertToDefault()`s it. That explains our observed zero-byte
  `kcminputrc` — no bug needs to be hypothesised.
- **There is no layout-reload completion signal.** `startupCompleted` is not exported on
  `org.kde.PlasmaShell`; `shellChanged` belongs to `changeShell`. Poll, never sleep.
- **lockscreen / osd / loginmanager are INERT** from a look-and-feel package on Plasma 6.
  Nordic ships all three; they can never appear. Honoured: splash, windowswitcher, layouts,
  logout, colors, defaults.
- **Stock Breeze is byte-for-byte upstream Plasma 6.7.4** and all its assets exist in the
  image — the mismatch is entirely SP+'s doing.
- **Windows' Papirus icons are OUR choice, not a compat fix** — `windows-modern` icons are
  installed at `Containerfile:L868` and unused. For the *vendored* themes Papirus IS
  required-compat (Nordic/Orchis declare icon sets they do not ship).
- **Windows' `Windows-modern-dark-cursors` does not exist upstream** — dangling reference.
  `breeze_cursors` stays; DECIDED, do not go looking for a cursor set.
- **Kickoff favourite ORDER cannot be reliably restored.** Membership is in kactivitymanagerd
  SQLite; order is in `kactivitymanagerd-statsrc` under a group keyed by applet instance id,
  which changes on recreation. `favoritesPortedToKAstats=false` is NOT a restore mechanism.
  Taskbar pins ARE restorable (they live in `appletsrc`).
- **Catppuccin's Aurorae is missing its `<theme>rc`** (upstream installs it from
  `Resources/Aurorae/Common`); without it KWin silently falls back to Breeze. Bee is fixing.

Caveat on all of the above: it is **source-derived**. Bee had no graphical session. Runtime
behaviour is unproven until the Dell run. That is the plan, not a defect.

## 8. DECISIONS (Christopher) — do not relitigate

- **DN-43**: the theme wins on everything it declares; SP+ policy fills gaps only. Layout may
  be reset, but only with a receipt + restorable backup. Pilot = Windows light+dark together.
- **DN-44**: ~75% preview before committing; the preview image IS the build-gate screenshot
  (captured from our VM, never the creator's own). Panel shows image + honest change-list.
  Restore promise narrowed: panel + taskbar pins yes; menu-favourite order no.
- **DN-45**: keep the Windows NAME, drop fake affordances (no Windows logo on Kickoff, no
  Widgets/Search/Snap buttons). Stability beats fidelity — if the pseudo-centre drifts, go
  left-aligned.
- Taskbar pins (5, in order): brave-browser, Thunderbird, dolphin, libreoffice-writer, okular.
  Fin is **menu-only** until it has a non-terminal UI. `kitty` must never be pinned.
- **Ship upstream's Windows Modern wallpaper** (not currently in the image).
- Cursor stays `breeze_cursors`, disclosed in the change-list.
- **Acceptance = the ROUND TRIP**: Breeze→Windows→Breeze→Windows without breakage.
  Plan in `docs/ledger/DELL-THEME-ROUNDTRIP-TEST.md`.
- **Code standard**: clean, no shortcuts. No stubs/TODOs, no swallowed errors, no fixed
  waits, no hard-coded special cases, no copy-paste between light/dark.
- **"Coded" is not "works."** Report what was OBSERVED; say "coded, unproven" otherwise.
- Orchis eligibility (full profile / style-only / pull from Welcome) is **still open** — it
  needs 4 asset sets we don't ship and its layout hard-codes `/home/vince`. Not urgent;
  not in the pilot.

## 9. LEDGER STATE

Everything from today is **written but NOT committed**. Nothing has been committed this
session. The four new ledger docs, the whole `docs/theme-manifests/` directory, the
`PROVENANCE.md` edit and Bee's Catppuccin rc files are all untracked/modified in the tree.

## 10. NEXT ACTIONS, IN ORDER

1. **Check whether `spplus-phase2-windows` is alive** (`systemctl --user is-active`) and
   whether `~/fleet/runs/REPORT-phase2-windows.DONE` exists. Re-arm a Monitor if still running.
2. **When the report lands, do NOT relay it as-is.** First `git diff` the changed files, then
   grep them for `check=False`, `sleep`, `except: pass`, `TODO`. Reject shortcuts even if the
   feature works.
3. **Separate observed from written** in anything reported to Christopher.
4. Confirm the apply path is idempotent enough to survive the round trip.
5. Build the ISO and get it onto the Dell. Then run
   `docs/ledger/DELL-THEME-ROUNDTRIP-TEST.md`: GPT clicks, Claude watches the JSONL
   correlation log headless over SSH.
6. Settle Orchis eligibility with Christopher when convenient.

## 11. ENVIRONMENT NOTES

- `gh` 2.98.0 installed to `~/.local/bin/gh` this session (no sudo; sudo needs a password
  here), authenticated from the existing PAT in git's credential store. `hosts.yml` is 0600.
  It has write scopes; only reads were needed.
- Filing gate PASSES; reaper reports 0 MB reclaimable. New dotfile `~/.npm` noted, not filed.
- CT105 (192.168.1.105) is head-brain; its activity here is normal, do not "fix" it.

## 12. HONEST STATUS

**Nothing works yet.** The picker is exactly as broken as it was this morning. What exists is
an accurate, cited diagnosis, a decided design, and an implementation job in flight. The first
real milestone is not "the code is written" — it is GPT clicking Apply on the slow Dell while
the correlation log and the visible desktop agree.
