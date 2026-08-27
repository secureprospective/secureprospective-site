# SP+ Calm graduated focus edge

## Decision

The shipped effect is a **three-logical-pixel, accent-tinted exterior falloff plus a one-pixel frame**, not a blur. On 96 DPI displays its 3 px spread is 0.79 mm. It is visible in an A/B comparison and reads as a cleaner active-window boundary, without becoming a halo.

Dark keeps the accepted `#76B4D4` accent. Its active exterior row opacities are **3.5%, 8.5%, 17.0%** outer to inner. Light deliberately differs: warm paper needs a deeper signal, so its `#196989` active exterior row opacities are **5.5%, 14.5%, 30.0%**. The light final alpha is 1.76 times the dark final alpha. That is intentional asymmetry, not a theme mismatch.

Inactive windows retain three rows of space but only use 0%, 2.0% or 2.5%, and 5.5% or 7.0% neutral-alpha marks. They recede against a busy wallpaper while retaining a quiet physical edge.

## COSMIC reference and the Plasma result

[COSMIC source](COSMIC-STUDY.md) establishes a 3 logical px compositor outline for focused, nonmaximized windows. It expands the corner radius with the outline and gives inactive windows no focus outline. Its fragment shader anti-aliases the curve but does not create a coloured bloom.

Aurorae can follow the structural idea but cannot be COSMIC's compositor:

| Capability | COSMIC | SP+ Aurorae build |
|---|---|---|
| Focus geometry | compositor-owned 3 px outline outside a focused nonmaximized window | SVG 9-slice uses 3 px exterior padding and a 1 px frame |
| Colour | theme `window_hint`, else accent | literal dark `#76B4D4`, literal light `#196989` |
| Falloff | no coloured falloff in current shader | three literal alpha-painted SVG rows |
| Corners | per-window radius expanded by outline thickness | radial-gradient corner slices confined to the same 3 px box |
| Inactive | no focus outline | substantially lower-opacity neutral edge |
| True bloom | not supplied by the focus shader | not possible from this shipped SVG alone |

The gap is real. An Aurorae SVG is retained-frame artwork rendered through `KSvg.FrameSvgItem`; it is not a per-window compositor shader. It cannot sample and blur the rendered wallpaper, spread light beyond its declared padded bounds, or know a semantic state beyond the frame variants the engine selects. The closest faithful result is the short, bounded alpha ramp delivered here.

## Why this is an actual Aurorae effect

The [KDE Aurorae documentation](https://develop.kde.org/docs/plasma/aurorae/) specifies named `decoration-*` FrameSvg elements for each edge and corner, an optional `decoration-inactive` variant, and `Padding*` values for exterior artwork. Aurorae's own QML implementation anchors active and inactive `FrameSvgItem`s to the full decoration and switches their opacity from `decoration.client.active`. [Engine source](https://invent.kde.org/plasma/aurorae/-/blob/master/v1/qml/aurorae.qml#L44-81).

Both delivered `decoration.svg` files therefore contain every required active and inactive edge, corner, and centre ID. Each straight edge literally paints the three alpha rows. Each corner literally contains an SVG radial gradient, limited to a 4 by 4 logical-pixel slice: three padded pixels plus the frame pixel. Both `.auroraerc` files set all four `Padding*` entries to 3. `Border*` stays at the accepted 1 px, so client and resize geometry do not grow.

The alpha rows are transparent and are composited over what is behind the padded decoration. They are not a screenshot-only CSS effect. `build_calm_glow.py` makes the evidence as the same 9-slice, 1x composition, but the render files are deterministic reference evidence rather than a claim that a live KWin session was exercised.

## KWin boundary

No KWin setting can add a true accent-coloured bloom to an Aurorae decoration. `Shadow=true` would enable a decoration-provided shadow convention, but it cannot make that shadow active-only with the shipped static SVG and would add depth to inactive windows too. It remains `Shadow=false`.

Compositing must remain enabled for exterior SVG alpha to reveal the wallpaper naturally. Aurorae documents optional `mask` artwork for a blur region, but no `mask` is shipped because this request is a slight focus signal, not a blurred glass or wallpaper effect. A genuine active-only blurred bloom would require a maintained KWin effect or a custom KDecoration plugin. No supported Plasma setting expresses it, so none is required or claimed.

## Light paper and accent

The old light ground was cool near-white `#F6F7F9`. The delivered paper family is:

- window and header `#F2EEE5`
- view `#F7F3EA`
- alternate `#E8E2D6`
- raised button `#E2DCCF`
- active title ground `#F1EADF`
- inactive title ground `#E7E1D5`
- warm near-black text `#27231D`

The light focus accent changed from `#267A9B` to `#196989`. It is slightly deeper and less green. Against warm paper that produces 5.13:1 against the active title ground and 4.71:1 against the inactive ground, while the three-row falloff supplies the stronger state pull requested for light mode. It is a cool complementary signal, not a Secure Prospective website colour.

All text ratios were recomputed in [CONTRAST.md](CONTRAST.md). The light minimum is 4.69:1 and the dark minimum remains 5.50:1.

## Low-DPI and evidence

The right test is 1x. A broad 8 to 16 px halo would be obvious at 96 DPI; one hard pixel looks aliased. Three graduated physical pixels is the practical short range here: enough samples to remove the hard transition while staying below a noticeable aura. The radial corners make the two meeting ramps continuous rather than leaving a square cyan joint.

Evidence is in [`renders/`](renders/) and uses native pixels, with no post-composite enlargement:

- `dark-focused-unfocused-1366x768.png` and `light-focused-unfocused-1366x768.png`: focused and unfocused windows against a busy ground.
- `dark-edge-corner-1x.png` and `light-edge-corner-1x.png`: raw 1:1 edge and corner crops.
- `dark-hairline-vs-graduated-1x.png` and `light-hairline-vs-graduated-1x.png`: old hard hairline beside the delivered falloff at equal scale.
- `light-old-cool-vs-warm-paper-1x.png`: old cool white beside warm paper.
- `dark-light-glow-comparison-1x.png`: deliberate dark and light asymmetry at the same scale.
- [luminance-ramps.md](luminance-ramps.md): per-row RGB, relative luminance, and deltas on each scheme's ground and on a busy-wallpaper sample.

The darkest busy-wallpaper ramp rises by 0.0057, 0.0095, and 0.0181 relative luminance between samples. The stronger light ramp changes in the opposite direction on paper because a deeper cyan lowers paper luminance. Those are controlled monotonic ramps, not a single discontinuous accent hairline. The return to the opaque frame is intentionally a physical window boundary, not part of the exterior falloff.
