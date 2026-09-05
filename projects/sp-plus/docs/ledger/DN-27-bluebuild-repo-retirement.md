# Retiring the BlueBuild repo `secureprospective/sp-plus-kde`

**Date:** 2026-09-05 · **Status:** content rescued; repo safe to delete once the registry question below is settled.

## What the repo was

A [BlueBuild](https://blue-build.org) template repo created to build SP+ as a custom Fedora Atomic
image. SP+ was not ultimately built this way — the shipping image is built from
`projects/sp-plus/images/kde/Containerfile` in this repo, `FROM quay.io/fedora/fedora-kinoite` by
digest. The BlueBuild repo was 16 tracked files, 12.6 KiB of packed objects, and its history
contains no deleted files: what was there at the end is everything that was ever there.

## Why it had to go

Its workflow built a stock `fedora-kinoite:44` carrying an SP+ description string — none of SP+ in
it — and pushed it every morning at 06:00 UTC to `ghcr.io/secureprospective/sp-plus-kde:latest`,
**the exact tag every installed SP+ machine pulls updates from**. Installed machines were offered
the unrelated image as a system update; being chronologically older, `rpm-ostree` refused it and
Discover showed an error. Because the push was on a daily cron, any correct image published to the
tag was overwritten the next morning — which is why the update path stayed broken across repeated
fix attempts. The workflow was disabled 2026-09-01 (commit `5e7fab5`, two independent stops:
`workflow_dispatch`-only trigger plus `if: false` on the job).

## What was rescued, and to where

Three files existed **nowhere else** and are now in `projects/sp-plus/docs/ledger/`, each carrying a
provenance header naming its original path:

| From the BlueBuild repo | Now at | Size |
|---|---|---|
| `docs/sp-plus-welcome-research.md` | `docs/ledger/sp-plus-welcome-research.md` | 28 KB |
| `docs/sp-plus-welcome-pi-cloud-research.md` | `docs/ledger/sp-plus-welcome-pi-cloud-research.md` | 22.7 KB |
| `HANDOFF.md` | `docs/ledger/HANDOFF-2026-08-28-sp-plus-welcome-pi.md` | 1.6 KB |

The handoff was renamed rather than copied as `HANDOFF.md` so it cannot be mistaken for a live
baton. It carries the Pi-guardrail direction and a "Tried and rejected" section — random launch-time
Fin tips, a distro Welcome fork, and a prompt-only guardrail for a cloud Pi executor — which is the
expensive-to-rediscover part.

`docs/fin-coaching-tips-discovery.md` was **not** rescued: it is byte-identical (`diff -q`) to
`projects/sp-plus/docs/ledger/fin-coaching-tips-discovery.md`, which already existed here.

## What was deliberately not rescued

BlueBuild template scaffolding with nothing of ours in it: `recipes/recipe.yml` (the stock
kinoite-44 recipe), `.github/workflows/build.yml` (the disabled workflow — quoted above and in
`scripts/publish-image.sh`), `files/scripts/example.sh` (template sample), three `.gitkeep`
placeholders, `.gitignore`, `LICENSE` (Apache 2.0, BlueBuild's), `README.md` (BlueBuild template
text), `.github/dependabot.yml`, and `.github/CODEOWNERS`.

Note on that last one: CODEOWNERS read `* @xynydev @fiftydinar` — the upstream BlueBuild
maintainers, inherited from the template and never changed. They were codeowners on a repo in the
`secureprospective` org for its whole life. Deleting the repo ends that; no action needed beyond
knowing it was so.

`cosign.pub` in that repo is **not** the SP+ signing key — different key entirely. SP+ signs with
`~/.config/sp-plus-signing/` (private key local to the Beelink, never in any repo), and
`publish-image.sh` verifies against that. Nothing in SP+ verifies against the BlueBuild key.

## The one real coupling: the registry namespace

**The GitHub repo is deletable. The GHCR package of the same name is production infrastructure and
must survive.**

`ghcr.io/secureprospective/sp-plus-kde` is baked into every installed machine — the kickstart runs
`bootc ... --target-imgref ghcr.io/secureprospective/sp-plus-kde:latest`
(`installer/interactive-defaults.ks:67`), and `scripts/publish-image.sh:20` defaults `REPO` to it.
Renaming is not an option without a `bootc switch` on every installed machine.

Registry state verified live 2026-09-05 — the package is public and **already clean**:

| Tag | Created | blue-build markers |
|---|---|---|
| `latest` → `sha256:ca2fad9e…` | 2026-09-02T01:37Z | none |
| `20260902b` | 2026-09-02T01:37Z | none |
| `20260902` | 2026-09-02T01:10Z | none |
| `testlane` | 2026-09-02T01:37Z | none |

All four carry `org.opencontainers.image.title=SP+`, description `SP+ Advisor OS — KDE image-mode
payload`, and zero BlueBuild labels. `latest` matches the digest recorded as proven-good in
`RESUME-2026-09-02-update-lane-proven.md`. The bad BlueBuild image is on no tag; if an untagged
version of it still shows in the GitHub package UI, it can be deleted there.

**Before deleting the repo, settle this:** a GHCR package created by a repo's workflow is normally
owned by the *organization* and survives that repo's deletion, but its access can be inherited from
the linked repo. That inheritance is what needs checking in the package's own settings — it was not
verifiable from here (no `gh` CLI and no API token on either machine), and it is the single thing
that would break the fleet if it goes wrong. Confirm in the GitHub UI, on the package page for
`sp-plus-kde`, that the package has an owner/admin that is **not** the repo about to be deleted —
then delete the repo.
