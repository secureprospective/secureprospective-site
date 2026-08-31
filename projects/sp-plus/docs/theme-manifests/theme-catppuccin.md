# Catppuccin Mocha and Latte theme manifest

ID: `theme-catppuccin`  
Scope: `theme/vendor/look-and-feel/Catppuccin-Mocha`,
`Catppuccin-Latte`, `theme/vendor/aurorae/CatppuccinMocha-Classic`,
`CatppuccinLatte-Classic`, and Catppuccin colour schemes under
`theme/vendor/color-schemes`.

**Result:** the vendored content is an SP+ normalized subset, not the complete
upstream generated/install output. The two local Aurorae Classic trees and the
two local Blue colour schemes are byte-identical to their corresponding files at
the pinned upstream commit, but the local look-and-feel packages and their
installed asset set are deliberately different and much smaller (E2, E3).

## Evidence convention

Repo citations use `repo-relative-path:Lx-Ly`. `U` citations are immutable URLs at
upstream commit `6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2`.
`E` citations are exact read-only commands and outputs from this audit. In compact
local evidence cells, a leading `.../Catppuccin-Mocha/...` or
`.../Catppuccin-Latte/...` expands to the full corresponding path under
`theme/vendor/look-and-feel/`; `.../contents/defaults` means the relevant one of
those two full defaults paths. No build, image mutation, code edit, or live Plasma
session was performed.

### Pinned upstream references

| ID | Source |
|---|---|
| U1 | Upstream development/build description: `https://github.com/catppuccin/kde/blob/6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2/README.md#L64-L78` |
| U2 | Upstream pinned build recipe: `https://github.com/catppuccin/kde/blob/6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2/justfile#L1-L25` |
| U3 | Upstream installer: `https://github.com/catppuccin/kde/blob/6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2/install.sh` |
| U4 | Upstream Classic/Blue Mocha defaults: `https://github.com/catppuccin/kde/blob/6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2/generated/look-and-feel/Classic/Catppuccin-Mocha-Blue/contents/defaults#L1-L19` |
| U5 | Upstream Classic/Blue Latte defaults: `https://github.com/catppuccin/kde/blob/6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2/generated/look-and-feel/Classic/Catppuccin-Latte-Blue/contents/defaults#L1-L19` |
| U6 | Upstream generated global/splash metadata and QML: `https://github.com/catppuccin/kde/tree/6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2/generated/splash` and `https://github.com/catppuccin/kde/blob/6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2/generated/splash-qml/CatppuccinMocha-Splash.qml#L1-L89` |
| U7 | Upstream Classic/Blue metadata: `https://github.com/catppuccin/kde/blob/6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2/generated/look-and-feel/Classic/Catppuccin-Mocha-Blue/metadata.json#L1-L21` and `https://github.com/catppuccin/kde/blob/6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2/generated/look-and-feel/Classic/Catppuccin-Latte-Blue/metadata.json#L1-L21` |
| U8 | Plasma 6.7 source findings recorded in `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L65-L117` |

### Exact audit evidence

**E1. Upstream ref identity**

```text
$ git -C /tmp/catppuccin-kde-audit describe --tags --exact-match HEAD
v0.4.0
$ git -C /tmp/catppuccin-kde-audit show -s --format='%H%n%h%n%an%n%ad%n%s' --date=iso-strict HEAD
6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2
6606b51
Lyra
2026-08-05T20:35:26Z
chore(release): 0.4.0 (#150)
$ git -C /tmp/catppuccin-kde-audit show-ref --tags --dereference | grep '6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2\|v0.4.0' | tail -4
8969ae9d6712135170fc6e14a6074a6af617f166 refs/tags/v0.4.0
6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2 refs/tags/v0.4.0^{}
```

**E2. Upstream/local inventory counts**

```text
upstream generated LNF dirs: 112
upstream generated LNF files: 336
upstream generated color files: 56
upstream generated splash dirs: 56
upstream Aurorae dirs: 9
local Cat LNF dirs: 2
local Cat LNF files: 4
local Cat color files: 2
local Cat Aurorae dirs: 2
local Cat Aurorae files: 20
```

The upstream Aurorae count includes the `Common` directory; the other eight are
flavour/style theme directories. The upstream generated look-and-feel count is
14 accents for each of four flavours and two decoration styles, as also exposed
by the installer's flavour/accent/style prompts (`U3`, lines 114-119, 150-164,
227-230).

**E3. Byte comparisons**

```text
$ diff -qr theme/vendor/aurorae/CatppuccinMocha-Classic /tmp/catppuccin-kde-audit/Resources/Aurorae/CatppuccinMocha-Classic; printf 'diff_status=%s\n' "$?"
diff_status=0
$ diff -qr theme/vendor/aurorae/CatppuccinLatte-Classic /tmp/catppuccin-kde-audit/Resources/Aurorae/CatppuccinLatte-Classic; printf 'diff_status=%s\n' "$?"
diff_status=0
$ cmp -s theme/vendor/color-schemes/CatppuccinMochaBlue.colors /tmp/catppuccin-kde-audit/generated/color-schemes/CatppuccinMochaBlue.colors; printf '%s cmp_status=%s\n' theme/vendor/color-schemes/CatppuccinMochaBlue.colors "$?"
theme/vendor/color-schemes/CatppuccinMochaBlue.colors cmp_status=0
$ cmp -s theme/vendor/color-schemes/CatppuccinLatteBlue.colors /tmp/catppuccin-kde-audit/generated/color-schemes/CatppuccinLatteBlue.colors; printf '%s cmp_status=%s\n' theme/vendor/color-schemes/CatppuccinLatteBlue.colors "$?"
theme/vendor/color-schemes/CatppuccinLatteBlue.colors cmp_status=0
```

**E4. Local license, generator, and package-surface checks**

```text
$ find theme/vendor -maxdepth 3 -type f \( -iname 'LICENSE*' -o -iname 'COPYING*' -o -iname 'NOTICE*' \) -print
(no output)
$ find . -type f -name 'normalize.py' -not -path './.git/*' -print
(no output)
$ find theme/tools -maxdepth 2 -type f -printf '%P\n' | sort
generate-spplus-calm-theme.py
generate-spplus-calm-wallpaper.sh
theme-pull-from-vm.sh
theme-push-to-vm.sh
validate-global-themes.py
validate-spplus-calm.sh
$ find theme/vendor/look-and-feel/Catppuccin-Mocha theme/vendor/look-and-feel/Catppuccin-Latte -type f -printf '%P\n' | sort
contents/defaults
metadata.json
contents/defaults
metadata.json
```

**E5. Local Catppuccin external-root and required-name checks**

```text
$ find theme/vendor/desktoptheme theme/vendor/cursors theme/vendor/Kvantum theme/vendor/icons -maxdepth 2 -iname '*catppuccin*' -print
(no output)
$ test -e theme/vendor/aurorae/CatppuccinMocha-Classic/CatppuccinMocha-Classicrc || echo 'ABSENT Mocha Classic rc'
ABSENT Mocha Classic rc
$ test -e theme/vendor/aurorae/CatppuccinLatte-Classic/CatppuccinLatte-Classicrc || echo 'ABSENT Latte Classic rc'
ABSENT Latte Classic rc
$ test -e theme/vendor/cursors/catppuccin-mocha-blue-cursors || echo 'ABSENT Mocha Blue cursor tree'
ABSENT Mocha Blue cursor tree
$ test -e theme/vendor/cursors/catppuccin-latte-blue-cursors || echo 'ABSENT Latte Blue cursor tree'
ABSENT Latte Blue cursor tree
```

**E6. Static image path does not invoke the upstream installer**

```text
$ grep -n -E 'catppuccin/(cursors|kde)|install\.sh' images/kde/Containerfile
(no output)
```

**E7. Upstream defaults have no icon-theme key and upstream has no icon/cursor tree**

```text
$ find /tmp/catppuccin-kde-audit -type d \( -iname '*icon*' -o -iname '*cursor*' \) -print | sort
(no output)
$ grep -n -E '^(\[|[A-Za-z].*=)' /tmp/catppuccin-kde-audit/generated/look-and-feel/Classic/Catppuccin-Mocha-Blue/contents/defaults
1:[kdeglobals][General]
2:ColorScheme=CatppuccinMochaBlue
4:[kcminputrc][Mouse]
5:cursorTheme=catppuccin-mocha-blue-cursors
7:[kwinrc][org.kde.kdecoration2]
8:ButtonsOnLeft=
9:ButtonsOnRight=IAX
10:library=org.kde.kwin.aurorae
11:theme=__aurorae__svg__CatppuccinMocha-Classic
12:BorderSize=None
13:BorderSizeAuto=false
15:[plasmarc][Theme]
16:name=default
18:[KSplash]
19:Theme=Catppuccin-Mocha-Blue-splash
```

## 1. Provenance

