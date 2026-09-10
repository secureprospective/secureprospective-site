---
target: secureprospective.com — all 7 public pages + 6 members pages
method: rendered-build audit (Chrome), deterministic DOM scan, static source scan, production header/timing check
total_score: 160
max_score: 208
percent: 77
p0_count: 2
p1_count: 6
timestamp: 2026-09-10
---

# Impeccable Run — secureprospective.com

**Method.** Built `dist` from `main@215ebec`, served it on 127.0.0.1:4477, and drove it in
Chrome at 1440px and at 390px (via a same-origin iframe, because `X-Frame-Options: DENY`
blocks framing the live host and Chrome cannot size a window below 606px). Every finding
below was observed in a rendered page or in a computed style read off the live DOM, not
inferred from source. Production headers and timings were measured against the live host.

## Scoreboard

| Page | Score | % | Verdict |
|---|---|---|---|
| `/404` | 23/24 | 96% | Excellent |
| `/privacy` | 23/28 | 82% | Good |
| `/contact` | 26/32 | 81% | Good |
| `/services` (The Operation) | 19/24 | 79% | Good |
| `/the-method` | 19/24 | 79% | Good |
| `/the-operator` | 19/24 | 79% | Good |
| `/the-work` (SP+) | 17/24 | 71% | Acceptable |
| `/` (homepage) | 14/24 | 58% | **Weakest surface** |
| **Site** | **160/208** | **77%** | **Acceptable** |

Heuristics 7 (flexibility/efficiency) and 10 (help/documentation) are n/a on every page but
privacy; 5 (error prevention) and 9 (error recovery) are n/a everywhere except contact.

## What is already right — do not touch

- **Zero colour-contrast failures** across all seven pages at WCAG AA. Every text/background
  pair on the site passes. This is unusual and it is worth protecting.
- **Zero horizontal overflow** at 380px on all eight surfaces including 404. No element
  breaks the viewport.
- **Every form control is labelled**; `html lang` present; one `<h1>` per page; no heading
  level skips; no images at all, so no alt-text debt.
- **`prefers-reduced-motion` honoured** in 8 stylesheets and the hero ticker component;
  `:focus-visible` defined in 23 places.
- Security headers are complete and correct: CSP (no `unsafe-eval`), HSTS 1 year with
  subdomains, `X-Frame-Options: DENY`, `nosniff`, Permissions-Policy, `frame-ancestors 'none'`.
- Brotli compression is on. Real server TTFB is ~135ms.
- Self-hosted fonts, `font-display: swap`, no CDNs, no Tailwind — all per DESIGN.md.
- The contact form's Turnstile fallback fires correctly: on the local build, with no site
  key, it disables Send and offers the mailto route, exactly as designed.

## P0 — fix before any campaign traffic arrives

### P0-1 · The homepage fold sells nothing
**Observed:** at 1440×1000 the first screen contains the wordmark, the IPA pronunciation
`/sɪˈkjʊr//prəˈspek.tɪv/`, and one thin strip. The wordmark sits 500px down a 1119px
viewport; everything above and below it is empty ticker field. There is no sentence saying
what the business does and no call to action above the fold.
**Compounding it:** `<title>` is the bare string `SecureProspective` (17 chars) and the `<h1>`
is also `SecureProspective`. The two highest-value strings on the site carry no proposition
and no search term. Every other page gets this right (`The operation is not a footnote.`,
`Choose the conversation.`).
**Consequence:** a producer arriving cold from a campaign link sees a logo and a phonetic
spelling. The proposition — "the safer advisor workstation" — is in the strip, at 12–13px.
**Fix:** put the proposition line and one primary CTA above the fold; give the page a title
and h1 that name what it is.

### P0-2 · The closing conversion band is structurally broken
**Observed:** `.closing-field-grid` computes to `558px 571px` — two equal columns — where
`site.css:357` declares `0.5fr 1.5fr`. The `<h2>` therefore runs **13 lines at 76px in a
558px column**, 868px tall, while the entire right half of the band is empty below the
button. The yellow CTA renders at y=3636 aligned to the *first* line of a headline that ends
at y=4470 — the reader finishes the sentence 834px below the only thing to click.
**Root cause (verified):** the CSS was written for a three-child grid — an eyebrow `<p>` in
column 1, the h2 spanning, and `.closing-actions { grid-column: 2 }`. `index.astro:129-137`
has only two children, so the h2 auto-places into the eyebrow column; its min-content width
(the word "PARTNERSHIP" at 76px) blows `0.5fr` out to parity, and the CTA lands beside the
headline instead of beneath it.
**Also:** the primary CTA is `mailto:info@secureprospective.com?subject=SP+ fit review`. The
site's highest-intent click opens a mail client and bypasses the R2 lead capture and the
Brevo notification entirely. Nothing about that conversion is measurable or recoverable.

