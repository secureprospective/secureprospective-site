# Nordic theme manifest

**ID:** `theme-nordic`
**Scope:** `theme/vendor/look-and-feel/Nordic`, `theme/vendor/aurorae/Nordic`,
`theme/vendor/cursors/Nordic-cursors`, Nordic colour schemes, and the current SP+ apply/default path.
**Audit mode:** source-only. No image build, package installation, or live Plasma session
was run for this audit. A source `COPY` or `test` in the Containerfile is not treated
as proof that a newly built image contains the result.

`UNKNOWN — <what would settle it>` is used where a built-image or live-session
result is not established.

## 1. Provenance

| Item | Established value | Evidence |
|---|---|---|
| Upstream URL | `https://github.com/EliverLara/Nordic` | `theme/vendor/PROVENANCE.md:L6-L10`; upstream LNF metadata records the same URL at `[U2]` lines 10. |
| Ref recorded by the repository | `main @ 2026-07-23` | `theme/vendor/PROVENANCE.md:L6-L10`. |
| Immutable commit/tag actually recorded | **UNKNOWN —** the provenance row records a branch/date, not a commit hash or tag. | `theme/vendor/PROVENANCE.md:L10`; the fetched comparison checkout below is diagnostic evidence, not a recorded pin. |
| Comparison checkout | `be5bda37ba01139650e34238336e58e065d2f406`, fetched checkout branch `master`, commit date `2026-07-23T13:49:08-06:00`. | Exact command/output `[U1]`. The upstream remote exposes `master`; the repository provenance says `main`. |
| Upstream license file | Present at upstream root as `LICENSE`; its opening text is GNU General Public License, version 3, 29 June 2007. | `/tmp/Nordic/LICENSE:L1-L8`; exact filename check `[P1]`. |
| Local Nordic license file | Not present in the three local Nordic asset trees: the exhaustive `LICENSE*`, `COPYING*`, and `NOTICE*` search returned no output. Whether another project-level file supplies the required distribution notice is **UNKNOWN —** inspect the final image/license bundle. | Exact no-output search `[P1]`; `theme/vendor/look-and-feel/Nordic/metadata.json:L4-L14`; `theme/vendor/PROVENANCE.md:L10`. |
| Aurorae license metadata | `GPLv3`. | `theme/vendor/aurorae/Nordic/metadata.desktop:L1-L10`. |
| Look-and-feel contents match | `contents/` matches the comparison checkout byte-for-byte except `contents/defaults`. | Exact `diff -qr` output `[P2]`. |
| Aurorae tree match | Exact match at the comparison checkout. | `[P2]`, no diff output. |
| Cursor tree match | Exact match at the comparison checkout. | `[P2]`, no diff output. |
| `Nordic.colors` match | Exact match at the comparison checkout; both SHA-256 values are `363e74f1f631cb18e3d1fd856a75fac10fb699b169a8d9ebf38e1396d47ff03b`. | Exact `sha256sum` output `[P3]`. |
| Metadata match | Not a match: upstream has `metadata.desktop`; local has an authored `metadata.json`. | Upstream metadata `[U2]` lines 1-13; local `theme/vendor/look-and-feel/Nordic/metadata.json:L1-L16`. |
| Defaults match | Not a match: the local file is an SP+ generated/normalized file. | Upstream defaults `[U2]` lines 1-18; local `theme/vendor/look-and-feel/Nordic/contents/defaults:L1-L35`; `[P2]`. |

**[U1] Exact upstream ref command and output:**

```text
$ git -C /tmp/Nordic branch --show-current
master
$ git -C /tmp/Nordic rev-parse HEAD
be5bda37ba01139650e34238336e58e065d2f406
$ git -C /tmp/Nordic show -s --format='commit=%H%nauthor=%an%n date=%cI%nsubject=%s' HEAD
commit=be5bda37ba01139650e34238336e58e065d2f406
author=EliverLara
 date=2026-07-23T13:49:08-06:00
subject=fix(gnome-shell): Fix appearance of checkboxes in dialogs
```

**[U2] Exact upstream metadata/defaults excerpts:**

```text
$ nl -ba /tmp/Nordic/kde/plasma/look-and-feel/Nordic/metadata.desktop
     1  [Desktop Entry]
     2  Name=Nordic
     3  X-KDE-PluginInfo-Author=EliverLara
     4  X-KDE-PluginInfo-Category=Plasma Look And Feel
     5  X-KDE-PluginInfo-Email=eliverlara@gmail.com
     6  X-KDE-PluginInfo-EnabledByDefault=true
     7  X-KDE-PluginInfo-License=GPL 3+
     8  X-KDE-PluginInfo-Name=Nordic
     9  X-KDE-PluginInfo-Version=0.1
    10  X-KDE-PluginInfo-Website=https://github.com/EliverLara/Nordic
    11  X-KDE-ServiceTypes=Plasma/LookAndFeel
    12
    13  X-KPackage-Dependencies=kns://colorschemes.knsrc/api.kde-look.org/1326271,kns://plasma-themes.knsrc/api.kde-look.org/1326896,kns://plasma-themes.knsrc/api.kde-look.org/1416702,kns://aurorae.knsrc/api.kde-look.org/1326274,kns://sddmtheme.knsrc/api.kde-look.org/1366843,kns://xcursor.knsrc/api.kde-look.org/1662218,kns://wallpaper.knsrc/api.kde-look.org/1683121,kns://icons.knsrc/api.kde-look.org/1733012,kns://plasmoids.knsrc/api.kde-look.org/2048016
$ nl -ba /tmp/Nordic/kde/plasma/look-and-feel/Nordic/contents/defaults
     1  [kdeglobals][KDE]
     2  widgetStyle=kvantum
     3
     4  [kdeglobals][General]
     5  ColorScheme=Nordic
     6
     7  [kdeglobals][Icons]
     8  Theme=candy-Nordic-green
     9
    10  [kcminputrc][Mouse]
    11  cursorTheme=Nordic-cursors
    12
    13  [plasmarc][Theme]
    14  name=Nordic
    15
    16  [kwinrc][org.kde.kdecoration2]
    17  library=org.kde.kwin.aurorae
    18  theme=__aurorae__svg__Nordic
    19
    20
```

**[P1] Exact license-file checks:**

```text
$ find theme/vendor/look-and-feel/Nordic theme/vendor/aurorae/Nordic theme/vendor/cursors/Nordic-cursors -type f \( -iname 'LICENSE*' -o -iname 'COPYING*' -o -iname 'NOTICE*' \) -print
(no output)
$ find /tmp/Nordic -maxdepth 1 -type f \( -iname 'LICENSE*' -o -iname 'COPYING*' -o -iname 'NOTICE*' \) -printf '%f\n' | sort
LICENSE
```

**[P2] Exact tree comparison output:**

```text
$ diff -qr theme/vendor/aurorae/Nordic /tmp/Nordic/kde/aurorae/Nordic
$ diff -qr theme/vendor/cursors/Nordic-cursors /tmp/Nordic/kde/cursors/Nordic-cursors
$ diff -qr theme/vendor/look-and-feel/Nordic/contents /tmp/Nordic/kde/plasma/look-and-feel/Nordic/contents
Files theme/vendor/look-and-feel/Nordic/contents/defaults and /tmp/Nordic/kde/plasma/look-and-feel/Nordic/contents/defaults differ
$ diff -q theme/vendor/color-schemes/Nordic.colors /tmp/Nordic/kde/colorschemes/Nordic.colors
No output for Aurorae, cursors, or color-scheme; defaults is the only contents difference.
```

