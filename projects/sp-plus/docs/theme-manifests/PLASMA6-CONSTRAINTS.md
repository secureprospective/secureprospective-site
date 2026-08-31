# Plasma 6.7 look-and-feel findings

Scope: Plasma 6.7 source, Qt 6/KF 6, Wayland. Plasma 5 behavior is not used as authority. The Bee host had no running graphical Plasma session, so runtime observations below are source-derived unless explicitly marked as an operator observation.

## Executive findings

- `plasma-apply-lookandfeel --resetLayout` is **not layout-only**. It always applies the package's appearance settings, then additionally applies layout settings.
- The layout reset deletes every top-level group in `plasma-<shell>-appletsrc`, unloads the current shell, and schedules an asynchronous reload. It then executes the selected package's layout script when the now-empty layout is loaded.
- There is no exported PlasmaShell "layout reload completed" signal. `shellChanged` is for `changeShell`; the internal `startupCompleted` signal is not in the D-Bus XML. Poll/read back expected state instead of sleeping a fixed interval.
- Plasma 6.7 still emits the legacy `org.kde.KGlobalSettings.notifyChange` **signal**, but it is not a callable method. The command in the question therefore does not invoke it with `qdbus`.
- `KConfigWatcher` is a listener mechanism, not a universal reload command. Applications must opt in and decide what to reload.
- Aurorae `.v2` is the relevant KDecoration3 plugin for SVG Aurorae themes. Plasma 6.7 contains one-time migration from the old plugin ID for legacy SVG theme names, but new configuration should use `org.kde.kwin.aurorae.v2`.
- No source evidence shows that `kcminputrc` is intentionally truncated by layout reset. However, `--resetLayout` applies the cursor setting as part of appearance, and the observed zero-byte failure must be treated as real. Back up all affected config files before invoking it.

## 1. Live reload and D-Bus

### KWin reconfigure

`qdbus-qt6 org.kde.KWin /KWin org.kde.KWin.reconfigure` remains a real no-reply method in Plasma 6.7. It starts a roughly 200 ms reconfigure timer; it is not synchronous. KWin reparses configuration and emits its internal `configChanged` path, which reconfigures decorations, effects, tab switching, and other KWin consumers.

Read back the decoration result, not merely the config file:

```sh
kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key library
kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key theme
qdbus-qt6 org.kde.KWin /KWin org.kde.KWin.supportInformation \
  | grep -A3 -E '^(Plugin|Theme):'
```

The support-information result reports KWin's loaded decoration plugin and theme. If it reports Breeze while `kwinrc` requests Aurorae, the request failed or was replaced by fallback.

### `KGlobalSettings.notifyChange`

In Plasma 6.7's KCM common code, `notifyKcmChange()` constructs and sends:

```text
path      /KGlobalSettings
interface org.kde.KGlobalSettings
signal    notifyChange(int type, int arg)
```

There is no `notifyChange` method implementation in the inspected Plasma/KF6 sources. Therefore this is wrong as a method call:

```sh
qdbus-qt6 org.kde.KGlobalSettings /KGlobalSettings \
  org.kde.KGlobalSettings.notifyChange 0 0
```

It should fail with a missing-method/service error, or otherwise must not be treated as successful. Plasma KCMs still emit the signal, and KWin still listens to it for cursor/input changes. The current enum values are `PaletteChanged=0`, `FontChanged=1`, `StyleChanged=2`, `SettingsChanged=3`, `IconChanged=4`, and `CursorChanged=5`.

Do not use `KConfigWatcher` as a replacement command. It is an in-process watcher connected to `org.kde.kconfig.notify/ConfigChanged`; it only causes code that installed that watcher to react.

The Plasma 6.7 look-and-feel manager uses these mechanisms:

| Surface | Configuration read-back | Plasma 6.7 notification/application path |
|---|---|---|
| Palette | `kdeglobals`, `[General] ColorScheme`; usually `ColorSchemeHash` is also maintained | Applies the `.colors` file, emits legacy `PaletteChanged`, runs `kapplycolors`/`krdb` work through the manager |
| Widget style | `kdeglobals`, `[KDE] widgetStyle` | Writes config and emits legacy `StyleChanged`; source has a FIXME that changing style can break `QQuickWidgets` |
| Icons | `kdeglobals`, `[Icons] Theme` | Calls `KIconLoader::emitChange()` for every icon group in the applying process |
| Fonts | `kdeglobals`, `[General] font`, `fixed`, `smallestReadableFont`, `toolBarFont`, `menuFont`; `[WM] activeFont` | Sends `/KDEPlatformTheme`, `org.kde.KDEPlatformTheme.refreshFonts`; runs X/GTK export where applicable |
| Cursor | `kcminputrc`, `[Mouse] cursorTheme` and `cursorSize` | Emits legacy `CursorChanged`; KWin reparses `kcminputrc` and reloads the compositor cursor |

There is no single current D-Bus poke that guarantees every existing Qt/KDE application updates. The supported approach is to use the KDE/KCM apply path or reproduce the corresponding component-specific notification, then verify the config and visible/application state. Existing applications with cached QML/style/palette state may still need restarting.

## 2. Aurorae on Plasma 6.7

KWin's KDecoration3 bridge has:

```text
org.kde.breeze
org.kde.kwin.aurorae       (legacy/v1 Aurorae plugin)
org.kde.kwin.aurorae.v2     (the Plasma 6.7 SVG Aurorae plugin)
```

`.v2` is **not literally the only accepted library ID** in the Plasma 6.7 source: the v1 plugin is still built and can be loaded for legacy QML decoration packages. For SVG Aurorae themes, however, the bridge migrates `library=org.kde.kwin.aurorae` to `.v2` when the theme begins with `__aurorae__svg__`. New SVG configuration should write `.v2` explicitly. An old ID is therefore not silently ignored; it is either migrated for an SVG theme, loaded as the legacy plugin, or sent through KWin's normal fallback path if plugin/theme initialization fails.

The v2 implementation looks for:

```text
share/aurorae/themes/<theme>/decoration.svg
share/aurorae/themes/<theme>/<theme>rc
```

It also recognizes the legacy button SVG names (`minimize.svg`, `maximize.svg`, `restore.svg`, `close.svg`, etc.) and accepts `.svgz` for the decoration/button lookup. It reads the existing Aurorae `General` and `Layout` rc keys. The inspected Nordic, Orchis, and Catppuccin Classic directories have the expected legacy SVG, metadata, and rc structure. Source inspection therefore indicates that these sets do not inherently need a format conversion for v2, provided they are installed under the exact expected directory/name. This is not a claim that every individual SVG renders correctly.

Reliable failure check:

```sh
requested='org.kde.kwin.aurorae.v2'
actual=$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key library)
[ "$actual" = "$requested" ] || { echo "config mismatch: $actual" >&2; exit 1; }

info=$(qdbus-qt6 org.kde.KWin /KWin org.kde.KWin.supportInformation)
printf '%s\n' "$info" | grep -Fq 'Plugin: org.kde.kwin.aurorae.v2' || {
    echo "KWin did not load Aurorae v2" >&2
    printf '%s\n' "$info" >&2
    exit 1
}
printf '%s\n' "$info" | grep -Fq 'Theme: __aurorae__svg__THEME_NAME' || exit 1
```

Replace `THEME_NAME`. The support-information method is the important check; the config key alone only proves that the request was written. KWin logs plugin lookup/load failures under the `kwin` decoration logging category, but logs are not as reliable as the loaded-plugin read-back.

## 3. Look-and-feel package QML surfaces

The Plasma 6.7 `Plasma/LookAndFeel` package structure registers `logout`, `splash`, `windowswitcher`, `layouts`, `defaults`, and `colors`. It does **not** register look-and-feel `lockscreen`, `osd`, or `loginmanager` files as active surfaces.

