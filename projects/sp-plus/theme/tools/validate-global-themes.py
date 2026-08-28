#!/usr/bin/env python3
"""Gate every shipped global theme for COMPLETENESS and for dangling references.

Cycle35 shipped a global theme that was named but never applied, because the only
checks asserted that files existed. This asserts behaviour instead:

  1. Every look-and-feel package we ship declares ALL component keys. A package
     missing one leaves that component unchanged on switch, which is the
     partial-switch defect the advisor sees.
  2. Every value resolves to an asset that is actually present. Upstream themes
     routinely name icon themes and cursors they do not ship.
  3. No package names the Plasma 5 decoration plugin. `org.kde.kwin.aurorae`
     without the `.v2` suffix silently fails on Plasma 6.7.
  4. Package Id matches its directory name, or Plasma cannot resolve it.

Run against the built image root, or a staging tree, with --root.
"""
import argparse, json, sys
from pathlib import Path

REQUIRED = {
    ("kdeglobals", "General", "ColorScheme"),
    ("kdeglobals", "General", "font"),
    ("kdeglobals", "Icons", "Theme"),
    ("kdeglobals", "KDE", "widgetStyle"),
    ("kcminputrc", "Mouse", "cursorTheme"),
    ("plasmarc", "Theme", "name"),
    ("kwinrc", "org.kde.kdecoration2", "library"),
    ("kwinrc", "org.kde.kdecoration2", "theme"),
}

# Themes SP+ ships and offers in Welcome. Stock Plasma/Fedora themes are
# validated too: they are part of the shipped set, not exempt from it.
STOCK = {"org.kde.breeze.desktop", "org.kde.breezedark.desktop"}

SHIPPED = [
    "org.secureprospective.spplus.windows11.light",
    "org.secureprospective.spplus.windows11.dark",
    "org.kde.breezedark.desktop",
    "Nordic",
    "Catppuccin-Mocha",
    "org.kde.breeze.desktop",
    "com.github.vinceliuice.Orchis",
    "Catppuccin-Latte",
]


def parse_defaults(path):
    out, cur_file, cur_group = {}, "kdeglobals", None
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("["):
            parts = line.strip("[]").split("][")
            cur_file, cur_group = (parts if len(parts) == 2
                                   else ("kdeglobals", parts[0]))
            continue
        if "=" in line and cur_group:
            k, v = line.split("=", 1)
            out[(cur_file, cur_group, k.strip())] = v.strip()
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="/", help="image root to validate")
    args = ap.parse_args()
    root = Path(args.root)

    share = root / "usr/share"
    lnf_dirs = [share / "plasma/look-and-feel"]
    errors, checked = [], 0

    def exists_any(*rel):
        return any((share / r).exists() for r in rel)

    for theme_id in SHIPPED:
        pkg = None
        for d in lnf_dirs:
            if (d / theme_id / "contents" / "defaults").is_file():
                pkg = d / theme_id
                break
        if pkg is None:
            errors.append(f"{theme_id}: look-and-feel package not installed")
            continue
        checked += 1

        meta = pkg / "metadata.json"
        if meta.is_file():
            got = json.loads(meta.read_text()).get("KPlugin", {}).get("Id")
            if got != theme_id:
                errors.append(f"{theme_id}: metadata Id is {got!r}; Plasma "
                              f"resolves by Id and will not find this theme")
        else:
            errors.append(f"{theme_id}: no metadata.json (Plasma 5 package?)")

        d = parse_defaults(pkg / "contents" / "defaults")

        # Stock upstream packages do not declare fonts; spplus-apply-theme
        # supplies the SP+ type system for them. Everything we author or vendor
        # must declare every key itself.
        required = set(REQUIRED)
        if theme_id in STOCK:
            required.discard(("kdeglobals", "General", "font"))

        for req in sorted(required):
            if req not in d:
                errors.append(f"{theme_id}: missing {req[0]}:{req[1]}:{req[2]} "
                              f"-- that component will not change on switch")

        lib = d.get(("kwinrc", "org.kde.kdecoration2", "library"), "")
        if lib == "org.kde.kwin.aurorae":
            errors.append(f"{theme_id}: decoration library is the Plasma 5 "
                          f"plugin; Plasma 6.7 needs org.kde.kwin.aurorae.v2")

        # Dangling reference checks.
        scheme = d.get(("kdeglobals", "General", "ColorScheme"))
        if scheme and not exists_any(f"color-schemes/{scheme}.colors"):
            errors.append(f"{theme_id}: colour scheme {scheme!r} not installed")

        icons = d.get(("kdeglobals", "Icons", "Theme"))
        if icons and not exists_any(f"icons/{icons}"):
            errors.append(f"{theme_id}: icon theme {icons!r} not installed")

        cursor = d.get(("kcminputrc", "Mouse", "cursorTheme"))
        if cursor and not exists_any(f"icons/{cursor}"):
            errors.append(f"{theme_id}: cursor theme {cursor!r} not installed")

        plasma = d.get(("plasmarc", "Theme", "name"))
        if plasma and plasma != "default" and not exists_any(
                f"plasma/desktoptheme/{plasma}"):
            errors.append(f"{theme_id}: plasma theme {plasma!r} not installed")

        deco = d.get(("kwinrc", "org.kde.kdecoration2", "theme"), "")
        if deco.startswith("__aurorae__svg__"):
            name = deco[len("__aurorae__svg__"):]
            if not exists_any(f"aurorae/themes/{name}"):
                errors.append(f"{theme_id}: aurorae decoration {name!r} "
                              f"not installed")

    for e in errors:
        print(f"FAIL {e}", file=sys.stderr)
    print(f"\nSPPLUS_GLOBAL_THEME_GATE themes={checked}/{len(SHIPPED)} "
          f"errors={len(errors)}")
    return 1 if errors or checked != len(SHIPPED) else 0


sys.exit(main())
