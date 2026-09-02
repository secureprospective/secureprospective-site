/* ==========================================================================
   CONCEPT A: motion system.

   One controller for the whole page. Everything it does is additive: with
   JavaScript disabled, or with reduced motion enabled, the page is complete,
   legible and fully navigable. The default HTML remains visible until this
   controller has finished its small amount of preparation.
   ========================================================================== */

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const prefersReducedMotion = () => window.matchMedia(REDUCED_QUERY).matches;

/** Every active page resource is registered here and removed on before-swap. */
let teardowns = [];
let activeLifecycle = null;

function onCleanup(fn) {
  teardowns.push(fn);
  let registered = true;

  return () => {
    if (!registered) return;
    registered = false;
    const index = teardowns.indexOf(fn);
    if (index !== -1) teardowns.splice(index, 1);
  };
}

function cleanup() {
  if (activeLifecycle) activeLifecycle.cancelled = true;
  activeLifecycle = null;

  const pending = teardowns;
  teardowns = [];
  pending.reverse().forEach((fn) => {
    try {
      fn();
    } catch (error) {
      // Keep releasing the remaining resources, but never hide a teardown bug.
      console.error('[Concept A motion] teardown failed', error);
    }
  });

  document.documentElement.removeAttribute('data-motion-ready');
  document.documentElement.removeAttribute('data-motion-enabled');
}

/* --------------------------------------------------------------------------
   A single rAF-throttled scroll bus. Effects subscribe to one listener and
   one frame, so scroll never starts competing loops.
   -------------------------------------------------------------------------- */

function createScrollBus() {
  const readers = new Set();
  let queuedFrame = null;
  let active = true;

  const run = () => {
    queuedFrame = null;
    if (!active) return;

    const y = window.scrollY;
    const vh = window.innerHeight;
    readers.forEach((read) => read(y, vh));
  };

  const queue = () => {
    if (!active || queuedFrame !== null) return;
    queuedFrame = requestAnimationFrame(run);
  };

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });

  onCleanup(() => {
    active = false;
    if (queuedFrame !== null) cancelAnimationFrame(queuedFrame);
    queuedFrame = null;
    window.removeEventListener('scroll', queue);
    window.removeEventListener('resize', queue);
    readers.clear();
  });

  run();
  return (read) => {
    if (!active) return;
    readers.add(read);
    read(window.scrollY, window.innerHeight);
  };
}

/* --------------------------------------------------------------------------
   Deal-in. Sections arrive as cards laid onto the table. The markup supplies
   short, intentional delays for siblings; each card is observed once.
   -------------------------------------------------------------------------- */

function dealCards() {
  const cards = document.querySelectorAll('[data-deal]');
  if (!cards.length) return;

  // If the browser cannot observe visibility, reveal everything immediately.
  if (!('IntersectionObserver' in window)) {
    cards.forEach((card) => card.classList.add('is-dealt'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-dealt');
        // A card is dealt once. Releasing it prevents repeat choreography on
        // every upward scroll and keeps the observer's work bounded.
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  cards.forEach((card) => observer.observe(card));
  onCleanup(() => observer.disconnect());
}

/* --------------------------------------------------------------------------
   Ledger counters. The figures count once their evidence card enters a
   readable zone. The true values are present in the HTML before animation.
   -------------------------------------------------------------------------- */

function countUp(el) {
  const target = Number(el.dataset.countTo);
  const prefix = el.dataset.countPrefix || '';
  const suffix = el.dataset.countSuffix || '';
  const decimals = Number(el.dataset.countDecimals || 0);
  if (!Number.isFinite(target) || el.dataset.counterStarted === 'true') return;

  const duration = 860;
  const start = performance.now();
  let frame = null;
  let disposed = false;
  let unregister = () => {};
  el.dataset.counterStarted = 'true';

  const finish = () => {
    if (disposed) return;
    el.textContent = prefix + target.toFixed(decimals) + suffix;
    frame = null;
    unregister();
  };

  // Exponential ease-out lets the number settle with the card instead of
  // ticking at a constant, mechanical rate.
  const ease = (t) => 1 - Math.pow(2, -10 * t);
  const tick = (now) => {
    if (disposed) return;
    if (prefersReducedMotion()) {
      finish();
      return;
    }

    const t = Math.min(1, (now - start) / duration);
    const value = target * ease(t);
    el.textContent = prefix + value.toFixed(decimals) + suffix;

    if (t < 1) {
      frame = requestAnimationFrame(tick);
    } else {
      finish();
    }
  };

  unregister = onCleanup(() => {
    disposed = true;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  });
  frame = requestAnimationFrame(tick);
}

function ledgerCounters() {
  const figures = document.querySelectorAll('[data-count-to]');
  if (!figures.length || prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        countUp(entry.target);
      });
    },
    { threshold: 0.55 }
  );

  figures.forEach((figure) => observer.observe(figure));
  onCleanup(() => observer.disconnect());
}

