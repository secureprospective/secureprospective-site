# Phase T2.2 — Flathub restricted to the verified subset

**Date:** 2026-09-11
**Branch:** `session/sp-plus-defense-in-depth`
**Commit:** `0cac9b1`
**Image:** `localhost/sp-plus-kde:t22` (`ad2a1f2cfc2b`)
**ISO:** `artifacts/t22-iso/.../bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso`
`sha256 83c6b16243857147fe098641145d2602c6fb51db8bcf84d63eeaca0a243e4686`

> **Artifact reconciliation, added 2026-09-11.** That checksum names an ISO that no
> longer exists, and it is not the artifact anything ships from. Three t22 ISOs were
> built:
>
> | Build | ISO sha256 | Payload image id |
> |---|---|---|
> | 00:08 | `92413e07…` | `ad2a1f2c…` |
> | 00:46 | `83c6b162…` | `c8a708b8…` |
> | 02:36 | `9347752c…` | `c8a708b8…` |
>
> **Builds two and three carry the same payload image id**, so the OS content is
> identical and only the ISO wrapper differs; build three exists solely because it is
> the first t22 ISO carrying a `payload.env` sidecar. ISO builds are not byte
> reproducible, so the same image yields a different ISO checksum each time.
>
> The first-boot race described below was found on **build one** (`ad2a1f2c`) and fixed
> in the image that became `c8a708b8`. Both t22 ISOs have since been reaped.
>
> **The control does not rest on any of them.** It is re-verified on the shipped t28
> artifact, on a genuine first boot (`journalctl --list-boots` showing index 0 only):
> `After=flatpak-add-fedora-repos.service` is present in the shipped unit, the unit
> exited 0 on that boot, `xa.noenumerate=true` is set, and the ordering dependency is
> live. Read the t28 entry as the artifact of record; read this checksum as history.
**Roadmap row:** doc 15 §7 move 4, Tier 2 control T2.2

## What the control does

Flathub carries 3,458 applications and vouches for none of them. `Subset=verified`
restricts the remote to the 2,186 applications published by their own vendor. It also
removes Zoom, Signal, Slack and VLC. Two of those are buttons on SP+'s own Optional
Tools screen, and Welcome hardcoded the `flathub` remote, so the subset alone would
have silently broken the Zoom and Signal install buttons.

The shipped design is two remotes over one URL:

| Remote | Subset | Visible in Discover | Used by |
|---|---|---|---|
| `flathub` | `verified` | yes | the advisor browsing for software |
| `flathub-vouched` | none | no (`no-enumerate`) | Welcome, by application id only |

The advisor browsing for software sees only vendor-verified applications. Welcome
installs Zoom and Signal by name from the hidden remote. SP+ vouches for exactly
those two, by name, and that is the substance of decision D48.

## Mechanisms, and why each one

`Subset=` is a valid `.flatpakrepo` key and is honoured. `NoEnumerate=` is not a key;
the parser accepts only `Subset`, `Filter`, `NoDeps` and `DefaultBranch`. Hiding a
remote is therefore a runtime act, performed by `spplus-flatpak-remotes.service`.

Designs tested and rejected by measurement, not by argument:

- **`flatpak remote-modify --filter`** registers the filter and does not enforce it.
  The remote still enumerated 3,458 applications and still installed VLC.
- **A disabled remote** is fully inert. Welcome cannot install from it either.
- **`NoEnumerate=` in the repo file** is silently ignored, as above.

`--no-enumerate` applied at runtime is the only mechanism that hides a remote while
leaving it usable by name.

## The first-boot race

Found by measurement and fixed here. On the first boot of the first t22 install,
`xa.noenumerate` was never applied, so the software centre would have shown all
3,458 applications.

Fedora's `flatpak-add-fedora-repos.service` (pids 1087 and 1273) and
`spplus-flatpak-remotes.service` (pid 1094) both started at 20:41:04 and both wrote
`/var/lib/flatpak/repo/config`. Fedora's wrote last, from a copy read before ours
had modified it, and dropped the flag. **Both units logged success and
`systemctl --failed` was empty.** Every subsequent boot the flag stuck, which is
exactly why a second-boot test would have called this green.

The fix is `After=flatpak-add-fedora-repos.service` plus a read-back retry loop that
exits non-zero, so the unit fails loudly rather than lying.

## How the remote gets created, and the durability limit

libflatpak scans `/usr/share/flatpak/remotes.d`, creates each remote **once**, and
records the name in `xa.applied-remotes` so it is never re-created:

```
xa.applied-remotes=flathub-vouched;flathub;
```

Two consequences, both measured:

1. **Upgrades are covered.** An existing SP+ install does not yet carry
   `flathub-vouched` in `xa.applied-remotes`, so the remote is created on the next
   flatpak operation after the image update. Our unit's own `remote-modify` is such
   an operation, and its retry loop absorbs the ordering.
2. **A deleted remote never returns.** The name stays in `xa.applied-remotes`, so a
   reboot does not restore it. Observed directly: after mutation B the remote was
   still absent after a full reboot. On an advisor machine this is out of reach,
   since deleting it requires root, but it is a real limit and is recorded rather
   than assumed away.

## Evidence

First boot of the t22 install, `journalctl --list-boots` showing index 0 only:

| Measurement | Result |
|---|---|
| Runtime posture gate | 48 of 48, `RUNTIME_POSTURE_OK` |
| Failed units | 0 |
| `flathub` subset | `verified` |
| `flathub-vouched` options | `system,no-enumerate` |
| Applications the vouched remote lists | 0 |
| Optional Tools resolving from their shipped remote | 4 of 4 |
| `spplus-flatpak-remotes.service` | active, exit status 0 |

## Mutation tests — red before green

Both run against the booted install, both produced measured values rather than
absence.

**Mutation A** — cleared the subset and set `xa.noenumerate=false`:

```
FAIL  flathub restricted to verified      subset=-
FAIL  vouched remote not browsable        system
FAIL  vouched remote enumerates nothing   3458 listed
passed=45 failed=3
```

The count is the point. It names the real consequence: the advisor's software
centre listing every unvetted application on Flathub.

**Mutation B** — deleted the vouched remote entirely:

```
FAIL  vouched remote not browsable        <remote absent>
FAIL  vouched remote enumerates nothing   remote absent, so nothing was measured
FAIL  optional tools all resolve          unresolvable: us.zoom.Zoom org.signal.Signal
passed=45 failed=3
```

This mutation exists because an earlier version of the enumeration assertion passed
on a machine with no such remote — an absent remote lists zero applications exactly
as a hidden one does. The guard added for that defect fired here with its intended
message. The third failure proves Welcome genuinely depends on the vouched remote
rather than merely mentioning it.

## Open

- **D48 awaits ratification:** SP+ vouching by name for Zoom and Signal. The
  mechanism is built and measured; the editorial commitment is Christopher's.
