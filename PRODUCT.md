# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro (existing codebase) — Astro 4.11.0 + React islands, GSAP scroll motion, CSS custom properties via `tokens.css` (no Tailwind, no font CDNs). Deployed on Cloudflare Pages, auto-deploy from `main`.

## Users

Dual-audience site, two co-equal primary users:

1. **Professional insurance agents** served by the established IMO (Independent Marketing Organization) line — the current-revenue, first-internal-proof business.
2. **Business owners/operators** seeking to move from "AI-bolted-on" to "AI-native" — the consulting practice, the front-and-center flagship.

Both audiences are written for intentionally; IA and copy split between them (6-section IA: Home / The Method / The Work / Services / The Operator / Contact).

## Product Purpose

SecureProspective is Christopher Campbell's technical business consulting firm. It is explicitly **not** an insurance retailer, despite the operator's IMO background. The site's job is to establish the consulting practice as the primary offer while the IMO line runs alongside it as proven revenue and credibility.

Success on this site = a visitor books a consult/call. That is the primary conversion action; the interactive chatbot (lead-gated, third-person Q&A about the operator) is a secondary self-qualification/engagement layer, not the primary funnel.

## Positioning

The four-movement method (brand IP / differentiator): **Diagnose → Position → Shape → Transform**, with a loop-closer — *"What's native today gets re-diagnosed tomorrow. The loop doesn't end — your business just stops being the bottleneck."* This is the mechanism a competitor consultancy could not truthfully copy without actually running the same process.

Brand spine: *se-curus* + *prospicere* = "look forward without fear, because the protection is already built." Sanctuary is felt in structure, never stated in copy.

## Operating Context

- TFM (Tech Freedom Ministries) is SP's **first client**, functioning as proof-of-work for the consulting practice — not a sister project.
- Workflow: bird (off-LAN scratch-pad, Christopher demos locally) → CT105 (review, build, merge to main after visual gate) → Cloudflare Pages auto-deploy.
- Interactive-resume chatbot (CCwork build) is live on every page via a lead-gated widget — grounded RAG answering questions about the operator in third person. This is existing, working infrastructure, out of scope for the current design work (per Christopher: not touching CCwork this session).

## Capabilities and Constraints

- No Tailwind, no font CDNs — self-hosted fonts only (Primal display, IBM Plex Sans body — IBM Plex still on system fallback, not yet self-hosted).
- GSAP for scroll animation, CSS for micro-interactions — no Framer Motion.
- Node 20 pinned (Astro 4.11.0 requires it) — relevant constraint if any future tooling (e.g. Impeccable's own live-mode dependencies) requires newer Node.
- Deploy is Cloudflare Pages via git-connected auto-deploy from `main` — any merge to `main` goes live immediately.

## Brand Commitments

- **Three-career bio spine:** Technology = passion / Construction (15 yrs electrical) = objective truth / Insurance = responsibility. This is real, factual biography — not marketing invention.
- **Locked hero copy:** H2 "Make AI native. Drop the prefix." / S1 "We make businesses AI-native: diagnose the bottleneck, position the tool, shape the output for ownership."
- **Locked color tokens:** silver-base #E5E4E2 (primary surface), blue-brand #0033A0, gold-identity #D4AF37 (logo/key moments only), yellow-accent #FFD700 (solid UI only, never text on dark/blue), ink #222222, white #FFFFFF.
- **Mood anchor:** corporate badge × transit signage × financial ledger × storm shelter × vault.
- **Motion character:** fast/snappy, 120–200ms, Bloomberg-ticker feel — not slow/deliberate.
- **Anti-list (locked):** no organic curves, no pastels, no script/serif type, no shadows, no rounded pills, no full-bleed photography, no multi-hue gradients, no glassmorphism, no bouncy easings.
- **Content rule (locked 2026-08-05): ZERO em dashes, anywhere**, covering site copy, page titles, and project docs. Use a period, colon, or comma, restructuring the sentence if a straight swap reads awkwardly. Being AI-native means not shipping the AI-slop em dash habit.

## Evidence on Hand

TFM is the **only external** proof point on hand right now. No other case studies, testimonials, metrics, or press exist yet — future design/copy work must not fabricate them.

**The IMO case study, corrected framing (2026-08-05):** The ~$110M/six-year, ~$18M/yr track record is real, but it predates AI-native entirely. It's traditional-method business experience, not proof the four-movement method was already applied there. SecureProspective's AI-native rebuild of that same IMO is happening now, live, in real time. It is the method's **first** real adaptation, not a completed internal proof that predates the consulting offer. Do not write copy implying the IMO was already run AI-native, or that the consulting practice only launched after an internal proof was finished, both are false. The honest, and actually stronger, story: nothing here is theoretical, watch the first real business get diagnosed and rebuilt live.

## Product Principles

1. Consulting is the front-and-center flagship; the IMO line is supporting proof, not the headline.
2. The four-movement method is the differentiator — every surface should make the mechanism legible, not just claim expertise.
3. Sanctuary/protection is structural, felt through design discipline (the locked anti-list, the vault/ledger mood), never stated as a marketing claim.
4. Booking a consult is the goal of every page; the chatbot supports that goal, it does not replace it.
5. TFM is real proof-of-work and should be treated as evidence, not diluted by invented case studies.

## Accessibility & Inclusion

No product-specific accessibility requirement established beyond standard web a11y (contrast, semantic structure) already implied by the locked design system's anti-list (no gray-on-color text, etc.).