**[P3] Exact colour hash output:**

```text
$ sha256sum theme/vendor/color-schemes/Nordic.colors /tmp/Nordic/kde/colorschemes/Nordic.colors
363e74f1f631cb18e3d1fd856a75fac10fb699b169a8d9ebf38e1396d47ff03b  theme/vendor/color-schemes/Nordic.colors
363e74f1f631cb18e3d1fd856a75fac10fb699b169a8d9ebf38e1396d47ff03b  /tmp/Nordic/kde/colorschemes/Nordic.colors
```

## 2. Shipped assets

The `COPY` statements are recursive directory mappings. They establish image build
inputs and destinations, not a built-image readback. The relevant mappings are
`images/kde/Containerfile:L1013-L1017`.

| Local vendored source | Present in vendored tree | Containerfile image destination | Status |
|---|---:|---|---|
| `theme/vendor/look-and-feel/Nordic/` | Yes; LNF package plus `contents/components`, `lockscreen`, `logout`, `osd`, `previews`, and `splash` | `/usr/share/plasma/look-and-feel/Nordic/` through the parent `COPY` | Copied by `images/kde/Containerfile:L1013`. Built-image presence is **UNKNOWN —** run the existence commands in section 8. |
| `theme/vendor/aurorae/Nordic/` | Yes; 11 files | `/usr/share/aurorae/themes/Nordic/` through the parent `COPY` | Copied by `images/kde/Containerfile:L1014`. Built-image presence is **UNKNOWN**. |
| `theme/vendor/cursors/Nordic-cursors/` | Yes; 48 files | `/usr/share/icons/Nordic-cursors/` through the parent `COPY` | Copied by `images/kde/Containerfile:L1017`. Built-image presence is **UNKNOWN**. |
| `theme/vendor/color-schemes/Nordic.colors` | Yes | `/usr/share/color-schemes/Nordic.colors` through the parent `COPY` | Copied by `images/kde/Containerfile:L1015`. Built-image presence is **UNKNOWN**. |
| `theme/vendor/desktoptheme/Nordic/` | No | No Nordic-specific destination | No local Nordic desktop-theme asset is present. The only local vendor desktop-theme directory is `Orchis` according to `[A1]`. |
| `theme/vendor/Kvantum/Nordic/` | No | No Nordic-specific destination | No local Nordic Kvantum skin is present. The `theme/Kvantum/` copy at `images/kde/Containerfile:L869` belongs to the separate Windows Modern tree, not `theme/vendor`. |
| `theme/vendor/sddm/Nordic/` | No | No Nordic-specific destination | No local Nordic SDDM theme is present. `sddm` itself is installed as a Fedora package at `images/kde/Containerfile:L38-L40`, but that does not establish a Nordic SDDM theme. |

**[A1] Exact local/upstream asset inventory output:**

```text
$ for d in theme/vendor/look-and-feel/Nordic/contents/lockscreen theme/vendor/look-and-feel/Nordic/contents/logout theme/vendor/look-and-feel/Nordic/contents/splash theme/vendor/look-and-feel/Nordic/contents/osd theme/vendor/look-and-feel/Nordic/contents/previews; do printf '%s: ' "$d"; find "$d" -type f -printf '%P\n' | sort | paste -sd, -; done
theme/vendor/look-and-feel/Nordic/contents/lockscreen: config.qml,config.xml,LockOsd.qml,LockScreen.qml,LockScreenUi.qml,MainBlock.qml,MediaControls.qml
theme/vendor/look-and-feel/Nordic/contents/logout: LogoutButton.qml,Logout.qml,timer.js
theme/vendor/look-and-feel/Nordic/contents/splash: images/busy.svg,images/logo.png,images/Nordic.png,Splash.qml
theme/vendor/look-and-feel/Nordic/contents/osd: OsdItem.qml,Osd.qml
theme/vendor/look-and-feel/Nordic/contents/previews: fullscreenpreview.jpg,preview.png,splash.png
$ for d in theme/vendor/look-and-feel/Nordic/contents/layouts theme/vendor/look-and-feel/Nordic/contents/loginmanager; do if [ -d "$d" ]; then printf '%s: PRESENT\n' "$d"; else printf '%s: ABSENT\n' "$d"; fi; done
theme/vendor/look-and-feel/Nordic/contents/layouts: ABSENT
theme/vendor/look-and-feel/Nordic/contents/loginmanager: ABSENT
$ find theme/vendor/aurorae/Nordic -type f | wc -l
11
$ find theme/vendor/cursors/Nordic-cursors -type f | wc -l
48
$ find theme/vendor/color-schemes -maxdepth 1 -type f -iname '*Nordic*.colors' -printf '%f\n' | sort
Nordic.colors
$ find theme/vendor/desktoptheme -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort
Orchis
$ for d in theme/vendor/Kvantum/Nordic theme/vendor/sddm/Nordic theme/vendor/icons/candy-Nordic-green theme/vendor/desktoptheme/Nordic; do if [ -e "$d" ]; then printf '%s: PRESENT\n' "$d"; else printf '%s: ABSENT\n' "$d"; fi; done
theme/vendor/Kvantum/Nordic: ABSENT
theme/vendor/sddm/Nordic: ABSENT
theme/vendor/icons/candy-Nordic-green: ABSENT
theme/vendor/desktoptheme/Nordic: ABSENT
$ find /tmp/Nordic/kde/plasma/look-and-feel/Nordic/contents -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort
components
lockscreen
logout
osd
previews
splash
$ find /tmp/Nordic/kde/kvantum/Nordic -type f -printf '%f\n' | sort
Nordic.kvconfig
Nordic.svg
$ find /tmp/Nordic/kde/kvantum/Nordic -type f | wc -l
2
$ find /tmp/Nordic/kde/sddm/Nordic -type f | wc -l
22
$ find /tmp/Nordic/kde/colorschemes -maxdepth 1 -type f -printf '%f\n' | sort
nordicbluish.colors
Nordic.colors
NordicDarker.colors
$ find /tmp/Nordic/kde -type d \( -path '*/desktoptheme/*Nordic' -o -path '*/desktop-theme/*Nordic' \) -print
(no output)
```

### Requested lock-screen, logout, splash, and OSD matrix

