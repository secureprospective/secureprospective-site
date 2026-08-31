# Stock Breeze light/dark and the SP+ global policy layer

ID: `theme-breeze`

Audit date: 2026-08-30. Scope: the Fedora image `localhost/sp-plus-kde:test44`,
stock Plasma 6.7.4 look-and-feel packages `org.kde.breeze.desktop` and
`org.kde.breezedark.desktop`, and the SP+ apply/first-login/system-default paths
that act on them. No image build, source edit, commit, or live guest session was
performed for this audit.

## Evidence convention

Repo citations are `repo-relative-path:Lx-Ly`. `U` citations are pinned upstream
KDE source URLs at tag `v6.7.4`; the tag's `plasma-workspace` object was checked
through the GitHub ref API and returned commit
`b182baa7f6f02b40a25116df0a4a1d9209bffa66`. `E` citations are exact commands and
outputs from the existing image or this repository.

The ref check was:

```text
$ curl -fsSL https://api.github.com/repos/KDE/plasma-workspace/git/ref/tags/v6.7.4 | python3 -c 'import json,sys; print(json.load(sys.stdin)["object"]["sha"])'
b182baa7f6f02b40a25116df0a4a1d9209bffa66
```

The image has no running graphical Plasma session in the audit environment. A
runtime claim not established by source or an image command is marked `UNKNOWN`.
This boundary is also recorded in `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L1-L3`.

### Pinned upstream references

| ID | Pinned source |
|---|---|
| `U2` | `https://github.com/KDE/plasma-workspace/blob/v6.7.4/lookandfeel/org.kde.breeze/contents/defaults`; light metadata is the adjacent `metadata.json`. |
| `U3` | `https://github.com/KDE/plasma-workspace/blob/v6.7.4/lookandfeel/org.kde.breezedark/contents/defaults`; dark metadata is the adjacent `metadata.json`. |
| `U4` | `https://github.com/KDE/plasma-desktop/blob/v6.7.4/layout-templates/org.kde.plasma.desktop.defaultPanel/contents/layout.js`. |
| `U5` | `https://github.com/KDE/plasma-workspace/blob/v6.7.4/shell/shellcorona.cpp`. |
| `U6` | `https://github.com/KDE/plasma-workspace/blob/v6.7.4/kcms/lookandfeel/tool/lnftool.cpp`. |
| `U7` | `https://github.com/KDE/plasma-workspace/blob/v6.7.4/libklookandfeel/klookandfeelmanager.cpp`. |
| `U8` | `U4`, cited for the complete panel-template line range. |
| `U9` | `https://github.com/KDE/plasma-workspace/blob/v6.7.4/shell/dbus/org.kde.PlasmaShell.xml`. |

### Evidence extracts

**E1. Image packages and ownership**

```text
plasma-workspace-6.7.4-1.fc44.x86_64
plasma-desktop-6.7.4-1.fc44.x86_64
plasma-workspace-libs-6.7.4-1.fc44.x86_64
plasma-breeze-common-6.7.4-2.fc44.noarch
breeze-icon-theme-6.29.0-1.fc44.noarch
breeze-cursor-theme-6.7.4-2.fc44.noarch
plasma-breeze-qt6-6.7.4-2.fc44.x86_64
plasma-breeze-6.7.4-2.fc44.x86_64
libplasma-6.7.4-1.fc44.x86_64
/usr/share/plasma/look-and-feel/org.kde.breeze.desktop/contents/defaults <- plasma-workspace-6.7.4-1.fc44.x86_64
/usr/share/plasma/look-and-feel/org.kde.breezedark.desktop/contents/defaults <- plasma-workspace-6.7.4-1.fc44.x86_64
/usr/share/plasma/look-and-feel/org.kde.breeze.desktop/contents/layouts/org.kde.plasma.desktop-layout.js <- plasma-workspace-6.7.4-1.fc44.x86_64
/usr/share/plasma/look-and-feel/org.kde.breezedark.desktop/contents/layouts/org.kde.plasma.desktop-layout.js <- plasma-workspace-6.7.4-1.fc44.x86_64
/usr/share/color-schemes/BreezeLight.colors <- plasma-breeze-common-6.7.4-2.fc44.noarch
/usr/share/color-schemes/BreezeDark.colors <- plasma-breeze-common-6.7.4-2.fc44.noarch
/usr/share/icons/breeze/index.theme <- breeze-icon-theme-6.29.0-1.fc44.noarch
/usr/share/icons/breeze-dark/index.theme <- breeze-icon-theme-6.29.0-1.fc44.noarch
/usr/share/icons/breeze_cursors/cursors/left_ptr <- breeze-cursor-theme-6.7.4-2.fc44.noarch
/usr/share/wallpapers/Next/metadata.json <- plasma-breeze-common-6.7.4-2.fc44.noarch
/usr/share/plasma/desktoptheme/default <- libplasma-6.7.4-1.fc44.x86_64
/usr/share/plasma/layout-templates/org.kde.plasma.desktop.defaultPanel/metadata.json <- plasma-desktop-6.7.4-1.fc44.x86_64
/usr/share/plasma/layout-templates/org.kde.plasma.desktop.defaultPanel/contents/layout.js <- plasma-desktop-6.7.4-1.fc44.x86_64
/usr/lib64/qt6/plugins/styles/breeze6.so <- plasma-breeze-qt6-6.7.4-2.fc44.x86_64
/usr/lib64/qt6/plugins/org.kde.kdecoration3/org.kde.breeze.so <- plasma-breeze-6.7.4-2.fc44.x86_64
/usr/lib64/qt6/qml/org/kde/plasma/wallpapers/image/libplasma_wallpaper_image.so <- plasma-workspace-6.7.4-1.fc44.x86_64
```

**E2. Installed package file inventories**

```text
[org.kde.breeze.desktop]
contents/defaults
contents/layouts/org.kde.plasma.desktop-layout.js
contents/logout/Logout.qml
contents/logout/LogoutButton.qml
contents/logout/timer.js
contents/previews/fullscreenpreview.jpg
contents/previews/lockscreen.png
contents/previews/preview.png
contents/previews/splash.png
contents/splash/Splash.qml
metadata.json
[org.kde.breezedark.desktop]
contents/defaults
contents/layouts/org.kde.plasma.desktop-layout.js
contents/previews/fullscreenpreview.jpg
contents/previews/preview.png
metadata.json
```

**E3. Pinned source comparison**

An equivalent reproducible comparison command is:

```sh
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
podman run --rm localhost/sp-plus-kde:test44 cat /usr/share/plasma/look-and-feel/org.kde.breeze.desktop/contents/defaults >"$tmp/image"
curl -fsSL https://raw.githubusercontent.com/KDE/plasma-workspace/v6.7.4/lookandfeel/org.kde.breeze/contents/defaults >"$tmp/upstream"
diff -u "$tmp/upstream" "$tmp/image" >/dev/null && printf 'MATCH org.kde.breeze contents/defaults\n'
podman run --rm localhost/sp-plus-kde:test44 cat /usr/share/plasma/look-and-feel/org.kde.breeze.desktop/contents/layouts/org.kde.plasma.desktop-layout.js >"$tmp/image"
curl -fsSL https://raw.githubusercontent.com/KDE/plasma-workspace/v6.7.4/lookandfeel/org.kde.breeze/contents/layouts/org.kde.plasma.desktop-layout.js >"$tmp/upstream"
diff -u "$tmp/upstream" "$tmp/image" >/dev/null && printf 'MATCH org.kde.breeze contents/layouts/org.kde.plasma.desktop-layout.js\n'
podman run --rm localhost/sp-plus-kde:test44 cat /usr/share/plasma/look-and-feel/org.kde.breezedark.desktop/contents/defaults >"$tmp/image"
curl -fsSL https://raw.githubusercontent.com/KDE/plasma-workspace/v6.7.4/lookandfeel/org.kde.breezedark/contents/defaults >"$tmp/upstream"
diff -u "$tmp/upstream" "$tmp/image" >/dev/null && printf 'MATCH org.kde.breezedark contents/defaults\n'
podman run --rm localhost/sp-plus-kde:test44 cat /usr/share/plasma/look-and-feel/org.kde.breezedark.desktop/contents/layouts/org.kde.plasma.desktop-layout.js >"$tmp/image"
curl -fsSL https://raw.githubusercontent.com/KDE/plasma-workspace/v6.7.4/lookandfeel/org.kde.breezedark/contents/layouts/org.kde.plasma.desktop-layout.js >"$tmp/upstream"
diff -u "$tmp/upstream" "$tmp/image" >/dev/null && printf 'MATCH org.kde.breezedark contents/layouts/org.kde.plasma.desktop-layout.js\n'
```

Its exact output was:

```text
MATCH org.kde.breeze contents/defaults
MATCH org.kde.breeze contents/layouts/org.kde.plasma.desktop-layout.js
MATCH org.kde.breezedark contents/defaults
MATCH org.kde.breezedark contents/layouts/org.kde.plasma.desktop-layout.js
```

**E4. Vendored-tree and package-local license checks**

