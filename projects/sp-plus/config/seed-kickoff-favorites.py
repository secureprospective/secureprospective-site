#!/usr/bin/python3
"""Seed Kickoff's application favourites for every account made from /etc/skel.

WHY THIS FILE EXISTS
--------------------
The favourites list was correct in source and wrong on screen for the whole of
v0.11.3. `spplusMenuFavorites` in the look-and-feel layout script names the six
advisor applications, and tests/theme-phase2-source-gate.sh already checks it.
The layout writes them to the Kickoff applet as `favorites=` and sets
`favoritesPortedToKAstats=false`.

That seed is a MIGRATION INPUT, not the store. Plasma 6.7 Kickoff does:

    if (!Plasmoid.configuration.favoritesPortedToKAstats) {
        if (favoritesModel.count < 1) {
            favoritesModel.portOldFavorites(Plasmoid.configuration.favorites);
        }
        Plasmoid.configuration.favoritesPortedToKAstats = true;
    }

`count < 1` is the whole problem. Plasma ports ITS OWN stock defaults first, so
by the time our seed is read the model is already populated, the port is skipped,
and the flag flips to true. Measured on the v0.11.3 test VM 2026-09-12 --
ResourceLink held exactly the Fedora KDE stock set:

    preferred://browser, org.kde.kontact.desktop, systemsettings.desktop,
    org.kde.dolphin.desktop, org.kde.kwrite.desktop, org.kde.konsole.desktop,
    org.kde.discover.desktop

An advisor therefore opened the menu and was offered Konsole -- which this image
deliberately hides from All Applications with NoDisplay=true -- and Discover and
System Settings, which PINNED-APPS-AND-FAVOURITES-RESTORE.md calls maintenance
surfaces and rules out by name. Kontact is not even installed. The taskbar was
never affected; it uses the icontasks `launchers` key, which IS durable config.

THE FIX
-------
Ship the kactivitymanagerd database pre-populated in /etc/skel. A new account then
starts with count >= 1, the stock port never runs, and our six survive. This is
the same mechanism /etc/skel already carries Documents/Fin and the .pi config with.

Ordering is deliberately NOT written here. It lives in kactivitymanagerd-statsrc
under a group name containing the Kickoff applet's numeric instance id
(`Favorites-org.kde.plasma.kickoff.favorites.instance-29-global` on the test VM),
which is not knowable at build time. Membership is what this file guarantees.

Schema and version string are copied from a live Plasma 6.7 database, not invented.
"""
import os
import re
import sqlite3
import sys

# The advisor's six. Identical to spplusMenuFavorites in the layout script; if you
# change one, change both -- the build gate compares them.
FAVORITES = [
    "applications:brave-browser.desktop",
    "applications:fin.desktop",
    "applications:org.kde.dolphin.desktop",
    "applications:libreoffice-writer.desktop",
    "applications:org.kde.okular.desktop",
    "applications:org.keepassxc.KeePassXC.desktop",
]

AGENT = "org.kde.plasma.favorites.applications"
ACTIVITY = ":global"
SCHEMA_VERSION = "2015.02.09"

SCHEMA = [
    "CREATE TABLE SchemaInfo (key text PRIMARY KEY, value text)",
    "CREATE TABLE ResourceEvent (usedActivity TEXT, initiatingAgent TEXT, "
    "targettedResource TEXT, start INTEGER, end INTEGER )",
    "CREATE TABLE ResourceScoreCache (usedActivity TEXT, initiatingAgent TEXT, "
    "targettedResource TEXT, scoreType INTEGER, cachedScore FLOAT, "
    "firstUpdate INTEGER, lastUpdate INTEGER, "
    "PRIMARY KEY(usedActivity, initiatingAgent, targettedResource))",
    "CREATE TABLE ResourceLink (usedActivity TEXT, initiatingAgent TEXT, "
    "targettedResource TEXT, "
    "PRIMARY KEY(usedActivity, initiatingAgent, targettedResource))",
    "CREATE TABLE ResourceInfo (targettedResource TEXT, title TEXT, mimetype TEXT, "
    "autoTitle INTEGER, autoMimetype INTEGER, PRIMARY KEY(targettedResource))",
]


def verify(dest, layout_path):
    """Read the database BACK and prove it matches the layout script.

    Writing a file is not evidence that the right rows are in it. This is the
    same class of mistake that let v0.11.3 ship: every gate checked the value we
    wrote, never the value the desktop would read.
    """
    rows = [
        r[0]
        for r in sqlite3.connect(dest).execute(
            "SELECT targettedResource FROM ResourceLink WHERE initiatingAgent = ?",
            (AGENT,),
        )
    ]

    with open(layout_path) as handle:
        layout = handle.read()
    match = re.search(r"var spplusMenuFavorites = \[(.*?)\];", layout, re.S)
    if not match:
        return "spplusMenuFavorites not found in %s" % layout_path
    want = re.findall(r'"([^"]+)"', match.group(1))

    if sorted(rows) != sorted(want):
        return "seeded %r does not match the layout script %r" % (sorted(rows), sorted(want))

    # Name the set that actually shipped, so a regression is loud rather than subtle.
    stock = [
        "preferred://browser",
        "org.kde.kontact.desktop",
        "applications:systemsettings.desktop",
        "applications:org.kde.konsole.desktop",
        "applications:org.kde.discover.desktop",
        "applications:org.kde.kwrite.desktop",
    ]
    for entry in stock:
        if entry in rows:
            return "Plasma stock default %s is back in the seed" % entry

    if "applications:fin.desktop" not in rows:
        return "Fin is not in the advisor's favourites"

    return None


def main():
    if len(sys.argv) != 3:
        print(
            "usage: seed-kickoff-favorites.py <path-to-database> <path-to-layout-js>",
            file=sys.stderr,
        )
        return 2
    dest, layout_path = sys.argv[1], sys.argv[2]

    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if os.path.exists(dest):
        os.remove(dest)

    conn = sqlite3.connect(dest)
    try:
        for statement in SCHEMA:
            conn.execute(statement)
        conn.execute(
            "INSERT INTO SchemaInfo (key, value) VALUES (?, ?)",
            ("version", SCHEMA_VERSION),
        )
        conn.executemany(
            "INSERT INTO ResourceLink (usedActivity, initiatingAgent, targettedResource) "
            "VALUES (?, ?, ?)",
            [(ACTIVITY, AGENT, resource) for resource in FAVORITES],
        )
        conn.commit()
    finally:
        conn.close()

    # kactivitymanagerd's own database is 0600; a world-readable copy in skel would
    # be copied into every new home with the same mode.
    os.chmod(dest, 0o600)

    problem = verify(dest, layout_path)
    if problem:
        print("FAVOURITES_SEED_GATE FAIL: %s" % problem, file=sys.stderr)
        return 1

    print(
        "FAVOURITES_SEED_GATE_OK %d advisor favourites seeded: %s"
        % (len(FAVORITES), ",".join(sorted(FAVORITES)))
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
