# Bee findings — SP+ taskbar pins and restore promise

Date: 2026-08-30
Input: `gpt-spplus-pinned-and-restore.md`, SP+ app manifest/layout, Plasma 6.7 source, kactivitymanagerd source.

## Decision summary

1. Ship **five** taskbar pins, in this order:

   ```text
   applications:brave-browser.desktop
   applications:net.thunderbird.Thunderbird.desktop
   applications:org.kde.dolphin.desktop
   applications:libreoffice-writer.desktop
   applications:org.kde.okular.desktop
   ```

2. Make the taskbar deliberately smaller than the Kickoff favourites. Keep the existing
   seven-item Kickoff list as the menu catalogue; do not make the taskbar a duplicate of it.

3. Put **Fin in Kickoff/menu only for the current build**. Do not put it on the taskbar or
   desktop yet. Its desktop file says `Terminal=false`, but its `Exec` is still:

   ```text
   kitty --class fin --title Fin -e /usr/libexec/sp-plus/fin
   ```

   A prominent accidental click therefore opens a terminal. Fin should become a taskbar
   candidate only after it has a genuinely non-terminal front end/wrapper. Keep it discoverable
   in the existing Kickoff favourites, and explain it through Welcome/onboarding rather than
   hiding the product feature.

4. Do **not** promise that Kickoff menu favourites can be restored. The panel file and taskbar
   `icontasks` launcher list are restorable configuration; Kickoff application favourites are
   split between a kactivitymanagerd SQLite database and an ordering config file, with no
   supported snapshot/restore operation for the complete list.

## Part A — why this pin list

The five selected applications are the advisor's recurring work path: web application, mail,
file manager, client documents, and carrier PDFs. The order is the existing approved order with
Fin removed, so it does not invent a new product workflow.

The first cut if the list must be shorter is **Okular only if a pilot proves PDFs are normally
opened from mail/browser**; otherwise keep it. The first non-core item to add later is
**KeePassXC**, as a sixth pin, if advisors use it several times each day. It is valuable but is
not needed to make the initial taskbar legible. The primary five are the safer day-one density.

The taskbar should differ from Kickoff:

- Kickoff is a menu/catalogue and can hold the seven approved entries, including a product
  feature that needs discovery but is not safe as a prominent accidental target.
- The icons-only task manager is always visible and mixes pinned launchers with running windows.
  Every pin consumes scarce visual attention and creates an accidental-click target.
- Duplication is not useful here: the taskbar should expose the daily path; Kickoff can expose
  the broader approved set.
- Keep the taskbar's order intentional and stable. Do not add Calc merely because it is
  installed: the existing approved favourite is Writer, and the file/application association
  can take the user to the right office tool.

Fin placement is a UX risk, not a security privilege risk: the shipped image has no admin
account, but a terminal still looks like a failure to a non-technical advisor. A desktop icon is
not safer than a taskbar icon; it is also a prominent accidental target. Menu-only is the least
surprising current compromise.

Deliberately do not pin:

- `applications:fin.desktop` — launches kitty/terminal.
- `applications:kitty.desktop` — terminal trap. `NoDisplay=true` does not protect against a
  Kickoff/taskbar entry addressed directly by desktop ID.
- Kate, micro — developer/text tools, not advisor front doors.
- Flameshot/Spectacle — support tools, launched when needed.
- Discover, System Settings, printer configuration — maintenance/admin surfaces, not daily work.
- Ark, Gwenview, KCalc, Impress, Draw, Base, Math, and Calc — useful specialist/file-associated
  tools, but too many separate permanent targets for the first panel.

## Part B — authoritative storage model

### 1. Membership versus ordering

For Plasma 6.7 Kickoff, the old applet `General/favorites` key is a migration input, not the
live store. The current Kickoff source uses:

```qml
if (!Plasmoid.configuration.favoritesPortedToKAstats) {
    if (favoritesModel.count < 1) {
        favoritesModel.portOldFavorites(Plasmoid.configuration.favorites);
    }
    Plasmoid.configuration.favoritesPortedToKAstats = true;
}
```

The live application-favourite membership is in the kactivitymanagerd resources database:

```text
${XDG_DATA_HOME:-$HOME/.local/share}/kactivitymanagerd/resources/database
```

Normally that is:

```text
~/.local/share/kactivitymanagerd/resources/database
```

It is SQLite. The relevant table is `ResourceLink`:

```sql
usedActivity        TEXT
initiatingAgent     TEXT
targettedResource   TEXT
PRIMARY KEY (usedActivity, initiatingAgent, targettedResource)
```

Kickoff application favourites use rows like:

```text
usedActivity=:global
initiatingAgent=org.kde.plasma.favorites.applications
targettedResource=applications:org.kde.dolphin.desktop
```

There may also be activity-specific rows, where `usedActivity` is an activity UUID. The
`:global` rows are the important all-activities set.

The **order is not in SQLite**. Plasma's `KAStatsFavoritesModel` reads/writes:

```text
~/.config/kactivitymanagerd-statsrc
```

The relevant groups are dynamically named, for example:

