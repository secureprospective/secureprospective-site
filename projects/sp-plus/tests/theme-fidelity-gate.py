#!/usr/bin/env python3
"""Read the whole applied theme back off the live session.

Every check here reads the declaration from the theme package and the result
from the running desktop's own config, so a helper that writes the wrong value,
or writes nothing, fails. Nothing is taken on the helper's word.
"""
import os
import hashlib
import re
import subprocess
import sys
from pathlib import Path

LNF = Path("/usr/share/plasma/look-and-feel")
OVERRIDES = Path("/usr/share/sp-plus/theme/wallpaper-overrides.conf")
TEMPLATES = Path("/usr/share/plasma/layout-templates")
STOCK_PANEL = TEMPLATES / "org.kde.plasma.desktop.defaultPanel/contents/layout.js"


def strip_comments(text):
    return "\n".join(line for line in
                     (re.sub(r"//.*$", "", raw).rstrip() for raw in text.splitlines())
                     if line.strip())
CONFIG = Path(os.environ.get("XDG_CONFIG_HOME", Path.home() / ".config"))
APPLETSRC = CONFIG / "plasma-org.kde.plasma.desktop-appletsrc"
APPLY = "/usr/libexec/spplus-apply-theme"

# Cursor and splash are declared in the package but are read by their own
# components at login, not written into the live session by an apply, so they
# are reported rather than failed. Everything else must be live immediately.
DEFERRED = {("kcminputrc", "Mouse", "cursorTheme"), ("ksplashrc", "KSplash", "Theme")}


def parse_defaults(path):
    """[file][group] sections, plus the bare [Wallpaper] section."""
    out, section = [], None
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("["):
            parts = re.findall(r"\[([^\]]*)\]", line)
            section = tuple(parts)
            continue
        if section is None or "=" not in line:
            continue
        key, _, value = line.partition("=")
        out.append((section, key.strip(), value.strip()))
    return out


def wallpaper_override(theme):
    if not OVERRIDES.is_file():
        return None
    current = None
    for raw in OVERRIDES.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("[") and line.endswith("]"):
            current = line[1:-1]
        elif current == theme and line.startswith("Image="):
            return line.split("=", 1)[1].strip()
    return None


def kread(config_file, group, key):
    cmd = ["kreadconfig6", "--file", config_file]
    for part in group.split("]["):
        cmd += ["--group", part]
    cmd += ["--key", key]
    done = subprocess.run(cmd, capture_output=True, text=True)
    return done.stdout.strip()


def live_wallpaper():
    value = ""
    for line in APPLETSRC.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.startswith("Image="):
            value = line.split("=", 1)[1].strip()
    return value.rstrip("/").rsplit("/", 1)[-1]


def layout_source(theme):
    """The script Plasma will run to build this theme's panel, and its identity.

    Two themes whose scripts are the same code must end up with the same task
    bar, and two whose scripts differ must not. That is the whole assertion:
    deciding which widgets a script produces would mean running it, and a gate
    that re-implements the thing it is testing proves nothing. Comments are
    stripped before hashing because the two Windows layouts are deliberate
    copies of one another that differ only in their header note.
    """
    layouts = LNF / theme / "contents/layouts"
    scripts = sorted(layouts.glob("*.js")) if layouts.is_dir() else []
    script = scripts[0] if scripts else STOCK_PANEL
    for _ in range(4):
        code = strip_comments(script.read_text(encoding="utf-8", errors="replace"))
        # Breeze does not describe a panel; it calls loadTemplate and lets the
        # stock one build it. Follow that the way Plasma does, or Breeze looks
        # like a distinct layout that suspiciously produces the stock task bar.
        if "addWidget" in code or "loadSerializedLayout" in code:
            break
        delegated = re.search(r'loadTemplate\(\s*"([^"]+)"', code)
        if not delegated:
            break
        target = TEMPLATES / delegated.group(1) / "contents/layout.js"
        if not target.is_file():
            break
        script = target
    return script, hashlib.sha256(code.encode()).hexdigest()[:12]


def live_panel():
    """Applet plugins in the panel containment, in the order the panel shows."""
    text = APPLETSRC.read_text(encoding="utf-8", errors="replace")
    containments, group = {}, None
    order = {}
    for raw in text.splitlines():
        line = raw.strip()
        if line.startswith("["):
            group = line
            continue
        if "=" not in line or group is None:
            continue
        key, value = (part.strip() for part in line.split("=", 1))
        top = re.fullmatch(r"\[Containments\]\[(\d+)\]", group)
        applet = re.fullmatch(r"\[Containments\]\[(\d+)\]\[Applets\]\[(\d+)\]", group)
        general = re.fullmatch(r"\[Containments\]\[(\d+)\]\[General\]", group)
        if top and key == "plugin":
            containments.setdefault(top.group(1), {})["plugin"] = value
        elif applet and key == "plugin":
            containments.setdefault(applet.group(1), {}).setdefault(
                "applets", {})[applet.group(2)] = value
        elif general and key == "AppletOrder":
            order[general.group(1)] = value.split(";")
    for cid, data in containments.items():
        if data.get("plugin") == "org.kde.panel":
            applets = data.get("applets", {})
            ids = order.get(cid) or sorted(applets, key=int)
            return [applets[i] for i in ids if i in applets]
    return []