| Item | Evidence | Finding |
|---|---|---|
| Upstream project/ref | `theme/vendor/PROVENANCE.md:L6-L8`; E1 | The repository records `github.com/catppuccin/kde`, `v0.4.0`, MIT. The fetched `v0.4.0` tag resolves to commit `6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2`. |
| Upstream license | Upstream `LICENSE` at `https://github.com/catppuccin/kde/blob/6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2/LICENSE#L1-L22` | Upstream license is MIT. |
| Local package metadata | `theme/vendor/look-and-feel/Catppuccin-Mocha/metadata.json:L1-L15`; `theme/vendor/look-and-feel/Catppuccin-Latte/metadata.json:L1-L15` | Both local global packages state MIT and the Catppuccin website, but their local metadata version is `1.0`, not upstream's `0.4.0`. |
| Local Aurorae metadata | `theme/vendor/aurorae/CatppuccinMocha-Classic/metadata.json:L10-L17`; `theme/vendor/aurorae/CatppuccinLatte-Classic/metadata.json:L10-L17` | Both state MIT and version `0.4.0`; their `Dependencies` arrays are empty. |
| Local package license file | E4 | No `LICENSE`, `COPYING`, or `NOTICE` file was found under the searched `theme/vendor` depth. The local metadata and provenance record the MIT license; a copied package-local license file is absent. |
| Upstream generation model | U1, U2 | Upstream README says templates are rendered by Whiskers into committed `generated/` output and that `install.sh` reads `generated/`; the Justfile's `build` target renders templates and `check` compares generated output. |
| Local generator claim | Local defaults header `theme/vendor/look-and-feel/Catppuccin-Mocha/contents/defaults:L1-L3`; Latte corresponding `:L1-L3`; E4 | The local defaults say `Generated by SP+ normalize.py`, but no `normalize.py` exists in this checkout. `theme/tools/` contains a validator and other scripts, not that named generator (E4). |
| Local versus upstream tree | E2, E3; local metadata/defaults at the paths above; upstream U4/U5/U7 | Local Aurorae Classic trees and Blue colour schemes match their upstream counterparts byte-for-byte. The local look-and-feel packages do not: local has two two-file packages; the corresponding upstream generated packages have `metadata.desktop`, `metadata.json`, and `contents/defaults`, and upstream installation adds previews and splash content. |
| Subset conclusion | E2, `theme/vendor/PROVENANCE.md:L34-L46`, `docs/ledger/DECISION-cycle36-drop-custom-global-themes.md:L56-L70` | This is a two-flavour, Blue-accent, Classic-only SP+ subset. It is not the complete upstream generated matrix or the upstream install result. |

