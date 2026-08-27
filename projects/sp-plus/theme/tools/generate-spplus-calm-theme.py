#!/usr/bin/env python3
"""Generate the SP+ Calm Plasma 6 theme's text and SVG assets.

This generator writes only the new theme bundle under theme/sp-plus-calm.
It deliberately does not touch the ISO Containerfile or any build scripts.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1] / "sp-plus-calm"


def write(path: str, text: str):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text.rstrip() + "\n", encoding="utf-8")


def write_json(path: str, data):
    write(path, json.dumps(data, indent=2) + "\n")


def color_scheme(name, display, *, dark):
    if dark:
        bg = "17,20,25"
        alt = "25,29,36"
        button = "30,35,43"
        hover = "42,49,60"
        text = "239,242,246"
        inactive = "170,178,189"
        accent = "255,112,76"
        accent_bright = "255,145,112"
        negative = "255,110,112"
        neutral = "246,190,88"
        positive = "91,205,151"
        visited = "206,163,228"
        wm_inactive_bg = "25,29,36"
    else:
        bg = "246,247,249"
        alt = "235,238,242"
        button = "232,235,240"
        hover = "218,223,230"
        text = "28,32,38"
        inactive = "91,99,110"
        accent = "196,70,46"
        accent_bright = "151,52,37"
        negative = "187,45,49"
        neutral = "150,93,16"
        positive = "26,116,76"
        visited = "105,72,135"
        wm_inactive_bg = "229,232,237"

    def section(section, background_normal, background_alternate, foreground_active=accent_bright):
        return f"""[{section}]\nBackgroundAlternate={background_alternate}\nBackgroundNormal={background_normal}\nDecorationFocus={accent}\nDecorationHover={hover}\nForegroundActive={foreground_active}\nForegroundInactive={inactive}\nForegroundLink={accent_bright}\nForegroundNegative={negative}\nForegroundNeutral={neutral}\nForegroundNormal={text}\nForegroundPositive={positive}\nForegroundVisited={visited}\n"""

    return f"""# SPDX-License-Identifier: CC0-1.0\n# SP+ Calm {display} — generated palette; no upstream artwork or color file is copied.\n\n{section('Colors:Button', button, alt)}\n{section('Colors:Complementary', bg, alt)}\n{section('Colors:Header', bg, alt)}\n{section('Colors:Header][Inactive', wm_inactive_bg, wm_inactive_bg, inactive)}\n{section('Colors:Selection', accent, accent, '255,255,255')}\n{section('Colors:Tooltip', alt, alt)}\n{section('Colors:View', '255,255,255' if not dark else bg, alt)}\n{section('Colors:Window', bg, alt)}\n[General]\nColorScheme={name}\nName=SP+ Calm {display}\nshadeSortColumn=true\n\n[KDE]\ncontrast=4\n\n[WM]\nactiveBackground={bg}\nactiveBlend={hover}\nactiveForeground={text}\ninactiveBackground={wm_inactive_bg}\ninactiveBlend={hover}\ninactiveForeground={inactive}\n"""


# Palette files used by both KDE applications and Plasma's desktop theme.
write("color-schemes/SPPlusCalmDark.colors", color_scheme("SPPlusCalmDark", "Dark", dark=True))
write("color-schemes/SPPlusCalmLight.colors", color_scheme("SPPlusCalmLight", "Light", dark=False))
write("desktoptheme/spplus-calm-dark/colors", color_scheme("SPPlusCalmDark", "Dark", dark=True))
write("desktoptheme/spplus-calm-light/colors", color_scheme("SPPlusCalmLight", "Light", dark=False))