/* --------------------------------------------------------------------------
   Scroll progress and nav detachment.
   -------------------------------------------------------------------------- */

function scrollChrome(subscribe) {
  const bar = document.querySelector('[data-scroll-progress]');
  const nav = document.querySelector('.site-nav');

  subscribe((y, vh) => {
    if (bar) {
      const scrollable = document.documentElement.scrollHeight - vh;
      const ratio = scrollable > 0 ? Math.min(1, y / scrollable) : 0;
      bar.style.transform = `scaleX(${ratio})`;
    }
    if (nav) nav.classList.toggle('is-detached', y > 24);
  });
}

/* --------------------------------------------------------------------------
   Hero parallax. The hairline field drifts at a fraction of scroll speed, so
   the identity card reads as two planes rather than one flat surface.
   -------------------------------------------------------------------------- */

function heroParallax(subscribe) {
  const hero = document.querySelector('.identity-hero');
  if (!hero || prefersReducedMotion()) return;

  subscribe((y) => {
    const depth = Math.max(-80, Math.min(80, y * 0.12));
    hero.style.setProperty('--hero-parallax', `${depth}px`);
  });
}

/* --------------------------------------------------------------------------
   Method spine. The yellow rail fills in proportion to the list's travel
   through the viewport, and each movement lights as the fill reaches it.
   -------------------------------------------------------------------------- */

function methodSpine(subscribe) {
  const list = document.querySelector('.spine-steps');
  if (!list) return;
  const steps = Array.from(list.children);

  subscribe((y, vh) => {
    const rect = list.getBoundingClientRect();
    // 0 when the list top reaches 80% down the viewport, 1 once its bottom
    // has passed 40%. This gives the rail a scrubbed relationship to reading.
    const startAt = vh * 0.8;
    const endAt = vh * 0.4;
    const travelled = startAt - rect.top;
    const total = rect.height + (startAt - endAt);
    const fill = Math.max(0, Math.min(1, travelled / total));

    list.style.setProperty('--spine-fill', String(fill));
    const litCount = Math.round(fill * steps.length);
    steps.forEach((step, index) => step.classList.toggle('is-lit', index < litCount));
  });
}

/* --------------------------------------------------------------------------
   Card inspection. On a pointer device the two operating-state cards behave
   like measured objects on a table. A damped rAF response gives the pointer
   weight; the crosshair records where the inspection is happening.
   -------------------------------------------------------------------------- */

function cardTilt() {
  if (prefersReducedMotion() || !window.matchMedia('(hover: hover)').matches) return;

  const maxDegrees = 2.4;
  const maxLift = 4;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  document.querySelectorAll('[data-tilt]').forEach((card) => {
    const state = {
      active: false,
      targetX: 0,
      targetY: 0,
      targetLift: 0,
      currentX: 0,
      currentY: 0,
      currentLift: 0,
      frame: null,
      lastTime: 0,
    };

    const request = () => {
      if (state.frame === null) state.frame = requestAnimationFrame(step);
    };

    const step = (now) => {
      state.frame = null;
      const elapsed = state.lastTime ? Math.min(64, now - state.lastTime) : 16;
      state.lastTime = now;
      // Frame-rate independent damping: responsive on entry, calm on return.
      const blend = 1 - Math.exp(-elapsed / 86);

      state.currentX += (state.targetX - state.currentX) * blend;
      state.currentY += (state.targetY - state.currentY) * blend;
      state.currentLift += (state.targetLift - state.currentLift) * blend;
      card.style.setProperty('--tilt-x', state.currentX.toFixed(3));
      card.style.setProperty('--tilt-y', state.currentY.toFixed(3));
      card.style.setProperty('--tilt-lift', `${state.currentLift.toFixed(3)}px`);

      const settled = Math.max(
        Math.abs(state.targetX - state.currentX),
        Math.abs(state.targetY - state.currentY),
        Math.abs(state.targetLift - state.currentLift)
      ) < 0.01;

      if (!settled || state.active) request();
      else {
        card.style.removeProperty('will-change');
        state.lastTime = 0;
      }
    };

    const reset = () => {
      state.active = false;
      state.targetX = 0;
      state.targetY = 0;
      state.targetLift = 0;
      card.removeAttribute('data-inspecting');
      request();
    };

    const onEnter = () => {
      state.active = true;
      card.dataset.inspecting = 'true';
      card.style.willChange = 'transform';
      request();
    };

    const onMove = (event) => {
      if (event.pointerType === 'touch') return;
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const px = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const py = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      state.targetX = (0.5 - py) * maxDegrees;
      state.targetY = (px - 0.5) * maxDegrees;
      state.targetLift = -maxLift;
      card.style.setProperty('--inspect-x', `${(px * 100).toFixed(2)}%`);
      card.style.setProperty('--inspect-y', `${(py * 100).toFixed(2)}%`);
      request();
    };

    const onBlur = reset;
    card.addEventListener('pointerenter', onEnter, { passive: true });
    card.addEventListener('pointermove', onMove, { passive: true });
    card.addEventListener('pointerleave', reset, { passive: true });
    card.addEventListener('pointercancel', reset, { passive: true });
    window.addEventListener('blur', onBlur);

    onCleanup(() => {
      if (state.frame !== null) cancelAnimationFrame(state.frame);
      state.frame = null;
      card.removeEventListener('pointerenter', onEnter);
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', reset);
      card.removeEventListener('pointercancel', reset);
      window.removeEventListener('blur', onBlur);
      card.removeAttribute('data-inspecting');
      card.style.removeProperty('will-change');
      card.style.setProperty('--tilt-x', '0');
      card.style.setProperty('--tilt-y', '0');
      card.style.setProperty('--tilt-lift', '0px');
    });
  });
}

