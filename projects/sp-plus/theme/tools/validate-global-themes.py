#!/usr/bin/env python3
"""Validate every global theme and every declared theme asset.

Run against the assembled image (or a staging tree) with ``--root``.  This is a
build gate, not a live-session test: it proves that package declarations resolve
to installed files and that Aurorae packages contain their complete runtime
payload.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlparse


REQUIRED = {
    ("kdeglobals", "General", "ColorScheme"),
    ("kdeglobals", "Icons", "Theme"),
    ("kdeglobals", "KDE", "widgetStyle"),
    ("kcminputrc", "Mouse", "cursorTheme"),
    ("plasmarc", "Theme", "name"),
    ("kwinrc", "org.kde.kdecoration2", "library"),
    ("kwinrc", "org.kde.kdecoration2", "theme"),
}

# Stock Plasma packages intentionally omit the SP+ font policy.  The runtime
# helper fills only those silent keys; all other components must be declared by
# the package itself.
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
SECTION_RE = re.compile(r"^\[([^\]]+)\](?:\[([^\]]+)\])?$")


def parse_defaults(path: Path) -> dict[tuple[str, str, str], str]:
    result: dict[tuple[str, str, str], str] = {}
    current_file = "kdeglobals"
    current_group: str | None = None
    for number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw.strip()
        if number == 1:
            line = line.lstrip("\ufeff")
        if not line or line.startswith("#") or line.startswith(";"):
            continue
        section = SECTION_RE.fullmatch(line)
        if section:
            first, second = section.groups()
            current_file = first if second is not None else "kdeglobals"
            current_group = second if second is not None else first
            pure = PurePosixPath(current_file)
            if pure.is_absolute() or ".." in pure.parts:
                raise ValueError(f"unsafe config file {current_file!r} at line {number}")
            continue
        if current_group is None or "=" not in line:
            raise ValueError(f"malformed line {number}: {raw!r}")
        key, value = line.split("=", 1)
        identity = (current_file, current_group, key.strip())
        if not identity[2] or identity in result:
            raise ValueError(f"invalid or duplicate key at line {number}: {identity!r}")
        result[identity] = value.strip()
    if not result:
        raise ValueError(f"no settings in {path}")
    return result


def resolve_named_asset(root: Path, category: str, value: str) -> Path | None:
    parsed = urlparse(value.strip())
    raw = unquote(parsed.path) if parsed.scheme == "file" else value.strip()
    if not raw:
        return None
    path = Path(raw)
    if path.is_absolute():
        candidates = [root / path.relative_to("/"), path]
    else:
        subdir = {
            "color": "color-schemes",
            "icons": "icons",
            "cursor": "icons",
            "plasma": "plasma/desktoptheme",
            "wallpaper": "wallpapers",
            "aurorae": "aurorae/themes",
        }[category]
        suffix = ".colors" if category == "color" and not raw.endswith(".colors") else ""
        candidates = [root / "usr/share" / subdir / (raw + suffix)]
    return next((candidate for candidate in candidates if candidate.exists()), None)


def check_asset(errors: list[str], theme_id: str, label: str, actual: Path | None) -> None:
    if actual is None:
        errors.append(f"{theme_id}: missing declared {label} asset")


def check_breeze_plugin(root: Path, errors: list[str], theme_id: str) -> None:
    candidates = [
        root / "usr/lib64/qt6/plugins/org.kde.kdecoration3/org.kde.breeze.so",
        root / "usr/lib/qt6/plugins/org.kde.kdecoration3/org.kde.breeze.so",
    ]
    if not any(path.is_file() for path in candidates):
        errors.append(f"{theme_id}: org.kde.breeze decoration plugin is not installed")


def check_aurorae(root: Path, errors: list[str], theme_id: str, declaration: str) -> None:
    name = declaration.removeprefix("__aurorae__svg__")
    directory = resolve_named_asset(root, "aurorae", name)
    check_asset(errors, theme_id, f"Aurorae directory {name!r}", directory if directory and directory.is_dir() else None)
    if directory is None or not directory.is_dir():
        return
    svg = any((directory / filename).is_file() for filename in ("decoration.svg", "decoration.svgz"))
    rc = directory / f"{name}rc"
    if not svg:
        errors.append(f"{theme_id}: Aurorae {name!r} has no decoration.svg/.svgz payload")
    if not rc.is_file():
        errors.append(f"{theme_id}: Aurorae {name!r} has no {name}rc configuration")


def check_theme(root: Path, errors: list[str], theme_id: str, stock: bool) -> bool:
    package = root / "usr/share/plasma/look-and-feel" / theme_id
    defaults = package / "contents/defaults"
    if not defaults.is_file():
        errors.append(f"{theme_id}: look-and-feel package/defaults not installed")
        return False
    metadata = package / "metadata.json"
    if not metadata.is_file():
        errors.append(f"{theme_id}: metadata.json missing")
    else:
        try:
            data = json.loads(metadata.read_text(encoding="utf-8"))
            got = data.get("KPlugin", {}).get("Id")
        except (OSError, UnicodeError, json.JSONDecodeError, AttributeError) as exc:
            errors.append(f"{theme_id}: metadata.json is invalid: {exc}")
            got = None
        if got != theme_id:
            errors.append(f"{theme_id}: metadata Id is {got!r}, expected {theme_id!r}")
    try:
        declarations = parse_defaults(defaults)
    except (OSError, UnicodeError, ValueError) as exc:
        errors.append(f"{theme_id}: defaults are invalid: {exc}")
        return False

    required = set(REQUIRED)
    if not stock:
        required.add(("kdeglobals", "General", "font"))
    for identity in sorted(required):
        if identity not in declarations:
            errors.append(f"{theme_id}: missing {identity[0]}:{identity[1]}:{identity[2]}")

    library = declarations.get(("kwinrc", "org.kde.kdecoration2", "library"), "")
    if library == "org.kde.kwin.aurorae":
        errors.append(f"{theme_id}: Plasma 5 Aurorae library is forbidden; use org.kde.kwin.aurorae.v2")
    elif library == "org.kde.breeze":
        check_breeze_plugin(root, errors, theme_id)
    elif library and library != "org.kde.kwin.aurorae.v2":
        errors.append(f"{theme_id}: unknown decoration library {library!r}")

    scheme = declarations.get(("kdeglobals", "General", "ColorScheme"))
    if scheme:
        check_asset(errors, theme_id, f"color scheme {scheme!r}", resolve_named_asset(root, "color", scheme))
    icons = declarations.get(("kdeglobals", "Icons", "Theme"))
    if icons:
        check_asset(errors, theme_id, f"icon theme {icons!r}", resolve_named_asset(root, "icons", icons))
    cursor = declarations.get(("kcminputrc", "Mouse", "cursorTheme"))
    if cursor:
        check_asset(errors, theme_id, f"cursor theme {cursor!r}", resolve_named_asset(root, "cursor", cursor))
    plasma = declarations.get(("plasmarc", "Theme", "name"))
    if plasma and plasma != "default":
        check_asset(errors, theme_id, f"Plasma theme {plasma!r}", resolve_named_asset(root, "plasma", plasma))
    wallpaper = declarations.get(("kdeglobals", "Wallpaper", "Image"))
    if wallpaper:
        wallpaper_path = resolve_named_asset(root, "wallpaper", wallpaper)
        check_asset(errors, theme_id, f"wallpaper {wallpaper!r}", wallpaper_path)
        if wallpaper_path is not None and wallpaper_path.is_dir():
            image_root = wallpaper_path / "contents/images"
            if not image_root.is_dir() or not any(path.is_file() for path in image_root.iterdir()):
                errors.append(f"{theme_id}: wallpaper {wallpaper!r} has no image payload")
    decoration = declarations.get(("kwinrc", "org.kde.kdecoration2", "theme"), "")
    if decoration.startswith("__aurorae__svg__"):
        check_aurorae(root, errors, theme_id, decoration)

    kvantum = declarations.get(("Kvantum/kvantum.kvconfig", "General", "theme"))
    if kvantum:
        skin = root / "usr/share/Kvantum" / kvantum
        check_asset(errors, theme_id, f"Kvantum skin {kvantum!r}", skin if skin.is_dir() else None)
        if skin.is_dir():
            if not any(path.is_file() and path.suffix == ".kvconfig" for path in skin.iterdir()):
                errors.append(f"{theme_id}: Kvantum skin {kvantum!r} has no .kvconfig")
            if not any(path.is_file() and path.suffix == ".svg" for path in skin.iterdir()):
                errors.append(f"{theme_id}: Kvantum skin {kvantum!r} has no SVG payload")

    layout_defaults = package / "contents/layouts/defaults"
    if layout_defaults.is_file():
        try:
            layout_declarations = parse_defaults(layout_defaults)
        except (OSError, UnicodeError, ValueError) as exc:
            errors.append(f"{theme_id}: layout defaults are invalid: {exc}")
        else:
            for identity, value in layout_declarations.items():
                if identity in declarations and declarations[identity] != value:
                    errors.append(
                        f"{theme_id}: layout/defaults conflict for {identity}: "
                        f"{declarations[identity]!r} versus {value!r}"
                    )
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default="/", help="assembled image root")
    args = parser.parse_args()
    root = Path(args.root).resolve()
    errors: list[str] = []
    checked = 0
    for theme_id in SHIPPED:
        if check_theme(root, errors, theme_id, theme_id in STOCK):
            checked += 1

    # Keep the Aurorae completeness rule broader than the current Welcome list.
    # A future installed look-and-feel package may be intentionally hidden from
    # the picker, but a dangling <theme>rc would still make KWin silently fall
    # back when that package is selected in System Settings.
    lnf_root = root / "usr/share/plasma/look-and-feel"
    if lnf_root.is_dir():
        for package in sorted(lnf_root.iterdir()):
            if package.name in SHIPPED or not (package / "contents/defaults").is_file():
                continue
            try:
                declarations = parse_defaults(package / "contents/defaults")
            except (OSError, UnicodeError, ValueError):
                continue
            decoration = declarations.get(("kwinrc", "org.kde.kdecoration2", "theme"), "")
            if decoration.startswith("__aurorae__svg__"):
                check_aurorae(root, errors, package.name, decoration)

    for error in errors:
        print(f"FAIL {error}", file=sys.stderr)
    print(f"\nSPPLUS_GLOBAL_THEME_GATE themes={checked}/{len(SHIPPED)} errors={len(errors)}")
    return 1 if errors or checked != len(SHIPPED) else 0


if __name__ == "__main__":
    raise SystemExit(main())