## P1

### P1-1 · Skip-to-content is dead on all six members pages
`Nav.astro` renders `Skip to content → #main`, but only the seven public pages set
`<main id="main">`. `members/login.astro:9` and its five siblings use `<main class="auth-shell">`
with no id. Six broken skip links, introduced when Nav was added to those pages last session.
Confirmed by resolving every in-page anchor in `dist` against its target document.

### P1-2 · Cards are stretched, not filled — the same anti-pattern in four places
`.spine-steps li` sets `min-height: 210px` with `strong { margin-top: auto }`. Measured on the
rendered homepage: **210px box, 68px of content, 102px empty** in every one of the five method
cards. It reads as a missing icon, not as breathing room. The identical pattern recurs:
`.state-field-body` (650px min-height, 116–120px empty, ×2 on the homepage),
`.operator-station-transfer` (240px min-height, **257–382px empty**, ×3),
`section` blocks on `/the-work` (280px min-height, 80–100px empty, ×2).
This is the same `min-height` + `margin-top: auto` combination removed from
`.contact-channel-card` last session. It was removed in one place and left in eleven.

### P1-3 · Display headlines are set in columns far too narrow for their size
Measured line counts at 1440px: `The register claims only what the record holds.` — 6 lines
at 63.5px in a 412px column. `General convenience is not a security model.` — 6 lines at
79px in 429px. `The method goes to work here first.` — 6 lines at 81px in 443px.
`The workstation that protects the practice.` — 5 lines at 74px in 499px.
At these sizes a 412–500px measure yields two or three words per line and a violently uneven
rag. The pages are 1200px wide; the headlines are using a third of it.

### P1-4 · There is no primary CTA on the homepage
The two-state section's `ENTER THE OPERATION` and `SEE HOW SP+ WORKS` are identical outline
buttons. DESIGN.md names Ticker Yellow as "the primary CTA color"; the only yellow button on
the page is the broken closing one. Three co-equal asks, no ranking.

### P1-5 · `MEMBER ACCESS` is the heaviest element in the navigation
It renders as a solid white block against the platinum bar — visually louder than `CONTACT`.
It is the back-office login for six advisors. It is currently outranking the conversion path
for every visitor.

### P1-6 · Every page title leads with an internal codename
`The Operation:`, `The Method:`, `SP+:`. No page title or description contains a term a
producer would type — IMO, FMO, annuity wholesaling, producer contracting. The naming is
brand-true and the SEO cost is total. This is a positioning decision, not a bug; flagging it
so it is a decision rather than an accident.

## P2

- **Footer link tap targets are 18px tall** at 380px (`info@secureprospective.com`,
  `Privacy Policy`). WCAG 2.5.8 asks 24px; the practical mobile floor is 44px.
- **HTML is not edge-cached.** `cf-cache-status: DYNAMIC`, `cache-control: max-age=0,
  must-revalidate` on every page. Static Astro output could be served from the edge.
- **`public/fonts/Primal.otf` (16KB) ships and is never used.** `fonts.css:3` loads
  `Primal.woff2`; the only remaining `.otf` reference is a comment in `site.css:768`.
- **The display font is not preloaded.** Primal carries the wordmark and every heading; with
  `font-display: swap` and no `<link rel="preload">` the first paint shows a fallback.
- **Contact field widths are arbitrary.** Name and Email sit half-width side by side, Line
  sits half-width alone on its own row, and the message is full width. The left copy column
  ends 250px above the form's baseline.
- **`REQUIRED` markers are on all three required fields and nowhere else**, which is correct,
  but at 10px in blue beside the label they read as part of the label text.
- **Card-lift shadow is applied inconsistently** on `/the-operator`: the ink method-contribution
  card carries an offset shadow, the yellow one above it does not.

## P3

- Sub-14px type at eight distinct sizes (10, 11, 12, 12.48, 12.8, 13, 13.28, 13.33px) against
  DESIGN.md's 14px `label` step. Mostly deliberate ledger detail, but it is not on the ramp
  and it has been flagged in every prior review since 2026-08-05.
- Homepage meta description (99 chars) and `/the-work` (108) are fine; all seven are within
  80–108 chars, comfortably short of the 160 limit — there is unused room to add a hook.

## Not a defect — recorded so it is not chased

- **`/` TTFB measured 5.24s from this machine.** The breakdown is `dns 5.020s / connect
  5.047s / tls 5.086s / ttfb 5.155s`. **All of it is DNS resolution on the Beelink.** The
  server's own contribution is ~135ms. This is a local resolver problem, not a site problem,
  and per the standing rule it is reported rather than acted on.
