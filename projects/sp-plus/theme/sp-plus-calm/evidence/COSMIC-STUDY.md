# COSMIC study

Research date: 2026-08-27. COSMIC here means System76's current Rust and Wayland desktop, not the older Pop Shell extension.

## What the current compositor actually draws

The best primary evidence is System76's source, rather than an impression from a screenshot.

- `cosmic-theme` calls `active_hint` the "cosmic-comp active hint window outline width" and its `ThemeBuilder` default is **3 logical pixels**. The default `window_hint` is absent. [Theme model](https://github.com/pop-os/libcosmic/blob/master/cosmic-theme/src/model/theme.rs#L100-L107), [default value](https://github.com/pop-os/libcosmic/blob/master/cosmic-theme/src/model/theme.rs#L935-L945).
- In normal floating layout, the compositor draws that indicator only when `focused == Some(elem)`, only when the window is not maximized, and only when `indicator_thickness > 0`. It uses `window_hint` if supplied, otherwise the theme accent. [Focus condition and call](https://github.com/pop-os/cosmic-comp/blob/master/src/shell/layout/floating/mod.rs#L1590-L1630), [colour selection](https://github.com/pop-os/cosmic-comp/blob/master/src/theme.rs#L15-L21).
- The compositor expands the indicator geometry by the requested thickness on all four sides. It adds that thickness to each corner radius. [Indicator geometry](https://github.com/pop-os/cosmic-comp/blob/master/src/backend/render/mod.rs#L169-L206). This puts COSMIC's focus outline outside the window bounds rather than inside the client ground.
- It is a solid outline, not a bloom. The fragment shader calculates a one-half-physical-pixel `smoothstep` only at the rounded edge, then emits `color` with a uniform `alpha`. It has no radial blur, blur sample, or multi-stop falloff. [Rounded outline shader](https://github.com/pop-os/cosmic-comp/blob/master/src/backend/render/shaders/rounded_outline.frag). The soft impression comes from the rounded, anti-aliased 3 px outline and the system's ordinary window shadow, not a coloured glow effect.

That corrects the premise usefully: COSMIC is the reference for a restrained, compositor-owned focus surround and quiet inactive state. Its current stock implementation is not itself a soft coloured bloom.

## Corners and inactive state

COSMIC's normal theme corner scale is 4 px extra-small, 8 px small, 16 px medium, 32 px large, and 160 px extra-large. The default roundness provides an 8 px small radius. The compositor uses the window's supplied corner radius and expands it by the focus thickness, so the outline wraps the curve instead of cutting across it. It does not impose a single 8 px radius on every application. [Corner-radii defaults](https://github.com/pop-os/libcosmic/blob/master/cosmic-theme/src/model/corner.rs).

The inactive case is genuinely quieter: the normal focus outline is simply not submitted for a nonfocused floating window. This is stronger evidence than a screenshot because it is the render condition above. The source also deliberately omits the focus outline from maximized windows. The active state is therefore focus plus nonmaximized status, not a generic status colour on every window.

COSMIC does distinguish additional interaction states, but not as a permanent window-state taxonomy:

- move-grab renders the same outline while a window is moved;
- resize and snapping use separate temporary indicators;
- tiled layouts also have focus and grouping indicators.

Those are transient compositor interactions, not meanings this Plasma theme should invent. [Move-grab path](https://github.com/pop-os/cosmic-comp/blob/master/src/shell/grabs/moving.rs#L135-L167), [tiling indicator path](https://github.com/pop-os/cosmic-comp/blob/master/src/shell/layout/tiling/mod.rs#L5033-L5043).

## Long-session evidence, bounded honestly

There is no credible study that measures eye comfort, fatigue, or a focus-border preference over an eight-hour COSMIC session. That claim should not be made.

Published first-hand coverage is mixed, which is relevant to the brief's long-hours criterion:

- An [XDA reviewer](https://www.xda-developers.com/i-tried-cosmic-desktop-as-a-kde-plasma-fanboy-and-one-thing-stopped-me-switching/) reported a light, quick, snappy desktop and strong tiling, but returned to Plasma for deeper customization.
- A [How-To Geek daily-driver account](https://www.howtogeek.com/i-tried-daily-driving-the-new-cosmic-linux-desktop-its-not-ready/) reported tray, menu, and application compatibility failures that interrupted work. The author still described COSMIC as modern and promising.
- A second [XDA account](https://www.xda-developers.com/cosmic-desktop-is-the-linux-de-ive-been-waiting-for/) praised fluid transitions, tiling, and switching workspaces.

The supportable conclusion is narrower: COSMIC's restrained, easy-to-locate focus treatment fits a low-distraction work surface, but reviews do not validate a health or fatigue claim. The SP+ implementation therefore tests low-DPI edge smoothness and state separation directly instead of borrowing an unmeasured comfort claim.

## Source disagreement and scope

Screenshots and reviewers may make COSMIC's edge look glowy because a rounded antialiased outline sits over a normal window shadow. The current source says the focus indicator itself is a uniform 3 px outline. Source wins over that visual inference. COSMIC theme colour, roundness setting, app-selected corner radius, window shadow, tiling gap, and display scale all change the final appearance, so no single screenshot supplies a universal pixel measurement beyond the default `active_hint = 3`.
