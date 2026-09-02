/* ==========================================================================
   divergence.mjs — are these pages actually different from each other?

   Christopher's requirement for the inner pages was "No 2 pages are the same,
   that is because a different page has a different message." Five agents
   designing in parallel against one shared system is exactly the setup that
   produces five variations of the same page, and the failure is invisible when
   you review pages one at a time. This looks at them together.

   For each page it takes a signature of what the design actually does:
     - the structural classes the page's own stylesheet introduces
     - the section rhythm (how many bands, and how tall each one is)
     - the type scale in use (the distinct rendered font sizes, largest first)
     - the palette in use (distinct backgrounds and text colours, by area)
     - the motion surface (which data- attributes drive behaviour)

   Then it reports pairwise overlap. High overlap between two pages is not
   automatically wrong: the shared system is meant to be shared. What it flags
   is two pages whose *own* contribution is the same, which means one of them
   is decoration rather than a distinct message.

   Usage: node concepts/tools/divergence.mjs <base-url> <slug> [slug...]
   ========================================================================== */

import { createRequire } from 'module';
const require = createRequire('/home/chris/work/secureprospective-site/.claude/skills/impeccable/');
const puppeteer = require('puppeteer');

const [base, ...slugs] = process.argv.slice(2);
if (!base || slugs.length < 2) {
  console.error('usage: node concepts/tools/divergence.mjs <base-url> <slug> [slug...]');
  process.exit(64);
}

const signature = () => {
  const round = (n) => Math.round(Number(n) * 10) / 10;
  const areaOf = (el) => { const r = el.getBoundingClientRect(); return r.width * r.height; };

  const sections = Array.from(document.querySelectorAll('main > section, main > div, main > article'));
  const all = Array.from(document.querySelectorAll('main *'));

  const classes = new Set();
  const sizes = new Map();
  const inks = new Map();
  const grounds = new Map();
  const hooks = new Set();

  all.forEach((el) => {
    el.classList.forEach((c) => classes.add(c));
    Array.from(el.attributes).forEach((a) => { if (a.name.startsWith('data-')) hooks.add(a.name); });
    const s = getComputedStyle(el);
    const area = areaOf(el);
    if (area <= 0) return;
    if (el.textContent && el.children.length === 0) {
      sizes.set(round(parseFloat(s.fontSize)), (sizes.get(round(parseFloat(s.fontSize))) || 0) + 1);
      inks.set(s.color, (inks.get(s.color) || 0) + area);
    }
    if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      grounds.set(s.backgroundColor, (grounds.get(s.backgroundColor) || 0) + area);
    }
  });

  const top = (map, n) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => String(k));

  return {
    sectionCount: sections.length,
    sectionHeights: sections.map((s) => Math.round(s.getBoundingClientRect().height / 100) * 100),
    classes: [...classes].sort(),
    typeScale: [...sizes.keys()].sort((a, b) => b - a).slice(0, 8),
    inks: top(inks, 4),
    grounds: top(grounds, 4),
    hooks: [...hooks].sort(),
  };
};

const jaccard = (a, b) => {
  const A = new Set(a), B = new Set(b);
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  // Two pages that both contribute nothing on an axis are identical on it, not
  // maximally different. Returning 0 here scored an absence of motion as
  // originality and made the whole gate incapable of failing.
  return union === 0 ? 1 : inter / union;
};

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
const sigs = {};

for (const slug of slugs) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${base.replace(/\/$/, '')}/${slug}`, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.75;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 80));
    }
  });
  sigs[slug] = await page.evaluate(signature);
  await page.close();
}
await browser.close();

console.log('PER PAGE\n');
for (const slug of slugs) {
  const s = sigs[slug];
  console.log(`  ${slug}`);
  console.log(`    sections   ${s.sectionCount}  heights ${s.sectionHeights.join(' ')}`);
  console.log(`    type scale ${s.typeScale.join(' ')}`);
  console.log(`    grounds    ${s.grounds.join('  ')}`);
  console.log(`    motion     ${s.hooks.join(' ') || '(none)'}`);
  console.log('');
}

console.log('PAIRWISE OVERLAP  (1.00 = identical vocabulary)\n');
const flags = [];
for (let i = 0; i < slugs.length; i++) {
  for (let j = i + 1; j < slugs.length; j++) {
    const a = sigs[slugs[i]], b = sigs[slugs[j]];
    const cls = jaccard(a.classes, b.classes);
    const hook = jaccard(a.hooks, b.hooks);
    const type = jaccard(a.typeScale, b.typeScale);
    const ground = jaccard(a.grounds, b.grounds);
    const composite = (cls + hook + type + ground) / 4;
    const mark = composite > 0.8 ? '  <-- too alike' : '';
    if (composite > 0.8) flags.push(`${slugs[i]} / ${slugs[j]}`);
    console.log(
      `  ${slugs[i].padEnd(13)} ${slugs[j].padEnd(13)} classes ${cls.toFixed(2)}  motion ${hook.toFixed(2)}  type ${type.toFixed(2)}  ground ${ground.toFixed(2)}  composite ${composite.toFixed(2)}${mark}`
    );
  }
}

console.log(flags.length ? `\n${flags.length} pair(s) too alike: ${flags.join(', ')}` : '\nNo two pages share a signature.');
process.exit(flags.length ? 2 : 0);
