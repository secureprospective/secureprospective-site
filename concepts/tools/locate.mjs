import { createRequire } from 'node:module';
// puppeteer is installed alongside the Impeccable skill, because that is where
// the detector resolves it from. Resolve it explicitly so this script works
// from any working directory instead of depending on node's upward search.
const require = createRequire('/home/chris/work/secureprospective-site/.claude/skills/impeccable/');
const puppeteer = require('puppeteer');
const [url, w, h] = [process.argv[2], +process.argv[3], +process.argv[4]];
const b = await puppeteer.launch({ args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: w, height: h });
await p.goto(url, { waitUntil: 'networkidle0' });
const out = await p.evaluate(() => {
  const path = (el) => {
    const bits = [];
    while (el && el.nodeType === 1 && bits.length < 4) {
      bits.unshift(el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''));
      el = el.parentElement;
    }
    return bits.join(' > ');
  };
  const caps = [];
  const edge = [];
  document.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    const txt = (el.textContent || '').trim();
    const own = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').trim();
    if (cs.textTransform === 'uppercase' && own.length >= 25) {
      caps.push({ len: own.length, text: own.slice(0, 60), sel: path(el), size: cs.fontSize });
    }
    if (el.tagName === 'P' && txt.length > 100) {
      const r = el.getBoundingClientRect();
      if (r.left < 18) edge.push({ left: Math.round(r.left), len: txt.length, sel: path(el), pad: cs.paddingLeft, text: txt.slice(0, 45) });
    }
  });
  return { caps, edge, docW: document.documentElement.scrollWidth, winW: window.innerWidth };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
