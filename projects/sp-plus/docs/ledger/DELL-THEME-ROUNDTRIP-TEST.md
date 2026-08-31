# The Dell acceptance test — theme switching must survive the round trip

Date: 2026-08-30
Criterion set by: Christopher
Status: to run once the phase-2 build is on the Dell

## The bar

> "if we can change from Breese to Windows and back to breese then back to windows again
> without breakage, thats the win. Then the ground work for any globale theme will be layed."

**Acceptance is the repeated round trip, not a single successful apply.** A one-way apply
can pass while the implementation is quietly wrong — leaking state from the previous theme,
accumulating snapshots, depending on the starting configuration, being non-idempotent, or
restoring a layout imperfectly in a way that only appears on the second pass. A to B to A
to B forces every stage to be correct from an arbitrary starting state.

## Who does what

Two agents, one machine, deliberately independent so neither is asked to be believed.

- **GPT drives the GUI on the Dell.** It clicks the actual buttons in the actual Welcome
  app, as an advisor would, and records the wall-clock time of every click.
- **Claude watches headless over SSH.** Journal, the apply path's JSONL log, config files,
  D-Bus, process state. Claude does not touch the GUI.

The Dell is the rig *because* it is slow: worst-case load times, and timing assumptions
that pass on fast hardware fail visibly there.

## The sequence

Four transitions, in this order, with a full evidence capture after each:

1. Breeze Dark → **Windows Dark**
2. Windows Dark → **Breeze Dark**
3. Breeze Dark → **Windows Dark** (second time)
4. Windows Dark → **Breeze Dark** (second time)

Then, separately, a sign-out and sign-in to test the splash, which cannot be verified
in-session.

## What must be true after EVERY transition

Read back, not observed by eye alone. Each of these must be capable of failing:

| # | Assertion | How it is proven |
|---|---|---|
| 1 | The look-and-feel actually selected | `kreadconfig6 --file kdeglobals --group KDE --key LookAndFeelPackage` |
| 2 | Icon theme changed | `kreadconfig6 --file kdeglobals --group Icons --key Theme`, and a visible icon check |
| 3 | Decoration **loaded**, not merely requested | `qdbus-qt6 org.kde.KWin /KWin org.kde.KWin.supportInformation` reports the expected plugin AND theme. Reading `kwinrc` proves only that we wrote the request. |
| 4 | Widget style | `kreadconfig6 --file kdeglobals --group KDE --key widgetStyle` |
| 5 | Plasma desktop theme | `kreadconfig6 --file plasmarc --group Theme --key name` |
| 6 | Wallpaper | containment config read-back plus a screenshot |
| 7 | Panel layout | `qdbus-qt6 org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.dumpCurrentLayoutJS` contains the expected applets in order |
| 8 | The five taskbar pins present, in order | from the same layout dump |
| 9 | Kickoff menu favourites still present | favourites read-back; ORDER is not asserted (not reliably preserved) |
| 10 | No config file truncated to zero bytes | size + sha256 of the seven snapshot files; `kcminputrc` especially, which `--resetLayout` has truncated before |
| 11 | The apply path's own verdict says success | its JSONL verdict line, with every expected-vs-actual pair matching |

## What must be true across the WHOLE run — the round-trip-specific checks

These are the failures a single apply cannot reveal:

- **Transition 3 produces the same state as transition 1.** Diff the full read-back set.
  Any drift is a state leak and is a failure even if the desktop looks right.
- **Transition 4 produces the same state as transition 2.** Same test in the other direction.
- **Snapshots do not accumulate without bound** in `~/.local/state/spplus/`.
- **No orphaned panels or duplicate applets** after four layout resets — a duplicated
  system tray or a second panel is the classic symptom.
- **Nothing in the journal indicates a crash or restart of plasmashell or kwin** that the
  apply path did not itself request and log.
- **Timings are recorded** for each transition. They are the honest worst-case numbers for
  what an advisor experiences, and a transition that gets slower each time is a leak.

## Correlation

Every click GPT makes must line up with a correlation id in the JSONL log: click receipt,
each write and its return code, each read-back with expected vs actual, the verdict. If a
click produced no correlated backend activity, that is a finding, not a hiccup.

## Failure handling

A failed assertion is not retried until it passes. It is captured — the JSONL segment, the
journal window, the config file states — and reported with what was expected. Where the
apply path detects its own failure it must restore the snapshot; that restore is itself
verified against assertions 1-10 before anything else is attempted.

## Explicitly NOT asserted, and why

- **Kickoff favourite ORDER.** It lives in `kactivitymanagerd-statsrc` under a group whose
  name embeds the applet instance id, which changes when the applet is recreated. Membership
  is asserted; order is not. See `PINNED-APPS-AND-FAVOURITES-RESTORE.md`.
- **Lock screen and OSD.** Inert on Plasma 6 from a look-and-feel package. Asserting them
  would be asserting a thing the OS ignores.
- **Already-open applications restyling.** Kvantum and constructed QStyles do not restyle in
  place. The preview copy says so; the test does not pretend otherwise.