| Package path | Plasma 6.7 status | Actual selector/read-back |
|---|---|---|
| `contents/splash/Splash.qml` | Honoured by KSplash QML | `ksplashrc`, `[KSplash] Theme`; `Engine=KSplashQML`. KSplash loads the selected `Plasma/LookAndFeel` package's `splash/Splash.qml`. It is used on the next session startup, not live in the current session. |
| `contents/windowswitcher/WindowSwitcher.qml` | Honoured | Effective KWin key is `kwinrc`, `[TabBox] LayoutName`. The package defaults convention is read from the `WindowSwitcher` section, then the manager writes the effective `TabBox` key. |
| `contents/layouts/*.js` | Honoured when the shell has no layout, including reset | Selected package is held by the look-and-feel manager; `ShellCorona::loadDefaultLayout()` loads `<shell>-layout.js`, then shell default layout if absent. |
| `contents/logout/Logout.qml` | Still loaded by `logout-greeter`; package structure marks the flag as deprecated/possibly unused, but Plasma 6.7 has a live consumer | It uses the current look-and-feel package selected in the session. No separate persistent selector is needed beyond the global-theme package state. It is only visible during logout. |
| `contents/lockscreen/*` | Ignored for this package type | Lock screen QML comes from `Plasma/Shell`, normally `org.kde.plasma.desktop`, selected through `plasmashellrc`, `[Shell] ShellPackage`. Lock-screen per-user settings are in `kscreenlockerrc`, `[Greeter] [LnF]`, but that is not the package selector. |
| `contents/osd/*` | Ignored | Plasma's OSD is supplied by the shell module `org.kde.plasma.workspace.osd`, not a look-and-feel package path. |
| `contents/loginmanager/*` | Ignored | SDDM uses its own SDDM theme package and configuration, normally `/etc/sddm.conf` or `/etc/sddm.conf.d/*.conf`, `[Theme] Current`. A Plasma global theme does not make this a current-session QML surface. |
| `contents/previews/*` | Not runtime UI | These are KCM preview assets: `preview.png`, fullscreen, lock-screen, splash, and window-switcher previews. |

## 4. `--resetLayout`

`lnftool.cpp` starts with:

```text
AppearanceSettings | BlendChanges
```

and adds `LayoutSettings` only when `--resetLayout` is present. Consequently `--resetLayout` can rewrite palette, widget style, icons, Plasma theme, cursor, fonts, splash, window decoration, task switcher, and other package-provided appearance values in addition to layout.

For the layout portion, the sequence is:

1. Call `org.kde.PlasmaShell /PlasmaShell loadLookAndFeelDefaultLayout(packageId)` without waiting for a completed reload.
2. Validate the package.
3. Open `plasma-<shell>-appletsrc`.
4. Delete every top-level group and call `sync()`.
5. Destroy desktop/panel containments with `unload()`.
6. Queue `load()` with `QTimer::singleShot(0, ...)`.
7. Since the config is now empty, `loadDefaultLayout()` evaluates the selected package's `<shell>-layout.js`, or the shell's built-in default layout if the package has no script.

For the standard Breeze package, `org.kde.plasma.desktop-layout.js` calls `loadTemplate("org.kde.plasma.desktop.defaultPanel")`, sets desktop wallpaper handling, and the template creates a fresh panel with launcher, pager, icon task manager, margins separator, system tray, clock, and show-desktop applets.

### Destroyed versus retained

- **Panels:** destroyed and recreated. Their location, size, length, offset, alignment, hiding mode, opacity, applet order, and per-applet configuration are replaced by the package/template defaults.
- **Panel position and size:** not retained. The default template chooses an available edge and computes a default height.
- **Desktop widgets:** destroyed and recreated according to the layout script. Existing widget configuration in the deleted applet layout is not retained.
- **Desktop containment configuration:** destroyed with the top-level groups and recreated/defaulted.
- **Per-screen arrangement:** old containment-to-screen layout is destroyed. The newly created layout is assigned against the currently known screen order; it is not a restoration of the previous arrangement.
- **Activities:** the KActivities records themselves are not deleted by this function. The layout containments associated with the current shell are deleted; the shell then recreates what its startup script requests. Do not interpret this as an activity database reset.
- **Virtual desktops:** KWin's virtual-desktop configuration is separate from `plasma-<shell>-appletsrc`; resetLayout does not delete the virtual desktop count/layout.
- **Pinned/favourite applications:** not a general layout file. Kicker favorites are applet/config or KActivitiesStats data and are not guaranteed to be preserved when the kicker applet is recreated. Do not promise preservation without taking a before/after favorite read-back for the exact launcher implementation.
- **Other config files:** the layout deletion directly targets the shell applet file, but the same command's appearance phase can write `kdeglobals`, `plasmarc`, `kwinrc`, `ksplashrc`, `plasmashellrc`, and `kcminputrc` (plus `~/.config/kdedefaults/*`).

