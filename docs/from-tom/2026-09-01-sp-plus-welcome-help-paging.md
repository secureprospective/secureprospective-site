# SP+ Welcome: help paging, reachability gate, ISO 0721 on the Dell

**Date:** 2026-09-01
**Branch:** session/sp-plus-plan
**Status:** Ready for review. Shipped and running on the Dell test rig.

> Attribution: this session was driven by Claude on the Beelink, not by Tom.
> The note lives here because `docs/from-tom/` is the established inbox
> convention; the work and the commit are Claude's.

## What changed

- **Long help categories are now paged.** The manual grew to 34 guides across 7
  categories. The help panel does not scroll by design, so a category holding ten
  guides overflowed by 151px at 1024x768 and silently swallowed the bottom rows.
  Category lists now page six at a time using the same `.help-pager` component the
  article reader already used ("GUIDES 1-6 OF 10" / "MORE GUIDES").
- **The search view was rebuilt to fit.** With seven categories, the results grid
  plus the browse rail overflowed by up to 77px. Results are now compact tiles and
  the browse rail is wrapping chips rather than a second grid of cards.
- **The corpus gate now proves reachability.** Paging introduced a defect of its
  own: guides on page two had no route to them. The gate did not notice, because it
  only ever walked the first page. It now reads every page of a category before
  walking it, opens each guide by title rather than by index, and fails when the
  number of guides reachable by clicking does not equal the number the corpus ships.

## Why

Christopher's standing goal for the session was to finish the Welcome app to
production quality and put an ISO in `~/Downloads`, with GPT writing the in-app
advisor manual in parallel. The manual tripled in size, which is what exposed these
layout failures — they did not exist at 17 articles.

## Verification

Run against the **installed** app on the Dell (`/usr/libexec/sp-plus/welcome`),
booted on the new image, not against the source tree:

- corpus, layout, search and service-link gates: **all PASS**, 34 articles installed.
- The reachability assertion was **mutation-tested**: removing the next-page button
  drops reachability to 28 of 34 and the gate fails. It can fail.
- `config-preflight.sh`: 28 passed, 0 failed, clean tree.
- **Observed running on hardware.** Launched via `/usr/bin/spplus-welcome` on the
  Dell's live Wayland session and screenshotted. Welcome 01 renders correctly at
  1920x1080; screen 03 shows "GUIDES 1-6 OF 10" with MORE GUIDES, nothing clipped.

Artifacts: `~/Downloads/sp-plus-2026-09-01-0721.iso` (5,498,116,096 bytes, sha256
begins `a6a35db6c640`), built from `a6fa5b3`. Same payload pushed to the LAN registry
as `192.168.1.190:5000/sp-plus-kde:test47`, digest
`sha256:74ce8222bb81bf8d291087b3a1a4ebe536ed03bb98cbb279830fff96d339f3f7`, now the
booted deployment on the Dell with test46/test45 intact beneath it as rollback.

## Open items / what Claude or Christopher should check

- **Nobody has clicked through all eight screens on the Dell as an advisor would.**
  Everything above is rendering plus gates. Connecting a service, applying a theme
  and reading a guide end to end on that machine is still unproven.
- **Key-based SSH is broken on both test rigs.** The VM refuses publickey even for a
  freshly added, correctly SELinux-labelled `authorized_keys`; the Dell is
  unreachable directly from the Beelink and had to be driven via CT105. Two machines
  with the same symptom is probably not coincidence, but there is no evidence yet for
  a common cause and it was not chased.
- **The manual is 34 of ~43 planned articles.** GPT ran out its five-hour window with
  roughly nine rows still TODO in `docs/HELP-CORPUS-LEDGER.md`. The generator merges,
  so the remainder can be added without regenerating what exists.
- `192.168.1.124` answers ping via router proxy-ARP even when the Dell is down. Do
  not treat a successful ping to it as evidence the Dell is up.
