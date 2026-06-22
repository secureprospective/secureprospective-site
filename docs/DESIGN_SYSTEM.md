# SecureProspective — Design System v1

**Status:** LOCKED (with TBD items flagged)
**Source:** strategic picture + logo z.ai read + email-signature z.ai read + Christopher's color/motion decisions

---

## Color tokens — multi-hue system

| Token | Hex | Role |
|---|---|---|
| `--silver-base` | #C0C0C0 *(refine against actual silver logo PNG before build — TBD)* | Primary surface. The architect-of-protection canvas. |
| `--blue-brand` | #0033A0 | Brand color block. Secondary surfaces, depth sections, identity moments. |
| `--gold-identity` | #D4AF37 | Logo / brand identity marker. Used sparingly — the symbol, key brand moments. |
| `--yellow-accent` | #FFD700 | Call-out accent. CTAs, hover-active states, active toggles. |
| `--ink` | #222222 | Primary text on light surfaces. |
| `--white` | #FFFFFF | Neutral. Clean information surfaces, contrast moments. |
| `--ink-inverted` | #FFFFFF | Text on dark/blue surfaces. |

### Per-page dominant treatments

| Page | Background | Symbol | Primary CTA color |
|---|---|---|---|
| Home | Silver | Gold (animates through 4 movements on load) | Yellow |
| The Method | Silver + blue color blocks per station | Marginal, rotates with scroll | Yellow |
| The Work | Blue brand background for case study reveals | Rotates per case study; paused on future slot | Yellow (on IMO slot CTA) |
| Services | Silver base | Centered, split between two paths | Yellow |
| The Operator | Silver base | Forms from three tributaries at bottom | Yellow |
| Contact | White (cleanest surface) | Final rotation on form submit | Yellow submit |

### Mood anchor

Reads as: **corporate badge × transit signage × financial ledger × storm shelter × vault.** Cool, austere, accountable, protective. NOT warm, NOT opulent, NOT approachable.

**Invisible direction (felt, not stated):** *survivors sanctuary.* The page should feel like a regulated refuge — the building you trust to survive what's coming. The sanctuary is the WHY behind the structure (protection, not just compliance); it never appears in the copy. Visitor should feel *protected* when they land, not just *informed.* The hard rules, sharp corners, matte surfaces, and structural density all serve this — they read as engineered refuge, not generic SaaS.

---

## Typography

### Font stack

- **Display:** Primal (self-hosted from `grafix/Primal.otf`) — geometric sans, heavy, uppercase by default
- **Body:** IBM Plex Sans (self-hosted, open-source) — geometric sans with technical heritage. Pairs with Primal without competing; reads as engineered, not generic.
  - *Override candidate: Inter (safer/more generic) or Geist (more contemporary).*
- **Mono:** JetBrains Mono (if needed for code-adjacent moments — optional)

### Type scale

| Token | Font | Size | Weight | Case | Leading | Tracking | Use |
|---|---|---|---|---|---|---|---|
| `--text-display` | Primal | 72px | 700 | Upper | 1.0 | -0.02em | Hero headline (one per page) |
| `--text-h1` | Primal | 48px | 700 | Upper | 1.1 | -0.01em | Page title |
| `--text-h2` | Primal | 36px | 700 | Upper | 1.2 | normal | Section heading |
| `--text-h3` | Primal | 24px | 600 | Upper | 1.3 | normal | Subsection / card title |
| `--text-body-lg` | IBM Plex Sans | 20px | 400 | Sentence | 1.5 | normal | Lead paragraph / hero sub-headline |
| `--text-body` | IBM Plex Sans | 16px | 400 | Sentence | 1.6 | normal | Body copy |
| `--text-caption` | IBM Plex Sans | 14px | 500 | Upper | 1.4 | 0.05em | Labels, eyebrows, metadata |
| `--text-button` | Primal | 16px | 700 | Upper | 1.0 | 0.05em | Button copy |

### Typographic rules

