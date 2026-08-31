# SP+ Windows 11 theme manifest

ID: `theme-windows`
Scope: `theme/look-and-feel/org.secureprospective.spplus.windows11.dark` and
`...windows11.light`, plus the Windows Modern assets named by the audit brief.

## Evidence convention

File citations use `repo-relative-path:Lx-Ly`. `U` citations use the diagnostic
checkout `/tmp/kde-windows-modern-audit-3469531` at the commit shown below. Bare
upstream paths such as `README.md` are relative to that checkout. In a table,
`upstream dark/light defaults` expands to
`plasma/look-and-feel/org.kde.windowsmodern.dark/light/contents/defaults`, and
`local dark/light defaults` expands to
`theme/look-and-feel/org.secureprospective.spplus.windows11.dark/light/contents/defaults`;
`...dark` and `...light` are the same explicitly defined shorthand. The checkout
was fetched because the repository does not record a Windows Modern commit; it
is not treated as pinned provenance.

- **U1:** `git -C /tmp/kde-windows-modern-audit-3469531 rev-parse HEAD` returned
  `7ef6bfe99a472f2fc7fa473383eda50f411a8840`; `git -C ... remote -v` returned
  `origin https://github.com/Jeysef/KDE-Windows-Modern.git` for fetch and push.
- **U2:** `find /tmp/kde-windows-modern-audit-3469531 -type d -iname '*cursor*' -print`
  returned no output. `grep -Rni 'cursorTheme' .../plasma/look-and-feel`
  returned only `Windows-modern-dark-cursors` in the dark defaults and
  `breeze_cursors` in the light defaults.
- **U3:** `diff -qr` returned no output and exit 0 for each of these pairs:
  `theme/aurorae/windows-modern-{dark,light}-aurorae` against upstream
  `aurorae/windows-modern-{dark,light}-aurorae`; `theme/desktoptheme/Windows-modern-{dark,light}`
  against upstream `plasma/desktoptheme/Windows-modern-{dark,light}`;
  `theme/color-schemes` against upstream `color-schemes`; `theme/Kvantum` against
  upstream `Kvantum`; and `theme/icons` against upstream `icons`.
- **U4:** `cmp -s` returned `MATCH` for
  `theme/LICENSE-Windows-Modern-GPL3` versus upstream `LICENSE`, and for
  `theme/ATTRIBUTION-Windows-Modern.md` versus upstream `ATTRIBUTION.md`.
  `diff -qr` reported the two local look-and-feel packages differ from upstream
  in `contents/defaults`, `contents/layouts/org.kde.plasma.desktop-layout.js`,
  both metadata files, and, for dark, upstream-only `BUILD.md` and `patches`.
- **U5:** the local package inventory command
  `find theme/look-and-feel/org.secureprospective.spplus.windows11.{dark,light} -type f \( -path '*/contents/layouts/*' -o -path '*/contents/lockscreen/*' -o -path '*/contents/splash/*' -o -path '*/contents/loginmanager/*' -o -path '*/contents/osd/*' -o -path '*/contents/logout/*' -o -path '*/contents/previews/*' \) -printf '%p\n' | sort`
  returned the following exact output:

  ```text
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/layouts/defaults
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/layouts/org.kde.plasma.desktop-layout.js
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/lockscreen/faces/.face.icon
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/lockscreen/KeyboardButton.qml
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/lockscreen/Login.qml
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/lockscreen/Main.qml
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/lockscreen/qmldir
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/lockscreen/SessionButton.qml
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/lockscreen/WinAvatar.qml
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/lockscreen/WinClock.qml
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/lockscreen/WinFooterButton.qml
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/lockscreen/WinLoginButton.qml
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/lockscreen/WinPowerMenu.qml
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/lockscreen/WinStyle.qml
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/lockscreen/WinTextField.qml
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/lockscreen/WinUserSwitcher.qml
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/previews/fullscreenpreview.jpg
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/previews/preview.png
  theme/look-and-feel/org.secureprospective.spplus.windows11.light/contents/layouts/defaults
  theme/look-and-feel/org.secureprospective.spplus.windows11.light/contents/layouts/org.kde.plasma.desktop-layout.js
  theme/look-and-feel/org.secureprospective.spplus.windows11.light/contents/previews/fullscreenpreview.jpg
  theme/look-and-feel/org.secureprospective.spplus.windows11.light/contents/previews/preview.png
  theme/look-and-feel/org.secureprospective.spplus.windows11.light/contents/previews/splash.png
  ```
- **U6:** `find theme/icons/windows-modern -type f | wc -l` returned `4959`,
  of which `4958` have the `.svg` extension. The same counts were returned for
  the fetched upstream icon tree.
- **U7:** the exact local directory check returned `theme/aurorae PRESENT`,
  `theme/desktoptheme PRESENT`, `theme/color-schemes PRESENT`, `theme/Kvantum PRESENT`,
  `theme/icons PRESENT`, `theme/layout-templates ABSENT`, `theme/plasma/applets ABSENT`,
  `theme/plasma/shells ABSENT`, and `theme/wallpaper ABSENT`. The upstream check
  returned `plasma/applets PRESENT`, `plasma/layout-templates PRESENT`,
  `plasma/shells PRESENT`, `third_party/plasma-login-manager PRESENT`,
  `wallpaper PRESENT`, and `app-decorations/firefox PRESENT`. The local package
  directory check found dark `contents/layouts`, `contents/lockscreen`, and
  `contents/previews`, and light `contents/layouts` and `contents/previews`, with
  no `splash`, `loginmanager`, `osd`, or `logout` subdirectory.
- **U8:** the command
  `find theme/look-and-feel/org.secureprospective.spplus.windows11.dark theme/look-and-feel/org.secureprospective.spplus.windows11.light theme/desktoptheme/Windows-modern-dark theme/desktoptheme/Windows-modern-light -maxdepth 1 -type f -printf '%p\n' | sort`
  returned:

  ```text
  theme/desktoptheme/Windows-modern-dark/colors
  theme/desktoptheme/Windows-modern-dark/metadata.desktop
  theme/desktoptheme/Windows-modern-light/colors
  theme/desktoptheme/Windows-modern-light/metadata.desktop
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/metadata.desktop
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark/metadata.json
  theme/look-and-feel/org.secureprospective.spplus.windows11.light/metadata.desktop
  theme/look-and-feel/org.secureprospective.spplus.windows11.light/metadata.json
  ```

  `find theme/desktoptheme -name metadata.json -print` returned no output.
- **U9:** the corresponding upstream command returned:

  ```text
  /tmp/kde-windows-modern-audit-3469531/plasma/desktoptheme/Windows-modern-dark/colors
  /tmp/kde-windows-modern-audit-3469531/plasma/desktoptheme/Windows-modern-dark/metadata.desktop
  /tmp/kde-windows-modern-audit-3469531/plasma/desktoptheme/Windows-modern-light/colors
  /tmp/kde-windows-modern-audit-3469531/plasma/desktoptheme/Windows-modern-light/metadata.desktop
  /tmp/kde-windows-modern-audit-3469531/plasma/look-and-feel/org.kde.windowsmodern.dark/BUILD.md
  /tmp/kde-windows-modern-audit-3469531/plasma/look-and-feel/org.kde.windowsmodern.dark/metadata.desktop
  /tmp/kde-windows-modern-audit-3469531/plasma/look-and-feel/org.kde.windowsmodern.dark/metadata.json
  /tmp/kde-windows-modern-audit-3469531/plasma/look-and-feel/org.kde.windowsmodern.light/metadata.desktop
  /tmp/kde-windows-modern-audit-3469531/plasma/look-and-feel/org.kde.windowsmodern.light/metadata.json
  ```

  `find /tmp/kde-windows-modern-audit-3469531/plasma/desktoptheme -name metadata.json -print` returned no output.
