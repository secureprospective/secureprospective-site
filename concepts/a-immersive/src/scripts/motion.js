/* ==========================================================================
   CONCEPT A — motion system.

   One controller for the whole page. Everything it does is additive: with
   JavaScript disabled, or with prefers-reduced-motion set, the page is still
   complete, legible and fully navigable. Nothing is hidden by default in a way
   that only script can reveal — the deal-in styles live behind the
   no-preference media query precisely so that reduced-motion users are never
   left staring at an invisible page.
   ========================================================================== */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Everything registered here is torn down on Astro's before-swap. */
let teardowns = [];

const onCleanup = (fn) => teardowns.push(fn);

function cleanup() {
  teardowns.forEach((fn) => {
    try {
      fn();
    } catch {
      /* a failing teardown must never block the rest */
    }
  });
  teardowns = [];
}

/* --------------------------------------------------------------------------
   A single rAF-throttled scroll bus. Many effects need scroll position; they
   all share one listener and one frame so the page never runs competing loops.
   -------------------------------------------------------------------------- */

function createScrollBus() {
  const readers = new Set();
  let queued = false;

  const run = () => {
    queued = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    readers.forEach((read) => read(y, vh));
  };

  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onCleanup(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    readers.clear();
  });

  run();
  return (read) => {
    readers.add(read);
    read(window.scrollY, window.innerHeight);
  };
}

/* --------------------------------------------------------------------------
   Deal-in. Sections are laid onto the table as they enter the viewport, in
   source order, with a short stagger between siblings of the same group.
   -------------------------------------------------------------------------- */

function dealCards() {
  const cards = document.querySelectorAll('[data-deal]');
  if (!cards.length) return;

  // Without IntersectionObserver support, show everything immediately rather
  // than leaving content stuck in its pre-deal state.
  if (!('IntersectionObserver' in window)) {
    cards.forEach((card) => card.classList.add('is-dealt'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-dealt');
        // A card is dealt once. Releasing it keeps the observer cheap and
        // stops the page re-animating on every upward scroll.
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  cards.forEach((card) => observer.observe(card));
  onCleanup(() => observer.disconnect());
}

/* --------------------------------------------------------------------------
   Ledger counters. The operating figures count up to their real values once
   their card lands. The DOM keeps the true text until the moment it animates,
   so the honest number is what ships in the HTML and what a crawler reads.
   -------------------------------------------------------------------------- */

function countUp(el, done) {
  const target = Number(el.dataset.countTo);
  const prefix = el.dataset.countPrefix || '';
  const suffix = el.dataset.countSuffix || '';
  const decimals = Number(el.dataset.countDecimals || 0);
  if (!Number.isFinite(target)) return;

  const DURATION = 1400;
  const start = performance.now();
  let frame = null;

  // Exponential ease-out — the same curve as the CSS, so numbers and cards
  // decelerate together rather than fighting each other.
  const ease = (t) => 1 - Math.pow(2, -10 * t);

  const tick = (now) => {
    const t = Math.min(1, (now - start) / DURATION);
    const value = target * ease(t);
    el.textContent = prefix + value.toFixed(decimals) + suffix;
    if (t < 1) {
      frame = requestAnimationFrame(tick);
    } else {
      el.textContent = prefix + target.toFixed(decimals) + suffix;
      done && done();
    }
  };

  frame = requestAnimationFrame(tick);
  onCleanup(() => frame && cancelAnimationFrame(frame));
}

function ledgerCounters() {
  const figures = document.querySelectorAll('[data-count-to]');
  if (!figures.length || REDUCED.matches || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        countUp(entry.target);
      });
    },
    { threshold: 0.6 }
  );

  figures.forEach((figure) => observer.observe(figure));
  onCleanup(() => observer.disconnect());
}

/* --------------------------------------------------------------------------
   Scroll progress + nav detachment.
   -------------------------------------------------------------------------- */

function scrollChrome(subscribe) {
  const bar = document.querySelector('[data-scroll-progress]');
  const nav = document.querySelector('.site-nav');

  subscribe((y) => {
    if (bar) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(1, y / scrollable) : 0;
      bar.style.transform = `scaleX(${ratio})`;
    }
    if (nav) nav.classList.toggle('is-detached', y > 24);
  });
}

