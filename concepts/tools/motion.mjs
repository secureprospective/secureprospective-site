/* ==========================================================================
   motion.mjs — the acceptance gate for concept animation work.

   The Impeccable detector reads a rendered page; it says nothing about whether
   the page still works once motion is taken away, or whether motion costs more
   than it is worth. This measures the four things that actually decide that:

     1. reduced-motion completeness — with prefers-reduced-motion: reduce, is
        the page still whole? Any content that only script reveals is a defect,
        not a degradation.
     2. no-JavaScript completeness — same question with script disabled.
     3. scroll cost — real frame timings through a full scripted pass down the
        page, so an effect that looks good on this machine cannot hide what it
        costs on a slow one. Runs with CPU throttling.
     4. layout integrity — no horizontal page overflow at six widths.

   Plus the brand copy rule: zero em dashes in visitor-facing text.

   Usage:  node concepts/tools/motion.mjs <url> [--throttle N]
   Exit 0 = pass, 2 = at least one gate failed. It is meant to be able to fail;
   run it against a page you have deliberately broken if you ever doubt that.
   ========================================================================== */

import { createRequire } from 'module';
const require = createRequire('/home/chris/work/secureprospective-site/.claude/skills/impeccable/');
const puppeteer = require('puppeteer');

const url = process.argv[2];
if (!url) {
  console.error('usage: node concepts/tools/motion.mjs <url> [--throttle N]');
  process.exit(64);
}
const throttleIndex = process.argv.indexOf('--throttle');
const CPU_THROTTLE = throttleIndex > -1 ? Number(process.argv[throttleIndex + 1]) : 4;

const WIDTHS = [1920, 1440, 1280, 1024, 768, 390];
const failures = [];
const note = (ok, label, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`);
  if (!ok) failures.push(label);
};

/** Visible, rendered text — the only measure of "is the page whole" that a
 *  reveal animation cannot fake by leaving an element at opacity 0. */
const harvest = () =>
  Array.from(document.querySelectorAll('h1, h2, h3, p, li, a, button'))
    .filter((el) => {
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') return false;
      if (Number(style.opacity) < 0.05) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    })
    .map((el) => el.textContent.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });

async function textUnder({ reducedMotion = false, javaScript = true }) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  if (reducedMotion) {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  }
  if (!javaScript) await page.setJavaScriptEnabled(false);
  await page.goto(url, { waitUntil: 'networkidle0' });
  // Scroll the whole page first: content gated on an IntersectionObserver is
  // legitimately hidden until seen, so it must be given the chance to be seen.
  if (javaScript) {
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.75;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await new Promise((r) => setTimeout(r, 400));
  }
  const strings = await page.evaluate(harvest);
  await page.close();
  return new Set(strings);
}

/* ---- 1 + 2: completeness without motion, and without script ---- */

const full = await textUnder({});
const reduced = await textUnder({ reducedMotion: true });
const noJs = await textUnder({ javaScript: false });

const missingFrom = (other) => [...full].filter((s) => !other.has(s));

const missingReduced = missingFrom(reduced);
note(
  missingReduced.length === 0,
  'reduced-motion completeness',
  missingReduced.length ? `${missingReduced.length} strings absent, first: "${missingReduced[0].slice(0, 70)}"` : `${full.size} strings present`
);

const missingNoJs = missingFrom(noJs);
note(
  missingNoJs.length === 0,
  'no-JavaScript completeness',
  missingNoJs.length ? `${missingNoJs.length} strings absent, first: "${missingNoJs[0].slice(0, 70)}"` : `${full.size} strings present`
);

/* ---- 3: what the motion costs on a slow machine ---- */

{
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const client = await page.createCDPSession();
  await client.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE });
  await page.goto(url, { waitUntil: 'networkidle0' });

  const frames = await page.evaluate(async () => {
    const gaps = [];
    let last = performance.now();
    let running = true;
    const tick = () => {
      if (!running) return;
      const now = performance.now();
      gaps.push(now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // A steady pass down the page and back, driven frame by frame rather than
    // in jumps, so scroll-scrubbed effects are exercised the way a reader
    // exercises them.
    const distance = document.body.scrollHeight - window.innerHeight;
    for (let i = 0; i <= 120; i++) {
      window.scrollTo({ top: (distance * i) / 120, behavior: 'instant' });
      await new Promise((r) => requestAnimationFrame(r));
    }
    running = false;
    gaps.shift();
    return gaps;
  });

  frames.sort((a, b) => a - b);
  const p95 = frames[Math.floor(frames.length * 0.95)] || 0;
  const worst = frames[frames.length - 1] || 0;
  // 32ms is two frames at 60Hz. A 95th percentile past that means the page is
  // visibly hitching for one reader in twenty, not occasionally stuttering.
  note(
    p95 <= 32,
    `scroll cost at ${CPU_THROTTLE}x CPU throttle`,
    `p95 ${p95.toFixed(1)}ms, worst ${worst.toFixed(1)}ms, ${frames.length} frames`
  );
  await page.close();
}

/* ---- 4: layout integrity, and the copy rule ---- */

{
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
  for (const width of WIDTHS) {
    await page.setViewport({ width, height: 900 });
    await new Promise((r) => setTimeout(r, 250));
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    note(overflow <= 0, `no horizontal overflow at ${width}`, `${overflow}px`);
  }

  const emDashes = await page.evaluate(() =>
    (document.body.innerText.match(/[^\n]*—[^\n]*/g) || []).slice(0, 3)
  );
  note(emDashes.length === 0, 'zero em dashes in visitor copy', emDashes.join(' | ').slice(0, 120));
  await page.close();
}

await browser.close();

console.log(failures.length ? `\n${failures.length} gate(s) failed: ${failures.join(', ')}` : '\nAll gates passed.');
process.exit(failures.length ? 2 : 0);
