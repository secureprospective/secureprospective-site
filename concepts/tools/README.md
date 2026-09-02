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