/* --------------------------------------------------------------------------
   Hero parallax. The hairline field behind the lockup drifts at a fraction of
   scroll speed, so the hero reads as two planes rather than one flat surface.
   -------------------------------------------------------------------------- */

function heroParallax(subscribe) {
  const hero = document.querySelector('.identity-hero');
  if (!hero || REDUCED.matches) return;

  subscribe((y) => {
    const depth = Math.max(-120, Math.min(120, y * 0.18));
    hero.style.setProperty('--hero-parallax', `${depth}px`);
  });
}

/* --------------------------------------------------------------------------
   Method spine. The yellow rail fills in proportion to how far the list has
   travelled through the viewport, and each step lights as the fill reaches it.
   -------------------------------------------------------------------------- */

function methodSpine(subscribe) {
  const list = document.querySelector('.spine-steps');
  if (!list) return;
  const steps = Array.from(list.children);

  subscribe((y, vh) => {
    const rect = list.getBoundingClientRect();
    // 0 when the list's top reaches 80% down the viewport, 1 once its bottom
    // has passed 40% — a window wide enough to feel scrubbed, not snapped.
    const startAt = vh * 0.8;
    const endAt = vh * 0.4;
    const travelled = startAt - rect.top;
    const total = rect.height + (startAt - endAt);
    const fill = Math.max(0, Math.min(1, travelled / total));

    list.style.setProperty('--spine-fill', String(fill));

    const litCount = Math.round(fill * steps.length);
    steps.forEach((step, i) => step.classList.toggle('is-lit', i < litCount));
  });
}

/* --------------------------------------------------------------------------
   Card tilt. The two state cards answer the pointer like objects on a table.
   Pointer-driven only, and only where hovering is a real input.
   -------------------------------------------------------------------------- */

function cardTilt() {
  if (REDUCED.matches || !window.matchMedia('(hover: hover)').matches) return;

  const MAX_DEGREES = 3.2;

  document.querySelectorAll('[data-tilt]').forEach((card) => {
    let frame = null;

    const onMove = (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const rect = card.getBoundingClientRect();
        // -0.5..0.5 from the card's centre, in both axes.
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        // Tilting *toward* the pointer means rotateX follows -y.
        card.style.setProperty('--tilt-x', (-py * MAX_DEGREES).toFixed(2));
        card.style.setProperty('--tilt-y', (px * MAX_DEGREES).toFixed(2));
      });
    };

    const onLeave = () => {
      card.style.setProperty('--tilt-x', '0');
      card.style.setProperty('--tilt-y', '0');
    };

    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
    onCleanup(() => {
      if (frame) cancelAnimationFrame(frame);
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', onLeave);
    });
  });
}

/* --------------------------------------------------------------------------
   Title stamping. The h1 is split into per-letter spans so each glyph can be
   pressed onto the card in sequence. The accessible name is preserved by
   labelling the heading with its own plain text before it is split.
   -------------------------------------------------------------------------- */

function stampTitle() {
  const title = document.querySelector('[data-stamp]');
  if (!title || title.dataset.stamped === 'true') return;

  const text = title.textContent.trim();
  title.dataset.stamped = 'true';
  // Screen readers get one clean string instead of a pile of single letters.
  title.setAttribute('aria-label', text);

  if (REDUCED.matches) return;

  const fragment = document.createDocumentFragment();
  Array.from(text).forEach((char, i) => {
    const span = document.createElement('span');
    span.className = 'stamp-letter';
    span.setAttribute('aria-hidden', 'true');
    span.style.setProperty('--stamp-index', String(i));
    span.textContent = char;
    fragment.appendChild(span);
  });

  title.textContent = '';
  title.appendChild(fragment);
}

/* --------------------------------------------------------------------------
   Boot.
   -------------------------------------------------------------------------- */

function boot() {
  cleanup();
  const subscribe = createScrollBus();
  stampTitle();
  dealCards();
  ledgerCounters();
  scrollChrome(subscribe);
  heroParallax(subscribe);
  methodSpine(subscribe);
  cardTilt();
}

document.addEventListener('astro:page-load', boot);
document.addEventListener('astro:before-swap', cleanup);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