- **U10:** `find theme/icons theme/aurorae theme/desktoptheme theme/Kvantum
  theme/look-and-feel/org.secureprospective.spplus.windows11.dark
  theme/look-and-feel/org.secureprospective.spplus.windows11.light -type d
  -iname '*cursor*' -print` and
  `find theme -iname '*Windows-modern-dark-cursors*' -print` both returned no
  output. This result is scoped to Windows Modern paths and names.
- **U11:** `find theme/Kvantum theme/aurorae theme/desktoptheme
  theme/color-schemes -maxdepth 2 -type f -printf '%p\n' | sort` returned the
  two Windows Modern Kvantum configs and SVGs, both Aurorae variant trees, both
  desktop-theme `colors`/`metadata.desktop` pairs, and both color-scheme files;
  the exact component byte-match is U3.

## 1. Provenance

| Item | Established value | Evidence |
|---|---|---|
| Upstream URL | `https://github.com/Jeysef/KDE-Windows-Modern` | Both local look-and-feel metadata files record the URL at `theme/look-and-feel/org.secureprospective.spplus.windows11.dark/metadata.json:L20-L21` and `...light/metadata.json:L20-L21`. |
| Commit/tag actually vendored | **UNKNOWN —** `theme/vendor/PROVENANCE.md` has rows for Catppuccin, Orchis, and Nordic only, at `theme/vendor/PROVENANCE.md:L5-L7`; it has no Windows Modern row or ref. The `Version=1.0.0` metadata value is not an upstream commit. | `theme/vendor/PROVENANCE.md:L1-L7`; local metadata at `theme/look-and-feel/org.secureprospective.spplus.windows11.dark/metadata.json:L16-L20`. |
| Diagnostic upstream ref | `7ef6bfe99a472f2fc7fa473383eda50f411a8840`, fetched from the URL above. | Exact command and output: U1. This is current fetched-head evidence, not recorded vendored provenance. |
| Project license | GPL v3 text is present as `theme/LICENSE-Windows-Modern-GPL3`; the attribution identifies Windows Modern as GPL-3.0. | `theme/LICENSE-Windows-Modern-GPL3:L1-L10`; `theme/ATTRIBUTION-Windows-Modern.md:L3-L9`. |
| Attribution | Present and byte-identical to upstream `ATTRIBUTION.md`. It identifies the derivative sources and their stated licenses. | U4; `theme/ATTRIBUTION-Windows-Modern.md:L11-L20`. |
| Vendored tree match | **UNKNOWN at an actual vendored ref** because no ref is recorded. At diagnostic ref U1, the Aurorae, desktop-theme, color-scheme, Kvantum, and icon component trees match exactly. The local look-and-feel packages do not: SP+ changes IDs/defaults/layout scripts and omits upstream dark `BUILD.md` and `patches`. | U3 and U4. |

The local attribution also states that the Windows Modern wallpaper uses Pexels
photographs, but that upstream wallpaper is not copied into the image; see
section 2. `theme/ATTRIBUTION-Windows-Modern.md:L22-L36`.

## 2. Shipped assets

This section records source-to-image `Containerfile` COPY/install intent. No image
build or installed-image readback was performed for this audit.

| Local source | Image destination | Status/evidence |
|---|---|---|
| `theme/look-and-feel/` (dark and light packages, including dark `contents/lockscreen`) | `/usr/share/plasma/look-and-feel/` | Copied by `images/kde/Containerfile:L864`. |
| `theme/desktoptheme/Windows-modern-dark` and `...light` | `/usr/share/plasma/desktoptheme/` | Copied by `images/kde/Containerfile:L865`; the two local desktop themes contain `metadata.desktop` identifying Plasma 6 at `theme/desktoptheme/Windows-modern-dark/metadata.desktop:L1-L13` and `theme/desktoptheme/Windows-modern-light/metadata.desktop:L1-L13`. |
| `theme/color-schemes/WindowsModernDark.colors` and `WindowsModernLight.colors` | `/usr/share/color-schemes/` | Copied by `images/kde/Containerfile:L866`; the color files declare their matching `ColorScheme` at `theme/color-schemes/WindowsModernDark.colors:L105-L108` and `theme/color-schemes/WindowsModernLight.colors:L105-L108`. |
| `theme/aurorae/windows-modern-dark-aurorae` and `...light-aurorae` | `/usr/share/aurorae/themes/` | Copied by `images/kde/Containerfile:L867`; the dark Aurorae metadata identifies its ID and GPL license at `theme/aurorae/windows-modern-dark-aurorae/metadata.json:L9-L17`. |
| `theme/icons/windows-modern` | `/usr/share/icons/` | Copied by `images/kde/Containerfile:L868`; its theme name and fallback chain are at `theme/icons/windows-modern/index.theme:L1-L6`. U6 records the file count. |
| `theme/Kvantum/Windows-modern` | `/usr/share/Kvantum/` | Copied by `images/kde/Containerfile:L869`; the source has both `Windows-modern.kvconfig` and `Windows-modernDark.kvconfig`, plus both SVG skins (U11); the complete tree matches upstream (U3). |
| `theme/LICENSE-Windows-Modern-GPL3` and `theme/ATTRIBUTION-Windows-Modern.md` | `/usr/share/sp-plus/theme/` | Copied by `images/kde/Containerfile:L870`. |
| `theme/tools/validate-global-themes.py` | `/usr/libexec/spplus-validate-global-themes` | Copied as theme validation tooling by `images/kde/Containerfile:L1023-L1024`; the tool's required-key and dangling-reference checks are described at `theme/tools/validate-global-themes.py:L1-L13`. |
| `theme/sp-plus-calm/wallpapers/SPPlus-Calm/` | `/usr/share/wallpapers/SPPlus-Calm/` | This is SP+'s replacement wallpaper named by both Windows packages, copied by `images/kde/Containerfile:L1004-L1005`; the image gate checks its images directory and `3840x2160.jpg` at `images/kde/Containerfile:L1092-L1093`. |

### Upstream asset directories not copied

The upstream README lists the following runtime components at
`/tmp/kde-windows-modern-audit-3469531/README.md:L31-L46`. They are not among
the Windows Modern `COPY` destinations at `images/kde/Containerfile:L864-L870`.