for variant, display, dark in (("dark", "Dark", True), ("light", "Light", False)):
    theme_id = f"org.secureprospective.spplus.calm.{variant}"
    desktop_id = f"spplus-calm-{variant}"
    aurorae_id = f"spplus-calm-{variant}"
    color_id = f"SPPlusCalm{display}"
    widget_style = "Breeze"  # stable native Qt6 style; avoids a fragile third-party QStyle dependency
    icon_theme = "Paper-Mono-Dark"
    write_json(
        f"look-and-feel/{theme_id}/metadata.json",
        {
            "KPackageStructure": "Plasma/LookAndFeel",
            "KPlugin": {
                "Authors": [{"Name": "Secure Prospective", "Email": "design@secureprospective.com"}],
                "Category": "",
                "Description": f"SP+ Calm {display}: a quiet, Windows-familiar Plasma workspace with warm Mars accents.",
                "Id": theme_id,
                "License": "CC0-1.0",
                "Name": f"SP+ Calm ({display})",
                "Version": "1.0.0",
                "Website": "https://secureprospective.com"
            },
            "Keywords": "Desktop;Workspace;Appearance;Look and Feel;SP+;Calm;",
            "X-Plasma-APIVersion": "2",
            "X-Plasma-MainScript": "defaults"
        },
    )
    write(
        f"look-and-feel/{theme_id}/contents/defaults",
        f"""# SP+ Calm {display} Plasma 6 defaults. Keep this package source-of-truth immutable.\n[kdeglobals][General]\nColorScheme={color_id}\nfont=JetBrains Mono,10,-1,5,50,0,0,0,0,0\nmenuFont=JetBrains Mono,10,-1,5,50,0,0,0,0,0\ntoolBarFont=JetBrains Mono,10,-1,5,50,0,0,0,0,0\nactiveFont=JetBrains Mono,10,-1,5,50,0,0,0,0,0\nsmallestReadableFont=JetBrains Mono,9,-1,5,50,0,0,0,0,0\n\n[kdeglobals][Icons]\nTheme={icon_theme}\n\n[kdeglobals][KDE]\nwidgetStyle={widget_style}\n\n[plasmarc][Theme]\nname={desktop_id}\n\n[Wallpaper]\nImage=SPPlus-Calm\n\n[kwinrc][org.kde.kdecoration2]\nlibrary=org.kde.kwin.aurorae\ntheme=__aurorae__svg__{aurorae_id}\n\n[kcminputrc][Mouse]\ncursorTheme=breeze_cursors\n\n[ksplashrc][KSplash]\nTheme=none\n""",
    )
    write(f"look-and-feel/{theme_id}/contents/layouts/defaults", "[org.kde.plasma.desktop]\n")
    write(f"look-and-feel/{theme_id}/contents/layouts/org.kde.plasma.desktop-layout.js", f"""// SP+ Calm {display} layout. Native Plasma widgets only; no forked applets.\n// Re-apply the theme after changing monitor topology so each screen receives a panel.\nvar oldPanels = panels();\nfor (var i = oldPanels.length - 1; i >= 0; --i) oldPanels[i].remove();\nfor (var screen = 0; screen < screenCount; ++screen) {{\n    var panel = new Panel;\n    panel.screen = screen;\n    panel.location = \"bottom\";\n    panel.height = 48;\n    panel.alignment = \"center\";\n    panel.hiding = \"none\";\n    panel.lengthMode = \"fill\";\n    panel.opacity = \"opaque\";\n\n    var start = panel.addWidget(\"org.kde.plasma.kickoff\");\n    start.currentConfigGroup = [\"General\"];\n    start.writeConfig(\"icon\", \"start-here\");\n\n    var tasks = panel.addWidget(\"org.kde.plasma.icontasks\");\n    tasks.currentConfigGroup = [\"General\"];\n    tasks.writeConfig(\"showOnlyCurrentScreen\", \"false\");\n    tasks.writeConfig(\"showOnlyCurrentDesktop\", \"false\");\n    tasks.writeConfig(\"groupingStrategy\", \"1\");\n\n    var spacer = panel.addWidget(\"org.kde.plasma.panelspacer\");\n    var tray = panel.addWidget(\"org.kde.plasma.systemtray\");\n    var clock = panel.addWidget(\"org.kde.plasma.digitalclock\");\n    clock.currentConfigGroup = [\"Appearance\"];\n    clock.writeConfig(\"showDate\", \"true\");\n    clock.writeConfig(\"dateDisplayFormat\", \"2\");\n    clock.writeConfig(\"showSeconds\", \"0\");\n    var desktop = panel.addWidget(\"org.kde.plasma.showdesktop\");\n\n    start.index = 0; tasks.index = 1; spacer.index = 2; tray.index = 3;\n    clock.index = 4; desktop.index = 5;\n}}\n""")
    write(f"look-and-feel/{theme_id}/contents/previews/README.txt", "Preview assets are generated from the SP+ logo wallpaper during packaging.\n")
    write_json(
        f"desktoptheme/{desktop_id}/metadata.json",
        {
            "KPlugin": {
                "Id": desktop_id,
                "Name": f"SP+ Calm {display}",
                "Description": f"SP+ Calm {display} Plasma style colors.",
                "License": "CC0-1.0",
                "Version": "1.0.0",
                "EnabledByDefault": True
            },
            "X-Plasma-API": "5.0"
        },
    )
    write(
        f"desktoptheme/{desktop_id}/plasmarc",
        f"""# Plasma 6 desktop-theme config. SVG widgets inherit safely from Breeze.\n[Wallpaper]\ndefaultWallpaperTheme=SPPlus-Calm\ndefaultFileSuffix=.png\ndefaultWidth=7680\ndefaultHeight=4320\n\n[AdaptiveTransparency]\nenabled=false\n\n[ContrastEffect]\nenabled=false\ncontrast=0.2\nintensity=0.4\nsaturation=1.0\n""",
    )

