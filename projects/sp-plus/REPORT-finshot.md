# SP+ Fin staging report

Date: 2026-08-31
Branch: `session/sp-plus-plan`

## Result

Implemented the Fin staging path in `tests/capture_receipts.sh`. The capture harness now
launches Fin for each of the eight theme receipts, waits for rendered welcoming content,
places it through KWin scripting, captures only a valid composition, and closes it through
`close_clutter` before the next theme.

The Dell capture was not run, as required. No receipts or hashes were produced by this
implementation pass.

## Diff

Changed files:

- `tests/capture_receipts.sh`
  - Uses a private Kitty Unix socket for this run while preserving the required launch:
    `kitty --class fin --title Fin -e /usr/libexec/sp-plus/fin`.
  - Polls Kitty's window list for the titled Fin window, then polls
    `kitten @ get-text --extent screen` for the actual visible screen buffer.
  - Requires both the ichthys marker `><>` and the exact greeting
    `Fin, your SP+ assistant`; a startup error marker, early Kitty exit, or timeout fails
    the receipt and removes its image.
  - Checks the welcoming content again after KWin moves/resizes Fin.
  - Loads, runs, and unloads the one-shot KWin placement script over the scripting D-Bus
    interface.
  - Extends `close_clutter` and the EXIT trap to remove Fin without killing unrelated
    Kitty terminals.
  - Keeps theme-apply failures and screenshot failures receipt-free, and reports aggregate
    failure status across all eight themes.
- `tests/fin-placement.js`
  - Finds the normal Fin window by its Kitty identity/title.
  - Clears maximization and sets a fixed 560x580 right-hand rail with a 16px edge margin,
    using the panel-aware `KWin.MaximizeArea` and a deterministic centered vertical
    position. The geometry does not depend on the selected theme.

## Checks completed

```text
bash -n projects/sp-plus/tests/capture_receipts.sh       PASS
shellcheck -x projects/sp-plus/tests/capture_receipts.sh PASS
node --check projects/sp-plus/tests/fin-placement.js     PASS
git diff --check                                      PASS
```

## Readiness reasoning

A process existing or a fixed delay is not treated as readiness. Each poll first requires
Kitty to report a window titled `Fin`, then reads that window's rendered current screen
buffer. `--extent screen` deliberately excludes scrollback, so a banner that has scrolled
off screen cannot pass. The receipt proceeds only when the current screen contains both the
banner marker and exact greeting. The same test runs after placement because resizing can
change terminal rows.

## Unproven until the Dell run

1. The test46 Dell image currently has the expected Plasma session, `qdbus-qt6`, Kitty
   socket control, Pi/Fin installation, and KWin scripting D-Bus service available.
2. The live target accepts the KWin `loadScript`/`run`/`unloadScript` calls and applies the
   `frameGeometry` write at the expected panel-aware coordinates. The helper has syntax-only
   validation here, not live KWin execution.
3. Fin's actual Kitty screen on the Dell contains the banner and greeting in the final
   resized window, without a bare prompt or error state. The provider note also remains a
   visual live-run check.
4. The fixed rail is visually beside, rather than covering, Dolphin and the open Kickoff
   menu at the Dell's current resolution, panel geometry, and window-decoration sizes.
5. All eight theme applications succeed and produce eight valid full-screen PNG receipts with
   the required comparable composition and any expected hashes/report output.