| Surface | Vendored presence | Containerfile copy | Creator-default selection | SP+ neutralisation/current source behavior |
|---|---|---|---|---|
| Lock screen | Present: seven files under `contents/lockscreen/` ([A1]). | Yes, recursively through `COPY theme/vendor/look-and-feel/ /usr/share/plasma/look-and-feel/` at `images/kde/Containerfile:L1013`. | No global selector in the creator defaults. The two lock-screen configuration defaults are `alwaysShowClock=true` and `showMediaControls=true` in `config.xml:L8-L16`. | No Nordic-specific lock-screen selector is written. `Autolock=false` is separately copied as a system setting at `images/kde/Containerfile:L1113-L1134`; this disables automatic locking, while manual lock use is **UNKNOWN —** observe a live lock/unlock. Plasma 6 source mapping says this LNF path is ignored (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L108-L116`). |
| Logout | Present: `Logout.qml`, `LogoutButton.qml`, `timer.js` ([A1]). | Yes, through the same LNF `COPY` at `images/kde/Containerfile:L1013`. | No separate creator-default key. | No explicit SP+ logout neutralisation was found in the audited source. Plasma 6 source mapping records the logout path as still consumed by `logout-greeter` (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L106-L117`); actual display is **UNKNOWN —** log out and observe it. |
| Splash | Present: `Splash.qml` plus three image assets ([A1]). | Yes, through the same LNF `COPY` at `images/kde/Containerfile:L1013`. | No creator `ksplashrc` key. `Splash.qml` uses `images/Nordic.png` and `images/logo.png` (`theme/vendor/look-and-feel/Nordic/contents/splash/Splash.qml:L4-L6`, `:L28-L38`). | Yes. Local normalized defaults add `ksplashrc:KSplash:Theme=none` at `theme/vendor/look-and-feel/Nordic/contents/defaults:L34-L35`. The separate boot splash is SP+ Plymouth, not Nordic, at `images/kde/Containerfile:L708-L723` and `:L773-L780`. |
| OSD | Present: `Osd.qml`, `OsdItem.qml` ([A1]). | Yes, through the same LNF `COPY` at `images/kde/Containerfile:L1013`. | No creator OSD selector. | No separate SP+ OSD key was found. Plasma 6 source mapping says LNF `contents/osd/*` is ignored and the shell supplies OSD (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L104-L116`); actual trigger behavior is **UNKNOWN —** observe a volume/brightness OSD. |

### Upstream asset directories not represented by local Nordic vendoring

These are present in the fetched upstream repository but are not present in the
local Nordic vendor tree and are not covered by the Nordic vendor `COPY` mappings.
They are therefore not silently dropped *from a local copied directory*; they are
upstream-only omissions from the current vendored subset.

| Upstream contribution | Upstream evidence | Local/image build-input status |
|---|---|---|
| `kde/kvantum/Nordic/` containing `Nordic.kvconfig` and `Nordic.svg` | `[A1]`; upstream directory count is 2. | Local `theme/vendor/Kvantum/Nordic/` is absent. No Nordic Kvantum `COPY` exists at `images/kde/Containerfile:L1013-L1017`. Built-image presence is **UNKNOWN**. |
| `kde/sddm/Nordic/` | `[A1]`; upstream directory count is 22. | Local `theme/vendor/sddm/Nordic/` is absent. No SDDM theme `COPY` exists in the Nordic vendor mappings. Built-image presence is **UNKNOWN**. |
| `kde/colorschemes/NordicDarker.colors` and `kde/colorschemes/nordicbluish.colors` | `[A1]`. | Only `Nordic.colors` is locally vendored, and the complete local colour-scheme directory is copied by `images/kde/Containerfile:L1015`. These two optional upstream files are not in the current copy input. |
| A Nordic Plasma desktop theme directory | `theme/vendor/PROVENANCE.md:L27-L30` records that Nordic names a Plasma desktop theme it does not ship. The upstream fetched `kde` inventory has no Nordic desktop-theme directory. | No local `theme/vendor/desktoptheme/Nordic/` exists. The local fallback declaration is `breeze-dark`, section 3. Built-image path presence is **UNKNOWN**. |
| `candy-Nordic-green` icon theme | `theme/vendor/PROVENANCE.md:L27-L30` records that Nordic names this icon theme but does not ship it. | No local `theme/vendor/icons/candy-Nordic-green/` exists. The current build inputs install Papirus packages at `images/kde/Containerfile:L1037-L1045`, but that is a fallback, not the creator asset. Built-image path presence is **UNKNOWN**. |

No local Nordic file was found that the generic vendor `COPY` statements leave
behind. Every local Nordic LNF, Aurorae, cursor, and colour file is under one of the
copied parent directories at `images/kde/Containerfile:L1013-L1017`.

## 3. Creator-intended configuration

The first table is a literal transcription of the fetched upstream creator package's
own `contents/defaults`. It is deliberately separate from the SP+ normalized file.
The local file begins with `Generated by SP+ normalize.py` and is shown afterward;
its values are not presented as creator intent (`theme/vendor/look-and-feel/Nordic/contents/defaults:L1-L3`).

### Upstream `contents/defaults`

| File:group:key=value | Evidence |
|---|---|
| `kdeglobals:KDE:widgetStyle=kvantum` | `/tmp/Nordic/kde/plasma/look-and-feel/Nordic/contents/defaults:L1-L2` ([U2]). |
| `kdeglobals:General:ColorScheme=Nordic` | Same file `:L4-L5` ([U2]). |
| `kdeglobals:Icons:Theme=candy-Nordic-green` | Same file `:L7-L8` ([U2]). |
| `kcminputrc:Mouse:cursorTheme=Nordic-cursors` | Same file `:L10-L11` ([U2]). |
| `plasmarc:Theme:name=Nordic` | Same file `:L13-L14` ([U2]). |
| `kwinrc:org.kde.kdecoration2:library=org.kde.kwin.aurorae` | Same file `:L16-L17` ([U2]). |
| `kwinrc:org.kde.kdecoration2:theme=__aurorae__svg__Nordic` | Same file `:L16-L18` ([U2]). |

The upstream defaults contain no `font`, `menuFont`, `toolBarFont`, `activeFont`,
`smallestReadableFont`, `Wallpaper`, `ButtonsOnLeft`, `ButtonsOnRight`, or
`ksplashrc` key. The complete upstream file is `[U2]` lines 1-20.

### SP+ normalized local `contents/defaults`

This is the actual local package file that the current SP+ helper reads. A bare
`[Wallpaper]` section is handled specially by the helper, rather than written as a
literal `kdeglobals` group (`config/spplus-apply-theme:L26-L40` and `L129-L139`).

| File:group:key=value | Evidence |
|---|---|
| `kdeglobals:General:ColorScheme=Nordic` | `theme/vendor/look-and-feel/Nordic/contents/defaults:L5-L6`. |
| `kdeglobals:General:font=Noto Sans,10,-1,5,50,0,0,0,0,0` | Same file `:L7`. |
| `kdeglobals:General:menuFont=Noto Sans,10,-1,5,50,0,0,0,0,0` | Same file `:L8`. |
| `kdeglobals:General:toolBarFont=Noto Sans,10,-1,5,50,0,0,0,0,0` | Same file `:L9`. |
| `kdeglobals:General:activeFont=Noto Sans,10,-1,5,50,0,0,0,0,0` | Same file `:L10`. |
| `kdeglobals:General:smallestReadableFont=Noto Sans,9,-1,5,50,0,0,0,0,0` | Same file `:L11`. |
| `kdeglobals:Icons:Theme=Papirus-Dark` | Same file `:L13-L14`. |
| `kdeglobals:KDE:widgetStyle=Breeze` | Same file `:L16-L17`. |
| `kcminputrc:Mouse:cursorTheme=Nordic-cursors` | Same file `:L19-L20`. |
| `plasmarc:Theme:name=breeze-dark` | Same file `:L22-L23`. |
| `kdeglobals:Wallpaper:Image=SPPlus-Calm` | Raw bare `[Wallpaper]` section and key at same file `:L25-L26`; the helper maps the bare section to `kdeglobals` and stores it through `plasma-apply-wallpaperimage` at `config/spplus-apply-theme:L26-L28`, `:L129-L139`. |
| `kwinrc:org.kde.kdecoration2:library=org.kde.kwin.aurorae.v2` | Same file `:L28-L30`. |
| `kwinrc:org.kde.kdecoration2:theme=__aurorae__svg__Nordic` | Same file `:L28-L30`. |
| `kwinrc:org.kde.kdecoration2:ButtonsOnLeft=` | Same file `:L28-L32`. |
| `kwinrc:org.kde.kdecoration2:ButtonsOnRight=IAX` | Same file `:L28-L32`. |
| `ksplashrc:KSplash:Theme=none` | Same file `:L34-L35`. |

### Package content surfaces

| Package surface | Vendored files and declarations | Creator selection / current source status |
|---|---|---|
| Lock screen | Seven files under `contents/lockscreen/`: `config.qml`, `config.xml`, `LockOsd.qml`, `LockScreen.qml`, `LockScreenUi.qml`, `MainBlock.qml`, `MediaControls.qml` ([A1]). | `config.xml` declares `General:alwaysShowClock=true` and `General:showMediaControls=true` at `theme/vendor/look-and-feel/Nordic/contents/lockscreen/config.xml:L8-L16`; the UI binds both at `config.qml:L5-L7`. No global `contents/defaults` key selects this directory. Plasma 6 package registration status is recorded in section 5. |
| Logout | `contents/logout/Logout.qml`, `LogoutButton.qml`, `timer.js` ([A1]). | No INI key in the creator defaults selects a separate logout file. The QML imports local components and the timer at `theme/vendor/look-and-feel/Nordic/contents/logout/Logout.qml:L20-L31`. |
| Splash | `contents/splash/Splash.qml` plus `images/busy.svg`, `images/logo.png`, `images/Nordic.png` ([A1]). | `Splash.qml` uses the relative background `images/Nordic.png` at `theme/vendor/look-and-feel/Nordic/contents/splash/Splash.qml:L4-L6` and the relative logo at `:L28-L38`. The creator defaults contain no `ksplashrc` key. |
| OSD | `contents/osd/Osd.qml` and `OsdItem.qml` ([A1]). | No OSD selector appears in the creator defaults. The QML declares an output-only Plasma OSD dialog at `theme/vendor/look-and-feel/Nordic/contents/osd/Osd.qml:L18-L37`. |
| Previews | `contents/previews/fullscreenpreview.jpg`, `preview.png`, `splash.png` ([A1]). | These are package preview assets, not persistent configuration keys. Plasma 6 surface behavior is covered by `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L104-L117`. |
| Layout | No `contents/layouts/` directory ([A1]). | No panel, applet, edge, or widget layout is declared by this package. See section 6. |
| Login manager | No `contents/loginmanager/` directory ([A1]). | The upstream metadata has a separate `sddmtheme` dependency, but the LNF package itself has no `contents/loginmanager` tree. |

### Creator references not supplied by the current local package/image inputs

| Creator declaration/reference | What is not supplied | Evidence |
|---|---|---|
| `widgetStyle=kvantum` | The upstream repository has a separate `kde/kvantum/Nordic/` skin, but the local package has no corresponding `theme/vendor/Kvantum/Nordic/` and no Nordic Kvantum copy. | Upstream `[A1]`; local/default evidence `theme/vendor/look-and-feel/Nordic/contents/defaults:L16-L17`; Containerfile `L1013-L1017`. |
| `Theme=candy-Nordic-green` | No local icon directory with that name is present in the vendor inputs. | Upstream `[U2]` lines 7-8; `theme/vendor/PROVENANCE.md:L27-L30`; local absence recorded in section 2. |
| `plasmarc:Theme:name=Nordic` | No Nordic Plasma desktop-theme directory is present in the vendor inputs. | Upstream `[U2]` lines 13-14; `theme/vendor/PROVENANCE.md:L27-L30`; local `theme/vendor/desktoptheme` inventory in section 2. |
| `library=org.kde.kwin.aurorae` | The creator value is the unsuffixed Aurorae plugin ID. The local package changes it to `.v2`; actual KWin loading is not established. | Upstream `[U2]` lines 16-17; local defaults `:L28-L30`; `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L65-L102`. |
| Metadata `X-KPackage-Dependencies` | The nine upstream KNS dependency URLs are not retained in local `metadata.json`. | Upstream metadata `[U2]` line 13; local metadata `theme/vendor/look-and-feel/Nordic/metadata.json:L1-L16`. |

## 4. Dependencies

The status `source-declared` below means the current Containerfile has a package
install or recursive `COPY` instruction. It does not mean the image was built or
read back. Every built-image status is therefore **UNKNOWN —** unless the row says
that no corresponding local build input exists.

| Dependency or surface | Creator need/evidence | Current image build input and image status | Fedora / Plasma 6 / vendored status |
|---|---|---|---|
| Plasma look-and-feel loader and workspace | The package is `KPackageStructure=Plasma/LookAndFeel` in the local normalized metadata and contains `contents/defaults`. | `plasma-workspace` is named in the Fedora install transaction at `images/kde/Containerfile:L37-L58`; actual package/path presence is **UNKNOWN —** run `rpm -q plasma-workspace` and the package discovery command in section 8. | Fedora package; the Nordic LNF files are vendored. |
| `kvantum` Qt style engine | Creator defaults declare `kdeglobals:KDE:widgetStyle=kvantum` at upstream `contents/defaults:L1-L2`. | `kvantum` is named in `images/kde/Containerfile:L1037-L1040`; actual installation is **UNKNOWN**. | Fedora package, not vendored. |
| Nordic Kvantum skin | Upstream has `kde/kvantum/Nordic/Nordic.kvconfig` and `Nordic.svg`; upstream metadata also declares `widgetStyle=kvantum`. | No local source or Nordic `COPY` exists. Built-image presence is **UNKNOWN —** run `test -d /usr/share/Kvantum/Nordic`. | Upstream-vendored source exists in the fetched checkout; missing from the current local Nordic package inputs. Plasma 6 Kvantum activation requires a real `Kvantum/kvantum.kvconfig` selector, not only a style value (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L203-L238`). |
| `Nordic.colors` | Creator declares `ColorScheme=Nordic`. | Local file is copied by `images/kde/Containerfile:L1015`; built path presence is **UNKNOWN**. | Vendored upstream file; hash match is `[P3]`. |
| Optional `NordicDarker.colors` and `nordicbluish.colors` | Present in the upstream `kde/colorschemes` directory, but the main Nordic defaults select only `Nordic`. | No local files or separate image copy input. Built-image presence is **UNKNOWN**. | Upstream-only optional files; not Fedora packages in the audited source. |
| `candy-Nordic-green` icon theme | Creator declares it at upstream `contents/defaults:L7-L8` and names an icon KNS dependency in upstream metadata line 13. | No local `theme/vendor/icons/candy-Nordic-green/` or package install is present. Built-image presence is **UNKNOWN —** run `test -d /usr/share/icons/candy-Nordic-green`. | Missing from current local build inputs. The current fallback packages are Fedora `papirus-icon-theme` and `papirus-icon-theme-dark` at `images/kde/Containerfile:L1037-L1045`; Papirus is not the creator icon set. |
| `Nordic-cursors` | Creator declares `kcminputrc:Mouse:cursorTheme=Nordic-cursors`. | Local cursor tree is copied by `images/kde/Containerfile:L1017`; built path presence is **UNKNOWN**. | Vendored upstream cursor theme; not a Fedora package in the audited source. |
| Aurorae `Nordic` theme files | Creator declares `theme=__aurorae__svg__Nordic`; upstream metadata has an Aurorae KNS dependency. | Local `theme/vendor/aurorae/Nordic/` is copied by `images/kde/Containerfile:L1014`; built path presence is **UNKNOWN**. | Vendored upstream SVG/rc tree. Plasma 6 source inspection records the expected `decoration.svg` and `<theme>rc` layout at `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L65-L84`. |
| `org.kde.kwin.aurorae.v2` plugin | The normalized local defaults request the Plasma 6 SVG Aurorae plugin at `theme/vendor/look-and-feel/Nordic/contents/defaults:L28-L30`. | No direct Aurorae plugin installation or live plugin registry readback is in this audit. **UNKNOWN —** run the support-information command in section 8. | Plasma/KWin runtime component; actual installed plugin and load result are **UNKNOWN**. |
| Nordic Plasma desktop theme | Creator declares `plasmarc:Theme:name=Nordic`; provenance records that upstream does not ship that desktop theme. | No local `theme/vendor/desktoptheme/Nordic/` or Nordic install instruction exists. Built-image presence is **UNKNOWN —** run `test -d /usr/share/plasma/desktoptheme/Nordic`. | Missing from current local build inputs; the local normalized fallback is `breeze-dark`. |
| `sddm` engine | Upstream metadata declares `sddmtheme.knsrc/.../1366843`. | Fedora `sddm` is named at `images/kde/Containerfile:L38-L40`; actual Nordic SDDM theme presence is **UNKNOWN —** search the live SDDM theme tree in section 8. | Fedora engine package; Nordic SDDM theme source is upstream-only and not locally vendored. |
| Nordic SDDM theme | Upstream has `kde/sddm/Nordic/` with 22 files, and metadata declares the SDDM KNS dependency. | No local SDDM tree or Nordic SDDM `COPY`; image presence is **UNKNOWN**. | Upstream-only; not established as a Plasma 6-compatible installed greeter package. SDDM has its own selector and is not selected by a Plasma global-theme `contents/defaults` file (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L104-L117`). |
| Nordic wallpaper | Upstream metadata declares a wallpaper KNS dependency, but the creator `contents/defaults` has no `Wallpaper` key. | No Nordic wallpaper source is locally copied. SP+ separately copies `SPPlus-Calm` at `images/kde/Containerfile:L1004-L1005`; actual built path presence is **UNKNOWN**. | Nordic wallpaper is upstream-only in this audit; `SPPlus-Calm` is a local SP+ asset. |
| Noto Sans | Upstream defaults declare no font. The current local normalized package declares five Noto Sans keys. | The Containerfile checks for `Noto Sans` with `fc-list` at `images/kde/Containerfile:L1044-L1048`; actual font-file/package presence is **UNKNOWN —** run `fc-match 'Noto Sans'` and `fc-list : family`. | Image-checked SP+ dependency; exact owning package is not named by the current install block. |
| QML modules used by Nordic | Local QML imports include `QtQuick 2.x`, `QtQuick.Controls 1.1`, `QtQuick.Controls.Styles 1.4`, `QtGraphicalEffects 1.0`, `org.kde.plasma.core 2.0`, `org.kde.plasma.components 2.0/3.0`, `org.kde.plasma.extras 2.0`, `org.kde.plasma.private.sessions 2.0`, `org.kde.plasma.workspace.components 2.0`, `org.kde.plasma.workspace.keyboardlayout 1.0`, and `org.kde.kcoreaddons 1.0`. Evidence: `components/Battery.qml:L20-L24`, `components/KeyboardLayoutButton.qml:L20-L25`, `components/VirtualKeyboard.qml:L19-L20`, `components/WallpaperFader.qml:L20-L28`, `lockscreen/MainBlock.qml:L20-L28`, `lockscreen/LockScreenUi.qml:L20-L31`, `logout/Logout.qml:L20-L31`, and `osd/OsdItem.qml:L19-L24`. | `plasma-workspace` is installed by source at `images/kde/Containerfile:L57-L58`. Prior repository image evidence records Qt6 paths for Kirigami, CoreAddons, Plasma components, and private sessions at `docs/theme-manifests/theme-breeze.md:L209-L217`; this audit did not read the current image. Availability of every imported version/module is **UNKNOWN —** run the QML module and surface checks in section 8. | Plasma/Fedora base modules where present; no explicit current Containerfile line was identified for each versioned Qt/QML module. |
| Custom plasmoids/applets | Upstream metadata declares `plasmoids.knsrc/.../2048016`; no `contents/layouts/` is present and no local Nordic applet source was found. | No Nordic applet `COPY` or package install is present. Whether the KNS dependency is present in the image is **UNKNOWN**. | Upstream dependency metadata only; no local custom applet tree. |

## 5. Plasma 6 compatibility

This section records concrete source signs and the project’s source-derived Plasma
6 surface map. It is not a live rendering or reload verdict. The source constraint
document explicitly says the Bee host had no running graphical Plasma session
(`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L1-L3`).

| Compatibility check | Evidence | Established finding |
|---|---|---|
| LNF metadata format | Upstream uses `[Desktop Entry]` and `X-KDE-ServiceTypes=Plasma/LookAndFeel` in `metadata.desktop` (`[U2]` lines 1-13). Local uses `KPackageStructure=Plasma/LookAndFeel`, `X-Plasma-APIVersion=2`, and `metadata.json` (`theme/vendor/look-and-feel/Nordic/metadata.json:L1-L16`). | The vendored LNF metadata was converted from the upstream Plasma 5-style desktop file to a Plasma 6 JSON package marker. |
| Upstream dependency metadata | Upstream `metadata.desktop:L13` has nine `X-KPackage-Dependencies` KNS URLs. Local `metadata.json:L1-L16` has no dependency field. | The dependency declarations are not retained in the local normalized metadata. Whether that omission affects package discovery or only optional KNS installation is **UNKNOWN —** inspect the live KPackage metadata and resolver output. |
| Versioned Qt imports | `Logout.qml` imports `QtQuick 2.2`, `QtQuick.Layouts 1.2`, and `QtQuick.Controls 1.1` at `theme/vendor/look-and-feel/Nordic/contents/logout/Logout.qml:L20-L31`. `Splash.qml` starts with `import QtQuick 2.5` at `:L1`; `LockScreenUi.qml` imports `QtQuick 2.8`, `QtQuick.Controls 1.1`, and `QtGraphicalEffects 1.0` at `:L20-L30`; `OsdItem.qml` imports `QtQuick 2.14` and `QtQuick.Layouts 1.1` at `:L19-L24`. | These are concrete versioned, Plasma 5-era-looking QML imports in the exact contents tree that matches upstream. Actual compilation/loading against the target Qt6 runtime is **UNKNOWN**. |
| Versioned Plasma imports | The same files import `org.kde.plasma.core 2.0`, `org.kde.plasma.components 2.0/3.0`, `org.kde.plasma.extras 2.0`, `org.kde.plasma.private.sessions 2.0`, and related modules (`theme/vendor/look-and-feel/Nordic/contents/logout/Logout.qml:L24-L31`; `theme/vendor/look-and-feel/Nordic/contents/lockscreen/LockScreenUi.qml:L25-L31`; `theme/vendor/look-and-feel/Nordic/contents/osd/OsdItem.qml:L21-L23`). | The package carries old versioned Plasma module imports. Actual module resolution is **UNKNOWN**. |
| Lock-screen QML architecture | `contents/lockscreen/*` is present locally ([A1]). `LockScreen.qml` uses `org_kde_plasma_screenlocker_greeter_interfaceVersion` and `org_kde_plasma_screenlocker_greeter_view` at `theme/vendor/look-and-feel/Nordic/contents/lockscreen/LockScreen.qml:L20-L24` and `:L31-L55`. | The package contains a lock-screen implementation, but the source-derived Plasma 6 map says a `Plasma/LookAndFeel` package does not register `contents/lockscreen` (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L104-L116`). It is therefore shipped-but-inert for this package type unless a separate runtime path proves otherwise. |
| OSD QML architecture | `Osd.qml` imports `org.kde.plasma.core 2.0` and `org.kde.plasma.extras 2.0`, then creates `PlasmaCore.Dialog` with `OnScreenDisplay` at `theme/vendor/look-and-feel/Nordic/contents/osd/Osd.qml:L18-L37`. | The source-derived Plasma 6 map says `contents/osd/*` is ignored for a look-and-feel package; Plasma’s OSD comes from `org.kde.plasma.workspace.osd` (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L104-L116`). |
| Logout QML architecture | `Logout.qml` contains the logout signals and session model and imports the private sessions module at `theme/vendor/look-and-feel/Nordic/contents/logout/Logout.qml:L24-L45` and `:L70-L78`. | The source-derived map records `contents/logout/Logout.qml` as still loaded by `logout-greeter` in Plasma 6.7 (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L106-L117`). Actual logout display is **UNKNOWN** without a live logout observation. |
| Splash QML architecture | `Splash.qml` is present and uses relative package images (`theme/vendor/look-and-feel/Nordic/contents/splash/Splash.qml:L4-L6`, `:L28-L38`). | The source-derived map records `contents/splash/Splash.qml` as honoured by KSplash on the next session startup (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L106-L117`). The local package currently sets `ksplashrc Theme=none`, section 7. |
| Aurorae plugin ID | Upstream requests `org.kde.kwin.aurorae` (`[U2]` lines 16-18); local requests `org.kde.kwin.aurorae.v2` (`theme/vendor/look-and-feel/Nordic/contents/defaults:L28-L30`). | Plasma 6.7 source research identifies `.v2` as the new SVG Aurorae plugin configuration and describes the expected SVG/rc paths (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L65-L102`). The local change is a compatibility normalization; live KWin loading is **UNKNOWN**. |
| Aurorae file API | Local Aurorae is an SVG/rc tree with `decoration.svg`, button SVGs, `Nordicrc`, and metadata (`theme/vendor/aurorae/Nordic/metadata.desktop:L1-L10`; `[P2]`). | Plasma 6 source research says the v2 bridge recognizes this legacy SVG/rc structure, but expressly does not guarantee that every SVG renders (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L77-L84`). |
| `plasma-apply-*` assumptions | The Nordic package itself contains no command invocation. SP+ calls `plasma-apply-lookandfeel` in `config/spplus-apply-theme:L112-L120` and `/usr/sbin/plasma-apply-lookandfeel ... --resetLayout` in `config/spplus-first-login:L80-L86`; wallpaper uses `/usr/sbin/plasma-apply-wallpaperimage` at `config/spplus-first-login:L119-L125`. | The command names and flags are current SP+ source assumptions. Command success and resulting Plasma behavior are **UNKNOWN** in this audit. |
| No layout compatibility surface | `contents/layouts/` is absent ([A1]). | There is no Nordic JavaScript layout to test for Plasma 5 layout APIs or hard-coded panel values. |

## 6. Layout

| Check | Result | Evidence |
|---|---|---|
| `contents/layouts/*.js` present? | No. | Exact `ABSENT` result in `[A1]`; the upstream LNF inventory also contains no `contents/layouts/` for Nordic. |
| Panels created | None declared by the Nordic package. | No layout script; `theme/vendor/look-and-feel/Nordic/contents/defaults:L1-L35` has no layout declaration. |
| Applets/order/edge/size | None declared by the Nordic package. | No layout script in `[A1]`. |
| Hard-coded absolute paths in a layout | Not applicable because there is no layout file. | `[A1]`. |
| Hard-coded username in a layout | Not applicable because there is no layout file. | `[A1]`. |
| Locked widget in a layout | Not applicable because there is no layout file. | `[A1]`. |
| Machine-specific values in a layout | Not applicable because there is no layout file. | `[A1]`. |

The relative image paths in `contents/splash/Splash.qml` are QML asset references,
not layout-script paths (`theme/vendor/look-and-feel/Nordic/contents/splash/Splash.qml:L4-L6` and `:L28-L38`).

## 7. SP+ divergences

For this section, **creator baseline** means the upstream defaults and metadata in
section 3. **Current SP+ path** means the local normalized package plus the current
Containerfile/helper/first-login source. No built-image or live-session result is
being asserted. The labels are limited to the three classifications required by the
brief.

### Upstream creator values versus the local normalized package

| Divergence | Classification | Evidence |
|---|---|---|
| Upstream LNF metadata is `metadata.desktop`; the local package supplies `metadata.json`, adds `X-Plasma-APIVersion=2`, and keeps `Id=Nordic`. | `REQUIRED-COMPAT` | Upstream `[U2]` lines 1-13; local `theme/vendor/look-and-feel/Nordic/metadata.json:L1-L16`; provenance records that Nordic shipped only Plasma 5 `metadata.desktop` at `theme/vendor/PROVENANCE.md:L21-L23`. |
| Upstream `X-KPackage-Dependencies` contains nine KNS URLs; local `metadata.json` omits the field entirely. | `UNEXPLAINED` | Upstream `[U2]` line 13; local metadata complete file `theme/vendor/look-and-feel/Nordic/metadata.json:L1-L16`. No Nordic-specific reason for removing the dependency declaration appears in the audited source. |
| `widgetStyle` changes from creator `kvantum` to local `Breeze`. | `SP+-POLICY` | Upstream `[U2]` lines 1-2; local defaults `theme/vendor/look-and-feel/Nordic/contents/defaults:L16-L17`; SP+ records the rationale that Kvantum’s active skin is outside the look-and-feel package and a Kvantum selection would leave the desktop half-changed at `theme/vendor/PROVENANCE.md:L36-L43`. |
| Icon theme changes from creator `candy-Nordic-green` to `Papirus-Dark`. | `REQUIRED-COMPAT` | Upstream `[U2]` lines 7-8; provenance records that Nordic does not ship `candy-Nordic-green` at `theme/vendor/PROVENANCE.md:L27-L30`; local value is `theme/vendor/look-and-feel/Nordic/contents/defaults:L13-L14`; Papirus source package/check is `images/kde/Containerfile:L1037-L1045`. |
| Plasma desktop theme changes from creator `Nordic` to `breeze-dark`. | `REQUIRED-COMPAT` | Upstream `[U2]` lines 13-14; provenance records that Nordic does not ship its named Plasma desktop theme at `theme/vendor/PROVENANCE.md:L27-L30`; local value is `theme/vendor/look-and-feel/Nordic/contents/defaults:L22-L23`. |
| Aurorae library changes from creator `org.kde.kwin.aurorae` to `org.kde.kwin.aurorae.v2`. | `REQUIRED-COMPAT` | Upstream `[U2]` lines 16-17; local value `theme/vendor/look-and-feel/Nordic/contents/defaults:L28-L30`; the validator rejects the unsuffixed plugin at `theme/tools/validate-global-themes.py:L7-L15` and `L112-L115`; Plasma 6 constraint at `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L65-L84`. |
| Five Noto Sans font keys are added although the creator defaults contain no font keys. | `SP+-POLICY` | Upstream complete defaults `[U2]` lines 1-20; local keys `theme/vendor/look-and-feel/Nordic/contents/defaults:L5-L11`; helper’s SP+ font block at `config/spplus-apply-theme:L30-L40` and conditional extension at `:L122-L127`. |
| `Wallpaper:Image=SPPlus-Calm` is added although the creator defaults contain no wallpaper key. | `SP+-POLICY` | Upstream complete defaults `[U2]` lines 1-20; local key `theme/vendor/look-and-feel/Nordic/contents/defaults:L25-L26`; retained SP+ wallpaper copy at `images/kde/Containerfile:L1004-L1005`. |
| Fixed titlebar button keys are added: `ButtonsOnLeft=` and `ButtonsOnRight=IAX`. | `SP+-POLICY` | Upstream defaults end without button keys at `[U2]` lines 16-20; local keys are `theme/vendor/look-and-feel/Nordic/contents/defaults:L28-L32`; the current project decision explicitly names fixed titlebar buttons among the forced values to be distinguished from creator declarations at `docs/ledger/DECISION-2026-08-30-theme-fidelity.md:L23-L29`. |
| `ksplashrc:KSplash:Theme=none` is added although the creator defaults contain no splash selector. | `SP+-POLICY` | Upstream complete defaults `[U2]` lines 1-20; local key `theme/vendor/look-and-feel/Nordic/contents/defaults:L34-L35`; the project decision identifies `KSplash=none` as a forced override at `docs/ledger/DECISION-2026-08-30-theme-fidelity.md:L23-L29`. |
| The upstream Nordic Kvantum and SDDM support trees are not represented in the local normalized package. | `UNEXPLAINED` | Upstream tree counts and paths `[A1]`; local vendor inventory and copy mappings in section 2; no Nordic-specific explanation for these omissions appears in the audited source. |

The declared `ColorScheme=Nordic`, `cursorTheme=Nordic-cursors`, and Aurorae theme
name `__aurorae__svg__Nordic` are unchanged between upstream and local defaults.
Evidence: upstream `[U2]` lines 4-18 and local defaults
`theme/vendor/look-and-feel/Nordic/contents/defaults:L5-L6`, `:L19-L20`, and
`:L28-L30`.

### Current runtime/default behavior versus the creator baseline

| Divergence | Classification | Evidence |
|---|---|---|
| Plasma 6 does not register `contents/lockscreen/*` or `contents/osd/*` for a `Plasma/LookAndFeel` package, even though Nordic ships both trees. | `REQUIRED-COMPAT` | Nordic files are present in `[A1]`; the source-derived Plasma 6 surface map says `lockscreen` and `osd` are ignored at `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L104-L116`. |
| The current image build inputs disable automatic screen locking with `Autolock=false`, a setting not declared by the creator defaults. | `UNEXPLAINED` | `config/kscreenlockerrc:L1-L2`; copied and checked by `images/kde/Containerfile:L1113-L1134`; creator defaults have no `kscreenlockerrc` group (`[U2]` lines 1-20). Manual lock behavior and the effective greeter package remain **UNKNOWN**. |
| The system cursor fallback is `breeze_cursors`, while the Nordic package declares `Nordic-cursors`. | `REQUIRED-COMPAT` | System fallback is `config/kcminputrc:L1-L17`; the source records early session startup and `--resetLayout` wiping the user cursor file at `config/kcminputrc:L3-L15` and `config/spplus-first-login:L226-L250`; Nordic’s local declaration is `theme/vendor/look-and-feel/Nordic/contents/defaults:L19-L20`. `spplus-apply-theme` writes the package cursor at `config/spplus-apply-theme:L129-L134`, so the effective post-Welcome-selection cascade is **UNKNOWN —** run the cursor readback in section 8. |
| A fresh image selects Windows Modern Dark rather than Nordic; Nordic is a selectable package, not the system default. | `SP+-POLICY` | `/etc/xdg/kdeglobals` names `WindowsModernDark` and its package at `images/kde/Containerfile:L1051-L1069`; `/etc/xdg/plasmarc` names `Windows-modern-dark` at `:L1070-L1073`; first-login hard-codes the Windows LNF at `config/spplus-first-login:L17-L23`. |
| First login applies the SP+ wallpaper rather than leaving wallpaper silent as in the creator defaults. | `SP+-POLICY` | `config/spplus-first-login:L17-L23` sets `WALLPAPER=/usr/share/wallpapers/SPPlus-Calm`; the apply/readback loop is at `:L102-L131`; creator defaults have no wallpaper key (`[U2]` lines 1-20). |
| Plymouth’s boot splash is SP+ branding, separate from the Nordic KSplash QML asset. | `SP+-POLICY` | The Containerfile copies `sp-plus-splash.png` into the Plymouth theme at `images/kde/Containerfile:L708-L723` and sets the default Plymouth theme at `:L773-L780`; Nordic’s KSplash asset is under `contents/splash/` ([A1]). |
| The helper invokes `org.kde.KGlobalSettings.notifyChange` as a D-Bus method, although Plasma 6.7 exposes it as a signal. | `UNEXPLAINED` | Helper method calls are at `config/spplus-apply-theme:L78-L93`; the source-derived interface and missing-method result are recorded at `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L32-L51`. |
| Helper subprocess failures are swallowed: `kwriteconfig6`, `plasma-apply-lookandfeel`, wallpaper apply, KWin reconfigure, and notify calls use `check=False`; the helper still returns 0. | `UNEXPLAINED` | `config/spplus-apply-theme:L72-L93`, `:L112-L146`; the current project decision records the same behavior at `docs/ledger/DECISION-2026-08-30-theme-fidelity.md:L9-L21`. |
| Welcome treats the helper’s return code as the apply result and does not perform per-key readback. | `UNEXPLAINED` | `welcome/welcome.py:L885-L897` sets `ok = result.returncode == 0`; the helper’s unconditional successful return path is `config/spplus-apply-theme:L141-L146`. |

`contents/logout/Logout.qml` is not listed as a divergence: the source-derived Plasma
6 map records logout as a live `logout-greeter` consumer
(`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L106-L117`). Actual visual use remains
**UNKNOWN** without logging out. `contents/splash` is copied but locally neutralized
by `Theme=none`; that is covered in the normalized-value table and Plymouth row above.

## 8. Verification plan

Run these as the advisor inside a live Plasma 6 session. Each row is an independent
command that can exit nonzero. `kreadconfig6` is used for the effective KConfig
cascade, not just a user file, consistent with `config/spplus-first-login:L42-L64`.
No command below was run during this source-only audit.

### Package discovery and image assets

| Assertion | Failing command |
|---|---|
| Nordic is discoverable by Plasma | `grep -Fx -- 'Nordic' < <(plasma-apply-lookandfeel --list)` |
| Nordic JSON metadata exists | `test -f /usr/share/plasma/look-and-feel/Nordic/metadata.json` |
| Nordic metadata ID matches its directory | `python3 -c 'import json; p="/usr/share/plasma/look-and-feel/Nordic/metadata.json"; assert json.load(open(p))["KPlugin"]["Id"] == "Nordic"'` |
| Upstream `metadata.desktop` is not left as the active LNF metadata file | `test ! -e /usr/share/plasma/look-and-feel/Nordic/metadata.desktop` |
| Nordic defaults exists | `test -f /usr/share/plasma/look-and-feel/Nordic/contents/defaults` |
| Nordic colour file exists | `test -f /usr/share/color-schemes/Nordic.colors` |
| Nordic cursor directory exists | `test -d /usr/share/icons/Nordic-cursors` |
| Nordic Aurorae directory exists | `test -d /usr/share/aurorae/themes/Nordic` |
| Nordic Aurorae main SVG exists | `test -f /usr/share/aurorae/themes/Nordic/decoration.svg` |
| Nordic Aurorae rc exists | `test -f /usr/share/aurorae/themes/Nordic/Nordicrc` |
| Creator-named icon dependency exists | `test -d /usr/share/icons/candy-Nordic-green` |
| Creator-named Plasma desktop-theme dependency exists | `test -d /usr/share/plasma/desktoptheme/Nordic` |
| Upstream Nordic Kvantum skin exists | `test -d /usr/share/Kvantum/Nordic` |
| Upstream Nordic Kvantum config exists | `test -f /usr/share/Kvantum/Nordic/Nordic.kvconfig` |
| Any Nordic SDDM theme directory exists | `test -n "$(find /usr/share -type d -path '*/sddm*' -name Nordic -print -quit)"` |
| SP+ wallpaper replacement exists | `test -d /usr/share/wallpapers/SPPlus-Calm` |
| Qt/Fedora Kvantum package is installed | `rpm -q kvantum` |
| Noto Sans resolves | `fc-match -f '%{family}\n' 'Noto Sans' \| grep -Fx 'Noto Sans'` |
| Global-theme semantic gate passes | `python3 /usr/libexec/spplus-validate-global-themes --root /` |
| Nordic layout is absent as the source package says | `test ! -e /usr/share/plasma/look-and-feel/Nordic/contents/layouts` |

### Creator-reference readbacks

These rows intentionally read the creator values from section 3. They can fail on
the current normalized package; that failure is evidence of the divergence, not a
passing expectation for the current SP+ package.

| Creator key | Failing readback command |
|---|---|
| `kdeglobals:KDE:widgetStyle=kvantum` | `test "$(kreadconfig6 --file kdeglobals --group KDE --key widgetStyle)" = 'kvantum'` |
| `kdeglobals:General:ColorScheme=Nordic` | `test "$(kreadconfig6 --file kdeglobals --group General --key ColorScheme)" = 'Nordic'` |
| `kdeglobals:Icons:Theme=candy-Nordic-green` | `test "$(kreadconfig6 --file kdeglobals --group Icons --key Theme)" = 'candy-Nordic-green'` |
| `kcminputrc:Mouse:cursorTheme=Nordic-cursors` | `test "$(kreadconfig6 --file kcminputrc --group Mouse --key cursorTheme)" = 'Nordic-cursors'` |
| `plasmarc:Theme:name=Nordic` | `test "$(kreadconfig6 --file plasmarc --group Theme --key name)" = 'Nordic'` |
| `kwinrc:org.kde.kdecoration2:library=org.kde.kwin.aurorae` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key library)" = 'org.kde.kwin.aurorae'` |
| `kwinrc:org.kde.kdecoration2:theme=__aurorae__svg__Nordic` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key theme)" = '__aurorae__svg__Nordic'` |

