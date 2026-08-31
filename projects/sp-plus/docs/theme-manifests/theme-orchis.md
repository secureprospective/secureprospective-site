# Orchis Light theme manifest

**Audit date:** 2026-08-30
**Scope:** the vendored Orchis Light look-and-feel package, its Plasma desktop theme and Aurorae tree, the referenced assets, the layout script, and the splash surface.
**Audit mode:** read-only. No image or ISO build was run. No live graphical Plasma session was available. The existing `localhost/sp-plus-kde:test44` image was queried read-only; image observations are labelled as such.

This is an evidence manifest, not an approval. `UNKNOWN — <what would settle it>` means the source or existing-image inspection did not establish the fact.

## Evidence key

The local source citations below are direct file/line citations. The upstream checkout used for comparison is `/tmp/orchis-kde-audit-b2a96919`, at commit `b2a96919eee40264e79db402b915f926436100ad`. The following exact read-only outputs are retained here so image and comparison claims are reproducible:

**U1, upstream remote and resolved ref**

```text
$ git -C /tmp/orchis-kde-audit-b2a96919 remote -v
origin  https://github.com/vinceliuice/Orchis-kde.git (fetch)
origin  https://github.com/vinceliuice/Orchis-kde.git (push)
$ git -C /tmp/orchis-kde-audit-b2a96919 show-ref --heads --tags
b2a96919eee40264e79db402b915f926436100ad refs/heads/main
```

**U2, local/upstream tree comparison**

```text
$ diff -qr theme/vendor/look-and-feel/com.github.vinceliuice.Orchis /tmp/orchis-kde-audit-b2a96919/plasma/look-and-feel/com.github.vinceliuice.Orchis
Files theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/defaults and /tmp/orchis-kde-audit-b2a96919/plasma/look-and-feel/com.github.vinceliuice.Orchis/contents/defaults differ
Only in /tmp/orchis-kde-audit-b2a96919/plasma/look-and-feel/com.github.vinceliuice.Orchis: metadata.desktop
Files theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/metadata.json and /tmp/orchis-kde-audit-b2a96919/plasma/look-and-feel/com.github.vinceliuice.Orchis/metadata.json differ
$ diff -qr theme/vendor/desktoptheme/Orchis /tmp/orchis-kde-audit-b2a96919/plasma/desktoptheme/Orchis
$ diff -qr theme/vendor/aurorae/Orchis /tmp/orchis-kde-audit-b2a96919/aurorae/Orchis
$ cmp -s theme/vendor/color-schemes/Orchis.colors /tmp/orchis-kde-audit-b2a96919/color-schemes/Orchis.colors && echo MATCH
MATCH
```

The last three commands produced no diff; the color-scheme command printed `MATCH` from the comparison wrapper.

**U3, exact compact inventory and license search**

```text
$ for d in theme/vendor/look-and-feel/com.github.vinceliuice.Orchis theme/vendor/desktoptheme/Orchis theme/vendor/aurorae/Orchis; do find "$d" -type f | wc -l; done
local_lnf_files=10
local_desktop_files=43
local_aurorae_files=10
upstream_lnf_files=11
upstream_desktop_files=43
upstream_aurorae_files=10
upstream_lnf_children=com.github.vinceliuice.Orchis,com.github.vinceliuice.Orchis-dark
upstream_desktop_children=Orchis,Orchis-dark,icons
upstream_aurorae_children=Orchis,Orchis-dark,Orchis-dark_Nvidia,Orchis-dark-solid,Orchis-dark_x1.25,Orchis-dark_x1.5,Orchis_Nvidia,Orchis-solid,Orchis_x1.25,Orchis_x1.5
local_lnf_files_list=metadata.json,contents/defaults,contents/splash/Splash.qml,contents/splash/images/rectangle.svg,contents/splash/images/background.jpg,contents/splash/images/kde.svg,contents/previews/fullscreenpreview.jpg,contents/previews/splash.png,contents/previews/preview.png,contents/layouts/org.kde.plasma.desktop-layout.js
upstream_lnf_files_list=metadata.json,metadata.desktop,contents/splash/images/rectangle.svg,contents/splash/images/kde.svg,contents/splash/images/background.jpg,contents/splash/Splash.qml,contents/previews/splash.png,contents/previews/preview.png,contents/previews/fullscreenpreview.jpg,contents/layouts/org.kde.plasma.desktop-layout.js,contents/defaults
upstream_extra_trees=Kvantum/Orchis,Kvantum/Orchis-solid,wallpaper/Orchis,sddm/5.0,sddm/6.0
$ find theme/vendor/look-and-feel/com.github.vinceliuice.Orchis theme/vendor/desktoptheme/Orchis theme/vendor/aurorae/Orchis theme/vendor/color-schemes/Orchis.colors -type f \( -iname 'LICENSE*' -o -iname 'COPYING*' -o -iname 'NOTICE*' \) -print
(no license-file output under all four local Orchis asset roots, including color-schemes/Orchis.colors)
$ find theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort
local_contents_directories=layouts,previews,splash
```

The upstream checkout also has `com.github.vinceliuice.Orchis-dark`, `desktoptheme/Orchis-dark`, and the extra Aurorae scale/Nvidia/solid variants. Exact upstream source structure and installer behavior: `/tmp/orchis-kde-audit-b2a96919/README.md:L4-L10`, `/tmp/orchis-kde-audit-b2a96919/install.sh:L42-L63`; U3 supplies the relevant file/directory inventory.

**S1, exact source searches**

```text
$ grep -nE 'DesktopSwitcher|WindowSwitcher|org\\.kde\\.kwin\\.aurorae($|[^.])|Vimix|Tela-circle|kvantum' theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/defaults
(no output)
$ grep -nE 'bottomRect|QtQuick|source:|duration|easing' theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/splash/Splash.qml
20:import QtQuick 2.1
25:    source: "images/background.jpg"
38:        source: "images/rectangle.svg"
40:            source: "images/kde.svg"
64:                        duration: 250
65:                        easing.type: Easing.InOutQuad
81:                duration: 1000
82:                easing.type: Easing.InOutBack
83:                easing.overshoot: 1.0
88:                target: bottomRect
89:                to: 2 * (root.height / 3) - bottomRect.height
90:                duration: 1000
91:                easing.type: Easing.InOutBack
92:                easing.overshoot: 1.0
```

**I1, existing-image identity**

```text
$ podman inspect localhost/sp-plus-kde:test44 | python3 -c 'import json,sys; d=json.load(sys.stdin)[0]; print("Id="+d.get("Id","")); print("Created="+d.get("Created","")); print("ostree.commit="+d.get("Config",{}).get("Labels",{}).get("ostree.commit",""))'
Id=9ea70bb1b9cbec744a58a7f814ef03fa995bfa0771ec442980f4cbcaa6a95856
Created=2026-08-30T00:24:46.558664547Z
ostree.commit=0905c43174a1f29c62f6c8a27b35547325b0a5ef1f3e7cfb32e03ffaff49693c
```

**I2, existing-image package/path readback**

```text
plasma-workspace-6.7.4-1.fc44.x86_64
plasma-desktop-6.7.4-1.fc44.x86_64
kdeplasma-addons-6.7.4-1.fc44.x86_64
kvantum-1.1.6-1.fc44.x86_64
papirus-icon-theme-20250501-2.fc44.noarch
papirus-icon-theme-dark-20250501-2.fc44.noarch
breeze-cursor-theme-6.7.4-2.fc44.noarch
google-noto-sans-fonts-20251201-2.fc44.noarch
abattis-cantarell-fonts-0.301-17.fc44.noarch
PRESENT /usr/share/icons/Papirus
PRESENT /usr/share/icons/Papirus-Dark
PRESENT /usr/share/icons/breeze_cursors
PRESENT /usr/share/plasma/desktoptheme/Orchis
PRESENT /usr/share/plasma/look-and-feel/com.github.vinceliuice.Orchis
PRESENT /usr/share/aurorae/themes/Orchis
PRESENT /usr/share/color-schemes/Orchis.colors
ABSENT /usr/share/Kvantum/ChromeOS
ABSENT /usr/share/Kvantum/Orchis
ABSENT /usr/share/Kvantum/Orchis-solid
ABSENT /usr/share/icons/Vimix
ABSENT /usr/share/icons/Tela-circle
ABSENT /usr/share/wallpapers/Orchis
PRESENT /usr/share/wallpapers/SPPlus-Calm
PRESENT /usr/share/wallpapers/SPPlus-Calm/metadata.json
PRESENT /usr/share/wallpapers/SPPlus-Calm/contents/images/3840x2160.jpg
```

