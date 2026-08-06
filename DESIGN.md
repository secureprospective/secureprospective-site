---
name: SecureProspective
description: Technical business consulting site, flat-color property-card identity, engineered-refuge mood.
colors:
  silver-base: "#E5E4E2"
  blue-brand: "#0033A0"
  gold-identity: "#D4AF37"
  yellow-accent: "#FFD700"
  ink: "#222222"
  white: "#FFFFFF"
typography:
  display:
    fontFamily: "Primal, system-ui, sans-serif"
    fontSize: "72px"
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Primal, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Primal, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "IBM Plex Sans, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Sans, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  default: "0px"
  button: "2px"
spacing:
  1: "4px"
  2: "8px"
  3: "16px"
  4: "24px"
  5: "32px"
  6: "48px"
  7: "64px"
  8: "96px"
components:
  button-primary:
    backgroundColor: "{colors.yellow-accent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "16px 32px"
  button-primary-hover:
    backgroundColor: "{colors.gold-identity}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
    padding: "16px 32px"
  button-ink-hover:
    backgroundColor: "{colors.blue-brand}"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
    padding: "16px 32px"
  button-outline-hover:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
---

# Design System: SecureProspective

## Overview

**Creative North Star: "The Property Card System"**

The site reads as a set of board-game property/deed cards laid across a table: flat solid-color blocks, sharp near-zero corners, hairline dividers, uppercase geometric display type stamped like a card title bar. Each section behaves like its own card, bounded, self-contained, legible at a glance, rather than a continuous scrolling page of soft SaaS panels. The palette (silver, brand blue, vault gold, ticker yellow) plays the role of a fixed deck of card colors, not an infinite gradient space.

Underneath the card-game surface sits the locked mood anchor: corporate badge × transit signage × financial ledger × storm shelter × vault. Cool, austere, accountable, protective. Never warm, never opulent, never approachable-soft. The site should feel like a regulated refuge that happens to be laid out like a deed card collection: trustworthy because it's structured, not because it's decorated.

Confirmed visual rejections: no organic curves (the brand symbol is the only circle allowed), no pastels, no script/serif type, no rounded-pill containers, no full-bleed photography, no multi-hue gradients, no glassmorphism, no bouncy easings, no Tailwind, no font CDNs.

**Key Characteristics:**
- Flat solid color blocks per section, like distinct card faces
- Sharp corners (0px default), 2px only on buttons/badges
- Uppercase geometric display type (Primal) as the "card title bar" voice
- Fast/snappy motion: constant small ticker-like updates, not slow reveals
- A fixed, small palette used consistently rather than a broad gradient system

## Colors

A small, fixed deck of colors: each one plays a specific card-face role, not a broad decorative palette.

