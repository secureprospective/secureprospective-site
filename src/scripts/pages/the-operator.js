/* ==========================================================================
   THE OPERATOR page motion

   The career map is the page-specific interaction. As a station enters the
   reading band, its method transfer becomes current. On pointer devices the
   map also accepts a quiet inspection line, like a ruler crossing a working
   drawing. Both effects are additive: every fact and every path is present
   without JavaScript, and reduced motion keeps the state changes immediate.
   ========================================================================== */

let activePage = null;
let pageCleanup = () => {};

function boot() {
  const page = document.querySelector('.operator-page');
  if (!page || page === activePage) return;

  pageCleanup();
  activePage = page;
  const cleanups = [];
  const stations = Array.from(page.querySelectorAll('[data-station]'));
  const routeItems = Array.from(page.querySelectorAll('[data-route-key]'));
  const map = page.querySelector('[data-inspection-map]');

  const setCurrent = (key) => {
    stations.forEach((station) => {
      station.classList.toggle('is-current', station.dataset.station === key);
    });
    routeItems.forEach((item) => {
      item.classList.toggle('is-current', item.dataset.routeKey === key);
    });
  };

  if (stations.length) setCurrent(stations[0].dataset.station);

  if ('IntersectionObserver' in window && stations.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
          .forEach((entry) => setCurrent(entry.target.dataset.station));
      },
      { rootMargin: '-34% 0px -49% 0px', threshold: [0, 0.2, 0.6] }
    );

    stations.forEach((station) => observer.observe(station));
    cleanups.push(() => observer.disconnect());
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (map && !reducedMotion && window.matchMedia('(hover: hover)').matches) {
    const inspect = (event) => {
      if (event.pointerType === 'touch') return;
      const rect = map.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
      map.style.setProperty('--operator-scan-x', `${x}px`);
      map.dataset.inspecting = 'true';
    };

    const clearInspect = () => {
      map.removeAttribute('data-inspecting');
      map.style.removeProperty('--operator-scan-x');
    };

    map.addEventListener('pointermove', inspect, { passive: true });
    map.addEventListener('pointerleave', clearInspect, { passive: true });
    map.addEventListener('pointercancel', clearInspect, { passive: true });
    cleanups.push(() => {
      map.removeEventListener('pointermove', inspect);
      map.removeEventListener('pointerleave', clearInspect);
      map.removeEventListener('pointercancel', clearInspect);
      clearInspect();
    });
  }

  pageCleanup = () => {
    cleanups.reverse().forEach((cleanup) => cleanup());
    stations.forEach((station) => station.classList.remove('is-current'));
    routeItems.forEach((item) => item.classList.remove('is-current'));
    activePage = null;
  };
}

function cleanup() {
  pageCleanup();
  pageCleanup = () => {};
}

document.addEventListener('astro:page-load', boot);
document.addEventListener('astro:before-swap', cleanup);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
