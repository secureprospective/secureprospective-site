# Concept A promoted to production; mobile and post-navigation defects closed

**Date:** 2026-09-02
**Branch:** `main` (see note under Deviations — this did not go through a review branch)
**Status:** Shipped and live on https://secureprospective.com. Ready for review after the fact.

## What changed

- **The five marketing pages plus the home page were redesigned and promoted** from
  `concepts/a-immersive/` into `src/`. The four shared stylesheets were already
  byte-identical between the two trees, so the promotion added `immersive.css` and the
  per-page stylesheets rather than altering anything the site already had.
- **The member portal was deliberately left alone.** `/members` (login, admin,
  accept-invite, change-password) runs against a Functions backend, the concept had none
  of it, and a straight swap of `src/` would have taken it offline. Its pages style
  themselves, so nothing they depend on moved. `ChatWidget` and `MethodWidget` are kept.
- **The layout stopped shipping its generation scaffolding.** `THESIS`, `OWN-WORLD`,
  `FIRST VIEWPORT` and `FORM` notes, plus a reference to another project's "shipping
  raster", were readable in the live page source of every page.
- **A 404 page was added**, which production did not have.
- **Whole-site mobile sweep**: 676 element-level findings closed at 390/360/320. 519
  labels below a 12px floor (fixed centrally, not per page), 115 tap targets under
  44x44, 21 decorative overflows, 18 crowded controls, 3 column collisions.
- **Two invisible labels fixed on The Operator**, both at 1.00:1 contrast: an eyebrow
  yellow-on-yellow, and a station heading blue-on-blue. Both came from a variant
  restating a colour decision it had already made elsewhere and one restatement falling
  out of step. Fixed structurally so a future variant cannot reintroduce them.
- **The mobile menu died after the first navigation** (reported from a real phone).
  `Nav.astro` bound its handler once at module evaluation; View Transitions swap the
  header, so the button holding the listener was discarded. Binding moved to
  `astro:page-load` with a guard against double-binding, Escape moved to the document and
  bound once, and the menu now closes on `astro:before-swap`.
- **Four new gates** in `concepts/tools/`: `density.mjs` (composition), `contrast.mjs`
  (WCAG AA plus the brand yellow-on-light rule), `afternav.mjs` (what breaks only after
  navigating), and the mobile/nav audits extended. `motion.mjs` now rejects an unexpected
  argument, which had been silently auditing the same page six times.
- **`docs/VOICE-AND-DIRECTION.md`** records the positioning, voice rules, directional
  latitude, per-page briefs and the engineering doctrine this work paid for.
- The merge also carried the earlier **OpenCode retirement** (148 file deletions under
  `.opencode/`), which was already sitting on the branch.

## Why

Christopher asked for the concept rolled across the site with each page carrying its own
message, then for a full mobile sweep ("we have to get the mobile up and going and 100%"),
then reported the menu bug from his phone, then asked for the site to go live and for the
session's reasoning to be written down.

## Verification

- `astro build` clean: 12 pages, portal included. All 9 live routes return 200.
- Gates against the **live domain**: mobile 390/360/320, contrast, density, afternav,
  mobilenav, divergence, and motion 10/10 on each of the six pages.
- Every gate was proven able to fail against a deliberately broken build before being
  trusted. Three of them originally passed the site while being structurally incapable of
  failing, which is why this is now standard practice and recorded in `concepts/tools/README.md`.
- **`npm test`: 139 pass, 3 files fail.** The failures are `better-sqlite3` refusing to
  self-register — a native module built 2026-08-26 against a different Node than the
  current v24.20.0. Pre-existing and unrelated: no `src/lib/`, test, or TypeScript file
  outside two Astro `env.d.ts` shims was touched in the entire merged range. A rebuild was
  attempted; `prebuild-install` has no matching prebuild and the network fetch timed out.

## Deviations from the normal close

- **This went to `main` and to the live domain directly**, on Christopher's explicit
  instruction ("push the page to main live secureprospective.com"). Live deploys normally
  require his per-deploy approval, which this had; the usual "open a branch and let
  someone review" step was consciously skipped by him, not by me.
- The merge was a clean fast-forward of 17 commits; `main` had not moved.

## Open items / what Claude or Christopher should check

1. **Nothing has been tested on real hardware.** No iPhone, Android, Safari or Firefox.
   Every result above is headless Chromium. The one defect that reached a human first was
   found on a real phone, so this is the live gap.
2. **`better-sqlite3` is broken locally** and will stay broken for anyone running the test
   suite on this machine until it is rebuilt against Node 24. It does not affect the site.
3. **The `/members` portal was verified only as far as HTTP 200** on `/members/` and
   `/members/login`. Nobody logged in. If the portal matters this week, someone should
   sign in once and confirm the flow still works behind the new layout.
4. `concepts/b-radical` (the "Signal Room" direction) is still in the tree. Christopher
   liked it but ruled it off-mark for the ICP. It is not referenced by the live site and
   is a candidate for archiving rather than deletion.
