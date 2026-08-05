---
target: SecureProspective homepage (src/pages/index.astro), post-harden+clarify re-critique
total_score: 26
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-05T17-25-29Z
slug: src-pages-index-astro
---
Method: ⚠️ DEGRADED: single-context (both dispatched sub-agents' Bash tool calls repeatedly failed to return results — infra fault, not agent confusion; verified via raw transcript inspection)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Nav signals state via aria-expanded; hover states give feedback |
| 2 | Match System / Real World | 3 | Plain language; "AI-native" framing explained immediately by sub-headline |
| 3 | User Control and Freedom | 3 | Nav has Escape-to-close + focus return; no traps |
| 4 | Consistency and Standards | 3 | New .btn--outline works but undocumented in DESIGN.md/design.json |
| 5 | Error Prevention | 3 | No destructive actions/forms on this page |
| 6 | Recognition Rather Than Recall | 4 | Every CTA names its destination; burger has aria-label |
| 7 | Flexibility and Efficiency | n/a | Persuade/landing surface |
| 8 | Aesthetic and Minimalist Design | 4 | Clean, every section earns its space |
| 9 | Error Recovery | 3 | Nothing on page can currently error |
| 10 | Help and Documentation | n/a | Landing page, not applicable |
| **Total** | | **26/32** | **Good (81%)** |

## Design Specificity Verdict

LLM assessment: Strong — transit-map method visualization and DATA_RECORD stamp styling are bespoke, not category-interchangeable.

Deterministic scan: 2 advisory findings, both pre-existing: .node-marker 13px (line 183) and .teaser-meta 11px (line 226), both below DESIGN.md's smallest documented type step (14px). Likely deliberate but uncodified.

Visual overlays: Not available — no browser tool reachable in this context or the sub-agents; source-verified only.

## Overall Impression

Both prior P0s (nav accessibility, CTA hierarchy) are genuinely fixed and verified. Remaining gaps are smaller: documentation debt on the new outline-button pattern, and the system's signature Card-Lift shadow is absent from the page's most card-shaped content section.

## What's Working

1. CTA hierarchy fix holds up structurally — zero cognitive-load checklist failures.
2. Design specificity is real — transit-map and DATA_RECORD stamps are load-bearing brand language.
3. Honest evidence framing — one real case study shown plainly, not padded, per PRODUCT.md's anti-fabrication principle.

## Priority Issues

[P1] New .btn--outline treatment is undocumented, page-scoped debt. Fix: promote into Layout.astro/DESIGN.md/design.json as a named rule. Suggested command: /impeccable document

[P1] Card-Lift — the system's signature shadow — appears on zero homepage sections, including the proof teasers which are literally card-shaped. Fix: apply the lift shadow to .teaser. Suggested command: /impeccable shape

[P2] No above-the-fold signal for the IMO-agent audience; hero speaks only to consulting audience. Fix: light-touch dual-audience cue near hero, kept minimal. Suggested command: /impeccable layout

[P2] Micro-text (.node-marker 13px, .teaser-meta 11px) sits below the documented type ramp, likely intentional but uncodified. Fix: bump to --text-caption or document a micro-text step. Suggested command: /impeccable typeset

## Persona Red Flags

Jordan (First-Timer): must scroll past hero + method map before finding "The IMO" card that speaks to them.

Riley (Stress Tester): proof-teaser copy length is uneven with no line-clamp; fine at 2 cards, risk if a 3rd case study is added.

Casey (Mobile): no red flags found — breakpoints, thumb-reachable CTAs, and connector-line flip all check out from source.

## Minor Observations

- Footer duplicates nav links — expected.
- .teaser:hover border-color is desktop-only polish, inert on touch.

## Questions to Consider

- If Card-Lift is the system's signature move, why does it appear on zero homepage sections?
- Is the transit-map/DATA_RECORD theming meant to be consciously noticed, or an invisible internal language?
- Does the final CTA need one line of reassurance about what happens after clicking?