def main():
    themes = os.environ["SPPLUS_THEMES"].split()
    failures, deferred_notes, panels = [], [], {}
    for theme in themes:
        defaults = LNF / theme / "contents/defaults"
        if not defaults.is_file():
            failures.append(f"{theme}: no defaults file in the package")
            continue
        print(f"\n=== {theme}")
        done = subprocess.run([APPLY, theme, "--layout"], capture_output=True, text=True)
        if done.returncode != 0:
            tail = (done.stderr or done.stdout or "").strip().splitlines()[-3:]
            failures.append(f"{theme}: apply exited {done.returncode}: {' | '.join(tail)}")
            print(f"  FAIL apply exited {done.returncode}")
            continue

        for section, key, want in parse_defaults(defaults):
            if section == ("Wallpaper",):
                continue
            if len(section) != 2:
                continue
            config_file, group = section
            got = kread(config_file, group, key)
            label = f"{config_file}/{group}/{key}"
            if got == want:
                print(f"  PASS {label} = {got}")
            elif (config_file, group, key) in DEFERRED:
                print(f"  NOTE {label} wants {want!r}, session has {got!r} (applied at next sign-in)")
                deferred_notes.append(f"{theme}: {label}")
            else:
                print(f"  FAIL {label} wants {want!r}, got {got!r}")
                failures.append(f"{theme}: {label} wants {want!r}, got {got!r}")

        want_paper = wallpaper_override(theme)
        if want_paper is None:
            declared = [v for s, k, v in parse_defaults(defaults)
                        if s == ("Wallpaper",) and k == "Image"]
            want_paper = declared[0] if declared else None
        if want_paper:
            got_paper = live_wallpaper()
            if got_paper == want_paper:
                print(f"  PASS wallpaper = {got_paper}")
            else:
                print(f"  FAIL wallpaper wants {want_paper!r}, got {got_paper!r}")
                failures.append(f"{theme}: wallpaper wants {want_paper!r}, got {got_paper!r}")

        script, source_id = layout_source(theme)
        panel = live_panel()
        if not panel:
            print("  FAIL task bar: no panel containment on the session")
            failures.append(f"{theme}: no panel containment after apply")
        else:
            print(f"  read task bar from {script.name} [{source_id}]: {len(panel)} widgets")
            panels[theme] = (source_id, tuple(panel))

    # The task bar assertion. Themes built by the same layout script must land
    # on the same panel, and themes built by different scripts must not. A task
    # bar that stays behind on the previous theme collides across sources and
    # fails here, which is exactly the symptom worth catching.
    print("\n=== task bars")
    by_source = {}
    for theme, (source_id, widgets) in panels.items():
        by_source.setdefault(source_id, []).append((theme, widgets))
    for source_id, members in by_source.items():
        shapes = {widgets for _, widgets in members}
        names = ", ".join(theme for theme, _ in members)
        if len(shapes) == 1:
            print(f"  PASS [{source_id}] same panel for: {names}")
        else:
            print(f"  FAIL [{source_id}] one layout script, {len(shapes)} different panels: {names}")
            failures.append(f"layout {source_id} produced {len(shapes)} different task bars")
    seen = {}
    for source_id, members in by_source.items():
        shape = members[0][1]
        if shape in seen:
            print(f"  FAIL [{source_id}] task bar is identical to [{seen[shape]}] "
                  f"despite a different layout script -- the panel did not change")
            failures.append(f"layout {source_id} left the task bar from {seen[shape]} in place")
        else:
            seen[shape] = source_id
    for source_id, members in by_source.items():
        print(f"  [{source_id}] {list(members[0][1])}")

    print()
    for note in deferred_notes:
        print(f"deferred to next sign-in: {note}")
    if failures:
        print(f"\nTHEME_FIDELITY_FAILED {len(failures)} problem(s):")
        for line in failures:
            print(f"  - {line}")
        return 1
    print(f"\nTHEME_FIDELITY_OK {len(themes)} themes, every declared component read back")
    return 0


if __name__ == "__main__":
    sys.exit(main())
