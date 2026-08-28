# DN-30 — the screenshot portal permission is keyed per app id

**Status:** settled, verified on the cycle36 UEFI guest, 2026-08-28.

## The decision

`spplus-first-login` grants the screenshot portal permission for **every app id
the shipped launchers can produce**, not just the empty one, and overwrites a
stale `no`. Granting `""` alone is not enough and never was.

## Why

Print Screen was firing correctly the whole time. KWin started
`app-flameshot-capture@.service` on the key press, Flameshot ran, and exited 2:

```
flameshot: error: Unable to capture screen
flameshot: info: Screenshot aborted.
```

No prompt, no window, nothing an advisor could act on.

`xdg-desktop-portal` keys this permission by the requesting process's **app id**,
which it derives from that process's systemd app scope. first-login granted only
the empty app id. The shortcut-launched process asks as `flameshot-capture`,
which was unmatched — and on the guest had been recorded as an explicit `no`, so
every capture failed silently.

The permission store, read back on the guest:

```
({'': ['yes'], 'flameshot-capture': ['no']}, <byte 0x00>)
```

Flipping `flameshot-capture` to `yes` made Print Screen open the Flameshot
overlay with no prompt. That is the whole defect and the whole fix.

## What this corrects

`DEFECT-portal-screenshot-wedge.md` is **REFUTED**. There is no portal wedge.
The portal was answering correctly and denying a request that had been recorded
as denied. See that file's header for the correction.

## The gate that let this ship

`field-inspect` matched a bare `'yes'` anywhere in the `Lookup` reply, so it
reported `screenshot_portal_permission granted OK` against exactly this broken
state. It now requires `'flameshot-capture': ['yes']` specifically and names an
explicit denial separately. A gate that cannot distinguish the working state
from the broken one is not a gate.

## Numbering note

The implementing commit `5342130` labels itself **DN-25**. That is wrong: DN-25
is *Fin must be plug and play*. This decision is DN-30. The commit message was
not rewritten, because rewriting shared history to fix a label is a worse trade
than recording the correction here.
