# Primal is staged, not shipped

The Secure Prospective display face `Primal` is **deliberately absent from the image**.

`branding/brand/fonts/Primal.ttf` was converted from the live site's `Primal.woff2` with
fontTools. It is a real, complete face: 164 glyphs, full ASCII, 13.7 KB. It is not installed
and it is not inside `welcome/app/`, because **the file carries no embedded licence string**
and nothing in this repository establishes a right to redistribute it inside an operating
system image.

That is a distribution question, not a technical one. A web font served from your own domain
and a font shipped inside an ISO handed to third parties are different acts with different
permissions, and the second one is what SP+ does.

Until Christopher settles it, headlines fall back. The declared fallback used to be `Impact`,
which **is not in the image**, so every headline would have dropped silently to generic sans
and the whole display voice would have quietly disappeared. The chain is now:

    Primal, 'Noto Sans Condensed Black', 'Noto Sans Condensed', Impact, sans-serif

`Noto Sans Condensed Black` is present in the image and is a genuine heavy condensed face, so
the fallback is a deliberate choice rather than an accident.

## To ship Primal

1. Establish the licence, and put the evidence in `branding/brand/fonts/Primal.LICENSE`.
2. Restore the font to `welcome/app/fonts/Primal.ttf`.
3. The Containerfile gate picks it up automatically: it ships the font only when the licence
   file exists beside it, and prints which branch it took.

The staged copy pulled out of the app payload is kept at
`branding/brand/fonts/Primal.ttf.from-app` so nothing has to be regenerated.
