---
target: SecureProspective homepage (src/pages/index.astro), post-harden+clarify+Playwright-verified re-critique
total_score: 27
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-05T18-38-40Z
slug: src-pages-index-astro
---
Method: ⚠️ DEGRADED: single-context (Playwright MCP tools are available in this parent context but do not propagate to background sub-agents — confirmed twice this session, sub-agents report no browser tool present even when the parent has one. Both assessments run here directly, but unlike the prior two runs, this one carries REAL browser evidence: live screenshots, real click/keyboard interaction, console output — not source-only inference.)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | aria-expanded verified toggling true/false live; no async states on this page to test further |
| 2 | Match System / Real World | 3 | Plain language holds up under real read |
| 3 | User Control and Freedom | 4 | Escape-to-close now verified working live (a regression was caught and fixed this pass, see below); no traps found |
| 4 | Consistency and Standards | 3 | .btn--outline confirmed visually correct (legible white outline on dark bg) but still undocumented in DESIGN.md |
| 5 | Error Prevention | 3 | No forms/destructive actions on this page |
| 6 | Recognition Rather Than Recall | 4 | Every CTA names its destination; burger has aria-label, verified in accessibility tree |
| 7 | Flexibility and Efficiency | n/a | Persuade/landing surface |
| 8 | Aesthetic and Minimalist Design | 4 | Confirmed clean visually via real screenshots, no clutter |
| 9 | Error Recovery | 3 | Nothing on page can currently error |
| 10 | Help and Documentation | n/a | Landing page |
| **Total** | | **27/32** | **Good (84%)** |

## Design Specificity Verdict

LLM assessment: Confirmed via real screenshot, not just source: the transit-map method visualization and DATA_RECORD stamps render exactly as bespoke, on-brand elements. Genuinely specific, not category-interchangeable.

Deterministic scan: 2 pre-existing advisory findings, unchanged (.node-marker 13px line 185, .teaser-meta 11px line 228), both below the documented type ramp.

Visual overlays: Real screenshots captured this pass (desktop full-page, desktop viewport, proof-teasers section, operator-teaser dark section, mobile closed/open nav states) plus live interaction testing (click to open, Escape to close, aria-expanded state checks). No injected detector overlay was run in-browser this pass (time was spent on manual verification of the specific fixes instead) — that's a legitimate scope choice, not a missing capability, since the CLI detector already covers the same ground statically.

## Overall Impression

Both prior P0s remain fixed, and this pass caught something the two source-only critiques could not: the Escape-to-close handler was silently broken (attached to a sibling element, never receiving the keydown), a real regression hiding behind seemingly-correct source code. Found and fixed live, before this report was finalized. What's left is the same two P1s: Card-Lift absent from content, and the outline-button pattern undocumented.

## What's Working

1. CTA hierarchy is confirmed correct by eye, not just by class name: yellow primary, ink secondary on light, white-outline secondary on dark, all legible.
2. Mobile nav is now genuinely robust: open, close-by-click, and close-by-Escape all independently verified via real interaction, including the Escape regression this pass fixed.
3. Zero console errors or warnings on page load.

## Priority Issues

**[P1] Card-Lift, the system's signature shadow, still appears on zero homepage sections.** Confirmed visually: the proof-teaser cards are plain white boxes with a 1px hairline border, no shadow at all. Fix: apply the lift shadow to `.teaser`. Suggested command: `/impeccable shape`

**[P1] `.btn--outline` remains undocumented in DESIGN.md/design.json.** Confirmed visually correct in the browser (clean white outline, legible on dark background, inverts properly), but still a page-scoped one-off with no written rule. Suggested command: `/impeccable document`

**[P2] No above-the-fold signal for the IMO-agent audience.** Unchanged from the last critique; confirmed visually that the hero speaks only to the consulting audience. Suggested command: `/impeccable layout`

**[P2] Micro-text below the type ramp.** Unchanged (13px/11px), confirmed still present via fresh detector run. Suggested command: `/impeccable typeset`

## Persona Red Flags

**Sam (Accessibility-Dependent):** Verified via live testing this pass, not assumed: keyboard-only mobile nav flow (open via click/Enter, Escape to close, focus returns to the burger) now genuinely works end to end. This persona's primary red flag from the original critique is resolved and confirmed, not just claimed.

**Jordan (First-Timer):** Unchanged from last critique — still has to scroll past three sections before finding "The IMO" card that speaks to them if they're an agent, not a consulting prospect.

**Casey (Mobile):** Confirmed via a real 375px-viewport screenshot: burger renders correctly, menu opens to a clean full-width stacked list, touch targets look reasonably sized. No red flags found, now with actual visual confirmation instead of source-code inference.

## Minor Observations

- The floating chat launcher appears to overlap page content in a full-page stitched screenshot; confirmed this is a Playwright full-page-screenshot artifact with `position: fixed` elements, not a real rendering bug (verified correct position in a real viewport-only screenshot).
- Astro's dev-mode toolbar appears in dev-server screenshots; won't appear in production, not a real page element.

## Questions to Consider

- If Card-Lift is the system's signature move, why does it appear on zero homepage sections?
- Now that mobile nav is proven solid, is there a similar hidden-interaction risk anywhere else worth a real click-through pass (contact form, services page) rather than trusting source review alone?
