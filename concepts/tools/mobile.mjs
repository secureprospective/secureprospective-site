/* ==========================================================================
   mobile.mjs — element-level mobile audit.

   motion.mjs asks whether the *page* overflows. That passes while individual
   elements are still clipped, unreadable, overlapping or untappable, because
   `overflow: hidden` somewhere up the tree hides the damage from a page-level
   measurement. This looks at every rendered element instead.

   Checks, at each phone width given:
     overflow-element  an element extends past the viewport's right edge
     clipped-text      a text node is cut off by its own container
     tiny-tap          an interactive control smaller than 44x44 CSS px
     crowded-tap       two interactive controls closer than 8px apart
     text-collision    two text-bearing elements visually overlap
     unreadable        rendered text under 12px
     locked-scroll     a container scrolls horizontally with no affordance

   Usage: node concepts/tools/mobile.mjs <base-url> <slug|-> [slug...]
   Exit 2 if anything is found. "-" means the site root.
   ========================================================================== */

import { createRequire } from 'module';
const require = createRequire('/home/chris/work/secureprospective-site/.claude/skills/impeccable/');
const puppeteer = require('puppeteer');

const [base, ...slugs] = process.argv.slice(2);
if (!base || !slugs.length) {
  console.error('usage: node concepts/tools/mobile.mjs <base-url> <slug|-> [slug...]');
  process.exit(64);
}
const WIDTHS = [390, 360, 320];

const audit = () => {
  const out = [];
  const vw = window.innerWidth;
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
  const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();

  // Screen-reader-only text is deliberately clipped to a 1px box. It is not a
  // layout defect and reporting it buries the real ones.
  const srOnly = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return (r.width <= 2 && r.height <= 2) || s.clipPath === 'inset(50%)' || s.clip === 'rect(0px, 0px, 0px, 0px)';
  };

  const all = Array.from(document.querySelectorAll('main *, header *, footer *'))
    .filter(visible)
    .filter((el) => !srOnly(el) && !el.closest('[class*="visually-hidden"], [class*="sr-only"]'));

  all.forEach((el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);

    if (r.right > vw + 1) {
      out.push({ kind: 'overflow-element', px: Math.round(r.right - vw), at: path(el), note: text(el).slice(0, 45) });
    }
    // A leaf whose content is wider or taller than its own padding box, with
    // the overflow clipped, is text the reader cannot finish.
    if (!el.children.length && text(el)) {
      const clipX = el.scrollWidth - el.clientWidth;
      const clipY = el.scrollHeight - el.clientHeight;
      const hidden = s.overflow === 'hidden' || s.overflowX === 'hidden' || s.overflowY === 'hidden';
      if (hidden && (clipX > 2 || clipY > 2)) {
        out.push({ kind: 'clipped-text', px: Math.round(Math.max(clipX, clipY)), at: path(el), note: text(el).slice(0, 45) });
      }
      const size = parseFloat(s.fontSize);
      if (size && size < 12) out.push({ kind: 'unreadable', px: size, at: path(el), note: text(el).slice(0, 45) });
    }
    if (el.scrollWidth - el.clientWidth > 4 && (s.overflowX === 'hidden')) {
      out.push({ kind: 'locked-scroll', px: el.scrollWidth - el.clientWidth, at: path(el), note: text(el).slice(0, 45) });
    }
  });

  const tappable = all.filter((el) => ['A', 'BUTTON', 'INPUT', 'SUMMARY', 'SELECT'].includes(el.tagName));
  tappable.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 44 || r.height < 44) {
      out.push({ kind: 'tiny-tap', px: `${Math.round(r.width)}x${Math.round(r.height)}`, at: path(el), note: text(el).slice(0, 45) });
    }
  });
  for (let i = 0; i < tappable.length; i++) {
    for (let j = i + 1; j < tappable.length; j++) {
      const a = tappable[i].getBoundingClientRect(), b = tappable[j].getBoundingClientRect();
      if (tappable[i].contains(tappable[j]) || tappable[j].contains(tappable[i])) continue;
      const dx = Math.max(0, Math.max(a.left - b.right, b.left - a.right));
      const dy = Math.max(0, Math.max(a.top - b.bottom, b.top - a.bottom));
      if (dx === 0 && dy === 0) continue;
      const gap = Math.hypot(dx, dy);
      if (gap > 0 && gap < 8) {
        out.push({ kind: 'crowded-tap', px: Math.round(gap), at: path(tappable[i]), note: `near ${path(tappable[j])}` });
      }
    }
  }

  // Overlapping text is the classic phone break: two blocks that both render
  // words occupying the same pixels.
  const leaves = all.filter((el) => !el.children.length && text(el).length > 2);
  for (let i = 0; i < leaves.length; i++) {
    for (let j = i + 1; j < leaves.length; j++) {
      const a = leaves[i].getBoundingClientRect(), b = leaves[j].getBoundingClientRect();
      if (leaves[i].contains(leaves[j]) || leaves[j].contains(leaves[i])) continue;
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 6 && oy > 6) {
        out.push({ kind: 'text-collision', px: `${Math.round(ox)}x${Math.round(oy)}`, at: path(leaves[i]), note: `over ${path(leaves[j])}` });
      }
    }
  }
  return out;
};

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
let total = 0;

for (const slug of slugs) {
  const url = `${base.replace(/\/$/, '')}${slug === '-' ? '/' : '/' + slug}`;
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.7;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 110));
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await new Promise((r) => setTimeout(r, 500));
    const findings = await page.evaluate(audit);
    await page.close();

    // Collapse duplicates: the same defect on the same element is one defect.
    const seen = new Map();
    findings.forEach((f) => { const k = `${f.kind}|${f.at}|${f.note}`; if (!seen.has(k)) seen.set(k, f); });
    const list = [...seen.values()];
    total += list.length;

    console.log(`\n${slug === '-' ? '/' : '/' + slug}  @${width}px  ${list.length ? list.length + ' finding(s)' : 'clean'}`);
    const byKind = {};
    list.forEach((f) => (byKind[f.kind] = byKind[f.kind] || []).push(f));
    Object.entries(byKind).forEach(([kind, items]) => {
      console.log(`  ${kind}  x${items.length}`);
      items.slice(0, 6).forEach((f) => console.log(`     ${String(f.px).padEnd(9)} ${f.at}   ${f.note}`));
      if (items.length > 6) console.log(`     ... and ${items.length - 6} more`);
    });
  }
}

await browser.close();
console.log(total ? `\nTOTAL ${total} finding(s).` : '\nNo mobile findings.');
process.exit(total ? 2 : 0);
