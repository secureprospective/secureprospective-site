# Concept verification tools

Three small Puppeteer scripts written during the 2026-09-02 concept build. They exist
because the Impeccable detector, while good, does not catch everything, and two real
defects in these concepts were found by measuring the page directly rather than by
running a rule.

| Script | What it answers |
|---|---|
| `shot.mjs <url> <out.jpg> <w> <h> <viewport\|full>` | What does the page actually look like, once entry animations have settled? |
| `locate.mjs <url> <w> <h>` | Which exact elements are uppercase body runs, and which paragraphs sit against the viewport edge? Prints a CSS-ish path for each, which the detector does not give you. |
| `fit.mjs <url>` | Does the display wordmark fit its container at 1920, 1440, 1280, 1024, 768 and 390? Reports word width against container width and any page overflow. |

`fit.mjs` is the one that caught the clipped "PROSPECTIVE" in Concept B. The detector
reported the page clean at the time.

They depend on Puppeteer, which is installed next to the Impeccable skill at
`.claude/skills/impeccable/node_modules`, and each script resolves it from there by
absolute path.

## motion.mjs — the animation acceptance gate

Added 2026-09-02 when the animation work began. `node concepts/tools/motion.mjs <url>`
checks the four things that decide whether motion is an asset or a liability, and exits 2
if any fail:

| Gate | Why it exists |
|---|---|
| reduced-motion completeness | Content that only an animation reveals is a defect, not a degradation. |
| no-JavaScript completeness | Same question with script off. This one caught a real bug on both concepts on its first run. |
| scroll cost at 4x CPU throttle | Real frame timings through a full scripted pass, so an effect cannot hide what it costs on a slow machine. p95 must stay within two frames. |
| no horizontal overflow, six widths | Motion that writes transforms is the usual cause of a sideways-scrolling page. |
| zero em dashes | Christopher's standing brand copy rule. |

It is deliberately able to fail, and it did: on 2026-09-02 both concepts failed
`no-JavaScript completeness` because their reveal styles set `opacity: 0` behind
`prefers-reduced-motion: no-preference`, a state only script can undo. A gate that has
never produced a negative result is a false positive, not evidence.

## divergence.mjs — are the pages actually different from each other?

Added 2026-09-02 when Concept A was rolled across the five inner pages with the
requirement "No 2 pages are the same, that is because a different page has a different
message." Five agents designing in parallel against one shared system is exactly the
setup that yields five variations of one page, and reviewing pages one at a time cannot
see it.

`node concepts/tools/divergence.mjs <base-url> <slug> [slug...]` takes a signature of
each page — the classes its own stylesheet introduces, the section rhythm, the rendered
type scale, the palette weighted by area, and the data- attributes driving motion — then
reports pairwise overlap. Composite above 0.80 is flagged and exits 2.

**Baseline, measured against live secureprospective.com on 2026-09-02:** composites 0.52
to 0.83, with `the-method` / `the-operator` flagged at 0.83. That is the undifferentiated
state the concept work has to beat, so it doubles as the control proving the gate fails.

One trap worth recording: the first version scored two pages with no motion hooks as
0.00 similar on that axis, because an empty-set Jaccard returned 0. That rewarded pages
for having no motion and made the gate incapable of firing. Empty and empty are
identical, not different.

## density.mjs — composition gate

    node concepts/tools/density.mjs <base-url> <slug|-> [slug...]

Finds defects that live in the arrangement rather than in any single element,
which is the blind spot `mobile.mjs` cannot cover: a section whose content
collapsed out of it leaves a tall band of nothing, and a card that lost its
contents keeps its border. Both pass an element-level audit and both look, to a
visitor, like the page failed to load.

It measures *ink* — text an element holds itself, plus images. Filled and
bordered surfaces are deliberately not ink: a coloured band is emptiness with a
colour on it, and counting surfaces also made every card contain itself, which
made the hollow check incapable of firing.

Hollowness is the total absence of content, not a low density of it. A ratio
threshold was tried and rejected because it flagged every rail and marker column
on the site; those are narrow grid gutters holding one short label, and by area
they are indistinguishable from a card that lost its contents.

Proven against a fixture carrying a planted 900px void and a planted empty
bordered box; both checks fire, and the gate passes the real site.

## contrast.mjs — legibility gate

    node concepts/tools/contrast.mjs <base-url> <slug|-> [slug...]

`mobile.mjs` catches text that is too small. Text can be a comfortable size and
still be unreadable, because legibility is a relationship between the ink and
the surface behind it rather than a property of either one.

Contrast is measured against the first ancestor that actually paints an opaque
background, after compositing the text's own alpha, which is what the eye sees.
An element over a background-image is skipped rather than guessed at: a
photograph has no single colour and inventing one produces a number that is
confidently wrong.

Thresholds are WCAG AA, 4.5:1 for body and 3:1 for large text. Brand yellow set
as text on a light surface is reported under its own kind, because that is a
standing brand rule rather than a numeric near-miss. It is matched by colour
shape, not by one hex value that a token rename would silently defeat.

Proven against a fixture carrying pale text, yellow on white, and quarter-alpha
ink; all three fire, yellow on ledger ink stays silent, and large grey text is
judged at 3:1 rather than blanket-failed.

## afternav.mjs — after-navigation gate

    node concepts/tools/afternav.mjs <base-url> <slug|-> [slug...]

Every other gate loads a page fresh and measures it. The site navigates with
View Transitions, which swap the document without a reload, so a fresh load is
the one state in which a rebinding defect cannot appear. That is how a dead
mobile menu passed nine consecutive navigation checks: it worked perfectly on
arrival and died the moment anyone used it.

Each page is measured twice, once loaded directly and once arrived at by
clicking a link, and the two are compared. A page that differs depending on how
the visitor reached it is broken for the visitor who navigated.

- **controls after nav** — every control that responds to a click on a fresh
  load still responds on arrival. This sits directly on the reported defect.
- **state after nav** — scroll-driven state a fresh load reaches is also
  reached on arrival.
- **content after nav** — text visible on load is visible on arrival.
- **no listener stacking** — navigating away and back repeatedly does not leave
  a growing pile of scroll and resize handlers.

Each check was proven against a deliberately broken build before being trusted:
the pre-fix Nav.astro (controls fired on all six pages), motion.js with its
page-load hook removed (state fired), and motion.js with one teardown line
removed (stacking fired, at exactly 1.0 leaked per navigation).

`content after nav` has never fired here, and cannot on this site: no content is
gated behind script at all, which motion.mjs's no-JavaScript check independently
confirms. It is retained for the case where that stops being true.
