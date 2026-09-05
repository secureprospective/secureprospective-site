# Secure Prospective — voice, pitch, and directional latitude

Written 2026-09-02, at the end of the session that redesigned the site and put it
live. It exists because the reasoning behind the work is worth more than the work
and is the part most easily lost.

---

## 0. Name standard (decided 2026-09-05)

The name is written closed-up, as one word, everywhere a reader sees it:
**SecureProspective**. The domain stays lowercase, `secureprospective.com`. Code,
identifiers and the drawn lockup were already closed-up and do not change.

Two forms are wrong and should be corrected on sight: the spaced *Secure Prospective*
and the sentence-cased *Secureprospective*.

Christopher's ruling, 2026-09-05, when the site was found alternating between the two
forms. One token, no exceptions, is simpler to hold than a rule about which surface gets
which form, and it already matches the domain and the lockup.

Documents written before this date, this one included, still carry the spaced form in
their prose and titles. They are historical records and are not being retro-edited; the
standard governs the site and everything written from here.

---

## 1. What Secure Prospective is

Two definitions survived a deliberate winnowing. Both are kept; everything else
was discarded as "in the distance."

> **A future you can plan on.**
>
> **Tomorrow, underwritten.**

They are not slogans to paste onto a page. They are the test a sentence has to
pass before it ships.

## 2. The pitch, in Christopher's framing

The world is changing radically, again. People are scared, confused, and need a
torch in the darkness. Buzzwords push our prospects away, so we ride a thin wire
until we have the credibility to be heard.

Three consequences follow, and they are the whole strategy:

**Plain language is not a style preference, it is the product.** The audience is
frightened. A frightened person cannot parse jargon, and reaching for it reads as
someone with something to hide. Restraint is what a torch looks like in writing.

**Credibility is spent, not claimed.** The site leads with a real operating IMO
and real figures because those are earned. SP+ appears as a consequence of the
operation rather than as a pitch. Consulting follows delivered evidence. Say the
thing that is true and already done; let the forward claim rest on it.

**The thin wire has two edges.** Too much spectacle and the ICP leaves before we
are heard. Too little and we are another beige advisory site nobody remembers.
The work is to be genuinely arresting without ever being loud.

## 3. Voice rules

- No buzzwords. If a phrase would appear in any competitor's deck, cut it.
- Fewer words are better. The definition exercise was won by four words.
- Warm and human. The reader is taking a risk on something unfamiliar; the copy
  is evidence that a person cared.
- **Zero em dashes** anywhere a visitor can read. Enforced mechanically by
  `motion.mjs`; it is a hard gate, not a guideline.
- Name things the way the reader recognises them, not the way the system is built.
- No invented numbers, ever. Every figure on the site traces to something real.

## 4. Directional latitude

The instruction that set the range: *push further into radical territory without
losing ourselves. The home page sets the tone. Do not lose the immersiveness.
Nothing average gets printed.*

How that resolved in practice:

**No two pages are the same, because no two pages carry the same message.** A
different message gets a different form and a different energy. Sameness across
pages is a failure, and it is measured rather than eyeballed: `divergence.mjs`
signatures each page by the vocabulary it introduces and fails the build if any
pair overlaps too far. The five inner pages score 0.16 to 0.28 composite, against
a 0.52 to 0.83 baseline for the pages they replaced.

**The design system is not up for renegotiation.** The Property Card System holds:
platinum stock, compliance blue, signal yellow, ledger ink, square corners,
stamped Primal titles, hard zero-blur Card-Lift shadow. Radical means the deck
now behaves like a deck; it does not mean new colours. Signal yellow is a
background and an accent, never text on a light ground, and that is now a gate.

**Immersiveness is load-bearing.** Cards deal onto the table as you scroll, carry
real depth, and answer the pointer. It is the thing that makes the site feel
built rather than assembled, and it survives every performance and accessibility
constraint below rather than being traded against them.

**Average is a failure state.** Work that is merely acceptable gets sent back.

## 5. The five pages and their jobs

| Page | Message | Energy |
|---|---|---|
| Home | Meet the name, take the tone | Sets the register for everything else |
| The Operation | A real business, with real figures | An evidence register, read like a ledger |
| SP+ | The first deliverable, made concrete | A calm, inspectable workstation manifest |
| The Method | How the work actually proceeds | A cycle you can follow and re-enter |
| The Operator | One human, not a product | An annotated field log of three careers |
| Contact | Choose a starting point | An open routing desk, no proving left to do |

## 6. Engineering doctrine earned this session

These were paid for with real defects and are the reason the build is trustworthy.

**A gate that has never failed is not evidence.** Three separate gates written
this session passed the site while being structurally incapable of failing:
`divergence.mjs` scored an absence of motion as originality; `density.mjs`
counted coloured surfaces as content, so empty bands filled themselves in and
every card contained itself at 100%; `afternav.mjs` measured content and state
while the actual defect lived in an element handler. Every gate is now proven
against a deliberately broken build before it is trusted, and the negative
control is recorded in the README next to the check.

**Three different kinds of "broken" need three different instruments.**
Element-level (`mobile.mjs`: clipped, overflowing, too small, untappable),
composition-level (`density.mjs`: dead bands and hollow containers), and
relational (`contrast.mjs`: ink against the surface behind it). A page can pass
all of the first and still be unreadable. Two labels shipped at 1.00:1 —
yellow on yellow and blue on blue — invisible while passing every size check.

**A fresh page load is the one state where a rebinding defect cannot appear.**
The site navigates with View Transitions. A dead mobile menu passed nine
consecutive navigation checks because every one of them loaded the page fresh.
It worked on arrival and died the moment anyone used it. `afternav.mjs` now
measures each page twice, loaded directly and arrived at by clicking, and
compares. Anything bound at module evaluation must move to `astro:page-load`;
anything bound to `document` or `window` inside that hook must be torn down on
`astro:before-swap` or it stacks once per navigation.

**The one number that tells you the lifecycle is sound:** each script's
`addEventListener` count should exceed its `removeEventListener` count by exactly
three, which is the permanent lifecycle trio. Any other margin is a leak.

**Copy-pasted branches are how invisible text happens.** Both 1.00:1 labels came
from a variant restating a colour decision it had already made elsewhere, where
one restatement fell out of step. The fix is never to patch the stale line; it is
to make the label derive from its surface so the next variant cannot reintroduce
it.

**Fixes get verified by the gate, not by the fixer.** The blue-on-blue heading was
introduced by the fix for the yellow-on-yellow one: deleting half of a grouped
CSS selector left the other half attached to the following rule, costing the
label both its colour and its size. The gate caught it within a minute.

## 7. What is still unproven

Everything above was verified in headless Chromium. No real iPhone, Android,
Safari or Firefox test has been run. The class of defect that reached a human
first — an interaction that dies after a transition — is now covered by two
gates, but only in one engine.
