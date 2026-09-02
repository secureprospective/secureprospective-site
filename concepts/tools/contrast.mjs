/* ==========================================================================
   contrast.mjs — legibility gate.

   mobile.mjs catches text that is too small. Text can be a comfortable size
   and still be unreadable, because legibility is a relationship between the
   ink and the surface behind it rather than a property of either one. Nothing
   in the existing gates measures that relationship, and it is the failure the
   brand is most exposed to: the signal yellow is a background and accent
   colour, and the moment it is set as text on a light ground it disappears
   while still passing every size, overflow and composition check.

   Contrast is computed against the first opaque surface found walking up the
   ancestor chain, which is what the eye actually sees. Thresholds are WCAG AA:
   4.5:1 for body text, 3:1 for large text (24px, or 18.66px at 700 weight).

   Checks, at each width given:
     low-contrast    rendered text below its AA threshold
     yellow-on-light brand yellow set as text on a light surface, reported
                     separately because it is a standing brand rule and not
                     merely a numeric miss

   Usage: node concepts/tools/contrast.mjs <base-url> <slug|-> [slug...]
   Exit 2 if anything is found. "-" means the site root.
   ========================================================================== */

import { createRequire } from 'module';
const require = createRequire('/home/chris/work/secureprospective-site/.claude/skills/impeccable/');
const puppeteer = require('puppeteer');

const [base, ...slugs] = process.argv.slice(2);
if (!base || !slugs.length) {
  console.error('usage: node concepts/tools/contrast.mjs <base-url> <slug|-> [slug...]');
  process.exit(64);
}

const WIDTHS = [390, 1280];

const audit = () => {
  const out = [];

  const parse = (c) => {
    const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  };

  const lum = ({ r, g, b }) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };

  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  // Compositing matters. Text at 60% opacity over white is not the colour the
  // stylesheet names, and reading the declared value would clear a swatch the
  // eye cannot actually resolve.
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
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
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const srOnly = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return (r.width <= 2 && r.height <= 2) || s.clipPath === 'inset(50%)' || s.clip === 'rect(0px, 0px, 0px, 0px)';
  };

  // The surface behind the text is the first ancestor that actually paints one.
  // A background-image is treated as unknown rather than guessed at, because a
  // photograph has no single colour and inventing one would produce a number
  // that is confidently wrong.
  const surface = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage && s.backgroundImage !== 'none') return null;
      const c = parse(s.backgroundColor);
      if (c && c.a >= 0.95) return c;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };

  const ownText = (el) =>
    Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join('')
      .trim();

  for (const el of Array.from(document.querySelectorAll('body *'))) {
    if (!visible(el) || srOnly(el)) continue;
    const text = ownText(el);
    if (!text) continue;

    const s = getComputedStyle(el);
    const bg = surface(el);
    if (!bg) continue;

    const fgRaw = parse(s.color);
    if (!fgRaw) continue;
    const fg = over(fgRaw, bg);

    const size = parseFloat(s.fontSize);
    const weight = Number(s.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const threshold = large ? 3 : 4.5;
    const r = ratio(fg, bg);

    // Brand yellow is warm, saturated and light. On a light surface it fails
    // regardless of the exact tone, so it is identified by shape rather than by
    // matching one hex value that a token rename would silently defeat.
    const yellowish = fg.r > 180 && fg.g > 140 && fg.b < 120 && fg.r - fg.b > 90;
    const lightSurface = lum(bg) > 0.5;

    if (r < threshold) {
      out.push({
        kind: yellowish && lightSurface ? 'yellow-on-light' : 'low-contrast',
        path: path(el),
        detail: `${r.toFixed(2)}:1 needs ${threshold}:1 at ${size}px/${weight} - ${s.color} on rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
        text: text.slice(0, 45),
      });
    }
  }

  return out;
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

    // Scroll-triggered reveals start transparent. Auditing before they land
    // measures the colour of text that is still fading in.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.7;
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 250));
    });

    for (const f of await page.evaluate(audit)) findings.push({ slug, width, ...f });
    await page.close();
  }
}

await browser.close();

if (!findings.length) {
  console.log('PASS  contrast  all text meets WCAG AA against its own surface');
  process.exit(0);
}

for (const f of findings) {
  console.log(`FAIL  ${f.slug} @${f.width}  ${f.kind}  ${f.path}  ${f.detail}\n      "${f.text}"`);
}
console.log(`\n${findings.length} finding(s).`);
process.exit(2);
