/* ==========================================================================
   CONCEPT B — motion system.

   The room boots once, then stays quiet until the visitor moves through it.
   Desktop keeps the pinned method instrument; touch devices get a vertical
   sequence with a live checkpoint instead of a clipped horizontal strip.
   Every effect owns its teardown and every long-running loop has a bounded
   budget.
   ========================================================================== */

import { createField } from './field.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

let teardowns = [];
const onCleanup = (fn) => teardowns.push(fn);

function cleanup() {
  teardowns.forEach((fn) => {
    try {
      fn();
    } catch (error) {
      // Keep later teardowns running, but surface a broken one instead of
      // silently accepting a leaked listener or frame.
      console.error('[Concept B] motion teardown failed', error);
    }
  });
  teardowns = [];
}

/* One rAF-throttled scroll bus shared by every scroll-driven effect. */
function createScrollBus() {
  const readers = new Set();
  let frame = null;

  const run = () => {
    frame = null;
    readers.forEach((read) => read(window.scrollY, window.innerHeight));
  };
  const queue = () => {
    if (frame !== null) return;
    frame = requestAnimationFrame(run);
  };

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });
  onCleanup(() => {
    window.removeEventListener('scroll', queue);
    window.removeEventListener('resize', queue);
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    readers.clear();
  });

  return (read) => {
    readers.add(read);
    read(window.scrollY, window.innerHeight);
    return () => readers.delete(read);
  };
}

/* -------------------------------------------------------------------------- */

function field(subscribe) {
  const canvas = document.querySelector('[data-field]');
  if (!canvas) return;
  onCleanup(createField(canvas, { subscribe }));
}

function reveals() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  const show = (item) => item.classList.add('is-in');

  if (!('IntersectionObserver' in window)) {
    items.forEach(show);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: '0px 0px -6% 0px' }
  );

  items.forEach((item) => observer.observe(item));
  onCleanup(() => observer.disconnect());
}

/* Split the wordmark into per-word masked lines so each can rise on its own. */
function splitWordmark() {
  const title = document.querySelector('[data-split]');
  if (!title || title.dataset.split === 'done') return;

  const text = title.textContent.trim();
  title.dataset.split = 'done';
  title.setAttribute('aria-label', text);

  const fragment = document.createDocumentFragment();
  text.split(/\s+/).forEach((word, i) => {
    const line = document.createElement('span');
    line.className = 'word';
    line.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.style.setProperty('--word-index', String(i));
    inner.textContent = word;
    line.appendChild(inner);
    fragment.appendChild(line);
  });

  title.textContent = '';
  title.appendChild(fragment);
}

/* The rail: section index, scroll meter, and the sticky top bar. */
function chrome(subscribe) {
  const bar = document.querySelector('[data-track-progress]');
  const progressBar = document.querySelector('.track-progress');
  const topbar = document.querySelector('.topbar');
  const meter = document.querySelector('[data-meter]');
  const dots = Array.from(document.querySelectorAll('[data-rail-dot]'));
  const sections = dots
    .map((dot) => document.getElementById(dot.dataset.railDot))
    .filter(Boolean);

  subscribe((y) => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? Math.min(1, Math.max(0, y / scrollable)) : 0;

    if (bar) bar.style.transform = `scaleX(${ratio})`;
    if (topbar) topbar.classList.toggle('is-stuck', y > 40);
    if (meter) meter.textContent = String(Math.round(ratio * 100)).padStart(3, '0');

    // The current section is the last one whose top has passed the upper third.
    let current = 0;
    sections.forEach((section, i) => {
      if (section.getBoundingClientRect().top <= window.innerHeight * 0.34) current = i;
    });
    dots.forEach((dot, i) => {
      if (i === current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });

    // Keep the visible progress bar honest for assistive technology too.
    if (progressBar && progressBar.getAttribute('role') === 'progressbar') {
      progressBar.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    }
  });
}

/* The method track: desktop scroll becomes horizontal travel; touch becomes a
   vertical sequence whose active checkpoint follows the reading position. */