```text
-- theme/vendor look-and-feel dirs --
Catppuccin-Latte
Catppuccin-Mocha
com.github.vinceliuice.Orchis
Nordic
-- any Breeze under vendor --
```

The installed-package license-file search returned no output for either stock
look-and-feel directory. The package metadata declares `GPLv2+` for each stock
look-and-feel, while the complete RPM reports this mixed license expression:

```text
plasma-workspace License=BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND LGPL-3.0-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT
```

See section 1 and `U2` for the stock package metadata.

**E5. Isolated D-Bus probes**

```text
-- qdbus KGlobalSettings method attempt --
Cannot find 'org.kde.KGlobalSettings.notifyChange' in object /KGlobalSettings at org.kde.KGlobalSettings
rc=1
-- qdbus KWin reconfigure attempt --
Service 'org.kde.KWin' does not exist.
rc=2
-- gdbus signal emission attempt --
rc=0
```

The probes ran inside `dbus-run-session`; the absence of a running KWin service is
not treated as a live-session result.

**E6. Stock layout applet ownership**

```text
org.kde.plasma.kickoff -> /usr/lib64/qt6/plugins/plasma/applets/org.kde.plasma.kickoff.so: plasma-desktop-6.7.4-1.fc44.x86_64
org.kde.plasma.pager -> /usr/lib64/qt6/plugins/plasma/applets/org.kde.plasma.pager.so: plasma-desktop-6.7.4-1.fc44.x86_64
org.kde.plasma.icontasks -> /usr/lib64/qt6/plugins/plasma/applets/org.kde.plasma.taskmanager.so: plasma-desktop-6.7.4-1.fc44.x86_64
org.kde.plasma.panelspacer -> /usr/lib64/qt6/plugins/plasma/applets/org.kde.plasma.panelspacer.so: plasma-workspace-libs-6.7.4-1.fc44.x86_64
org.kde.plasma.marginsseparator -> /usr/lib64/qt6/plugins/plasma/applets/org.kde.plasma.marginsseparator.so: plasma-workspace-libs-6.7.4-1.fc44.x86_64
org.kde.plasma.kimpanel -> /usr/lib64/qt6/plugins/plasma/applets/org.kde.plasma.kimpanel.so: plasma-desktop-6.7.4-1.fc44.x86_64
org.kde.plasma.systemtray -> /usr/lib64/qt6/plugins/plasma/applets/org.kde.plasma.systemtray.so: plasma-workspace-libs-6.7.4-1.fc44.x86_64
org.kde.plasma.digitalclock -> /usr/lib64/qt6/plugins/plasma/applets/org.kde.plasma.digitalclock.so: plasma-workspace-libs-6.7.4-1.fc44.x86_64
org.kde.plasma.showdesktop -> /usr/lib64/qt6/plugins/plasma/applets/org.kde.plasma.showdesktop.so: plasma-desktop-6.7.4-1.fc44.x86_64
```

**E7. Stock QML import inventory**

```text
[/usr/share/plasma/look-and-feel/org.kde.breeze.desktop/contents/splash/Splash.qml]
7:import QtQuick
8:import org.kde.kirigami as Kirigami
[/usr/share/plasma/look-and-feel/org.kde.breeze.desktop/contents/logout/Logout.qml]
7:import QtQuick
8:import QtQuick.Layouts
9:import QtQuick.Controls as QQC2
11:import org.kde.plasma.components as PlasmaComponents
12:import org.kde.coreaddons as KCoreAddons
13:import org.kde.kirigami as Kirigami
15:import org.kde.breeze.components
18:import org.kde.plasma.private.sessions
[/usr/share/plasma/look-and-feel/org.kde.breeze.desktop/contents/logout/LogoutButton.qml]
7:import QtQuick
8:import QtQuick.Layouts
10:import org.kde.kirigami as Kirigami
12:import org.kde.breeze.components
```

**E8. Supporting package query**

```text
google-noto-sans-fonts-20251201-2.fc44.noarch
kvantum-1.1.6-1.fc44.x86_64
papirus-icon-theme-20250501-2.fc44.noarch
papirus-icon-theme-dark-20250501-2.fc44.noarch
```

**E9. Qt6 QML module ownership**

```text
/usr/lib64/qt6/qml/org/kde/kirigami <- kf6-kirigami-6.29.0-1.fc44.x86_64
/usr/lib64/qt6/qml/org/kde/coreaddons/qmldir <- kf6-kcoreaddons-6.29.0-1.fc44.x86_64
/usr/lib64/qt6/qml/org/kde/breeze/qmldir <- qqc2-breeze-style-6.7.4-1.fc44.x86_64
/usr/lib64/qt6/qml/org/kde/plasma/components/qmldir <- libplasma-6.7.4-1.fc44.x86_64
/usr/lib64/qt6/qml/org/kde/plasma/private/sessions <- plasma-workspace-6.7.4-1.fc44.x86_64
```

## 1. Provenance

| Package | Upstream URL and pin | Local identity | License file / metadata | Tree comparison |
|---|---|---|---|---|
| `org.kde.breeze.desktop` | `https://github.com/KDE/plasma-workspace/tree/v6.7.4/lookandfeel/org.kde.breeze`; tag object `b182baa7f6f02b40a25116df0a4a1d9209bffa66` | Installed at `/usr/share/plasma/look-and-feel/org.kde.breeze.desktop`; owned by `plasma-workspace-6.7.4-1.fc44` (E1) | No package-local `COPYING`, `LICENSE`, or `NOTICE` file was found (E4). Pinned `metadata.json` declares `KPackageStructure=Plasma/LookAndFeel`, `KPlugin.Id=org.kde.breeze.desktop`, and `License=GPLv2+` (`U2`, lines 1-3, 111-112). | `contents/defaults` and `contents/layouts/org.kde.plasma.desktop-layout.js` match the pinned files byte-for-byte (E3). Full installed-tree equivalence is **UNKNOWN —** previews, QML, metadata, and package-generated files were not all compared. |
| `org.kde.breezedark.desktop` | `https://github.com/KDE/plasma-workspace/tree/v6.7.4/lookandfeel/org.kde.breezedark`; same tag/object | Installed at `/usr/share/plasma/look-and-feel/org.kde.breezedark.desktop`; owned by `plasma-workspace-6.7.4-1.fc44` (E1) | No package-local license file was found (E4). Pinned `metadata.json` declares `KPackageStructure=Plasma/LookAndFeel`, `KPlugin.Id=org.kde.breezedark.desktop`, and `License=GPLv2+` (`U3`, lines 1-3, 111-112). | `contents/defaults` and `contents/layouts/org.kde.plasma.desktop-layout.js` match the pinned files byte-for-byte (E3). Full installed-tree equivalence is **UNKNOWN —** for the same un-compared files. |

The stock Breeze packages are not in `theme/vendor`. The repository provenance table
lists Catppuccin, Orchis, and Nordic only (`theme/vendor/PROVENANCE.md:L6-L10`), and
the exact vendor directory search found no Breeze directory (E4). `theme/vendor/PROVENANCE.md`
itself is repository documentation, not a runtime asset; the Containerfile copies
only the vendor subtrees listed at `images/kde/Containerfile:L1013-L1017`.

## 2. Shipped assets

Stock Breeze is installed by the Fedora package transaction, not copied from a
repository theme directory. The Containerfile installs `plasma-workspace` at
`images/kde/Containerfile:L38-L58`; it has no `COPY` of a stock Breeze
look-and-feel directory. The installed paths and RPM owners are E1.

| Theme contribution | Image path | How it gets there | Evidence |
|---|---|---|---|
| Light look-and-feel package | `/usr/share/plasma/look-and-feel/org.kde.breeze.desktop/` | Fedora `plasma-workspace` package | E1, E2; `images/kde/Containerfile:L57-L58` |
| Dark look-and-feel package | `/usr/share/plasma/look-and-feel/org.kde.breezedark.desktop/` | Fedora `plasma-workspace` package | E1, E2; `images/kde/Containerfile:L57-L58` |
| Light color scheme | `/usr/share/color-schemes/BreezeLight.colors` | Fedora `plasma-breeze-common` package | E1 |
| Dark color scheme | `/usr/share/color-schemes/BreezeDark.colors` | Fedora `plasma-breeze-common` package | E1 |
| Light/dark icon themes | `/usr/share/icons/breeze/`, `/usr/share/icons/breeze-dark/` | Fedora `breeze-icon-theme` package | E1 |
| Cursor theme | `/usr/share/icons/breeze_cursors/` | Fedora `breeze-cursor-theme` package | E1 |
| `Next` wallpaper package | `/usr/share/wallpapers/Next/` | Fedora `plasma-breeze-common` package | E1 |
| Plasma desktop theme | `/usr/share/plasma/desktoptheme/default/` | Fedora `libplasma` package | E1 |
| Default panel layout template | `/usr/share/plasma/layout-templates/org.kde.plasma.desktop.defaultPanel/` | Fedora `plasma-desktop` package | E1 |
| Qt 6 Breeze style | `/usr/lib64/qt6/plugins/styles/breeze6.so` | Fedora `plasma-breeze-qt6` package | E1 |
| KDecoration3 Breeze plugin | `/usr/lib64/qt6/plugins/org.kde.kdecoration3/org.kde.breeze.so` | Fedora `plasma-breeze` package | E1 |
| Image wallpaper plugin | `/usr/lib64/qt6/qml/org/kde/plasma/wallpapers/image/libplasma_wallpaper_image.so` | Fedora `plasma-workspace` package | E1 |

