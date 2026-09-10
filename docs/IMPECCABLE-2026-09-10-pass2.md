---
targets: secureprospective.com homepage (re-score), and the top nav bar as its own component
method: rendered-build audit (Chrome) against dist, computed styles read off the live DOM
homepage: 20/24 (83%), was 14/24 (58%)
navbar: 19/24 (79%)
timestamp: 2026-09-10
---

# Impeccable, second pass

Two runs: the homepage re-scored against the same rubric as
`IMPECCABLE-2026-09-10.md`, and a separate pass on the top bar alone.

## Run A — homepage re-score

| # | Heuristic | Pass 1 | Pass 2 | Note |
|---|---|---|---|---|
| 1 | Visibility of system status | 3 | 3 | active nav state is visual only, no `aria-current` |
| 2 | Match system / real world | 2 | **4** | the fold states the argument in plain language |
| 3 | User control and freedom | 3 | 3 | unchanged |
| 4 | Consistency and standards | 2 | **3** | CTA rank is right; one editorial repeat remains |
| 6 | Recognition rather than recall | 3 | **4** | every route names its destination |
| 8 | Aesthetic and minimalist design | 1 | **3** | page halved in length, every measured void gone |
| **Total** | | **14/24 (58%)** | **20/24 (83%)** | weakest surface to second-best |

Heuristics 5, 7, 9 and 10 remain n/a: no forms, no power-user path, nothing that
can error, not a documentation surface.

**What moved it.** The page is 2,870px, down from 4,773. The fold carries the
argument rather than a wordmark and a phonetic spelling. The closing band reads
top to bottom instead of putting its button 834px above the end of its own
sentence. No stretched card is left on the page: the 102px voids in the method
cards and the 116px under the two-state panels went with the rules that caused
them.

**What was still wrong, and is now fixed:**

- **The same terms said three times.** "Five production contracts", "no software
  fee" and "subscription" each appeared three times in a 334-word page: the SP+
  card at the top, register line 03, and the closing band. The closing band's
  terms line now says what the arrangement *is* rather than repeating its price
  for the third time.
- **160px of empty ink under the closing buttons**, running straight into a
  footer of the identical ink with no edge between them, so the two read as one
  800px slab trailing off. The band's bottom padding came down and it gained a
  hairline against the footer.

**Left alone deliberately.** The closing band's right half is empty at 1440px.
That is a left-ranged statement with air around it, the same shape the campaign
boards use, and it is not the collapsed-grid defect pass 1 found.

**Not a defect, but worth a decision:** the site has no images at all. On a page
whose argument is that a real person still writes business, there is no picture
of that person anywhere. DESIGN.md rejects full-bleed photography; a portrait
inside a card is a different thing. Christopher's call, not a finding.

## Run B — the top nav bar

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2/4 | current page marked visually, never programmatically |
| 2 | Match system / real world | 4/4 | labels are the page names, no jargon |
| 3 | User control and freedom | 4/4 | Escape closes, focus returns, menu closes on navigate |
| 4 | Consistency and standards | 2/4 | focus ring invisible on its own surface; hovering the current page does nothing |
| 6 | Recognition rather than recall | 4/4 | no icons to decode, no hidden state |
| 8 | Aesthetic and minimalist design | 3/4 | 408px of nothing between the glyph and the first link |
| **Total** | | **19/24 (79%)** | |

### P1 · The focus ring was invisible, site-wide

`site.css:59` set `:focus-visible { outline: 3px solid var(--yellow-accent) }`.
Measured against the surfaces the site is actually built on:

| Ring on | Ratio | WCAG 2.4.11 needs |
|---|---|---|
| Platinum `#E5E4E2` | **1.10:1** | 3:1 |
| White `#FFFFFF` | **1.40:1** | 3:1 |
| Ink `#222222` | 11.34:1 | 3:1 |
| Blue `#0033A0` | 7.56:1 | 3:1 |

The nav sits on platinum, and turns white once the page scrolls. A keyboard user
had no visible focus anywhere except the ink and blue bands. Pass 1 missed this
because its contrast detector read text colours and never the focus indicator.

**Fixed** with a two-colour ring: a 3px ink outline outside a 3px yellow one, so
whichever surface an element sits on, one of the two always reads. Ink carries it
on light ground at 12.52:1, yellow on dark at 11.34:1.

### P1 · No `aria-current` on the current page

The active item was marked with a blue fill and a yellow rule and nothing else. A
screen reader was told which links existed but never which one the reader was
standing on, which is the single thing that marker exists to say. **Fixed.**

### P2 · 408px of dead space inside the bar

`justify-content: space-between` held a 50px glyph at one end and the whole link
run at the other, so a third of the bar was empty. **Fixed:** the links sit
against the glyph and the member slot is pushed to the far edge, which also gives
the bar a structure — identity and primary navigation together, utility apart.

### P2 · Hovering the current page did nothing

`.site-link:hover` and `.site-link.active` both set the same blue, so the one
item a visitor is most likely to point at was the only one that never answered.
**Fixed:** the current item goes ink on hover.

### P2 · The scroll spine drew through the header

`.scroll-progress` was fixed at `inset: 0` with `z-index: 120` against the nav's
`100`, so a yellow hairline ran across the top of the bar and read as a stray
rule rather than as the page's progress. **Fixed:** it sits on the nav's bottom
edge, offset by the token plus the 2px border.

### P3 · Left as it is

Member access is distinguished from the primary links by weight alone, 500
against 700 at 11px, plus its divider. It is subtle. It is also deliberately the
quietest thing in the bar, so it stays until Christopher says otherwise.

## Verification

`pnpm build`, `pnpm test` (16/16) and `tsc --noEmit` pass. Nine pages swept at
380px, 790px and 1440px for contrast, horizontal overflow, target size, form
labels, `h1` count, the skip target, wrapped nav labels and the focus-ring
colour: clean on all twenty-seven.