### Primary
- **Ticker Yellow** (#FFD700 / `--yellow-accent`): the primary CTA color. Solid UI only: buttons, hover-active states, active toggles. Never used as text on dark or blue surfaces.

### Secondary
- **Deep Compliance Blue** (#0033A0 / `--blue-brand`): brand color blocks, depth sections, identity moments. The "other team's card color," used for section backgrounds and the ink-button hover state.

### Tertiary
- **Vault Gold** (#D4AF37 / `--gold-identity`): logo and key brand moments only. Used sparingly: this is the card's foil stamp, not a general accent. Also the primary button's hover state.

### Neutral
- **Dead-Matte Platinum** (#E5E4E2 / `--silver-base`): primary surface, the base card stock.
- **Ledger Ink** (#222222 / `--ink`): primary text on light surfaces; also a solid dark button background.
- **Clean Room White** (#FFFFFF / `--white`): cleanest information surfaces (e.g. Contact page), text on dark/blue surfaces.

### Named Rules
**The Fixed Deck Rule.** No color exists outside this six-token set. A new UI need is solved by recombining these roles, never by introducing a new hue.

### Micro-UI Text Grays
- **Fineprint Gray** (#666 / `#666`): small-print or helper text in micro-UI surfaces (e.g. the chatbot widget's privacy fineprint line), read at reduced size and intentionally quieter than ledger ink.
- **Error Red** (#b00020 / `#b00020`): destructive or error-status text in micro-UI surfaces, held apart from the decorative brand deck so failures read as system states, not brand moments.
- **Typing-Indicator Gray** (#555 / `#555`): the muted italic text of a transient state (e.g. the chatbot's typing indicator), distinguishing "in progress" from committed user/bot messages.

## Typography

**Display Font:** Primal (with system-ui, sans-serif fallback)
**Body Font:** IBM Plex Sans (with system-ui, -apple-system fallback)

**Character:** Primal is a heavy, geometric, uppercase-by-default display face that reads as stamped card-title lettering. IBM Plex Sans carries the technical, engineered-not-generic body voice without competing with Primal for attention.

### Hierarchy
- **Display** (700, 72px, 1.0 line-height, -0.02em tracking): one per page, the hero headline.
- **Headline** (700, 48px, 1.1, -0.01em): page title.
- **Title** (600, 24px, 1.3, normal): section/card subheading.
- **Body** (400, 16px, 1.6, normal): body copy, sentence case, 65–75ch max line length.
- **Label** (500, 14px, 1.4, 0.05em tracking, uppercase): captions, eyebrows, metadata: the card's small print.

### Named Rules
**The Stamped Title Rule.** Primal appears only in display/title/button contexts, always uppercase, never in body copy. IBM Plex Sans never appears in display roles; sentence case is reserved for anything meant to be read at length.

## Layout

12-column grid, 24px gutter, 1200px max container width (800px for long-form, 1600px for full-bleed moments). Desktop-first responsive: desktop 1200px+, tablet 768–1199px (collapses where needed), mobile <768px (full stack). Spacing rhythm runs on an 8px base scale from 4px (hairline gaps) to 96px (hero/display padding); comfortable density, 16–24px container padding, 24–32px gutters.

## Elevation & Depth

The system is flat by default: no ambient soft shadows, no blur-based depth. Where depth is needed, it comes from a **hard-edge offset shadow**: zero blur, a flat directional offset, reading as a card physically lifted off the table rather than a glow. This was previously locked as "no drop shadows at all" in an earlier pass, but that blanket rule wasn't grounded in anything, the property-card metaphor actually wants this kind of shadow. In use on the chat launcher and, as of 2026-08-05, statically on the homepage proof-teaser cards, the system's first real content-section application of its own signature move. Extend deliberately to other lifted card-moments as the redesign progresses, not reflexively to every container.

### Shadow Vocabulary
- **Card-lift** (`box-shadow: 6px 6px 0 rgba(0, 51, 160, 0.18)`): hard offset in brand-blue at low opacity, zero blur. Use on elements that should read as a card raised off the surface beneath it: primary floating actions, not routine buttons.

### Named Rules
**The Card-Lift Rule.** Shadows are always a hard flat offset, never a soft blur. A blurred shadow reads as generic SaaS depth; an offset shadow reads as a card on a table. If it isn't a clean directional offset, it isn't on-brand.

## Shapes

Sharp corners by default (0px radius): the card-stock edge. Buttons and badges get a minimal 2px radius, just enough to soften a touch target without breaking the sharp-card language. 1px hairline borders are the only border weight used, for dividers and card-edge separation; no heavier borders. No clipping or masking beyond rectangular card boundaries.

## Components

### Buttons
- **Shape:** sharp with a minimal edge (2px radius)
- **Primary (`.btn`):** Ticker Yellow background, Ledger Ink text, 16px/32px padding, uppercase Primal label. This is the *only* button that signals the primary conversion action on a page — the actual "book a consult" ask, always the page's loop-closer/contact CTA. Earlier funnel CTAs that route interest deeper into the site (e.g. the hero's "See the method") use `.btn--ink` instead, so only one Ticker Yellow button appears per page.
- **Primary hover:** shifts to Vault Gold
- **Ink variant (`.btn--ink`):** Ledger Ink background, white text, 2px Ledger Ink border. Secondary CTA, use on light/silver-base sections only, an ink fill on an ink background is invisible.
- **Ink variant hover:** shifts to Deep Compliance Blue (background + border)
- **Outline variant (`.btn--outline`):** transparent fill, white text, 2px white border. Secondary CTA for dark or brand-colored sections (ink, blue-brand backgrounds) where an ink fill would disappear. Defined once in `Layout.astro`, reusable sitewide, do not re-scope a one-off version in a page's own `<style>` block.
- **Outline variant hover:** fills white, text flips to Ledger Ink
- **Transition:** 120ms ease-out on background/color/border-color, fast, ticker-like, never a slow fade

### Cards / Containers
- **Corner Style:** sharp (0px)
- **Background:** flat solid color from the fixed deck, one card, one color
- **Shadow Strategy:** the proof-teaser cards (`.teaser`) carry the Card-Lift shadow statically, the first real content-section use of the system's signature move (added 2026-08-05). Reserve the static treatment for genuinely card-like content containers; use the card-lift shadow on hover only for lower-emphasis interactive elements (see Elevation & Depth).
- **Border:** 1px hairline where separation is needed, otherwise none

### Navigation
- Uppercase Primal labels, 120ms ease-out color transition on hover, mobile menu collapses via a 200ms linear max-height transition, same fast/snappy rhythm as the rest of the system, no easing outliers.

## Do's and Don'ts

### Do:
- **Do** keep every new color inside the six-token Fixed Deck: recombine roles, never introduce a new hue.
- **Do** use hard offset shadows (zero blur) when depth is needed, never a soft/blurred shadow.
- **Do** keep display type uppercase and geometric (Primal); keep body type sentence-case (IBM Plex Sans).
- **Do** keep motion fast (120–200ms) and linear/ease-out: the Bloomberg-ticker feel.

### Don't:
- **Don't** use organic curves, pastels, script/serif type, rounded-pill containers, full-bleed photography, multi-hue gradients, glassmorphism, or bouncy easings.
- **Don't** use a soft/blurred drop shadow; if it isn't a hard directional offset, it breaks the card-lift rule.
- **Don't** reach for Tailwind or a font CDN; tokens.css and self-hosted fonts are the only source of truth.