The complete package subdirectory inventory is E2. The light package has
`contents/logout/` and `contents/splash/`; the dark package does not. Both have
`contents/layouts/`, `contents/previews/`, and `metadata.json`. Neither package
has a separate repository-supplied asset tree for the shared color, icon, cursor,
wallpaper, style, decoration, or panel-template paths.

There is no Breeze directory under the vendored tree, so no Breeze asset is silently
dropped by the vendor `COPY` statements. No full Fedora source-package-to-image
file inventory was performed beyond the listed paths; omitted RPM files are
**UNKNOWN —** a complete `rpm -ql plasma-workspace` versus source-package inventory
would settle that.

## 3. Creator-intended configuration

The table is a literal transcription of the two pinned upstream `contents/defaults`
files. The image copies match those files for this content (E3). `Wallpaper` is a
look-and-feel pseudo-section, not a literal `kdeglobals` group: Plasma's content
scanner recognizes it at `klookandfeelmanager.cpp:L103-L113`, while the SP+ parser
special-cases it at `config/spplus-apply-theme:L63-L65` and `L129-L132`.

| Variant | File:group:key=value | Evidence |
|---|---|---|
| Light | `kdeglobals:KDE:widgetStyle=Breeze` | `U2`, `contents/defaults:L1-L2` |
| Light | `kdeglobals:General:ColorScheme=BreezeLight` | `U2`, `contents/defaults:L4-L5` |
| Light | `kdeglobals:Icons:Theme=breeze` | `U2`, `contents/defaults:L7-L8` |
| Light | `plasmarc:Theme:name=default` | `U2`, `contents/defaults:L10-L11` |
| Light | `kdeglobals:Wallpaper:Image=Next` | `U2`, `contents/defaults:L13-L14`; pseudo-section note above |
| Light | `kcminputrc:Mouse:cursorTheme=breeze_cursors` | `U2`, `contents/defaults:L16-L17` |
| Light | `kwinrc:org.kde.kdecoration2:library=org.kde.breeze` | `U2`, `contents/defaults:L19-L21` |
| Light | `kwinrc:org.kde.kdecoration2:theme=Breeze` | `U2`, `contents/defaults:L19-L21` |
| Light | `ksplashrc:KSplash:Theme=org.kde.breeze.desktop` | `U2`, `contents/defaults:L23-L24` |
| Dark | `kdeglobals:KDE:widgetStyle=Breeze` | `U3`, `contents/defaults:L1-L2` |
| Dark | `kdeglobals:General:ColorScheme=BreezeDark` | `U3`, `contents/defaults:L4-L5` |
| Dark | `kdeglobals:Icons:Theme=breeze-dark` | `U3`, `contents/defaults:L7-L8` |
| Dark | `plasmarc:Theme:name=default` | `U3`, `contents/defaults:L10-L11` |
| Dark | `kdeglobals:Wallpaper:Image=Next` | `U3`, `contents/defaults:L13-L14`; pseudo-section note above |
| Dark | `kcminputrc:Mouse:cursorTheme=breeze_cursors` | `U3`, `contents/defaults:L16-L17` |
| Dark | `kwinrc:org.kde.kdecoration2:library=org.kde.breeze` | `U3`, `contents/defaults:L19-L21` |
| Dark | `kwinrc:org.kde.kdecoration2:theme=Breeze` | `U3`, `contents/defaults:L19-L21` |
| Dark | `ksplashrc:KSplash:Theme=org.kde.breeze.desktop` | `U3`, `contents/defaults:L23-L24` |

Neither stock package declares a font key. The SP+ helper's conditional font block
therefore applies when either stock package is selected; that is recorded as a
policy divergence in section 7, not as a creator declaration.

### Package content surfaces

| Variant | Shipped package path | Declared/runtime role |
|---|---|---|
| Light | `contents/layouts/org.kde.plasma.desktop-layout.js` | Layout script; exact source is `U2`, lines 1-7. |
| Light | `contents/logout/Logout.qml`, `LogoutButton.qml`, `timer.js` | Logout UI QML/JavaScript; no additional INI key/value declaration. Inventory E2. |
| Light | `contents/splash/Splash.qml` | Splash UI QML; no additional INI key/value declaration. Inventory E2. |
| Light | `contents/previews/preview.png`, `fullscreenpreview.jpg`, `lockscreen.png`, `splash.png` | KCM preview assets; not persistent configuration declarations. Inventory E2. |
| Dark | `contents/layouts/org.kde.plasma.desktop-layout.js` | Layout script; exact source is `U3`, lines 1-7. |
| Dark | `contents/previews/preview.png`, `fullscreenpreview.jpg` | KCM preview assets; not persistent configuration declarations. Inventory E2. |

There are no `contents/lockscreen/`, `contents/loginmanager/`, or `contents/osd/`
directories in either installed stock package (E2). The declared asset references all
resolve to installed paths in E1: `BreezeLight.colors`/`BreezeDark.colors`,
`breeze`/`breeze-dark`, `breeze_cursors`, `Next`, `default`, `org.kde.breeze`,
and the stock package IDs. No dangling reference was established. Whether every
asset renders correctly in a live session is **UNKNOWN —** no live rendering test
was available.

## 4. Dependencies

| Dependency or surface | Required by stock declaration/layout | Image presence and packaging | Evidence |
|---|---|---|---|
| Plasma look-and-feel loader/workspace | `Plasma/LookAndFeel` package and `contents/defaults`/layouts | Fedora `plasma-workspace-6.7.4-1.fc44`; installed paths are present | E1; `images/kde/Containerfile:L57-L58`; pinned metadata `U2/U3` |
| Plasma desktop layout engine | `loadTemplate("org.kde.plasma.desktop.defaultPanel")` | Fedora `plasma-desktop-6.7.4-1.fc44`; template is present | E1, E6; `U4`, layout source lines 1-33 |
| `BreezeLight.colors` / `BreezeDark.colors` | `ColorScheme=BreezeLight` or `BreezeDark` | Fedora `plasma-breeze-common-6.7.4-2.fc44.noarch` | E1 |
| `breeze` / `breeze-dark` icons | `[Icons] Theme` | Fedora `breeze-icon-theme-6.29.0-1.fc44.noarch` | E1 |
| `breeze_cursors` | `[Mouse] cursorTheme` | Fedora `breeze-cursor-theme-6.7.4-2.fc44.noarch` | E1 |
| Qt widget style `Breeze` | `[KDE] widgetStyle=Breeze` | Fedora `plasma-breeze-qt6-6.7.4-2.fc44.x86_64`; `breeze6.so` present | E1 |
| KDecoration3 plugin `org.kde.breeze` | `kwinrc` decoration library/theme | Fedora `plasma-breeze-6.7.4-2.fc44.x86_64`; plugin present | E1 |
| Plasma desktop theme `default` | `[plasmarc][Theme] name=default` | Fedora `libplasma-6.7.4-1.fc44.x86_64`; path present | E1 |
| `Next` wallpaper package | `[Wallpaper] Image=Next` | Fedora `plasma-breeze-common`; package metadata path present | E1 |
| `org.kde.image` wallpaper plugin | Stock layout assigns it to each desktop | Fedora `plasma-workspace`; Qt6 plugin path present | E1; `U5`, layout lines 3-7 |
| QML modules used by light logout/splash | `QtQuick`, Kirigami, Plasma components, Breeze components, CoreAddons, and private session module appear in the installed QML | Corresponding Qt6 module paths are present and RPM-owned in E9. | E7, E9 |
| Native applets | Kickoff, pager, icon tasks, margins separator, optional KIM panel, system tray, digital clock, show desktop | Fedora `plasma-desktop` or `plasma-workspace-libs`; exact file/package mapping is E6. For `org.kde.plasma.icontasks`, the image's corresponding `taskmanager.so` is owned by `plasma-desktop`; alias resolution is **UNKNOWN** without a live plugin metadata/load check. | E6; `U4`, lines 24-75 |
| Fonts | No stock font declaration | SP+ injects Noto Sans; image has `google-noto-sans-fonts-20251201-2.fc44.noarch` and the Containerfile checks `Noto Sans` at `images/kde/Containerfile:L1044-L1048` | `config/spplus-apply-theme:L30-L40`, `L122-L127`; E8 and `images/kde/Containerfile:L1044-L1048` |
| Kvantum engine/skin | Not referenced by either stock package | `kvantum-1.1.6-1.fc44` is installed for other SP+ themes (E8), as declared at `images/kde/Containerfile:L1026-L1040`; no Kvantum skin is needed by the stock Breeze declarations | Stock defaults `U2/U3`; Containerfile lines 1026-1040 |
| Custom applets or custom plasmoids | None; the layout uses native Plasma IDs | No custom Breeze applet tree is vendored or copied; built-in applets are Fedora packages in E6 | E4, E6; `images/kde/Containerfile:L1013-L1017` |

