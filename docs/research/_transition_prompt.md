Build task. You are on branch `session/page-transition-prototype`, already checked out and up to date with `main`. Implement the feature below completely, with real working code, committed to this branch. Do NOT touch `main`, do NOT push to origin (you have no push credentials anyway). This is a reference prototype for a senior designer to review, not a final ship — but it must actually work, build clean, and be something a person can click through in a browser.

## Project context

SecureProspective: Astro 4.11.0 + vanilla CSS (`src/styles/tokens.css`) + GSAP (ScrollTrigger) for scroll motion. No Tailwind, no font CDNs, no heavy JS frameworks beyond GSAP. 6 pages: `/` (index.astro), `/the-method`, `/the-work`, `/services`, `/the-operator`, `/contact`. Shared `src/layouts/Layout.astro` wraps every page (paste of its current full content is below). `src/components/Nav.astro` and `src/components/Footer.astro` are shared chrome rendered inside each page, not inside Layout.astro itself (each page imports and renders `<Nav />` and `<Footer />` itself, inside `<Layout>`).

Design system (`DESIGN.md` is canonical, summarized here): flat solid-color blocks, sharp near-zero corners (2px only on buttons), uppercase geometric display type (Primal font, `var(--font-display)`), body is IBM Plex Sans (`var(--font-body)`). Locked six-token color deck: `--silver-base: #E5E4E2`, `--blue-brand: #0033A0`, `--gold-identity: #D4AF37` (sparse, logo only), `--yellow-accent: #FFD700` (CTA only), `--ink: #222222`, `--white: #FFFFFF`. Motion character: fast/snappy, 120-200ms for micro-interactions, up to 300-500ms for layout/overlay/view transitions, exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`), never bouncy/elastic. **The system's signature depth move is "Card-Lift": a hard offset shadow with ZERO blur** — `box-shadow: 6px 6px 0 rgba(34, 34, 34, 0.35)` (ink-offset variant, used on `.teaser` cards against a blue background) or `box-shadow: 6px 6px 0 rgba(0, 51, 160, 0.18)` (blue-offset variant, DESIGN.md's canonical default). No soft/blurred shadows anywhere in this system, ever — that's a hard rule.

## The feature: page transitions as "card lift"

The owner's own words: *"If we could continue the card effect somehow like the entire page is one big card covering another one to reveal the next page, that would be the home run dinger that would be the WHOA."* He wants every internal navigation (Nav links, footer links, CTA buttons — any same-site link) to feel like the current page is a card being lifted off the stack to reveal the next page underneath, using the site's own existing Card-Lift shadow language, not inventing new visual vocabulary.

### Mechanism: Astro's native View Transitions

Astro 4.11 has this built in (`astro:transitions`), zero new dependency. Add `<ClientRouter />` from `astro:transitions` to `Layout.astro`'s `<head>`. This intercepts same-origin navigations, keeps the tab from a hard reload, and lets you choreograph the transition via `::view-transition-old(name)` / `::view-transition-new(name)` CSS pseudo-elements plus `transition:name` / `transition:persist` directives on elements.

### Required behavior

1. **Nav and Footer persist across navigation** — they should NOT re-animate or flicker; use `transition:persist` on them (or on a wrapping element) so they read as a fixed frame that never moves, only the content between them changes. Confirm this actually works structurally given Nav/Footer are rendered per-page (not inside Layout.astro) — you may need to give them a stable, matching `transition:name` on every page so Astro can match them across the swap, since `transition:persist` alone doesn't guarantee cross-page matching without a shared name when the elements aren't literally the same DOM node from a shared layout.

2. **The `<main>` element is the "card."** Give it `transition:name="page-card"` on every page (or animate it as the page root if that's cleaner given the persisted Nav/Footer). On navigation:
   - **Outgoing state:** the old `<main>` gets the Card-Lift shadow applied AS it leaves (ink-offset variant, `6px 6px 0 rgba(34, 34, 34, 0.35)`, since it must read on every page background — silver, blue, ink, white — and the ink-offset is the one already proven to work against a blue backdrop elsewhere in this codebase), while it translates and/or scales away — pick a specific direction and commit to it (e.g. translateY(-2%) + scale(0.98), or a slide-up-and-off; do not do a generic fade, the shadow needs real motion to read as "lifting").
   - **Incoming state:** the new `<main>` settles in from a slightly offset/scaled starting position to its resting position, losing the shadow as it lands (the shadow is a "this is mid-air" signal, it should not persist once settled).
   - **Total duration ~350-450ms**, exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`) for the incoming settle, and the outgoing motion should be equal or slightly faster than the incoming (per this system's existing rule: exits are faster than entrances).
   - Respect `prefers-reduced-motion: reduce` — fall back to Astro's default (or a simple instant swap / short crossfade), no directional motion.

3. **GSAP ScrollTrigger + hero canvas must survive route swaps cleanly.** This is the real engineering risk, read carefully:
   - `Layout.astro` currently has a `<script>` (paste below) that runs GSAP `ScrollTrigger`-driven reveals on `.reveal-word`, `.animate-in`, `.animate-item` elements, once, on initial page load. With View Transitions, navigating to a new page does NOT reload the document, so this script will not re-run automatically for the new page's content unless you explicitly re-trigger it. You must hook `document.addEventListener('astro:page-load', ...)` (Astro's lifecycle event that fires after every transition, including the very first load) and move this GSAP setup logic into that handler, AND kill any existing `ScrollTrigger` instances before creating new ones on each `astro:page-load` (`ScrollTrigger.getAll().forEach(t => t.kill())` before re-initializing) to avoid duplicate/stacking triggers across navigations.
   - `src/pages/index.astro` has its own `<script>` (paste below) driving a canvas-rendered honeycomb hero background (`#hero-fx-canvas`), using `IntersectionObserver` + `requestAnimationFrame` + a `MutationObserver` watching for visibility. This script currently runs once on `DOMContentLoaded`/immediately. It must also be re-initialized on `astro:page-load` when navigating TO the homepage, and properly torn down (cancel the rAF loop, disconnect the observers) when navigating AWAY from the homepage (`astro:before-swap` or `astro:after-swap`), or you'll leak a running animation loop drawing into a detached canvas.
   - Double-check: does `transition:persist` on Nav/Footer cause any issue with the hero canvas or ScrollTrigger elements that live inside `<main>`, which is NOT persisted? It shouldn't, since `<main>`'s contents are fully replaced each navigation, but verify this in practice, not just in theory — actually navigate between pages in a real browser and watch dev-tools console/performance for leaked observers or duplicate triggers.