# GTK bridge: the theme does not bundle a separate GTK widget theme, but keeps
# the font, icon, and dark/light preference coherent for Brave and other GTK apps.
for variant, dark in (("dark", True), ("light", False)):
    gtk_prefer_dark = "1" if dark else "0"
    write(f"system-defaults/gtk-3.0/settings-{variant}.ini", f"""[Settings]\ngtk-font-name=JetBrains Mono 10\ngtk-icon-theme-name=Paper-Mono-Dark\ngtk-theme-name=Adwaita{ '-dark' if dark else '' }\ngtk-application-prefer-dark-theme={gtk_prefer_dark}\n""")
    write(f"system-defaults/gtk-4.0/settings-{variant}.ini", f"""[Settings]\ngtk-font-name=JetBrains Mono 10\ngtk-icon-theme-name=Paper-Mono-Dark\ngtk-theme-name=Adwaita{ '-dark' if dark else '' }\ngtk-application-prefer-dark-theme={gtk_prefer_dark}\n""")

write("system-defaults/kdeglobals-dark", """# Thin bootstrap only. The Global Theme contents/defaults is authoritative.\n[General]\nColorScheme=SPPlusCalmDark\nfont=JetBrains Mono,10,-1,5,50,0,0,0,0,0\nmenuFont=JetBrains Mono,10,-1,5,50,0,0,0,0,0\ntoolBarFont=JetBrains Mono,10,-1,5,50,0,0,0,0,0\nactiveFont=JetBrains Mono,10,-1,5,50,0,0,0,0,0\nsmallestReadableFont=JetBrains Mono,9,-1,5,50,0,0,0,0,0\n[Icons]\nTheme=Paper-Mono-Dark\n[KDE]\nwidgetStyle=Breeze\n""")
write("system-defaults/kdeglobals-light", """# Thin bootstrap only. The Global Theme contents/defaults is authoritative.\n[General]\nColorScheme=SPPlusCalmLight\nfont=JetBrains Mono,10,-1,5,50,0,0,0,0,0\nmenuFont=JetBrains Mono,10,-1,5,50,0,0,0,0,0\ntoolBarFont=JetBrains Mono,10,-1,5,50,0,0,0,0,0\nactiveFont=JetBrains Mono,10,-1,5,50,0,0,0,0,0\nsmallestReadableFont=JetBrains Mono,9,-1,5,50,0,0,0,0,0\n[Icons]\nTheme=Paper-Mono-Dark\n[KDE]\nwidgetStyle=Breeze\n""")