| Upstream path/component | Image status | Evidence |
|---|---|---|
| `plasma/applets/` (custom Start Menu, Digital Clock, Show Desktop, System Tray, and Icon Tasks) | **Not copied.** | Upstream component list: `README.md:L40-L43`; the image explicitly excludes the upstream C++ System Tray and Icon Tasks and its Windows Modern COPY list contains no applet tree, at `images/kde/Containerfile:L860-L870`; local absence is U7. |
| `plasma/layout-templates/org.kde.windowsmodern.panel` | **Not shipped.** There is no `theme/layout-templates` tree in the local audit inventory and no layout-template `COPY`. | Local/upstream directory results: U7; upstream component: `README.md:L40`; image copies only the look-and-feel layout scripts at `Containerfile:L864`. |
| `plasma/shells/org.kde.windowsmodern.lockscreen` | **Not shipped.** | Upstream identifies it as the Meta+L session-lock overlay at `README.md:L42`; SP+ explicitly excludes the lock-screen shell overlay at `images/kde/Containerfile:L860-L862`. |
| `third_party/plasma-login-manager/` and dark `contents/lockscreen/patches/` | **Not shipped.** The dark boot-greeter QML source is copied inside the look-and-feel package, but the patched PLM required to consume it is not. | Upstream build instructions require the patched PLM and patch at upstream `plasma/look-and-feel/org.kde.windowsmodern.dark/BUILD.md:L3-L10`; SP+ excludes the patched login manager at `images/kde/Containerfile:L860-L862`. U4 reports upstream-only dark `BUILD.md` and `patches`. |
| `wallpaper/Windows-modern/` | **Not shipped.** | Upstream lists the Windows Modern wallpaper at `README.md:L44-L46`; SP+ states that no Microsoft artwork ships and that the wallpaper is SP+'s own at `images/kde/Containerfile:L862-L863`, then copies `SPPlus-Calm` at `L1004-L1005`. |
| `app-decorations/firefox/` | **Not shipped.** | Upstream lists Firefox CSD decoration files at `README.md:L45-L46`; no corresponding Windows Modern `COPY` exists in `images/kde/Containerfile:L864-L870`. |
| Upstream documentation, installer scripts, build files, and the upstream git submodule metadata | **Not image runtime assets.** They are not copied. | The upstream checkout inventory and the image `COPY` list; U1/U3. |

The copied dark `contents/lockscreen` should not be counted as the session lock
overlay: upstream separately defines the session lock shell at
`plasma/shells/...` and the boot-greeter source at the dark look-and-feel path,
as documented at upstream `README.md:L40-L43`.

## 3. Creator-intended configuration

### SP+ package declarations

The following is a literal transcription of each package's `contents/defaults`.
A bare `[Wallpaper]` header is shown as `kdeglobals:Wallpaper` because the
SP+ parser defines bare groups as belonging to `kdeglobals` at
`config/spplus-apply-theme:L26-L40`.

| Variant | File:group:key=value | Evidence |
|---|---|---|
| Dark | `kdeglobals:General:ColorScheme=WindowsModernDark` | `theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/defaults:L6` |
| Dark | `kdeglobals:General:font=Noto Sans,10,-1,5,50,0,0,0,0,0` | same file `:L7` |
| Dark | `kdeglobals:General:menuFont=Noto Sans,10,-1,5,50,0,0,0,0,0` | same file `:L8` |
| Dark | `kdeglobals:General:toolBarFont=Noto Sans,10,-1,5,50,0,0,0,0,0` | same file `:L9` |
| Dark | `kdeglobals:General:activeFont=Noto Sans,10,-1,5,50,0,0,0,0,0` | same file `:L10` |
| Dark | `kdeglobals:General:smallestReadableFont=Noto Sans,9,-1,5,50,0,0,0,0,0` | same file `:L11` |
| Dark | `kdeglobals:Icons:Theme=Papirus-Dark` | same file `:L13-L14` |
| Dark | `kdeglobals:KDE:widgetStyle=kvantum-dark` | same file `:L16-L17` |
| Dark | `kcminputrc:Mouse:cursorTheme=breeze_cursors` | same file `:L19-L20` |
| Dark | `plasmarc:Theme:name=Windows-modern-dark` | same file `:L22-L23` |
| Dark | `kdeglobals:Wallpaper:Image=SPPlus-Calm` | raw bare header and key at same file `:L25-L26` |
| Dark | `kwinrc:org.kde.kdecoration2:library=org.kde.kwin.aurorae.v2` | same file `:L28-L30` |
| Dark | `kwinrc:org.kde.kdecoration2:theme=__aurorae__svg__windows-modern-dark-aurorae` | same file `:L28-L30` |
| Dark | `kwinrc:org.kde.kdecoration2:ButtonsOnLeft=` | same file `:L28-L32` |
| Dark | `kwinrc:org.kde.kdecoration2:ButtonsOnRight=IAX` | same file `:L28-L32` |
| Dark | `Kvantum/kvantum.kvconfig:General:theme=Windows-modern` | same file `:L34-L35` |
| Dark | `ksplashrc:KSplash:Theme=none` | same file `:L37-L38` |
| Light | `kdeglobals:General:ColorScheme=WindowsModernLight` | `theme/look-and-feel/org.secureprospective.spplus.windows11.light/contents/defaults:L6` |
| Light | `kdeglobals:General:font=Noto Sans,10,-1,5,50,0,0,0,0,0` | same file `:L7` |
| Light | `kdeglobals:General:menuFont=Noto Sans,10,-1,5,50,0,0,0,0,0` | same file `:L8` |
| Light | `kdeglobals:General:toolBarFont=Noto Sans,10,-1,5,50,0,0,0,0,0` | same file `:L9` |
| Light | `kdeglobals:General:activeFont=Noto Sans,10,-1,5,50,0,0,0,0,0` | same file `:L10` |
| Light | `kdeglobals:General:smallestReadableFont=Noto Sans,9,-1,5,50,0,0,0,0,0` | same file `:L11` |
| Light | `kdeglobals:Icons:Theme=Papirus` | same file `:L13-L14` |
| Light | `kdeglobals:KDE:widgetStyle=kvantum` | same file `:L16-L17` |
| Light | `kcminputrc:Mouse:cursorTheme=breeze_cursors` | same file `:L19-L20` |
| Light | `plasmarc:Theme:name=Windows-modern-light` | same file `:L22-L23` |
| Light | `kdeglobals:Wallpaper:Image=SPPlus-Calm` | raw bare header and key at same file `:L25-L26` |
| Light | `kwinrc:org.kde.kdecoration2:library=org.kde.kwin.aurorae.v2` | same file `:L28-L30` |
| Light | `kwinrc:org.kde.kdecoration2:theme=__aurorae__svg__windows-modern-light-aurorae` | same file `:L28-L30` |
| Light | `kwinrc:org.kde.kdecoration2:ButtonsOnLeft=` | same file `:L28-L32` |
| Light | `kwinrc:org.kde.kdecoration2:ButtonsOnRight=IAX` | same file `:L28-L32` |
| Light | `Kvantum/kvantum.kvconfig:General:theme=Windows-modern` | same file `:L34-L35` |
| Light | `ksplashrc:KSplash:Theme=none` | same file `:L37-L38` |

**Papirus source of truth:** the `windows-modern` icon directory is still shipped,
but its own theme name is `windows-modern` and its fallback chain is recorded at
`theme/icons/windows-modern/index.theme:L1-L6`; that directory does not select
Papirus. The Papirus selection comes directly from the local package defaults,
`Icons:Theme=Papirus-Dark` or `Papirus` above. The helper parses the selected
package's `contents/defaults` and writes each declared non-wallpaper key at
`config/spplus-apply-theme:L43-L63` and `L127-L145`. Independently, the fresh-image
system seed writes `Theme=Papirus-Dark` at `images/kde/Containerfile:L1057-L1069`.

Both packages also declare these layout defaults:

| Variant | File:group:key=value | Evidence |
|---|---|---|
| Dark | `kwinrc:org.kde.kdecoration2:ButtonsOnLeft=ML` | `theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/layouts/defaults:L1-L3` |
| Dark | `kwinrc:org.kde.kdecoration2:ButtonsOnRight=IAX` | same file `:L1-L3` |
| Light | `kwinrc:org.kde.kdecoration2:ButtonsOnLeft=ML` | `theme/look-and-feel/org.secureprospective.spplus.windows11.light/contents/layouts/defaults:L1-L3` |
| Light | `kwinrc:org.kde.kdecoration2:ButtonsOnRight=IAX` | same file `:L1-L3` |

