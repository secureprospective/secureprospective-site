import { createRequire } from 'node:module';
// puppeteer is installed alongside the Impeccable skill, because that is where
// the detector resolves it from. Resolve it explicitly so this script works
// from any working directory instead of depending on node's upward search.
const require = createRequire('/home/chris/work/secureprospective-site/.claude/skills/impeccable/');
const puppeteer = require('puppeteer');
const b = await puppeteer.launch({ args: ['--no-sandbox'] });
for (const w of [1920, 1440, 1280, 1024, 768, 390]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: 900 });
  await p.goto(process.argv[2], { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));
  const m = await p.evaluate(() => {
    const h1 = document.querySelector('.stage h1');
    const words = Array.from(h1.querySelectorAll('.word > span'));
    const widest = Math.max(...words.map(s => s.getBoundingClientRect().width));
    const right = Math.max(...words.map(s => s.getBoundingClientRect().right));
    return {
      fontSize: getComputedStyle(h1).fontSize,
      widestWord: Math.round(widest),
      wordRight: Math.round(right),
      h1Width: Math.round(h1.getBoundingClientRect().width),
      docW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
    };
  });
  console.log(w, JSON.stringify(m));
  await p.close();
}
await b.close();