The same readback found `/usr/share/plasma/look-and-feel/com.github.vinceliuice.Orchis/metadata.json`, `contents/layouts/org.kde.plasma.desktop-layout.js`, and `contents/splash/Splash.qml`; the upstream look-and-feel `metadata.desktop` is absent from the installed local package. The image's `plasma-apply-lookandfeel --list` invocation aborted with `rc=134` outside a graphical session, so theme-list discovery is not claimed from that command.

**I3, existing-image ownership/readback**

```text
org.kde.plasma.analogclock -> plasma-workspace-libs-6.7.4-1.fc44.x86_64
org.kde.plasma.kickoff -> plasma-desktop-6.7.4-1.fc44.x86_64
org.kde.plasma.appmenu -> plasma-workspace-libs-6.7.4-1.fc44.x86_64
org.kde.plasma.panelspacer -> plasma-workspace-libs-6.7.4-1.fc44.x86_64
org.kde.plasma.colorpicker -> kdeplasma-addons-6.7.4-1.fc44.x86_64
org.kde.plasma.systemtray -> plasma-workspace-libs-6.7.4-1.fc44.x86_64
org.kde.plasma.digitalclock -> plasma-workspace-libs-6.7.4-1.fc44.x86_64
/usr/share/icons/Papirus/index.theme -> papirus-icon-theme-20250501-2.fc44.noarch
/usr/share/icons/Papirus-Dark/index.theme -> papirus-icon-theme-dark-20250501-2.fc44.noarch
/usr/share/icons/breeze_cursors/cursors/left_ptr -> breeze-cursor-theme-6.7.4-2.fc44.noarch
Cantarell Light -> /usr/share/fonts/abattis-cantarell-fonts/Cantarell-Light.otf
Noto Sans -> /usr/share/fonts/google-noto/NotoSans-Regular.ttf
/usr/lib64/qt6/plugins/org.kde.kdecoration3/org.kde.kwin.aurorae.so -> PRESENT
/usr/lib64/qt6/plugins/org.kde.kdecoration3/org.kde.kwin.aurorae.v2.so -> PRESENT; aurorae-6.7.4-1.fc44.x86_64
/usr/lib64/qt6/plugins/styles/breeze6.so -> PRESENT; plasma-breeze-qt6-6.7.4-2.fc44.x86_64
/usr/lib64/qt6/plugins/org.kde.kdecoration3/org.kde.breeze.so -> PRESENT; plasma-breeze-6.7.4-2.fc44.x86_64
/usr/lib64/qt6/qml/org/kde/plasma/wallpapers/image/libplasma_wallpaper_image.so -> PRESENT; plasma-workspace-6.7.4-1.fc44.x86_64
/usr/share/applications/systemsettings.desktop -> PRESENT; plasma-systemsettings-6.7.4-1.fc44.x86_64
/usr/share/applications/org.kde.kinfocenter.desktop -> PRESENT; kinfocenter-6.7.4-1.fc44.x86_64
plasma-systemsettings-6.7.4-1.fc44.x86_64
kinfocenter-6.7.4-1.fc44.x86_64
```

These are path/package checks from the same read-only image query. The applet and package paths are not live rendering proof.

**I4, source-to-existing-image hashes**

```text
theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/defaults
  local=e9eaae3dc7eecb0d0225c7ee01d7406c40a63d577d19cee61050f020cde4f6a8
  image=e9eaae3dc7eecb0d0225c7ee01d7406c40a63d577d19cee61050f020cde4f6a8 MATCH
theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/layouts/org.kde.plasma.desktop-layout.js
  local=ff71e05b237a68c825742e863de879f93b6368dcd4a0be971dd27be36e220d32
  image=ff71e05b237a68c825742e863de879f93b6368dcd4a0be971dd27be36e220d32 MATCH
theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/metadata.json
  local=1cfce95eba2cf34355f0f4bbba27acb7160750ef4a97025052478c8208609169
  image=1cfce95eba2cf34355f0f4bbba27acb7160750ef4a97025052478c8209169 MATCH
theme/vendor/color-schemes/Orchis.colors
  local=1e1b865dfb9dc320fbb93918ddc0eb37853b58fc5b7370f80449548b3a10107a
  image=1e1b865dfb9dc320fbb93918ddc0eb37853b58fc5b7370f80449548b3a10107a MATCH
```

**I5, image static theme gate**

```text
$ podman run --rm --network=none localhost/sp-plus-kde:test44 /usr/libexec/spplus-validate-global-themes --root /
SPPLUS_GLOBAL_THEME_GATE themes=8/8 errors=0
validator_rc=0
```

This gate checks package IDs, required defaults, dangling icon/cursor/desktop/Aurorae references, and the old Aurorae library. Its source does not check the layout script, splash QML, desktop-theme `defaultWallpaperTheme`, or runtime loaded state: `theme/tools/validate-global-themes.py:L7-L16`, `L117-L140`.

## 1. Provenance

| Item | Established value | Evidence and status |
|---|---|---|
| Upstream URL | `https://github.com/vinceliuice/Orchis-kde` | Repository provenance records `github.com/vinceliuice/Orchis-kde`: `theme/vendor/PROVENANCE.md:L6-L10`. U1 confirms the fetched remote. |
| Ref recorded by SP+ | `main @ 2025-10-18` | `theme/vendor/PROVENANCE.md:L6-L10`. |
| Immutable commit/tag recorded at vendoring time | **UNKNOWN —** the provenance row records a branch and date, not a commit hash or tag | `theme/vendor/PROVENANCE.md:L6-L10`. |
| Comparison ref used in this audit | `main` at `b2a96919eee40264e79db402b915f926436100ad` | U1. This establishes the comparison checkout, not an immutable ref recorded by the vendor. |
| Upstream licence file | Present: root `LICENSE`; the upstream metadata also identifies GPL3 | `/tmp/orchis-kde-audit-b2a96919/LICENSE:L1-L10`; upstream package metadata `/tmp/orchis-kde-audit-b2a96919/plasma/look-and-feel/com.github.vinceliuice.Orchis/metadata.json:L1-L32`. |
| Local licence file inside the audited Orchis asset roots | No licence file found under the local Orchis look-and-feel, desktop-theme, Aurorae, or color-scheme roots; the local LNF metadata declares `GPL-3.0` | U3's four-root license search; local declarations: `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/metadata.json:L4-L14`, `theme/vendor/desktoptheme/Orchis/metadata.desktop:L1-L10`, `theme/vendor/aurorae/Orchis/metadata.desktop:L1-L9`. |
| Local component fidelity | Desktop theme, Aurorae tree, and `Orchis.colors` are byte-identical to the comparison checkout; local look-and-feel defaults and metadata are normalized; upstream LNF `metadata.desktop` is not local | U2. |
| SP+ provenance explanation | SP+ says the vendored global themes were normalized because of missing fonts, dangling references, Plasma 5 decoration IDs, and Orchis tabbox keys | `theme/vendor/PROVENANCE.md:L13-L46`. |

The exact original source ref remains **UNKNOWN —** beyond the recorded branch/date, because the local provenance did not preserve a hash and the local look-and-feel package is intentionally not byte-identical to the comparison checkout.

## 2. Shipped assets

### 2.1 Local source-to-image destinations

The broad `COPY` roots preserve the local Orchis files under these destinations:

