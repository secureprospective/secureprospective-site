# Welcome theme-preview capture contract

The image in each theme confirmation card is a verification receipt, not an illustration. The eight files below must be captured from the same freshly booted Plasma session used for the theme round-trip test:

- `app/assets/theme-previews/windows-light.png`
- `app/assets/theme-previews/windows-dark.png`
- `app/assets/theme-previews/breeze-light.png`
- `app/assets/theme-previews/breeze-dark.png`
- `app/assets/theme-previews/nordic-dark.png`
- `app/assets/theme-previews/orchis-light.png`
- `app/assets/theme-previews/catppuccin-latte.png`
- `app/assets/theme-previews/catppuccin-mocha.png`

A valid capture must show the applied session at the Welcome preview size or larger, including the full stock panel, Kickoff, task icons, tray, clock, show-desktop affordance, window decoration, wallpaper, and at least one open native application. It must be taken only after the corresponding apply helper emitted a success verdict with exact config readback and, for Modern, an ordered `dumpCurrentLayoutJS` match.

The capture set must be produced on the Dell or an equivalent graphical Plasma 6.7 target. Do not manufacture a desktop image from swatches, an upstream screenshot, a package screenshot, or a different panel layout. The capture procedure must apply both Windows variants and every other offered theme, collect the helper JSONL correlation IDs, verify the files and hashes, then copy the resulting PNGs into this directory. The existing `--captures` Welcome mode is an HTML-rendering QC path, not this desktop-capture harness.

Until all eight files exist, the source/build gate must fail and Welcome must keep APPLY disabled for a missing receipt.

## Who composes the shot (added 2026-08-31)

The eight preview images are composed BY CHRISTOPHER, not by a script. On 2026-08-31 an
automated capture that placed Fin and the file manager by KWin scripting was rejected on
sight: a script can put a window at fixed coordinates, but it cannot judge whether the
result looks good, and these images are the advisor's first impression of the product.

The working division is that the theme is applied and the machine prepared programmatically,
Christopher arranges the windows, and the shot is then captured, named and verified
programmatically. The composition itself is his.

Frame: the file manager and Fin over the theme's wallpaper. Fin must be at its ichthys banner
and greeting -- never a bare prompt -- so the assistant reads as part of the desktop rather
than as a terminal. The Welcome app must not appear; it looks the same under every theme.
The home folder must show only the advisor's ordinary folders, with no development files in
view.
