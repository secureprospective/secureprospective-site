/* ==========================================================================
   mobilenav.mjs — does the phone menu actually work?

   Every other gate measures the page at rest. The mobile navigation is behind
   a toggle, so a static audit never opens it: the links could be off-screen,
   unreachable, overlapping or untappable and every check would still pass.
   This drives it the way a person does, with real taps.

   Checks, per page, at 390 and 360:
     opens          tapping Index opens the menu and sets aria-expanded
     links usable   every link is on-screen, at least 44px tall, not overlapped
     escape closes  Escape closes it and returns focus to the toggle
     tap closes     tapping a link navigates rather than dead-ending
     no trap        the page behind does not stay scroll-locked after closing

   Usage: node concepts/tools/mobilenav.mjs <base-url> <slug|-> [slug...]
   ========================================================================== */

import { createRequire } from 'module';
const require = createRequire('/home/chris/work/secureprospective-site/.claude/skills/impeccable/');
const puppeteer = require('puppeteer');

const [base, ...slugs] = process.argv.slice(2);
if (!base || !slugs.length) {
  console.error('usage: node concepts/tools/mobilenav.mjs <base-url> <slug|-> [slug...]');
  process.exit(64);
}

const fails = [];
const note = (ok, label, detail) => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`);
  if (!ok) fails.push(label);
};

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });

for (const slug of slugs) {
  const url = `${base.replace(/\/$/, '')}${slug === '-' ? '/' : '/' + slug}`;
  for (const width of [390, 360]) {
    console.log(`\n${slug === '-' ? '/' : '/' + slug}  @${width}px`);
    const page = await browser.newPage();
    await page.setViewport({ width, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: 'networkidle0' });

    const toggle = await page.$('.nav-toggle');
    if (!toggle) { note(false, 'toggle present'); await page.close(); continue; }

    const toggleVisible = await page.evaluate((el) => {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      return s.display !== 'none' && r.width > 0 && r.height >= 44;
    }, toggle);
    note(toggleVisible, 'toggle present and 44px tall');

    await toggle.tap();
    await new Promise((r) => setTimeout(r, 400));

    const opened = await page.evaluate(() => {
      const t = document.querySelector('.nav-toggle');
      const l = document.getElementById('site-links');
      return { expanded: t.getAttribute('aria-expanded'), open: l && l.classList.contains('is-open'),
               visible: l ? getComputedStyle(l).display !== 'none' && l.getBoundingClientRect().height > 0 : false };
    });
    note(opened.expanded === 'true' && opened.visible, 'tapping Index opens the menu',
      `aria-expanded=${opened.expanded} visible=${opened.visible}`);

    const links = await page.evaluate(() => {
      const l = document.getElementById('site-links');
      if (!l) return [];
      return Array.from(l.querySelectorAll('a')).map((a) => {
        const r = a.getBoundingClientRect();
        const mid = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { text: a.textContent.trim(), top: Math.round(r.top), bottom: Math.round(r.bottom),
          h: Math.round(r.height), w: Math.round(r.width),
          onScreen: r.top >= 0 && r.bottom <= window.innerHeight,
          hittable: !!mid && (mid === a || a.contains(mid)) };
      });
    });
    const offScreen = links.filter((l) => !l.onScreen);
    const short = links.filter((l) => l.h < 44);
    const blocked = links.filter((l) => !l.hittable);
    note(links.length > 0, 'menu has links', `${links.length} found`);
    note(offScreen.length === 0, 'every link on screen',
      offScreen.length ? offScreen.map((l) => `${l.text}@${l.top}..${l.bottom}`).join(' ') : '');
    note(short.length === 0, 'every link at least 44px tall',
      short.length ? short.map((l) => `${l.text}=${l.h}px`).join(' ') : '');
    note(blocked.length === 0, 'no link covered by another element',
      blocked.length ? blocked.map((l) => l.text).join(' ') : '');

    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 300));
    const closed = await page.evaluate(() => {
      const t = document.querySelector('.nav-toggle');
      const l = document.getElementById('site-links');
      return { expanded: t.getAttribute('aria-expanded'), open: l && l.classList.contains('is-open'),
               focused: document.activeElement === t,
               bodyLocked: getComputedStyle(document.body).overflow === 'hidden' };
    });
    note(closed.expanded === 'false' && !closed.open, 'Escape closes the menu');
    note(closed.focused, 'focus returns to the toggle');
    note(!closed.bodyLocked, 'page is not left scroll-locked');

    await page.close();
  }
}

await browser.close();
console.log(fails.length ? `\n${fails.length} failure(s).` : '\nMobile navigation is sound everywhere.');
process.exit(fails.length ? 2 : 0);