| Local source | Destination in the image | What is in the local Orchis tree | Containerfile evidence | Existing `test44` evidence |
|---|---|---|---|---|
| `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/` | `/usr/share/plasma/look-and-feel/com.github.vinceliuice.Orchis/` | `contents/defaults`; `contents/layouts/org.kde.plasma.desktop-layout.js`; preview images; `contents/splash/Splash.qml` and its three image assets | `images/kde/Containerfile:L1007-L1016` | Package directory, metadata, layout, and splash paths present in I2; defaults/layout/metadata hashes match in I4 |
| `theme/vendor/desktoptheme/Orchis/` | `/usr/share/plasma/desktoptheme/Orchis/` | `dialogs/`, `solid/`, `translucent/`, `widgets/`, `metadata.desktop` | `images/kde/Containerfile:L1013-L1016` | Present in I2 |
| `theme/vendor/aurorae/Orchis/` | `/usr/share/aurorae/themes/Orchis/` | `decoration.svg`, `Orchisrc`, metadata, and the standard button SVGs | `images/kde/Containerfile:L1013-L1016` | Present in I2; the image has the v2 Aurorae plugin in I3/path checks |
| `theme/vendor/color-schemes/Orchis.colors` | `/usr/share/color-schemes/Orchis.colors` | Orchis color scheme file | `images/kde/Containerfile:L1013-L1016` | Present in I2; hash matches in I4 |
| `theme/sp-plus-calm/wallpapers/SPPlus-Calm/` | `/usr/share/wallpapers/SPPlus-Calm/` | SP+ wallpaper package selected by normalized defaults; not an upstream Orchis asset | `images/kde/Containerfile:L987-L1005` | Present in I2 |

The local look-and-feel package has 10 files, the local Orchis desktop theme has 43, and the local Orchis Aurorae tree has 10. Direct local inventory: `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/`, `theme/vendor/desktoptheme/Orchis/`, and `theme/vendor/aurorae/Orchis/`.

### 2.2 Present local files not copied

No runtime Orchis asset in the four source roots above is outside the broad `COPY` roots. Therefore there is no locally present Orchis asset silently dropped by the Containerfile. `theme/vendor/PROVENANCE.md` is not copied, but it is repository documentation, not a runtime theme asset: `images/kde/Containerfile:L1013-L1017`.

### 2.3 Upstream assets not vendored or shipped

These are upstream files, not local files silently missed by the Containerfile:

| Upstream tree | Status in local SP+ source/image | Consequence |
|---|---|---|
| `Kvantum/Orchis/`, `Kvantum/Orchis-solid/` | Not vendored; `/usr/share/Kvantum/Orchis` and `/usr/share/Kvantum/Orchis-solid` are absent in I2 | The upstream package ships these skins, but its raw defaults only select the Kvantum engine; the README separately recommends `ChromeOS`. The normalized local package selects Breeze instead. |
| `wallpaper/Orchis/` | Not vendored; `/usr/share/wallpapers/Orchis` is absent in I2 | The local desktop-theme metadata still says `defaultWallpaperTheme=Orchis`: `theme/vendor/desktoptheme/Orchis/metadata.desktop:L19-L23`. The normalized LNF defaults select `SPPlus-Calm`, so whether the dangling desktop-theme default is exercised is **UNKNOWN —** select the desktop theme without the LNF wallpaper override and inspect the effective wallpaper. |
| `sddm/5.0/Orchis/` and `sddm/6.0/Orchis/` | Not vendored; no Orchis SDDM tree is copied by `images/kde/Containerfile:L1013-L1017` | The upstream LNF dependency points at an SDDM theme, but an Orchis SDDM login theme is not part of SP+ shipping. |
| Upstream `com.github.vinceliuice.Orchis-dark`, extra desktop-theme/Aurorae variants | Not vendored | The SP+ offer is the normalized light Orchis package and `aurorae/Orchis`, not the upstream variant set. |
| Upstream LNF `metadata.desktop` | Not present locally | This is a local package normalization difference, not a Containerfile copy omission; U2. |

The upstream package's own installer copies the broader component set: `/tmp/orchis-kde-audit-b2a96919/install.sh:L42-L63`. The local Containerfile deliberately copies only the local vendor roots and the separate SP+ wallpaper: `images/kde/Containerfile:L987-L1017`.

## 3. Creator-intended configuration

### 3.1 Raw upstream creator declaration

The upstream `contents/defaults` at the comparison ref declares the following:

| Config file:group:key | Upstream value | Evidence |
|---|---|---|
| `kcminputrc:Mouse:cursorTheme` | `Vimix` | `/tmp/orchis-kde-audit-b2a96919/plasma/look-and-feel/com.github.vinceliuice.Orchis/contents/defaults:L1-L2` |
| `kdeglobals:General:ColorScheme` | `Orchis` | Same file `L4-L5` |
| `kdeglobals:Icons:Theme` | `Tela-circle` | Same file `L7-L8` |
| `kdeglobals:KDE:widgetStyle` | `kvantum` | Same file `L10-L11` |
| `kwinrc:DesktopSwitcher:LayoutName` | `org.kde.breeze.desktop` | Same file `L13-L14` |
| `kwinrc:WindowSwitcher:LayoutName` | `org.kde.breeze.desktop` | Same file `L16-L17` |
| `kwinrc:org.kde.kdecoration2:ButtonsOnLeft` | empty | Same file `L19-L20` |
| `kwinrc:org.kde.kdecoration2:ButtonsOnRight` | `IAX` | Same file `L21-L22` |
| `kwinrc:org.kde.kdecoration2:library` | `org.kde.kwin.aurorae` | Same file `L23-L24` |
| `kwinrc:org.kde.kdecoration2:theme` | `__aurorae__svg__Orchis` | Same file `L25-L26` |
| `plasmarc:Theme:name` | `Orchis` | Same file `L28-L29` |

The raw upstream file does not declare a font, wallpaper image, or `ksplashrc` value. Its metadata declares seven KNS dependencies for colors, Plasma theme, Aurorae, wallpaper, SDDM, icons, and cursor: `/tmp/orchis-kde-audit-b2a96919/plasma/look-and-feel/com.github.vinceliuice.Orchis/metadata.json:L1-L32` and the upstream legacy metadata `/tmp/orchis-kde-audit-b2a96919/plasma/look-and-feel/com.github.vinceliuice.Orchis/metadata.desktop:L1-L18`.

### 3.2 Local normalized declaration actually vendored

The local package is not the raw creator declaration. Its `contents/defaults` is:

| Config file:group:key | Local value | Evidence |
|---|---|---|
| `kdeglobals:General:ColorScheme` | `Orchis` | `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/defaults:L5-L6` |
| `kdeglobals:General:font` | `Noto Sans,10,-1,5,50,0,0,0,0,0` | Same file `L7` |
| `kdeglobals:General:menuFont` | `Noto Sans,10,-1,5,50,0,0,0,0,0` | Same file `L8` |
| `kdeglobals:General:toolBarFont` | `Noto Sans,10,-1,5,50,0,0,0,0,0` | Same file `L9` |
| `kdeglobals:General:activeFont` | `Noto Sans,10,-1,5,50,0,0,0,0,0` | Same file `L10` |
| `kdeglobals:General:smallestReadableFont` | `Noto Sans,9,-1,5,50,0,0,0,0,0` | Same file `L11` |
| `kdeglobals:Icons:Theme` | `Papirus` | Same file `L13-L14` |
| `kdeglobals:KDE:widgetStyle` | `Breeze` | Same file `L16-L17` |
| `kcminputrc:Mouse:cursorTheme` | `breeze_cursors` | Same file `L19-L20` |
| `plasmarc:Theme:name` | `Orchis` | Same file `L22-L23` |
| `kdeglobals:Wallpaper:Image` | `SPPlus-Calm` (declared under the bare `[Wallpaper]` header) | Same file `L25-L26`; parser behavior: `config/spplus-apply-theme:L51-L69` |
| `kwinrc:org.kde.kdecoration2:library` | `org.kde.kwin.aurorae.v2` | Same file `L28-L29` |
| `kwinrc:org.kde.kdecoration2:theme` | `__aurorae__svg__Orchis` | Same file `L28-L30` |
| `kwinrc:org.kde.kdecoration2:ButtonsOnLeft` | empty | Same file `L28-L31` |
| `kwinrc:org.kde.kdecoration2:ButtonsOnRight` | `IAX` | Same file `L28-L32` |
| `ksplashrc:KSplash:Theme` | `none` | Same file `L34-L35` |

