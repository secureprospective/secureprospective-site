---
target: homepage (src/pages/index.astro)
total_score: 25
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-06T02-07-21Z
slug: src-pages-index-astro
---
Method: dual-agent (A: source-level design review · B: detector + source-level substitute evidence — no browser automation tool connected this run)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading/typing/disabled states wired; MethodWidget gives no signal it intercepts the click |
| 2 | Match System / Real World | 3 | Ledger copy metaphor consistent; undercut by hero visual mismatch |
| 3 | User Control and Freedom | 2 | ChatWidget no Escape-to-close; MethodWidget preventDefault() breaks ctrl/cmd-click |
| 4 | Consistency and Standards | 2 | Two floating widgets diverge on focus/Escape handling; new motion durations contradict locked spec |
| 5 | Error Prevention | 3 | Client-side validation, role=alert, button disables mid-request |
| 6 | Recognition Rather Than Recall | 3 | "See the method" implies navigation but opens a panel |
| 7 | Flexibility and Efficiency | n/a | Persuade-mode landing page |
| 8 | Aesthetic and Minimalist Design | 3 | Hero canvas + line-reveal + two floating widgets stack more motion than mood implies |
| 9 | Error Recovery | 3 | Specific, actionable error copy |
| 10 | Help and Documentation | n/a | Not applicable to marketing surface |
| Total | | 25/32 | Good (78%) |

## Design Specificity Verdict
Mixed. DATA_RECORD labels, tabular-mono IMO numerals, .prefix-chip are brand-specific. Hero honeycomb canvas is a generic tech/crypto trope, not vault/ledger/signage specific. Detector: 5 findings (exit 2), all advisory/warning — 1 layout-transition (Nav max-height), 4 design-system-font-size (11-12px off ramp, 3 identical 12px uses suggest a missing ramp step not 3 mistakes).

## Priority Issues

[P1] Motion-duration violations: hero reveal ~640ms, page-transition 320/420ms vs locked 120-200ms spec. Fix: tighten or add documented exception. /impeccable animate

[P1] Hero honeycomb motif reads generic tech-SaaS not brand-specific. Fix: rework using same canvas scaffolding into a ledger/ticker-specific motif. /impeccable distill

[P2] .teaser-meta fails WCAG AA contrast: ink@60% opacity over white = ~4.27:1 at 11px, below 4.5:1 AA. Fix: use solid #666 Fineprint Gray token instead of opacity. /impeccable harden

[P2] Two competing yellow primary CTAs (hero + loop-closer) collapse DESIGN.md's own one-per-page rule, still unreconciled. Fix: demote hero CTA to .btn--ink or amend the doc. /impeccable clarify

[P2] MethodWidget a11y drifted from ChatWidget: no focus move on open/close, preventDefault() breaks ctrl/cmd-click. Fix: match ChatWidget's focus handling, gate preventDefault on modifier keys. /impeccable harden

[P3] Chat lead-gate charges email before first answer, against its own "secondary, not primary funnel" framing. Fix: allow one ungated question or test gate impact. /impeccable onboard

## Persona Red Flags
Sam (accessibility): MethodWidget focus handling + teaser-meta contrast failure.
Alex (power user): ctrl/cmd-click broken on MethodWidget trigger.
IMO-agent visitor: zero above-the-fold signal for this co-equal audience (previously logged P2, still true).

## Minor Observations
Footer tagline tone harder than brand spine's "no fear" commitment. DESIGN.md's documented Card-Lift shadow color (blue) doesn't match shipped ink-tinted shadow anywhere. Consistent 12px value across 3 components suggests a missing type-ramp step.

## Questions to Consider
Why does the largest new visual bet reach for generic tech imagery instead of the vault/ledger anchor? Is "one CTA per page" still the real rule now that two yellow primaries coexist by decision? Has the chat email-gate's lead-quality impact actually been tested?