### Current local normalized package readbacks

| Local key | Failing readback command |
|---|---|
| `ColorScheme` | `test "$(kreadconfig6 --file kdeglobals --group General --key ColorScheme)" = 'Nordic'` |
| `font` | `test "$(kreadconfig6 --file kdeglobals --group General --key font)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `menuFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key menuFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `toolBarFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key toolBarFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `activeFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key activeFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `smallestReadableFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key smallestReadableFont)" = 'Noto Sans,9,-1,5,50,0,0,0,0,0'` |
| `Icons:Theme` | `test "$(kreadconfig6 --file kdeglobals --group Icons --key Theme)" = 'Papirus-Dark'` |
| `KDE:widgetStyle` | `test "$(kreadconfig6 --file kdeglobals --group KDE --key widgetStyle)" = 'Breeze'` |
| `Mouse:cursorTheme` | `test "$(kreadconfig6 --file kcminputrc --group Mouse --key cursorTheme)" = 'Nordic-cursors'` |
| `plasmarc:Theme:name` | `test "$(kreadconfig6 --file plasmarc --group Theme --key name)" = 'breeze-dark'` |
| `kwinrc:org.kde.kdecoration2:library` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key library)" = 'org.kde.kwin.aurorae.v2'` |
| `kwinrc:org.kde.kdecoration2:theme` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key theme)" = '__aurorae__svg__Nordic'` |
| `kwinrc:org.kde.kdecoration2:ButtonsOnLeft` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key ButtonsOnLeft)" = ''` |
| `kwinrc:org.kde.kdecoration2:ButtonsOnRight` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key ButtonsOnRight)" = 'IAX'` |
| `ksplashrc:KSplash:Theme` | `test "$(kreadconfig6 --file ksplashrc --group KSplash --key Theme)" = 'none'` |
| `Wallpaper:Image=SPPlus-Calm` in live desktop config | `grep -Fq '/usr/share/wallpapers/SPPlus-Calm' "$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"` |