function methodTrack(subscribe) {
  const section = document.querySelector('[data-track-section]');
  const track = document.querySelector('[data-track]');
  const progressBar = document.querySelector('.track-progress');
  const bar = document.querySelector('[data-track-progress]');
  if (!section || !track) return;

  const cards = Array.from(track.children);
  const compact = window.matchMedia('(max-width: 900px)');
  let mode = null;
  let distance = 0;

  const setProgress = (ratio) => {
    const value = Math.min(1, Math.max(0, ratio));
    if (bar) bar.style.transform = `scaleX(${value})`;
    if (progressBar && progressBar.getAttribute('role') === 'progressbar') {
      progressBar.setAttribute('aria-valuenow', String(Math.round(value * 100)));
    }
  };

  const setCurrent = (index) => {
    cards.forEach((card, i) => card.classList.toggle('is-current', i === index));
  };

  const measure = () => {
    // The track begins after the rail on desktop, so compare its content to
    // its own viewport, not to the full window. This also reveals the final
    // card cleanly at wide desktop sizes where the rail would otherwise hide
    // a few pixels of its right edge.
    const nextDistance = Math.max(0, track.scrollWidth - track.clientWidth);
    section.style.height = `${window.innerHeight + nextDistance}px`;
    return nextDistance;
  };

  const updateHorizontal = () => {
    const rect = section.getBoundingClientRect();
    const travelled = Math.min(Math.max(-rect.top, 0), distance);
    track.style.transform = `translate3d(${-travelled}px, 0, 0)`;
    const ratio = distance > 0 ? travelled / distance : 0;
    setCurrent(Math.round(ratio * Math.max(0, cards.length - 1)));
    setProgress(ratio);
  };

  const updateVertical = () => {
    if (!cards.length) return;

    const anchor = window.innerHeight * 0.46;
    let currentIndex = 0;
    let closest = Number.POSITIVE_INFINITY;
    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const distanceFromAnchor = Math.abs((rect.top + rect.height / 2) - anchor);
      if (distanceFromAnchor < closest) {
        closest = distanceFromAnchor;
        currentIndex = i;
      }
    });

    setCurrent(currentIndex);
    setProgress(currentIndex / Math.max(1, cards.length - 1));
  };

  const update = () => {
    if (mode === 'horizontal') updateHorizontal();
    else updateVertical();
  };

  const setMode = () => {
    const next = compact.matches || REDUCED.matches ? 'vertical' : 'horizontal';
    if (next === mode) return;
    mode = next;

    if (mode === 'vertical') {
      section.style.height = '';
      track.style.transform = '';
      setProgress(0);
    } else {
      distance = measure();
    }
    update();
  };

  const onResize = () => {
    const previousMode = mode;
    setMode();
    if (mode === 'horizontal') {
      distance = measure();
      update();
    } else if (previousMode !== mode) {
      updateVertical();
    }
  };
  const onModeChange = () => onResize();

  setMode();
  const unsubscribe = subscribe(update);
  window.addEventListener('resize', onResize, { passive: true });
  compact.addEventListener('change', onModeChange);
  REDUCED.addEventListener('change', onModeChange);

  onCleanup(() => {
    unsubscribe?.();
    window.removeEventListener('resize', onResize);
    compact.removeEventListener('change', onModeChange);
    REDUCED.removeEventListener('change', onModeChange);
    section.style.height = '';
    track.style.transform = '';
    cards.forEach((card) => card.classList.remove('is-current'));
  });
}

/* Panels take a pointer-tracked lens so light appears to fall across glass.
   A touch contact becomes a short-lived inspection light rather than a
   hover-only effect. Clearing the class on pointer exit prevents stale focus. */
function panelLens() {
  if (REDUCED.matches) return;

  document.querySelectorAll('[data-lens]').forEach((panel) => {
    let frame = null;

    const update = (event) => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const rect = panel.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        panel.style.setProperty('--lens-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
        panel.style.setProperty('--lens-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
        panel.classList.add('is-lens-active');
      });
    };
    const clear = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      panel.classList.remove('is-lens-active');
      panel.style.removeProperty('--lens-x');
      panel.style.removeProperty('--lens-y');
    };
    const onMove = (event) => update(event);
    const onDown = (event) => {
      if (event.isPrimary === false) return;
      update(event);
    };

    panel.addEventListener('pointermove', onMove, { passive: true });
    panel.addEventListener('pointerdown', onDown, { passive: true });
    panel.addEventListener('pointerleave', clear, { passive: true });
    panel.addEventListener('pointerup', clear, { passive: true });
    panel.addEventListener('pointercancel', clear, { passive: true });
    onCleanup(() => {
      clear();
      panel.removeEventListener('pointermove', onMove);
      panel.removeEventListener('pointerdown', onDown);
      panel.removeEventListener('pointerleave', clear);
      panel.removeEventListener('pointerup', clear);
      panel.removeEventListener('pointercancel', clear);
    });
  });
}

/* Magnetic buttons: the control leans toward the pointer before contact. The
   CSS translate property composes with any existing transform instead of
   overwriting one, and a small spring in this loop handles the settle. */