The current pinned upstream generated metadata uses `Catppuccin-Mocha-Blue` and
`Catppuccin-Latte-Blue` as both the directory/package IDs (`U7`, metadata
`L14`). The local IDs are shortened to `Catppuccin-Mocha` and
`Catppuccin-Latte`, and those IDs match their local directory names (`E4`,
`theme/vendor/look-and-feel/Catppuccin-Mocha/metadata.json:L4-L6`, and the Latte
file's corresponding lines). The provenance note about an upstream ID/path
mismatch is at `theme/vendor/PROVENANCE.md:L24-L26`; the inspected v0.4.0
Classic/Blue metadata itself has matching ID and directory names.

## 2. Shipped assets

The current image path uses static `COPY` statements rather than running the
upstream installer (E6). The relevant Containerfile copies are broad directory
copies, so every file currently present under the local Catppuccin roots is in a
copy source.

| Local contribution | Image destination | How it is copied | Evidence |
|---|---|---|---|
| `theme/vendor/look-and-feel/Catppuccin-Mocha/` | `/usr/share/plasma/look-and-feel/Catppuccin-Mocha/` | The whole look-and-feel vendor root is copied. | `images/kde/Containerfile:L1013` |
| `theme/vendor/look-and-feel/Catppuccin-Latte/` | `/usr/share/plasma/look-and-feel/Catppuccin-Latte/` | Same broad look-and-feel copy. | `images/kde/Containerfile:L1013` |
| `theme/vendor/aurorae/CatppuccinMocha-Classic/` | `/usr/share/aurorae/themes/CatppuccinMocha-Classic/` | The whole Aurorae vendor root is copied. | `images/kde/Containerfile:L1014` |
| `theme/vendor/aurorae/CatppuccinLatte-Classic/` | `/usr/share/aurorae/themes/CatppuccinLatte-Classic/` | Same broad Aurorae copy. | `images/kde/Containerfile:L1014` |
| `theme/vendor/color-schemes/CatppuccinMochaBlue.colors` | `/usr/share/color-schemes/CatppuccinMochaBlue.colors` | The whole colour-scheme vendor root is copied. | `images/kde/Containerfile:L1015`; local file identity at `theme/vendor/color-schemes/CatppuccinMochaBlue.colors:L127-L128` |
| `theme/vendor/color-schemes/CatppuccinLatteBlue.colors` | `/usr/share/color-schemes/CatppuccinLatteBlue.colors` | Same broad colour-scheme copy. | `images/kde/Containerfile:L1015`; local file identity at `theme/vendor/color-schemes/CatppuccinLatteBlue.colors:L127-L128` |

### Local files not copied

No local file in the audited Catppuccin look-and-feel, Aurorae, or colour-scheme
roots is outside a Containerfile copy root (E2, E4, `images/kde/Containerfile:L1013-L1015`). Therefore no **present local** Catppuccin asset was found to be
silently dropped by a `COPY` statement.

The following are not silently dropped local files; they are upstream assets that
are absent before the SP+ copy stage:

| Upstream asset/action | Upstream evidence | Current SP+ source result |
|---|---|---|
| `Resources/Aurorae/Common/Catppuccin-Classicrc` and `CatppuccinLatte-Classicrc` | The installer copies a flavour-specific Common rc into the Aurorae theme at `U3`, lines 335-346. | Neither required rc file is in the local Aurorae trees (E5). The Containerfile has no separate Common-rc copy. |
| `Resources/LookAndFeel/Catppuccin-Mocha-Global/contents/previews/{preview.png,fullscreenpreview.jpg}` and the Latte equivalent | `InstallGlobalTheme` copies the global resource directory at `U3`, lines 348-355; the upstream resource inventory contains the two preview files. | The local look-and-feel directories have no `contents/previews/` files (E4). |
| Generated splash QML, busy widget, logo, splash metadata, and `contents/previews/splash.png` | `BuildSplashScreen` builds/copies these at `U3`, lines 315-333, and `InstallGlobalTheme` invokes it at lines 414-416. | No local Catppuccin look-and-feel package has `contents/splash/` or splash previews (E4). |
| Upstream `metadata.desktop` for each global package | `U3`, lines 353-354; upstream Classic/Blue package inventory in E2/U4/U5. | Local global packages contain `metadata.json` and `contents/defaults` only (E4). |

### Cross-tree assets named by the local defaults

These are not Catppuccin vendor directories, but they are named by the local
package declarations in §3B.

| Named asset | Source/image evidence | Status established by this audit |
|---|---|---|
| `SPPlus-Calm` wallpaper | Local defaults `theme/vendor/look-and-feel/Catppuccin-Mocha/contents/defaults:L25-L26` and Latte corresponding lines; `images/kde/Containerfile:L1004-L1005` copies it and `L1092-L1093` checks its image contents. | The Containerfile declares the copy and checks the package during a build; no build was run here. |
| `Papirus-Dark` / `Papirus` icons | `images/kde/Containerfile:L1037-L1048` requests `papirus-icon-theme` and `papirus-icon-theme-dark`, checks `/usr/share/icons/Papirus-Dark`, and checks Noto fonts. | `Papirus-Dark` has a declared build-time path check. A separate light `/usr/share/icons/Papirus` path check is not present; runtime presence of that exact directory is **UNKNOWN —** run `test -d /usr/share/icons/Papirus` in the built image. |
| `breeze_cursors` | `images/kde/Containerfile:L1113-L1114` copies the system cursor config and `L1132-L1134` checks the value and directory. The prior image ownership inventory records `breeze-cursor-theme` at `docs/theme-manifests/theme-breeze.md:L48-L65`. | Fedora/Plasma-provided source is recorded; no build was run in this audit. |
| `breeze-dark` / `breeze-light` Plasma desktop theme names | Local defaults `...Catppuccin-Mocha/contents/defaults:L22-L23` and Latte `:L22-L23`; no Catppuccin desktoptheme root exists in E5. | A known prior image inventory establishes `/usr/share/plasma/desktoptheme/default`, not these two names (`docs/theme-manifests/theme-breeze.md:L61-L71`). Exact built-image presence of `breeze-dark` and `breeze-light` is **UNKNOWN —** run the file checks in §8. |

## 3. Creator-intended configuration

For clarity, §3A transcribes the pinned upstream creator declaration that is the
comparison baseline. §3B transcribes the local package's own declaration, which
is what the current SP+ helper reads. The local packages correspond to the
upstream Classic/Blue variants because their colour and Aurorae names select Blue
and Classic (`theme/vendor/look-and-feel/Catppuccin-Mocha/contents/defaults:L5-L6`,
`:L28-L30`, and the corresponding Latte lines).

### 3A. Pinned upstream creator declaration

The upstream Classic/Blue packages declare the following. The upstream raw splash
header is bare `[KSplash]`; `ksplashrc:KSplash` below is the effective Plasma
surface described by the Plasma 6.7 package findings (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L104-L117`).

| Variant | File:group:key=value | Evidence |
|---|---|---|
| Mocha Classic/Blue | `kdeglobals:General:ColorScheme=CatppuccinMochaBlue` | U4, `contents/defaults:L1-L2` |
| Mocha Classic/Blue | `kcminputrc:Mouse:cursorTheme=catppuccin-mocha-blue-cursors` | U4, `contents/defaults:L4-L5` |
| Mocha Classic/Blue | `kwinrc:org.kde.kdecoration2:ButtonsOnLeft=` | U4, `contents/defaults:L7-L9` |
| Mocha Classic/Blue | `kwinrc:org.kde.kdecoration2:ButtonsOnRight=IAX` | U4, `contents/defaults:L7-L9` |
| Mocha Classic/Blue | `kwinrc:org.kde.kdecoration2:library=org.kde.kwin.aurorae` | U4, `contents/defaults:L10` |
| Mocha Classic/Blue | `kwinrc:org.kde.kdecoration2:theme=__aurorae__svg__CatppuccinMocha-Classic` | U4, `contents/defaults:L10-L11` |
| Mocha Classic/Blue | `kwinrc:org.kde.kdecoration2:BorderSize=None` | U4, `contents/defaults:L12` |
| Mocha Classic/Blue | `kwinrc:org.kde.kdecoration2:BorderSizeAuto=false` | U4, `contents/defaults:L13` |
| Mocha Classic/Blue | `plasmarc:Theme:name=default` | U4, `contents/defaults:L15-L16` |
| Mocha Classic/Blue | `ksplashrc:KSplash:Theme=Catppuccin-Mocha-Blue-splash` (raw header `[KSplash]`) | U4, `contents/defaults:L18-L19` |
| Latte Classic/Blue | `kdeglobals:General:ColorScheme=CatppuccinLatteBlue` | U5, `contents/defaults:L1-L2` |
| Latte Classic/Blue | `kcminputrc:Mouse:cursorTheme=catppuccin-latte-blue-cursors` | U5, `contents/defaults:L4-L5` |
| Latte Classic/Blue | `kwinrc:org.kde.kdecoration2:ButtonsOnLeft=` | U5, `contents/defaults:L7-L9` |
| Latte Classic/Blue | `kwinrc:org.kde.kdecoration2:ButtonsOnRight=IAX` | U5, `contents/defaults:L7-L9` |
| Latte Classic/Blue | `kwinrc:org.kde.kdecoration2:library=org.kde.kwin.aurorae` | U5, `contents/defaults:L10` |
| Latte Classic/Blue | `kwinrc:org.kde.kdecoration2:theme=__aurorae__svg__CatppuccinLatte-Classic` | U5, `contents/defaults:L10-L11` |
| Latte Classic/Blue | `kwinrc:org.kde.kdecoration2:BorderSize=None` | U5, `contents/defaults:L12` |
| Latte Classic/Blue | `kwinrc:org.kde.kdecoration2:BorderSizeAuto=false` | U5, `contents/defaults:L13` |
| Latte Classic/Blue | `plasmarc:Theme:name=default` | U5, `contents/defaults:L15-L16` |
| Latte Classic/Blue | `ksplashrc:KSplash:Theme=Catppuccin-Latte-Blue-splash` (raw header `[KSplash]`) | U5, `contents/defaults:L18-L19` |

Neither upstream defaults file declares a widget style, an icon theme, any font
key, or a wallpaper image (E7; U4/U5 complete `contents/defaults` files).

#### Upstream package metadata and final installer surfaces

| Variant | Upstream metadata declaration | Evidence |
|---|---|---|
| Mocha Classic/Blue | `KPackageStructure=Plasma/LookAndFeel`; `KPlugin.Id=Catppuccin-Mocha-Blue`; `X-KPackage-Dependencies=kns://aurorae.knsrc/api.kde-look.org/2135228` | U7, metadata `L1-L21` |
| Latte Classic/Blue | `KPackageStructure=Plasma/LookAndFeel`; `KPlugin.Id=Catppuccin-Latte-Blue`; `X-KPackage-Dependencies=kns://aurorae.knsrc/api.kde-look.org/2135222` | `https://github.com/catppuccin/kde/blob/6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2/generated/look-and-feel/Classic/Catppuccin-Latte-Blue/metadata.json#L1-L21` |
| Mocha Modern/Blue, not locally selected | Same package ID with the Modern Aurorae theme and KNS URI `.../2135229` | Pinned Modern metadata, `https://github.com/catppuccin/kde/blob/6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2/generated/look-and-feel/Modern/Catppuccin-Mocha-Blue/metadata.json#L1-L21` |
| Latte Modern/Blue, not locally selected | Same package ID with the Modern Aurorae theme and KNS URI `.../2135223` | `https://github.com/catppuccin/kde/blob/6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2/generated/look-and-feel/Modern/Catppuccin-Latte-Blue/metadata.json#L1-L21` |

The generated Classic/Blue look-and-feel directory itself contains
`contents/defaults`, `metadata.desktop`, and `metadata.json` (E2, U4/U5). The
upstream installer then adds the following content to the installed global
package:

| Final package surface | Upstream source/action | Local package |
|---|---|---|
| `contents/previews/preview.png`, `fullscreenpreview.jpg` | Copied from `Resources/LookAndFeel/Catppuccin-<flavour>-Global` at U3, lines 348-355. | Absent; local inventory has only defaults and JSON metadata (E4). |
| `contents/splash/Splash.qml` | Generated flavour QML copied at U3, lines 315-320. The QML imports `QtQuick` and `org.kde.kirigami 2` at U6, lines 10-12. | Absent. |
| `contents/splash/images/busywidget.svg` and `Logo.png` | Generated busy widget and flavour/logo copies at U3, lines 315-325. | Absent. |
| Splash package metadata in the staging tree | `BuildSplashScreen` copies generated splash `metadata.desktop` and `metadata.json` to the separate `dist/Catppuccin-*-splash` tree at U3, lines 326-327; lines 331-332 copy only that tree's `contents/splash/` and previews into the installed global package. | Not part of the local global package; local also has no splash package staging tree. |
| `contents/previews/splash.png` | Created/copied at U3, lines 328-330, then copied into the global package at lines 331-332. | Absent. |
| No `contents/layouts/`, `lockscreen/`, `loginmanager/`, `osd/`, or `logout/` in the generated Classic/Blue package | The package inventory for the generated LNF has only the three files in E2; Plasma package surface status is recorded at `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L104-L117`. | No such local directories either (E4). |

### 3B. Current local package declaration

A bare `[Wallpaper]` header is represented as
`kdeglobals:Wallpaper` because the SP+ parser assigns bare groups to
`kdeglobals` and then handles the wallpaper value separately
(`config/spplus-apply-theme:L26-L69`, `L129-L139`). The local `ksplashrc` header
is explicit.

| File:group:key | Mocha value | Latte value | Evidence |
|---|---|---|---|
| `kdeglobals:General:ColorScheme` | `CatppuccinMochaBlue` | `CatppuccinLatteBlue` | Mocha `contents/defaults:L5-L6`; Latte `:L5-L6` |
| `kdeglobals:General:font` | `Noto Sans,10,-1,5,50,0,0,0,0,0` | same | Mocha `:L7`; Latte `:L7` |
| `kdeglobals:General:menuFont` | `Noto Sans,10,-1,5,50,0,0,0,0,0` | same | Mocha `:L8`; Latte `:L8` |
| `kdeglobals:General:toolBarFont` | `Noto Sans,10,-1,5,50,0,0,0,0,0` | same | Mocha `:L9`; Latte `:L9` |
| `kdeglobals:General:activeFont` | `Noto Sans,10,-1,5,50,0,0,0,0,0` | same | Mocha `:L10`; Latte `:L10` |
| `kdeglobals:General:smallestReadableFont` | `Noto Sans,9,-1,5,50,0,0,0,0,0` | same | Mocha `:L11`; Latte `:L11` |
| `kdeglobals:Icons:Theme` | `Papirus-Dark` | `Papirus` | Mocha `:L13-L14`; Latte `:L13-L14` |
| `kdeglobals:KDE:widgetStyle` | `Breeze` | `Breeze` | Mocha `:L16-L17`; Latte `:L16-L17` |
| `kcminputrc:Mouse:cursorTheme` | `breeze_cursors` | `breeze_cursors` | Mocha `:L19-L20`; Latte `:L19-L20` |
| `plasmarc:Theme:name` | `breeze-dark` | `breeze-light` | Mocha `:L22-L23`; Latte `:L22-L23` |
| `kdeglobals:Wallpaper:Image` | `SPPlus-Calm` | `SPPlus-Calm` | Mocha `:L25-L26`; Latte `:L25-L26` |
| `kwinrc:org.kde.kdecoration2:library` | `org.kde.kwin.aurorae.v2` | same | Mocha `:L28-L30`; Latte `:L28-L30` |
| `kwinrc:org.kde.kdecoration2:theme` | `__aurorae__svg__CatppuccinMocha-Classic` | `__aurorae__svg__CatppuccinLatte-Classic` | Mocha `:L28-L30`; Latte `:L28-L30` |
| `kwinrc:org.kde.kdecoration2:ButtonsOnLeft` | empty | empty | Mocha `:L28-L32`; Latte `:L28-L32` |
| `kwinrc:org.kde.kdecoration2:ButtonsOnRight` | `IAX` | `IAX` | Mocha `:L28-L32`; Latte `:L28-L32` |
| `ksplashrc:KSplash:Theme` | `none` | `none` | Mocha `:L34-L35`; Latte `:L34-L35` |

The local declaration therefore adds or substitutes widget, icon, font, cursor,
desktop-theme, wallpaper, splash, and Aurorae plugin values relative to §3A;
those differences are classified in §7.

## 4. Dependencies

### Upstream installer dependencies and policy

The upstream installer creates user-data destinations from
`${XDG_DATA_HOME:-$HOME/.local/share}` for colour schemes, Aurorae, look-and-feel,
and icons (`U3`, lines 94-100). The current image instead copies static assets to
system `/usr/share` paths (§2).

| Dependency/operation | Upstream requirement or policy | Current SP+ image/path | Evidence |
|---|---|---|---|
| `tar` | Always checked; the installer creates a package tarball before `kpackagetool6` (`U3`, lines 273-285 and 401-412). | The Containerfile does not separately check this installer dependency. Built-image presence is **UNKNOWN —** run `command -v tar` in the image. | U3, lines 273-285, 401-412; no corresponding Containerfile check found in the audited lines. |
| `kpackagetool6` | Required for `global` and normal modes; installs or updates the Plasma/LookAndFeel tarball (`U3`, lines 279-285, 401-412). | Static image copy does not run the upstream installer (E6). The current SP+ helper does not call `kpackagetool6` (`config/spplus-apply-theme:L96-L149`). Image executable presence is **UNKNOWN —** no direct Containerfile test was found. | U3; local helper and `images/kde/Containerfile:L1013-L1024`. |
| `kwriteconfig6` | Required by the normal upstream installer checks; used in the upstream final apply step for `BorderSizeAuto=false` (`U3`, lines 281-285, 539-543). | Current helper and first-login use it, but the helper resolves it by bare command name (`config/spplus-apply-theme:L72-L75`, `L129-L134`; `config/spplus-first-login:L241-L247`). A direct image executable check is **UNKNOWN —**. | U3; local paths above. |
| `plasma-apply-lookandfeel` | Required by normal upstream mode and used to apply the generated global ID (`U3`, lines 281-285, 539-543). | The image checks `/usr/sbin/plasma-apply-lookandfeel` at `images/kde/Containerfile:L1127-L1128`; the helper calls the bare name at `config/spplus-apply-theme:L116-L118`. | U3; Containerfile and helper cited. |
| `wget` and `unzip` | Required unless `--no-cursor` or `--local-cursor` is used (`U3`, lines 273-287). | Not needed by the static `COPY` route; no upstream cursor download is invoked by the Containerfile (E6). | U3, lines 207-215, 273-287. |
| Network access to `github.com/catppuccin/cursors` | Full cursor mode downloads release `v2.0.0` zip files with `wget` (`U3`, lines 430-446). | No corresponding source/install step is in the current Containerfile (E6). | U3, lines 199-215, 430-446; E6. |
| `just` and Whiskers | Build-time upstream tools only; end users run the committed generated output and do not need Rust/Cargo (`U1`, lines 70-78; U2, lines 9-25). | Neither is a Catppuccin runtime dependency of the static image copy. The local claimed `normalize.py` generator is absent (E4). | U1/U2 and E4. |
| `X-KPackage-Dependencies` Aurorae KNS resource | Upstream generated Classic/Blue metadata declares a KNS Aurorae URI, e.g. Mocha `2135228` and Latte `2135222` (U7, metadata `L19-L21`; Latte metadata at `https://github.com/catppuccin/kde/blob/6606b5179cfc1e9ba5c3b6b70e15c468e2dddca2/generated/look-and-feel/Classic/Catppuccin-Latte-Blue/metadata.json#L19-L21`). | Local global metadata has no `X-KPackage-Dependencies` (`theme/vendor/look-and-feel/Catppuccin-Mocha/metadata.json:L1-L16`; `theme/vendor/look-and-feel/Catppuccin-Latte/metadata.json:L1-L16`), and local Aurorae metadata has empty `Dependencies` arrays. Whether the local static Aurorae files satisfy all runtime dependency semantics is **UNKNOWN —** perform the live package/load checks in §8. | U7; local metadata cited. |

### Theme/runtime dependencies

| Dependency or surface | Required by declaration | Image/source status | Packaging classification and evidence |
|---|---|---|---|
| Plasma global-theme loader | `KPackageStructure=Plasma/LookAndFeel` in both local metadata files | `plasma-workspace` is requested by the image at `images/kde/Containerfile:L54-L58`; local JSON metadata has the required package structure at both `.../metadata.json:L1-L3`. | Fedora/Plasma base package; no build/live load test here. |
| `CatppuccinMochaBlue.colors` | Local and upstream Mocha `ColorScheme` | Vendored at `theme/vendor/color-schemes/CatppuccinMochaBlue.colors`; copied by `images/kde/Containerfile:L1015`. | Vendored, byte-identical to pinned upstream (E3). |
| `CatppuccinLatteBlue.colors` | Local and upstream Latte `ColorScheme` | Vendored and copied by the same colour-scheme `COPY` (`images/kde/Containerfile:L1015`). | Vendored, byte-identical to pinned upstream (E3). |
| Upstream Mocha cursor `catppuccin-mocha-blue-cursors` | Upstream creator defaults `U4`, `contents/defaults:L4-L5` | No local Catppuccin cursor tree or upstream installer invocation exists (E5/E6). Built-image presence is **UNKNOWN —** run `test -d /usr/share/icons/catppuccin-mocha-blue-cursors`. | Upstream release download, not Fedora/vendored in the current source route; current local package substitutes `breeze_cursors`. |
| Upstream Latte cursor `catppuccin-latte-blue-cursors` | Upstream creator defaults `U5`, `contents/defaults:L4-L5` | No local tree or installer invocation exists (E5/E6). Built-image presence is **UNKNOWN —** run `test -d /usr/share/icons/catppuccin-latte-blue-cursors`. | Upstream release download, not Fedora/vendored in the current source route; current local package substitutes `breeze_cursors`. |
| Current `breeze_cursors` | Local defaults `.../contents/defaults:L19-L20` | Containerfile checks `/usr/share/icons/breeze_cursors` at `images/kde/Containerfile:L1132-L1134`; prior image inventory assigns it to `breeze-cursor-theme` (`docs/theme-manifests/theme-breeze.md:L48-L65`). | Fedora/Plasma-provided; no build run in this audit. |
| Current Papirus icons | Local Mocha/Latte defaults `.../contents/defaults:L13-L14` | DNF requests both Papirus packages and checks `Papirus-Dark` at `images/kde/Containerfile:L1037-L1048`. Exact light directory presence is **UNKNOWN —**. | Fedora package request; not vendored. |
| `Breeze` Qt widget style | Local defaults `.../contents/defaults:L16-L17` | Prior image inventory records the Qt6 Breeze style and RPM at `docs/theme-manifests/theme-breeze.md:L48-L71`; the current Containerfile retains the Plasma base installation at `images/kde/Containerfile:L54-L58`. | Fedora/Plasma Qt6 style; no live style probe here. |
| Local `breeze-dark` / `breeze-light` desktop theme | Local defaults `.../contents/defaults:L22-L23` | No local Catppuccin desktoptheme tree (E5). The known image inventory records only `/usr/share/plasma/desktoptheme/default` (`docs/theme-manifests/theme-breeze.md:L61-L71`). Exact names are **UNKNOWN —**. | Intended base-Plasma dependency, not vendored by Catppuccin; exact built-image presence requires §8 checks. |
| `org.kde.kwin.aurorae.v2` | Local defaults select the v2 plugin (`.../contents/defaults:L28-L30`) | Plasma 6.7 source identifies `.v2` as the SVG Aurorae plugin (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L65-L84`). Exact installed plugin/load result is **UNKNOWN —** without a live KWin readback. | Plasma/KWin base dependency; the SVG trees are vendored. |
| Aurorae Classic `decoration.svg` and button SVGs | Local defaults select `__aurorae__svg__Catppuccin{Mocha,Latte}-Classic`; local trees contain the SVG files (E3 and local inventory). | Containerfile copies the directories at `images/kde/Containerfile:L1014`. | Vendored static Aurorae assets. |
| Aurorae Classic rc file | Plasma 6.7 v2 looks for `<theme>/<theme>rc` (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L77-L84`). | Required local `CatppuccinMocha-Classicrc` and `CatppuccinLatte-Classicrc` are absent (E5). Built-image presence is **UNKNOWN —**; run the §8 `test -f` checks. | Upstream installer creates it from `Resources/Aurorae/Common`; current local source does not. |
| Noto Sans fonts | Local defaults declare five Noto Sans values (`.../contents/defaults:L7-L11`). | Containerfile checks `fc-list : family | grep -qi 'Noto Sans'` at `images/kde/Containerfile:L1044-L1048`. | Image check declared; exact runtime package ownership and font match are **UNKNOWN —** without a built-image query. |
| SPPlus-Calm wallpaper package | Local defaults declare `Image=SPPlus-Calm` (`.../contents/defaults:L25-L26`). | Containerfile copies and checks the package at `images/kde/Containerfile:L1004-L1005`, `L1092-L1093`. | SP+ vendored/local asset outside the Catppuccin tree; no build/live wallpaper check here. |
| Upstream splash QML dependencies | Upstream installer copies QML importing `QtQuick` and `org.kde.kirigami 2` (U6, lines 10-12; U3, lines 315-332). | Current local package has no splash QML and local `Theme=none` (§3B). The prior image inventory records Qt6 Kirigami/QML module ownership at `docs/theme-manifests/theme-breeze.md:L200-L218`. | Upstream-only runtime surface; not a current local dependency unless splash is restored. |
| Kvantum engine or skin | Neither upstream creator defaults declares Kvantum. Local packages explicitly declare `widgetStyle=Breeze`, not `kvantum` (`.../contents/defaults:L16-L17`). | The image installs `kvantum` for other SP+ themes at `images/kde/Containerfile:L1026-L1041`; no Catppuccin Kvantum directory exists (E5). | Not required by these local Catppuccin declarations; engine present for other themes, no Catppuccin skin vendored. |
| Custom plasmoids/applets | Neither upstream or local Catppuccin package has a layout script or applet declaration (§3A/§6). | No Catppuccin applet tree is copied; only the package/asset roots in §2 are copied. | None declared; no custom applet dependency established. |

## 5. Plasma 6 compatibility

| Check | Evidence | Finding |
|---|---|---|
| Local package type | Both local global metadata files declare `KPackageStructure=Plasma/LookAndFeel` and `X-Plasma-APIVersion=2` (`theme/vendor/look-and-feel/Catppuccin-Mocha/metadata.json:L1-L5`; Latte corresponding lines). | Positive Plasma 6 package markers. |
| Local ID/path agreement | Local JSON IDs are `Catppuccin-Mocha` and `Catppuccin-Latte` (`.../metadata.json:L4-L6`); the local directories have those names (E4). The validator also treats ID/path agreement as a gate at `theme/tools/validate-global-themes.py:L89-L96`. | Positive local package identity. |
| Upstream metadata format | Upstream generated Classic/Blue packages carry both `metadata.desktop` and `metadata.json` (E2; U4/U5). | `metadata.desktop` alongside JSON is used by this upstream v0.4.0 output; its presence is not by itself evidence of a Plasma 5-only package. The local global packages retain JSON only. |
| `plasma-apply-*` command vintage | Upstream installer checks and calls `kpackagetool6`, `kwriteconfig6`, and `plasma-apply-lookandfeel` (U3, lines 273-285, 401-412, 539-543). Local image/helper use Qt6-era `plasma-apply-lookandfeel`, `kwriteconfig6`, and `qdbus-qt6` (`images/kde/Containerfile:L1127-L1128`; `config/spplus-apply-theme:L72-L93`, `L112-L139`). | No Plasma 5 command name was found in the inspected Catppuccin installer or local apply path. The current helper's D-Bus method/signalling defect is a separate runtime issue in §7. |
| Aurorae plugin identifier | Upstream defaults use `org.kde.kwin.aurorae` (U4/U5, `contents/defaults:L10`); local defaults use `org.kde.kwin.aurorae.v2` (`.../contents/defaults:L28-L30`). | `.v2` is the explicit Plasma 6 SVG Aurorae normalization. Plasma 6.7 source describes the v1-to-v2 migration and recommends `.v2` for new SVG configuration (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L65-L84`). |
| Aurorae file format | Local Classic trees contain the expected legacy SVG filenames and metadata (E3; local inventory); Plasma 6.7 v2 recognizes those SVG names and reads the Classic rc structure (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L77-L84`). | No SVG-to-new-format conversion is indicated by source. The missing rc file means a complete runtime load is **UNKNOWN —**. |
| QML imports | No local Catppuccin look-and-feel or Aurorae QML files exist (E4 and local inventory). Upstream generated splash QML uses `import QtQuick` and `import org.kde.kirigami 2 as Kirigami` (U6, lines 10-12). | No old versioned `QtQuick 2.x` or Plasma 5 import was found in the inspected Catppuccin files. Upstream splash load is not testable here because it is not locally shipped. |
| Old look-and-feel surfaces | Plasma 6.7 registers `defaults`, `colors`, `layouts`, `splash`, and `logout`, and does not register look-and-feel `lockscreen`, `osd`, or `loginmanager` as active surfaces (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L104-L117`). | The local packages ship none of those inactive directories; no inactive-surface compatibility issue is present in the local Catppuccin tree. |
| Live load | No build or live session was run. | Actual package discovery, Aurorae plugin load, desktop-theme path resolution, cursor/icon application, and visible rendering are **UNKNOWN —**; §8 gives failing readbacks. |

## 6. Layout

Neither local Catppuccin package ships a `contents/layouts/*.js` file; each local
package contains only `metadata.json` and `contents/defaults` (E4). The upstream
Classic/Blue generated LNF package likewise contains no layout file (E2, U4/U5).

| Requested layout property | Finding | Evidence |
|---|---|---|
| Panels created | None by Catppuccin. No package layout script exists. | E2/E4; Plasma 6.7 fallback behavior is described at `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L119-L150`. |
| Applets and order | None declared by Catppuccin. | E2/E4. |
| Screen edge, size, alignment, hiding, opacity | No Catppuccin layout values. | E2/E4. |
| Absolute paths | None in a Catppuccin layout because no layout file is shipped. | E2/E4. |
| Usernames | None in a Catppuccin layout because no layout file is shipped. | E2/E4. |
| Locked widgets | None in a Catppuccin layout because no layout file is shipped. | E2/E4. |
| Machine-specific values | None in a Catppuccin layout because no layout file is shipped. | E2/E4. |

If a caller explicitly uses `--resetLayout`, Plasma applies appearance plus layout
settings and, when the selected package has no layout script, evaluates the shell
default layout (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L119-L150`). That is
not a Catppuccin-created panel arrangement. The current SP+ helper invokes
`plasma-apply-lookandfeel -a` without `--resetLayout` and iterates only parsed
`contents/defaults` entries (`config/spplus-apply-theme:L112-L145`); the Welcome
bridge calls only the helper (`welcome/welcome.py:L885-L897`).

## 7. SP+ divergences

For this section, **creator baseline** means §3A, the pinned upstream Classic/Blue
defaults and installer result. **Local declaration** means §3B. The classifications
are:

- `REQUIRED-COMPAT`: the current image/apply boundary cannot use the upstream
  declaration as written without a Plasma 6, Fedora, or static-image issue.
- `SP+-POLICY`: an explicit current SP+ choice or shipped-scope choice.
- `UNEXPLAINED`: the difference is visible, but the audited source does not state
  why it was made.

### Upstream-to-local normalization

| Difference from §3A | Classification | Evidence |
|---|---|---|
| Only Mocha and Latte, Blue accent, Classic decoration are locally shipped; upstream generates four flavours, fourteen accents, and Classic/Modern variants. | `SP+-POLICY` | Local shipped set `docs/ledger/DECISION-cycle36-drop-custom-global-themes.md:L56-L70`; upstream installer choices U3, lines 114-119, 150-164, 227-230; inventory E2. |
| Local look-and-feel IDs are shortened to `Catppuccin-Mocha` and `Catppuccin-Latte`; upstream Classic/Blue IDs include `-Blue`. | `SP+-POLICY` | Local IDs `theme/vendor/look-and-feel/Catppuccin-Mocha/metadata.json:L4-L6` and Latte equivalent; upstream ID U7, metadata `L14`; local Welcome uses the shortened IDs at `welcome/app/index.html:L53-L54`; provenance says metadata IDs were authored to match local directories at `theme/vendor/PROVENANCE.md:L34-L43`. |
| Local metadata adds `X-Plasma-APIVersion=2`, changes version to `1.0`, removes upstream author/category fields, and omits `metadata.desktop`. | `UNEXPLAINED` | Local metadata `.../metadata.json:L1-L15`; upstream metadata U7, `L1-L21`, and upstream package inventory E2. No reason for each metadata-field change is stated in the audited source. |
| Local global metadata omits upstream `X-KPackage-Dependencies`; local Aurorae metadata has empty `Dependencies` arrays. | `UNEXPLAINED` | Upstream KNS URI U7, `L19-L21`; local global metadata `.../metadata.json:L1-L16`; local Aurorae metadata `:L10-L11`. |
| Five Noto Sans font keys are added although upstream defaults declare no fonts. | `SP+-POLICY` | Local keys `theme/vendor/look-and-feel/Catppuccin-Mocha/contents/defaults:L5-L11` and Latte same; helper's type-system block `config/spplus-apply-theme:L30-L40`, conditional behavior `L122-L127`; provenance rationale `theme/vendor/PROVENANCE.md:L34-L43`. |
| An icon selection is added: `Papirus-Dark` for Mocha and `Papirus` for Latte, although upstream defaults have no icon key and the upstream tree has no icon theme. | `SP+-POLICY` | Local values `.../contents/defaults:L13-L14`; upstream complete defaults U4/U5 and E7; provenance states Papirus standardisation and its rationale at `theme/vendor/PROVENANCE.md:L36-L43`; image package request at `images/kde/Containerfile:L1037-L1048`. |
| Widget style is added as `Breeze`, although upstream defaults have no widget-style key. | `SP+-POLICY` | Local values `.../contents/defaults:L16-L17`; upstream complete defaults U4/U5/E7; provenance rationale at `theme/vendor/PROVENANCE.md:L40-L43`. |
| Upstream cursor names `catppuccin-mocha-blue-cursors` / `catppuccin-latte-blue-cursors` are replaced by `breeze_cursors`. | `REQUIRED-COMPAT` at the current static-image boundary | Upstream declarations U4/U5, `contents/defaults:L4-L5`; upstream supplies those directories only through the optional remote download path U3, lines 430-463. The current Containerfile has no installer invocation (E6), no local Cat cursor tree (E5), and local values are `breeze_cursors` at `.../contents/defaults:L19-L20`; the image checks the Breeze cursor path at `images/kde/Containerfile:L1132-L1134`. Whether a base image happens to provide the Cat names remains **UNKNOWN —**. |
| Upstream `plasmarc:Theme=name=default` is changed to `breeze-dark` or `breeze-light`. | `UNEXPLAINED` | Upstream U4/U5, `contents/defaults:L15-L16`; local Mocha/Latte `contents/defaults:L22-L23`; no local Cat desktoptheme tree (E5). The validator treats any non-`default` name as an asset that must exist at `theme/tools/validate-global-themes.py:L130-L133`, but no built-image path check was run. |
| Upstream `library=org.kde.kwin.aurorae` is changed to `org.kde.kwin.aurorae.v2`. | `REQUIRED-COMPAT` | Upstream U4/U5, `contents/defaults:L10`; local `.../contents/defaults:L28-L30`; Plasma 6.7 Aurorae guidance at `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L65-L84`; local validator rejects the unsuffixed plugin at `theme/tools/validate-global-themes.py:L112-L115`. |
| Upstream `BorderSize=None` and `BorderSizeAuto=false` are omitted from local defaults. | `UNEXPLAINED` | Upstream U4/U5, `contents/defaults:L12-L13`; local complete defaults `.../contents/defaults:L28-L32` contain no BorderSize keys; an exact local search found no `BorderSize` reference in `config/`, `theme/`, or `images/kde/Containerfile` (audit command output: no lines). The upstream installer separately writes `BorderSizeAuto=false` at U3, lines 539-543. |
| Upstream `[KSplash] Theme=Catppuccin-*-Blue-splash` is replaced with `[ksplashrc][KSplash] Theme=none`. | `SP+-POLICY` | Upstream U4/U5, `contents/defaults:L18-L19`; local values `.../contents/defaults:L34-L35`; the current SP+ decision explicitly names `KSplash=none` as a forced policy override at `docs/ledger/DECISION-2026-08-30-theme-fidelity.md:L23-L29`. |
| A wallpaper declaration `SPPlus-Calm` is added although upstream defaults declare no wallpaper. | `SP+-POLICY` | Local `.../contents/defaults:L25-L26`; upstream complete defaults U4/U5/E7; image retains/copies the SP+ wallpaper at `images/kde/Containerfile:L1004-L1005`; first-login also hard-codes it at `config/spplus-first-login:L17-L23`. |
| Upstream installs previews, splash content, and an Aurorae Common rc; local static copies omit those assets. | `UNEXPLAINED` | Upstream installer U3, lines 315-355; local inventory E4/E5 and Containerfile copies `images/kde/Containerfile:L1013-L1015`. No local source explains the omission. |

The local `ButtonsOnLeft=` and `ButtonsOnRight=IAX` values match the upstream
Classic/Blue defaults and are not a value divergence (`U4/U5`,
`contents/defaults:L7-L9`; local §3B `:L28-L32`).

### Upstream installer actions not reproduced by the current static image

| Upstream action | Current SP+ behavior | Classification | Evidence |
|---|---|---|---|
| Install the flavour-specific Aurorae tree and append the matching Common `.rc` file. | Copies only the local ten-file Aurorae tree; the required `.rc` is absent from local source. | `UNEXPLAINED` | U3, lines 335-346; local inventory/E5; `images/kde/Containerfile:L1014`. |
| Install the global package's base previews, generated metadata, and defaults, then append splash QML/assets/previews. | Copies local JSON/defaults only; no local previews or splash. | `UNEXPLAINED` | U3, lines 315-355, 414-416; E4; `images/kde/Containerfile:L1013`. |
| Download/install two cursor archives: the accent cursor and flavour-dark cursor. | Does not download Catppuccin cursors; local package asks for `breeze_cursors`. | `REQUIRED-COMPAT` at the static-image boundary | U3, lines 199-215, 430-463, 521-525; E5/E6; local defaults `.../contents/defaults:L19-L20`. |
| Install/configure a Catppuccin icon theme. | The upstream installer does not do this. SP+ instead adds Papirus icon keys and requests Papirus packages. | `SP+-POLICY` for the local addition; upstream no-op is creator behavior | Upstream defaults E7/U4/U5; local defaults `.../contents/defaults:L13-L14`; Containerfile `L1037-L1048`. |
| Write `BorderSizeAuto=false` outside the package before applying. | No local `BorderSize` write exists in the audited SP+ source (exact local search produced no lines). | `UNEXPLAINED` | U3, lines 539-543; local source search and local defaults `.../contents/defaults:L28-L32`. |
| Install to user XDG data paths by default. | Static image installs system `/usr/share` content through `COPY`. | `SP+-POLICY` deployment choice | U3, lines 94-100; `images/kde/Containerfile:L1013-L1017`. |

### Runtime behavior versus the local declaration

| Current behavior | Classification | Evidence |
|---|---|---|
| The helper parses only `contents/defaults`; it has no path for previews, splash content, metadata dependency installation, or layout files. | `UNEXPLAINED` | Package discovery/parser `config/spplus-apply-theme:L43-L69`; write loop and return path `L120-L146`. |
| The helper passes the raw local wallpaper value `SPPlus-Calm` to `plasma-apply-wallpaperimage`, while first-login passes the absolute `/usr/share/wallpapers/SPPlus-Calm` directory. | `REQUIRED-COMPAT` | Helper `config/spplus-apply-theme:L129-L139`; first-login `config/spplus-first-login:L17-L23`, `L110-L130`; Plasma wallpaper utility behavior recorded at `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L183-L201` and the stock manifest's utility analysis at `docs/theme-manifests/theme-breeze.md:L507-L510`. Whether the bare value resolves in the target image is **UNKNOWN —**. |
| Every subprocess call in the helper uses `check=False`, including Plasma apply, each `kwriteconfig6`, wallpaper apply, and D-Bus notification. | `UNEXPLAINED` | `config/spplus-apply-theme:L72-L93`, `L112-L118`, `L129-L146`. |
| The helper calls `org.kde.KGlobalSettings.notifyChange` as a D-Bus method and never emits the cursor change type 5 signal. | `REQUIRED-COMPAT` | Helper `config/spplus-apply-theme:L78-L93`; Plasma 6.7 source finding that `notifyChange` is a signal, not a method, and that cursor is type 5 at `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L32-L63`. |
| The helper's direct `kwriteconfig6` calls omit `--notify`. | `REQUIRED-COMPAT` | `config/spplus-apply-theme:L72-L75`, `L129-L134`; Plasma 6.7 notification distinction at `docs/theme-manifests/theme-breeze.md:L415-L451`. |
| No post-apply readback verifies the local package's keys, wallpaper, Aurorae rc/plugin load, or visible icon/font/style state before the helper prints success. | `UNEXPLAINED` | Helper prints `SPPLUS_THEME_APPLIED` and returns 0 at `config/spplus-apply-theme:L141-L149`; Welcome treats the return code as `ok` at `welcome/welcome.py:L885-L897`. |
| Welcome reports a selected theme as applied when the helper returns zero; it does not independently read back a key or loaded component. | `UNEXPLAINED` | `welcome/welcome.py:L885-L897`; UI success branch `welcome/app/app.js:L318-L327`. |
| First login applies the SP+ Windows dark package, not Catppuccin, before running the helper. | `SP+-POLICY` | `config/spplus-first-login:L17-L23`, `L80-L86`; system default writes the Windows package and matching values at `images/kde/Containerfile:L1051-L1096`. |

### System-wide defaults before a Catppuccin selection

These are current `/etc/xdg` values, not Catppuccin package declarations. They are
included because they are active SP+ behavior before a user selects a local Catppuccin
ID.

| File:key/value | Relation to §3B | Classification | Evidence |
|---|---|---|---|
| `/etc/xdg/kdeglobals [General] ColorScheme=WindowsModernDark` | Neither Catppuccin colour scheme | `SP+-POLICY` | `images/kde/Containerfile:L1057-L1062`; local values §3B. |
| `/etc/xdg/kdeglobals [General] TerminalApplication=kitty` | Not a Catppuccin declaration | `SP+-POLICY` | `images/kde/Containerfile:L1057-L1062`. |
| `/etc/xdg/kdeglobals [General] LookAndFeelPackage=org.secureprospective.spplus.windows11.dark` | Names Windows rather than either local Catppuccin ID | `SP+-POLICY` | `images/kde/Containerfile:L1057-L1069`. |
| `/etc/xdg/kdeglobals [Icons] Theme=Papirus-Dark` | Matches local Mocha icon value but not local Latte icon value; it is a preselection, not a Catppuccin declaration. | `SP+-POLICY` | `images/kde/Containerfile:L1063-L1065`; local §3B icon rows. |
| `/etc/xdg/kdeglobals [KDE] widgetStyle=kvantum-dark` | Differs from both local Catppuccin `Breeze` values. | `SP+-POLICY` | `images/kde/Containerfile:L1066-L1069`; local `.../contents/defaults:L16-L17`. |
| `/etc/xdg/plasmarc [Theme] name=Windows-modern-dark` | Differs from local `breeze-dark`/`breeze-light`. | `SP+-POLICY` | `images/kde/Containerfile:L1070-L1073`; local `.../contents/defaults:L22-L23`. |
| `/etc/xdg/kwinrc [org.kde.kdecoration2] library=org.kde.kwin.aurorae.v2` | Same library as local Catppuccin, but the theme value below differs. | `SP+-POLICY` system seed; no library-value divergence | `images/kde/Containerfile:L1074-L1077`; local §3B. |
| `/etc/xdg/kwinrc [org.kde.kdecoration2] theme=__aurorae__svg__windows-modern-dark-aurorae` | Differs from both local Catppuccin Aurorae theme names. | `SP+-POLICY` | `images/kde/Containerfile:L1074-L1077`. |
| `/etc/xdg/kwinrc [Wayland] InputMethod=` and `VirtualKeyboardEnabled=false` | Not declared by Catppuccin. | `SP+-POLICY` | `images/kde/Containerfile:L1079-L1089`. |
| `/etc/xdg/kcminputrc [Mouse] cursorTheme=breeze_cursors` | Matches both local Catppuccin declarations. | `SP+-POLICY` system seed; no value divergence | `images/kde/Containerfile:L1113-L1114`, `L1132-L1134`; local `.../contents/defaults:L19-L20`. |
| `/etc/xdg/kscreenlockerrc [Daemon] Autolock=false` | Not declared by Catppuccin. | `UNEXPLAINED` relative to the theme package | `config/kscreenlockerrc:L1-L2`; copied/checked at `images/kde/Containerfile:L1113-L1131`. |

## 8. Verification plan

Run as the target user inside a live Plasma 6 session. Run each table command as a
separate command. Every command below can fail. In Markdown table cells, `\|` is
the escaped shell pipe; execute it as `|`. The first key tables prove the current
local §3B declaration. The creator-baseline values in §3A are not expected
to pass simultaneously for the normalized fields; those differences are the audit
result, not a hidden success condition.

### Session/tool preconditions

| Assertion | Exact command |
|---|---|
| Session bus exists | `test -n "${DBUS_SESSION_BUS_ADDRESS:-}"` |
| Plasma shell owns its bus name | `busctl --user list --no-legend --no-pager \| grep -q '^org\.kde\.plasmashell\b'` |
| Apply tool exists | `test -x /usr/sbin/plasma-apply-lookandfeel` |
| Wallpaper tool exists | `test -x /usr/sbin/plasma-apply-wallpaperimage` |
| Effective config reader exists | `test -x /usr/sbin/kreadconfig6` |
| Config writer exists | `test -x /usr/sbin/kwriteconfig6` |
| Qt6 D-Bus client exists | `test -x /usr/sbin/qdbus-qt6` |

### Package discovery and file checks

| Assertion | Exact command |
|---|---|
| Mocha local package is discoverable | `plasma-apply-lookandfeel --list \| grep -Fx -- 'Catppuccin-Mocha'` |
| Latte local package is discoverable | `plasma-apply-lookandfeel --list \| grep -Fx -- 'Catppuccin-Latte'` |
| Mocha metadata exists | `test -f /usr/share/plasma/look-and-feel/Catppuccin-Mocha/metadata.json` |
| Latte metadata exists | `test -f /usr/share/plasma/look-and-feel/Catppuccin-Latte/metadata.json` |
| Mocha defaults exist | `test -f /usr/share/plasma/look-and-feel/Catppuccin-Mocha/contents/defaults` |
| Latte defaults exist | `test -f /usr/share/plasma/look-and-feel/Catppuccin-Latte/contents/defaults` |
| Mocha ID matches path | `python3 -c 'import json; p="/usr/share/plasma/look-and-feel/Catppuccin-Mocha/metadata.json"; assert json.load(open(p))["KPlugin"]["Id"] == "Catppuccin-Mocha"'` |
| Latte ID matches path | `python3 -c 'import json; p="/usr/share/plasma/look-and-feel/Catppuccin-Latte/metadata.json"; assert json.load(open(p))["KPlugin"]["Id"] == "Catppuccin-Latte"'` |
| Mocha colour scheme exists | `test -f /usr/share/color-schemes/CatppuccinMochaBlue.colors` |
| Latte colour scheme exists | `test -f /usr/share/color-schemes/CatppuccinLatteBlue.colors` |
| Mocha Aurorae metadata exists | `test -f /usr/share/aurorae/themes/CatppuccinMocha-Classic/metadata.json` |
| Latte Aurorae metadata exists | `test -f /usr/share/aurorae/themes/CatppuccinLatte-Classic/metadata.json` |
| Mocha Aurorae decoration exists | `test -f /usr/share/aurorae/themes/CatppuccinMocha-Classic/decoration.svg` |
| Latte Aurorae decoration exists | `test -f /usr/share/aurorae/themes/CatppuccinLatte-Classic/decoration.svg` |
| Mocha Aurorae close button exists | `test -f /usr/share/aurorae/themes/CatppuccinMocha-Classic/close.svg` |
| Latte Aurorae close button exists | `test -f /usr/share/aurorae/themes/CatppuccinLatte-Classic/close.svg` |
| Mocha Aurorae required rc exists | `test -f /usr/share/aurorae/themes/CatppuccinMocha-Classic/CatppuccinMocha-Classicrc` |
| Latte Aurorae required rc exists | `test -f /usr/share/aurorae/themes/CatppuccinLatte-Classic/CatppuccinLatte-Classicrc` |
| Mocha Papirus-Dark icon directory exists | `test -d /usr/share/icons/Papirus-Dark` |
| Latte Papirus icon directory exists | `test -d /usr/share/icons/Papirus` |
| Breeze cursor directory exists | `test -d /usr/share/icons/breeze_cursors` |
| Mocha requested desktop theme exists | `test -d /usr/share/plasma/desktoptheme/breeze-dark` |
| Latte requested desktop theme exists | `test -d /usr/share/plasma/desktoptheme/breeze-light` |
| SPPlus-Calm wallpaper package exists | `test -d /usr/share/wallpapers/SPPlus-Calm` |
| Noto Sans is discoverable | `fc-list : family \| grep -qi 'Noto Sans'` |

The two Aurorae rc commands and the light Papirus/desktop-theme checks are
included because source inspection did not establish their built-image presence;
a failing result is evidence of the unresolved asset, not a passing placeholder.

### Apply operation

The current command under test is:

```sh
/usr/libexec/spplus-apply-theme Catppuccin-Mocha
```

or:

```sh
/usr/libexec/spplus-apply-theme Catppuccin-Latte
```

A zero exit code is not sufficient because all helper subprocesses use
`check=False` (`config/spplus-apply-theme:L72-L93`, `L112-L146`). Do not use
`--resetLayout` for a normal Catppuccin picker test: neither package ships a
layout script, and the Plasma 6.7 reset operation also applies appearance and
deletes/recreates shell layout state (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L119-L164`).

### Effective Mocha keys

Run one command per key after applying `Catppuccin-Mocha`:

| Key | Exact failing readback |
|---|---|
| `kdeglobals:General:ColorScheme` | `test "$(kreadconfig6 --file kdeglobals --group General --key ColorScheme)" = 'CatppuccinMochaBlue'` |
| `kdeglobals:General:font` | `test "$(kreadconfig6 --file kdeglobals --group General --key font)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `kdeglobals:General:menuFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key menuFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `kdeglobals:General:toolBarFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key toolBarFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `kdeglobals:General:activeFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key activeFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `kdeglobals:General:smallestReadableFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key smallestReadableFont)" = 'Noto Sans,9,-1,5,50,0,0,0,0,0'` |
| `kdeglobals:Icons:Theme` | `test "$(kreadconfig6 --file kdeglobals --group Icons --key Theme)" = 'Papirus-Dark'` |
| `kdeglobals:KDE:widgetStyle` | `test "$(kreadconfig6 --file kdeglobals --group KDE --key widgetStyle)" = 'Breeze'` |
| `kcminputrc:Mouse:cursorTheme` | `test "$(kreadconfig6 --file kcminputrc --group Mouse --key cursorTheme)" = 'breeze_cursors'` |
| `plasmarc:Theme:name` | `test "$(kreadconfig6 --file plasmarc --group Theme --key name)" = 'breeze-dark'` |
| `kwinrc:org.kde.kdecoration2:library` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key library)" = 'org.kde.kwin.aurorae.v2'` |
| `kwinrc:org.kde.kdecoration2:theme` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key theme)" = '__aurorae__svg__CatppuccinMocha-Classic'` |
| `kwinrc:org.kde.kdecoration2:ButtonsOnLeft` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key ButtonsOnLeft)" = ''` |
| `kwinrc:org.kde.kdecoration2:ButtonsOnRight` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key ButtonsOnRight)" = 'IAX'` |
| `ksplashrc:KSplash:Theme` | `test "$(kreadconfig6 --file ksplashrc --group KSplash --key Theme)" = 'none'` |
| Wallpaper image request | `grep -Fq '/usr/share/wallpapers/SPPlus-Calm' "${XDG_CONFIG_HOME:-$HOME/.config}/plasma-org.kde.plasma.desktop-appletsrc"` |

### Effective Latte keys

Run one command per key after applying `Catppuccin-Latte`:

| Key | Exact failing readback |
|---|---|
| `kdeglobals:General:ColorScheme` | `test "$(kreadconfig6 --file kdeglobals --group General --key ColorScheme)" = 'CatppuccinLatteBlue'` |
| `kdeglobals:General:font` | `test "$(kreadconfig6 --file kdeglobals --group General --key font)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `kdeglobals:General:menuFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key menuFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `kdeglobals:General:toolBarFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key toolBarFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `kdeglobals:General:activeFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key activeFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `kdeglobals:General:smallestReadableFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key smallestReadableFont)" = 'Noto Sans,9,-1,5,50,0,0,0,0,0'` |
| `kdeglobals:Icons:Theme` | `test "$(kreadconfig6 --file kdeglobals --group Icons --key Theme)" = 'Papirus'` |
| `kdeglobals:KDE:widgetStyle` | `test "$(kreadconfig6 --file kdeglobals --group KDE --key widgetStyle)" = 'Breeze'` |
| `kcminputrc:Mouse:cursorTheme` | `test "$(kreadconfig6 --file kcminputrc --group Mouse --key cursorTheme)" = 'breeze_cursors'` |
| `plasmarc:Theme:name` | `test "$(kreadconfig6 --file plasmarc --group Theme --key name)" = 'breeze-light'` |
| `kwinrc:org.kde.kdecoration2:library` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key library)" = 'org.kde.kwin.aurorae.v2'` |
| `kwinrc:org.kde.kdecoration2:theme` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key theme)" = '__aurorae__svg__CatppuccinLatte-Classic'` |
| `kwinrc:org.kde.kdecoration2:ButtonsOnLeft` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key ButtonsOnLeft)" = ''` |
| `kwinrc:org.kde.kdecoration2:ButtonsOnRight` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key ButtonsOnRight)" = 'IAX'` |
| `ksplashrc:KSplash:Theme` | `test "$(kreadconfig6 --file ksplashrc --group KSplash --key Theme)" = 'none'` |
| Wallpaper image request | `grep -Fq '/usr/share/wallpapers/SPPlus-Calm' "${XDG_CONFIG_HOME:-$HOME/.config}/plasma-org.kde.plasma.desktop-appletsrc"` |

### Loaded decoration, upstream cursor, and fallback checks

A config key only proves that a request was written. Use the live KWin
support-information response for the loaded plugin and theme, as required by the
Plasma 6.7 findings (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L86-L102`).

| Assertion | Exact command |
|---|---|
| Mocha decoration plugin loaded | `info=$(qdbus-qt6 org.kde.KWin /KWin org.kde.KWin.supportInformation); printf '%s\n' "$info" \| grep -Fq 'Plugin: org.kde.kwin.aurorae.v2'` |
| Mocha decoration theme loaded | `info=$(qdbus-qt6 org.kde.KWin /KWin org.kde.KWin.supportInformation); printf '%s\n' "$info" \| grep -Fq 'Theme: __aurorae__svg__CatppuccinMocha-Classic'` |
| Latte decoration plugin loaded | `info=$(qdbus-qt6 org.kde.KWin /KWin org.kde.KWin.supportInformation); printf '%s\n' "$info" \| grep -Fq 'Plugin: org.kde.kwin.aurorae.v2'` |
| Latte decoration theme loaded | `info=$(qdbus-qt6 org.kde.KWin /KWin org.kde.KWin.supportInformation); printf '%s\n' "$info" \| grep -Fq 'Theme: __aurorae__svg__CatppuccinLatte-Classic'` |
| Upstream Mocha cursor tree, if creator declaration is to be tested | `test -d /usr/share/icons/catppuccin-mocha-blue-cursors` |
| Upstream Latte cursor tree, if creator declaration is to be tested | `test -d /usr/share/icons/catppuccin-latte-blue-cursors` |
| Aurorae v2 Mocha rc, if creator package is to be complete | `test -f /usr/share/aurorae/themes/CatppuccinMocha-Classic/CatppuccinMocha-Classicrc` |
| Aurorae v2 Latte rc, if creator package is to be complete | `test -f /usr/share/aurorae/themes/CatppuccinLatte-Classic/CatppuccinLatte-Classicrc` |

For the upstream creator baseline, the expected colour-scheme readbacks are the
same as the local ones, but the expected cursor values, `library`, `BorderSize`,
`KSplash`, and omitted/added keys are those transcribed in §3A. Plasma may
migrate an old Aurorae library ID to `.v2`; the loaded-plugin readback, not an old
literal library string, is the compatibility assertion (`docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L65-L102`).

## 9. Open questions for Christopher

| Decision | Question |
|---|---|
| Shipped Catppuccin scope | Should the shipped surface remain Mocha/Latte Blue with Classic decorations only, or represent more of upstream's accent/flavour/Modern matrix? |
| Cursor policy | Should Catppuccin use the upstream cursor downloads, or keep the current `breeze_cursors` substitution at the static-image boundary? |
| Splash and borders | Should the upstream splash/previews and `BorderSize=None`/`BorderSizeAuto=false` behavior be present, or remain replaced by local `Theme=none` and the current omission? |
| Desktop-theme names | Should the local `breeze-dark`/`breeze-light` desktop-theme names remain the selected targets after the built-image path checks settle? |
| Package dependency metadata | Is removal of the upstream `X-KPackage-Dependencies` metadata intentional for the static system copy? |
