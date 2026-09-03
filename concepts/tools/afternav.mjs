/* ==========================================================================
   afternav.mjs — does the site still work once you have moved around it?

   Every other gate loads a page fresh and measures it. The site navigates with
   View Transitions, which swap the document without a reload, so a fresh load
   is the one state in which a rebinding defect cannot appear. That is exactly
   how a dead mobile menu passed nine consecutive navigation checks: the menu
   worked perfectly on arrival and died the moment anyone used it.

   Each page is measured twice, once loaded directly and once arrived at by
   clicking a link, and the two are compared. A page that differs depending on
   how the visitor got there is broken for the visitor who navigated.

   Checks:
     content after nav    text visible on a fresh load is visible on arrival.
                          Catches reveals whose observer was never rebound,
                          which leaves whole sections at opacity 0.
     state after nav      scroll-driven state (is-current, active, data hooks)
                          that a fresh load reaches is also reached on arrival.
                          Catches scroll machinery that stopped rebinding.
     controls after nav   every control that responds to a click on a fresh
                          load still responds once the page was arrived at.
                          This is the check that sits directly on the reported
                          defect: a handler bound at module evaluation is gone
                          after the first swap, and nothing else notices.
     no listener stacking repeatedly navigating away and back does not leave a
                          growing pile of scroll and resize handlers. Every
                          boot must be matched by its teardown.

   Usage: node concepts/tools/afternav.mjs <base-url> <slug|-> [slug...]
   Exit 2 if anything is found. "-" means the site root.
   ========================================================================== */

import { createRequire } from 'module';
const require = createRequire('/home/chris/work/secureprospective-site/.claude/skills/impeccable/');
const puppeteer = require('puppeteer');

const [base, ...slugs] = process.argv.slice(2);
if (!base || !slugs.length) {
  console.error('usage: node concepts/tools/afternav.mjs <base-url> <slug|-> [slug...]');
  process.exit(64);
}

const WIDTH = 390;
const pathOf = (slug) => (slug === '-' ? '/' : `/${slug}`);
const urlOf = (slug) => `${base.replace(/\/$/, '')}${slug === '-' ? '/' : `/${slug}`}`;

// Walk the page so IntersectionObserver reveals and scroll-driven state have
// their chance to fire, then come back to the top.
const walk = async (page) => {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.7;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 110));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 300));
  });
};

const sample = () => {
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const text = Array.from(document.querySelectorAll('h1, h2, h3, p, li, a, button'))
    .filter(visible)
    .map((el) => el.textContent.replace(/\s+/g, ''))
    .filter(Boolean);

  // State tokens are the vocabulary the page uses to say something is active.
  // Comparing the set of tokens reached, rather than which element holds them,
  // keeps the check from failing on scroll position while still noticing that a
  // whole mechanism never engaged.
  const state = new Set();
  for (const el of Array.from(document.querySelectorAll('body *'))) {
    for (const c of el.classList) {
      if (/^(is-|has-|active|current)/.test(c) || /--active|--current/.test(c)) state.add(`class:${c}`);
    }
    for (const a of el.getAttributeNames()) {
      if (a.startsWith('data-') && el.getAttribute(a)) state.add(`${a}=${el.getAttribute(a)}`);
    }
  }

  return { text: Array.from(new Set(text)), state: Array.from(state) };
};

// Counting listeners has to happen before any of the site's own script runs, so
// it is installed on the new document rather than evaluated after load.
const instrument = () => {
  window.__tally = {};
  for (const target of [window, document]) {
    const add = target.addEventListener.bind(target);
    const remove = target.removeEventListener.bind(target);
    target.addEventListener = function (type, ...rest) {
      window.__tally[type] = (window.__tally[type] || 0) + 1;
      return add(type, ...rest);
    };
    target.removeEventListener = function (type, ...rest) {
      window.__tally[type] = (window.__tally[type] || 0) - 1;
      return remove(type, ...rest);
    };
  }
};

// A control counts as responsive if clicking it changes something a visitor
// could see. Comparing a whole-document state signature rather than a specific
// expected outcome keeps this generic across pages that share no vocabulary.
const probeControls = async (page) => {
  const signature = () =>
    page.evaluate(() => {
      const bits = [];
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const cls = Array.from(el.classList).filter((c) => /^(is-|has-|active|current)/.test(c));
        const exp = el.getAttribute('aria-expanded');
        const sel = el.getAttribute('aria-selected');
        if (cls.length || exp || sel) bits.push(`${el.tagName}:${cls.join('.')}:${exp}:${sel}`);
      }
      return bits.join('|');
    });

  const count = await page.evaluate(
    () => document.querySelectorAll('button, [role="tab"], [aria-expanded], [aria-selected]').length
  );

  const responsive = [];
  for (let i = 0; i < count; i += 1) {
    const before = await signature();
    const label = await page.evaluate((n) => {
      const el = document.querySelectorAll('button, [role="tab"], [aria-expanded], [aria-selected]')[n];
      if (!el) return null;
      el.click();
      return (el.textContent || el.className || el.tagName).replace(/\s+/g, ' ').trim().slice(0, 34);
    }, i);
    if (label === null) continue;
    await new Promise((r) => setTimeout(r, 260));
    const after = await signature();
    if (before !== after) responsive.push(`${i}:${label}`);
  }
  return responsive;
};

