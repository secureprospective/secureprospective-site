# Decision: the three layout-less themes keep the stock panel

Date: 2026-08-31. Decided by Christopher after the VM verification run on the ISO built
that morning.

## What was found

The requirement was that all eight gallery themes own their paneling, not just the two
Windows packages, because advisors assume trust in first-class applications. The VM run
showed eight themes applying cleanly but only three distinct panel layouts, which read at
first glance as five themes sharing one panel.

Reading the installed packages corrected that. Five of the eight ship a layout of their
own and apply it:

| Theme | Ships `contents/layouts/` | Panel applied |
|---|---|---|
| Windows Light | yes | its own |
| Windows Dark | yes | its own |
| Breeze Light | yes | its own |
| Breeze Dark | yes | its own |
| Orchis Light | yes | its own, a top panel with no taskbar |
| Nordic | no | stock |
| Catppuccin Mocha | no | stock |
| Catppuccin Latte | no | stock |

Only Nordic and the two Catppuccin themes declare no layout. The important half of the
requirement is met for all eight: no theme inherits the panel of the theme before it,
which was the actual defect. Verified independently by a backend recorder sampling the
live applet sequence, not by reading configuration files.

## The decision

Those three keep the stock panel. We do not author SP+ layouts for them.

The reasoning is that their authors declared no panel intent, so there is nothing of
theirs to honour and nothing of ours being overridden. The stock layout is already known
good and already tested, whereas three SP+-authored layouts would be new design work, a
re-test of each, and a permanent maintenance burden, in exchange for visual variety that
no advisor asked for.

This sits alongside the existing rule that a creator's declared intent outranks SP+
normalization. That rule is about themes which HAVE declared something. It does not oblige
us to invent an intent for themes that have not.

## What changed as a result

The Welcome app previously told the advisor, for every layout-resetting theme, that the
panel would be "replaced with this theme's arrangement". For these three that is a claim
the desktop cannot keep. The preview copy is now driven by a `data-panel-source` attribute
on the card and says plainly that the standard arrangement is applied because the theme
does not define its own. The panel is still reset either way.
