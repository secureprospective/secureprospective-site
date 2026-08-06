# Page Transition ("Card-Lift") Prototype Notes

Status: **signal-gathering prototype, not a final decision.** Built for a senior
designer to review and decide adopt/adapt/discard. Verified in a real headless
Chromium across every internal navigation path, but **not** verified in a human's
eye on a real display — treat the motion feel as unvalidated until hand-checked.

Branch: `session/page-transition-prototype` (not pushed, `main` untouched).

---

## What was built

Same-site internal navigation now runs through Astro's built-in View Transitions
(`<ViewTransitions />`, zero new dependencies). The whole page is treated as a
stack of cards: the current `<main>` lifts off with the system's Card-Lift
ink-offset shadow appearing as it leaves, and the next page's `<main>` settles in
from below, the shadow fading out as it lands. Nav and footer stay as a fixed
frame (no re-animation, no flicker).

- **Outgoing card:** 320ms, `translateY(-3%) scale(0.99)`,
  `box-shadow: 6px 6px 0 rgba(34,34,34,0.35)`.
- **Incoming card:** 420ms, `translateY(6%) scale(0.985)` -> rest,
  shadow fades to zero as it lands.
- All easing `cubic-bezier(0.16, 1, 0.3, 1)` (system exponential ease-out).
- Out is faster than in (320 < 420), per the system rule "exits beat entrances."
- Directional keyframes are gated behind `@media (prefers-reduced-motion: no-preference)`;
  reduced-motion users get Astro's plain instant-content-swap fallback.

## Files touched

| File | Change |
|---|---|
| `src/styles/transitions.css` | **new.** All `::view-transition-*` choreography (card-lift keyframes, static nav/footer, reduced-motion gate). |
| `src/layouts/Layout.astro` | Import `transitions.css` + `ViewTransitions`; render `<ViewTransitions />` in `<head>`; **refactored the GSAP script into an `astro:page-load` handler** that first does `ScrollTrigger.getAll().forEach(t => t.kill())` + `clearProps`, then re-runs the reveals. |
| `src/pages/*.astro` (all 6) | `<main transition:name="page-card">` on every page. |
| `src/components/Nav.astro` | `<header class="nav" transition:name="app-nav">`. |
| `src/components/Footer.astro` | `<footer class="footer" transition:name="app-footer">`. |
| `src/components/ChatWidget.astro` | `<div id="cw-root" transition:persist>` keep it mounted (and keep chat state) across navigations. |
| `src/pages/index.astro` | Hero canvas refactored to `boot()` on `astro:page-load` + `teardown()` on `astro:before-swap` (cancel rAF, disconnect observers). |

## Why a separate `transitions.css` (not `tokens.css`)

`tokens.css` is the design-token contract (colors/type/spacing). View-transition
pseudo-element rules are interaction chrome with their own browser-support
caveats. A separate file means it can be deleted wholesale if the prototype is
discarded, without disturbing the token contract.

## Key decisions and deviations from the brief

1. **Nav/Footer use `transition:name` + `animation: none`, NOT `transition:persist`.**
   This is a deliberate deviation, and the important one. `transition:persist`
   makes Astro reuse the *old* DOM node verbatim, so the `.active` nav-link class
   would go stale on navigation (navigate to /the-work and "The Method" stays
   blue). Astro's own swap code confirms this: `swapBodyElement` replaces the new
   element with the old persisted one. Matching `transition:name` ("app-nav" /
   "app-footer" — identical across pages because they're the same compiled
   component) lets the browser group them as named snapshots, while the
   `animation: none` rule keeps them visually static. Crucially, because they're
   named but not persisted, the DOM content still swaps underneath, so the active
   link updates correctly (verified in browser). Persist is reserved for
   ChatWidget, which genuinely must not lose in-memory state.

2. **`<main transition:name="page-card">` on all 6 pages** — the card. Per-page
   DOM gets its own scope hash but the *name* is shared, so the browser matches
   old/new mains by name across the swap.

3. **Hero canvas**: `astro:page-load` drives a fresh boot per arrival (the
   module is cached across navigations so the old load-time IIFE would never have
   re-run); `astro:before-swap` tears down the running loop before the detached
   canvas path can leak. Addressed the brief's intersection-observer/performance
   concern.