const clickTo = async (page, slug) => {
  const target = pathOf(slug);
  const from = page.url();
  const ok = await page.evaluate((t) => {
    const a = Array.from(document.querySelectorAll('a[href]')).find(
      (link) => new URL(link.href).pathname.replace(/\/$/, '') === (t === '/' ? '' : t)
    );
    if (!a) return false;
    a.click();
    return true;
  }, target);
  if (!ok) return false;
  return page
    .waitForFunction((f) => window.location.href !== f, { timeout: 10000 }, from)
    .then(() => true)
    .catch(() => false);
};

const findings = [];
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });

/* ---- 1 + 2: is an arrived-at page the same page? ---- */

for (const slug of slugs) {
  const other = slugs.find((s) => s !== slug) ?? slug;

  const fresh = await browser.newPage();
  await fresh.setViewport({ width: WIDTH, height: 844, isMobile: true, hasTouch: true });
  await fresh.goto(urlOf(slug), { waitUntil: 'networkidle0' });
  await walk(fresh);
  const direct = await fresh.evaluate(sample);
  const directControls = await probeControls(fresh);
  await fresh.close();

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: 844, isMobile: true, hasTouch: true });
  await page.goto(urlOf(other), { waitUntil: 'networkidle0' });
  const arrived = await clickTo(page, slug);
  if (!arrived) {
    findings.push({ slug, kind: 'unreachable', detail: `no link to ${pathOf(slug)} from ${pathOf(other)}` });
    await page.close();
    continue;
  }
  await new Promise((r) => setTimeout(r, 700));
  await walk(page);
  const viaNav = await page.evaluate(sample);
  const navControls = await probeControls(page);
  await page.close();

  const missingText = direct.text.filter((t) => !viaNav.text.includes(t));
  const missingState = direct.state.filter((t) => !viaNav.state.includes(t));

  console.log(
    `${pathOf(slug).padEnd(15)} via ${pathOf(other).padEnd(15)} text ${viaNav.text.length}/${direct.text.length}  state ${viaNav.state.length}/${direct.state.length}  controls ${navControls.length}/${directControls.length}`
  );

  const deadControls = directControls.filter((c) => !navControls.includes(c));
  if (deadControls.length) {
    findings.push({
      slug, kind: 'controls-after-nav',
      detail: `${deadControls.length} control(s) respond on a fresh load but not on arrival: ${deadControls.slice(0, 4).join(', ')}`,
    });
  }

  if (missingText.length) {
    findings.push({
      slug, kind: 'content-after-nav',
      detail: `${missingText.length} strings visible on load are absent on arrival, first: "${missingText[0].slice(0, 60)}"`,
    });
  }
  if (missingState.length) {
    findings.push({
      slug, kind: 'state-after-nav',
      detail: `${missingState.length} state tokens never reached on arrival: ${missingState.slice(0, 4).join(', ')}`,
    });
  }
}

/* ---- 3: does moving around leave handlers behind? ---- */

const tour = await browser.newPage();
await tour.setViewport({ width: WIDTH, height: 844, isMobile: true, hasTouch: true });
await tour.evaluateOnNewDocument(instrument);
await tour.goto(urlOf(slugs[0]), { waitUntil: 'networkidle0' });
const before = await tour.evaluate(() => ({ ...window.__tally }));

const lap = slugs.length > 1 ? [...slugs.slice(1), slugs[0]] : slugs;
for (let round = 0; round < 2; round += 1) {
  for (const slug of lap) {
    if (await clickTo(tour, slug)) await new Promise((r) => setTimeout(r, 500));
  }
}
const after = await tour.evaluate(() => ({ ...window.__tally }));
await tour.close();

// The lifecycle listeners are registered once and are meant to persist, so only
// the handlers a page boots and is expected to tear down are compared.
const IGNORE = new Set(['astro:page-load', 'astro:before-swap', 'astro:after-swap', 'DOMContentLoaded']);
const laps = 2 * lap.length;
for (const type of new Set([...Object.keys(before), ...Object.keys(after)])) {
  if (IGNORE.has(type)) continue;
  const grew = (after[type] || 0) - (before[type] || 0);
  if (grew > 0) {
    findings.push({
      slug: '(site)', kind: 'listener-stacking',
      detail: `${grew} extra "${type}" listeners after ${laps} navigations, so each one leaves ${(grew / laps).toFixed(1)} behind`,
    });
  }
}

await browser.close();

if (!findings.length) {
  console.log('\nPASS  after navigation  every page is the same page it is on a fresh load');
  process.exit(0);
}
console.log('');
for (const f of findings) console.log(`FAIL  ${f.slug}  ${f.kind}  ${f.detail}`);
console.log(`\n${findings.length} finding(s).`);
process.exit(2);
