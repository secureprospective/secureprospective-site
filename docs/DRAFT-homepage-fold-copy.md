# Draft: what the homepage fold should say

For Christopher. Nothing here is implemented. P0-1 from `docs/IMPECCABLE-2026-09-10.md`.

## What is actually wrong

The first screen carries the wordmark, the phonetic spelling, and one thin strip.
A producer arriving from a campaign link reads a logo and a pronunciation guide.
The proposition is on the page, but it is inside the strip at 12 to 13 pixels.

The `<title>` is the bare string `SecureProspective` and the `<h1>` is the same
word again. Those are the two highest-value strings on the site and neither one
says anything. Every other page already gets this right: *The operation is not a
footnote.* *Choose the conversation.*

## The constraint I wrote to

Plain language, no pitch. No "transform", "empower", "unlock", "solutions",
"cutting-edge", "revolutionary". No claim the record does not already hold. No em
dashes. The wordmark and the pronunciation both stay; the argument goes under
them rather than replacing them.

The site's own voice is declarative and slightly blunt. Every option below is
written in it.

---

## Option A — the plain statement

> ### SecureProspective
> /sɪˈkjʊr//prəˈspek.tɪv/
>
> **An insurance business that already runs, rebuilding itself in the open.**
>
> Annuity and life wholesale, case design, and suitability for eight active
> producers. SP+ is the first thing that work has produced.
>
> `[ See the operation ]`  `[ See SP+ ]`

Leads with what is true and verifiable. "Already runs" is the whole differentiator
against every firm selling a plan it has not used. "In the open" earns the
register section further down the page. Two doors, matching the two-state section
directly below the fold, so the fold is a table of contents rather than a pitch.

**Cost:** it names no benefit to the reader. It assumes the reader is curious
enough to take a door.

---

## Option B — the reader's problem first

> ### SecureProspective
> /sɪˈkjʊr//prəˈspek.tɪv/
>
> **Most of what an advisor is sold was never used by the people selling it.**
>
> This one is. SecureProspective is a working insurance practice, and SP+ is the
> workstation it built for its own producers.
>
> `[ See SP+ ]`  `[ See the operation ]`

Closest to the torch-not-a-pitch brief: it opens on something the reader already
believes and has been burned by, and answers it in four words. The fear is real
and it is not manufactured.

**Cost:** the first line is a swipe at the industry. It is true and it is the
sharpest thing on the page, but it is an opinion rather than a record, and it is
the one line here that a compliance-minded reader might raise an eyebrow at.

---

## Option C — the record as the opening

> ### SecureProspective
> /sɪˈkjʊr//prəˈspek.tɪv/
>
> **Eight producers. About $18M a year. About $110M over six years.**
>
> That is the record. SP+ is what it is being spent on: an encrypted, immutable
> workstation for insurance agents and financial advisors.
>
> `[ See the operation ]`  `[ See SP+ ]`

Arithmetic in the first position, which is the house style for risk material and
works just as well for credibility. Nothing to argue with. It also puts the
figures above the fold instead of one scroll down, where they currently sit.

**Cost:** the numbers are modest in absolute terms and lead with scale, which is
not the strongest ground to compete on. It reads as a firm rather than as an idea.

---

## My recommendation

**Option A**, with Option C's figures kept where they already are in the two-state
section. A is the only one of the three that is purely a record and still names a
benefit and a next step. B is the best writing and the highest risk; C spends the
credibility on the fold and leaves the section below it repeating itself.

## Title and description (P1-6 travels with this)

The page titles all lead with internal codenames, so nothing on the site contains
a term a producer would type. Fixing the homepage alone recovers most of it.

| | Current | Proposed |
|---|---|---|
| `<title>` | `SecureProspective` | `SecureProspective: an IMO for producers, and the workstation it built` |
| `<h1>` | `SecureProspective` | whichever bold line above is chosen |
| description | A revenue-producing IMO building its prospective form through SP+, the first AI-native deliverable. | An independent marketing organization doing annuity and life wholesale, case design, and suitability for active producers. SP+ is its first deliverable. |

The current description is written for someone who already knows what the company
is. "Prospective form" and "AI-native deliverable" are internal vocabulary.

**Open question for you, not for me:** whether the interior titles change too.
`The Operation:`, `The Method:` and `SP+:` are brand-true and search-invisible.
That is a positioning trade, so it is your call, not a defect I should quietly fix.