write("INSTALL-MANIFEST.md", """# SP+ Calm theme bundle\n\nThis directory is a **theme-only lane**. It intentionally does not edit or invoke the\nSP+ ISO build. The eventual image integration should copy the directories below to the\nmatching system locations, then run the semantic gate in `../tools/validate-spplus-calm.sh`.\n\n| Bundle path | Destination |\n|---|---|\n| `look-and-feel/*` | `/usr/share/plasma/look-and-feel/` |\n| `desktoptheme/*` | `/usr/share/plasma/desktoptheme/` |\n| `color-schemes/*.colors` | `/usr/share/color-schemes/` |\n| `aurorae/*` | `/usr/share/aurorae/themes/` |\n| `wallpapers/SPPlus-Calm` | `/usr/share/wallpapers/SPPlus-Calm/` |\n| `system-defaults/*` | image integration chooses `/etc/xdg` and GTK bridge locations |\n\n## Runtime dependencies\n\n- `paper-icon-theme` — provides `Paper-Mono-Dark`\n- `jetbrains-mono-fonts` — provides the `JetBrains Mono` family\n- Plasma 6 / KF6 KPackage\n- native Breeze Qt style (deliberate fallback; no fragile third-party widget fork)\n\nThe bundle uses `metadata.json` and Plasma 6 package IDs. It does not ship a custom\nlock-screen QML or forked applets: both are update-sensitive and are intentionally left\nto the installed Plasma version.\n""")

write("DESIGN.md", """# SP+ Calm design contract\n\n- **Surface:** graphite light mode and near-black dark mode; no pure white panels in dark mode.\n- **Accent:** restrained Mars coral (`#ff704c` dark / `#c4462e` light), with glow only in the active window edge and hover state.\n- **Type:** JetBrains Mono throughout KDE and GTK bridges.\n- **Windows:** Aurorae uses a quiet 36px title bar, 1px active accent line, and high-contrast controls.\n- **Menus:** native Kickoff, native task manager, native system tray; no patched shell components.\n- **Icons:** `Paper-Mono-Dark`, explicitly selected in both light and dark variants as requested.\n- **Wallpaper:** one logo-only SP+ composition, no text, no scenery, no third-party artwork.\n- **Safety:** missing optional SVG widget assets fall back to Breeze; no custom lockscreen QML; no Plasma 5 metadata contract.\n""")

# Generate a compact file list for the validator and future integration review.
write("FILES.txt", "Generated SP+ Calm bundle. Run ../tools/validate-spplus-calm.sh from the theme directory.\n")

# Aurorae assets are generated from scratch: no upstream SVG is vendored.