No dependency in the stock declaration was found to be missing from the existing
image. This is package/path presence evidence, not a guarantee that every running
process will reload the dependency live.

## 5. Plasma 6 compatibility

| Check | Evidence | Finding |
|---|---|---|
| Package type and IDs | Both pinned metadata files use `KPackageStructure=Plasma/LookAndFeel` and the correct IDs (`U2/U3`, metadata lines 1-3 and 111-112). The image inventory contains `metadata.json` and no `metadata.desktop` for the stock look-and-feel packages (E2). | Positive Plasma 6 package markers. |
| Light metadata API marker | Light metadata has `X-Plasma-APIVersion=2` (`U2`, metadata line 224). | This is a current package marker, not evidence by itself of a Plasma 5 package. |
| Dark metadata API marker | The pinned dark metadata ends after the plugin data and does not contain `X-Plasma-APIVersion` (`U3`, metadata lines 1-168). | No API marker was established for dark; package type and ID remain present. |
| `metadata.desktop` versus `metadata.json` | Installed stock packages contain `metadata.json` only (E2). | No Plasma 5 `metadata.desktop` package format was found for stock Breeze. |
| Layout JavaScript API | The stock package uses `loadTemplate(...)`; Plasma 6.7's `ShellCorona::loadDefaultLayout()` still loads `<shell>-layout.js` and evaluates it (`U5`, `shellcorona.cpp:L1090-L1158`). | The JavaScript layout is an active Plasma 6 path, not a Plasma 5-only surface. |
| `plasma-apply-*` version assumptions | The stock package contains no command invocation. SP+ calls the unversioned `plasma-apply-lookandfeel` and the image-specific `/usr/sbin` tools, while first-login explicitly uses Qt6-era `busctl`/`kreadconfig6`/`kwriteconfig6` (`config/spplus-first-login:L27-L40`). | No v5 command name is present in the audited stock package or SP+ path. The behavior of the unversioned executable is pinned by `U6`, `lnftool.cpp:L46-L59`. |
| QML imports | The image import inventory E7 contains unversioned Qt 6-style imports such as `import QtQuick`, and the pinned upstream source has the same stock QML. | No old versioned QtQuick/Plasma import was found in the inspected stock files. A live QML load test is **UNKNOWN**. |
| Aurorae decoration API | Stock defaults select `library=org.kde.breeze`, not an Aurorae plugin (`U2/U3`, defaults lines 19-21). The installed KDecoration3 Breeze plugin is present in E1. | No Aurorae removed-API dependency exists in stock Breeze. Actual KWin loading remains **UNKNOWN** without a live support-information readback. |
| Look-and-feel layout registration | Plasma 6.7's package scanner flags `layouts` and defaults surfaces (`U7`, `klookandfeelmanager.cpp:L86-L128`), and the shell evaluates the layout script (`U5`). | Stock layout files are registered by the Plasma 6 source path. |

No concrete Plasma 5 incompatibility was established in the inspected stock files.
This is not a live rendering or reload verdict.

## 6. Layout

Both stock packages ship the same `contents/layouts/org.kde.plasma.desktop-layout.js`
(E2, E3):

```javascript
loadTemplate("org.kde.plasma.desktop.defaultPanel")

var desktopsArray = desktopsForActivity(currentActivity());
for( var j = 0; j < desktopsArray.length; j++) {
    desktopsArray[j].wallpaperPlugin = 'org.kde.image';
}
```

The package script itself delegates panel construction to the Plasma 6 panel
layout template. `ShellCorona::loadDefaultLayout()` chooses the selected package's
`<shell>-layout.js` before falling back to the shell default (`U5`,
`shellcorona.cpp:L1123-L1158`). The template is pinned in
`https://github.com/KDE/plasma-desktop/blob/v6.7.4/layout-templates/org.kde.plasma.desktop.defaultPanel/contents/layout.js`.

| Template behavior | Exact source evidence |
|---|---|
| Creates a `Panel`; it does not assign `panel.screen`. | Template lines 1-2. The scripting API exposes `screen` as a writable property, but the stock template does not write it (`https://github.com/KDE/plasma-workspace/blob/v6.7.4/shell/scripting/panel.h#L29-L37`). |
| Does not set `panel.location`; the source comment says `ShellCorona::addPanel` chooses an available edge. | Template lines 4-5. Exact resulting edge in a live session is **UNKNOWN**. |
| Computes height as `2 * Math.ceil(gridUnit * 2.5 / 2)`. | Template lines 6-9. It is not a hard-coded 48px value. |
| On a horizontal panel wider than a 21:9 screen width, sets `alignment=center`, `minimumLength=maximumLength=ceil(screen height * 21/9)`. | Template lines 11-21. Otherwise it does not set alignment or a fixed length. |
| Adds applets in order: `org.kde.plasma.kickoff`, `org.kde.plasma.pager`, `org.kde.plasma.icontasks`, `org.kde.plasma.marginsseparator`, then `org.kde.plasma.systemtray`, `org.kde.plasma.digitalclock`, `org.kde.plasma.showdesktop`. | Template lines 24-28 and 73-75. |
| Adds `org.kde.plasma.kimpanel` only when `languageId` is one of `as,bn,bo,brx,doi,gu,hi,ja,kn,ko,kok,ks,lep,mai,ml,mni,mr,ne,or,pa,sa,sat,sd,si,ta,te,th,ur,vi,zh_CN,zh_TW`. | Template lines 30-70. |
| Sets wallpaper plugin, but not the wallpaper image, on each current-activity desktop. | Stock package layout lines 3-7. The image path is supplied separately by the wallpaper apply tool, not by this script. |

### Hard-coded path and identity audit

| Requested category | Finding |
|---|---|
| Absolute paths | None in either stock layout script or the pinned panel template. Evidence: E2/E3 and the complete template at `U8`, lines 1-76. |
| Usernames | None. Evidence: same complete files. |
| Locked widgets | No `locked` assignment. Evidence: same complete files. |
| Machine-specific values | No hostnames, hardware IDs, home paths, or machine usernames. The template has fixed geometry constants `2.5` and `21/9`, the dynamic `screenGeometry(panelScreen)` call, and a language whitelist; none is a machine identity. Evidence: `U8`, lines 6-21 and 30-70. |
| Package-specific applet values | The applet IDs above are fixed stock Plasma plugin IDs. The image contains their Fedora plugin files according to E6. |

The exact number of panels produced in a particular multi-screen session is
**UNKNOWN —** the script has one `new Panel` invocation and the shell's screen/
containment lifecycle controls the evaluation context; a live `dumpCurrentLayoutJS`
readback settles the resulting count. The template itself creates no custom
plasmoid or custom applet.

## 7. SP+ divergences

Here, “section 3” means the creator-declared stock Breeze values. `SP+-POLICY`
means an explicit SP+ choice visible in source. `REQUIRED-COMPAT` means a current
path does not use the Plasma 6 mechanism required to make the declared result
reliable. `UNEXPLAINED` means the behavior is visible but no reason for the
stock-theme difference is established by the audited code.

### What the current picker helper does

The execution order in `config/spplus-apply-theme` is:

1. It accepts exactly one theme ID and searches the per-user then system
   look-and-feel directories for `contents/defaults` (`L21-L48`, `L96-L108`). A
   missing package returns 1 (`L102-L106`).
2. It first invokes `plasma-apply-lookandfeel -a <id>` (`L112-L118`). In pinned
   Plasma 6.7 source, `-a` disables automatic mode, records the package ID, and
   saves the settings (`U6`, `lnftool.cpp:L98-L112`). Its default selection is
   `AppearanceSettings | BlendChanges`; `LayoutSettings` is added only with
   `--resetLayout` (`U6`, `lnftool.cpp:L98-L102`).
3. The manager's package scanner recognizes colors, widget style, icons, Plasma
   theme, wallpaper, cursor, decoration, fonts, and other defaults from the
   package (`U7`, `klookandfeelmanager.cpp:L86-L126`). Its `save()` path applies
   layout only through the explicit layout branch (`U7`, `klookandfeelmanager.cpp:L444-L455`)
   and applies the listed appearance settings through `L470-L592`. The inspected
   `save()` range has no wallpaper-image application; the standalone KDE wallpaper
   tool is therefore a separate step.
4. The helper parses the package defaults (`L120-L121`). If no parsed key is named
   exactly `font`, it appends all five `SPPLUS_FONTS` entries (`L122-L127`).
5. It writes every non-wallpaper entry with `kwriteconfig6 --file ... --group ...
   --key ...` (`L72-L75`, `L129-L134`). The wallpaper value is held back instead
   of written as an INI key (`L129-L132`).
6. It calls `plasma-apply-wallpaperimage <raw-value>` (`L136-L139`). For stock
   Breeze, that raw value is `Next`, not `/usr/share/wallpapers/Next`.
7. It calls `notify()` and then prints the attempted writes and returns 0
   (`L141-L146`).

