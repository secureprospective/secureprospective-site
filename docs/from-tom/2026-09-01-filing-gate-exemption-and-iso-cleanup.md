# Filing gate: JoplinBackup exemption, and SP+ ISO artifact cleanup

**Date:** 2026-09-01
**Branch:** session/sp-plus-plan
**Status:** Done. Fleet-wide behaviour change — read the first section before the next close.

> Attribution: driven by Claude on the Beelink, not by Tom. Filed here because
> `docs/from-tom/` is the established inbox convention.

## What changed

**1. `~/JoplinBackup` is now permanently exempt from the filing gate.**
Christopher's ruling, verbatim: *"WE need to stop looking at Joplin on the closes."*
It is the live backup target of a Joplin plugin, which hardcodes the path, so it can
be neither moved nor declared in `INDEX.yaml`. It had been reported as an offender on
every single session close.

- `~/.reorg/tools/check-filing.sh` gained an `EXEMPT_DIRS` list holding it. This is
  kept **separate from `ALLOWED_DIRS` on purpose**: `ALLOWED_DIRS` mirrors the
  `INDEX.yaml` contract, and Joplin is not part of that contract — it is an entry a
  running service owns, excluded by decision. Folding them together would quietly
  misstate what `INDEX.yaml` declares.
- The visible-entry target is now derived from the exemption count rather than being
  the hardcoded `22`, so it cannot drift if another exemption is added.
- The same rule was written into the `tom-session-close` and `compact-safe` skills,
  which both run this gate.

**2. `~/.reorg` is now a git repo.** These tools were not under version control at
all. It is local-only, no remote. First commit `0d1241e`. Note that the initial
commit swept in the pre-existing `.bak` files and pre-reorg backups sitting in that
directory; the content was scanned for credentials before committing and contains
none — only prose using the words "password"/"secret".

**3. Superseded SP+ ISO build artifacts deleted — 10.2 GB reclaimed** (`/home` 78% →
76%). Both `projects/sp-plus/artifacts/spikeB-rootful/out/` trees, in
`~/work/sp-plus-build` and `~/work/secureprospective-advisor-os`. Both were
git-ignored and regenerable, and root-owned by the rootful podman build, so they had
to be removed *through* rootful podman. Recorded in `~/MOVED.md`,
`~/archive/MANIFEST.md` and CT105's `backbone/context.md`.

## Why

Two standing rules of Christopher's, applied: a gate that reports the same
known-permanent condition on every run trains its reader to skim past it, which is
the one thing a gate must not do; and disk left full of regenerable 5 GB artifacts is
not good stewardship.

## Verification

- `check-filing.sh`: **PASS**, exit 0, 23/23 entries.
- **Mutation-tested**: a stray directory created at `~` is still named, with exit 1,
  then passes again once removed. The exemption did not disable the check.
- `config-preflight.sh`: 28 passed, 0 failed.
- The kept ISO was proved byte-identical (`cmp`) to the build output **before** that
  output was deleted.

## Open items / what Claude or Christopher should check

- **The LAN registry still holds `test44`–`test47`.** Pruning old tags is deliberately
  not done: an installed machine pointed at a tag you delete loses its update target.
  The Dell is on `test47` with `test46`/`test45` as rollback.
- **`.npm` is new at `~`** since the dotfile baseline. Review, then re-baseline — the
  gate reports this as a note, not a failure, by design.
- `~/.reorg` has no remote. If these tools should live somewhere backed up, that is a
  decision for Christopher.
