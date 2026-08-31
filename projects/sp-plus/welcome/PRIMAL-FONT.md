# Primal will not ship — D-13

The Secure Prospective display face `Primal` is **permanently absent from SP+**. Christopher
settled the decision: `Noto Sans Condensed Black` is the permanent display face.

`branding/brand/fonts/Primal.ttf` was converted from the live site's `Primal.woff2` with
fontTools. It is a real, complete face: 164 glyphs, full ASCII, 13.7 KB. It is not installed
and it is not inside `welcome/app/`, because **the file carries no embedded licence string**
and nothing in this repository establishes a right to redistribute it inside an operating
system image.

That is a distribution question, not a technical one. A web font served from your own domain
and a font shipped inside an ISO handed to third parties are different acts with different
permissions, and the second one is what SP+ does. D-13 settles the choice rather than leaving
that licence question open for a future image.

`Impact` is not in the image either, so it is not a real fallback. The app now uses this
shipped-face chain for every headline:

    'Noto Sans Condensed Black', 'Noto Sans Condensed', sans-serif

`Noto Sans Condensed Black` is present in the image and is a genuine heavy condensed face, so
the display voice is deliberate rather than dependent on a missing file or an unlicensed face.

The staged copy pulled out of the app payload is kept at
`branding/brand/fonts/Primal.ttf.from-app` for historical evidence. It is not a shipping input,
and `welcome/app/fonts/` remains empty.