function magnetic() {
  if (REDUCED.matches) return;

  const elements = Array.from(document.querySelectorAll('[data-magnetic]'));
  if (!elements.length) return;

  const PROXIMITY = 120;
  const STRENGTH = 0.16;
  const MAX = 9;
  const current = elements.map(() => ({ x: 0, y: 0 }));
  let pointer = null;
  let frame = null;

  const clamp = (value) => Math.max(-MAX, Math.min(MAX, value));
  const queue = () => {
    if (frame !== null) return;
    frame = requestAnimationFrame(render);
  };

  const render = () => {
    frame = null;
    const targets = elements.map((el, i) => {
      const rect = el.getBoundingClientRect();
      let x = 0;
      let y = 0;
      let near = false;

      if (pointer) {
        const dx = pointer.x - (rect.left + rect.width / 2);
        const dy = pointer.y - (rect.top + rect.height / 2);
        const outsideX = Math.max(0, Math.abs(dx) - rect.width / 2);
        const outsideY = Math.max(0, Math.abs(dy) - rect.height / 2);
        const outsideDistance = Math.hypot(outsideX, outsideY);
        if (outsideDistance < PROXIMITY) {
          const influence = 1 - outsideDistance / PROXIMITY;
          x = clamp(dx * STRENGTH * influence);
          y = clamp(dy * STRENGTH * influence);
          near = true;
        }
      }
      return { x, y, near, index: i };
    });

    let moving = false;
    targets.forEach(({ x, y, near, index }) => {
      const el = elements[index];
      const state = current[index];
      const nextX = Math.abs(x - state.x) < 0.04 ? x : state.x + (x - state.x) * 0.24;
      const nextY = Math.abs(y - state.y) < 0.04 ? y : state.y + (y - state.y) * 0.24;
      state.x = nextX;
      state.y = nextY;
      if (Math.abs(x - nextX) > 0.04 || Math.abs(y - nextY) > 0.04) moving = true;

      if (Math.abs(nextX) < 0.04 && Math.abs(nextY) < 0.04 && !near) {
        el.style.removeProperty('--magnetic-x');
        el.style.removeProperty('--magnetic-y');
        el.classList.remove('is-magnetic');
      } else {
        el.style.setProperty('--magnetic-x', `${nextX.toFixed(2)}px`);
        el.style.setProperty('--magnetic-y', `${nextY.toFixed(2)}px`);
        el.classList.toggle('is-magnetic', near || Math.abs(nextX) > 0.04 || Math.abs(nextY) > 0.04);
      }
    });

    if (moving) queue();
  };

  const onMove = (event) => {
    // Pointer events are used so hybrid laptops do not turn a finger into a
    // magnetic cursor. Empty pointerType is retained for older mouse events.
    if (event.pointerType && event.pointerType !== 'mouse') return;
    pointer = { x: event.clientX, y: event.clientY };
    queue();
  };
  const onLeave = () => {
    pointer = null;
    queue();
  };
  const onLayout = () => { if (pointer) queue(); };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerleave', onLeave, { passive: true });
  window.addEventListener('scroll', onLayout, { passive: true });
  window.addEventListener('resize', onLayout, { passive: true });
  onCleanup(() => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('scroll', onLayout);
    window.removeEventListener('resize', onLayout);
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    elements.forEach((el) => {
      el.style.removeProperty('--magnetic-x');
      el.style.removeProperty('--magnetic-y');
      el.classList.remove('is-magnetic');
    });
  });
}

/* Instrument readouts count to their real value once on screen. */
function readouts() {
  const figures = document.querySelectorAll('[data-count-to]');
  if (!figures.length || REDUCED.matches || !('IntersectionObserver' in window)) return;

  const ease = (t) => 1 - Math.pow(2, -10 * t);

  const run = (el) => {
    const target = Number(el.dataset.countTo);
    if (!Number.isFinite(target)) return;
    const prefix = el.dataset.countPrefix || '';
    const suffix = el.dataset.countSuffix || '';
    const start = performance.now();
    let frame = null;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1100);
      el.textContent = prefix + Math.round(target * ease(t)) + suffix;
      if (t < 1) frame = requestAnimationFrame(tick);
      else {
        frame = null;
        el.textContent = prefix + target + suffix;
      }
    };
    frame = requestAnimationFrame(tick);
    onCleanup(() => {
      if (frame !== null) cancelAnimationFrame(frame);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        run(entry.target);
      });
    },
    { threshold: 0.6 }
  );
  figures.forEach((figure) => observer.observe(figure));
  onCleanup(() => observer.disconnect());
}

/* Rail dots scroll to their section. */
function railNav() {
  document.querySelectorAll('[data-rail-dot]').forEach((dot) => {
    const onClick = () => {
      const target = document.getElementById(dot.dataset.railDot);
      if (target) target.scrollIntoView({ behavior: REDUCED.matches ? 'auto' : 'smooth', block: 'start' });
    };
    dot.addEventListener('click', onClick);
    onCleanup(() => dot.removeEventListener('click', onClick));
  });
}

function boot() {
  cleanup();
  const subscribe = createScrollBus();
  splitWordmark();
  field(subscribe);
  reveals();
  chrome(subscribe);
  methodTrack(subscribe);
  panelLens();
  magnetic();
  readouts();
  railNav();
}

/* This concept uses full document navigations, not Astro ClientRouter/View
   Transitions, so one DOMContentLoaded boot is the correct lifecycle. */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
