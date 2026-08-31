# Dell pre-flight — what the live session proved before any new code ran

Date: 2026-08-31 (02:48Z)
Machine: Dell Inspiron 5737, `test@192.168.1.134`, running `sp-plus-kde:test44`
Session: Plasma 6 Wayland, live, reached over SSH via the user session bus

This is the first time any agent on this project has had a **running graphical session**
to interrogate. Everything in `PLASMA6-CONSTRAINTS.md` was derived from reading Plasma
source; the entries below are the subset that has now been checked against a live bus,
plus three defects the live system revealed that source reading could not have found.

## Confirmed — the diagnosis was right

**1. `org.kde.KGlobalSettings` has no owner on the session bus.**
`busctl --user list | grep -i kglobalsettings` returns nothing. It is signal-only, exactly
as concluded. The old `spplus-apply-theme` called it as a *method*, so **every theme
reload this project has ever performed has failed silently.** This is no longer a
hypothesis; there is no process on the bus that could have answered those calls.

**2. `org.kde.KWin.reconfigure` is real.**
`busctl --user introspect org.kde.KWin /KWin org.kde.KWin` lists `.reconfigure` (no-reply)
and `.supportInformation` returning a string. The reload half of the fix has a valid call.

**3. Aurorae `.v2` genuinely loads; `supportInformation` can prove it.**
On the live session KWin reports `Plugin: org.kde.kwin.aurorae.v2` and
`Theme: __aurorae__svg__CatppuccinLatte-Classic`. This is the assertion that distinguishes
"we wrote a request into kwinrc" from "KWin actually loaded the decoration", and it works.

**4. There is a layout route that does not require `--resetLayout`.**
`org.kde.PlasmaShell` exposes `loadLookAndFeelDefaultLayout(s)`, `evaluateScript(s)` and
`dumpCurrentLayoutJS()`. `--resetLayout` is the call that has truncated `kcminputrc`
before, so a D-Bus layout path avoids the known destructive route entirely.

## Defects the live system revealed — none of these were predicted

**5. Two orphaned panel containments already exist.**

| Containment | plugin | formfactor | lastScreen |
|---|---|---|---|
| C1, C2 | `org.kde.plasma.folder` | 0 | 0, 1 |
| C3, C24 | `org.kde.panel` | 2 | 0, 1 |
| **C47, C48** | `org.kde.panel` | **0** | **-1** |

C47 and C48 are panels attached to no screen, with a planar formfactor. They are residue
from previous layout resets. This is the "orphaned panels" symptom the round-trip test was
written to catch, and it is **already present before the new code has run at all**.

Consequence for the test: the Dell's baseline is dirty. Run from here, a pass could not be
distinguished from a failure that merely added to existing junk. The baseline must be
cleaned, and orphan count must be an asserted quantity, not an eyeball check.

**6. The SP+ Kickoff favourites are only half-applied.**

There are two Kickoff instances. One has `favoritesPortedToKAstats=false` and so still
reads the SP+ seven-app list from its own `favorites` key. The other has it `=true`, which
means its favourites come from `kactivitymanagerd-statsrc` — and that file holds **stock
Plasma defaults**: `kontact`, `systemsettings`, `kwrite`, `konsole`, `discover`. None of
those are SP+ applications and two are not installed for an advisor to use.

This is the failure mode that survives a visual check, because the *other* instance looks
correct. DN-44 already declined to promise favourites restoration across a theme switch;
this shows the seeding is not reliable even before a switch.

**7. `kcminputrc` is absent on the Dell.**
Consistent with the truncation history recorded at `config/kcminputrc:8`. Its absence is
now a baseline fact, so a file appearing at zero bytes after a switch is attributable.

## What this changes

- The round trip must start from a **cleaned** containment set, and orphan count must be
  asserted after every transition, not just at the end.
- Favourites seeding is a separate defect from theme switching. It should not be allowed
  to fail the theme round trip, and it must not be quietly fixed inside the theme code.
- The apply path should prefer the D-Bus layout route over `--resetLayout`.

## Evidence

Capture harness `~/fleet/bin/spplus-theme-capture.sh` (runs on the Dell), differ
`spplus-theme-diff.sh`. Baseline capture on the Dell at
`~/.local/state/spplus/capture/baseline-catppuccin.txt`.