## Build

`npm run build` passes clean — 6 pages in ~1s, no warnings/errors. Final tail:

```
20:39:07 ▶ src/pages/the-operator.astro
20:39:07   └─ /the-operator/index.html
20:39:07 ✓ Completed in 28ms.
20:39:07 [build] 6 page(s) built in 1.32s
20:39:07 [build] Complete!
```

## What I actually verified (real browser, headless Chromium)

Drove the already-installed Chromium via `playwright-core` (dev dependency not
added — loaded ad hoc, `--no-save`, not part of this diff). Results, no console
errors and no page errors across all of these:

- Nav-click walk `/ -> /the-method -> /the-work -> /services -> /the-operator ->
  /contact`, then logo back to `/`, then to `/the-method`, then home.
- Browser **back/forward** history traversal.
- **Direct URL load** of a subpage.
- `view-transition-name` resolves to `page-card` (main), `app-nav`, `app-footer`
  on **every** page; ChatWidget has `data-astro-transition-persist` on every page.
- Hero canvas: `canvasPresent` + `canvasBooted="true"` after returning home both
  via the logo and via history-forward. No detached-loop symptoms.
- GSAP reveals re-run after each navigation: first `.reveal-word` transform is
  `matrix(1,0,0,1,0,0)` (identity, i.e. animated out of the 12px pre-state) with
  `anyStuckWord: false` after repeated home<->method and history-back arrivals.
- Nav active state correct after transitions (active = the just-visited link).
- Reduced-motion emulation: navigation still swaps content, no errors.
- Mobile (375px) viewport: burger opens, navigating works, menu correctly resets
  after real navigation.

## What I am NOT confident about (please check by hand)

These need a human, ideally with dev-tools Performance panel open, on a normal
Chrome:

1. **Whether the shadow + panel read as a convincing "lift" rather than two
   blocks sliding past each other.** The mechanics are wired and verified, but
   the *feel* is exactly what this prototype is for. The outgoing group and the
   body background (silver) sit between nav and footer; on a page whose sections
   are full-bleed color (blue/ink), a soft gap may flash where the silver body
   bleeds through as the card moves. If that looks hollow, tune the translateY %
   or give the card ghost a wash. This is the single most likely thing a senior
   designer will want changed.
2. **Frame-rate smoothness of the fixed-position footer/chat during the swap.**
   `transition:persist` (chat) and `transform` roots may rasterize unevenly in
   real browsers; headless wouldn't show it.
3. **View Transitions browser support.** This only reaches the custom choreography
   in Chromium (Chrome/Edge) and Safari 18+. Astro's fallback (`animate`, and the
   `prefers-reduced-motion` gate) covers older/web/variance, but confirm Firefox's
   current state before ever trusting a live-site ship.
4. **Sticky header + scroll restoration** with the transition. Astro restores
   scroll; I clicked mostly at top-of-page. A reviewer should trigger nav while
   scrolled deep on a long page and confirm no jarring scroll jump mid-swap.
5. **The `.nav` mobile menu now closes on every navigation** (it is no longer
   persisted). That is intended/life-correct behavior for a real page change, but
   worth a conscious ack.
6. **The nav `<header>` re-render** resets any open mobile menu — expected, noted.

## What a human reviewer should test by hand

1. Open dev-tools Performance, click `/ -> /the-method -> /`, watch for any
   detached-canvas rAF (should be none) and confirm zero duplicate ScrollTriggers.
2. Feel the lift with real motion on a normal monitor, both directions, and a
   long-page scroll-start.
3. Back/forward buttons repeatedly.
4. Open the chat widget, type a question, navigate away and back — state should
   persist (that's `transition:persist` doing its job); if instead the chat resets
   after nav, that's a sign persist didn't match and needs the id check.
5. Emulate `prefers-reduced-motion` in dev-tools and confirm no directional
   motion.

---

Build environment note: this lane is the Beelink DeepSeek routine-edit clone;
there is no Claude/Judgment edge here, so the visual direction was bounded to the
brief exactly (single committed direction, zero blur, ink-offset shadow) rather
than exploring variants.