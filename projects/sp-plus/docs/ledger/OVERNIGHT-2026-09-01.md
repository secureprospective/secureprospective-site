# Overnight session, 31 Aug into 1 Sep 2026

Goal as set: finish the Welcome app, organised and visually pleasing, thoroughly
tested, then build an ISO into `~/Downloads`.

## What was actually wrong, and what was done about it

**The crash dialogs were not caused by anything Christopher clicked.** Bee was
launching Welcome over SSH with no display attached. Qt calls `qFatal()` in that
case, which aborts the process and leaves a core dump, and KDE's crash handler
then puts a "closed unexpectedly" dialog on the screen of whoever is sitting at
the machine. Sixteen aborts were recorded, six dialogs after 22:40, every one of
them reading `could not connect to display`.

Two separate fixes followed. The app now detects the no-display case and exits
with a plain sentence instead of aborting, verified by running both copies
headless: the old one produced a fresh core dump, the guarded one produced none.
And SSH sessions into the test VM now inherit the live session display, so a
dispatched test run drives the same desktop a person would see. That second part
is test-rig configuration and deliberately does not ship in the image.

**The floater bar was real.** The Fin answer bar carries `display:grid`, and an
author rule setting `display` beats the browser's `[hidden]{display:none}`
whatever the source order, so the bar rendered on the help screen even while
marked hidden -- empty, with nothing to dismiss. Five other panels on that screen
already carried an element-scoped guard; this one had been missed. Measured
before: `hidden:true, display:grid, 57x74`. After: `display:none, 0x0`, and it
still appears when Fin actually answers.

**The desktop map was collapsing to a sliver.** Below 1080px the map stage stops
being two columns and stacks, which left the diagram 68px of height for 266px of
content: a blue band with half a dock in it. Bee independently reached the same
conclusion, and the two fixes agree. Below 1080px the stage is handed to the help
station, which is the working half of that screen.

**The map had a third of its panel empty**, while the copy above it named four
places and the diagram showed two. It now carries an Applications window as well,
so the illustration cascades like a real desktop and finishes at the dock.

## Search

The help was a tree that assumed the advisor already knew our word for their
problem and could spell it. The Ask Fin field now doubles as a search over the
whole manual: it suggests articles while they type, in their words rather than
ours, and when it genuinely has nothing it hands them to Fin rather than showing
an empty shelf. The topic tree stays below the results, because search should
never be the thing that removes their other way through.

Verified against the words an advisor actually types. `printr wont wrk` returns
Printing; `no internet` returns Wi-Fi won't connect; `passwrd` returns Browser
and passwords; `recovry key` returns both recovery articles; nonsense returns
nothing and offers Fin. `usb stick`, `backup` and `stolen` return nothing today
because those articles are still being written -- the search is right, the corpus
is incomplete.

## Gates

Every gate below was mutation-tested: deliberately broken, observed to fail on
exactly the right line, then restored. A check that cannot produce a negative is
a false positive rather than evidence.

| Gate | Covers |
|---|---|
| `welcome-layout-gate.sh` | nothing silently clipped, 8 screens x 2 sizes, plus search and article states |
| `welcome-help-search-gate.sh` | the advisor's own words and spelling reach the right guide |
| `service-link-gate.sh` | both service buttons reach their real URLs and nothing else |
| `config-preflight.sh` | 28 checks, all passing |
| close / lifecycle / stubs / tools / cycle36 / theme-phase2 | all passing |

Two gates were repaired rather than satisfied. Both pinned an exact string that a
copy pass had legitimately changed, so an honest rewording looked like a
regression. They now assert the promise a control makes -- that the check button
never offers to change the computer, that the store copy never describes setup as
pending -- instead of the words it uses.

## Bee

Bee's run ended at `EXIT=124`, a timeout, not a clean finish. It committed
`24d9b5c` at 00:34 and died at 00:50 without writing its report, so nothing it
did had been reviewed by anyone. Its work was read line by line and merged: its
flex layout for the article reader is better engineering than the font-shrink
workaround it replaced and was kept. Its change of the reader from `overflow:auto`
to `overflow:hidden` was reverted -- that turns a scrollable reading pane into one
that ends a guide mid-sentence with nothing on screen to say more exists. Its
rewording of the theme note was also declined: the real button reads
`APPLY <THEME NAME>`, so naming Apply is correct, and the two places that said it
were unified instead.

## Honest status

The app is finished to the standard set here and every claim above was observed,
not inferred. What remains genuinely unproven: the app has been driven offscreen
and run live on the VM desktop, but not on the Dell, which is the slow rig where
load times and races actually show. The manual is still being written by GPT --
19 of 40 articles verified at the time of the build -- so the shipped corpus is
the existing 17 articles, not the full manual. `scripts/build-help-data.py`
regenerates the in-app help from the manual and refuses to write a corpus that
would lose any article the app already ships; it should be run once the ledger is
fully VERIFIED.

## Theme round trip

Run on the VM as the acceptance test Christopher set: Breeze to Windows and back,
twice. All four applies returned exit 0 with the read-back agreeing, and because
read-back agreeing proves nothing on its own, the desktop was captured in each
theme and looked at. Breeze gives a light titlebar with a centred title and a
left-aligned panel; Windows gives a dark titlebar with left-aligned title and a
centred taskbar. The Welcome window stayed usable across every switch.

Worth recording for whoever runs this next: the helper is
`/usr/libexec/spplus-apply-theme` and it takes `THEME_ID (--layout|--no-layout)`.
Passing `1` instead of `--layout` exits 64 with a usage line and changes nothing,
which looks exactly like a failed theme apply if the stderr is not read. The
Windows theme id is `org.secureprospective.spplus.windows11.dark`.

## Closing screen

Two defects were found by looking at it rather than by any gate. It reported
`SP+ CALM DARK / SELECTED` before the advisor had chosen anything, naming a theme
that no longer ships at all -- the app had stopped shipping its own global theme
and this default was never updated. It now says the look has not been chosen yet
and the desktop is unchanged, which is both true and less alarming than a
stranger's choice made on their behalf.

It also opened with `FOLDER NOT STARTED + PRINTER NOT STARTED + EMAIL NOT
STARTED`: three failures in a row, on the last screen, for someone who has done
nothing wrong. Untouched is not a failure. It now names what was done first and
describes the rest as still waiting, and says nothing here expires.

## The image gate

The Containerfile now refuses to build an image whose help has lost search or
regrown the answer bar, and whose corpus has fewer than seventeen articles or any
article missing its title or body. It printed
`WELCOME_HELP_OK search ships, the answer bar stays hidden, corpus intact`
during this build, so the shipped image is verified to carry the work rather than
assumed to.
