# Impeccable pass 3 — homepage, full run
Date: 2026-09-10 · Target: `src/pages/index.astro` · Slug: `src-pages-index-astro`
Branch: `bee-home-sol` · Mode: **Persuade**

## Provenance
Assessment A (design review) and Assessment B (detector evidence) ran as two
isolated parallel sub-agents, as the command requires. Not degraded on that
axis. One capability was unavailable: the user-visible browser overlay, because
presenting a browser is forbidden on this host (Christopher's live desktop).
Headless puppeteer inside `detect.mjs` was the permitted substitute and ran.

Detector dependencies (htmlparser2, css-select, css-tree, domutils, puppeteer)
were missing before this run and are now installed under the skill's own
gitignored `node_modules`. Every previous pass, including Bee's, was scanning
with the regex fallback and no URL rendering: those "clean" detector results
were an undercount, not a clean bill of health.

## Score
**20 / 28 applicable — 71%, Good** (bottom edge of the band).
Heuristics 7, 9 and 10 are n/a on a Persuade surface.

| # | Heuristic | Score |
|---|---|---|
| 1 | Visibility of system status | 3 |
| 2 | Match system / real world | 3 |
| 3 | User control and freedom | 4 |
| 4 | Consistency and standards | 2 |
| 5 | Error prevention | 2 |
| 6 | Recognition rather than recall | 3 |
| 7 | Flexibility and efficiency | n/a |
| 8 | Aesthetic and minimalist | 3 |
| 9 | Error recovery | n/a |
| 10 | Help and documentation | n/a |

Not comparable to pass 2's 20/24 (83%): that run scored a different applicable
set. Treat 71% as this run's baseline, not a regression.

## Detector
| Target | Failures | Advisories | Exit |
|---|---|---|---|
| `index.astro` + `HeroTicker.astro` | 0 | 0 | 0 |
| URL @ 1440x900 | 1 | 0 | 2 |
| URL @ 1024x900 | 1 | 0 | 2 |
| URL @ 800x900 | 1 | 0 | 2 |
| URL @ 390x844 | 1 | 0 | 2 |
| **Unique defects** | **1** | **0** | |

The one defect: `kicker-above-heading`, `index.astro:132`, "Access // SP+" above
"Qualify through five production contracts."

Verified not a false clean: no `.impeccable/config.json`, no `ignore.md`, no
inline `impeccable-disable` comments; `--no-config` and `--no-inline-ignores`
returned identical results.

Fixed earlier in this same run (commit c338011): `text-overflow` (headline
rendered 93px outside its box at 768), `wide-tracking`, `design-system-font-size`.

## Detector coverage limits, stated plainly
- `home.css` was pattern-grepped, not analysed in cascade. Not evaluated, not passed.
- No width-sensitive rules fired; output was byte-identical across four viewports.
  Mobile tap targets and reflow are not covered by this evidence.
- `HeroTicker` animation and its reduced-motion handling are unevaluated.
- Rendered findings carry `line: 0`; source lines were located by hand.

## Ranked issues
1. **P1 — fold argues in the wrong order.** A recommends the truth card lead and
   SP+ follow as evidence. **Christopher has ruled the opposite twice and that
   ruling stands.** Recorded, not acted on.
2. **P1 — the fold's primary action is orphaned.** `.truth-card .home-action`
   sits at `grid-column: 2` with dead blue field to its right, aligned to
   nothing. Fix: align to the h1 column or span the card's bottom edge.
3. **P2 — reassurance is filed away from the ask.** "No software fee, no
   subscription" is in register line 03; the closing field asks for five
   production contracts without repeating it. Copy change, Christopher's call.
4. **P2 — four links, three labels, one destination.** Nav "SP+", hero
   "Explore SP+", register 02, register 03 and "See the access model" resolve to
   `/the-work` or `/the-work#access`.
5. **P2 — the page's strongest colour is spent on a non-action.** `REVENUE
   ACTIVE` is the only yellow fill above the fold and therefore the first-read
   element, but it is inert. DESIGN.md reserves yellow for action.

## Cognitive load: 3 of 8 fail
Single focus, visual hierarchy, minimal choices. Eight destinations are visible
in the opening viewport before the reader has read a sentence.

## Minor, worth a sweep
- Pronunciation renders as `/sɪˈkjʊr//prəˈspek.tɪv/`, one malformed token at 14px.
- `Alpha` and `Available` share one yellow token; three states in two colours.
- `.hero-sp-plus` geometry is authored three times (site.css, immersive.css,
  home.css); the homepage wins by import order alone.
- `immersive.css` ~205-216: orphaned comment and an empty
  `@media (prefers-reduced-motion: no-preference) {}` block.
- `.proof-line--future` fixes site.css's 0.68 opacity by override, not at source.
- Method-spine `li` carries `min-height: 176px`; site.css documents that a height
  floor here previously produced empty white and was removed for that reason.