/* --------------------------------------------------------------------------
   Title stamping. Words remain atomic so the mobile lockup never breaks in
   the middle of a word. The heading's accessible name stays one clean string.
   -------------------------------------------------------------------------- */

function stampTitle() {
  const title = document.querySelector('[data-stamp]');
  if (!title || title.dataset.stamped === 'true') return;

  const text = title.textContent.trim();
  title.setAttribute('aria-label', text);

  if (prefersReducedMotion()) {
    title.dataset.stamped = 'true';
    return;
  }

  const fragment = document.createDocumentFragment();
  let letterIndex = 0;
  text.split(/(\s+)/).forEach((token) => {
    if (/^\s+$/.test(token)) {
      fragment.appendChild(document.createTextNode(token));
      return;
    }

    const word = document.createElement('span');
    word.className = 'stamp-word';
    word.setAttribute('aria-hidden', 'true');

    Array.from(token).forEach((char) => {
      const letter = document.createElement('span');
      letter.className = 'stamp-letter';
      letter.setAttribute('aria-hidden', 'true');
      letter.style.setProperty('--stamp-index', String(letterIndex));
      letter.textContent = char;
      word.appendChild(letter);
      letterIndex += 1;
    });

    fragment.appendChild(word);
  });

  title.textContent = '';
  title.appendChild(fragment);
  title.dataset.stamped = 'true';
}

/* --------------------------------------------------------------------------
   Boot. Astro's page-load and the initial DOM lifecycle can both be valid
   entry points. The lifecycle guard makes the controller idempotent instead
   of starting, tearing down and restarting the same page on first load.
   -------------------------------------------------------------------------- */

function boot() {
  if (activeLifecycle) return;

  const lifecycle = { cancelled: false };
  activeLifecycle = lifecycle;
  // Deal-in styles are scoped to this marker, so disabling JavaScript leaves
  // the server-rendered page in its complete, visible state.
  document.documentElement.dataset.motionEnabled = 'true';
  const subscribe = createScrollBus();

  dealCards();
  ledgerCounters();
  scrollChrome(subscribe);
  heroParallax(subscribe);
  methodSpine(subscribe);
  cardTilt();

  // Do not let fallback font metrics decide the authored lockup entrance.
  // The content is already visible while the font promise settles.
  const fontsReady = document.fonts?.ready || Promise.resolve();
  Promise.resolve(fontsReady).then(
    () => {
      if (lifecycle.cancelled || activeLifecycle !== lifecycle) return;
      stampTitle();
      document.documentElement.dataset.motionReady = 'true';
    },
    (error) => {
      // A font load failure must not hold the page in a waiting state, and it
      // remains visible in the console for diagnosis rather than disappearing.
      console.warn('[Concept A motion] display font readiness failed; using fallback metrics.', error);
      if (lifecycle.cancelled || activeLifecycle !== lifecycle) return;
      stampTitle();
      document.documentElement.dataset.motionReady = 'true';
    }
  );
}

document.addEventListener('astro:page-load', boot);
document.addEventListener('astro:before-swap', cleanup);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
