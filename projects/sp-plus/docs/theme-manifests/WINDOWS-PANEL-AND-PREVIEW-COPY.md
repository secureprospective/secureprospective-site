# SP+ parallel findings: stock Plasma taskbar and DN-44 preview copy

Prepared for Claude. No SP+ repository access was needed. The recommendations below assume
stock Fedora Plasma 6.7 applets only, with the existing SP+ policy that a theme wins on what it
declares and policy fills the gaps.

## Task 1 — stock Plasma 6 applets versus a Windows 11 taskbar

### Recommendation

Ship a **Windows-familiar Plasma panel**, not a claimed Windows 11 reproduction. Use the stock
icons-only task manager, a real Kickoff launcher, a real system tray and the real Plasma clock.
Keep the panel full-width and anchored to the bottom. Do not fake Start, Widgets or Snap
Layouts with decorative buttons that do not do what a Windows user expects.

The result can reproduce the visual rhythm and the main daily actions well enough to reassure a
Windows user. It cannot reproduce the Windows 11 interaction model or exact centred geometry.
That distinction should be part of the theme's internal acceptance criteria and not exposed as a
technical warning to the user.

### Concrete panel specification

Target a 16:9 1920-pixel display first, then test 1366 pixels, 4K scaling and multi-monitor.
Use one horizontal panel per screen.

| Position | Stock applet | Plugin ID | Configuration / purpose |
|---|---|---|---|
| 1 | Flexible spacer | `org.kde.plasma.panelspacer` | `General/expanding=true`. Balances the centre group as far as the linear panel layout permits. |
| 2 | Application Launcher (Kickoff) | `org.kde.plasma.kickoff` | Compact representation; no text label; use the standard launcher icon unless the installed icon theme supplies a deliberate alternative. |
| 3 | Icons-Only Task Manager | `org.kde.plasma.icontasks` | Pinned launchers followed by running applications; one row; grouped by application; fit content rather than fill the panel. |
| 4 | Flexible spacer | `org.kde.plasma.panelspacer` | `General/expanding=true`. This is the best stock approximation of a centred Start/task group. |
| 5 | System Tray | `org.kde.plasma.systemtray` | Show the small set of relevant always-visible controls; put incidental status items in the tray popup. |
| 6 | Digital Clock | `org.kde.plasma.digitalclock` | Time above date, matching the Windows taskbar's two-line clock treatment. |
| 7 | Minimise All Windows | `org.kde.plasma.minimizeall` | Small show-desktop affordance at the far right. This is not the Windows 11 thin hover strip. |

Panel settings:

- `location="bottom"`.
- `lengthMode="fill"`; full screen width.
- `height=48` pixels at the target scale.
- `hiding="none"`; do not make the user chase the taskbar.
- Horizontal form factor; lock the panel after creation.
- Use an anchored panel. The theme may make its background translucent or visually soft, but
  do not depend on Plasma's floating-panel mode for the layout. The script API exposes a
  `floating` location, but the exact floating-applet presentation and behaviour should be
  verified on the target Plasma build; it is not needed for a reliable pilot.
- The panel's `alignment` is effectively irrelevant when `lengthMode="fill"`. If set, use
  `alignment="center"` for clarity.
- Do not add a second task manager, application dashboard, pager, or decorative separator.

Task manager configuration, in `General`:

- `launchers`: a `StringList` of the approved pinned application URLs, in the required order.
  Use values such as `preferred://browser` or
  `applications:org.kde.dolphin.desktop`; inject SP+'s actual approved application list rather
  than guessing desktop-file IDs.
- `groupingStrategy=1` — group by application.
- `groupPopups=true` — one icon opens the grouped windows in a popup.
- `onlyGroupWhenFull=false` — group consistently, rather than changing behaviour when space is
  tight.
- `separateLaunchers=true` and `sortingStrategy=1` — preserve the pinned order. Icons-Only mode
  has special launcher handling and may place a running app in its launcher position, but this
  must be checked visually; do not promise Windows-identical behaviour.
- `fill=false` — let the task manager fit its contents; `fill=true` consumes the centre space and
  defeats the centred-group treatment.
- `maxStripes=1`, `forceStripes=false` — one horizontal row.
- `showToolTips=true`, `taskHoverEffect=true`.
- `showOnlyCurrentDesktop=true`, `showOnlyCurrentActivity=true`, `showOnlyCurrentScreen=false`
  for the ordinary single-screen office case. Reconsider the desktop setting if SP+ users are
  expected to move windows between virtual desktops.