The two button declarations are internally different: `contents/defaults` says
`ButtonsOnLeft=` while `contents/layouts/defaults` says `ButtonsOnLeft=ML`.
Both files say `ButtonsOnRight=IAX`.

### Package subdirectories

- Dark has `contents/layouts/` and `contents/lockscreen/`; the exact files are
  recorded by U5. It has no `contents/splash/`, `contents/loginmanager/`,
  `contents/osd/`, or `contents/logout/` directories. The lockscreen files are
  QML/asset files, not additional INI key declarations; `qmldir` declares the
  `WinStyle` singleton at
  `theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/lockscreen/qmldir:L1`.
- Light has `contents/layouts/` and `contents/previews/`, but no
  `contents/lockscreen/`, `contents/splash/`, `contents/loginmanager/`,
  `contents/osd/`, or `contents/logout/` directories. Its `splash.png` is under
  `contents/previews/`, not a `contents/splash/` implementation. These presence
  and absence results are U5.
- The dark QML's `WinStyle` explicitly asks for the `Segoe UI` font at
  `theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/lockscreen/WinStyle.qml:L23`.
  That is a QML property, not an INI default.

### Upstream declarations and intended components

These are the declarations in the fetched, unpinned upstream checkout. They are
included to make the SP+ changes explicit.

| Aspect | Dark upstream | Light upstream | Evidence |
|---|---|---|---|
| Cursor | `kcminputrc:Mouse:cursorTheme=Windows-modern-dark-cursors` | `kcminputrc:Mouse:cursorTheme=breeze_cursors` | Upstream dark defaults `:L1-L2`; light defaults `:L20-L21`; U2 found no cursor directory. |
| Color scheme | `kdeglobals:General:ColorScheme=WindowsModernDark` | `kdeglobals:General:ColorScheme=WindowsModernLight` | Upstream dark defaults `:L4-L5`; light defaults `:L4-L5`. |
| Icon theme | `kdeglobals:Icons:Theme=windows-modern` | `kdeglobals:Icons:Theme=windows-modern` | Upstream dark defaults `:L7-L8`; light defaults `:L7-L8`. |
| Widget style | `kdeglobals:KDE:widgetStyle=kvantum-dark` | `kdeglobals:KDE:widgetStyle=kvantum` | Upstream dark defaults `:L10-L11`; light defaults `:L1-L2`. |
| Tabbox | `kwinrc:DesktopSwitcher:LayoutName=org.kde.breeze.desktop`; `kwinrc:WindowSwitcher:LayoutName=org.kde.breeze.desktop` | No corresponding keys in the light defaults | Upstream dark defaults `:L13-L17`; light defaults `:L1-L24`. |
| Decoration | `kwinrc:org.kde.kdecoration2:library=org.kde.kwin.aurorae`; theme `__aurorae__svg__windows-modern-dark-aurorae` | Same old library with the light Aurorae ID | Upstream dark defaults `:L19-L21`; light defaults `:L16-L18`. |
| Plasma desktop theme | `plasmarc:Theme:name=Windows-modern-dark` | `plasmarc:Theme:name=Windows-modern-light` | Upstream dark defaults `:L23-L24`; light defaults `:L10-L11`. |
| Wallpaper | `Wallpaper:Image=Windows-modern` | `Wallpaper:Image=Windows-modern` | Upstream dark defaults `:L26-L27`; light defaults `:L13-L14`. |
| Splash | `ksplashrc:KSplash:Theme=none` | `ksplashrc:KSplash:Theme=none` | Upstream dark defaults `:L29-L30`; light defaults `:L23-L24`. |
| Fonts | No `font`, `menuFont`, `toolBarFont`, `activeFont`, or `smallestReadableFont` key appears in either upstream defaults file | Same | Complete upstream default files: dark `:L1-L30`; light `:L1-L24`. |
| Layout button defaults | `ButtonsOnLeft=ML`, `ButtonsOnRight=IAX` | `ButtonsOnLeft=ML`, `ButtonsOnRight=IAX` | Upstream dark and light `contents/layouts/defaults:L1-L3`. |

Upstream describes `Windows-modern` as the Kvantum skin with light and dark
variants selected through `kvantum`/`kvantum-dark`, and separately identifies its
Aurorae, desktop-theme, global-theme, panel-template, custom-applet, session-lock,
boot-greeter, icon, wallpaper, and app-decoration components at
`README.md:L31-L46`. The session lock and boot greeter are distinct: the session
lock is the standalone shell overlay at upstream `README.md:L40-L43` and its
README says it replaces Breeze for Meta+L at upstream
`plasma/shells/org.kde.windowsmodern.lockscreen/contents/lockscreen/README.md:L1-L18`;
the boot greeter consumes the dark look-and-feel `contents/lockscreen` only
through a patched PLM at upstream `plasma/look-and-feel/org.kde.windowsmodern.dark/BUILD.md:L3-L10`.

## 4. Dependencies

