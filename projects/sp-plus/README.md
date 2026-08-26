# SP+

SP+ is the Secure Prospective advisor workstation: a free, immutable, preconfigured
Linux operating system distributed to eligible members. This directory is the SP+
subproject.

**Current status: research and planning. Nothing here is authorized to be built.**

The 2026-08-25 build attempt produced a proof-of-concept ISO that is not usable by the
general public. That work is retained where it is useful and its lessons are recorded.
The planning set below is the corrected plan of record, and the next action is Phase 0
of document 3, not more building.

## The planning set

Read in order. Each document assumes the ones before it.

| # | Document | What it settles |
|---|---|---|
| 1 | [`docs/01-PRODUCT-DEFINITION.md`](docs/01-PRODUCT-DEFINITION.md) | Who the user is, why they would use SP+, what it must do on day one, and what success means |
| 2 | [`docs/02-DISTRIBUTION-ARCHITECTURE.md`](docs/02-DISTRIBUTION-ARCHITECTURE.md) | **How to build and maintain a distribution.** The four real options, the verified fact base, the recommendation, and the Secure Boot and encryption constraints that shape everything else |
| 3 | [`docs/03-ISO-BUILD-PLAN.md`](docs/03-ISO-BUILD-PLAN.md) | The phased build plan from empty repository to a plug-and-play ISO, with a blocking gate on every phase |
| 4 | [`docs/04-MAINTENANCE-AND-RELEASE.md`](docs/04-MAINTENANCE-AND-RELEASE.md) | The multi-year operating model: channels, signing, Fedora version migration, support, cost, and the discontinuation plan |
| 5 | [`docs/05-POSTMORTEM-ANTIPATTERNS-AND-BRANDING.md`](docs/05-POSTMORTEM-ANTIPATTERNS-AND-BRANDING.md) | What went wrong on 2026-08-25 and why, 28 numbered anti-patterns, and the Fedora trademark obligations |
| 6 | [`docs/06-OPEN-QUESTIONS-AND-DECISIONS.md`](docs/06-OPEN-QUESTIONS-AND-DECISIONS.md) | Decisions of record (D1–D20), open questions with owners (Q1–Q11), and the facts to re-verify before building |

Supporting records:

- [`docs/07-PARALLEL-REVIEW-AND-DEBATE.md`](docs/07-PARALLEL-REVIEW-AND-DEBATE.md) — the independent parallel research pass and where the two analyses agreed and disagreed
- [`docs/RENAME-LOG-2026-08-25.md`](docs/RENAME-LOG-2026-08-25.md) — the Advisor OS → SP+ old/new mapping
- [`docs/SESSION-LOG-2026-08-25.md`](docs/SESSION-LOG-2026-08-25.md), [`docs/LIVE-TEST-LOG-2026-08-25.md`](docs/LIVE-TEST-LOG-2026-08-25.md) — the first build attempt's own record, kept unedited
- [`docs/ACCEPTANCE.md`](docs/ACCEPTANCE.md) — the printer acceptance sequence
- `../../briefs/sp-plus-build-brief.md` — the original product baseline
- `../../docs/SP_PLUS_LANDING_CONTENT.md` — positioning copy, disclaimers, and the approved-vs-banned language table

## The one-paragraph answer to "how do we do this?"

Build SP+ as a **bootc image derived from the official Fedora Atomic Desktop bootc base
images** (`quay.io/fedora/fedora-kinoite:44` for the KDE edition,
`quay.io/fedora/fedora-silverblue:44` for GNOME), defined entirely by a Containerfile in
git, built in CI, signed with cosign, and published to a container registry that
installed machines update from with `bootc`. Do **not** ship a captured disk image, and
do **not** assemble a desktop from the minimal `fedora-bootc` base. Get the encrypted,
Secure-Boot-clean install working first with an `anaconda-iso`, then replace the install
experience with a live ISO and a branded graphical installer for the public release. A
hand-configured prototype VM is a good way to discover what the image should contain and
a terrible way to ship it: transcribe every discovery into the Containerfile and throw
the prototype away.

## What is in this directory from the first build pass

`Containerfile`, `installer/`, `config/`, `runtime/`, `pwa/`, `knowledge/`,
`playbooks/`, `scripts/`, and `tests/` are the 2026-08-25 proof of concept, renamed to
SP+. Document 3 §9 records which parts survive into the new plan and which are
discarded. In short: the knowledge base, the PWA, the RPC boundary, and the printer
workflow are keepers; the `fedora-bootc:43` base, the Docker build path, and the generic
installer ISO are not.

`./scripts/test-host.sh` still passes after the rename.

Never put API keys, recovery keys, signing private keys, client data, or real printer
credentials in this directory.
