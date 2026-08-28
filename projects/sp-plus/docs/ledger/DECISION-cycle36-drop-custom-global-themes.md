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

## Status

Nothing removed yet. Awaiting Christopher's list of themes to ship.