The helper deliberately runs the KDE apply command before its own writes because
its comments identify the package-default reset as overwriting earlier writes
(`L112-L115`). The upstream manager itself writes KConfig defaults with
`KConfig::Notify`, reverts active keys to those defaults, and emits component
notifications (`U7`, `klookandfeelmanager.cpp:L351-L392`). The helper's later
`kwriteconfig6` commands do not pass `--notify` (`L72-L75`). The KDE `kwriteconfig`
implementation makes this distinction explicit: it selects `KConfig::Notify` only
when `--notify` is present and otherwise uses `KConfig::Normal`
(`https://github.com/KDE/kconfig/blob/v6.29.0/src/kreadconfig/kwriteconfig.cpp#L37-L47` and
`L81-L99`).

### Confirmed failure handling finding

Finding (a) is confirmed for subprocess return codes, with one qualification:
all subprocess invocations in the helper use `check=False` (`L75`, `L81-L83`,
`L116-L118`, `L137-L139`). A nonzero return from Plasma, `kwriteconfig6`, the
wallpaper tool, or a notification call is not converted into a helper failure;
the function reaches `return 0` (`L141-L146`). The missing-package and bad-argument
branches still return 1 and 2 (`L96-L106`), and an operating-system exception
such as a missing executable is not swallowed by `check=False`; `WelcomeBridge`
catches `OSError`/`SubprocessError` around its own call (`welcome/welcome.py:L885-L897`).

Welcome treats only the helper return code as success (`welcome/welcome.py:L887-L895`)
and then displays “THE WHOLE DESKTOP CHANGED” on `ok` (`welcome/app/app.js:L318-L326`).
Thus a subprocess-return-code failure after package discovery can reach the success
UI without a readback proving that any write landed.

### Confirmed layout finding

Finding (b) is confirmed for the Welcome picker: the helper has no layout D-Bus
call and invokes `plasma-apply-lookandfeel` without `--resetLayout`
(`config/spplus-apply-theme:L112-L118`, `L129-L141`). Pinned Plasma 6 source says
layout is excluded unless `--resetLayout` is present (`U6`, `lnftool.cpp:L98-L102`).
Welcome calls only the helper (`welcome/welcome.py:L885-L897`). Therefore a later
picker choice does not process the selected stock package's layout script, and the
existing panel is not changed by this path.

This is not true of first login: `spplus-first-login` explicitly invokes the
Windows 11 package with `--resetLayout` before invoking the helper
(`config/spplus-first-login:L80-L86`). That is a separate first-login behavior,
not a stock Breeze picker behavior.

### Notification reachability

The following separates the helper's invalid/absent notification calls from the
valid notifications already performed inside upstream `plasma-apply-lookandfeel`.

| Component/surface | Plasma 6.7.4 source path | Current SP+ path | Audit result |
|---|---|---|---|
| KWin configuration and decoration | `reconfigure()` is an exported no-reply method (`https://github.com/KDE/kwin/blob/v6.7.4/src/dbusinterface.h#L52-L60`); it schedules a 200ms reconfigure and emits `configChanged` after reparsing (`https://github.com/KDE/kwin/blob/v6.7.4/src/workspace.cpp#L993-L1017`). The decoration bridge reports loaded plugin/theme through `supportInformation()` (`https://github.com/KDE/kwin/blob/v6.7.4/src/decorations/decorationbridge.cpp#L268-L286`). | Helper calls `org.kde.KWin /KWin reconfigure` (`config/spplus-apply-theme:L85-L86`). Upstream apply also emits the `/KWin reloadConfig` signal when KWin settings change (`U7`, `klookandfeelmanager.cpp:L610-L614`). | Source-reachable. Actual live service/reconfigure result is **UNKNOWN**; E5 only proves no KWin service existed in the isolated probe. |
| Breeze Qt style | Breeze connects to `/BreezeStyle` and `/BreezeDecoration` `org.kde.Breeze.Style.reparseConfiguration`, `/KGlobalSettings` `notifyChange`, and `/KWin` `reloadConfig` (`https://github.com/KDE/breeze/blob/v6.7.4/kstyle/breezestyle.cpp#L275-L300`). | The helper does not emit the two Breeze reparse signals or the `/KWin` `reloadConfig` signal itself. Its `KGlobalSettings` calls are method calls and fail as shown by E5. Upstream apply emits valid palette/style notifications for the stock package (`U7`, `klookandfeelmanager.cpp:L235-L261`). | The helper's explicit notification route does not reach Breeze. Whether the earlier upstream apply path leaves a running Qt6 Breeze style visually refreshed is **UNKNOWN** without a live app test. |
| Breeze KDecoration plugin | Breeze decoration listens for `notifyChange` on `/KGlobalSettings` (`https://github.com/KDE/breeze/blob/v6.7.4/kdecoration/breezedecoration.cpp#L203-L213`). KWin's decoration bridge is connected to KWin `configChanged` (`https://github.com/KDE/kwin/blob/v6.7.4/src/workspace.cpp#L160-L167`). | Helper's explicit `notifyChange` method calls fail. Its valid KWin `reconfigure` call remains present; upstream apply sends the KWin reload signal. | KWin-side decoration path is source-reachable; the legacy global-settings method path is not. Actual loaded plugin/theme is **UNKNOWN** without support-information output. |
| Plasma shell desktop theme | `ShellCorona` watches `plasmarc` for dirty/created changes (`https://github.com/KDE/plasma-workspace/blob/v6.7.4/shell/shellcorona.cpp#L239-L246`) and reads `[Theme] name` (`L347-L363`). `refreshCurrentShell` is a separate exported method that reparses and starts `plasmashell --replace` (`L3121-L3126`). | Helper writes `plasmarc:Theme:name` but makes no shell refresh call (`config/spplus-apply-theme:L87-L88`, `L129-L134`). | A file-watch path exists in source. Whether the running shell changed in this environment is **UNKNOWN**. |
| Platform theme/font consumers | KWin listens for `/KDEPlatformTheme`, `org.kde.KDEPlatformTheme.refreshFonts` (`https://github.com/KDE/kwin/blob/v6.7.4/src/workspace.cpp#L318-L324`); Plasma portal settings has the same refresh-font listener (`https://github.com/KDE/plasma-integration/blob/v6.7.4/qt6/src/platformtheme/khintssettings.cpp#L193-L202` and `https://github.com/KDE/xdg-desktop-portal-kde/blob/v6.7.4/src/settings.cpp#L350-L365`). | Stock Breeze declares no fonts, so upstream apply's font branch is not entered. The helper then adds five Noto values and emits no `refreshFonts` signal (`config/spplus-apply-theme:L122-L127`, `L141-L146`). | The extra SP+ font writes have no identified valid platform-theme refresh path. `REQUIRED-COMPAT`. |
| Cursor | KWin's cursor object connects to `notifyChange` and only reloads when `type == 5` (`https://github.com/KDE/kwin/blob/v6.7.4/src/cursor.cpp#L106-L113`, `L146-L152`). Upstream apply writes the cursor and emits `CursorChanged` (`U7`, `klookandfeelmanager.cpp:L821-L840`). | Helper sends change types 0, 1, 2, and 4 as attempted methods, never type 5 (`config/spplus-apply-theme:L85-L93`). First-login does use a signal-capable `gdbus emit ... notifyChange 5 0` (`config/spplus-first-login:L241-L247`). | Picker helper's explicit cursor notification is invalid/missing. Upstream apply has a valid cursor notification; first-login has a separate valid type-5 signal. |
| KGlobalSettings signal itself | KDE's common KCM code constructs a signal at `/KGlobalSettings`, interface `org.kde.KGlobalSettings`, member `notifyChange`, with two arguments (`https://github.com/KDE/plasma-workspace/blob/v6.7.4/kcms/kcms-common.cpp#L9-L15`). Breeze, KWin cursor, decoration, platform settings, and hints settings connect as shown above. | Helper calls it as `org.kde.KGlobalSettings.notifyChange` method (`config/spplus-apply-theme:L91-L93`). `gdbus emit` is the signal-capable form and returned 0 in E5. | `REQUIRED-COMPAT`: method form is not the Plasma 6 signal form. |

The image has no live bus in this audit, so the table does not claim that a
running Breeze process did or did not repaint. E5 confirms the method/signal
shape in an isolated bus; pinned source establishes the listeners.

### Current SP+ differences from the stock declarations