The local metadata is a Plasma/LookAndFeel JSON package with matching ID and `X-Plasma-APIVersion=2`, but a renamed display name, local version, and no upstream KNS dependency list: `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/metadata.json:L1-L16`; compare `/tmp/orchis-kde-audit-b2a96919/plasma/look-and-feel/com.github.vinceliuice.Orchis/metadata.json:L1-L32`.

### 3.3 Package surfaces

| Surface | Local source status | Runtime meaning |
|---|---|---|
| `contents/layouts/org.kde.plasma.desktop-layout.js` | Present and copied | A shell layout script, evaluated when the look-and-feel manager applies/reset-loads the package layout; exact effect is in section 6. |
| `contents/previews/fullscreenpreview.jpg`, `preview.png`, `splash.png` | Present and copied | Preview/KCM assets, not the running desktop: `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L104-L117`. |
| `contents/splash/Splash.qml` plus `images/background.jpg`, `rectangle.svg`, `kde.svg` | Present and copied; upstream-identical according to U2 | KSplash QML surface when the selected `ksplashrc` theme points to this package. |
| `contents/logout`, `windowswitcher`, `lockscreen`, `osd`, `loginmanager` | Absent from the local package | No local implementation in those directories. Plasma 6 surface behavior is documented at `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L104-L117`. |

### 3.4 Splash screen status

The Orchis splash is physically shipped in source and in the existing image, but the normalized defaults select `ksplashrc:KSplash:Theme=none`, not the Orchis package: `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/defaults:L34-L35`; I2. The current Windows Modern first-login package also declares `Theme=none`: `theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/defaults:L37-L38`. This means the Orchis KSplash is not the selected normal SP+ splash according to the audited defaults.

The QML effect is source-visible: it imports `QtQuick 2.1`, draws `images/background.jpg`, overlays `images/rectangle.svg` containing `images/kde.svg`, starts its intro animation when `stage == 1`, and animates a progress bar from `stage`: `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/splash/Splash.qml:L20-L67`. The two 1,000 ms `Easing.InOutBack` animations target `topRect` and `bottomRect`: `L72-L94`. No `bottomRect` object is declared anywhere in this QML file; the exact source search returned the `target` and `to` references only. The consequence when KSplash evaluates that animation is **UNKNOWN —** start a real KSplash session and inspect the user journal/frame. Because `Theme=none` is the local selection, this source issue is not established as a normal first-login visual failure.

This is a KSplash package surface, not proof of the boot/Plymouth splash. Whether any boot splash uses Orchis is **UNKNOWN —** inspect the selected Plymouth theme separately.

## 4. Dependencies

### 4.1 Dependencies required by the normalized local declaration

| Dependency or referenced surface | Why it is required | Existing `test44` status | Packaging/source evidence |
|---|---|---|---|
| `Orchis.colors` | `kdeglobals:General:ColorScheme=Orchis` | Present at `/usr/share/color-schemes/Orchis.colors`; local file is copied | `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/defaults:L5-L6`; `images/kde/Containerfile:L1013-L1016`; I2/I4 |
| Plasma desktop theme `Orchis` | `plasmarc:Theme:name=Orchis` | Present at `/usr/share/plasma/desktoptheme/Orchis` | Defaults `L22-L23`; source tree and copy root `images/kde/Containerfile:L1013-L1016`; I2 |
| Aurorae theme `Orchis` | `__aurorae__svg__Orchis` | Present at `/usr/share/aurorae/themes/Orchis` | Defaults `L28-L30`; `theme/vendor/aurorae/Orchis/metadata.desktop:L1-L10`; I2 |
| Aurorae v2 KDecoration3 plugin | `library=org.kde.kwin.aurorae.v2` | Plugin present in the image | Defaults `L28-L30`; Plasma 6 constraint `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L65-L84`; I2/I3 |
| Papirus icons | `kdeglobals:Icons:Theme=Papirus` | Directory and Fedora package present | Defaults `L13-L14`; `images/kde/Containerfile:L1037-L1049`; I2/I3 |
| Breeze cursors | `kcminputrc:Mouse:cursorTheme=breeze_cursors` | Directory and Fedora package present | Defaults `L19-L20`; `images/kde/Containerfile:L1113-L1135`; I2/I3 |
| Noto Sans | Five local font defaults | Font resolves to `/usr/share/fonts/google-noto/NotoSans-Regular.ttf`; Fedora package present | Defaults `L7-L11`; helper font policy `config/spplus-apply-theme:L30-L40`, `L122-L127`; I2/I3 |
| Breeze Qt widget style | `kdeglobals:KDE:widgetStyle=Breeze` | Qt6 Breeze style plugin present | Defaults `L16-L17`; image path/package readback in I2/I3 |
| SPPlus-Calm wallpaper package | bare `[Wallpaper] Image=SPPlus-Calm` | Package and 3840x2160 image present | Defaults `L25-L26`; `images/kde/Containerfile:L1004-L1005`, `L1090-L1096`; I2 |
| `org.kde.image` wallpaper plugin | Layout sets `wallpaperplugin` and `wallpaperPlugin` to this ID | Plugin present from `plasma-workspace` in the image | Layout `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/layouts/org.kde.plasma.desktop-layout.js:L28-L34`, `L48-L53`; I2 |
| `Cantarell Light` | Digital-clock layout config sets `fontFamily` to this family | Resolves to `Cantarell-Light.otf`; `abattis-cantarell-fonts` is installed | Layout `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/layouts/org.kde.plasma.desktop-layout.js:L129-L147`; I2/I3 |
| Native applets | Layout names analog clock, Kickoff, appmenu, panel spacer, color picker, system tray, and digital clock | All seven plugin files present; ownership is in I3 | Layout `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/layouts/org.kde.plasma.desktop-layout.js:L20-L25`, `L59-L80`, `L82-L102`, `L104-L127`, `L129-L147`; I3 |
| `systemsettings.desktop`, `org.kde.kinfocenter.desktop` | Kickoff `systemApplications` value | Both desktop files present in the image; package readback found `plasma-systemsettings` and `kinfocenter` | Layout `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/layouts/org.kde.plasma.desktop-layout.js:L72-L75`; existing-image readback I3 |

The local declaration has no custom applet binary and no custom icon/cursor asset. All named layout applets are stock Plasma IDs. The static global-theme gate passes the normalized package in the existing image, but that pass does not establish that the layout, fonts, splash, or live decoration actually loaded: I5 and `theme/tools/validate-global-themes.py:L7-L16`, `L117-L146`.

### 4.2 Creator-original dependencies that are not satisfied by the image

| Upstream value | Image/source status | Classification |
|---|---|---|
| `Vimix` cursor | Not in local source; `/usr/share/icons/Vimix` absent in I2 | `REQUIRED-COMPAT`: the provenance records this as an upstream dangling reference: `theme/vendor/PROVENANCE.md:L27-L30`. |
| `Tela-circle` icons | Not in local source; `/usr/share/icons/Tela-circle` absent in I2 | `REQUIRED-COMPAT`: same provenance finding. |
| `kvantum` engine and active skin | The raw package declares only `widgetStyle=kvantum`; the upstream README recommends choosing `ChromeOS` in `kvantummanager`, while the repository also ships Orchis Kvantum trees. `test44` has the engine but neither `/usr/share/Kvantum/ChromeOS` nor `/usr/share/Kvantum/Orchis`; local defaults use Breeze | `SP+-POLICY` for the normalized Breeze selection; no active upstream skin is established. README recommendation `/tmp/orchis-kde-audit-b2a96919/README.md:L11-L16`; upstream inventory U2/U3; local defaults `L16-L17`; I2. |
| Upstream Orchis wallpaper | Upstream `wallpaper/Orchis` exists, but is not local and `/usr/share/wallpapers/Orchis` is absent | `REQUIRED-COMPAT` for the copied desktop-theme metadata reference `defaultWallpaperTheme=Orchis`: `theme/vendor/desktoptheme/Orchis/metadata.desktop:L19-L23`; actual activation is **UNKNOWN —**. |
| Upstream SDDM Orchis theme | Upstream `sddm/5.0` and `sddm/6.0` exist; no local SDDM copy | `UNEXPLAINED`: the local LNF metadata removes the upstream KNS SDDM dependency, while the image does not ship the Orchis SDDM package. |

