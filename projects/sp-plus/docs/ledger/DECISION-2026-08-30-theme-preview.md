# DN-44 — theme picker gets a 75% preview before committing

Date: 2026-08-30
Decided by: Christopher
Status: decided; depends on DN-43 phase 2

## Why

Plasma 6 cannot give us Omarchy-style silky live switching, and DN-43's research says
why in detail: there is no D-Bus call that restyles a running Qt process (Kvantum needs
app restarts), the splash only appears at next sign-in, and the layout reload is
asynchronous with no completion signal. Rather than pretend the switch is seamless, the
picker sets expectations before the advisor commits.

## The decision

Clicking a theme rectangle opens a preview filling about **75% of the screen surface**,
large enough to actually read. It is a preview, not an application: nothing changes
until the advisor commits from within it.

**The preview image is captured from our own VM and is a build-gate artifact.** The
verification pass in DN-43 phase 2 already has to screenshot each theme applied on a
real SP+ session to prove the apply path landed. Those captures ARE the preview assets.
One artifact doing two jobs: the preview cannot drift from reality, because if a theme
stops applying, the gate fails and no preview ships for it.

Rejected: shipping the creators' own `contents/previews/fullscreenpreview.jpg`. Four
packages carry them (Windows dark/light, Orchis, Nordic) and they are well composed, but
they show the creator's machine — Orchis's is the same `/home/vince` desktop as its
layout script. An advisor who previews that and commits gets something else, which
rebuilds the exact credibility failure DN-43 exists to close. Catppuccin and Breeze ship
none in-tree regardless.

**The panel shows the capture plus an honest change-list** in plain language: what will
change, and what will not. It absorbs the DN-43 confirmation receipt rather than adding a
second dialogue. It must state at least:

- that the panel, pinned applications and desktop widgets will be replaced by the
  theme's layout, and that the current layout is saved and restorable;
- that the splash screen appears at the next sign-in, not now;
- that already-open applications may keep their old styling until reopened (Kvantum, and
  any Qt app holding a constructed QStyle);
- nothing that Plasma 6 will not actually honour — in particular no lock screen or OSD
  claim, since those look-and-feel surfaces are inert (DN-43 constraint 6).

## Constraints carried in

- The preview must fit one viewport with no scrolling, per the standing Welcome rule.
- Every theme offered in Welcome needs a capture, so the gate must cover all eight,
  including Catppuccin and Breeze which ship no upstream preview.
- Previews are regenerated per build cycle, not committed once and forgotten. A stale
  capture is the same lie as an upstream one.

## Amendment, 2026-08-30 — the restore promise is narrowed to what we can keep

Research: `docs/theme-manifests/PINNED-APPS-AND-FAVOURITES-RESTORE.md`.

The DN-44 receipt originally said "your current panel is saved; you can restore the
previous panel and pinned apps later." That is only partly deliverable, and the split
runs along a line the advisor cannot see, so the copy must draw it for them.

**Restorable — keep promising it.** The panel arrangement AND the taskbar's pinned
applications both live in `plasma-org.kde.plasma-appletsrc`. Restoring that file restores
both. This is the part the advisor actually looks at.

**Not restorable — stop promising it.** Kickoff *menu* favourites are not in applet
config. Membership is in the kactivitymanagerd SQLite resources database
(`~/.local/share/kactivitymanagerd/resources/database`, table `ResourceLink`, rows keyed
`usedActivity=:global`, `initiatingAgent=org.kde.plasma.favorites.applications`).
**Ordering is not in that database at all** — it is in
`~/.config/kactivitymanagerd-statsrc`, under a group whose name embeds the applet's
numeric instance id, which changes when the applet is recreated; Plasma's fallback search
across matching groups is heuristic, not a contract.

There is no supported KDE API that snapshots and restores the complete list with ordering.
`LinkResourceToActivity` / `UnlinkResourceFromActivity` / `IsResourceLinkedToActivity` on
`org.kde.ActivityManager` handle individual membership only. Copying the database is a
WAL-backed three-file operation (`database`, `-wal`, `-shm`) requiring plasmashell and
kactivitymanagerd stopped, and carries unrelated activity/recent-resource data with it.
That is an engineering recovery tool; it must never be described to an advisor as a
restore feature.

`favoritesPortedToKAstats=false` is **not** a restore mechanism. It is a
first-initialisation migration switch: Kickoff seeds from it only when the favourites
model is empty, then sets the flag true. This also explains the cycle36 guest observation
— the database was non-empty, migration was skipped, the flag returned to true.

**The saving grace, and the honest wording.** `--resetLayout` does not delete the
`ResourceLink` rows, so menu favourites generally survive a theme change rather than
needing restoration; ordering is the fragile part. The receipt therefore says the panel
and its pinned apps are saved and restorable, and that the Start-menu favourites are not
removed — without claiming their order is preserved, and without offering a restore
button for them.

## Taskbar pins, decided 2026-08-30

Five, in this order — deliberately fewer than the Kickoff menu's seven, because the
icons-only task manager mixes pinned and running applications and a crowded strip reads
as clutter on first boot:

    applications:brave-browser.desktop
    applications:net.thunderbird.Thunderbird.desktop
    applications:org.kde.dolphin.desktop
    applications:libreoffice-writer.desktop
    applications:org.kde.okular.desktop

The taskbar and the Kickoff menu deliberately differ. KeePassXC stays in the menu only.

**Fin is menu-only until it has a non-terminal UI.** SP+'s distinguishing feature is also
a terminal program, and the taskbar is where a non-technical advisor clicks by reflex on
day one. It goes back on the taskbar when it has an interface that does not open a
terminal.

`kitty` must never be pinned: the build sets `NoDisplay=true` on it, but Kickoff pins by
desktop id and does not consult `NoDisplay`, so it can be pinned by accident on a system
that ships no admin account (DN-13).