| Difference from section 3 | Classification | Code/evidence |
|---|---|---|
| The helper adds `kdeglobals:General:font`, `menuFont`, `toolBarFont`, `activeFont`, and `smallestReadableFont` with Noto Sans when stock defaults contain no `font` key. | `SP+-POLICY` | `SPPLUS_FONTS` is defined at `config/spplus-apply-theme:L30-L40`; the conditional append is `L122-L127`. The stock files contain no font key (`U2/U3`, complete defaults). |
| The added `activeFont` is written under `[General]`, but Plasma's upstream look-and-feel font path reads the window-title `activeFont` from `[WM]`. | `REQUIRED-COMPAT` | SP+ location: `config/spplus-apply-theme:L34-L39`; upstream read/write location: `U7`, `klookandfeelmanager.cpp:L556-L566` and `L341-L349`. The effective impact of the extra General key is **UNKNOWN** without a live window-title/font readback. |
| The stock `Wallpaper:Image=Next` value is passed as the bare string `Next`, not an existing absolute package path. The KDE wallpaper utility only accepts an existing file or a directory containing `metadata.desktop`/`metadata.json`. | `REQUIRED-COMPAT` | Helper call: `config/spplus-apply-theme:L136-L139`; utility validation and `file://` construction: `https://github.com/KDE/plasma-workspace/blob/v6.7.4/wallpapers/image/plasma-apply-wallpaperimage.cpp#L49-L88` and `L123-L126`. The helper's working directory is not established; live success is therefore **UNKNOWN**, not assumed. |
| The Welcome picker does not apply the stock `contents/layouts/*.js`, so a stock selection does not replace the existing panel. | `UNEXPLAINED` | `config/spplus-apply-theme:L112-L118`, `L129-L141`; `U6`, `lnftool.cpp:L98-L102`; `welcome/welcome.py:L885-L897`. |
| The helper's post-write calls use `kwriteconfig6` without `--notify`. | `REQUIRED-COMPAT` | `config/spplus-apply-theme:L72-L75`; `kwriteconfig6` flag selection in KDE source at `kconfig/kwriteconfig.cpp:L37-L47`, `L81-L99`. |
| The helper attempts `KGlobalSettings.notifyChange` as a method rather than emitting the signal, and omits `CursorChanged=5`. | `REQUIRED-COMPAT` | `config/spplus-apply-theme:L78-L93`; signal construction and listener evidence above; E5. |
| The helper's injected font values are not followed by `refreshFonts`. | `REQUIRED-COMPAT` | Font append/write: `config/spplus-apply-theme:L122-L141`; required listener: KWin source `workspace.cpp:L318-L324` and platform source cited above. |
| The helper's explicit `IconChanged=4` attempt is not equivalent to upstream's per-icon-group `KIconLoader::emitChange()` calls. The earlier upstream `-a` path does call those group notifications for stock `Icons:Theme`. | `REQUIRED-COMPAT` | Helper attempt: `config/spplus-apply-theme:L89-L93`; upstream icon handling: `U7`, `klookandfeelmanager.cpp:L266-L279`. The final live icon state is **UNKNOWN**. |
| The helper does not perform a post-apply readback of any key, wallpaper, loaded decoration, shell layout, or live component. | `UNEXPLAINED` | It prints `applied` lines and `SPPLUS_THEME_APPLIED` then returns 0 (`config/spplus-apply-theme:L141-L146`). Welcome accepts return code only (`welcome/welcome.py:L887-L895`). |
| Every subprocess return code in the helper is ignored after package discovery; it can return 0 after only attempting the writes. | `UNEXPLAINED` | `check=False` sites and return path: `config/spplus-apply-theme:L75`, `L81-L83`, `L116-L118`, `L137-L146`. This is the qualified confirmation of finding (a) above. |

The values for the stock color scheme, widget style, icon theme, Plasma desktop
theme, cursor, Breeze decoration, and splash theme are not altered in the helper's
parsed defaults. The helper's explicit writes use the values in section 3 for
those keys (`config/spplus-apply-theme:L129-L134`). The live result remains subject
to the notification and failure behaviors above.

### First-login and system-wide policy differences

First login is not a stock Breeze apply. It hard-codes the SP+ Windows 11 dark
look-and-feel and SPPlus-Calm wallpaper (`config/spplus-first-login:L17-L23`),
then runs the Windows package with `--resetLayout` and the helper
(`L80-L86`). `--resetLayout` applies the appearance mask plus layout, not layout
alone (`U6`, `lnftool.cpp:L98-L112`). The resulting policy differs from stock
Breeze as follows:

| Current forced value/behavior | Classification | Evidence |
|---|---|---|
| First-login package is `org.secureprospective.spplus.windows11.dark`, not either stock Breeze ID. | `SP+-POLICY` | `config/spplus-first-login:L17-L23`, `L80-L86`. |
| First-login layout is reset through `--resetLayout`; a later Breeze picker call does not reset layout. | `SP+-POLICY` plus the picker `UNEXPLAINED` gap above | `config/spplus-first-login:L80-L86`; helper and Plasma tool evidence above. |
| First-login wallpaper is `/usr/share/wallpapers/SPPlus-Calm`, not `Next`. | `SP+-POLICY` | `config/spplus-first-login:L17-L23`, `L102-L130`; image copy `images/kde/Containerfile:L1004-L1005`. |
| First-login custom package selects `Papirus-Dark`, `kvantum-dark`, `Windows-modern-dark`, Aurorae `.v2`, titlebar button defaults, and `ksplashrc:Theme=none`, rather than the stock Breeze values. | `SP+-POLICY` | Custom defaults `theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/defaults:L5-L38`; stock table section 3; first-login invocation `config/spplus-first-login:L80-L86`. |
| First-login reasserts `breeze_cursors` at the end and emits type 5. The resulting cursor value matches both stock packages, but the late retry exists outside the stock declaration. | `SP+-POLICY` | `config/spplus-first-login:L226-L250`; stock cursor declaration `U2/U3`, lines 16-17. |
| First-login waits and then uses fixed sleeps around the asynchronous layout/wallpaper operations. | `REQUIRED-COMPAT` | `config/spplus-first-login:L87-L98`, `L102-L129`; Plasma source says layout reload is queued/asynchronous and has no completion signal (`U5`, `shellcorona.cpp:L689-L715`, `L1090-L1158`; D-Bus XML `U9`, lines 28-36). A fixed sleep is not an established completion check. |
| `theme_config_ok()` verifies only stock-independent/custom `ColorScheme`, `widgetStyle`, two decoration keys, and cursor. It does not verify icons, Plasma theme, fonts, splash, panel layout, loaded decoration, or all package defaults. | `UNEXPLAINED` | `config/spplus-first-login:L65-L78`, retry gate `L82-L99`. |
| If `SPPlus-Calm` is absent, wallpaper verification remains initialized as success because the wallpaper branch is skipped. | `UNEXPLAINED` | `config/spplus-first-login:L110-L131`. The current Containerfile does copy the wallpaper, but the failure behavior is still present. |
| The service treats both exit 0 and exit 1 as systemd success, while the script withholds its stamp on a cosmetic failure and retries next login. | `SP+-POLICY` | `config/spplus-first-login.service:L7-L11`; script stamp/exit logic `config/spplus-first-login:L144-L150`, `L252-L261`. |

The system-wide `/etc/xdg` key inventory below is included because these values are
present before a user selects a theme. The generated files come from
`images/kde/Containerfile:L1051-L1096`, copied config files from `L535-L546` and
`L1113-L1114`, and MIME defaults from `L1502-L1521`.

#### Exact system-wide keys

| File | Exact key/value | Relation to stock Breeze section 3 | Classification |
|---|---|---|---|
| `/etc/xdg/kdeglobals` | `[General] ColorScheme=WindowsModernDark` | Replaces stock `BreezeLight`/`BreezeDark` as the system fallback. | `SP+-POLICY` |
| `/etc/xdg/kdeglobals` | `[General] TerminalApplication=kitty` | Not declared by stock Breeze. | `SP+-POLICY` |
| `/etc/xdg/kdeglobals` | `[General] LookAndFeelPackage=org.secureprospective.spplus.windows11.dark` | Names SP+ Windows dark instead of stock; naming alone does not run the layout/wallpaper (`images/kde/Containerfile:L1098-L1105`). | `SP+-POLICY` |
| `/etc/xdg/kdeglobals` | `[Icons] Theme=Papirus-Dark` | Replaces stock `breeze`/`breeze-dark` fallback. | `SP+-POLICY` |
| `/etc/xdg/kdeglobals` | `[KDE] widgetStyle=kvantum-dark` | Replaces stock `Breeze`. | `SP+-POLICY` |
| `/etc/xdg/kdeglobals` | `[KDE] LookAndFeelPackage=org.secureprospective.spplus.windows11.dark` | Extra duplicate package-name key; not in stock defaults. | `SP+-POLICY` |
| `/etc/xdg/plasmarc` | `[Theme] name=Windows-modern-dark` | Replaces stock `name=default`. | `SP+-POLICY` |
| `/etc/xdg/kwinrc` | `[org.kde.kdecoration2] library=org.kde.kwin.aurorae.v2` | Replaces stock `org.kde.breeze`. | `SP+-POLICY` |
| `/etc/xdg/kwinrc` | `[org.kde.kdecoration2] theme=__aurorae__svg__windows-modern-dark-aurorae` | Replaces stock `Breeze`. | `SP+-POLICY` |
| `/etc/xdg/kwinrc` | `[Wayland] InputMethod=` | Not declared by stock Breeze. | `SP+-POLICY` |
| `/etc/xdg/kwinrc` | `[Wayland] VirtualKeyboardEnabled=false` | Not declared by stock Breeze. | `SP+-POLICY` |
| `/etc/xdg/kscreenlockerrc` | `[Daemon] Autolock=false` | Not declared by stock Breeze. | `SP+-POLICY` |
| `/etc/xdg/kcminputrc` | `[Mouse] cursorTheme=breeze_cursors` | Same value as both stock packages. | `SP+-POLICY` system default; no value divergence |