The normalized package replaces the two creator asset references that would dangle (`Vimix` and `Tela-circle`) and avoids the upstream Kvantum skin dependency by selecting image-resident or base-system values. The reason for the icon and cursor substitutions is explicit in provenance; the exact decision record for omitting upstream SDDM/Kvantum/wallpaper trees is **UNKNOWN —**.

## 5. Plasma6 compatibility

| Surface or sign | Evidence | Classification/status |
|---|---|---|
| Local global-theme metadata | `KPackageStructure=Plasma/LookAndFeel`, matching `Id=com.github.vinceliuice.Orchis`, and `X-Plasma-APIVersion=2` | Positive Plasma 6 package shape: `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/metadata.json:L1-L16`. |
| Upstream Plasma 5 tabbox keys | Upstream declares `[kwinrc][DesktopSwitcher]` and `[WindowSwitcher]`; local normalized defaults omit both | `REQUIRED-COMPAT`: SP+ provenance says the keys are Plasma 5 keys rejected by its theme gate: `theme/vendor/PROVENANCE.md:L31-L32`; upstream defaults lines `L13-L17`; local defaults grep has no match. Plasma 6's effective task-switcher key is `kwinrc:TabBox:LayoutName`: `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L104-L112`. |
| Aurorae plugin ID | Upstream raw value is `org.kde.kwin.aurorae`; local value is `org.kde.kwin.aurorae.v2` | `REQUIRED-COMPAT` correction for new Plasma 6 SVG Aurorae configuration: `theme/vendor/PROVENANCE.md:L18-L20`; `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L65-L84`; local defaults `L28-L30`. |
| Aurorae directory format | Local `decoration.svg`, standard button SVGs, `Orchisrc`, and metadata are present | Source indicates the v2 bridge accepts this legacy SVG/rc structure under the exact directory: `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L77-L84`; local tree `theme/vendor/aurorae/Orchis/`. Loaded rendering remains **UNKNOWN —** until KWin support information is read back. |
| QML import | `Splash.qml` uses `import QtQuick 2.1` | Concrete versioned import marker; whether Qt6 accepts and loads it is **UNKNOWN —**. The file is byte-identical to upstream per U2; source line `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/splash/Splash.qml:L20`. |
| Splash QML identifier | `bottomRect` is referenced but not declared | Source-level unresolved identifier candidate; actual KSplash consequence is **UNKNOWN —**. `Splash.qml:L72-L94`; exact source grep in the audit evidence. |
| Package metadata conversion | Upstream includes `metadata.json` and `metadata.desktop`; local keeps authored JSON and omits the upstream desktop file | Local JSON is present and ID-matched. Whether omitting `X-Plasma-MainScript=defaults` and `X-KPackage-Dependencies` changes any Plasma 6 manager behavior is **UNKNOWN —**; compare local metadata `L1-L16` with upstream metadata `L1-L32`. |
| Layout API | The script calls `getApiVersion(1)` and `loadSerializedLayout(layout)` | This is a concrete serialized-layout API use, not a live compatibility result: layout `L1`, `L173-L177`. Live execution and resulting panel state are **UNKNOWN —**. |
| Unsupported package surfaces | No local `lockscreen`, `osd`, or `loginmanager` package directories | Consistent with Plasma 6.7 package-surface findings: `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L104-L117`. |
| Existing image runtime base | Plasma packages are 6.7.4 and both Aurorae plugin IDs are present | Establishes available image runtime components only; I2/I3. It does not prove Orchis is selected or rendered. |

No source or existing-image evidence proves a live Orchis application in this audit. The static gate's `8/8 errors=0` result is a file/config completeness result, not a Plasma session result: I5.

## 6. Layout

### 6.1 Execution and high-level result

The script obtains serialized layout API version 1, builds one desktop and one panel, and calls `plasma.loadSerializedLayout(layout)`: `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/layouts/org.kde.plasma.desktop-layout.js:L1-L6`, `L55-L58`, `L172-L177`.

If Plasma evaluates it, the literal result is:

- **One desktop object**, with one `org.kde.plasma.analogclock` applet: `L3-L26`.
- **One panel object**, aligned center, containing six applets in this exact order: Kickoff, appmenu, panel spacer, color picker, system tray, digital clock: `L56-L59`, `L80`, `L91`, `L102`, `L116`, `L127`, `L147`.
- **Panel geometry:** `location="top"`, `hiding="normal"`, `height=1.631578947368421`, `minimumLength=101.05263157894737`, `maximumLength=101.05263157894737`, `offset=0`: `L165-L170`.
- **Desktop wallpaper plugin:** `org.kde.image`, both as desktop config `wallpaperplugin` and object `wallpaperPlugin`: `L28-L34`, `L48-L53`.
- **Panel wallpaper plugin:** also `org.kde.image`: `L150-L155`.
- **Containment immutability:** desktop, panel, and every listed applet set `immutability="1"`: desktop `L28-L34`; panel `L150-L155`; Kickoff `L61-L64`; appmenu `L83-L89`; spacer `L94-L100`; color picker `L105-L111`; system tray `L119-L125`; digital clock `L130-L136`.
- **Screen assignment:** desktop and panel both set `lastScreen="0"`: `L28-L34`, `L150-L155`. The script does not iterate screens or derive a screen index.

`--resetLayout` is destructive and asynchronous in Plasma 6.7: it deletes and recreates shell containments, then evaluates the selected package layout; no exported completion signal exists. `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L119-L164`. Therefore the exact layout above describes the script's serialized request, not an observed live desktop.

### 6.2 Exact applet configuration

| Position | Plugin | Exact additional configuration | Evidence |
|---:|---|---|---|
| Desktop | `org.kde.plasma.analogclock` | `showSecondHand=true`; root `PreloadWeight=4`; dialog `DialogHeight=1140`, `DialogWidth=1520`; geometry x/y/width/height all `0`; title `Analog Clock` | `L8-L25` |
| 0 | `org.kde.plasma.kickoff` | applet immutable; `PreloadWeight=100`; config dialog `1140x1520`; `favoritesPortedToKAstats=true`; `systemApplications=systemsettings.desktop,org.kde.kinfocenter.desktop`; global shortcut `Alt+F1` | `L59-L80` |
| 1 | `org.kde.plasma.appmenu` | applet immutable; `PreloadWeight=0` | `L82-L92` |
| 2 | `org.kde.plasma.panelspacer` | applet immutable; `PreloadWeight=0` | `L93-L103` |
| 3 | `org.kde.plasma.colorpicker` | applet immutable; `PreloadWeight=0`; history `#242424,#212121,#a645b7,#cccfd0` | `L104-L117` |
| 4 | `org.kde.plasma.systemtray` | applet immutable; `PreloadWeight=100` | `L118-L128` |
| 5 | `org.kde.plasma.digitalclock` | applet immutable; `PreloadWeight=20`; `fontFamily=Cantarell Light`; `showDate=false`; `use24hFormat=2`; dialog `1140x1520` | `L129-L148` |

### 6.3 Desktop and panel config literals

| Object | Exact literal | Evidence |
|---|---|---|
| Desktop root | `ItemGeometriesHorizontal=Applet-49:3072,192,544,512,0;` | `L28-L34` |
| Desktop root | `formfactor=0`, `immutability=1`, `lastScreen=0`, `wallpaperplugin=org.kde.image` | `L28-L34` |
| Desktop root dialog | `DialogHeight=1959`, `DialogWidth=3840` | `L36-L38` |
| Desktop root config | `PreloadWeight=0` | `L40-L42` |
| Desktop toolbox | `ToolBoxButtonState=topcenter`, `ToolBoxButtonX=1299`, `ToolBoxButtonY=62` | `L43-L46` |
| Desktop wallpaper | `Image=/home/vince/.local/share/wallpapers/Orchis/` | `L48-L50` |
| Desktop slide paths | `/home/vince/.local/share/wallpapers,/usr/share/wallpapers` | `L48-L50` |
| Panel root | `formfactor=2`, `immutability=1`, `lastScreen=0`, `wallpaperplugin=org.kde.image` | `L150-L155` |
| Panel dialog | `DialogHeight=129`, `DialogWidth=3840` | `L157-L159` |
| Panel config | `PreloadWeight=0` | `L161-L163` |
| Panel geometry | `height=1.631578947368421`, `hiding=normal`, `location=top`, `maximumLength=101.05263157894737`, `minimumLength=101.05263157894737`, `offset=0` | `L165-L170` |
| Layout serialization | `serializationFormatVersion=1` | `L172-L174` |

