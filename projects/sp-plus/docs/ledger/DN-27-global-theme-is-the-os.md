# DN-27 — The global theme is the OS, not the brand

Status: DECIDED 2026-08-27 by Christopher. Implemented in the Containerfile, staged for cycle35.
Retargets: D25 (which named the shipped default look), DN-24 (which applies it).
Does not amend: the brand spec in `branding/brand/BRAND.md`, which keeps its scope.

## The decision

**SP+ Calm (Dark) is the shipped default global theme**, and it is designed for eye comfort
and state legibility rather than for carrying the Secure Prospective brand.

Christopher's framing, verbatim:

> "I want a Graphite finish with calming dark themes. The Global theme isnt branded to the
> website, its meant for ease on the eyes for hours of work. The slight glow highlights will
> signal windows selected and the state they are in. We need those things for productivity,
> not theming. We have enough of that to get them here, the OS is its own animal."

## The line this draws

There are two visual surfaces in SP+ and they answer to different rulebooks. Conflating them
was a live error in this project until it was corrected: work had begun on repalletting the
desktop onto the website's measured blue, gold and silver.

| Surface | Governed by | Answers to |
|---|---|---|
| secureprospective.com, and **SP+ Welcome** | `branding/brand/BRAND.md` — blue `#0033A0`, gold `#FFD700`, silver `#E5E4E2`, square corners, offset shadow, hero animation | Recognition. It should feel like the front door of the company. |
| **The desktop global theme** | This decision | Comfort across a working day, and state that reads at a glance. |

The reasoning is that branding does its job *before* the advisor is a user. Once they are
sitting in front of the machine for eight hours, the desktop's job changes completely.

The one place the two surfaces touch is the theme gallery inside SP+ Welcome: a branded screen
showing pictures of unbranded desktops. That is correct and is not a contradiction to resolve.

## What this means for the theme

- **Graphite finish.** The grounds already in `SPPlusCalmDark.colors` are the right family:
  `17,20,25` window and view, `25,29,36` alternate, `30,35,42` button.
- **Glow is a signal, not decoration.** It marks which window has focus and what state a thing
  is in. Restraint is the requirement: a lift, not a highlighter.
- **The semantic triad stays unambiguous.** Negative, neutral and positive carry meaning to
  someone handling other people's money. They must never be confusable with "selected."
- Two defects in the inherited theme are open against these criteria and are out for rework:
  the accent is a saturated orange `255,112,76` used as a full selection fill with white text,
  and the entire UI font is JetBrains Mono, a monospace face doing the work of interface chrome.

## What shipped in the image

SP+ Calm had never been installed. The Containerfile copied only `theme/look-and-feel/` and its
siblings, which contain the Windows 11 packages alone, so `theme/sp-plus-calm/` existed in the
repo and in no image. Making it the default was therefore an integration, not a default swap.

- Both Calm look-and-feel packages, the desktop themes, the colour schemes, the Aurorae
  decorations and the `SPPlus-Calm` wallpaper package are now copied into the image.
- `paper-icon-theme` and `jetbrains-mono-fonts` are installed. Calm names `Paper-Mono-Dark`
  icons and the JetBrains Mono family, and **neither was in the image**. Without them the
  shipped default theme half-applies: stock icons and a silent font fallback, which is exactly
  the "looks broken on first boot" failure DN-24 was raised about.
- `/etc/xdg/kdeglobals`, `plasmarc` and `kwinrc` now name Calm Dark, and `spplus-first-login`
  now applies it.
- The wallpaper is applied as a **package directory**, not a single file, so Plasma selects
  from the resolution ladder (1920x1080 through 7680x4320, JPEG) rather than scaling one image.
- **The Windows 11 theme is deliberately kept installed** and selectable. Advisors arriving
  from Windows may want it, and DN-26's theme chooser needs real alternatives to offer.

## Honest status

Nothing here has been seen on a booted machine. Christopher has never laid eyes on SP+ Calm,
and cycle35 exists to change that. The gates assert the files are present and correctly named;
they cannot assert it is comfortable to look at, which is the only criterion that matters and
is his to judge.