### Completion/read-back

There is no completion signal for this operation. `startupCompleted` exists inside `ShellCorona`, but it is not exported by `org.kde.PlasmaShell.xml`. `shellChanged` is emitted by `changeShell`, not by `loadLookAndFeelDefaultLayout`.

A safe caller must poll actual expected state. At minimum, wait until the applet file is non-empty again, `plasmashell` is alive, and a read-back of the expected panel/applet IDs succeeds. For a generic package, dump with:

```sh
qdbus-qt6 org.kde.plasmashell /PlasmaShell \
  org.kde.PlasmaShell.dumpCurrentLayoutJS > /tmp/layout-after.js
```

Then validate package-specific invariants in the dump/config. A fixed `sleep` is not a completion protocol.

### `kcminputrc` safety

The inspected Plasma 6.7 source does not intentionally truncate unrelated files. However, appearance application calls `setCursorTheme()`, which opens `kcminputrc`, writes the cursor default in `kdedefaults/kcminputrc`, calls `revertToDefault()` on the active `[Mouse] cursorTheme` key, and syncs. That is enough to explain why `kcminputrc` is in the blast radius even though the requested operation is called a layout reset.

Because a zero-byte `kcminputrc` was observed, treat it as an in-house reproducible failure/bug until tested against the exact distro build. Before applying:

```sh
stamp=$(date +%Y%m%d-%H%M%S)
backup="$HOME/.local/state/terra-plasma6-backup/$stamp"
mkdir -p "$backup"
for f in plasma-org.kde.plasma-appletsrc kdeglobals kwinrc plasmarc ksplashrc plasmashellrc kcminputrc; do
    [ -e "$HOME/.config/$f" ] && cp -a -- "$HOME/.config/$f" "$backup/"
done
```

Also record file sizes and hashes before and after. If `kcminputrc` becomes empty, stop; restore the backup only after stopping/restarting the consumers that may have the old file cached, then verify with `kreadconfig6 --file kcminputrc --group Mouse --key cursorTheme` and a KWin cursor read-back/visible test. There is no supported transaction or snapshot API around the whole global-theme operation.

## 5. Lightest action by surface

| Surface | Lightest practical action | What is genuinely guaranteed |
|---|---|---|
| Colour scheme | Use the KDE apply path; legacy palette signal is emitted | KDE-aware applications commonly update live; restart applications that retain old QML/widget palettes. |
| Qt widget style | Apply config plus style notification; restart affected applications for certainty | Existing `QQuickWidget` users are explicitly called out by Plasma as unsafe for on-the-fly style changes. |
| Icon theme | Apply config and `KIconLoader` change notification | Many KDE apps update live; cached/plain Qt applications may need restart. Verify `[Icons] Theme` and an icon-path/probe in the target app. |
| Cursor theme | Cursor notification; KWin reloads it live | Compositor cursor should change live. Client-owned cursor caches may need app restart. |
| Fonts | `refreshFonts` notification | KDE platform-theme consumers may update; restart applications that do not. |
| Plasma desktop theme | `plasmarc [Theme] name`; shell/theme watchers handle normal changes | If a shell component remains stale, replace plasmashell. |
| Window decoration | `KWin.reconfigure`; wait for the 200 ms reconfigure and check supportInformation | KWin recreates decorations live. |
| Splash screen | No current-session action | Requires the next logout/login or reboot; reboot is not inherently required. |
| Lock screen | Lock/unlock after changing the shell package/config | The lockscreen greeter is loaded on lock. |
| SDDM theme | Change SDDM configuration/theme package | Requires reaching the SDDM greeter, normally logout/login; no running-session reload. |
| Panel layout | `loadLookAndFeelDefaultLayout` / shell reload | Asynchronous; poll layout read-back. Full logout is unnecessary. |
| Task switcher | `KWin.reconfigure` | New task-switcher invocations use the reloaded layout. |
| Kvantum skin | Change selector, then restart affected Qt applications; logout for all KDE session pieces | Existing applications are not a reliable live target. No reboot is required. |