| Dependency/use | Image evidence | Packaging/source status | Evidence |
|---|---|---|---|
| KDE Plasma 6 | The local metadata labels both global packages as Plasma 6 and the upstream project says it will not work on Plasma 5. | Base image dependency; exact Fedora package set is **UNKNOWN —** run `rpm -q plasma-desktop plasma-workspace` on the live image. | Local metadata `...dark/metadata.json:L10-L17`; upstream `README.md:L1-L7`. |
| `kvantum` engine | Containerfile declares its installation; built-image presence is **UNKNOWN —** no build/readback was run. | Fedora package named directly in `dnf install`; the `Windows-modern` skin is vendored in this repo. | `images/kde/Containerfile:L1026-L1028` and `L1037-L1041`; local skin is copied at `L869`. |
| `Windows-modern` Kvantum skin | Containerfile declares a copy to `/usr/share/Kvantum/Windows-modern`; built-image presence is **UNKNOWN —**. | Vendored upstream-derived files, not a Fedora package in this repo. | `theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/defaults:L34-L35`; `images/kde/Containerfile:L869`; upstream intent `README.md:L35-L36`. |
| `Papirus` and `Papirus-Dark` | Containerfile declares both package installs and tests `/usr/share/icons/Papirus-Dark`; built-image presence is **UNKNOWN —**. | Fedora packages `papirus-icon-theme` and `papirus-icon-theme-dark`. | `images/kde/Containerfile:L1037-L1045`; local light/dark defaults `...light/contents/defaults:L13-L14` and `...dark/contents/defaults:L13-L14`. |
| `windows-modern` icon theme | Containerfile declares a copy to `/usr/share/icons/windows-modern`; built-image presence is **UNKNOWN —**. | Vendored curated derivative. | `images/kde/Containerfile:L868`; `theme/icons/windows-modern/index.theme:L1-L6`; attribution `theme/ATTRIBUTION-Windows-Modern.md:L38-L51`. |
| `breeze`, `breeze-dark`, `hicolor` icon fallbacks | `windows-modern` declares them, but their image presence is **UNKNOWN —** the audited Containerfile lines do not establish those directories. | Package provenance is **UNKNOWN —** run `test -d /usr/share/icons/breeze`, `test -d /usr/share/icons/breeze-dark`, and `test -d /usr/share/icons/hicolor` on the live image. | `theme/icons/windows-modern/index.theme:L1-L6`. |
| `breeze_cursors` | The Containerfile copies `config/kcminputrc` and its system-default gate tests `/usr/share/icons/breeze_cursors`; built-image presence is **UNKNOWN —**. | Presence is asserted by source; the owning Fedora package is **UNKNOWN —** run `rpm -qf /usr/share/icons/breeze_cursors` on the image. | `images/kde/Containerfile:L1113-L1114` and `L1132-L1134`; `config/kcminputrc:L1-L17`. |
| Upstream `Windows-modern-dark-cursors` | No directory was found in the fetched upstream checkout; no Windows Modern cursor directory or matching name was found in the local Windows Modern paths. | **Missing from the audited source/image path.** U2 and U10 are the exact directory/name searches; the upstream dark default is recorded above. |
| Noto Sans | Containerfile declares an `fc-list` discoverability check; built-image presence is **UNKNOWN —**. Both local packages name it for all five font keys. | Installed/available according to the declared image check; exact owning package is **UNKNOWN —** run `rpm -qf` against the font file. | `images/kde/Containerfile:L1044-L1048`; local defaults `...dark/contents/defaults:L7-L11` and `...light/contents/defaults:L7-L11`. |
| Segoe UI | **UNKNOWN —** the dark boot-greeter QML asks for it, but no audited Containerfile line installs or checks it. | Font availability must be established by `fc-match 'Segoe UI'` and `fc-list : family`. | `theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/lockscreen/WinStyle.qml:L23`; upstream session-lock documentation also names Segoe UI at `...lockscreen/README.md:L49-L58`. |
| Native panel applets | The local layout names `org.kde.plasma.kickoff`, `icontasks`, `panelspacer`, `systemtray`, `digitalclock`, and `showdesktop`; exact image package ownership is **UNKNOWN —**. | Stock Plasma applets; no custom Windows Modern applet package is copied. | Dark layout `theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/layouts/org.kde.plasma.desktop-layout.js:L15-L17` and `L41-L54`; SP+ exclusion `images/kde/Containerfile:L860-L863`. |
| Dark boot-greeter QML modules | **UNKNOWN —** no build or live import test was run. | The source imports QtQuick, QtQuick Controls, Kirigami, Breeze components, Plasma login, and the keyboard indicator; the patched PLM is absent. | `...dark/contents/lockscreen/Main.qml:L9-L17`; `Login.qml:L9-L17`; upstream PLM requirement `BUILD.md:L3-L10`. |
| `SPPlus-Calm` wallpaper package | Containerfile declares a copy and image checks; built-image presence is **UNKNOWN —**. | SP+ local asset, retained independently of the Windows Modern upstream wallpaper. | `images/kde/Containerfile:L1004-L1005` and `L1092-L1093`; local defaults `...dark/contents/defaults:L25-L26` and `...light/contents/defaults:L25-L26`. |
| `org.kde.kwin.aurorae.v2` | The source configuration names it; live plugin availability is **UNKNOWN —** this source audit did not inspect the installed KWin plugin registry. | Plasma/KWin base component; Aurorae theme files are vendored and copied. | Local defaults `...dark/contents/defaults:L28-L30`; Aurorae copy `images/kde/Containerfile:L867`. |

## 5. Plasma 6 compatibility

| Check | Evidence | Finding |
|---|---|---|
| Declared Plasma generation | Upstream says the project is for Plasma 6 and not Plasma 5 at `README.md:L1-L7`. Both local global packages declare `Category=Global Themes (Plasma 6)`, `KPackageStructure=Plasma/LookAndFeel`, `X-Plasma-APIVersion=2`, and a JSON package ID at `...dark/metadata.json:L1-L27` and `...light/metadata.json:L1-L27`. | Positive source-level Plasma 6 markers. |
| Metadata format | Both local global packages carry `metadata.json` and `metadata.desktop`; both local desktop themes carry `metadata.desktop` and the desktop-theme tree has no `metadata.json`. | Exact local inventory: U8. The corresponding upstream inventory has the same global/desktop format split: U9. The desktop themes match upstream byte-for-byte (U3). A live package discovery check remains unrun. |
| Aurorae plugin | Upstream defaults use `org.kde.kwin.aurorae` at upstream dark `contents/defaults:L19-L21` and light `:L16-L18`; local defaults use `org.kde.kwin.aurorae.v2` at `...dark/contents/defaults:L28-L30`. | The `.v2` name is an explicit Plasma 6 compatibility normalization in the local package. Whether KWin loads the decoration on the target image is **UNKNOWN —** perform the live reconfigure/readback in section 8. |
| QML import vintage | Dark boot-greeter files use `QtQuick 2.15`, `QtQuick.Layouts 1.15`, `QtQuick.Controls 2.15`, Kirigami 2.20, Plasma components 3.0, and `Qt5Compat.GraphicalEffects`; examples are `.../lockscreen/Main.qml:L9-L17`, `WinAvatar.qml:L7-L8`, and `SessionButton.qml:L8-L13`. | These are the versioned imports present in the QML source. Actual QML loading is **UNKNOWN —** because no build or live greeter/lock-screen import test was run. |
| `plasma-apply-*` assumptions | SP+ calls `/usr/sbin/plasma-apply-lookandfeel -a ... --resetLayout` in `config/spplus-first-login:L84-L86` and `plasma-apply-wallpaperimage` at `L121-L125`; the helper calls `plasma-apply-lookandfeel -a` at `config/spplus-apply-theme:L112-L120`. | These are the command paths present in the source. Command success and resulting behavior were not established here. |
| Aurorae API surface | The audited `.auroraerc` files are declarative INI values, including `Animation=0` and `Shadow=false`, not C++ or QML API calls. | No removed Aurorae API can be established from these files. **UNKNOWN —** a live KWin decoration load/reconfigure test would settle it. Evidence: `theme/aurorae/windows-modern-dark-aurorae/windows-modern-dark-auroraerc:L1-L46`. |
| Boot/session lock architecture | Upstream requires a patched PLM for boot greeter QML at `BUILD.md:L3-L10` and a complete desktop-shell overlay for Meta+L at session-lock README `:L9-L23`. SP+ excludes both patched login manager and lock-screen shell overlay at `images/kde/Containerfile:L860-L863`. | The copied dark `contents/lockscreen` is not evidence that either runtime lock surface is installed. |

This section is source evidence only. No build, package installation, or live
Plasma test was run for this audit.

## 6. Layout

### SP+ look-and-feel layout scripts

Both packages ship `contents/layouts/org.kde.plasma.desktop-layout.js`, and the
look-and-feel directory is copied by `images/kde/Containerfile:L864`. The two
scripts differ in the dark-only favorites writes; geometry and the six native
applet IDs are otherwise the same.