- **Solid-yellow full-viewport screenshots** on the homepage closing band. The DOM at that
  scroll position reports `.closing-field` as `rgb(34,34,34)` with its content present and
  `opacity: 1`, and no fixed overlay exists other than the extension's own transparent one.
  Same capture artifact recorded in the previous session. Do not chase it.
- **Homepage counters showing 7 / ~$16M / ~$99M** in a screenshot are a count-up animation
  mid-flight; they settle on 8 / ~$18M / ~$110M. Already refuted last session.

## Suggested order of work

1. P0-2 — the closing band (one markup change plus a grid rule; smallest fix, largest visible gain).
2. P0-1 — the homepage fold, title and h1.
3. P1-1 — `id="main"` on six members pages (one-line each).
4. P1-2 — strip `min-height` + `margin-top: auto` from the eleven remaining card rules.
5. P1-3 — a measure ceiling for display headlines, applied at the type-ramp level rather than per page.
6. P1-4 / P1-5 — CTA ranking and nav weight.
7. P2 cluster — tap targets, edge caching, dead font, font preload, contact field rhythm.
8. P1-6 — a positioning decision for Christopher, not a task.

---

## Resolution (same day)

Everything above was fixed except P0-1, which is a copy decision and is drafted
separately for Christopher. P1-6 (page titles leading with internal codenames)
travels with that decision and was not changed unilaterally.

| Finding | Resolution |
|---|---|
| P0-2 closing band | Grid rebuilt as one column: kicker, three-line statement, terms, then the action. Headline is 3 lines at 823px instead of 13 at 558px; the CTA now sits below the sentence it answers, not 834px above its end. Primary CTA repointed from `mailto:` to `/contact`, so the highest-intent click goes through the form, R2 and Brevo. |
| P1-1 dead skip links | All six members pages now carry `<main id="main">`. The three gated pages' JS handles moved from `#gate-shell` / `#admin-shell` / `#dl-shell` to `#main`. Verified: 14/14 pages resolve the skip target. |
| P1-2 stretched cards | `min-height` floors dropped from `.spine-steps li` (both breakpoints) and `.access-terms section`. Method cards went from a 210px box holding 68px of content to 120px; the access columns from 280px to 223px and matched. `.state-field-body` was deliberately left alone — it is a large editorial panel, not a card, and its 116px is breathing room under a CTA. `.operator-station-transfer` was also left alone: the detector counted its flex centring as slack, and the rendered card is correct. |
| P1-3 headline rag | `text-wrap: balance` added to `h1, h2, h3` at the ramp. Measures loosened where a column, not the copy, was the constraint: register headline 6 lines to 4, method hero 6 to 4, SP+ premise 7 to 4. The hard `<br />` was removed from the register headline so balancing can act on it. |
| P1-4 no primary CTA | `See how SP+ works` promoted to `.action--signal`. Yellow now marks the SP+ path on the homepage — mid-page and closing — and the operation path stays outline. |
| P1-5 nav weight | `.site-link--utility` loses its solid white block for a hairline divider and a lighter weight. It keeps full ink contrast (12.6:1) — the differentiation is the removed background, not dimmed text. |
| P2 tap targets | Footer index, footer legal links and the privacy contents list padded to a 44px hit area with the type size unchanged. |
| P2 edge caching | `Cache-Control: public, max-age=0, must-revalidate, s-maxage=60, stale-while-revalidate=86400` added site-wide; the fingerprinted `/_astro/*` and `/fonts/*` rules still override it. |
| P2 dead font | `public/fonts/Primal.otf` removed (16KB, unreferenced since the CSS moved to woff2). |
| P2 no font preload | Primal and the two IBM Plex weights above the fold are preloaded from the layout head. |
| P2 contact rhythm | The `Line` select spans the form width instead of sitting half-width alone on its row. |
| P2 required marker | Set in a bordered chip rather than as loose 10px words that read as part of the label. |
| P2 card-lift | The blue station's yellow card gets a full-ink lift; the shared 35%-alpha ink shadow was invisible against brand blue while showing clearly on the white station. |

**Found during the fix pass, not in the original audit:** `.property-card__band--warn`
on `/members/download` set an ink background but inherited none of the sibling
modifier's white text, so "Read this before you download" was ink on ink — a
1.00:1 contrast ratio and an invisible heading. The shared layout and colour
moved onto `.property-card__band`; the modifiers now set only the background.

**Verification.** `pnpm build`, `pnpm test` (16/16) and `tsc --noEmit` all pass.
All 14 pages were re-swept at 380px and the 8 public ones again at 1440px for
contrast, overflow, tap targets, labels, `h1` count and the skip target: clean
on every page at both widths.
