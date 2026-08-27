# SP+ Calm — KDE Plasma 6 research and implementation record

## Scope boundary

This is a theme-only lane. It does **not** edit `images/kde/Containerfile`, invoke an ISO
build, touch QEMU state, or modify the existing `theme/` Windows Modern bundle. The new
candidate lives under `theme/sp-plus-calm/` so the active ISO development can continue
without a merge conflict.

## Research pass

A read-only research subagent inspected the exact local target image (`quay.io/fedora/
fedora-kinoite:44`, Plasma 6.7.4 / KF6 6.29) and the existing SP+ theme. It could not
obtain web permissions in its non-interactive session, so it marked web claims as
unverified rather than inventing them. The parent then checked the official KDE and Fedora
references below using web search and used the subagent's on-disk findings as the
implementation authority for this target.

Primary references:

- <https://develop.kde.org/docs/plasma/theme/theme-details/>
- <https://develop.kde.org/docs/plasma/theme/theme-porting-to-plasma6/>
- <https://develop.kde.org/docs/plasma/wallpapers/>
- <https://develop.kde.org/docs/plasma/scripting/>
- <https://docs.kde.org/stable_kf6/en/plasma-workspace/kcontrol/lookandfeel/index.html>
- <https://invent.kde.org/plasma/plasma-workspace>
- <https://github.com/KDE/plasma-workspace-wallpapers/tree/master/Next>
- <https://packages.fedoraproject.org/pkgs/paper-icon-theme/paper-icon-theme/>
- <https://packages.fedoraproject.org/pkgs/jetbrains-mono-fonts/jetbrains-mono-fonts/fedora-44.html>
- <https://www.debugpoint.com/best-kde-themes/>

## Decisions from the research

1. Plasma 6 look-and-feel packages require `metadata.json` with
   `KPackageStructure=Plasma/LookAndFeel`; `contents/defaults` is the KConfig-style
   source of defaults. Plasma 5-only `metadata.desktop` is not a sufficient contract.
2. Plasma 6 desktop themes require `metadata.json` and `X-Plasma-API: 5.0`; the palette
   belongs in `colors`, and transparency behavior belongs in a sibling `plasmarc`.
3. The active KWin config group remains `[org.kde.kdecoration2]` even though the runtime
   plugin is KDecoration3. Aurorae names use
   `__aurorae__svg__<theme-directory>`.
4. A wallpaper is a real package under `/usr/share/wallpapers/<Id>/` with
   `metadata.json` and `contents/images/`. The defaults reference its Id (`SPPlus-Calm`),
   not an absolute file path. The candidate includes a literal `7680x4320` 8K UHD PNG.
5. The old custom lockscreen QML was deliberately not carried forward. Plasma 6 greeter
   APIs are version-gated and failure falls back silently; native Plasma is safer until a
   VM gate proves a custom locker against the shipped version.
6. Paper's dark icon theme is `Paper-Mono-Dark`, supplied by Fedora's
   `paper-icon-theme`. JetBrains Mono is supplied by `jetbrains-mono-fonts`; no font
   binary is vendored into the theme.
7. Native Breeze remains the Qt widget style. This avoids a fragile third-party QStyle
   dependency while KDE palettes, Aurorae, Plasma styling, GTK bridge settings, fonts,
   icons, wallpaper, and panel layout remain coherent.
8. All colors files include the Plasma 6 `Header` and `Header][Inactive` sections. The
   previous bundle omitted them, which could leave Kirigami headers on fallback colors.

## Candidate contents

- `sp-plus-calm/look-and-feel/` — light and dark selectable Global Themes.
- `sp-plus-calm/desktoptheme/` — light and dark Plasma 6 styles with safe Breeze SVG
  fallback and complete color sections.
- `sp-plus-calm/aurorae/` — original SVG window decoration controls with a restrained
  Mars-coral active edge and dark/light states.
- `sp-plus-calm/color-schemes/` — near-black dark palette and graphite light palette.
- `sp-plus-calm/wallpapers/SPPlus-Calm/` — logo-only 8K wallpaper package generated from
  the supplied SP+ logo; no scenery or third-party artwork.
- `sp-plus-calm/system-defaults/` — thin KDE bootstrap and GTK 3/4 bridge examples,
  including JetBrains Mono and Paper-Mono-Dark.
- `tools/generate-spplus-calm-theme.py` — deterministic text/SVG generator.
- `tools/generate-spplus-calm-wallpaper.sh` — deterministic ImageMagick wallpaper
  generator.
- `tools/validate-spplus-calm.sh` — static gate for metadata IDs, package references,
  required palette sections, XML/SVG validity, naming hygiene, wallpaper dimensions, and
  Aurorae completeness.

## Deferred image integration

The ISO owner can integrate this bundle later by following `sp-plus-calm/INSTALL-MANIFEST.md`.
That future change must install `paper-icon-theme` and `jetbrains-mono-fonts`, copy the
bundle to the listed `/usr/share` destinations, decide how the thin GTK bridge is
installed, then run the static gate in the image build. Only after that should VM gates
apply both Global Themes, open Dolphin/System Settings/Brave together, verify KWin
Aurorae, lock/unlock, inspect a 2x output, and confirm no Plasma shell journal fallback.