The exact source for the copied cursor and lock files is
`config/kcminputrc:L1-L17` and `config/kscreenlockerrc:L1-L2`. The generated
KDE/KWin values are exact at `images/kde/Containerfile:L1057-L1089`.

The following `/etc/xdg/kglobalshortcutsrc` values are also forced system defaults.
They are not Breeze theme declarations:

| Group | Exact key/value | Classification |
|---|---|---|
| `[services][flameshot-capture.desktop]` | `_k_friendly_name=Take Screenshot` | `SP+-POLICY` |
| `[services][flameshot-capture.desktop]` | `_launch=Print,Print,Take Screenshot` | `SP+-POLICY` |
| `[services][spplus-screenshot.desktop]` | `_k_friendly_name=Take Screenshot with Spectacle` | `SP+-POLICY` |
| `[services][spplus-screenshot.desktop]` | `_launch=none,none,Take Screenshot with Spectacle` | `SP+-POLICY` |
| `[services][org.flameshot.Flameshot.desktop]` | `_k_friendly_name=Flameshot` | `SP+-POLICY` |
| `[services][org.flameshot.Flameshot.desktop]` | `_launch=none,none,Flameshot` | `SP+-POLICY` |
| `[services][org.kde.spectacle.desktop]` | `_k_friendly_name=Spectacle` | `SP+-POLICY` |
| `[services][org.kde.spectacle.desktop]` | `_launch=none,none,Launch Spectacle` | `SP+-POLICY` |
| `[services][org.kde.spectacle.desktop]` | `ActiveWindowScreenShot=none,none,Capture Active Window` | `SP+-POLICY` |
| `[services][org.kde.spectacle.desktop]` | `CurrentMonitorScreenShot=none,none,Capture Current Monitor` | `SP+-POLICY` |
| `[services][org.kde.spectacle.desktop]` | `FullScreenScreenShot=none,none,Capture Entire Desktop` | `SP+-POLICY` |
| `[services][org.kde.spectacle.desktop]` | `OpenWithoutScreenshot=none,none,Launch Spectacle without capturing` | `SP+-POLICY` |
| `[services][org.kde.spectacle.desktop]` | `RectangularRegionScreenShot=none,none,Capture Rectangular Region` | `SP+-POLICY` |
| `[services][org.kde.spectacle.desktop]` | `WindowUnderCursorScreenShot=none,none,Capture Window Under Cursor` | `SP+-POLICY` |

Source: `config/kglobalshortcutsrc:L34-L67`; copied to `/etc/xdg` by
`images/kde/Containerfile:L535-L546`. The same source is copied to
`/etc/skel/.config`, which is not an `/etc/xdg` key but is part of the same policy
layer (`Containerfile:L540-L546`).

The two MIME files are also forced defaults, outside the stock theme surface. Both
`/etc/xdg/mimeapps.list` and `/etc/xdg/kde-mimeapps.list` contain this exact
`[Default Applications]` mapping because the second is copied from the first
(`images/kde/Containerfile:L1502-L1521`):

```ini
x-scheme-handler/http=brave-browser.desktop
x-scheme-handler/https=brave-browser.desktop
x-scheme-handler/about=brave-browser.desktop
x-scheme-handler/unknown=brave-browser.desktop
text/html=brave-browser.desktop
application/xhtml+xml=brave-browser.desktop
x-scheme-handler/mailto=net.thunderbird.Thunderbird.desktop
message/rfc822=net.thunderbird.Thunderbird.desktop
text/plain=org.kde.kwrite.desktop
inode/directory=org.kde.dolphin.desktop
application/pdf=okularApplication_pdf.desktop
image/png=org.kde.gwenview.desktop
image/jpeg=org.kde.gwenview.desktop
image/gif=org.kde.gwenview.desktop
image/webp=org.kde.gwenview.desktop
image/svg+xml=org.kde.gwenview.desktop
```

These MIME values are `SP+-POLICY`, not theme declarations. The Containerfile also
deletes named XDG autostart files rather than writing keys at
`images/kde/Containerfile:L836-L855`; there is no theme key to transcribe for those
deletions.

## 8. Verification plan

Run as the target user in a live Plasma 6.7 session, after the apply operation under
test. Every assertion below is a command whose exit status can fail. `kreadconfig6`
readbacks must use the effective cascade, not only the user file; that distinction
is documented in `config/spplus-first-login:L42-L64`.

### Session and package preconditions

```sh
test -n "${DBUS_SESSION_BUS_ADDRESS:-}"
busctl --user list --no-legend --no-pager | grep -q '^org\.kde\.plasmashell\b'
test -x /usr/sbin/plasma-apply-lookandfeel
test -x /usr/sbin/kreadconfig6
test -x /usr/sbin/kwriteconfig6
test -x /usr/sbin/qdbus-qt6
```

Run these as separate commands, not as one unconditional success check:

| Assertion | Exact command |
|---|---|
| Light stock package is discoverable | `plasma-apply-lookandfeel --list \| grep -Fx -- 'org.kde.breeze.desktop'` |
| Dark stock package is discoverable | `plasma-apply-lookandfeel --list \| grep -Fx -- 'org.kde.breezedark.desktop'` |
| Light metadata exists | `test -f /usr/share/plasma/look-and-feel/org.kde.breeze.desktop/metadata.json` |
| Dark metadata exists | `test -f /usr/share/plasma/look-and-feel/org.kde.breezedark.desktop/metadata.json` |
| Light metadata ID matches path | `python3 -c 'import json; p="/usr/share/plasma/look-and-feel/org.kde.breeze.desktop/metadata.json"; assert json.load(open(p))["KPlugin"]["Id"] == "org.kde.breeze.desktop"'` |
| Dark metadata ID matches path | `python3 -c 'import json; p="/usr/share/plasma/look-and-feel/org.kde.breezedark.desktop/metadata.json"; assert json.load(open(p))["KPlugin"]["Id"] == "org.kde.breezedark.desktop"'` |
| Light defaults exists | `test -f /usr/share/plasma/look-and-feel/org.kde.breeze.desktop/contents/defaults` |
| Dark defaults exists | `test -f /usr/share/plasma/look-and-feel/org.kde.breezedark.desktop/contents/defaults` |
| Light layout exists | `test -f /usr/share/plasma/look-and-feel/org.kde.breeze.desktop/contents/layouts/org.kde.plasma.desktop-layout.js` |
| Dark layout exists | `test -f /usr/share/plasma/look-and-feel/org.kde.breezedark.desktop/contents/layouts/org.kde.plasma.desktop-layout.js` |
| Light colors exists | `test -f /usr/share/color-schemes/BreezeLight.colors` |
| Dark colors exists | `test -f /usr/share/color-schemes/BreezeDark.colors` |
| Light icons exist | `test -d /usr/share/icons/breeze` |
| Dark icons exist | `test -d /usr/share/icons/breeze-dark` |
| Cursor exists | `test -d /usr/share/icons/breeze_cursors` |
| `Next` wallpaper package exists | `test -f /usr/share/wallpapers/Next/metadata.json` |
| Plasma desktop theme exists | `test -d /usr/share/plasma/desktoptheme/default` |
| Panel template exists | `test -f /usr/share/plasma/layout-templates/org.kde.plasma.desktop.defaultPanel/contents/layout.js` |
| Qt 6 Breeze style exists | `test -f /usr/lib64/qt6/plugins/styles/breeze6.so` |
| Breeze decoration exists | `test -f /usr/lib64/qt6/plugins/org.kde.kdecoration3/org.kde.breeze.so` |
| Image wallpaper plugin exists | `test -f /usr/lib64/qt6/qml/org/kde/plasma/wallpapers/image/libplasma_wallpaper_image.so` |

### Apply-operation status contract

The corrected apply path must first return nonzero on any failed subprocess or
invalid package, and must not report a completed apply before the readbacks below
pass. The current helper invocation, whose return code is not a substitute for
these readbacks, is:

```sh
/usr/libexec/spplus-apply-theme org.kde.breeze.desktop
```

The same command with `org.kde.breezedark.desktop` is the dark test. The command's
current 0 return is not sufficient because of `check=False` (`config/spplus-apply-theme:L75`,
`L116-L146`). A corrected implementation must also apply the layout only through
an explicit layout decision; if layout is selected for the test, the equivalent
Plasma command is:

```sh
plasma-apply-lookandfeel -a org.kde.breeze.desktop --resetLayout
```

`--resetLayout` must be treated as a broad appearance-plus-layout operation, not
as a layout-only assertion (`U6`, `lnftool.cpp:L98-L112`).

### Light effective configuration

Run one command per key:

| Key | Exact failing readback |
|---|---|
| `kdeglobals:KDE:widgetStyle` | `test "$(kreadconfig6 --file kdeglobals --group KDE --key widgetStyle)" = 'Breeze'` |
| `kdeglobals:General:ColorScheme` | `test "$(kreadconfig6 --file kdeglobals --group General --key ColorScheme)" = 'BreezeLight'` |
| `kdeglobals:Icons:Theme` | `test "$(kreadconfig6 --file kdeglobals --group Icons --key Theme)" = 'breeze'` |
| `plasmarc:Theme:name` | `test "$(kreadconfig6 --file plasmarc --group Theme --key name)" = 'default'` |
| `kcminputrc:Mouse:cursorTheme` | `test "$(kreadconfig6 --file kcminputrc --group Mouse --key cursorTheme)" = 'breeze_cursors'` |
| `kwinrc:org.kde.kdecoration2:library` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key library)" = 'org.kde.breeze'` |
| `kwinrc:org.kde.kdecoration2:theme` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key theme)" = 'Breeze'` |
| `ksplashrc:KSplash:Theme` | `test "$(kreadconfig6 --file ksplashrc --group KSplash --key Theme)" = 'org.kde.breeze.desktop'` |
| Wallpaper image request | `grep -Fq 'file:///usr/share/wallpapers/Next' "${XDG_CONFIG_HOME:-$HOME/.config}/plasma-org.kde.plasma.desktop-appletsrc"` |

The `Wallpaper` command is a persistent desktop-config readback because the KDE
wallpaper utility writes `Image=file://<path>` through the shell script
(`https://github.com/KDE/plasma-workspace/blob/v6.7.4/wallpapers/image/plasma-apply-wallpaperimage.cpp#L81-L109`).
The shell layout dump below separately checks `wallpaperPlugin=org.kde.image`.

### Dark effective configuration

| Key | Exact failing readback |
|---|---|
| `kdeglobals:KDE:widgetStyle` | `test "$(kreadconfig6 --file kdeglobals --group KDE --key widgetStyle)" = 'Breeze'` |
| `kdeglobals:General:ColorScheme` | `test "$(kreadconfig6 --file kdeglobals --group General --key ColorScheme)" = 'BreezeDark'` |
| `kdeglobals:Icons:Theme` | `test "$(kreadconfig6 --file kdeglobals --group Icons --key Theme)" = 'breeze-dark'` |
| `plasmarc:Theme:name` | `test "$(kreadconfig6 --file plasmarc --group Theme --key name)" = 'default'` |
| `kcminputrc:Mouse:cursorTheme` | `test "$(kreadconfig6 --file kcminputrc --group Mouse --key cursorTheme)" = 'breeze_cursors'` |
| `kwinrc:org.kde.kdecoration2:library` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key library)" = 'org.kde.breeze'` |
| `kwinrc:org.kde.kdecoration2:theme` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key theme)" = 'Breeze'` |
| `ksplashrc:KSplash:Theme` | `test "$(kreadconfig6 --file ksplashrc --group KSplash --key Theme)" = 'org.kde.breeze.desktop'` |
| Wallpaper image request | `grep -Fq 'file:///usr/share/wallpapers/Next' "${XDG_CONFIG_HOME:-$HOME/.config}/plasma-org.kde.plasma.desktop-appletsrc"` |

### Optional current SP+ policy readbacks

These commands assert the current helper's extra policy, not the stock creator
configuration. A future policy decision that lets stock Breeze own fonts or
wallpaper would intentionally change these expectations.

| Policy key | Exact failing readback |
|---|---|
| Noto general font | `test "$(kreadconfig6 --file kdeglobals --group General --key font)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| Noto menu font | `test "$(kreadconfig6 --file kdeglobals --group General --key menuFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| Noto toolbar font | `test "$(kreadconfig6 --file kdeglobals --group General --key toolBarFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| Current helper's active-font key | `test "$(kreadconfig6 --file kdeglobals --group General --key activeFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| Noto smallest readable font | `test "$(kreadconfig6 --file kdeglobals --group General --key smallestReadableFont)" = 'Noto Sans,9,-1,5,50,0,0,0,0,0'` |
| System fallback color | `test "$(kreadconfig6 --file kdeglobals --group General --key ColorScheme)" = 'WindowsModernDark'` |
| System fallback icon theme | `test "$(kreadconfig6 --file kdeglobals --group Icons --key Theme)" = 'Papirus-Dark'` |
| System fallback widget style | `test "$(kreadconfig6 --file kdeglobals --group KDE --key widgetStyle)" = 'kvantum-dark'` |
| System fallback Plasma theme | `test "$(kreadconfig6 --file plasmarc --group Theme --key name)" = 'Windows-modern-dark'` |
| System fallback decoration library | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key library)" = 'org.kde.kwin.aurorae.v2'` |
| System fallback decoration theme | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key theme)" = '__aurorae__svg__windows-modern-dark-aurorae'` |
| System cursor fallback | `test "$(kreadconfig6 --file kcminputrc --group Mouse --key cursorTheme)" = 'breeze_cursors'` |

The `activeFont` check is deliberately shown at the current helper's General
location; the upstream title-font slot is `[WM] activeFont` as documented in
section 7.

### KWin loaded-decoration readback

A config-file match is not enough. These commands can fail if KWin fell back to
another plugin or theme:

```sh
test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key library)" = 'org.kde.breeze'
test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key theme)" = 'Breeze'
qdbus-qt6 org.kde.KWin /KWin org.kde.KWin.supportInformation | grep -Fq 'Plugin: org.kde.breeze'
qdbus-qt6 org.kde.KWin /KWin org.kde.KWin.supportInformation | grep -Fq 'Theme: Breeze'
```

The `Plugin:` and `Theme:` labels are emitted by KWin's decoration bridge
(`https://github.com/KDE/kwin/blob/v6.7.4/src/decorations/decorationbridge.cpp#L268-L276`).

### Plasma layout and wallpaper readback

The stock template's layout is asynchronous. Poll the actual dump and fail if the
expected structure never appears; do not use a fixed sleep as completion proof.
The following is one exact polling command. It parses the JSON embedded in the
`dumpCurrentLayoutJS` result, checks every panel's ordered native applets, permits
the source-defined conditional KIM panel, and checks the desktop wallpaper plugin:

```sh
LAYOUT="$(mktemp)"
for _ in $(seq 1 30); do
    if qdbus-qt6 org.kde.plasmashell /PlasmaShell \
        org.kde.PlasmaShell.dumpCurrentLayoutJS >"$LAYOUT" 2>/dev/null && test -s "$LAYOUT" && \
        python3 - "$LAYOUT" <<'PY'
import json, re, sys
text = open(sys.argv[1], encoding="utf-8").read()
match = re.search(r"var layout = (\{.*\});\s*plasma\.loadSerializedLayout", text, re.S)
assert match, "layout JSON missing"
layout = json.loads(match.group(1))
base = [
    "org.kde.plasma.kickoff",
    "org.kde.plasma.pager",
    "org.kde.plasma.icontasks",
    "org.kde.plasma.marginsseparator",
    "org.kde.plasma.systemtray",
    "org.kde.plasma.digitalclock",
    "org.kde.plasma.showdesktop",
]
assert layout["panels"], "no panels"
for panel in layout["panels"]:
    ids = [item["plugin"] for item in panel["applets"]]
    assert ids == base or ids == base[:4] + ["org.kde.plasma.kimpanel"] + base[4:], ids
for desktop in layout["desktops"]:
    assert desktop["wallpaperPlugin"] == "org.kde.image", desktop
PY
    then
        exit 0
    fi
    sleep 1
done
exit 1
```

The D-Bus method and output format are defined by the Plasma 6.7 XML
(`https://github.com/KDE/plasma-workspace/blob/v6.7.4/shell/dbus/org.kde.PlasmaShell.xml#L18-L36`)
and the serializer writes panel applet plugin IDs and desktop wallpaper plugin
fields (`https://github.com/KDE/plasma-workspace/blob/v6.7.4/shell/shellcorona.cpp#L479-L511`,
`L563-L612`, `L613-L686`).

### Live reload limitations that remain explicit

The following are not replaced by a config-file readback:

- A Qt widget-style probe must report the actual `QApplication::style()` class in
  a running Qt6 process. No such probe binary is identified in this repo:
  **UNKNOWN —** supply a live Qt6 probe before treating `widgetStyle=Breeze` as
  proof of an already-running application's style.
- A visual icon/font/cursor check in a running target application is required to
  prove cached clients refreshed. Config and asset existence alone do not prove
  that state.
- Splash `ksplashrc` is a next-session surface; the current running session cannot
  prove a splash screen that is not currently shown. The package's splash file is
  present only in light (E2).

## 9. Open questions for Christopher

- Should selecting stock Breeze in Welcome leave the existing panel untouched, or offer an explicit, restorable layout reset?
- Should stock Breeze retain SP+ Noto/font and wallpaper overrides, or should its own declarations own every surface it declares and leave silent surfaces to policy?
- Should the non-theme `/etc/xdg` defaults such as Papirus/Kvantum, Kitty, screenshot bindings, and screen-lock policy remain part of the same global policy layer when a stock theme is selected?
