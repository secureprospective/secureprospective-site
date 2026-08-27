---
target: the dev site
total_score: 22
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-27T04-07-18Z
slug: impeccable-setup-secureprospective-site-pages-dev
---
> **Correction, 2026-08-27:** The original P0 typography finding was caused by Playwright's bundled headless Chromium, which logged an internal `remote_font_face_source.cc` failure and could not find system fonts. Firefox and the operator's browser render the self-hosted fonts correctly. Corrected baseline: **22/32**, with no P0. The original report remains below as an audit record.

⚠️ DEGRADED: single-context (no sub-agent/Task tool exposed)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 1 | Chromium collapses text boxes to zero height, so state labels and active navigation disappear. |
| 2 | Match System / Real World | 3 | Insurance and workstation language fits the audience, but “five production contracts” is not explained. |
| 3 | User Control and Freedom | 2 | Navigation and chat escape are clear when rendered, but the primary conversion exits to email and one proof link has no destination. |
| 4 | Consistency and Standards | 3 | The Property Card system is coherent. “SP+” in the header versus “SP+ Build” in the footer and hover behavior create small inconsistencies. |
| 5 | Error Prevention | 1 | There is no resilient font fallback in Chromium, and the missing `#imo-record` target shipped unnoticed. |
| 6 | Recognition Rather Than Recall | 1 | Critical labels become invisible in Chromium. The access model also requires prior knowledge of contract terminology. |
| 7 | Flexibility and Efficiency | n/a | Persuasive marketing surface. |
| 8 | Aesthetic and Minimalist Design | 3 | The intended rendering is distinctive and disciplined, though metadata density and hero whitespace remain high. |
| 9 | Error Recovery | 1 | No recovery path exists when fonts fail or a `mailto:` handoff does not open correctly. |
| 10 | Help and Documentation | n/a | Persuasive marketing surface. |
| **Total** |  | **15/32** | **Poor, blocked by one P0 rendering defect** |

## Design Specificity Verdict

**LLM assessment:** The intended design is clearly authored for Secure Prospective. The ledger margins, fixed palette, proof states, ticker animation, sharp cards, and restrained Primal usage form a recognizable operating system rather than a generic consulting website. SP+ now appears in the first viewport and the typography hierarchy is substantially calmer.

The design is not category-interchangeable. The weakness is conversion specificity: the visual system communicates control better than the access copy communicates the actual commercial arrangement.

**Deterministic scan:** The source-level detector returned **0 findings** across the six public pages, navigation, and footer.

**Browser detector:** Injection succeeded on five representative local pages. It reported:

- Homepage: **20**
- Operation: **32**
- SP+: **35**
- Method: **24**
- Contact: **12**

Most browser findings are intentional or false positives within the established system: uppercase headings, record labels above headings, and tight display leading. The repeated **9–10px functional text** finding is valid. The reported 88-character line lengths are unreliable because the font failure corrupted rendered text metrics.

Overlays rendered in isolated headless browser tabs. This API session has no presentable **[Human]** browser tab, so no user-visible overlay remains open.

## Overall Impression

The intended site is visually strong and much closer to the business strategy. It is not ready to ship because the self-hosted fonts fail in the inspected Chromium build. Both `Primal` and `IBM Plex Sans` report `FontFace.status = "error"`, `document.fonts.check()` returns false, and key text elements collapse to zero-height boxes. The same files render when loaded under temporary alias names, which points to the font-face declarations or family naming rather than bad font binaries.

The largest design opportunity after that blocker is explaining why the SP+ partnership is valuable and what qualifying through five production contracts actually means.

## What’s Working

1. **The visual language belongs to the company.** The ticker, ledger rails, evidence statuses, and fixed color deck communicate controlled operations and financial responsibility.
2. **SP+ has a real position now.** It appears in the hero, receives nearly equal homepage weight, has a detailed product page, and closes with a direct access proposition.
3. **The proof posture is unusually honest.** “Proven,” “Active,” “Available,” and “Prospective” distinguish evidence from ambition. The SP+ reality check appropriately rejects false security certainty.

## Priority Issues

### [P0] Chromium cannot render the site typography

**Why it matters:** In the tested Chromium build, navigation labels, headings, body copy, and calls to action disappear. The homepage becomes colored rectangles and borders without usable content.

