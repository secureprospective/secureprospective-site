# SP+ Calm theme bundle

This directory is a **theme-only lane**. It intentionally does not edit or invoke the
SP+ ISO build. The eventual image integration should copy the directories below to the
matching system locations, then run the semantic gate in `../tools/validate-spplus-calm.sh`.

| Bundle path | Destination |
|---|---|
| `look-and-feel/*` | `/usr/share/plasma/look-and-feel/` |
| `desktoptheme/*` | `/usr/share/plasma/desktoptheme/` |
| `color-schemes/*.colors` | `/usr/share/color-schemes/` |
| `aurorae/*` | `/usr/share/aurorae/themes/` |
| `wallpapers/SPPlus-Calm` | `/usr/share/wallpapers/SPPlus-Calm/` |
| `system-defaults/*` | image integration chooses `/etc/xdg` and GTK bridge locations |

## Runtime dependencies

- `paper-icon-theme` — provides `Paper-Mono-Dark`
- `jetbrains-mono-fonts` — provides the `JetBrains Mono` family
- Plasma 6 / KF6 KPackage
- native Breeze Qt style (deliberate fallback; no fragile third-party widget fork)

The bundle uses `metadata.json` and Plasma 6 package IDs. It does not ship a custom
lock-screen QML or forked applets: both are update-sensitive and are intentionally left
to the installed Plasma version.