```ini
[Favorites-org.kde.plasma.kickoff.favorites.instance-3-global]
ordering=applications:brave-browser.desktop,applications:net.thunderbird.Thunderbird.desktop,...
```

There can also be an activity-specific group ending in an activity UUID. The model reads the
current-activity ordering plus the global ordering, and writes ordering for both the current
activity and `global`. The numeric `Plasmoid.id` is part of the group name; a recreated Kickoff
applet can therefore have a different instance group. Plasma has fallback logic that searches
other matching groups, but that is not a stable restore contract.

The migration seed lives in the Kickoff applet's `plasma-org.kde.plasma-appletsrc` group,
under its `General` config, using:

```text
favorites=...
favoritesPortedToKAstats=false|true
```

That seed is consumed only by the `Component.onCompleted` path above. It is not the database
and is not a durable backup of the favourites.

### 2. What `--resetLayout` does

`plasma-apply-lookandfeel --resetLayout` destroys the shell's old panel/desktop containments and
recreates them from the selected layout script. This destroys the old applet configuration,
including the task manager's `launchers` key and Kickoff's migration-seed config, unless the
new layout writes them again.

It does **not** intentionally delete the kactivitymanagerd `ResourceLink` rows. Therefore, on an
already-populated user, Kickoff favourites often survive applet recreation because the new model
reads the same database. That is not the same as restoring the pre-reset state:

- If the database is already populated, setting the new applet's seed flag to false does not
  overwrite it; the source checks `favoritesModel.count < 1` first, then sets the flag true.
- A new/empty database can be seeded, but the result depends on the new applet's initialization
  timing, activity, instance ID, and ordering groups.
- If a theme or user action changed the database before restore, recreating the applet does not
  recover the old database state.
- Ordering is especially vulnerable because the recreated Kickoff has a new dynamic instance
  group and the fallback selection is heuristic.

The honest classification is therefore **dependent on state and ordering/timing; not a reliable
preservation or restore mechanism**. The guest observation that the stock list survived after the
flag was written false is consistent with this source: the database was non-empty, so migration
was skipped and the flag returned to true.

### 3. Supported interfaces and restore options

kactivitymanagerd exposes individual resource-link operations on the session bus:

```text
service:      org.kde.ActivityManager
object:       /ActivityManager/Resources/Linking
interface:    org.kde.ActivityManager.Resources.Linking
methods:      LinkResourceToActivity(agent, resource, activity)
              UnlinkResourceFromActivity(agent, resource, activity)
              IsResourceLinkedToActivity(agent, resource, activity) -> bool
```

These are the supported way to add/remove/check membership. They do not provide a Kickoff
favourites snapshot, bulk restore, or ordering API. KActivitiesStats is a query/client library;
it is not a user-facing backup format.

There is no supported KDE API that snapshots and restores the complete Kickoff list, including
its applet-specific ordering. `kactivitymanagerd-statsrc` can be copied/restored while the
relevant services are stopped, but its dynamic group names and config ownership make that an
implementation workaround, not a stable user promise.

The raw SQLite database is even more sensitive. kactivitymanagerd uses SQLite WAL files, so a
coherent filesystem snapshot must account for all of:

```text
.../database
.../database-wal
.../database-shm
```

Never copy only `database` while kactivitymanagerd is running. Direct database replacement is
backend-internal, can include all activity/recent-resource data rather than just favourites,
and may break across schema migrations. If used as an engineering recovery tool, stop both
`plasmashell` and `kactivitymanagerd`, preserve/restore the complete database file set and
`kactivitymanagerd-statsrc` together, then restart and perform the read-back below. Do not call
that a supported end-user restore feature.

### 4. Is `favoritesPortedToKAstats=false` a restore mechanism?

**No, not for a populated user.** It is a first-initialization migration switch.

For it to seed anything:

1. The correct new Kickoff applet's `General/favorites` must contain the desired legacy IDs.
2. `favoritesPortedToKAstats` must be false before that applet's QML
   `Component.onCompleted` runs.
3. The model must have zero favourites (`favoritesModel.count < 1`).
4. Kickoff must be recreated/restarted so that `Component.onCompleted` runs. Merely changing
   the key on an already-completed applet is not enough.
5. `portOldFavorites()` links the entries, saves ordering, and the code then sets the flag true.
   It is not a merge/replace transaction for an existing list.

Plasmashell does not need to be stopped for the migration code itself; it must be running for
Kickoff to execute it. For a deterministic offline preparation, stop plasmashell, write the seed
and false flag, then start/recreate plasmashell. That still will not replace non-empty KAStats
favourites. A layout script that calls `addWidget()` and only then writes config must be tested
against actual QML completion timing; do not assume those writes beat `Component.onCompleted`.

### 5. Failing read-back check

Use this after the restore/apply operation. It checks exact global membership and the ordered
Kickoff list. It exits nonzero if the database is missing, any expected item is missing, an
unexpected item remains, the ordering group is absent, or the order differs.

Adjust `expected` to the snapshot being tested:

```bash
#!/usr/bin/env bash
set -euo pipefail

agent='org.kde.plasma.favorites.applications'
stats="$HOME/.config/kactivitymanagerd-statsrc"
db="${XDG_DATA_HOME:-$HOME/.local/share}/kactivitymanagerd/resources/database"
expected='applications:brave-browser.desktop,applications:net.thunderbird.Thunderbird.desktop,applications:fin.desktop,applications:org.kde.dolphin.desktop,applications:libreoffice-writer.desktop,applications:org.kde.okular.desktop,applications:org.keepassxc.KeePassXC.desktop'

[ -s "$db" ] || { echo "FAIL: no resources database: $db" >&2; exit 1; }
[ -f "$stats" ] || { echo "FAIL: no stats config: $stats" >&2; exit 1; }

# Compare exact membership as a sorted set; ResourceLink has no ordering column.
actual_set=$(sqlite3 -readonly -separator ',' "$db" \
  "SELECT targettedResource FROM ResourceLink WHERE usedActivity=':global' AND initiatingAgent='$agent' ORDER BY targettedResource;" \
  | paste -sd, -)
expected_set=$(printf '%s' "$expected" | tr ',' '\n' | sort | paste -sd, -)
[ "$actual_set" = "$expected_set" ] || {
  echo "FAIL: global favourite membership differs" >&2
  echo "expected(sorted): $expected_set" >&2
  echo "actual(sorted):   $actual_set" >&2
  exit 1
}

# Find a Kickoff global ordering group. A missing group is a hard failure.
group=$(sed -n 's/^\[\(Favorites-org\.kde\.plasma\.kickoff\.favorites\.instance-[0-9][0-9]*-global\)\]$/\1/p' "$stats" | tail -n 1)
[ -n "$group" ] || { echo "FAIL: no Kickoff global ordering group" >&2; exit 1; }
actual_order=$(kreadconfig6 --file "$stats" --group "$group" --key ordering 2>/dev/null || true)
[ "$actual_order" = "$expected" ] || {
  echo "FAIL: Kickoff ordering differs in [$group]" >&2
  echo "expected: $expected" >&2
  echo "actual:   $actual_order" >&2
  exit 1
}

echo "PASS: exact global Kickoff membership and order restored via [$group]"
```

For a less invasive live membership check, each entry can also be checked through the supported
D-Bus method:

```bash
gdbus call --session \
  --dest org.kde.ActivityManager \
  --object-path /ActivityManager/Resources/Linking \
  --method org.kde.ActivityManager.Resources.Linking.IsResourceLinkedToActivity \
  org.kde.plasma.favorites.applications \
  applications:org.kde.dolphin.desktop \
  :global
```

A successful result must contain `true`; a D-Bus error or false result is a failure. The SQLite
check remains necessary for exact set comparison, and the `statsrc` check is necessary for order.

## Receipt recommendation

Do not ship this sentence as written:

> Your current panel is saved. You can restore the previous panel and pinned apps later.

If “pinned apps” means Kickoff menu favourites, it is an unsupported promise. Use:

> Your current panel arrangement is saved. You can restore the previous panel arrangement later.

If the product specifically means taskbar `icontasks` pins, those are in the panel applet config
and can be included in a panel snapshot, but the restore path must verify the restored
`launchers` value before claiming success. Keep Kickoff menu favourites out of the promise unless
SP+ implements and verifies its own database/config restore path.

## Sources checked

- Plasma Desktop 6.7 Kickoff source (`favoritesPortedToKAstats` and `portOldFavorites`):
  https://github.com/KDE/plasma-desktop/blob/Plasma/6.7/applets/kickoff/main.qml
- Plasma Workspace 6.7 `KAStatsFavoritesModel` (ResourceLink watcher, ordering groups,
  migration, save logic):
  https://github.com/KDE/plasma-workspace/blob/Plasma/6.7/applets/kicker/kastatsfavoritesmodel.cpp
- kactivitymanagerd resource schema (`ResourceLink`, path derivation):
  https://github.com/KDE/kactivitymanagerd/blob/master/src/common/database/schema/ResourcesDatabaseSchema.cpp
- kactivitymanagerd ResourceLinking D-Bus API and SQLite writes:
  https://github.com/KDE/kactivitymanagerd/blob/master/src/service/plugins/sqlite/ResourceLinking.h
  https://github.com/KDE/kactivitymanagerd/blob/master/src/service/plugins/sqlite/ResourceLinking.cpp
- kactivitymanagerd database/WAL handling:
  https://github.com/KDE/kactivitymanagerd/blob/master/src/service/plugins/sqlite/Database.cpp
- KActivitiesStats library description/API:
  https://github.com/KDE/kactivities-stats

## Confidence

High on the storage locations, schema, migration guard, and absence of a complete supported
snapshot API. High on the product recommendation that a terminal-opening Fin should not be a
day-one taskbar target. The exact behavior of a particular distro's layout-script/QML timing and
its service restart behavior still needs a guest test; that uncertainty is precisely why the
receipt must not promise Kickoff-favourite restoration.
