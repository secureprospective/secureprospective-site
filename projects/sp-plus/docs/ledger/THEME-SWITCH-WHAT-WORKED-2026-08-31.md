# Theme switching through the Welcome app — what worked and what did not

Written 2026-08-31, on meeting the goal: Windows -> Breeze -> Windows, driven only through
the Welcome application on the Dell, without error.

## Result

VERDICT: PASS on the SHIPPED image (test45, digest sha256:240b7bd6...), not merely on staged
code. Four transitions, each a real mouse press dispatched into the running app so the app's
own JavaScript, its window-title bridge and the installed helper all ran. Every transition
was a genuine change of value, the shell survived all four, and the first and second visits
to Windows were byte-identical in look-and-feel, icons, widget style, Plasma theme, colour
scheme, loaded decoration and panel applet sequence. The final desktop was screenshotted and
inspected: legible, and recognisably Windows.

## What actually fixed it

Three original root causes, all confirmed on hardware rather than reasoned about:

1. `org.kde.KGlobalSettings.notifyChange` has NO bus owner on Plasma 6.7. The helper was
   calling it as a method and silently achieving nothing. It is a signal, and must be
   emitted.
2. There was no layout path at all. Applying a look-and-feel package never installed the
   package's panel, so a Windows theme produced Windows colours on a Breeze panel.
3. `check=False` on every subprocess meant no failure could ever surface.

Five further defects were invisible to source review and only appeared when the code ran on
a real session:

4. `gdbus emit ... -1` — gdbus parsed the negative argument as an option. Needs `--`.
5. `plasma-apply-lookandfeel --resetLayout` STOPS plasmashell and does not bring it back.
   The helper polled a dead shell for 90 seconds and then rolled back a correct change. Fix:
   restart the unit and poll for the D-Bus name, never a fixed sleep.
6. `panel.locked = true` was set BEFORE `addWidget`. Plasma refuses to add widgets to a
   locked panel, producing an empty panel and "Could not create the panelspacer widget".
   Lock last.
7. Plasma SILENTLY IGNORES symlinked files inside a look-and-feel package. The windows-light
   package's layout was a symlink to the dark one, so light fell back to the stock panel.
   Real files only.
8. The layouts asked for `start-here-kde-symbolic`, which windows-modern does not ship, so
   the Start button fell through to Breeze and showed a KDE logo on a Windows desktop. Ask
   for the name the theme actually provides (`start-here`).

## What did not work, and cost time

- **Reading config to prove a theme applied.** `plasma-apply-lookandfeel` writes to
  `~/.config/kdedefaults/<file>` and reverts the user file; a naive read of `~/.config/<file>`
  looks like damage. It is normal cascade behaviour. Assertions must check both layers.
- **Reading config from an SSH shell at all.** `kreadconfig6` there sees a different cascade
  than the session. Inherit `XDG_CONFIG_DIRS` and friends from plasmashell's `/proc/<pid>/environ`.
- **`pkill` plus `setsid` to restart the shell.** Launching without `XDG_CURRENT_DESKTOP` means
  Qt never loads the KDE platform theme, which produced black text on a black background --
  contamination from the harness, not a defect in the theme. Use
  `systemctl --user start plasma-plasmashell.service`.
- **`pkill -f <pattern>`** matches the very SSH command line running it and kills the session.
  Kill by PID.
- **`offsetParent !== null` as a visibility test.** Always null for a `position:fixed` modal,
  so the driver reported the Apply button hidden and never clicked it. Judge visibility by
  the rendered box.
- **Assuming a card click works from any step.** Theme cards exist in the DOM throughout but
  have a zero-sized box until their wizard step is shown.
- **Waiting for a value to EQUAL the target.** An already-applied theme reports instant
  success and the run passes having done nothing. Require the value to have CHANGED.
- **The Welcome app is single-instance.** A second copy exits 0 immediately and silently, so
  a controlled launch appears to start and vanish while the autostart copy holds the socket.
- **Two agents on one desktop.** A delegated verification sweep restarting plasmashell will
  trip systemd's user-unit start-rate limiter and strand the session. Serialise work on the
  Dell, and clear the failure counter before a deliberate restart sequence.
- **Bash function variables are global.** A helper looping over `name` clobbered the caller's
  `$name` and wrote all eight screenshots to one file. `local` is not optional.

## Environment defects found but deliberately NOT folded in

- Kickoff favourites are half-seeded from the user's `kactivitymanagerd-statsrc`, so stock
  Plasma entries (Konsole, Discover) appear even though the image sets `NoDisplay=true`.
  Confirmed still present on a fresh test45 deployment: it is user state, not image state.
- Two orphaned panel containments predate this work.
- `/etc/xdg/kwinrc` hard-codes the Windows Aurorae decoration as the system default, which is
  worth revisiting now that every theme owns its own layout.

## Follow-on, already implemented

Christopher ruled on 2026-08-31 that all eight themes must match their own paneling, not just
the two Windows packages, because advisors read that detail as trustworthiness. Implemented in
081c774: every card resets its layout, and packages that ship no layout of their own (Nordic,
both Catppuccin) are returned to Plasma's stock default panel and verified through the same
live D-Bus readback. That change is NOT in test45 and awaits verification on test46.

## Confirmed again on test46, with paneling fidelity

test46 (registry digest sha256:2478e5fc...) booted clean with zero failed units, and the
installed Welcome app carries all eight `data-layout-reset="true"` values. The same round
trip passed a second time, now with a layout reset and shell restart on EVERY transition
rather than only on the Windows ones -- a materially harder test than test45 passed.

Live read-back per transition, which is the evidence that the panel itself changed rather
than only the colours:

- Breeze:  kickoff, pager, icontasks, marginsseparator, systemtray, digitalclock, showdesktop
           decoration Plugin: org.kde.breeze Theme: Breeze
- Windows: panelspacer, kickoff, icontasks, panelspacer, systemtray, digitalclock, minimizeall
           decoration Plugin: org.kde.kwin.aurorae.v2 Theme: windows-modern-dark-aurorae

Both final states were screenshotted and inspected: Windows shows the centred taskbar with
the four-pane Start mark; Breeze shows its own left-aligned panel and wallpaper. Both legible.

Note on digests: the `BUILD OK` summary prints podman's LOCAL manifest digest, which differs
from the digest the registry serves after push. Verify a deployment against the registry's
`Docker-Content-Digest`, not the build summary, or a correct deployment looks like a mismatch.
