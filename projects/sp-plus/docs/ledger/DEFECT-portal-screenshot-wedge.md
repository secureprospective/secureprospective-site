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

## Resolution (Christopher, 2026-08-28)

Print Screen goes to Spectacle region mode. Flameshot stays installed and in the
menu for annotation; it no longer owns the key.

Shipped as `config/spplus-screenshot`, a wrapper running
`spectacle -r -b -c -o <Pictures>/Screenshots/Screenshot_<timestamp>.png`. With
`-o` present, `-c` both copies to the clipboard AND saves, which is the behaviour
the previous Flameshot config aimed at: paste it into an email now, find it again
later.

**Verified in the guest, driven through the real UI:**

- The region overlay appears with annotation tools and an Accept bar — the same
  shape of flow as Flameshot, on the first-party path.
- Completing a capture produced `Screenshot_2026-08-28_08-54-59.png`, 1,162,491
  bytes, and left `image/png` on the clipboard.
- `field-inspect` reports `screenshot_capture_works 319475 bytes OK` and
  `portal_responsive yes OK`.

The Flameshot daemon autostart was removed with it. It existed only to make Print
Screen instant, cost about 16 MB per session, and issued a portal registration at
login for no remaining benefit. bird runs no daemon either. Its absence is now
asserted in the build.

## The check that hid this

`field-inspect.sh` grepped `^_launch=.*Print` across the whole file, which
Spectacle's own binding lines match. It passed for cycle35 while Print Screen was
broken. Demonstrated during this work: with nothing bound to the SP+ wrapper, that
pattern still matched 2 lines.

It is replaced by a group-scoped read plus a real capture. Both were negative
tested: removing the group reports `group_absent PROBLEM`, and binding the wrong
key reports `not_print PROBLEM`.