def aurorae_decoration(dark: bool) -> str:
    body = "#111419" if dark else "#f6f7f9"
    border = "#ff704c" if dark else "#c4462e"
    inactive = "#252a32" if dark else "#e5e8ed"
    inactive_border = "#4b5563" if dark else "#aeb7c3"
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="5" height="5" viewBox="0 0 5 5">
<style>.ColorScheme-Background{{color:{body};}}.active-border{{fill:{border};}}.inactive-border{{fill:{inactive_border};}}</style>
<g id="decoration-topleft"><rect class="ColorScheme-Background" fill="currentColor" width="2" height="2"/><rect class="active-border" width="2" height="1"/><rect class="active-border" width="1" height="2"/></g>
<g id="decoration-top"><rect class="ColorScheme-Background" fill="currentColor" width="1" height="1"/><rect class="active-border" width="1" height="1"/></g>
<g id="decoration-topright"><rect class="ColorScheme-Background" fill="currentColor" width="2" height="2"/><rect class="active-border" x="1" width="1" height="2"/><rect class="active-border" width="2" height="1"/></g>
<g id="decoration-left"><rect class="ColorScheme-Background" fill="currentColor" width="1" height="1"/><rect class="active-border" width="1" height="1"/></g>
<g id="decoration-right"><rect class="ColorScheme-Background" fill="currentColor" width="1" height="1"/><rect class="active-border" width="1" height="1"/></g>
<g id="decoration-bottomleft"><rect class="ColorScheme-Background" fill="currentColor" width="2" height="2"/><rect class="active-border" y="1" width="2" height="1"/><rect class="active-border" width="1" height="2"/></g>
<g id="decoration-bottom"><rect class="ColorScheme-Background" fill="currentColor" width="1" height="1"/><rect class="active-border" width="1" height="1"/></g>
<g id="decoration-bottomright"><rect class="ColorScheme-Background" fill="currentColor" width="2" height="2"/><rect class="active-border" x="1" width="1" height="2"/><rect class="active-border" y="1" width="2" height="1"/></g>
<rect id="decoration-center" class="ColorScheme-Background" fill="currentColor" width="1" height="1"/>
<g id="decoration-inactive-topleft"><rect fill="{inactive}" width="2" height="2"/><rect class="inactive-border" width="2" height="1"/><rect class="inactive-border" width="1" height="2"/></g>
<g id="decoration-inactive-top"><rect fill="{inactive}" width="1" height="1"/><rect class="inactive-border" width="1" height="1"/></g>
<g id="decoration-inactive-topright"><rect fill="{inactive}" width="2" height="2"/><rect class="inactive-border" x="1" width="1" height="2"/><rect class="inactive-border" width="2" height="1"/></g>
<g id="decoration-inactive-left"><rect fill="{inactive}" width="1" height="1"/><rect class="inactive-border" width="1" height="1"/></g>
<g id="decoration-inactive-right"><rect fill="{inactive}" width="1" height="1"/><rect class="inactive-border" width="1" height="1"/></g>
<g id="decoration-inactive-bottomleft"><rect fill="{inactive}" width="2" height="2"/><rect class="inactive-border" y="1" width="2" height="1"/><rect class="inactive-border" width="1" height="2"/></g>
<g id="decoration-inactive-bottom"><rect fill="{inactive}" width="1" height="1"/><rect class="inactive-border" width="1" height="1"/></g>
<g id="decoration-inactive-bottomright"><rect fill="{inactive}" width="2" height="2"/><rect class="inactive-border" x="1" width="1" height="2"/><rect class="inactive-border" y="1" width="2" height="1"/></g>
<rect id="decoration-inactive-center" fill="{inactive}" width="1" height="1"/>
</svg>'''


def aurorae_button(kind: str, dark: bool) -> str:
    fg = "#edf1f5" if dark else "#1c2026"
    hover = "#ff704c" if dark else "#c4462e"
    if kind == "close":
        path = '<path d="M18 9l5 5 5-5 2 2-5 5 5 5-2 2-5-5-5 5-2-2 5-5-5-5z"/>'
    elif kind == "minimize":
        path = '<path d="M16 19h14v2H16z"/>'
    elif kind == "maximize":
        path = '<path d="M16 9h14v14H16zm2 2v10h10V11z" fill-rule="evenodd"/>'
    elif kind == "restore":
        path = '<path d="M18 10h12v12H18zm-4 4h2v10h10v2H14z" fill-rule="evenodd"/>'
    elif kind == "help":
        path = '<path d="M23 9a6 6 0 0 1 3.7 10.7c-.8.6-1.7 1.3-1.7 2.3h-4c0-2.4 1.2-3.4 2.4-4.3A2.7 2.7 0 0 0 23 13a2.8 2.8 0 0 0-2.8 2.8h-4A6.8 6.8 0 0 1 23 9zm-2 16h4v4h-4z"/>'
    elif kind == "keepabove":
        path = '<path d="M23 8l8 8-2 2-6-6-6 6-2-2z"/>'
    elif kind == "keepbelow":
        path = '<path d="M15 12l8 8 8-8 2 2-10 10-10-10z"/>'
    elif kind == "shade":
        path = '<path d="M15 13h16v3H15zm0 6h16v3H15z"/>'
    elif kind == "alldesktops":
        path = '<path d="M15 10h7v7h-7zm9 0h7v7h-7zm-9 9h7v7h-7zm9 0h7v7h-7z"/>'
    else:  # excludefromcapture
        path = '<path d="M15 12a8 8 0 0 1 13 1l2-2 2 2-16 16-2-2 2-2a8 8 0 0 1-3-13l2 2a5 5 0 0 0 3 8l2-2a3 3 0 0 1-4-4l2-2a3 3 0 0 1 4 4l2-2a5 5 0 0 0-7-7z"/>'
    groups = []
    for state, fill, opacity, bg in (("active", fg, "1", "none"), ("inactive", fg, ".65", "none"), ("hover", "#ffffff", "1", hover), ("pressed", "#ffffff", "1", "#9d3d2a"), ("hover-inactive", "#ffffff", ".8", hover), ("pressed-inactive", "#ffffff", ".8", "#9d3d2a"), ("deactivated", fg, ".3", "none"), ("deactivated-inactive", fg, ".22", "none")):
        rect = '' if bg == 'none' else f'<rect x="1" y="1" width="44" height="28" rx="7" fill="{bg}"/>'
        groups.append(f'<g id="{state}-center">{rect}<g fill="{fill}" opacity="{opacity}">{path}</g></g>')
    return '<svg xmlns="http://www.w3.org/2000/svg" width="46" height="30" viewBox="0 0 46 30">' + ''.join(groups) + '</svg>'


for variant, display, dark in (("dark", "Dark", True), ("light", "Light", False)):
    dirname = f"spplus-calm-{variant}"
    target = f"aurorae/{dirname}"
    write_json(f"{target}/metadata.json", {"KPlugin": {"Id": dirname, "Name": f"SP+ Calm {display} Windows", "Description": f"SP+ Calm {display} Aurorae window decoration.", "License": "CC0-1.0", "Version": "1.0.0"}})
    write(f"{target}/metadata.desktop", f"""[Desktop Entry]\nType=Service\nName=SP+ Calm {display} Windows\nComment=Quiet Aurorae decoration with a warm active edge.\nX-KDE-PluginInfo-Name={dirname}\nX-KDE-PluginInfo-Version=1.0.0\nX-KDE-PluginInfo-License=CC0-1.0\nX-KDE-PluginInfo-Category=Aurorae Themes\n""")
    write(f"{target}/spplus-calm-{variant}.auroraerc", f"""[General]\nActiveTextColor={255 if dark else 28},{255 if dark else 32},{255 if dark else 38},255\nInactiveTextColor={237 if dark else 70},{241 if dark else 76},{245 if dark else 84},180\nTitleAlignment=Left\nTitleVerticalAlignment=Center\nAnimation=0\nShadow=false\n\n[Layout]\nBorderTop=1\nBorderBottom=1\nBorderLeft=1\nBorderRight=1\nTitleEdgeTop=0\nTitleEdgeBottom=0\nTitleEdgeLeft=12\nTitleEdgeRight=0\nTitleBorderLeft=12\nTitleBorderRight=0\nTitleHeight=36\nTitleHeightMaximized=36\nTitleEdgeTopMaximized=0\nTitleEdgeBottomMaximized=0\nTitleEdgeLeftMaximized=12\nTitleEdgeRightMaximized=0\nButtonWidth=46\nButtonWidthMenu=18\nButtonWidthClose=46\nButtonWidthMaximizeRestore=46\nButtonWidthMinimize=46\nButtonWidthAllDesktops=30\nButtonWidthKeepAbove=30\nButtonWidthKeepBelow=30\nButtonWidthShade=30\nButtonWidthHelp=30\nButtonWidthExcludeFromCapture=30\nButtonHeight=36\nButtonSpacing=0\nButtonMarginTop=0\nExplicitButtonSpacer=10\nPaddingTop=0\nPaddingBottom=0\nPaddingRight=0\nPaddingLeft=0\n""")
    write(f"{target}/decoration.svg", aurorae_decoration(dark))
    for kind in ("alldesktops", "close", "excludefromcapture", "help", "keepabove", "keepbelow", "maximize", "minimize", "restore", "shade"):
        write(f"{target}/{kind}.svg", aurorae_button(kind, dark))

print(f"generated {ROOT}")
