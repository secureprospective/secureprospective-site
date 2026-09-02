/* ==========================================================================
   CONCEPT B — motion system.

   Same contract as Concept A: everything here is additive. The reveal styles
   live behind prefers-reduced-motion: no-preference, so a reduced-motion or
   no-JavaScript visitor gets the finished page rather than an empty one, and
   the horizontal method track falls back to a wrapping grid in CSS.
   ========================================================================== */

import { createField } from './field.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

let teardowns = [];
const onCleanup = (fn) => teardowns.push(fn);

function cleanup() {
  teardowns.forEach((fn) => {
    try { fn(); } catch { /* a failing teardown must not block the rest */ }
  });
  teardowns = [];
}

/* One rAF-throttled scroll bus shared by every scroll-driven effect. */
function createScrollBus() {
  const readers = new Set();
  let queued = false;

  const run = () => {
    queued = false;
    readers.forEach((read) => read(window.scrollY, window.innerHeight));
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

  return (read) => {
    readers.add(read);
    read(window.scrollY, window.innerHeight);
  };
}

/* -------------------------------------------------------------------------- */

function field() {
  const canvas = document.querySelector('[data-field]');
  if (!canvas) return;
  onCleanup(createField(canvas));
}

function reveals() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-in'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
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
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
  });
}

/* The method track: vertical scroll through a tall section is converted into
   horizontal travel across the five movements while the viewport is pinned. */
function methodTrack(subscribe) {
  const section = document.querySelector('[data-track-section]');
  const track = document.querySelector('[data-track]');
  if (!section || !track || REDUCED.matches) return;

  const cards = Array.from(track.children);

  const measure = () => {
    // The section is made exactly as tall as the horizontal distance to cover,
    // plus one viewport for the pinned phase.
    const distance = Math.max(0, track.scrollWidth - window.innerWidth);
    section.style.height = `${window.innerHeight + distance}px`;
    return distance;
  };

  let distance = measure();
  const onResize = () => { distance = measure(); };
  window.addEventListener('resize', onResize, { passive: true });
  onCleanup(() => {
    window.removeEventListener('resize', onResize);
    section.style.height = '';
    track.style.transform = '';
  });

  subscribe(() => {
    const rect = section.getBoundingClientRect();
    const travelled = Math.min(Math.max(-rect.top, 0), distance);
    track.style.transform = `translate3d(${-travelled}px, 0, 0)`;

    const progress = distance > 0 ? travelled / distance : 0;
    const currentIndex = Math.round(progress * (cards.length - 1));
    cards.forEach((card, i) => card.classList.toggle('is-current', i === currentIndex));
  });
}

/* Panels take a pointer-tracked lens so light appears to fall across glass. */
function panelLens() {
  if (REDUCED.matches || !window.matchMedia('(hover: hover)').matches) return;

  document.querySelectorAll('[data-lens]').forEach((panel) => {
    let frame = null;
    const onMove = (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const rect = panel.getBoundingClientRect();
        panel.style.setProperty('--lens-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
        panel.style.setProperty('--lens-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
      });
    };
    panel.addEventListener('pointermove', onMove);
    onCleanup(() => {
      if (frame) cancelAnimationFrame(frame);
      panel.removeEventListener('pointermove', onMove);
    });
  });
}

/* Magnetic buttons: the control leans toward the pointer as it approaches. */
function magnetic() {
  if (REDUCED.matches || !window.matchMedia('(hover: hover)').matches) return;

  const STRENGTH = 0.28;
  const MAX = 9;

  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    let frame = null;

    const onMove = (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const rect = el.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const x = Math.max(-MAX, Math.min(MAX, dx * STRENGTH));
        const y = Math.max(-MAX, Math.min(MAX, dy * STRENGTH));
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };
    const onLeave = () => { el.style.transform = ''; };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    onCleanup(() => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.style.transform = '';
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
      const t = Math.min(1, (now - start) / 1500);
      el.textContent = prefix + Math.round(target * ease(t)) + suffix;
      if (t < 1) frame = requestAnimationFrame(tick);
      else el.textContent = prefix + target + suffix;
    };
    frame = requestAnimationFrame(tick);
    onCleanup(() => frame && cancelAnimationFrame(frame));
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
  field();
  reveals();
  chrome(subscribe);
  methodTrack(subscribe);
  panelLens();
  magnetic();
  readouts();
  railNav();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
