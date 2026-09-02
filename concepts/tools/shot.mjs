import { createRequire } from 'node:module';
// puppeteer is installed alongside the Impeccable skill, because that is where
// the detector resolves it from. Resolve it explicitly so this script works
// from any working directory instead of depending on node's upward search.
const require = createRequire('/home/chris/work/secureprospective-site/.claude/skills/impeccable/');
const puppeteer = require('puppeteer');
const [url, out, w, h, full] = process.argv.slice(2);
const b = await puppeteer.launch({ args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: +w, height: +h, deviceScaleFactor: 2 });
await p.goto(url, { waitUntil: 'networkidle0' });
// Let entry animations settle so the shot shows the resting composition.
// A full-page screenshot does not scroll, so scroll-triggered reveals never
// fire and every section below the fold captures at opacity 0. That produced a
// page-long grey void in review and looked exactly like a catastrophic layout
// bug. Walk the page first, let the reveals land, then return to the top.
await p.evaluate(async () => {
  const step = window.innerHeight * 0.7;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo({ top: y, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 120));
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
});
await new Promise(r => setTimeout(r, 1200));
await p.screenshot({ path: out, fullPage: full === 'full', type: 'jpeg', quality: 88 });
await b.close();
console.log('wrote', out);
