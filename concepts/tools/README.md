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
