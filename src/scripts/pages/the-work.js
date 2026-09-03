/* ==========================================================================
   SP+ / THE WORK

   The map is a small inspection surface. It lets a reader choose one of the
   three product foundations and see that state register in the representation.
   It is additive only: the complete explanation remains in the page below, so
   no-JavaScript and reduced-motion readers lose nothing.
   ========================================================================== */

const foundationContent = {
  encrypted: {
    label: 'FOUNDATION // ENCRYPTED',
    title: 'Encrypted from installation',
    copy: 'Full-disk encryption is built into the setup model.',
  },
  immutable: {
    label: 'FOUNDATION // IMMUTABLE',
    title: 'A controlled operating foundation',
    copy: 'The core system is immutable and updated as a managed image.',
  },
  contained: {
    label: 'FOUNDATION // CONTAINED',
    title: 'Containment where it matters',
    copy: 'Applications are isolated wherever practical to make lateral movement harder.',
  },
};

let active = false;
let cleanups = [];

function cleanup() {
  cleanups.reverse().forEach((teardown) => teardown());
  cleanups = [];
  active = false;
}

function boot() {
  if (active) return;

  const map = document.querySelector('[data-system-map]');
  if (!map) return;

  const tabs = Array.from(map.querySelectorAll('[data-map-tab]'));
  const panel = map.querySelector('[data-map-panel]');
  const panelLabel = map.querySelector('[data-map-panel-label]');
  const panelTitle = map.querySelector('[data-map-panel-title]');
  const panelCopy = map.querySelector('[data-map-panel-copy]');

  if (!tabs.length || !panel || !panelLabel || !panelTitle || !panelCopy) return;

  active = true;

  const selectFoundation = (id, moveFocus = false) => {
    const content = foundationContent[id];
    if (!content) return;

    map.dataset.stage = id;
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    panelLabel.textContent = content.label;
    panelTitle.textContent = content.title;
    panelCopy.textContent = content.copy;

    tabs.forEach((tab) => {
      const selected = tab.dataset.mapTab === id;
      tab.setAttribute('aria-selected', String(selected));
      tab.setAttribute('tabindex', selected ? '0' : '-1');
      if (selected && moveFocus) tab.focus();
    });
  };

  const onTabClick = (event) => {
    selectFoundation(event.currentTarget.dataset.mapTab);
  };

  const onTabKeydown = (event) => {
    const currentIndex = tabs.indexOf(event.currentTarget);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === currentIndex) return;

    event.preventDefault();
    selectFoundation(tabs[nextIndex].dataset.mapTab, true);
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', onTabClick);
    tab.addEventListener('keydown', onTabKeydown);
    cleanups.push(() => {
      tab.removeEventListener('click', onTabClick);
      tab.removeEventListener('keydown', onTabKeydown);
    });
  });

  const initial = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];
  selectFoundation(initial.dataset.mapTab);
  cleanups.push(() => {
    map.removeAttribute('data-stage');
  });
}

document.addEventListener('astro:page-load', boot);
document.addEventListener('astro:before-swap', cleanup);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
