# SP+ Welcome — code review, 2026-09-10

Requested by Christopher after the Alpha v0.10 sweep: check the Welcome app "is not dirty
or bloated". Reviewed at commit `945889e` against the shipped Alpha v0.10 source.

## Size

| File | Lines |
|---|---:|
| `welcome.py` | 2,395 |
| `app/app.js` | 1,295 |
| `app/app.css` | 596 |
| `app/help-core.js` | 301 |
| `app/index.html` | 180 |
| `app/hero.js` | 10 |
| **Total** | **4,777** |

**Not bloated.** Roughly 4,800 lines for an eight-screen onboarding app that also drives
theme application, Flatpak installs, SMB folder checks, printer discovery, email launching,
service capability queries and an in-app help browser is proportionate.

## The Python is clean

This is the part the "no shortcuts" standard is aimed at, and it holds up.

- **No `check=False` anywhere.** The defect that motivated the standard — subprocesses
  whose failures could not surface — is absent here.
- **No `TODO`, `FIXME`, `HACK`, or "for now".**
- **No fixed sleep standing in for a completion signal.** The one `time.sleep(1)` is inside
  a genuine poll loop. The three `setTimeout` calls in JavaScript are UI affordances — a
  copy-button label reverting, an ask timeout, a restart debounce — not waits pretending to
  be conditions.
- **Structure is good.** Twenty small `QThread` worker classes, one job each
  (`ThemeApplyWorker`, `ShareCheckWorker`, `PrinterWorker`, `FlatpakInstallWorker` …), so
  blocking work stays off the UI thread by construction rather than by discipline. The
  largest function is 115 lines; nothing is a god-function.
- **Fourteen broad `except Exception` clauses, three of which `pass`.** All three were
  read, and all three fall through to a defined behaviour rather than to silence: a generic
  user-facing message, an intended `None` default, and a `RuntimeError` from a destroyed
  web page during shutdown. Acceptable. The two that catch bare `Exception` where a
  narrower type would do are worth tightening on the next pass, not now.

## The dirt is in the CSS and HTML

Two findings, one of which is the cause of a shipping defect.

### 1. `.office-lane` has a hard-coded pixel height and no overflow — this IS T-20

```css
.office-lane{display:flex;flex-direction:column;min-height:370px;...}   /* base */
.office-lane{min-height:0;height:317px;padding:13px}                    /* short-viewport */
```

There is **no `overflow` declaration on `.office-lane` anywhere in the stylesheet.** So a
lane whose content exceeds 317px does not scroll, does not grow, and is not clipped at its
own border — it simply paints outside itself, and is clipped only much later by
`.screen{overflow:hidden}`. That is why the printer status and the folder error land on top
of the "A QUICK NOTE" strip, and why `OPEN EMAIL SIGN-IN` escapes its card.

`317` is the tell. It is a measured constant, tuned until one particular content state fit.
Every state with more content than that state — which is every error path — overflows. This
is exactly the shortcut the clean-code standard names: a magic number standing in for a
layout that adapts.

The same pattern repeats: `.fin-stage{height:390px}`, `.map-stage{height:calc(100% - 156px)}`,
`.desktop-map{min-height:420px}`, `.article-reader{max-height:250px}`,
`.ask-feedback{max-height:100px}`.

**Fix at the rules level, not per screen:** give the card a real internal layout — a fixed
header, a body that is `min-height:0; overflow:auto`, and a footer pinned with `margin-top:auto`
— and drop the pixel heights in favour of the grid track that already constrains the screen.
That one change closes T-20 across screens 03, 04, 07 and 08 together.

### 2. The CSS and HTML are written as near-minified single lines

`app/app.css` has a **4,748-character line**. `app/index.html` has a 2,590-character line,
and 13 of its 180 lines exceed 500 characters.

The file is not machine-generated — it is hand-written source that happens to have had its
newlines removed. The costs are real and are being paid already: a one-property change shows
in `git diff` as a whole line replaced, review cannot see what changed, and finding the
`.office-lane` rules above required extracting them with a regex rather than reading them.
For a file that carries the product's entire visual identity, that is the wrong trade.

**Fix:** reformat both files one property per line. It is a whitespace-only change with no
behavioural risk, and it should be done as its own commit so it never has to be reviewed
alongside a real change.

## Minor

- `app/__pycache__/welcome.cpython-313.pyc` (118 KB) sits in the working tree. It is **not**
  tracked by git, so it is local grit rather than shipped dirt — but it should be in
  `.gitignore` so it cannot be added by accident.

## Verdict

The application logic is in good shape and needs no cleanup pass. The presentation layer
carries one genuine shortcut, and it is not cosmetic — it is the direct cause of the highest
ranked defect in the sweep. Fixing the container and reformatting the stylesheet are the
whole of the work.
