# cycle33 — what is queued, and why

Held, not built, on Christopher's instruction 2026-08-27. Everything below is
committed and gated at build time; none of it has been built or installed yet.

## 1. DN-24 — the wallpaper (FIXED)

`plasma-apply-lookandfeel --resetLayout` reloads plasmashell asynchronously, and
that reload flushed plasmashell's cached config over our wallpaper write. The
call reported success, the unit exited 0 and logged "applied", the stamp was
written -- and the advisor got Fedora's red/purple default. Proven on cycle32:
the stamp is dated 11:55 and the 11:55 screenshot shows the wrong wallpaper.

`spplus-first-login` now waits for plasmashell to return to the bus, applies the
wallpaper, reads the desktop config back to confirm it took, and retries up to
three times. On failure it leaves the stamp off so the next login retries.

The general lesson: an exit code of 0 from a Plasma tool is not evidence.

## 2. Print Screen did not actually take a screenshot (FIXED)

Christopher: "Flameshot needs to be the default printscreen tool."

The stock `org.flameshot.Flameshot.desktop` has `Exec=flameshot`, which starts
the flameshot DAEMON. Taking a picture is a desktop *action* on that file
(`flameshot gui`), and a `kglobalshortcutsrc [services]` binding always fires the
main `Exec`, never an action. So Print Screen started an invisible daemon -- SP+
ships `disabledTrayIcon=true` -- and the advisor saw nothing happen.

SP+ now ships `flameshot-capture.desktop` (`Exec=flameshot gui`, `NoDisplay=true`)
and binds Print to that instead. It also ships an autostart for the daemon,
because `flameshot gui` needs the daemon already running under Wayland and
Plasma 6 is Wayland by default -- without it the first Print Screen of a session
races the daemon's startup.

Bee's cycle32 evidence recorded a Flameshot overlay in a screenshot, which is
true but does not prove the KEY produced it. That is the gap this closes.

## 3. The fastfetch logo pointed into /etc/skel (FIXED)

`config.jsonc` set `"source": "/etc/skel/.config/fastfetch/logo-sp-plus.txt"`.
`/etc` is writable per-machine on bootc, so every advisor's fastfetch depended on
a template directory nobody should have to preserve; the logo was also never
copied into the user's own home, so the file in `~/.config/fastfetch` was dead
weight. The logo now ships in `/usr/share/sp-plus/branding/` alongside the
wallpaper -- read-only and image-owned -- and `branding/` is copied before the
tools layer so the build-time render gate can still see it.

## 4. Full LibreOffice suite (ADDED)

Christopher asked for the full suite. Was writer + calc; now also impress, draw,
base and math. All six are asserted present as visible menu entries by the
desktop-manifest gate, so a silently missing one fails the build.

## 5. DN-25 — Fin plug and play (OPEN, NOT STARTED)

See `DN-25-fin-plug-and-play.md`. Still needs Christopher's answer on whether
"plug and play" means frictionless setup, a more capable agent, or both.

## Deliberately NOT in this cycle

The 10 SELinux AVC denials from `OBSERVED-2026-08-27-cycle32-avc.md`. Nothing
failed because of them, and the honest test is a `bootc upgrade` on the existing
cycle32 machine, which needs no new ISO.
