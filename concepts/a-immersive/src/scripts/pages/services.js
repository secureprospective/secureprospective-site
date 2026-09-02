/* ==========================================================================
   THE OPERATION

   The page-specific controller keeps one useful interaction: the file index
   follows the section currently in the reading band. The opening scan is a
   one-shot CSS gesture. No loop or counter is used on the proof page.
   ========================================================================== */

const cleanups = [];
let active = false;

function onCleanup(fn) {
  cleanups.push(fn);
}

function cleanup() {
  while (cleanups.length) {
    const fn = cleanups.pop();
    try {
      fn();
    } catch (error) {
      console.error('[The Operation] teardown failed', error);
    }
  }
  active = false;
}

function boot() {
  if (active) return;

  const hero = document.querySelector('[data-operation-hero]');
  const indexLinks = Array.from(document.querySelectorAll('.operation-index a'));
  if (!hero || !indexLinks.length) return;

  active = true;

  // Mark the opening field after the first paint. The CSS animation is gated
  // by no-preference, so this marker never hides content in reduced motion or
  // with JavaScript disabled.
  const readyFrame = requestAnimationFrame(() => {
    if (active) hero.setAttribute('data-operation-ready', 'true');
  });
  onCleanup(() => cancelAnimationFrame(readyFrame));

  const sections = indexLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const setActive = (id) => {
    indexLinks.forEach((link) => {
      const isCurrent = link.getAttribute('href') === `#${id}`;
      if (isCurrent) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  indexLinks.forEach((link) => {
    const onClick = () => {
      const id = link.getAttribute('href')?.slice(1);
      if (id) setActive(id);
    };
    link.addEventListener('click', onClick);
    onCleanup(() => link.removeEventListener('click', onClick));
  });

  if (!sections.length) return;

  // Use the same reading rule on a jump as on a gradual scroll. An
  // IntersectionObserver can retain a stale entry when a browser jumps from
  // the bottom of the document back to the top, so the index is derived from
  // the section edge in one rAF instead of from cached visibility.
  let frame = null;
  const updateIndex = () => {
    frame = null;
    const readingLine = window.innerHeight * 0.34;
    let current = sections[0];

    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= readingLine) current = section;
    });

    setActive(current.id);
  };
  const queueUpdate = () => {
    if (frame === null) frame = requestAnimationFrame(updateIndex);
  };

  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', queueUpdate, { passive: true });
  queueUpdate();
  onCleanup(() => {
    window.removeEventListener('scroll', queueUpdate);
    window.removeEventListener('resize', queueUpdate);
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  });
}

document.addEventListener('astro:page-load', boot);
document.addEventListener('astro:before-swap', cleanup);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