4. **The chat widget** (`<ChatWidget />`, rendered inside `Layout.astro`, so it IS part of the persisted layout shell if Layout.astro itself isn't swapped — confirm whether Astro's View Transitions swaps the whole `<body>` content or if there's a way to keep Layout-level components like ChatWidget untouched across navigation; if it does get swapped/remounted, decide whether that's acceptable or whether it also needs `transition:persist`, and implement whichever is correct).

### Deliverable format

Write real, complete, working code changes to the actual files in this repo (Layout.astro, each of the 6 page files as needed, and any new CSS you add — prefer adding the view-transition CSS to `src/styles/tokens.css` or a new small `src/styles/transitions.css` imported once from Layout.astro, your call, state which you picked and why). Then:

1. Run `npm run build` and confirm it passes clean. Paste the final output in your report.
2. Run the dev server (`npm run dev`) and manually click through: `/` → `/the-method` → `/the-work` → back to `/`, confirm nothing errors in a headless/manual check if you have browser tooling available; if you don't have real browser verification available, say so explicitly rather than claiming it works.
3. Commit your changes to `session/page-transition-prototype` with a clear commit message. Do not touch `main`, do not push.
4. Write a short report to `docs/research/page-transition-prototype-notes.md` in this repo covering: what you built, exact files touched, any deviation from this brief and why, any part you're NOT confident works correctly (browser-support caveats, the transition:persist/transition:name matching behavior across per-page Nav/Footer, the ScrollTrigger/canvas teardown correctness), and what a human reviewer should specifically test by hand before trusting this.

This is a signal-gathering build, not a final decision — flag your own uncertainty rather than overclaiming it's production-ready. A senior engineer will review your diff and decide what to adopt, adapt, or discard.

When fully done, run: `touch docs/research/page-transition-prototype.DONE`

---

## Reference: current Layout.astro (full file)