**Evidence:** Every declared `Primal` and `IBM Plex Sans` face reports an error. The homepage H1 has a computed height of `0px`. Loading the same files under temporary family aliases restores the page.

**Fix:** Rename the webfont families to unique site-specific names, update the tokens, remove the nonexistent Primal OTF fallback, and verify normal CSS loading in current Chrome, Firefox, and Safari without runtime font injection.

**Suggested command:** `/impeccable harden`

### [P1] The IMO proof link points to a nonexistent record

**Why it matters:** “The IMO operating record” links to `/the-work#imo-record`, but `/the-work` has no `imo-record` section. The strongest proof claim sends users to the SP+ hero instead of evidence.

**Fix:** Either restore an actual IMO evidence section with `id="imo-record"` or route the line to the relevant operation evidence on `/services`.

**Suggested command:** `/impeccable harden`

### [P1] The SP+ access model is persuasive but underexplained

**Why it matters:** “Costs nothing but the opportunity to work with us” sounds attractive, but visitors still do not know what a production contract is, what must be transferred or written, who qualifies, what hardware is required, what support is included, or what happens after qualification. The immediate `mailto:` CTA asks for commitment before resolving those questions.

**Fix:** Add a compact “How access works” sequence: qualify, establish five contracts, receive the managed image and Pi setup, understand support boundaries. Keep the zero-fee headline, but define the obligation directly beside it.

**Suggested command:** `/impeccable clarify`

### [P2] Functional labels are below a dependable reading size

**Why it matters:** Navigation is 10px and many statuses, card labels, workflow labels, and record markers are 9–10px. These are functional, not decorative. The density fits the ledger concept but raises scanning and low-vision costs.

**Fix:** Raise functional labels to an 11–12px floor, reduce tracking slightly, and preserve 9px only for nonessential micro-metadata.

**Suggested command:** `/impeccable typeset`

### [P2] Interaction signals imply actions where none exist

**Why it matters:** Informational cards change color and gain stronger shadows on hover even when they cannot be clicked. This satisfies visual uniformity but trains visitors to test dead surfaces. The fixed chat launcher also competes with lower-right content and CTAs on mobile.

**Fix:** Reserve lift and strong color transitions for links and controls. Give informational cards a quieter tonal hover or no hover. Collapse the mobile chat launcher to a smaller labeled control that does not cover conversion content.

**Suggested command:** `/impeccable polish`

## Cognitive Load

**Moderate: 3 checklist failures.**

- **Chunking fails:** the method presents five equal cards, and desktop navigation presents six simultaneous destinations.
- **Minimal choices fails:** the visitor can choose operation, SP+, method, operator, contact, member access, or chat before establishing intent.
- **Working memory fails:** understanding the SP+ qualification CTA requires remembering unexplained contract language while moving between pages.

Grouping, section hierarchy, and progressive disclosure are otherwise strong.

## Emotional Journey

- **Peak:** The animated identity hero feels controlled and memorable. SP+ entering the first viewport creates forward momentum.
- **Valley:** The homepage moves from SP+ into method and proof architecture before fully answering how access works. The product’s emotional promise loses energy inside process explanation.
- **Reassurance:** The security reality check and operator evidence rebuild trust effectively.
- **Ending:** The no-fee closing line is strong, but without qualification details it can trigger skepticism instead of confidence.

## Persona Red Flags

**Jordan, first-time advisor:** “IMO,” “immutable Fedora,” “Pi harness,” and “five production contracts” appear before plain-language definitions. Jordan reaches “Qualify for SP+” without knowing what qualification requires and is pushed into an email client.

**Riley, deliberate stress tester:** Riley finds the dead `#imo-record` link immediately, then notices that security, support, hardware, privacy, update ownership, and eligibility boundaries are not documented. “No software fee” is clear; the complete exchange is not.

**Casey, distracted mobile visitor:** The mobile composition is visually strong, but the page remains long and the floating chat launcher occupies the same lower-right attention zone as section actions. Sending an email through an external client adds an interruption at the highest-value conversion point.

## Minor Observations

- Header navigation says **SP+** while the footer still says **SP+ Build**.
- The homepage hero devotes most of the desktop viewport to identity while the SP+ proposition is comparatively small.
- Five method cards exceed the four-item working-memory guideline, though the sequence itself justifies the count.
- The ticker animation correctly respects reduced-motion preferences.
- All six public pages remain free of horizontal overflow at 1440px and 390px.