| Property | Dark | Light | Evidence |
|---|---|---|---|
| Existing panels | Removes every existing panel before creating new ones. | Same. | Dark `...dark/contents/layouts/org.kde.plasma.desktop-layout.js:L3-L5`; light corresponding file `:L3-L5`. |
| Panel count/screen | Creates one `Panel` for every `screen` from `0` through `screenCount - 1`; assigns `panel.screen=screen`. | Same. | Dark `:L5-L8`; light `:L5-L8`. |
| Edge/size/alignment | `location=bottom`, `height=48`, `alignment=center`, `hiding=none`, `lengthMode=fill`, `opacity=opaque`. | Same. | Dark `:L8-L13`; light `:L8-L13`. |
| Applet order | `org.kde.plasma.kickoff`, `org.kde.plasma.icontasks`, `org.kde.plasma.panelspacer`, `org.kde.plasma.systemtray`, `org.kde.plasma.digitalclock`, `org.kde.plasma.showdesktop`, indices 0 through 5. | Same six IDs and indices. | Dark IDs/config `:L15-L17`, `L41-L54`, indices `L56-L57`; light `:L15-L35`. |
| Start button | Writes `icon=start-here`, then seeds seven application favorites and `favoritesPortedToKAstats=false`. | Writes `icon=start-here`; no favorites seed. | Dark `:L15-L39`; light `:L15-L17`. |
| Task manager | Writes `showOnlyCurrentScreen=false`, `showOnlyCurrentDesktop=false`, `groupingStrategy=1`. | Same. | Dark `:L41-L45`; light `:L19-L23`. |
| Clock | Under `Appearance`, writes `showDate=true`, `dateDisplayFormat=2`, `showSeconds=0`. | Same. | Dark `:L49-L53`; light `:L27-L31`. |
| Floating | The script does not assign `panel.floating`. | Same. | The complete dark script `:L1-L58` and light script `:L1-L36` contain no `panel.floating` assignment. A resulting live value is **UNKNOWN —** use section 8 readback. |

Hard-coded values required by the brief:

| Category | Finding | Evidence |
|---|---|---|
| Absolute paths | None appear in either layout script. | Full script inventories: dark `:L1-L58`, light `:L1-L36`; U5 lists all package files. |
| Usernames | None. | Same full script inventories. |
| Locked widgets | No `locked` assignment. | Same full script inventories. |
| Machine/application-specific values | Dark hard-codes the desktop IDs `brave-browser.desktop`, `net.thunderbird.Thunderbird.desktop`, `fin.desktop`, `org.kde.dolphin.desktop`, `libreoffice-writer.desktop`, `org.kde.okular.desktop`, and `org.keepassxc.KeePassXC.desktop` in its favorites seed. | Dark `:L30-L39`. |
| Other fixed layout values | Bottom edge, 48px, centered alignment, opaque fill, native applet IDs, and clock/task settings are fixed in the scripts. | Dark `:L8-L13`, `L15-L17`, `L41-L54`; light `:L8-L13`, `L15-L35`. |

### Upstream panel layout

The standalone upstream template is
`plasma/layout-templates/org.kde.windowsmodern.panel/contents/layout.js`.
It creates one bottom, centered, 48px, fill-length, non-hiding panel, sets
`panel.floating=false` and `panel.opacity="opaque"`, and creates seven ordered
slots: left spacer, custom/fallback Start, stock icon tasks, right spacer,
custom/fallback system tray, custom/fallback digital clock, and custom/fallback
Show Desktop. The exact geometry is at upstream `layout.js:L8-L32`;
the ordered widget construction and fallbacks are at `:L34-L91`; indices are at
`:L93-L100`.

The standalone template has no absolute path, username, locked widget, or
machine-specific value. Its fixed values are the 48px height, bottom/center/fill
geometry, `floating=false`, the applet IDs, clock settings, and Show Desktop
size 6, all visible at upstream `layout.js:L8-L100`.

**Shipping result:** SP+ does not ship the standalone upstream panel template.
It does ship modified per-look-and-feel layout scripts. Those scripts use only
native Plasma applets rather than the upstream custom applets, omit the upstream
left spacer, and omit the explicit `panel.floating=false` assignment. The
upstream custom applets and template are explicitly excluded by the image source
at `images/kde/Containerfile:L860-L863`.

## 7. SP+ divergences

For this section, "section 3" means the literal SP+ package declarations. The
first table records the upstream-to-SP+ normalization that explains why the
local declarations differ from the creator's fetched upstream defaults. The
second table records runtime/image behavior that can still differ from the local
package declarations. A matching value is not listed as a divergence.

### Upstream-to-SP+ normalization

| Divergence | Classification | Evidence and scope |
|---|---|---|
| Package IDs and display names are changed from upstream `org.kde.windowsmodern.dark/light` to `org.secureprospective.spplus.windows11.dark/light`. | `SP+-POLICY` | Local IDs/names: dark `metadata.json:L16-L20`, light `:L16-L20`; upstream IDs: dark `metadata.json:L16-L20`, light `:L16-L20`. The local directory and JSON ID agree. |
| Noto Sans font keys are added to both packages, while upstream defaults contain no font keys. | `SP+-POLICY` | Local keys `...dark/contents/defaults:L7-L11` and light `:L7-L11`; helper policy says SP+ owns one type system and injects its font block when a package is silent at `config/spplus-apply-theme:L30-L40` and `L122-L126`. |
| Icon selection changes from upstream `windows-modern` to `Papirus-Dark`/`Papirus`, even though `windows-modern` is copied. | `UNEXPLAINED` | Upstream dark/light defaults `...dark/contents/defaults:L7-L8` and `...light/contents/defaults:L7-L8`; local selections `...dark/contents/defaults:L13-L14` and `...light/contents/defaults:L13-L14`; both icon trees and Papirus packages are present at `images/kde/Containerfile:L868` and `L1037-L1045`. No Windows-specific reason for this selection appears in the audited source. |
| Dark cursor selection changes from upstream `Windows-modern-dark-cursors` to `breeze_cursors`; light already uses `breeze_cursors` upstream. | `REQUIRED-COMPAT` | The upstream dark name is at upstream `...dark/contents/defaults:L1-L2`, but U2 found no cursor directory. The local package and image system default use `breeze_cursors` at local defaults `...dark/contents/defaults:L19-L20`, `config/kcminputrc:L17`, and the image existence gate `images/kde/Containerfile:L1132-L1134`. The source validator rejects a missing cursor reference at `theme/tools/validate-global-themes.py:L85-L87`. |
| Decoration library changes from upstream `org.kde.kwin.aurorae` to `org.kde.kwin.aurorae.v2`. | `REQUIRED-COMPAT` | Upstream library values: dark defaults `:L19-L21`, light `:L16-L18`; local `.v2` value: dark `...dark/contents/defaults:L28-L30`, light `...light/contents/defaults:L28-L30`. The shipped validator explicitly treats the unsuffixed plugin as Plasma 5 and requires `.v2` at `theme/tools/validate-global-themes.py:L7-L9` and `L98-L103`. |
| Wallpaper changes from upstream `Windows-modern` to SP+'s `SPPlus-Calm`. | `SP+-POLICY` | Upstream defaults `...dark/contents/defaults:L26-L27` and light `:L13-L14`; local defaults `...dark/contents/defaults:L25-L26` and light `:L25-L26`; image comments and copy identify the SP+ wallpaper at `images/kde/Containerfile:L862-L863` and `L1004-L1005`. |
| Upstream dark `[DesktopSwitcher]` and `[WindowSwitcher]` keys are absent from both local `contents/defaults` files. | `UNEXPLAINED` | Upstream dark declarations are at `...dark/contents/defaults:L13-L17`; the complete local defaults files contain no such groups (`...dark/contents/defaults:L1-L38`, `...light/contents/defaults:L1-L38`). No Windows-specific reason for their removal appears in the audited source. |
| The local main defaults add fixed `ButtonsOnLeft=` and `ButtonsOnRight=IAX`, while upstream main defaults do not contain button keys; the separate upstream and local layout-defaults files say `ML`/`IAX`. | `UNEXPLAINED` | Local main defaults `...dark/contents/defaults:L28-L32` and light `:L28-L32`; local layout defaults `...dark/contents/layouts/defaults:L1-L3`; upstream main dark defaults `:L19-L21` and upstream layout defaults `:L1-L3`. The two local declarations conflict on `ButtonsOnLeft`; no rationale in the audited Windows files establishes which value is authoritative. |