- `iconSpacing=1` — normal spacing. `0` is the tighter option; `3` is large.
- `middleClickAction=2` — new instance, if that is the desired Windows-like middle-click
  convention.
- `minimizeActiveTaskOnClick=false` is the safer Windows expectation: clicking the active icon
  should not unexpectedly minimise it.
- Leave `indicateAudioStreams=true` unless the pilot's visual review finds the badge distracting.

Kickoff configuration, in `General`:

- `icon`: use `start-here-kde-symbolic` or the actual standard launcher icon available in the
  image. A Windows-looking logo is cosmetic only and raises the expectation that the menu is
  Windows Start; avoid it unless the menu is deliberately branded as a familiar launcher.
- `menuLabel=""` — icon only.
- `favorites`: the same approved work applications that should appear as pinned favourites in
  the menu. This is separate from task-manager `launchers` and should be kept in intentional
  sync by the layout generator.
- `favoritesDisplay=0` — grid, the closer visual approximation to pinned Start items.
- `applicationsDisplay=1` — list, which is easier to scan than a dense grid.
- `primaryActions=0` — power action in the footer; do not expose a collection of session actions
  just to imitate a screenshot.
- `appNameFormat=0` if the menu should prefer application names rather than generic descriptions.

Digital clock configuration, in `Appearance`:

- `showDate=true`.
- `dateDisplayFormat=2` — always below the time (`0` adaptive, `1` beside, `2` below in the
  Plasma 6.7 source).
- `dateFormat="shortDate"` — allow the locale to determine the short-date order.
- `showSeconds=0` — never show seconds in the panel (`1` tooltip only, `2` always).
- `use24hFormat=1` — use regional defaults (`0` 12-hour, `2` 24-hour). Do not force 24-hour time
  if the product's locale policy says to follow the user's Windows habit; the key name is
  misleading because its values are a three-way selection.
- `showLocalTimezone=false`, `autoFontAndSize=true`.

System tray configuration, in `General`:

- `showAllItems=false`.
- `scaleIconsToFit=false` so icons remain controlled rather than filling the 48-pixel thickness.
- `iconSpacing=1` for a compact tray.
- Put network, volume, notifications and battery (only where a battery exists) in the main
  area when those applets are actually installed. Put clipboard, keyboard/layout indicators and
  incidental application status icons in the expanded popup unless the product needs them
  visible.
- The relevant keys are `extraItems`, `shownItems`, `hiddenItems`, `knownItems`, and
  `disabledStatusNotifiers`. `extraItems` is a list of applet plugin IDs; `shownItems` and
  `hiddenItems` may contain applet IDs or runtime StatusNotifier IDs. Do not hard-code unknown
  StatusNotifier IDs. Build the list from installed types and leave unrecognised runtime items
  alone.

Panel-spacer configuration:

- `General/expanding=true` for both spacers.
- `General/expanding=false` plus `General/length=<pixels>` is available for a fixed spacer, but
  fixed widths are brittle because the task list, scale factor and tray width vary.

Layout-script shape (illustrative, not an apply-path patch):

```javascript
const approvedLaunchers = [
    "preferred://browser",
    // Add SP+'s approved work applications here, in pinned order.
];

const panel = new Panel;
panel.location = "bottom";
panel.lengthMode = "fill";
panel.height = 48;
panel.hiding = "none";
panel.alignment = "center";
panel.locked = true;

const left = panel.addWidget("org.kde.plasma.panelspacer");
left.currentConfigGroup = ["General"];
left.writeConfig("expanding", true);

const start = panel.addWidget("org.kde.plasma.kickoff");
start.currentConfigGroup = ["General"];
start.writeConfig("menuLabel", "");
start.writeConfig("favoritesDisplay", 0);
start.writeConfig("applicationsDisplay", 1);

const tasks = panel.addWidget("org.kde.plasma.icontasks");
tasks.currentConfigGroup = ["General"];
tasks.writeConfig("launchers", approvedLaunchers);
tasks.writeConfig("groupingStrategy", 1);
tasks.writeConfig("groupPopups", true);
tasks.writeConfig("onlyGroupWhenFull", false);
tasks.writeConfig("fill", false);
tasks.writeConfig("maxStripes", 1);
tasks.writeConfig("iconSpacing", 1);

const right = panel.addWidget("org.kde.plasma.panelspacer");
right.currentConfigGroup = ["General"];
right.writeConfig("expanding", true);

const tray = panel.addWidget("org.kde.plasma.systemtray");
tray.currentConfigGroup = ["General"];
tray.writeConfig("showAllItems", false);
tray.writeConfig("scaleIconsToFit", false);
tray.writeConfig("iconSpacing", 1);

const clock = panel.addWidget("org.kde.plasma.digitalclock");
clock.currentConfigGroup = ["Appearance"];
clock.writeConfig("showDate", true);
clock.writeConfig("dateDisplayFormat", 2);
clock.writeConfig("dateFormat", "shortDate");
clock.writeConfig("showSeconds", 0);
clock.writeConfig("use24hFormat", 1);

if (knownWidgetTypes.includes("org.kde.plasma.minimizeall")) {
    panel.addWidget("org.kde.plasma.minimizeall");
}
```

