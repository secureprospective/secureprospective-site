# DN-28 — cycle36 ships stock global themes; SP+ Calm is withdrawn

Date: 2026-08-28
Decided by: Christopher

## The decision

The custom SP+ global themes are **removed from the next build**. SP+ will lean on
existing, upstream-maintained Plasma global themes instead. Christopher will supply
the list of themes to ship; each is then pulled complete rather than partially
reimplemented.

**The SP+ wallpapers stay.** They are not part of this removal.

## Why

Two sessions of custom look-and-feel work produced a theme that failed to apply at
all in cycle35 (the `aurorae.v2` defect) and an accent/contrast pass that never
converged. A maintained upstream theme is the better trade under the standing rule
that anything shipping in SP+ must be actively maintained: a stock theme is fixed
by its maintainers across Plasma upgrades, whereas our Aurorae SVG set is ours to
repair every time KWin's decoration API moves — which is precisely what bit us.

## Consequences to handle in cycle36

1. `Containerfile:734-737` — drop the four `sp-plus-calm` COPY lines for
   look-and-feel, desktoptheme, color-schemes and aurorae.
2. `Containerfile:738` — **KEEP**. This is the wallpaper COPY
   (`SPPlus-Calm/ -> /usr/share/wallpapers/SPPlus-Calm/`) and wallpapers stay.
   The source directory `theme/sp-plus-calm/wallpapers/` must therefore survive
   even though the rest of that tree stops shipping.
3. `Containerfile:785-786` — the `/etc/xdg/kwinrc` defaults naming
   `spplus-calm-dark` must point at whatever the new default theme uses, or be
   dropped if the stock theme sets its own decoration.
4. `Containerfile:799-811` — the `CALM_DEFAULT_OK` gate asserts the Calm packages
   exist. It must be rewritten against the new theme list, not deleted: a build
   with no theme gate is how DN-24 happened in the first place.
5. `config/spplus-first-login` — `LNF=`, the `ColorScheme` check and the
   `theme=__aurorae__svg__spplus-calm-dark` check all name Calm. All must move to
   the new default. `WALLPAPER=/usr/share/wallpapers/SPPlus-Calm` **stays**.
6. **The panel layout is inside the Calm package** at
   `look-and-feel/org.secureprospective.spplus.calm.dark/contents/layouts/org.kde.plasma.desktop-layout.js`.
   Removing Calm removes the SP+ panel arrangement with it. The layout must be
   preserved by another route, or we inherit the stock theme's panel.
7. `theme/tools/validate-spplus-calm.sh` and the cycle36 source gate reference the
   Calm tree and will fail once it is gone.

## Not decided yet

- Whether the SP+ **Windows 11** look-and-feel set (`Containerfile:682-685`, a
  separate tree from `sp-plus-calm`) is also withdrawn, or is one of the themes
  that stays. Christopher's list settles this.
- Whether the SP+ Calm **colour schemes** survive as selectable schemes even though
  the global theme goes.

## The shipped set (Christopher's list, 2026-08-28)

Fedora and Breeze defaults are kept. SP+ Welcome leads with the Windows themes,
then offers three dark and three light chosen for productivity.

| # | Welcome order | Look-and-feel id | Source |
|---|---|---|---|
| 1 | Windows Light | `org.secureprospective.spplus.windows11.light` | SP+ |
| 2 | Windows Dark (default) | `org.secureprospective.spplus.windows11.dark` | SP+ |
| 3 | Breeze Dark | `org.kde.breezedark.desktop` | stock Plasma |
| 4 | Nordic Dark | `Nordic` | vendored |
| 5 | Catppuccin Mocha | `Catppuccin-Mocha` | vendored |
| 6 | Breeze Light | `org.kde.breeze.desktop` | stock Plasma |
| 7 | Orchis Light | `com.github.vinceliuice.Orchis` | vendored |
| 8 | Catppuccin Latte | `Catppuccin-Latte` | vendored |

## The partial-switch defect: root cause

Reported as "it's just changing the colors and not the window decorations,
backgrounds, fonts, and icon themes". Reproduced and measured in the cycle35
guest.

The Welcome picker was not applying anything at all: `welcome.py` had no bridge
of any kind, and the theme cards only set CSS classes.

The deeper cause is in Plasma itself. `plasma-apply-lookandfeel -a` applies the
colour scheme and leaves every other component to the running session. The
control experiment settles it: stock Breeze Dark, whose `defaults` file is
complete and correctly formatted, writes exactly the same partial result. So the
package format was never at fault.

`config/spplus-apply-theme` closes it by reading the chosen package's own
`defaults` and writing every declared key, then notifying each component. Plasma
runs FIRST, because `-a` resets user config keys and silently discarded writes
made before it.

## Status: DONE, pending the cycle36 build

Verified in the cycle35 guest on 2026-08-28:

- All 8 themes apply all 8 components, driven through the real Welcome app.
- `validate-global-themes.py --root <repo staging>`: **themes=8/8 errors=0**.
- All 7 Welcome screens fit 1366x768 with no overflow.
- Host-side `virsh screenshot` confirms live rendering, including the decoration
  change that never used to happen (Catppuccin's round buttons vs Windows'
  square ones).

Nothing has been built. The build is the only unproven step.