### Runtime load checks for non-keyed surfaces

| Surface | Failing check or live observation |
|---|---|
| KWin decoration plugin loaded, not merely requested | `info=$(qdbus-qt6 org.kde.KWin /KWin org.kde.KWin.supportInformation); printf '%s\n' "$info" \| grep -Fq 'Plugin: org.kde.kwin.aurorae.v2'` |
| KWin decoration theme loaded | `info=$(qdbus-qt6 org.kde.KWin /KWin org.kde.KWin.supportInformation); printf '%s\n' "$info" \| grep -Fq 'Theme: __aurorae__svg__Nordic'` |
| Qt style plugin loads as Breeze rather than a fallback | `QT_QPA_PLATFORM=offscreen python3 -c 'from PySide6.QtWidgets import QApplication; a=QApplication([]); n=a.style().metaObject().className(); print(n); assert "breeze" in n.lower()'` |
| Lock-screen asset is installed | `test -f /usr/share/plasma/look-and-feel/Nordic/contents/lockscreen/LockScreen.qml` |
| Lock-screen Nordic QML is actually used | No persistent LNF key proves this. Lock the session, observe the greeter, unlock, and record the loaded package; the source map predicts no LNF registration (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L108-L116`). |
| Logout asset is installed | `test -f /usr/share/plasma/look-and-feel/Nordic/contents/logout/Logout.qml` |
| Logout QML is actually used | No non-destructive config readback proves this. Log out after saving work and observe the logout greeter. |
| Splash asset is installed | `test -f /usr/share/plasma/look-and-feel/Nordic/contents/splash/Splash.qml` |
| Splash selection is the current normalized value | `test "$(kreadconfig6 --file ksplashrc --group KSplash --key Theme)" = 'none'` |
| Nordic OSD asset is installed | `test -f /usr/share/plasma/look-and-feel/Nordic/contents/osd/Osd.qml` |
| Nordic OSD QML is actually used | No LNF OSD selector exists in the source-derived Plasma 6 map. Trigger a volume/brightness OSD and record the runtime package; do not treat the file-existence check as activation proof. |
| Automatic locking matches current SP+ seed | `test "$(kreadconfig6 --file kscreenlockerrc --group Daemon --key Autolock)" = 'false'` |

## 9. Open questions for Christopher

- Should Nordic retain the current Breeze/Papirus/breeze-dark normalization, or should its creator-declared Kvantum, icon, and Plasma desktop assets be restored as selectable dependencies?
- Should the upstream Nordic Kvantum skin and SDDM theme be brought into the local vendored package?
- Should `Noto Sans`, `SPPlus-Calm`, fixed titlebar buttons, and `ksplashrc Theme=none` remain overrides when Nordic is selected?
- Should `Nordic-cursors` replace the system `breeze_cursors` fallback after the first-login cursor-reset behavior is addressed?
- Should Nordic’s shipped lock-screen and OSD trees remain in the image when the Plasma 6 package map marks those paths inert?
- Should the optional upstream `NordicDarker.colors` and `nordicbluish.colors` files be included as selectable colour schemes?
- Should the upstream `X-KPackage-Dependencies` metadata be retained in a future Nordic package, or remain omitted from the SP+ normalized metadata?