```astro
---
import '../styles/tokens.css';
import '../styles/fonts.css';
import ChatWidget from '../components/ChatWidget.astro';

const { title = 'SecureProspective: Make AI native. Drop the prefix.' } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="SecureProspective is a technical business consulting firm. We make businesses AI-native: diagnose the bottleneck, position the tool, shape the output for ownership."
    />
    <title>{title}</title>
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <script is:inline>
      document.documentElement.classList.add('js');
    </script>
  </head>
  <body>
    <slot />
    <ChatWidget />
  </body>
</html>

<style is:global>
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    background: var(--silver-base);
  }

  body {
    background: var(--silver-base);
    color: var(--ink);
    font-family: var(--font-body);
    font-size: var(--text-body);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3 {
    font-family: var(--font-display);
    text-transform: uppercase;
    letter-spacing: -0.01em;
    color: var(--ink);
    line-height: 1.1;
  }

  a {
    color: inherit;
  }

  .container {
    max-width: var(--container-max);
    margin: 0 auto;
    padding: 0 var(--space-4);
  }

  .eyebrow {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    display: inline-block;
    padding-bottom: var(--space-2);
    border-bottom: 1px solid currentColor;
    margin-bottom: var(--space-5);
  }

  .btn {
    display: inline-block;
    font-family: var(--font-display);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: var(--text-body);
    padding: var(--space-3) var(--space-5);
    border-radius: var(--radius-button);
    text-decoration: none;
    cursor: pointer;
    border: 2px solid transparent;
    background: var(--yellow-accent);
    color: var(--ink);
    transition: background 120ms ease-out, color 120ms ease-out, border-color 120ms ease-out;
  }
  .btn:hover {
    background: var(--gold-identity);
  }
  .btn--ink {
    background: var(--ink);
    color: var(--ink-inverted);
    border-color: var(--ink);
  }
  .btn--ink:hover {
    background: var(--blue-brand);
    border-color: var(--blue-brand);
  }
  .btn--outline {
    background: transparent;
    color: var(--white);
    border-color: var(--white);
  }
  .btn--outline:hover {
    background: var(--white);
    color: var(--ink);
  }

  .js .reveal-word {
    display: inline-block;
    transform: translateY(12px);
  }
  .js .animate-in {
    transform: translateY(8px);
  }
  .js .animate-item {
    transform: translateY(8px);
  }
</style>

<script>
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';

  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    gsap.set('.reveal-word, .animate-in, .animate-item', { y: 0, clearProps: 'transform' });
  } else {
    const words = gsap.utils.toArray('.reveal-word');
    if (words.length) {
      gsap.to(words, {
        y: 0,
        duration: 0.2,
        ease: 'none',
        stagger: 0.08,
      });
    }

    gsap.utils.toArray('.animate-in').forEach((el) => {
      gsap.to(el, {
        y: 0,
        duration: 0.2,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
      });
    });

    gsap.utils.toArray('.animate-group').forEach((group) => {
      const items = group.querySelectorAll('.animate-item');
      if (!items.length) return;
      gsap.to(items, {
        y: 0,
        duration: 0.2,
        ease: 'none',
        stagger: 0.1,
        scrollTrigger: {
          trigger: group,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });
  }
</script>
```

## Reference: current homepage hero canvas script (src/pages/index.astro, tail of file)

```astro
<script>
  // Hero background: procedural honeycomb grid with a traveling brightness wave
  // and occasional bright "arc" cells, evoking a faint electrical pulse.
  (function () {
    var canvas = document.getElementById('hero-fx-canvas');
    if (!canvas) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ctx = canvas.getContext('2d');
    var raf = null;
    var running = false;
    var t = 0;
    var speed = 2;

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * devicePixelRatio));
      canvas.height = Math.max(1, Math.round(rect.height * devicePixelRatio));
    }

    function draw() {
      var w = canvas.width, h = canvas.height;
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);
      var r = 40 * devicePixelRatio;
      var hexW = r * Math.sqrt(3);
      var hexH = r * 2;
      var rowH = hexH * 0.75;
      var cols = Math.ceil(w / hexW) + 2;
      var rows = Math.ceil(h / rowH) + 2;
      var blue = '0, 51, 160';
      var yellow = '255, 215, 0';

      for (var row = -1; row < rows; row++) {
        for (var col = -1; col < cols; col++) {
          var x = col * hexW + (row % 2 !== 0 ? hexW / 2 : 0);
          var y = row * rowH;
          var wave = Math.sin((x / w) * Math.PI * 2 * 1.5 - t * speed) * 0.5 + 0.5;
          var brightness = 0.12 + wave * 0.35;
          ctx.beginPath();
          for (var i = 0; i < 6; i++) {
            var angle = (Math.PI / 180) * (60 * i - 30);
            var px = x + r * Math.cos(angle);
            var py = y + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
          var isArc = wave > 0.92;
          ctx.strokeStyle = isArc
            ? 'rgba(' + yellow + ', ' + Math.min(1, brightness + 0.4).toFixed(2) + ')'
            : 'rgba(' + blue + ', ' + brightness.toFixed(2) + ')';
          ctx.lineWidth = isArc ? 2 * devicePixelRatio : 1 * devicePixelRatio;
          ctx.stroke();
        }
      }
      t += 0.012;
    }

    function loop() {
      if (!running) return;
      draw();
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      resize();
      running = true;
      if (reduceMotion) { draw(); running = false; return; }
      loop();
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
    }

    canvas.dataset.fx3Booted = 'true';

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && canvas.offsetWidth > 0) start();
        else stop();
      });
    }, { threshold: 0.05 });
    io.observe(canvas);

    window.addEventListener('resize', function () { if (running) resize(); });

    if (canvas.offsetWidth > 0) start();
  })();
</script>
```

The `.hero` section markup around this canvas: `<section class="hero"><div class="hero-fx" aria-hidden="true"><canvas id="hero-fx-canvas" data-hero-fx></canvas></div><div class="container hero-inner">...</div></section>`. `.hero-fx` is `position:absolute; inset:0; z-index:0; pointer-events:none; opacity: 0.3` (set in index.astro's own `<style>` block).

Nav.astro and Footer.astro are simple shared components (nav links, sticky header with `position: sticky; top: 0; z-index: 100`; footer is a static bottom bar) — read them directly from the repo (`src/components/Nav.astro`, `src/components/Footer.astro`) for their exact current markup before wiring `transition:persist`, don't guess their structure.

Go.