### 6.4 Non-portable and target-sensitive values

These are the values in the script that are not portable advisor-independent specifications. The first two are definite creator-home references. The remaining rows are fixed serialized geometry, screen, font, or application values that can be accepted only if the target image/session satisfies them.

| Value | Why it cannot be treated as portable | Line |
|---|---|---:|
| `/home/vince/.local/share/wallpapers/Orchis/` | Hard-coded creator username and home-relative wallpaper directory. That directory does not exist in the SP+ image; the local normalized default instead names `SPPlus-Calm`. | 49 |
| `/home/vince/.local/share/wallpapers` | Hard-coded creator username and home-relative slide directory. | 50 |
| `/usr/share/wallpapers` | Hard-coded system path. It is conventional in this Fedora image, but still not a dynamic package lookup. | 50 |
| `Applet-49:3072,192,544,512,0;` | Hard-coded applet instance/geometry serialization; it contains a creator-specific instance label and fixed coordinates/sizes rather than a screen-relative placement. | 30 |
| `geometry.height=0`, `geometry.width=0`, `geometry.x=0`, `geometry.y=0` | Fixed zero geometry for the desktop clock; whether the target shell interprets this as automatic placement is target-dependent. | 20-23 |
| `lastScreen=0` | Pins both containments to screen index 0; there is no screen-topology loop. | 33, 154 |
| `ToolBoxButtonX=1299`, `ToolBoxButtonY=62` | Fixed desktop-toolbox coordinates. | 45-46 |
| Desktop `DialogHeight=1959`, `DialogWidth=3840` | Fixed saved desktop configuration-dialog dimensions. | 37-38 |
| Analog-clock `DialogHeight=1140`, `DialogWidth=1520` | Fixed saved applet configuration-dialog dimensions. | 13-14 |
| Kickoff `DialogHeight=1140`, `DialogWidth=1520` | Fixed saved applet configuration-dialog dimensions. | 69-70 |
| Digital-clock `DialogHeight=1140`, `DialogWidth=1520` | Fixed saved applet configuration-dialog dimensions. | 143-144 |
| Panel `DialogHeight=129`, `DialogWidth=3840` | Fixed saved panel configuration-dialog dimensions. | 157-159 |
| `height=1.631578947368421` | Fixed serialized panel height; no target DPI or available-edge calculation occurs in this script. | 165 |
| `maximumLength=101.05263157894737`, `minimumLength=101.05263157894737` | Fixed serialized panel lengths; no target width calculation occurs in this script. | 168-169 |
| `fontFamily=Cantarell Light` | Requires a font family outside the Orchis package. It resolves in `test44` through `abattis-cantarell-fonts`, but is not portable to an image without that font. | 138 |
| `systemsettings.desktop`, `org.kde.kinfocenter.desktop` | Fixed desktop-file IDs. Both exist in `test44`; a smaller/different target image could not satisfy the Kickoff references. | 74 |
| `Alt+F1` | Fixed global shortcut, potentially colliding with an advisor's existing shortcut policy. | 77 |
| `#242424,#212121,#a645b7,#cccfd0` | Fixed color-picker history from the creator package, not derived from the local Orchis palette. | 113 |

The fixed geometry values are source facts, not a claim that each one will visibly fail on the SP+ target. Their actual clipping, scaling, and placement are **UNKNOWN —** apply the script in a fresh live session, dump the resulting layout, and inspect at each supported display topology.

### 6.5 Layout shipping and application status

The layout file is copied into the image and its hash matches the source in I4. The existing-image static gate does not execute it. The current SP+ first-login unit applies **Windows Modern dark**, not Orchis, with `--resetLayout`: `config/spplus-first-login:L17-L23`, `L82-L99`. The Welcome theme picker calls `spplus-apply-theme` for a selected ID: `welcome/welcome.py:L885-L897`; that helper invokes `plasma-apply-lookandfeel -a <id>` without `--resetLayout`: `config/spplus-apply-theme:L112-L118`.

According to the pinned Plasma 6 findings, the no-`--resetLayout` helper path does not add the package's layout settings, while `--resetLayout` destroys/recreates shell containments and then loads the layout: `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L119-L164`. Therefore:

- The Orchis layout is **shipped**.
- The first-login path does not select Orchis at all.
- The Welcome selection path writes the Orchis appearance defaults but is not shown by source to apply the Orchis panel/desktop layout.
- Whether a separate Plasma behavior causes that layout to load anyway is **UNKNOWN —** perform the live dump in section 8.

## 7. SP+ divergences

For this section, “creator baseline” means section 3.1, “local declaration” means section 3.2, and “current behavior” means the audited Containerfile, first-login unit, helper, and Welcome call path. Classifications are:

- **`SP+-POLICY`**: an explicit SP+ choice in source.
- **`REQUIRED-COMPAT`**: a source value or path that would not reliably produce the intended Plasma 6/Fedora result without correction.
- **`UNEXPLAINED`**: the difference is visible, but no reason is established by the audited source.

### 7.1 Creator baseline to local vendored declaration

| Divergence | Classification | Evidence |
|---|---|---|
| `Vimix` cursor becomes `breeze_cursors` | `REQUIRED-COMPAT` | Upstream defaults `/tmp/orchis-kde-audit-b2a96919/plasma/look-and-feel/com.github.vinceliuice.Orchis/contents/defaults:L1-L2`; local defaults `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/defaults:L19-L20`; provenance says upstream `Vimix` is not shipped and would leave the cursor unchanged: `theme/vendor/PROVENANCE.md:L27-L30`; I2 confirms absence/presence. |
| `Tela-circle` icons become `Papirus` | `REQUIRED-COMPAT` | Upstream defaults `L7-L8`; local defaults `L13-L14`; provenance and I2. |
| `kvantum` widget style becomes `Breeze` | `SP+-POLICY` | Upstream defaults `L10-L11`; local defaults `L16-L17`; SP+ records Breeze as the common widget style because the active Kvantum skin lives outside a global theme package: `theme/vendor/PROVENANCE.md:L36-L43`. |
| Five Noto font keys are added | `SP+-POLICY` | Upstream raw defaults contain no fonts; local defaults add five: upstream `/tmp/orchis-kde-audit-b2a96919/plasma/look-and-feel/com.github.vinceliuice.Orchis/contents/defaults:L1-L29`, local `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/defaults:L5-L11`; common SP+ font policy `config/spplus-apply-theme:L30-L40`, `L122-L127`. |
| `org.kde.kwin.aurorae` becomes `org.kde.kwin.aurorae.v2` | `REQUIRED-COMPAT` | Upstream `L23-L26`; local `L28-L30`; Plasma 6.7 Aurorae constraint `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L65-L84`. |
| Upstream `[DesktopSwitcher]` and `[WindowSwitcher]` declarations are removed | `REQUIRED-COMPAT` | Upstream `/tmp/orchis-kde-audit-b2a96919/plasma/look-and-feel/com.github.vinceliuice.Orchis/contents/defaults:L13-L17`; local grep has no match; provenance identifies them as Plasma 5 keys rejected by the SP+ gate: `theme/vendor/PROVENANCE.md:L31-L32`. |
| `Wallpaper:Image` is added as `SPPlus-Calm` | `SP+-POLICY` | Upstream raw defaults have no wallpaper row; local defaults `L25-L26`; separate wallpaper copy `images/kde/Containerfile:L1004-L1005`. |
| `ksplashrc:KSplash:Theme=none` is added | `SP+-POLICY` | Upstream raw defaults have no `ksplashrc` row; local `L34-L35`; the local Windows default also sets `Theme=none`: `theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/defaults:L37-L38`. |
| Local metadata is an authored 17-line JSON file named `Orchis Light`, version `1.0`, with no KNS dependencies; upstream JSON/desktop metadata carries description, service data, main script, and seven KNS dependencies | `UNEXPLAINED` for the omitted metadata fields and dependency declarations | Local `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/metadata.json:L1-L16`; upstream JSON `/tmp/orchis-kde-audit-b2a96919/plasma/look-and-feel/com.github.vinceliuice.Orchis/metadata.json:L1-L32`; upstream desktop metadata `/tmp/orchis-kde-audit-b2a96919/plasma/look-and-feel/com.github.vinceliuice.Orchis/metadata.desktop:L1-L18`; provenance only states that `metadata.json` was authored with a matching ID: `theme/vendor/PROVENANCE.md:L34-L46`. |
| Upstream `Kvantum`, Orchis wallpaper, SDDM, dark, and scale/Aurorae variant trees are not vendored | `UNEXPLAINED` | Upstream installer/inventory U2/U3; local copy roots `images/kde/Containerfile:L1013-L1017`; no source decision explaining each omitted upstream tree was found. |
| Desktop-theme metadata still says `defaultWallpaperTheme=Orchis` while the upstream Orchis wallpaper is not local | `REQUIRED-COMPAT` | `theme/vendor/desktoptheme/Orchis/metadata.desktop:L19-L23`; I2; local LNF explicitly selects SPPlus-Calm. Whether the metadata fallback is ever exercised is **UNKNOWN —**. |