There is no upstream-to-SP+ divergence in the declared Kvantum style names,
light/dark desktop-theme names, or `ksplashrc Theme=none`: the corresponding
values are equal in the upstream and local tables above. Evidence: upstream
Kvantum/desktop/splash values in section 3 and local values at
`...dark/contents/defaults:L16-L38` and `...light/contents/defaults:L16-L38`.

### Runtime/image behavior versus the local package declarations

| Divergence | Classification | Evidence |
|---|---|---|
| Welcome applies a selected ID through `spplus-apply-theme`; the helper parses only `contents/defaults` and has no layout path. Therefore the package's `contents/layouts/*.js` is not processed by that Welcome apply path. | `UNEXPLAINED` | Helper finds `contents/defaults` at `config/spplus-apply-theme:L43-L63`, invokes Plasma without `--resetLayout` at `L112-L120`, and iterates only parsed defaults at `L127-L145`. Welcome calls only the helper at `welcome/welcome.py:L885-L897`. The same gap is recorded as confirmed in `docs/ledger/DECISION-2026-08-30-theme-fidelity.md:L9-L17`. |
| First login uses a different path: it invokes `plasma-apply-lookandfeel ... --resetLayout` before the helper, so it can run the package layout; it is not the same behavior as a later Welcome theme switch. | `UNEXPLAINED` | `config/spplus-first-login:L84-L86`; the Containerfile explains that layout files are read only when the global theme is explicitly applied at `images/kde/Containerfile:L1099-L1104`. |
| All subprocess calls in `spplus-apply-theme` use `check=False`; a failed Plasma/KConfig/wallpaper/notification subprocess is not converted into a helper failure. | `UNEXPLAINED` | `config/spplus-apply-theme:L75-L83`, `L112-L120`, `L127-L145`; the resulting attempted-success behavior is recorded at `docs/ledger/DECISION-2026-08-30-theme-fidelity.md:L15-L21`. |
| Fresh image defaults select dark, regardless of the existence of the light package. | `SP+-POLICY` | `/etc/xdg/kdeglobals` names the dark look-and-feel and Papirus-Dark at `images/kde/Containerfile:L1051-L1069`; `/etc/xdg/plasmarc` names the dark desktop theme at `L1070-L1073`; `spplus-first-login` hard-codes the dark package and verifies dark values at `config/spplus-first-login:L17-L23` and `L65-L70`. |
| The system-wide seed adds `TerminalApplication=kitty` and `LookAndFeelPackage` keys that neither Windows package declares. | `SP+-POLICY` | `/etc/xdg/kdeglobals` writes them at `images/kde/Containerfile:L1057-L1069`; the image later verifies the Kitty executable at `images/kde/Containerfile:L1531-L1533`. |
| The system-wide KWin seed adds Wayland virtual-keyboard settings that neither package declares. | `SP+-POLICY` | `images/kde/Containerfile:L1079-L1089` writes `[Wayland] InputMethod=` and `VirtualKeyboardEnabled=false`; package declarations are limited to the decoration group at local defaults `...dark/contents/defaults:L28-L32` and light `:L28-L32`. |
| The image system default disables automatic screen locking, a setting neither package declares. | `UNEXPLAINED` | `config/kscreenlockerrc:L1-L2` is copied to `/etc/xdg/kscreenlockerrc` and checked for `Autolock=false` at `images/kde/Containerfile:L1113-L1114` and `L1130-L1131`; the complete local defaults tables in section 3 contain no `kscreenlockerrc` group. |
| The image deliberately drops the separate upstream session-lock shell, upstream custom-applet tree, panel template, and patched boot-greeter implementation even though upstream lists them as Windows Modern components. | `SP+-POLICY` | Explicit C++ applet/login-manager/lock-shell exclusion is `images/kde/Containerfile:L860-L863`; the full Windows Modern COPY list has no applet, template, shell, or PLM source at `L864-L870`; upstream component intent is `README.md:L40-L43`; local/upstream directory results are U7. |
| The dark lockscreen QML hard-codes `Segoe UI` while the global package defaults declare Noto Sans; no image install/readback establishes the Segoe face. | `UNEXPLAINED` | `WinStyle.qml:L23`; global Noto declarations `...dark/contents/defaults:L7-L11`; font install checks only Noto/IBM Plex/JetBrains at `images/kde/Containerfile:L1044-L1048`. |

The forced-font branch is not an additional Windows-package runtime mismatch:
both Windows packages already contain a `font` key, so the conditional extension
in `config/spplus-apply-theme:L122-L126` is not needed for these two packages.
The cursor and `SPPlus-Calm` reassertions in first-login use the same values as
the local Windows defaults at `config/spplus-first-login:L226-L250` and
`L102-L128`; they are not listed as value divergences.

## 8. Verification plan

Run these as the advisor inside a live Plasma 6 session. Each command is
intentionally a failing check, not a fixed assertion. `kreadconfig6` reads the
effective KConfig cascade used by the session, as described by
`config/spplus-first-login:L42-L64`.

### Package discovery and installed assets

| Assertion | Command |
|---|---|
| Dark package is discoverable | `grep -Fx -- 'org.secureprospective.spplus.windows11.dark' < <(plasma-apply-lookandfeel --list)` |
| Light package is discoverable | `grep -Fx -- 'org.secureprospective.spplus.windows11.light' < <(plasma-apply-lookandfeel --list)` |
| Dark metadata file exists | `test -f /usr/share/plasma/look-and-feel/org.secureprospective.spplus.windows11.dark/metadata.json` |
| Light metadata file exists | `test -f /usr/share/plasma/look-and-feel/org.secureprospective.spplus.windows11.light/metadata.json` |
| Dark look-and-feel ID matches its directory | `python3 -c 'import json; p="/usr/share/plasma/look-and-feel/org.secureprospective.spplus.windows11.dark/metadata.json"; assert json.load(open(p))["KPlugin"]["Id"] == "org.secureprospective.spplus.windows11.dark"'` |
| Light look-and-feel ID matches its directory | `python3 -c 'import json; p="/usr/share/plasma/look-and-feel/org.secureprospective.spplus.windows11.light/metadata.json"; assert json.load(open(p))["KPlugin"]["Id"] == "org.secureprospective.spplus.windows11.light"'` |
| Dark desktop theme exists | `test -d /usr/share/plasma/desktoptheme/Windows-modern-dark` |
| Light desktop theme exists | `test -d /usr/share/plasma/desktoptheme/Windows-modern-light` |
| Dark color scheme exists | `test -f /usr/share/color-schemes/WindowsModernDark.colors` |
| Light color scheme exists | `test -f /usr/share/color-schemes/WindowsModernLight.colors` |
| Dark Aurorae exists | `test -d /usr/share/aurorae/themes/windows-modern-dark-aurorae` |
| Light Aurorae exists | `test -d /usr/share/aurorae/themes/windows-modern-light-aurorae` |
| Windows Modern icon tree exists | `test -d /usr/share/icons/windows-modern` |
| Light Papirus tree exists | `test -d /usr/share/icons/Papirus` |
| Dark Papirus tree exists | `test -d /usr/share/icons/Papirus-Dark` |
| Breeze cursor tree exists | `test -d /usr/share/icons/breeze_cursors` |
| Upstream dark cursor is not silently assumed to exist | `test ! -e /usr/share/icons/Windows-modern-dark-cursors` |
| Kvantum engine package is installed | `rpm -q kvantum` |
| Windows Modern Kvantum directory exists | `test -d /usr/share/Kvantum/Windows-modern` |
| SP+ wallpaper package exists | `test -d /usr/share/wallpapers/SPPlus-Calm` |
| License is installed | `test -f /usr/share/sp-plus/theme/LICENSE-Windows-Modern-GPL3` |
| Standalone upstream panel template is absent | `test ! -e /usr/share/plasma/layout-templates/org.kde.windowsmodern.panel` |
| Separate upstream session-lock shell is absent | `test ! -e /usr/share/plasma/shells/org.kde.windowsmodern.lockscreen` |
| Dark look-and-feel layout script exists | `test -f /usr/share/plasma/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/layouts/org.kde.plasma.desktop-layout.js` |
| Light look-and-feel layout script exists | `test -f /usr/share/plasma/look-and-feel/org.secureprospective.spplus.windows11.light/contents/layouts/org.kde.plasma.desktop-layout.js` |

