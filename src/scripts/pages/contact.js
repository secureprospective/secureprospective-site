/* ==========================================================================
   Contact — direct routing enhancement.

   The links work without this module. When a pointer or keyboard focus
   inspects a line, the yellow route marker moves to that line and the small
   readout mirrors the existing status label. It is orientation, not a gate.
   ========================================================================== */

let teardown = () => {};

function boot() {
  teardown();

  const root = document.querySelector('[data-contact-root]');
  if (!root) return;

  const lines = Array.from(root.querySelectorAll('[data-contact-line]'));
  const marker = root.querySelector('.contact-route-marker');
  const readout = root.querySelector('[data-contact-readout]');
  const gutter = root.querySelector('.contact-route-gutter');
  if (!lines.length || !marker || !readout || !gutter) return;

  let activeLine = null;

  const positionMarker = (line) => {
    if (!line) return;
    const lineRect = line.getBoundingClientRect();
    const gutterRect = gutter.getBoundingClientRect();
    const y = lineRect.top + lineRect.height / 2 - gutterRect.top;
    root.style.setProperty('--contact-route-y', `${Math.max(30, y)}px`);
  };

  const setActive = (line) => {
    activeLine = line;
    lines.forEach((candidate) => candidate.classList.toggle('is-inspected', candidate === line));

    if (line) {
      root.dataset.activeLine = line.dataset.contactLine || '';
      readout.textContent = line.dataset.routeLabel || 'SELECT A LINE';
      positionMarker(line);
    } else {
      delete root.dataset.activeLine;
      readout.textContent = 'SELECT A LINE';
    }
  };

  const onPointerEnter = (event) => {
    if (event.pointerType === 'touch') return;
    setActive(event.currentTarget);
  };

  const onPointerLeave = (event) => {
    if (event.currentTarget.matches(':focus')) return;
    if (!event.currentTarget.matches(':hover')) setActive(null);
  };

  const onFocus = (event) => setActive(event.currentTarget);

  const onBlur = (event) => {
    if (event.currentTarget.matches(':hover')) return;
    setActive(null);
  };

  lines.forEach((line) => {
    line.addEventListener('pointerenter', onPointerEnter, { passive: true });
    line.addEventListener('pointerleave', onPointerLeave, { passive: true });
    line.addEventListener('focus', onFocus);
    line.addEventListener('blur', onBlur);
  });

  const onResize = () => {
    if (activeLine) positionMarker(activeLine);
  };
  window.addEventListener('resize', onResize, { passive: true });

  teardown = () => {
    lines.forEach((line) => {
      line.removeEventListener('pointerenter', onPointerEnter);
      line.removeEventListener('pointerleave', onPointerLeave);
      line.removeEventListener('focus', onFocus);
      line.removeEventListener('blur', onBlur);
      line.classList.remove('is-inspected');
    });
    window.removeEventListener('resize', onResize);
    root.style.removeProperty('--contact-route-y');
    root.removeAttribute('data-active-line');
    readout.textContent = 'SELECT A LINE';
    activeLine = null;
    teardown = () => {};
  };
}

document.addEventListener('astro:page-load', boot);
document.addEventListener('astro:before-swap', () => teardown());

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