No listed surface inherently requires a reboot. Splash and SDDM require a new greeter/session; Kvantum and some application style/palette/font changes require application restart or logout for complete visibility.

## 6. Kvantum

Current upstream Kvantum source supports both Qt style keys:

```text
kvantum
kvantum-dark
```

The active Qt style must therefore be selected through the Qt/KDE style setting, normally:

```text
kdeglobals [KDE]
widgetStyle=kvantum       # light/base style
widgetStyle=kvantum-dark  # dark variant
```

Kvantum then reads its theme selector from:

```text
${XDG_CONFIG_HOME:-$HOME/.config}/Kvantum/kvantum.kvconfig
key: theme=<theme-name>
```

If the user file is absent, Kvantum searches standard global config locations. `KVANTUM_THEME` is not read by the inspected current upstream style source and should not be treated as the activation/read-back mechanism. A theme's own `<theme-name>.kvconfig` and SVG must also be discoverable in a supported Kvantum theme directory, such as `~/.config/Kvantum/<theme-name>/` or the system `share/Kvantum/<theme-name>/` location.

Kvantum's own manager says running applications receive a changed theme after they are closed and reopened; logging out/in is the reliable way to refresh all KDE session components. This applies to Qt5 and Qt6 in principle, but each major Qt version needs its own installed Kvantum style plugin. KDE versus plain Qt does not change the basic fact that the existing process owns an already-created `QStyle` and widgets; KDE applications may additionally obtain colors from `kdeglobals`.

There is no general supported D-Bus command that makes every running Qt5/Qt6 application reconstruct its style. Do not report success from `kvantum.kvconfig` alone. Use both levels of read-back:

```sh
kreadconfig6 --file kdeglobals --group KDE --key widgetStyle
sed -n '/^\[General\]/,/^\[/p' "$HOME/.config/Kvantum/kvantum.kvconfig"
```

Then launch a small Qt probe separately under Qt6 and Qt5 and print `QApplication::style()->metaObject()->className()` (and `objectName()` if provided). The probe must report the Kvantum style class; a config value of `kvantum` is only a request and can silently fall back if the plugin is missing or incompatible.

## Source locations checked

- `plasma-workspace/libklookandfeel/klookandfeelmanager.cpp`
- `plasma-workspace/libklookandfeel/klookandfeelmanager.h`
- `plasma-workspace/kcms/lookandfeel/tool/lnftool.cpp`
- `plasma-workspace/shell/shellcorona.cpp`
- `plasma-workspace/shell/dbus/org.kde.PlasmaShell.xml`
- `plasma-workspace/shell/packageplugins/lookandfeel/lookandfeel.cpp`
- `plasma-workspace/ksplash/ksplashqml/splashwindow.cpp`
- `plasma-workspace/logout-greeter/shutdowndlg.cpp`
- `kscreenlocker/greeter/greeterapp.cpp` and `settings/shell_integration.cpp`
- `kwin/src/decorations/decorationbridge.cpp`
- `kwin/src/org.kde.KWin.xml`
- `kwin/src/workspace.cpp`
- `aurorae/v2/decorationtheme.cpp` and `v2/decoration.cpp`
- `kconfig/src/core/kconfigwatcher.cpp`
- Current upstream Kvantum `Kvantum/style/Kvantum.cpp` and `style/KvantumPlugin.cpp`
