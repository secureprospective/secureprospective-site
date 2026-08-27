// SP+ Calm Dark layout. Native Plasma widgets only; no forked applets.
// Re-apply the theme after changing monitor topology so each screen receives a panel.
var oldPanels = panels();
for (var i = oldPanels.length - 1; i >= 0; --i) oldPanels[i].remove();
for (var screen = 0; screen < screenCount; ++screen) {
    var panel = new Panel;
    panel.screen = screen;
    panel.location = "bottom";
    panel.height = 48;
    panel.alignment = "center";
    panel.hiding = "none";
    panel.lengthMode = "fill";
    panel.opacity = "opaque";

    var start = panel.addWidget("org.kde.plasma.kickoff");
    start.currentConfigGroup = ["General"];
    start.writeConfig("icon", "start-here");

    var tasks = panel.addWidget("org.kde.plasma.icontasks");
    tasks.currentConfigGroup = ["General"];
    tasks.writeConfig("showOnlyCurrentScreen", "false");
    tasks.writeConfig("showOnlyCurrentDesktop", "false");
    tasks.writeConfig("groupingStrategy", "1");

    var spacer = panel.addWidget("org.kde.plasma.panelspacer");
    var tray = panel.addWidget("org.kde.plasma.systemtray");
    var clock = panel.addWidget("org.kde.plasma.digitalclock");
    clock.currentConfigGroup = ["Appearance"];
    clock.writeConfig("showDate", "true");
    clock.writeConfig("dateDisplayFormat", "2");
    clock.writeConfig("showSeconds", "0");
    var desktop = panel.addWidget("org.kde.plasma.showdesktop");

    start.index = 0; tasks.index = 1; spacer.index = 2; tray.index = 3;
    clock.index = 4; desktop.index = 5;
}
