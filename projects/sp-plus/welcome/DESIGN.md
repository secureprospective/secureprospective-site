# SP+ Welcome HTML design

## Direction

This is a first-run control room, not a generic onboarding wizard. Its world is corporate badge x transit signage x financial ledger x storm shelter x vault. Secure Prospective blue owns the route rail and decision fields. Silver is the working ground. Yellow acts as a signal, not decoration. Every edge is square, every rule is explicit, and depth is the site’s hard blue registration offset with zero blur.

## One viewport contract

At 1366x768, the application is a single fixed task surface: route rail, thin operational header, current screen and footer all fit at once. The desktop screen container does not scroll. Content was cut, condensed and composed horizontally rather than reduced below a comfortable reading size. Long help articles are disclosed as short, in-place guidance pages with Next guidance controls, not a scrolling reader.

`verify_viewport_v5.py` runs the real QWebEngine application at 1366x768. Its output is stored at `screenshots/v5-1366x768/fit.json`. Every one of the seven screens and both required help depths has equal `document.documentElement.scrollHeight` and `clientHeight`, with no overflowing nested scrolling region.

## Composition

The application fills the window with a persistent blue route rail, a thin operational header, a substantial content field, and a task footer. The first screen is a briefing field: the real ticker animation moves behind a large Primal statement, while a right-side three-line manifest explains the route.

The look screen now starts with the global theme, not a wallpaper. Four installed SP+ looks appear as picture-led choices. SP+ Calm Dark is preselected and recommended. Wallpaper and colour palette sit below as optional subordinate tuning. Changing a theme resets both to that theme’s defaults. The chosen theme is recorded in the final handoff, while application remains an explicit STUB until Plasma configuration read-back verifies the asynchronous application result.

Windows 11 Dark and Light use their shipped Plasma `fullscreenpreview.jpg` artifacts from the real guest. Calm Dark and Light use the available graphite colour-scheme window studies. They are labelled as scheme evidence, not claimed to be full desktop previews. The compact Breeze, Breeze Dark and Fedora Dark controls are offered without invented images because no packaged desktop preview was available for them. The Calm images show graphite grounds and blue-cyan state glow only. No orange Calm preview is present.

The map screen combines a deliberately abstract desktop map with an in-app help station. Office is three independent lanes. Fin is a split secure field and ledger. Optional tools are a register. The last screen is a handoff board. This makes the seven steps legible at a glance while preserving one decision at a time.

## Interaction and accessibility

All controls are native buttons, inputs, radio controls or checkboxes with visible yellow focus. The route rail, footer and browser tab sequence can complete the flow. Actions that do not have a verified system integration say `STUB` before activation and report that no system change was made after activation. The hero uses the original ticker algorithm, respects `prefers-reduced-motion`, and pauses via `IntersectionObserver` when hidden.

## Motion

Feedback uses a 160ms ease-out transition. The lone ambient exception is the slow hero drift. There are no soft shadows, curves, gradients with multiple hues, pills, glass effects, photography or bouncy easing.

## Assets

- `assets/spplus-calm-dark.png` and `assets/spplus-calm-light.png` are copied from the delivered graphite theme window studies.
- `assets/windows11-dark.jpg` and `assets/windows11-light.jpg` are the real 1920x1080 `fullscreenpreview.jpg` files read from the running `fedora-test34` guest’s installed look-and-feel packages.
- The older wallpaper contact-sheet assets remain in the payload for provenance but are no longer shown on the global-theme screen.
