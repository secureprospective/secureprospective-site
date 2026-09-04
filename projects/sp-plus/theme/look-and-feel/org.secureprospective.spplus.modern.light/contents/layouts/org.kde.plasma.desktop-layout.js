// NOTE: this file is a real copy of the Windows Dark layout, deliberately NOT a symlink.
// Plasma's look-and-feel package loader silently IGNORES symlinked files inside a package:
// verified on the Dell, where the symlinked version made Windows Light fall back to the
// stock default panel (kickoff, pager, icontasks, marginsseparator, ...) while reporting no
// error at all. The apply then failed its own layout read-back. Keep both files real, and
// keep them in step by editing both.
// SP+ Modern panel. Both Modern variants use this one stock layout.
// Plasma 6.7: keep widget IDs native and guard the version-sensitive show-desktop ID.
var spplusTaskbarLaunchers = [
    "applications:brave-browser.desktop",
    "applications:org.mozilla.Thunderbird.desktop",
    "applications:org.kde.dolphin.desktop",
    "applications:libreoffice-writer.desktop",
    "applications:org.kde.okular.desktop"
];
var spplusMenuFavorites = [
    "applications:brave-browser.desktop",
    "applications:org.mozilla.Thunderbird.desktop",
    "applications:fin.desktop",
    "applications:org.kde.dolphin.desktop",
    "applications:libreoffice-writer.desktop",
    "applications:org.kde.okular.desktop",
    "applications:org.keepassxc.KeePassXC.desktop"
];

var oldPanels = panels();
for (var oldPanelIndex = oldPanels.length - 1; oldPanelIndex >= 0; --oldPanelIndex) {
    oldPanels[oldPanelIndex].remove();
}

var spplusWidgetTypes = (typeof knownWidgetTypes !== "undefined") ? knownWidgetTypes : [];
var spplusShowDesktopType = null;
if (typeof spplusWidgetTypes.indexOf === "function") {
    if (spplusWidgetTypes.indexOf("org.kde.plasma.minimizeall") !== -1) {
        spplusShowDesktopType = "org.kde.plasma.minimizeall";
    } else if (spplusWidgetTypes.indexOf("org.kde.plasma.showdesktop") !== -1) {
        spplusShowDesktopType = "org.kde.plasma.showdesktop";
    }
}

for (var screen = 0; screen < screenCount; ++screen) {
    var panel = new Panel;
    panel.screen = screen;
    panel.location = "bottom";
    panel.height = 48;
    panel.alignment = "center";
    panel.hiding = "none";
    panel.lengthMode = "fill";
    panel.opacity = "opaque";
    panel.floating = false;

    var panelWidgets = [];
    var leftSpacer = panel.addWidget("org.kde.plasma.panelspacer");
    leftSpacer.currentConfigGroup = ["General"];
    leftSpacer.writeConfig("expanding", "true");
    panelWidgets.push(leftSpacer);

    var start = panel.addWidget("org.kde.plasma.kickoff");
    start.currentConfigGroup = ["General"];
    // modern ships start-here.svg (the four-pane Windows mark) but NOT
    // start-here-kde-symbolic. Asking for the symbolic name falls through to Breeze
    // and puts a KDE logo on the Start button of a Windows-familiar desktop --
    // verified on the Dell. Ask for the name the theme actually provides.
    start.writeConfig("icon", "start-here");
    start.writeConfig("favorites", spplusMenuFavorites.join(","));
    start.writeConfig("favoritesPortedToKAstats", "false");
    panelWidgets.push(start);

    var tasks = panel.addWidget("org.kde.plasma.icontasks");
    tasks.currentConfigGroup = ["General"];
    tasks.writeConfig("launchers", spplusTaskbarLaunchers.join(","));
    tasks.writeConfig("groupingStrategy", "1");
    tasks.writeConfig("groupPopups", "true");
    tasks.writeConfig("onlyGroupWhenFull", "false");
    tasks.writeConfig("separateLaunchers", "true");
    tasks.writeConfig("sortingStrategy", "1");
    tasks.writeConfig("fill", "false");
    tasks.writeConfig("maxStripes", "1");
    tasks.writeConfig("forceStripes", "false");
    tasks.writeConfig("showToolTips", "true");
    tasks.writeConfig("taskHoverEffect", "true");
    tasks.writeConfig("showOnlyCurrentDesktop", "true");
    tasks.writeConfig("showOnlyCurrentActivity", "true");
    tasks.writeConfig("showOnlyCurrentScreen", "false");
    tasks.writeConfig("iconSpacing", "1");
    tasks.writeConfig("middleClickAction", "2");
    tasks.writeConfig("minimizeActiveTaskOnClick", "false");
    tasks.writeConfig("indicateAudioStreams", "true");
    panelWidgets.push(tasks);

    var rightSpacer = panel.addWidget("org.kde.plasma.panelspacer");
    rightSpacer.currentConfigGroup = ["General"];
    rightSpacer.writeConfig("expanding", "true");
    panelWidgets.push(rightSpacer);

    var tray = panel.addWidget("org.kde.plasma.systemtray");
    tray.currentConfigGroup = ["General"];
    tray.writeConfig("showAllItems", "false");
    tray.writeConfig("scaleIconsToFit", "false");
    tray.writeConfig("iconSpacing", "1");
    panelWidgets.push(tray);

    var clock = panel.addWidget("org.kde.plasma.digitalclock");
    clock.currentConfigGroup = ["Appearance"];
    clock.writeConfig("showDate", "true");
    clock.writeConfig("dateDisplayFormat", "2");
    clock.writeConfig("showSeconds", "0");
    panelWidgets.push(clock);

    if (spplusShowDesktopType !== null) {
        panelWidgets.push(panel.addWidget(spplusShowDesktopType));
    }

    for (var widgetIndex = 0; widgetIndex < panelWidgets.length; ++widgetIndex) {
        panelWidgets[widgetIndex].index = widgetIndex;
    }
    // Plasma refuses addWidget on a locked panel. Lock only after every applet
    // has been added, configured, and placed.
    panel.locked = true;
}
