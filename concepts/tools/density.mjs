/* ==========================================================================
   density.mjs — composition gate. Finds dead space and hollow containers.

   mobile.mjs asks whether any *element* is broken. Every element can be
   individually correct while the page still reads as broken, because the
   defect lives in the arrangement rather than in any one box: a section whose
   content collapsed out of it leaves a tall band of nothing, and a card whose
   body did not survive a reflow keeps its border and loses its contents. Both
   pass an element-level audit — there is no clipped text, no overflow, no
   undersized tap target — and both look, to a visitor, like the page failed
   to load.

   This measures ink instead of boxes. Ink is anything a visitor can actually
   see: an element holding its own text, a raster or vector image, or a filled
   or bordered surface distinct from the page ground. A region of the page with
   no ink in it is empty no matter how many elements are nested there.

   Checks, at each width given:
     dead-band       a horizontal band of the page taller than one gap budget
                     with no ink anywhere across it
     hollow-card     a large bordered or filled container holding no text and
                     no image at all

   Usage: node concepts/tools/density.mjs <base-url> <slug|-> [slug...]
   Exit 2 if anything is found. "-" means the site root.
   ========================================================================== */

import { createRequire } from 'module';
const require = createRequire('/home/chris/work/secureprospective-site/.claude/skills/impeccable/');
const puppeteer = require('puppeteer');

const [base, ...slugs] = process.argv.slice(2);
if (!base || !slugs.length) {
  console.error('usage: node concepts/tools/density.mjs <base-url> <slug|-> [slug...]');
  process.exit(64);
}

const WIDTHS = [390, 1280];

// A band of empty page shorter than this is deliberate breathing room. The
// budget is a share of the viewport rather than a fixed pixel count, because
// what reads as "a suspicious amount of nothing" scales with how much of the
// page the visitor can see at once.
const DEAD_BAND_RATIO = 0.75;

// Hollowness is the total absence of content, not a low density of it. A ratio
// threshold was tried first and rejected: it flagged every rail and marker
// column on the site, which are narrow grid gutters holding one short label and
// are meant to read as mostly empty. There is no ratio that separates those
// from a card that lost its contents, because by area they are the same shape.
// A large bordered surface containing no text and no image whatsoever is not
// ambiguous.
const CARD_MIN_AREA = 12000;

const survey = (cardMinArea) => {
  const out = { ink: [], cards: [] };
  const pageHeight = document.documentElement.scrollHeight;

  const rect = (el) => el.getBoundingClientRect();
  const abs = (r) => ({
    top: r.top + window.scrollY,
    bottom: r.bottom + window.scrollY,
    left: r.left + window.scrollX,
    right: r.right + window.scrollX,
  });

  const path = (el) => {
    const bits = [];
    for (let n = el; n && n.nodeType === 1 && bits.length < 4; n = n.parentElement) {
      bits.unshift(n.tagName.toLowerCase() + (n.id ? `#${n.id}` : n.classList.length ? `.${n.classList[0]}` : ''));
    }
    return bits.join(' > ');
  };

  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return false;
    const r = rect(el);
    return r.width > 0 && r.height > 0;
  };

  // Screen-reader-only text is painted nowhere. Counting it as ink would let a
  // visually empty band pass because it happens to contain a caption nobody
  // can see.
  const srOnly = (el) => {
    const r = rect(el);
    const s = getComputedStyle(el);
    return (r.width <= 2 && r.height <= 2) || s.clipPath === 'inset(50%)' || s.clip === 'rect(0px, 0px, 0px, 0px)';
  };

  const transparent = (c) => !c || c === 'transparent' || /rgba\(\s*[\d.]+,\s*[\d.]+,\s*[\d.]+,\s*0\s*\)/.test(c);
  const ground = getComputedStyle(document.body).backgroundColor;

  const docArea = document.documentElement.scrollWidth * pageHeight;

  // Text held directly by this element, not by its descendants. Without this
  // every ancestor up to <body> would claim its children's text as its own ink
  // and the whole document would measure as uniformly full.
  const ownText = (el) =>
    Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join('')
      .trim();

  const els = Array.from(document.querySelectorAll('body *')).filter(visible);

  for (const el of els) {
    const s = getComputedStyle(el);
    const r = rect(el);
    const a = abs(r);
    const area = r.width * r.height;

    const isMedia = /^(img|svg|canvas|video|picture)$/i.test(el.tagName);
    const hasOwnText = !srOnly(el) && ownText(el).length > 0;

    const filled =
      (!transparent(s.backgroundColor) && s.backgroundColor !== ground) ||
      (s.backgroundImage && s.backgroundImage !== 'none');
    const bordered = ['Top', 'Right', 'Bottom', 'Left'].some(
      (side) => parseFloat(s[`border${side}Width`]) > 0 && !transparent(s[`border${side}Color`])
    );

    // Only content counts as ink. A filled or bordered surface is deliberately
    // excluded: a coloured band is emptiness with a colour on it, and counting
    // it would let a section whose contents collapsed report as full. It would
    // also make every card contain itself, so hollow ones could never be found.
    if (isMedia || hasOwnText) out.ink.push(a);

    if ((filled || bordered) && area >= cardMinArea && area < docArea * 0.4) {
      out.cards.push({ box: a, area, path: path(el) });
    }
  }

  return out;
};

const intersect = (a, b) => {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
};

const findings = [];

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

for (const slug of slugs) {
  const url = slug === '-' ? base : `${base.replace(/\/$/, '')}/${slug}`;
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 844, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

    // Reveals are scroll-triggered. A survey taken without walking the page
    // first measures every section below the fold at opacity 0 and reports the
    // entire document as one enormous dead band.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.7;
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 250));
    });

    const { ink, cards } = await page.evaluate(survey, CARD_MIN_AREA);

    // Dead bands: collapse every ink rect onto the y axis, then look at what is
    // left uncovered between the first and last ink on the page.
    const spans = ink
      .map((r) => [Math.floor(r.top), Math.ceil(r.bottom)])
      .sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const [top, bottom] of spans) {
      const last = merged[merged.length - 1];
      if (last && top <= last[1]) last[1] = Math.max(last[1], bottom);
      else merged.push([top, bottom]);
    }
    const budget = 844 * DEAD_BAND_RATIO;
    for (let i = 1; i < merged.length; i += 1) {
      const gap = merged[i][0] - merged[i - 1][1];
      if (gap > budget) {
        findings.push({
          slug, width, kind: 'dead-band',
          detail: `${Math.round(gap)}px of empty page at y=${Math.round(merged[i - 1][1])}`,
        });
      }
    }

    for (const card of cards) {
      const holds = ink.some((r) => intersect(card.box, r) > 0);
      if (!holds) {
        findings.push({
          slug, width, kind: 'hollow-card',
          detail: `${card.path} is ${Math.round(card.area)}px2 and holds no text or image`,
        });
      }
    }

    await page.close();
  }
}

await browser.close();

if (!findings.length) {
  console.log('PASS  composition  no dead bands, no hollow containers');
  process.exit(0);
}

for (const f of findings) {
  console.log(`FAIL  ${f.slug} @${f.width}  ${f.kind}  ${f.detail}`);
}
console.log(`\n${findings.length} finding(s).`);
process.exit(2);