### Dark effective configuration

| Package key | Failing readback command |
|---|---|
| `ColorScheme` | `test "$(kreadconfig6 --file kdeglobals --group General --key ColorScheme)" = 'WindowsModernDark'` |
| `font` | `test "$(kreadconfig6 --file kdeglobals --group General --key font)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `menuFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key menuFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `toolBarFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key toolBarFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `activeFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key activeFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `smallestReadableFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key smallestReadableFont)" = 'Noto Sans,9,-1,5,50,0,0,0,0,0'` |
| `Icons:Theme` | `test "$(kreadconfig6 --file kdeglobals --group Icons --key Theme)" = 'Papirus-Dark'` |
| `KDE:widgetStyle` | `test "$(kreadconfig6 --file kdeglobals --group KDE --key widgetStyle)" = 'kvantum-dark'` |
| `Mouse:cursorTheme` | `test "$(kreadconfig6 --file kcminputrc --group Mouse --key cursorTheme)" = 'breeze_cursors'` |
| `plasmarc:Theme:name` | `test "$(kreadconfig6 --file plasmarc --group Theme --key name)" = 'Windows-modern-dark'` |
| `wallpaper` | `grep -Fq '/usr/share/wallpapers/SPPlus-Calm' "$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"` |
| `org.kde.kdecoration2:library` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key library)" = 'org.kde.kwin.aurorae.v2'` |
| `org.kde.kdecoration2:theme` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key theme)" = '__aurorae__svg__windows-modern-dark-aurorae'` |
| `org.kde.kdecoration2:ButtonsOnLeft` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key ButtonsOnLeft)" = ''` |
| `org.kde.kdecoration2:ButtonsOnRight` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key ButtonsOnRight)" = 'IAX'` |
| `Kvantum/kvantum.kvconfig:General:theme` | `test "$(kreadconfig6 --file Kvantum/kvantum.kvconfig --group General --key theme)" = 'Windows-modern'` |
| `ksplashrc:KSplash:Theme` | `test "$(kreadconfig6 --file ksplashrc --group KSplash --key Theme)" = 'none'` |

### Light effective configuration

| Package key | Failing readback command |
|---|---|
| `ColorScheme` | `test "$(kreadconfig6 --file kdeglobals --group General --key ColorScheme)" = 'WindowsModernLight'` |
| `font` | `test "$(kreadconfig6 --file kdeglobals --group General --key font)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `menuFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key menuFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `toolBarFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key toolBarFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `activeFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key activeFont)" = 'Noto Sans,10,-1,5,50,0,0,0,0,0'` |
| `smallestReadableFont` | `test "$(kreadconfig6 --file kdeglobals --group General --key smallestReadableFont)" = 'Noto Sans,9,-1,5,50,0,0,0,0,0'` |
| `Icons:Theme` | `test "$(kreadconfig6 --file kdeglobals --group Icons --key Theme)" = 'Papirus'` |
| `KDE:widgetStyle` | `test "$(kreadconfig6 --file kdeglobals --group KDE --key widgetStyle)" = 'kvantum'` |
| `Mouse:cursorTheme` | `test "$(kreadconfig6 --file kcminputrc --group Mouse --key cursorTheme)" = 'breeze_cursors'` |
| `plasmarc:Theme:name` | `test "$(kreadconfig6 --file plasmarc --group Theme --key name)" = 'Windows-modern-light'` |
| `wallpaper` | `grep -Fq '/usr/share/wallpapers/SPPlus-Calm' "$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"` |
| `org.kde.kdecoration2:library` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key library)" = 'org.kde.kwin.aurorae.v2'` |
| `org.kde.kdecoration2:theme` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key theme)" = '__aurorae__svg__windows-modern-light-aurorae'` |
| `org.kde.kdecoration2:ButtonsOnLeft` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key ButtonsOnLeft)" = ''` |
| `org.kde.kdecoration2:ButtonsOnRight` | `test "$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key ButtonsOnRight)" = 'IAX'` |
| `Kvantum/kvantum.kvconfig:General:theme` | `test "$(kreadconfig6 --file Kvantum/kvantum.kvconfig --group General --key theme)" = 'Windows-modern'` |
| `ksplashrc:KSplash:Theme` | `test "$(kreadconfig6 --file ksplashrc --group KSplash --key Theme)" = 'none'` |

### Layout readback

These checks establish that the live configuration contains the artifacts written
by the script; the source values and order are in section 6. If a panel config
format differs on the target Plasma build, capture the exact
`plasma-org.kde.plasma.desktop-appletsrc` panel block and use that block for the
same failing checks.

| Assertion | Command |
|---|---|
| Dark layout contains Kickoff | `grep -Fq 'plugin=org.kde.plasma.kickoff' "$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"` |
| Dark layout contains icon tasks | `grep -Fq 'plugin=org.kde.plasma.icontasks' "$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"` |
| Dark layout contains panel spacer | `grep -Fq 'plugin=org.kde.plasma.panelspacer' "$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"` |
| Dark layout contains system tray | `grep -Fq 'plugin=org.kde.plasma.systemtray' "$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"` |
| Dark layout contains digital clock | `grep -Fq 'plugin=org.kde.plasma.digitalclock' "$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"` |
| Dark layout contains Show Desktop | `grep -Fq 'plugin=org.kde.plasma.showdesktop' "$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"` |
| Dark favorites seed is present after a fresh layout reset | `grep -Fq 'applications:brave-browser.desktop' "$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"` |
| Layout wrote a 48px panel value | `grep -Fq 'height=48' "$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"` |
| Wallpaper path is present in the live desktop config | `grep -Fq '/usr/share/wallpapers/SPPlus-Calm' "$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"` |

## 9. Open questions for Christopher

- Which exact Windows Modern commit/tag should be recorded in `theme/vendor/PROVENANCE.md`?
- Should Windows 11 light/dark use the shipped `windows-modern` icon theme, or keep the package-declared Papirus/Papirus-Dark selection?
- Should the Windows Modern upstream wallpaper be used, or should `SPPlus-Calm` remain the Windows profile wallpaper?
- Should the dark boot-greeter QML remain copied without its patched PLM, or is the boot-greeter path outside the pilot?
- Are the upstream custom applets, standalone panel template, and session-lock overlay outside the pilot, or should any be restored as separately packaged components?
- Should the default first-login choice remain Windows Dark while Windows Light is applied only through an explicit later selection?