Values that remain the same between the raw upstream and local defaults are `ColorScheme=Orchis`, `plasmarc:Theme:name=Orchis`, `ButtonsOnLeft=`, `ButtonsOnRight=IAX`, and the Aurorae theme name. Evidence: upstream defaults `/tmp/orchis-kde-audit-b2a96919/plasma/look-and-feel/com.github.vinceliuice.Orchis/contents/defaults:L4-L29`; local defaults `theme/vendor/look-and-feel/com.github.vinceliuice.Orchis/contents/defaults:L5-L32`.

### 7.2 Local declaration to current SP+ behavior

| Current behavior difference | Classification | Evidence |
|---|---|---|
| A fresh system account is seeded with Windows Modern dark, not Orchis Light | `SP+-POLICY` | Containerfile writes `WindowsModernDark`, `Papirus-Dark`, `kvantum-dark`, `Windows-modern-dark`, and the Windows Aurorae theme under `/etc/xdg`: `images/kde/Containerfile:L1051-L1092`. |
| First-login explicitly applies `org.secureprospective.spplus.windows11.dark`, not `com.github.vinceliuice.Orchis` | `SP+-POLICY` | `config/spplus-first-login:L17-L23`, `L82-L99`; the Windows package's values are at `theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/defaults:L5-L38`. |
| First-login applies and resets a Windows layout, so its first panel is not the Orchis layout | `SP+-POLICY` | `/usr/sbin/plasma-apply-lookandfeel -a "$LNF" --resetLayout`: `config/spplus-first-login:L82-L86`; Windows layout file `theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/layouts/org.kde.plasma.desktop-layout.js:L1-L58`. |
| The Welcome selector advertises that each choice changes the whole desktop, but its helper call does not pass `--resetLayout`; the Orchis layout is therefore not shown by source to be applied on selection | `UNEXPLAINED` | UI copy `welcome/app/index.html:L46-L56` and `welcome/app/app.js:L74-L88`; bridge call `welcome/welcome.py:L885-L897`; helper invocation `config/spplus-apply-theme:L112-L118`; Plasma reset behavior `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L119-L164`. |
| The helper handles Orchis's `Wallpaper:Image=SPPlus-Calm` as a raw value and passes that bare value to `plasma-apply-wallpaperimage`; first-login instead passes the absolute package directory | `REQUIRED-COMPAT` | Helper parser/special case and call: `config/spplus-apply-theme:L120-L139`; first-login absolute path and readback: `config/spplus-first-login:L17-L23`, `L110-L130`. Live wallpaper success for the Welcome path is **UNKNOWN —**. |
| The helper writes the local declared values after calling `plasma-apply-lookandfeel -a`, but does not use `kwriteconfig6 --notify` | `REQUIRED-COMPAT` | Helper write command `config/spplus-apply-theme:L72-L75`, call order `L112-L134`; Plasma notification requirements `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L32-L63`. |
| The helper attempts `KGlobalSettings.notifyChange` as a D-Bus method for types 0, 1, 2, and 4, and omits cursor type 5 | `REQUIRED-COMPAT` | `config/spplus-apply-theme:L78-L93`; Plasma 6 source-derived signal/method distinction and enum values `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L32-L51`. |
| The helper does not issue a component-specific font refresh after writing font keys | `REQUIRED-COMPAT` | Font writes `config/spplus-apply-theme:L122-L141`; required Plasma font listener path `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L53-L63`. |
| The helper ignores subprocess return codes and prints `SPPLUS_THEME_APPLIED` after attempted writes | `UNEXPLAINED` | `check=False` and final return path `config/spplus-apply-theme:L72-L83`, `L112-L146`. |
| Welcome treats helper return code as success/failure and reports “THE WHOLE DESKTOP CHANGED” on return code 0 | `UNEXPLAINED` | `welcome/welcome.py:L885-L897`; UI success text `welcome/app/app.js:L74-L88` and `welcome/app/app.js:L318-L327`. |
| The first-login verification checks Windows values and cursor, not the Orchis values, layout dump, loaded Aurorae plugin, or splash | `SP+-POLICY` for the selected Windows target; no Orchis runtime proof | `config/spplus-first-login:L65-L78`, `L82-L100`; no layout/decorative readback in that verification block. |
| The image has explicit extra system policy keys not declared by local Orchis: `TerminalApplication=kitty`, duplicated Windows `LookAndFeelPackage`, Wayland input-method settings, and system `Autolock=false` | `SP+-POLICY` | `images/kde/Containerfile:L1057-L1089`, `L1113-L1134`; these are image policy, not Orchis package defaults. |
| The installed static gate passes but does not test the local Orchis splash, layout, desktop-theme wallpaper metadata, or live state | `UNEXPLAINED` as a verification boundary | Gate implementation `theme/tools/validate-global-themes.py:L7-L16`, `L117-L146`; existing-image result I5. |

The helper does preserve the local Orchis values for color scheme, fonts, icon theme, widget style, cursor, Plasma desktop theme, decoration, buttons, and `ksplashrc` in its parsed write set; the live effective result is still subject to the notification, asynchronous shell, and failure-handling differences above: `config/spplus-apply-theme:L120-L145`.

## 8. Verification plan

These commands are intentionally written as failing assertions. Run them in the advisor's real Plasma 6.7 session after selecting **ORCHIS LIGHT** in Welcome, or after applying the package through the intended production path. Do not treat a zero return from `plasma-apply-*` as proof. The Plasma 6 findings require effective-config, loaded-decoration, shell-layout, and wallpaper readback: `docs/theme-manifests/PLASMA6-CONSTRAINTS.md:L17-L30`, `L119-L164`.

### 8.1 Package and asset existence

```sh
set -eu
id=com.github.vinceliuice.Orchis
root=/usr/share/plasma/look-and-feel/$id

# Discovery and package identity. Each assertion can fail.
plasma-apply-lookandfeel --list | grep -Fx -- "$id"
test -f "$root/metadata.json"
test "$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["KPlugin"]["Id"])' "$root/metadata.json")" = "$id"
test -f "$root/contents/defaults"
test -f "$root/contents/layouts/org.kde.plasma.desktop-layout.js"
test -f "$root/contents/splash/Splash.qml"
test -f "$root/contents/splash/images/background.jpg"
test -f "$root/contents/splash/images/rectangle.svg"
test -f "$root/contents/splash/images/kde.svg"
test -f /usr/share/plasma/desktoptheme/Orchis/metadata.desktop
test -f /usr/share/aurorae/themes/Orchis/Orchisrc
test -f /usr/share/aurorae/themes/Orchis/decoration.svg
test -f /usr/share/color-schemes/Orchis.colors
test -d /usr/share/icons/Papirus
test -d /usr/share/icons/breeze_cursors
test -d /usr/share/wallpapers/SPPlus-Calm
rpm -q plasma-workspace plasma-desktop kdeplasma-addons aurorae \
  plasma-breeze-qt6 plasma-breeze kvantum plasma-systemsettings kinfocenter \
  papirus-icon-theme breeze-cursor-theme google-noto-sans-fonts \
  abattis-cantarell-fonts
```

