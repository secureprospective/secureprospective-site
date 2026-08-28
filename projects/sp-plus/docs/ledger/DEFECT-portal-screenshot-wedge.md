# Print Screen / Flameshot: the portal backend wedges

Investigated 2026-08-28 in the cycle35 guest `fedora-test35`. Christopher's note:
*"Flameshot doesnt work off the prtscn button by default."*

## What is actually wrong

The SP+ configuration is **correct**: `flameshot-capture.desktop` is bound to
`Print` in `/etc/xdg/kglobalshortcutsrc`, Spectacle's `_launch` is `none`, the
daemon autostarts, and `Exec=flameshot gui`. None of that is the fault.

A Screenshot request through `xdg-desktop-portal` **permanently wedges
`xdg-desktop-portal-kde`**. Proven by restart bisection:

| Step | Result |
|---|---|
| Portal after a screenshot attempt | every call times out, including `Settings.ReadOne`, which needs no GPU |
| `systemctl --user restart plasma-xdg-desktop-portal-kde.service` | `Settings.ReadOne` answers instantly, `(<uint32 2>,)` |
| One more `flameshot screen -p` | times out again, portal wedged again |

It is deterministic and it is **not confined to Flameshot**. Once wedged, every
portal consumer on the machine hangs for 30 s: Flatpak file pickers, screen
sharing, the settings portal. That is a bigger defect than the screenshot itself.

The wedge coincides exactly with `xdg-desktop-portal-kde` logging
`libEGL warning: egl: failed to create dri2 screen` at the moment of the request.

## Refuted along the way — do not retest

- **"The daemon fails to register with the portal."** The message
  `Could not register app ID: App info not found for ''` is expected noise from
  ANY non-Flatpak host application touching a portal (xdg-desktop-portal #579).
  `xdg-desktop-portal-kde` logs the same class of message about itself. Adding a
  `flameshot-daemon.desktop` to the applications directory silenced it and changed
  nothing about the capture.
- **"The daemon is the problem."** Stopping it entirely, matching `bird`, still
  times out.
- **"A cached permission denial is blocking it."** The permission store
  (`~/.local/share/flatpak/db/`) is empty; nothing is cached.
- **"The compositor or GPU cannot capture."** `spectacle -b -n -f -o` produces a
  1.1 MB PNG instantly on the same session.

## Why Spectacle is unaffected

Spectacle does not use the generic freedesktop Screenshot portal at all. It talks
to KWin over a private, first-party protocol. Flameshot, as a third-party app, has
no access to that path and is structurally required to go through the portal. The
two are on different code paths with different reliability, which is why one works
and the other does not.

## The counter-evidence that matters

`bird` (Christopher's own Fedora 44 KDE machine, real GPU) runs Flameshot 14.0.0
successfully on Wayland, with the same `xdg-desktop-portal`, `-kde`, `-gtk` and
PipeWire versions as SP+, no daemon, and the shortcut bound to `Ctrl+Alt+P`.

So this is **not** proof that Flameshot is broken on hardware. The most probable
differentiator is the guest's software-rendered virtio GPU, given the EGL failure
stamped at the moment of the request. It cannot be confirmed from the guest.

## Status

OPEN, needs Christopher's decision. Two honest options:

1. **Bind Print Screen to `spectacle -r -b -c`** — region select, no GUI window,
   straight to clipboard. First-party KWin path, so it never touches the portal
   and cannot wedge it. Flameshot stays installed and in the menu for annotation.
2. **Keep Flameshot on Print Screen.** It works on bird, so it will probably work
   on advisor hardware, but where the portal does wedge the advisor loses Print
   Screen *and* every file dialog until they log out, with no way to recover.

Either way the field check must change: `field-inspect.sh` line 230 greps for
`^_launch=.*Print`, which Spectacle's own lines also match, and which only proves
a config line exists rather than that pressing the key produces a picture.
