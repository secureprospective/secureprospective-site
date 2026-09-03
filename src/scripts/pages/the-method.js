/* ============================================================================
   THE METHOD — page-specific control-loop state.

   The shared motion controller owns the site chrome. This module owns only the
   method register: the active movement, the loop progress, and teardown across
   Astro page swaps. Content stays visible without JavaScript.
   ============================================================================ */

let pageTeardown = null;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function teardown() {
  if (!pageTeardown) return;
  pageTeardown();
  pageTeardown = null;
}

function boot() {
  teardown();

  const page = document.querySelector('.method-page');
  if (!page) return;

  const stations = Array.from(page.querySelectorAll('[data-cycle-station]'));
  const links = Array.from(page.querySelectorAll('[data-cycle-link]'));
  const status = page.querySelector('[data-cycle-status]');
  if (!stations.length) return;

  let activeIndex = -1;
  let frame = null;
  let disposed = false;

  const setActive = (index) => {
    const nextIndex = clamp(index, 0, stations.length - 1);
    if (nextIndex === activeIndex) return;
    activeIndex = nextIndex;

    stations.forEach((station, stationIndex) => {
      const current = stationIndex === nextIndex;
      station.classList.toggle('is-current', current);
      station.toggleAttribute('data-current', current);
    });

    links.forEach((link, linkIndex) => {
      const current = linkIndex === nextIndex;
      const item = link.closest('li');
      if (item) item.classList.toggle('is-current', current);
      if (current) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });

    if (status) {
      const name = stations[nextIndex].dataset.cycleName || '';
      status.textContent = `${String(nextIndex + 1).padStart(2, '0')} // ${name}`;
    }
  };

  const measure = () => {
    frame = null;
    if (disposed) return;

    const focusLine = window.innerHeight * 0.38;
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    stations.forEach((station, index) => {
      const rect = station.getBoundingClientRect();
      const distance = rect.top <= focusLine && rect.bottom >= focusLine
        ? 0
        : Math.min(Math.abs(rect.top - focusLine), Math.abs(rect.bottom - focusLine));

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActive(nearestIndex);

    const firstRect = stations[0].getBoundingClientRect();
    const lastRect = stations[stations.length - 1].getBoundingClientRect();
    const total = Math.max(1, lastRect.bottom - firstRect.top);
    const progress = clamp((focusLine - firstRect.top) / total, 0, 1);
    page.style.setProperty('--method-progress', progress.toFixed(3));
  };

  const queueMeasure = () => {
    if (disposed || frame !== null) return;
    frame = window.requestAnimationFrame(measure);
  };

  const onVisibility = () => {
    if (document.hidden) {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
    } else {
      queueMeasure();
    }
  };

  const linkHandlers = links.map((link, index) => {
    const handler = () => setActive(index);
    link.addEventListener('click', handler);
    return { link, handler };
  });
  window.addEventListener('scroll', queueMeasure, { passive: true });
  window.addEventListener('resize', queueMeasure, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  setActive(0);
  queueMeasure();

  pageTeardown = () => {
    disposed = true;
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    linkHandlers.forEach(({ link, handler }) => link.removeEventListener('click', handler));
    window.removeEventListener('scroll', queueMeasure);
    window.removeEventListener('resize', queueMeasure);
    document.removeEventListener('visibilitychange', onVisibility);
    page.style.removeProperty('--method-progress');
  };
}

document.addEventListener('astro:page-load', boot);
document.addEventListener('astro:before-swap', teardown);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
