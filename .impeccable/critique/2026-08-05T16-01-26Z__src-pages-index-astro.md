---
target: src/pages/index.astro (homepage)
total_score: 21
max_score: 32
na_heuristics: 7,10
p0_count: 2
p1_count: 2
timestamp: 2026-08-05T16-01-26Z
slug: src-pages-index-astro
---
## SecureProspective Homepage — Design Critique

**Method:** dual-agent (A: a569625d784f5db15 · B: a9ac4d321308bc33a). Both ran as isolated sub-agents. Browser/screenshot evidence skipped by both (no browser tool in either sub-agent's surface) — source/HTML analysis and CLI detector are both real and complete.

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3/4 | Nav active-state + chat loading feedback work; no feedback elsewhere |
| 2 | Match System / Real World | 2/4 | Insider jargon ("Drop the prefix", four-movement names) with no plain-language on-ramp |
| 3 | User Control and Freedom | 3/4 | Chat close + mobile nav re-toggle both work |
| 4 | Consistency and Standards | 2/4 | All 3 homepage CTAs share identical yellow .btn styling |
| 5 | Error Prevention | 3/4 | Chat gate validates email client-side before submit |
| 6 | Recognition Rather Than Recall | 3/4 | Footer mirrors nav exactly |
| 7 | Flexibility and Efficiency | n/a | Marketing landing page, no power-user path expected |
| 8 | Aesthetic and Minimalist Design | 2/4 | 4 competing asks (3 CTAs + persistent chat), no priority signal |
| 9 | Error Recovery | 3/4 | Chat error text specific, near the source |
| 10 | Help and Documentation | n/a | Not applicable to a landing surface |
| Total | | 21/32 | Acceptable (66%) |

### Design Specificity Verdict

Partially authored, partially generic. Palette, Primal type, and copy devices (DATA_RECORD // 001, four-movement method) are distinctive. But the identity's signature device — the card-lift hard-offset shadow, "bounded card not a continuous scroll" — appears nowhere on the homepage content sections, only on the chat widget (ChatWidget.astro:98). Hero, method-preview, operator-teaser, loop-closer are full-bleed edge-to-edge bands, not cards. Deterministic scan: 6 findings, exit 2 — 5x design-system-font-size (13/12/11px, below the 14px floor, not on the type ramp) + 1x layout-transition warning (Nav.astro:121 animates max-height instead of transform/opacity). No false positives against the protected color/corner/shadow categories. Both assessments converged independently: the system as documented is more disciplined than the system as built.

### What's Working

1. DATA_RECORD // 001/002 labels — specific ledger-motif detail.
2. Full-ink operator-teaser band ("Three careers. One spine.") — strongest, most voice-true moment.
3. Fixed 6-color deck + heavy uppercase Primal gives real memorability.

### Priority Issues

[P0] No clear single primary CTA. See the method / Meet the operator / Start with a conversation all share identical yellow .btn (Layout.astro:80-95) despite PRODUCT.md naming "book a consult" as the goal. Persistent chat launcher is visually heavier than any of them. Fix: give the true conversion CTA .btn--ink + card-lift shadow; downgrade the others. Suggested: /impeccable layout or /impeccable clarify

[P0] Mobile nav toggle is keyboard-inaccessible. Nav.astro:19-24 — label with no tabindex/role/key handler; checkbox is aria-hidden + tabindex="-1". Keyboard-only users cannot open the mobile menu under 768px. Fix: real button with aria-expanded/aria-controls, or tabindex="0" + Enter/Space handling. Suggested: /impeccable harden

[P1] Identity's signature device absent from homepage content, present only on the (out-of-scope) chat widget. Direct gap against the stated goal of pushing the Property Card identity forward. Fix: card-lift shadow + inset boundary on proof teasers; treat hero/operator/loop-closer as inset cards, not edge-to-edge bands. Suggested: /impeccable bolder or /impeccable overdrive

[P1] No above-the-fold signal for the two co-equal named audiences (agents vs consulting clients). IMO content buried 3 sections down. Fix: lightweight two-path chooser near hero or agent-specific nav entry. Suggested: /impeccable clarify

[P2] Final conversion CTA offers zero reassurance about what happens next. Fix: one factual reassurance line using only real details. Suggested: /impeccable clarify

### Persona Red Flags

Jordan (first-timer): no plain-language grounding in 5 seconds; agents get no above-the-fold signal this site is for them.
Riley (stress tester): confirmed cannot open mobile nav via keyboard at all; max-height:360px cap risks clipping at higher zoom.
Casey (distracted mobile): three equally-weighted yellow CTAs; persistent chat launcher visually heavier and always visible, so the secondary conversion path is structurally easier to hit than the primary one.

### Minor Observations

- Footer tagline "Business must adapt or suffer the inevitable." reads harder/fear-toned than the rest of the site's voice.
- IMO stat framed as a parallel "record" to TFM though PRODUCT.md states TFM is the only proof point on hand — naming stretch, not fabrication.
- Pre-JS reveal states apply translateY synchronously before GSAP's module import runs — unverified from source whether there's a flash on cold load.

### Questions to Consider

1. If the Property Card metaphor is the one thing singled out unprompted, why does the homepage never deploy an actual card?
2. Three CTA verbs (see/meet/start) point at one named goal — deliberate pacing, or diluted across writing passes?