The creator-original missing references are separate negative checks, not expected requirements of the normalized local package:

```sh
set -eu
test ! -e /usr/share/icons/Vimix
test ! -e /usr/share/icons/Tela-circle
test ! -e /usr/share/Kvantum/ChromeOS
test ! -e /usr/share/Kvantum/Orchis
test ! -e /usr/share/wallpapers/Orchis
test ! -e "$root/metadata.desktop"
```

The final absence check is the normalized-package expectation, not a claim that upstream metadata is absent. Use the positive `test -f` checks above for the shipped local metadata and assets. Do not turn an absence check into a success-only wrapper when verifying a replacement decision.

### 8.2 Effective local Orchis values

Use `kreadconfig6` to read the effective cascade, not only a user file. Each line is an independent assertion and can fail:

```sh
set -eu

test "$(kreadconfig6 --file kdeglobals --group General --key ColorScheme)" = Orchis
test "$(kreadconfig6 --file kdeglobals --group General --key font)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'
test "$(kreadconfig6 --file kdeglobals --group General --key menuFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'
test "$(kreadconfig6 --file kdeglobals --group General --key toolBarFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'
test "$(kreadconfig6 --file kdeglobals --group General --key activeFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'
test "$(kreadconfig6 --file kdeglobals --group General --key smallestReadableFont)" = 'Noto Sans,9,-1,5,50,0,0,0,0,0'
test "$(kreadconfig6 --file kdeglobals --group Icons --key Theme)" = Papirus
test "$(kreadconfig6 --file kdeglobals --group KDE --key widgetStyle)" = Breeze
test "$(kreadconfig6 --file kcminputrc --group Mouse --key cursorTheme)" = breeze_cursors
test "$(kreadconfig6 --file plasmarc --group Theme --key name)" = Orchis
test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key library)" = org.kde.kwin.aurorae.v2
test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key theme)" = __aurorae__svg__Orchis
test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key ButtonsOnLeft --default __unset__)" = ''
test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key ButtonsOnRight)" = IAX
test "$(kreadconfig6 --file ksplashrc --group KSplash --key Theme)" = none
```

The wallpaper is written through the Plasma wallpaper utility rather than as a normal `kdeglobals` key by the helper: `config/spplus-apply-theme:L129-L139`. Read it back from the shell applet configuration:

```sh
set -eu
appletsrc="${XDG_CONFIG_HOME:-$HOME/.config}/plasma-org.kde.plasma.desktop-appletsrc"
test -s "$appletsrc"
grep -Fq '/usr/share/wallpapers/SPPlus-Calm' "$appletsrc"
```

Read back the external font and stock applets:

```sh
set -eu
fc-match -f '%{family}\n' 'Noto Sans' | grep -Fx 'Noto Sans'
fc-match -f '%{family}\n' 'Cantarell Light' | grep -Fq 'Cantarell'
test -f /usr/lib64/qt6/plugins/plasma/applets/org.kde.plasma.analogclock.so
test -f /usr/lib64/qt6/plugins/plasma/applets/org.kde.plasma.kickoff.so
test -f /usr/lib64/qt6/plugins/plasma/applets/org.kde.plasma.appmenu.so
test -f /usr/lib64/qt6/plugins/plasma/applets/org.kde.plasma.panelspacer.so
test -f /usr/lib64/qt6/plugins/plasma/applets/org.kde.plasma.colorpicker.so
test -f /usr/lib64/qt6/plugins/plasma/applets/org.kde.plasma.systemtray.so
test -f /usr/lib64/qt6/plugins/plasma/applets/org.kde.plasma.digitalclock.so
```

### 8.3 Loaded Aurorae and shell layout

The KWin config key is not enough. Read KWin's loaded support information:

```sh
set -eu
requested=org.kde.kwin.aurorae.v2
actual=$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key library)
test "$actual" = "$requested"
info=$(qdbus-qt6 org.kde.KWin /KWin org.kde.KWin.supportInformation)
printf '%s\n' "$info" | grep -Fq 'Plugin: org.kde.kwin.aurorae.v2'
printf '%s\n' "$info" | grep -Fq 'Theme: __aurorae__svg__Orchis'
```

Dump the live shell layout and assert the package's structural invariants. Each grep can fail:

```sh
set -eu
layout=/tmp/orchis-layout-after.js
qdbus-qt6 org.kde.plasmashell /PlasmaShell \
  org.kde.PlasmaShell.dumpCurrentLayoutJS > "$layout"
test -s "$layout"
grep -Fq 'org.kde.plasma.analogclock' "$layout"
grep -Fq 'org.kde.plasma.kickoff' "$layout"
grep -Fq 'org.kde.plasma.appmenu' "$layout"
grep -Fq 'org.kde.plasma.panelspacer' "$layout"
grep -Fq 'org.kde.plasma.colorpicker' "$layout"
grep -Fq 'org.kde.plasma.systemtray' "$layout"
grep -Fq 'org.kde.plasma.digitalclock' "$layout"
grep -Fq 'location = "top"' "$layout"
grep -Fq 'alignment = "center"' "$layout"
test "$(grep -Fc 'immutability = 1' "$layout")" -ge 8
```

The exact dump formatting for panel geometry can vary by shell serializer. If the structural greps pass but geometry is not represented in the expected syntax, inspect the raw dump and compare it with the source literals in section 6; do not replace a failed assertion with `true`.

### 8.4 Splash and desktop-theme wallpaper checks

```sh
set -eu
# File existence proves shipping, not that KSplash has rendered it.
test -f /usr/share/plasma/look-and-feel/com.github.vinceliuice.Orchis/contents/splash/Splash.qml
test -f /usr/share/plasma/look-and-feel/com.github.vinceliuice.Orchis/contents/splash/images/background.jpg
test -f /usr/share/plasma/look-and-feel/com.github.vinceliuice.Orchis/contents/splash/images/rectangle.svg
test -f /usr/share/plasma/look-and-feel/com.github.vinceliuice.Orchis/contents/splash/images/kde.svg
test "$(kreadconfig6 --file ksplashrc --group KSplash --key Theme)" = none
# The desktop-theme metadata reference is intentionally checked as a negative
# asset check until an Orchis wallpaper is either shipped or the metadata is changed.
test ! -e /usr/share/wallpapers/Orchis
```

To settle actual KSplash use and the unresolved `bottomRect` effect, log out and back in with a real session, then inspect:

```sh
journalctl --user -b --no-pager | grep -F -E 'ksplash|Splash.qml|bottomRect'
```

A journal match is evidence of evaluation, not by itself evidence of a visual result; capture the next-session frame as well.

## 9. Open questions

1. Should Orchis Light remain a selectable light theme with `ksplashrc:Theme=none`, or should its shipped KSplash surface be repaired, selected, and separately verified?
2. Should selecting Orchis in Welcome replace the panel/desktop layout, or should the current user layout be preserved while only appearance values change?
3. Should the desktop-theme `defaultWallpaperTheme=Orchis` reference be removed/changed, or should the upstream Orchis wallpaper package be added to SP+?
4. Should the normalized SP+ substitutions remain (`Papirus`, `breeze_cursors`, `Breeze`, Noto Sans, SPPlus-Calm), or should any creator-original Orchis dependencies be restored and packaged?
5. Should the upstream LNF metadata fields and KNS dependency declarations be retained in the local JSON package, or is the current static package contract the intended boundary?
6. What immutable upstream commit/tag should be recorded in `theme/vendor/PROVENANCE.md` for the next Orchis refresh?
7. Does the upstream-identical splash QML's `bottomRect` reference fail in the target Plasma/Qt6 KSplash runtime, and if so, is the desired action to repair it or leave the surface disabled?