The `knownWidgetTypes` guard is important. In current Plasma source the applet's metadata ID is
`org.kde.plasma.minimizeall`, although its root path and older translations refer to
`org.kde.plasma.showdesktop`. If the target image exposes only the older ID, detect it and use
that ID; do not blindly add `org.kde.plasma.showdesktop`.

The two flexible spacers do not create a mathematically fixed Windows centre. Plasma's panel is a
linear layout, and the tray, clock and show-desktop control have variable width. The task group
will be approximately centred and will bias as the right-hand cluster changes. Exact independent
centering requires a custom applet, a nested layout primitive, or fixed-width compensation; all
are outside this stock-applet ceiling. This is the most important limitation to test at several
window counts and display widths.

### Honest gap list

| Windows 11 characteristic | Stock Plasma result | Classification |
|---|---|---|
| Start and task icons stay exactly centred while the right cluster changes | Two flexible spacers give a centred-looking group, but the linear layout and variable task/tray widths can move it. | Approximable, not exact |
| Windows Start menu with pinned and recommended areas | Kickoff has favourites, applications, places and session actions, but a different structure and interaction model. | Approximable only at the broadest level |
| Pinned app and running-window icon share one stable position | Icons-Only Task Manager supports launchers, grouping and popup selection, but its launcher/startup rules differ and need visual testing. | Approximable |
| Grouped windows and previews | `groupingStrategy=1` and `groupPopups=true` provide grouped application icons and a popup. Preview layout, hover timing and context menu are Plasma's. | Approximable |
| Snap Layouts on maximise-button hover / Win+Z | The taskbar applets cannot provide the Windows Snap Layouts flyout. Plasma KWin may provide its own tiling or quick-tile features, but they are not the Windows UI and are not supplied by this theme panel. | Impossible under this constraint; native Plasma tiling is a separate feature |
| Windows Widgets button and Widgets feed | No stock panel applet is a Windows Widgets equivalent. Adding a weather/news icon would not reproduce the feature and may not be in the image. | Impossible as a match |
| Windows acrylic/mica materials | Plasma theme transparency, blur and panel styling can suggest translucency, but not Windows' material rules, wallpaper tinting or per-surface fallback behaviour. | Cosmetic approximation |
| Rounded taskbar and task buttons | Panel theme can draw a rounded or softened background. Stock task buttons and popups retain Plasma geometry and hit areas. | Cosmetic approximation |
| Windows notification/quick-settings cluster | Plasma System Tray supplies real network, volume, notifications and other controls, but its popup and grouping are different. | Approximable functionally, not visually or behaviourally |
| Thin show-desktop strip at the extreme right | Minimise All Windows is a real action, but it is an applet/button rather than the Windows thin hover target. | Approximable |
| Taskbar badges, hover thumbnails and task switching | Plasma has task indicators, tooltips and grouped-task UI. Details, badges and preview presentation differ. | Approximable |
| Taskbar right-click menus and jump lists | Plasma supplies its own task context menu. Windows jump-list semantics are not reproduced. | Impossible as a match |
| Windows search/Copilot affordance | No stock applet in this panel is a Windows Search/Copilot equivalent. | Impossible as a match |
| Cursor theme | Windows Modern has no upstream cursor set in this image. The standard cursor remains. | Not changed; state plainly |

The panel can therefore reproduce the **landmarks** that matter daily: bottom location, compact
icons, pinned applications, grouped running applications, clock/date and real system controls.
It cannot reproduce the Windows contract that a user has learned around those landmarks.

### When approximation becomes a knock-off

It stops helping when the visual cue promises a Windows action and produces a different one. The
most damaging examples are a Windows logo opening a visibly KDE-shaped menu, a fake Widgets or
Snap button that does nothing useful, an icon group that visibly drifts while claiming to be
centred, and glass effects that imply Windows materials without improving readability.

For a non-technical daily Windows user, reassurance comes from predictable landmarks and low
surprise, not pixel-level imitation. The acceptance bar should be:

1. The bottom bar is immediately recognisable.
2. Pinned apps are in a stable order and clicking them behaves predictably.
3. Running applications are visibly distinct and grouped in a way that is easy to learn.
4. The clock, date, volume, network and notifications are easy to find.
5. Nothing advertises a capability that is absent.
6. The panel does not shift enough at common window counts to look broken.

The better target is **familiar office desktop**, not counterfeit Windows. Keep the Windows-like
bottom placement, compact task icons and restrained spacing, but use honest stock launcher and
tray controls, avoid fake Widgets/Search/Snap affordances, and let the theme's distinctive value
be calm readability rather than logo-level imitation. If the centred group fails the multi-size
visual test, prefer a stable left-aligned Start-plus-task arrangement over a visibly unstable
pseudo-centre. A stable, legible panel is more reassuring than a closer screenshot that moves.

## Task 2 — DN-44 preview panel copy

The copy below is intentionally short-line and viewport-safe. The screenshot carries the visual
weight; the text acts as the receipt and confirmation. The full list stays visible rather than
being hidden to make the panel look less serious.

### Version A — theme replaces the panel layout

**Windows Modern**

**Preview**

### What will change

- Colours, window style and desktop theme
- Panel and pinned apps: replaced with this theme's arrangement
- Splash screen: changes next time you sign in

### What will stay the same for now

- Apps already open may keep their current look. Reopen them to see the new style.
- The mouse pointer stays standard for Windows Modern.
- The lock screen and on-screen messages stay unchanged.

**Your current panel is saved.**
You can restore the previous panel and pinned apps later.

[Apply Windows Modern]  [Keep current theme]

Use a small secondary link beside or below the receipt, if there is room:
**Restore previous panel**

Do not label this action “Undo everything”. It restores the saved panel arrangement and pinned
apps; it does not imply that already-open applications, the splash screen or unrelated settings
will instantly roll back.

### Version B — theme does not replace the panel layout

**Windows Modern**

**Preview**

### What will change

- Colours, window style and desktop theme
- Splash screen: changes next time you sign in

### What will stay the same for now

- Your panel and pinned apps stay as they are.
- Apps already open may keep their current look. Reopen them to see the new style.
- The mouse pointer stays standard for Windows Modern.
- The lock screen and on-screen messages stay unchanged.

No panel backup is needed because this theme does not change the panel.

[Apply Windows Modern]  [Keep current theme]

### Restore wording and information hierarchy

Lead with the consequence that affects daily work: **what changes**, especially the panel and
pinned apps. Put timing and open-application behaviour immediately underneath because those are
where a user could otherwise think the apply failed. Put unchanged items in a compact “What will
stay the same” block. Keep the cursor sentence explicit for Windows Modern because the absence
of a cursor change is a real theme-specific difference.

The restore sentence should sound like control, not damage recovery:

> Your current panel is saved. You can restore the previous panel and pinned apps later.

Avoid “your layout will be destroyed”, “reset”, “rollback”, “recovery” and “backup” as the main
heading. “Saved” and “restore the previous panel” are accurate and reassuring. If a detail drawer
exists, its label can be **Tell me more** and repeat the same facts, but none of the four required
truths should be available only there. The visible panel is the confirmation receipt.

Do not mention a lock-screen or on-screen-display change as something the theme applies. The only
safe user-facing wording is that they remain unchanged, as above. Do not say that a reboot is
required; it is not. The splash change is deferred to the next sign-in, while already-open apps
may need reopening before their new appearance is visible.

## Verification notes

The applet IDs and keys above should still be checked against the actual image at layout-script
runtime using `knownWidgetTypes`; distro packaging and minor Plasma releases can change an ID or
available applet. The important source facts used here are:

- Plasma scripting API: https://develop.kde.org/docs/plasma/scripting/api/
- Plasma Icons-Only Task Manager metadata and task configuration: the Plasma Workspace source,
  `applets/taskmanager/main.xml` and `applets/icontasks/metadata.json`.
- Plasma panel spacer configuration: the Plasma Desktop source,
  `applets/panelspacer/main.xml`.
- Plasma System Tray configuration: the Plasma Desktop source,
  `applets/systemtray/main.xml`.
- Plasma Digital Clock configuration: the Plasma Desktop source,
  `applets/digital-clock/main.xml`.
- Plasma Kickoff configuration: the Plasma Workspace source, `applets/kickoff/main.xml`.
- Windows taskbar and Snap comparison: https://support.microsoft.com/en-US/Windows/Experience/Personalization/customize-the-taskbar-in-Windows
  and https://learn.microsoft.com/en-us/windows/apps/desktop/modernize/ui/apply-snap-layout-menu