- All display/title/button typography in UPPERCASE
- Body copy in sentence case (all-caps hurts readability)
- Primal only for display/title/button — never body
- IBM Plex Sans never for display — body and captions only
- Tight tracking on large sizes; slight positive tracking on captions
- No italic. No underline except on links.

---

## Spacing system

Base unit: **8px**

| Token | Value | Use |
|---|---|---|
| `--space-1` | 4px | Hairline gaps (icon-to-label) |
| `--space-2` | 8px | Tight component padding |
| `--space-3` | 16px | Default component padding |
| `--space-4` | 24px | Default gutter |
| `--space-5` | 32px | Section-internal gap |
| `--space-6` | 48px | Section-to-section gap |
| `--space-7` | 64px | Page-level padding |
| `--space-8` | 96px | Hero / display padding |

Density: comfortable. Container padding 16-24px, gutter 24-32px.

---

## Layout grid

- **Default:** 12-column grid, 24px gutter, max-width 1200px
- **Hero / feature sections:** 2-column (text + visual)
- **Breakpoints:** Desktop-first
  - Desktop: 1200px+
  - Tablet: 768-1199px (collapse where needed)
  - Mobile: <768px (full stack)
- Container max-widths: 1200px (default), 800px (long-form), 1600px (full-bleed)

---

## Component shapes

| Property | Value | Source |
|---|---|---|
| Border radius (default) | **0px** — sharp corners | Sample + TFM CLAUDE.md |
| Border radius (buttons/badges) | **2px** | TFM CLAUDE.md |
| Shadow depth | **None** — flat only | Sample read |
| Border weight | **1px hairline** for separators; otherwise none | Sample read |
| Container backgrounds | Flat solid colors from palette; no multi-hue gradients | Sample + multi-hue rule |

---

## Motion principles — FAST/SNAPPY

**Direction:** fast/snappy. Heavy animation = **many quick motion moments**, not few slow ones. Think financial ticker, transit map arrival board, Bloomberg terminal — constant micro-updates, all fast.

### Timing

| Trigger | Duration | Easing |
|---|---|---|
| Page load (symbol rotation) | 600ms | linear |
| Scroll into view (element slide-in, 8px offset) | 200ms | linear |
| Hover on interactive | 120ms | ease-out |
| Form path select | 200ms | linear |
| Form submit (final symbol rotation) | 400ms | linear |
| CTA click (transition to next view) | 0ms (hard cut) | none |
| Section transition (panel reveal) | 200-300ms | linear or ease-in-out |

### Forbidden motion

- NO easings slower than 500ms (no slow deliberate reveals)
- NO bouncy easings (no `back`, no spring physics)
- NO organic curves
- NO auto-playing long animations
- NO parallax (too slow, too decorative)

### "Heavy animation" feel targets

- Page should feel alive with small motions at all times
- Every hover, every focus, every scroll trigger does something — fast
- Symbol rotates frequently, not once
- Micro-interactions on every interactive element
- Cumulative effect: ticker-like, not cinematic

---

## Anti-list (LOCKED — never violate)

- NO organic curves (the brand symbol is the only circle allowed)
- NO pastel colors (only the locked palette)
- NO script or serif typography (geometric sans only)
- NO drop shadows (flat only)
- NO rounded pill containers (sharp corners, 2px max on buttons)
- NO full-bleed background photography (editorial layout only)
- NO multi-hue gradient backgrounds (single-hue brand blocks only)
- NO glassmorphism / blur effects
- NO bouncy or playful easings
- NO auto-playing long animations
- NO Tailwind (custom properties from tokens file only)
- NO third-party font CDNs (self-host everything)

---

## Implementation notes

- Tokens file: `src/styles/tokens.css` (single source of truth, matches TFM pattern)
- All values above become CSS custom properties on `:root`
- Motion via GSAP for scroll-triggered; CSS for hover/focus micro-interactions
- Component library: Astro + React islands (per tech stack lock)
- Tokens file is the design-system-as-code — components consume variables, never hard-coded values
