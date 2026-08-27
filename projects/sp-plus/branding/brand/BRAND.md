# SP+ brand identity, taken from secureprospective.com

Captured 2026-08-27 from the live site at Christopher's direction: *"We really need it to
feel like the secureprospective.co website. The theme needs to nail that motif and dont
afraid of using the background animation from the front page hero either."*

Everything here is **measured from the site's own CSS and JS**, not designed fresh. The
source files are kept beside this document so the values can be re-checked:
`secureprospective.com.css` and `secureprospective.com-hero.js`.

## The palette, exactly as the site declares it

From the site's `:root` block. These supersede the approximations used in the first SP+
Welcome draft, which were guessed before the site had been looked at.

| Token | Hex | Site variable |
|---|---|---|
| Brand blue | `#0033A0` | `--blue-brand` |
| Gold, identity | `#D4AF37` | `--gold-identity` |
| Yellow, accent | `#FFD700` | `--yellow-accent` |
| Silver / light grey ground | `#E5E4E2` | `--silver-base` |
| Ink | `#222222` | `--ink` |
| White | `#FFFFFF` | `--white` |
| Fine print grey | `#666666` | `--fineprint-gray` |

`#0033A0` is a far deeper, more saturated royal blue than the `#1B4F8C` first guessed, and
the site uses **two** metals: `#D4AF37` for identity and the brighter `#FFD700` for accent
and for the highlight in the hero animation. The ground is `#E5E4E2` platinum, not a
neutral grey.

## The thing that most defines the look: nothing is rounded

`--radius-default: 0px` and `--radius-button: 2px`. Every card, panel and button on the
site is square. Depth comes from a **1px ink border plus a hard offset shadow**, not from
rounded corners and blur:

```css
border: 1px solid var(--ink);
background: #FFFFFFF0;
box-shadow: 6px 6px #0033A02E;   /* offset, no blur, blue at ~18% */
```

Anything that ships with rounded corners and a soft drop shadow will read as generic and
not as Secure Prospective, no matter how correct the colours are.

## Type

| Role | Family | Notes |
|---|---|---|
| Display | **Primal**, 700 | Provided as `fonts/Primal.ttf`, converted from the site's `Primal.woff2`. 164 glyphs, full ASCII, so it is usable for real interface text and not only for the logo. |
| Body | **IBM Plex Sans**, 400/500/600/700 | Packaged in Fedora as `ibm-plex-sans-fonts`; use the distro package rather than the site's subsetted woff2 files. |

Scale, as declared: display 72, h1 48, h2 36, h3 24, body-lg 20, body 16, caption 14.
Spacing runs 4, 8, 16, 24, 32, 48, 64, 96. Container max 1200, gutter 24.

**Open licensing question, for Christopher.** IBM Plex Sans is OFL and safe to ship. The
Primal binary carries no embedded licence string, and shipping a font inside a distributed
OS image is a different grant from serving it on a website. Confirm the licence permits
redistribution before cycle35 ships it. Until then it is staged here, not installed by the
Containerfile.

## The hero animation

`<canvas id="hero-fx-canvas">` behind the headline, drawn at `opacity: .3` over the
`#E5E4E2` ground. The full original is in `secureprospective.com-hero.js`; the algorithm is:

- Rows of short horizontal **dashes** — a data-tape or ticker motif, not particles.
- Row pitch **28px**; dash **10px** long, **2px** tall, gap **8px**, so the period is 18px.
- Every row scrolls, and **alternate rows scroll in opposite directions**
  (`F = v % 2 === 0 ? 1 : -1`), which is what gives it its restless, machine-like quality.
- Brightness along each row is a sine wave, phase-offset per row by `v * 0.37`, so bands of
  light travel across the field rather than every dash pulsing together.
- A dash is drawn in **blue `0,51,160`** at alpha `0.1 + p*0.3`; when `p > 0.88` it flips to
  **gold `255,215,0`** at a much higher alpha. So the field is quiet blue with occasional
  gold sparks — the gold is rare by construction, roughly the top 12% of the wave.
- Time advances `c += 0.012` per frame. Slow.
- It respects `prefers-reduced-motion`: one static frame is drawn and the loop never starts.
  Any port must keep that behaviour.
- It is paused by an `IntersectionObserver` when off-screen. A port should pause when its
  window is not visible, for the same reason: this must not spin a CPU on a laptop.

Ported to Qt this is a `QWidget` with a `QPainter` and a `QTimer`, filling
`QRect(x, y, 10, 2)` rectangles. It needs no OpenGL and no external library.

## Rules carried over from the website project, confirmed 2026-08-27

These are not inferred from the CSS. They are stated as locked rules in the
secureprospective-site project's own `CLAUDE.md`, and they bind SP+ too: the design system
is one system, and an advisor who sees the site and then the machine should not feel a
seam.

### Zero em dashes in anything a user reads

Locked 2026-08-05 on the website: **no em dashes in any copy a visitor reads**, titles
included. The reasoning given there is worth repeating because it applies with more force
to an AI-native product: "Part of being AI-native is writing like it, not shipping the
tell-tale AI-slop punctuation habit." Use a period, a colon or a comma, and restructure the
sentence if a straight swap reads badly.

For SP+ this binds every user-facing string: the Welcome screen, the help corpus, Fin's
prompts and tips, notification text, and `.desktop` entries. It does not bind engineering
prose such as this document, ledger entries, commit messages or code comments.

### The anti-list

No organic curves, no pastels, no script or serif type, **no shadows**, no rounded pills,
no full-bleed photography, no multi-hue gradients, no glassmorphism, no bouncy easings.

"No shadows" needs care, because the site plainly uses `box-shadow: 6px 6px`. The rule bans
the *soft blurred drop shadow* that fakes depth. The site's Card-Lift is a **hard offset
with zero blur** and reads as printed registration, not as elevation. Hard offsets are the
system's own device; soft shadows are banned.

### Motion is fast

**120 to 200ms**, described there as a "Bloomberg ticker feel. NOT slow/deliberate."
Anything slower reads as a consumer app. The one deliberate exception already recorded is
the hero animation's ambient drift, which is slow because it is atmosphere rather than
feedback.

### Mood anchor

**Corporate badge x transit signage x financial ledger x storm shelter x vault.** When a
composition decision is genuinely open, that list is the tiebreaker, and it is the sharpest
statement of the identity anywhere in either project.

### Typography, confirmed

Primal for display and IBM Plex Sans for body are the website's locked pairing, both
self-hosted, with an explicit rule of **no font CDNs**. SP+ satisfies that by installing
them into the image.

## The SP+ Calm wallpaper

`1GraphWeb_8K.png`, made by Christopher on 2026-08-27, is the default wallpaper for the
SP+ Calm global theme. The source 8K PNG is 22 MB; it ships instead as a JPEG resolution
ladder at 1920x1080, 2560x1440, 3840x2160 and 7680x4320, **4.3 MB for the whole set**, so
that a modest laptop is not asked to decode an 8K PNG at every login. Three further
wallpapers exist in the same folder and are not yet wired to a theme:
`GraphWeb_8K.png`, `HexBlock_8K.png` and `RedBlueEtch_8K.png`.
