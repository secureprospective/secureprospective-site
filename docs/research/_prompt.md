Web research task. Do NOT edit any code or files in this repo except writing your final report.

CONTEXT: SecureProspective is an Astro-based technical business consulting site. Locked design system ("The Property Card System"): flat solid-color blocks (silver #E5E4E2, brand blue #0033A0, vault gold #D4AF37 used sparingly, ticker yellow #FFD700 for CTAs, ink #222, white), sharp near-zero corners, uppercase geometric display type (Primal font), fast/snappy 120-200ms motion (a "Bloomberg ticker" feel, not slow reveals), hard offset shadows only (no soft blur), no gradients/glassmorphism/bouncy easing/pastels/organic curves. Mood anchor: corporate badge x transit signage x financial ledger x storm shelter x vault.

WHAT WE JUST SHIPPED: a hero-section background effect behind the headline text and CTA button: a procedurally-drawn canvas honeycomb (hexagon) grid in brand blue, with a traveling sine-wave brightness pulse and occasional brighter "electrical arc" cells in ticker yellow, capped at 30% opacity, sitting strictly behind the text/buttons (pointer-events disabled), respecting prefers-reduced-motion. The owner's reaction: "premium without being too busy, classy and theme-matching."

GOAL: The owner wants the WHOLE SITE (not just this hero) to feel "revolutionary, forward-looking, with human design in mind" -- while staying restrained ("I don't want to do too much, but I want to draw the visitor in"). This is an intentionally narrow, tasteful direction, not a maximalist redesign.

YOUR JOB: Search the web for current (2026) design trends, real reference sites, and concrete techniques that fit ALL of these constraints simultaneously:
1. Feels premium, technically impressive, "revolutionary/forward-looking" -- without being loud, busy, or gimmicky.
2. Feels genuinely HUMAN and warm despite a cool/austere/corporate-vault palette -- how do real sites pull off "human" without softening into generic SaaS-friendly pastel mush (which this brand explicitly rejects)?
3. Compatible with a flat-color, sharp-corner, no-gradient, no-blur-shadow, fast-snappy-motion design language (i.e. NOT glassmorphism, NOT soft neumorphism, NOT slow cinematic fades).
4. Specific, implementable techniques: cursor/pointer interactions, scroll-driven storytelling, micro-interactions on buttons/cards/nav, typography moves, data/number reveal patterns, page-transition ideas, sound/haptic (if relevant), anything CSS/canvas/SVG can express well in a small Astro + vanilla-CSS + GSAP stack (no Tailwind, no heavy frameworks, no font CDNs).
5. Real named reference sites or case studies you can point to (agency portfolios, fintech/security products, consulting firms, dev-tool landing pages, awwwards-style picks) that hit this "premium but restrained and human" note, with a one-line note on WHAT specifically they do that works.

Also flag: what's overused/dated right now (2026) in this space that we should actively avoid, and any performance or accessibility tradeoffs worth knowing about for the techniques you surface.

OUTPUT: Write your findings to docs/research/hero-design-research.md in this repo as a structured markdown report (use headers: Trends & Techniques / Reference Sites / What to Avoid / Tradeoffs & Uncertainty). This is a research/signal-gathering pass, not a final recommendation -- flag your own uncertainty where you're not sure something fits this specific brand. A senior designer will review your findings and decide what to actually build.

When done, run: touch docs/research/hero-design-research.DONE
