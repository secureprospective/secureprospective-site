# Fin — the office-staff roadmap: what to build, in what order, and what must never be a skill

**Date:** 2026-09-12
**Status:** analysis and proposal. No code authorized by this document.
**Sources read:** `docs/01-PRODUCT-DEFINITION.md` §1–4, `bee/welcome-draft/ICP.md`,
`config/fin-system-prompt.md`, all six `config/fin-skills/*/SKILL.md`, all six
`config/fin-extensions/*.ts`, `config/fin-pi-config/*`, `tests/fin-*-gate.sh`,
`docs/ledger/RESUME-2026-09-12-fin-polish.md`, `docs/from-claude/2026-09-12-fin-guardrail-desktop-class.md`.

---

## 1. The ICP, restated as a staffing problem

The primary user is an independent insurance/financial advisor, 45–70, one-person business
or a principal with one or two staff, Windows-origin, near-zero tolerance for disruption,
whose work happens in a browser and whose disk holds the most sensitive PII in civilian
commerce. No IT function, no MSP, no MDM.

The operative fact for this report is not their technical level. It is their **headcount**.

A practice that would have four back-office people has one person doing all four jobs badly
and at the wrong time of day:

| Role a real practice would staff | Who does it today | What actually happens |
|---|---|---|
| Marketing | The advisor, at 9pm | Nothing goes out for months, then a flyer that a carrier would not approve |
| Administration | The advisor, between appointments | Downloads folder as filing cabinet; forms half-filled; nothing findable |
| Executive assistant | Nobody | Follow-ups live in memory and on sticky notes; meetings are unprepared |
| Advisory support (paraplanner) | The advisor, on the kitchen table | One-page sketches redrawn by hand every time |

**Fin's product thesis follows directly: Fin is not a Linux help desk with a personality. Fin
is the four missing staff.** Every skill below is justified by a named job one of those four
people would have done, and rejected if it is not.

The existing six skills confirm the thesis but cover it unevenly: `printer` is help desk,
`notebook`/`voice`/`save-this-session` are infrastructure for the other three, `email` is
executive assistant, `marketing` is marketing. **Administration has zero skills. Advisory
support has zero skills.** Those are the two holes.

---

## 2. The rule for deciding skill vs. extension

This is settled doctrine in the tree and every proposal below is classified against it.
DN-31 decision 7, restated: **a system prompt is not a guardrail.** Instructional text is a
request a model can be argued around, and it fails silently on the one occasion it matters.
`spplus-organize.ts` records that this was tested twice on a live guest and failed both times
as prose.

| | Skill (`SKILL.md`) | Extension (`.ts`) |
|---|---|---|
| Is | A job Fin does when asked | A boundary or a behaviour that holds whether or not Fin agrees |
| Invoked by | The advisor's words | The tool path, unconditionally |
| Fails by | Being ignored, visibly | Not failing — that is the point |
| Right for | Craft, sequence, voice, judgement | Irreversibility, PII, anything leaving the machine, anything a client sees |
| Costs | Tokens when used | A gate that must be mutation-tested red |

**Test to apply:** *if Fin were argued into skipping this, would the advisor be harmed and
would they know?* Harmed + would not know ⇒ extension. Everything else ⇒ skill.

Two things in the current set are on the wrong side of that line by omission, not by error —
they simply do not exist yet: the redaction boundary (DN-31 6–9, explicitly unimplemented and
flagged as such in `spplus-workspace.ts`) and any control over client-facing output.

---

## 3. Constraints that bound every proposal

Non-negotiable, taken from the tree and standing decisions. A proposal that violates one of
these is not a trade-off, it is out.

1. Writes are confined to `Documents/Fin` (`spplus-workspace.ts`). Any skill needing to write
   elsewhere is redesigned, not excepted.
2. The notebook records no human names or PII (`spplus-notebook.ts`), and the guard is in the
   tool path, not in the skill text.
3. Guardrails are model-agnostic. Never propose pinning a model or relying on model behaviour
   as a control.
4. Guardrails protect core desktop components and system utilities as a class, not only
   irreversible actions (see the rpm-ostree/RPM Fusion finding, 2026-09-12).
5. Web search is **off**; fetch is **on** (`web-search.json`). The fetch path is therefore the
   single control point for anything Fin reads from outside.
6. No unsupported compliance claims, anywhere, ever (Product Definition §4.10).
7. Client-facing numbers use guaranteed annuity values only. Social Security and inflation
   assumptions are permitted and must be labelled as assumptions.
8. Income and drawn-down assets never share a surface. Concept surfaces teach; planning
   surfaces plan; they are different pages.
9. Advisor tools must produce useful output from incomplete information. No required input.
10. Every shipped capability needs an update path. Fin updates are OS image updates
    (`tests/fin-update-lane-gate.sh`) — a skill that self-updates from the network is a defect.
11. The advisor bears their own metered platform costs; nothing bills to Secure Prospective.
12. Free tools only. No proposal below requires a paid service or subscription.

---

## 4. The catalogue

Priority key: **P0** = the product is incomplete without it. **P1** = the role is not credibly
staffed without it. **P2** = real value, not load-bearing. **P3** = defer, listed so it is not
rediscovered.

### 4.1 Cross-cutting extensions (build these first — they gate everything else)

| # | Name | Kind | Why it cannot be a skill | P |
|---|---|---|---|---|
| X1 | `spplus-pii-shield` | ext | The only thing standing between a client's SSN and a cloud provider. DN-31 6–9 is the acknowledged hole; `spplus-workspace.ts` says in its own header that it is *not* this control. Detect-and-hold at the point content enters a model request: SSN, DOB, account/routing, policy numbers, named individuals. Advisor is asked once per document, in their words, and the answer is recorded. | **P0** |
| X2 | `spplus-client-output` | ext | Any artifact Fin exports that a client could see (PDF, letter, flyer, sheet) gets a mandatory provenance and review block appended at export, plus a refusal to emit a recommendation or suitability conclusion. Advice responsibility stays with the advisor; a paragraph in a skill will be argued around on the one flyer that reaches a regulator. | **P0** |
| X3 | `spplus-source-gate` | ext | Fetch is on and search is off, so the allowlist *is* the editorial standard. Political outlets banned outright; otherwise-good outlets with adjacent hard bias banned. Facts cited in client material come only from vetted sources; topic discovery may use a wider pool and must be labelled as such. | **P1** |
| X4 | `spplus-consent-ledger` | ext | Every read of a client file, every export, every held-and-released PII decision, appended to a local append-only log in advisor language. This is what turns §2.2 of the Product Definition (*"I can answer the security questionnaire"*) from a claim into evidence. Evidence is a feature; a self-reported one is not evidence. | **P1** |
| X5 | `spplus-followups` | ext | Surfaces what is due on the opening page. A tickler file that must be asked for is a tickler file that is never read. It makes the EA skills below true rather than promised. | **P1** |
| X6 | `spplus-cost-meter` | ext | The session meter reports time and fullness. It does not report money. The advisor bears their own API cost, so the one number they can act on is dollars this month — in dollars, never tokens. | **P2** |
| X7 | `spplus-desktop-class` | ext | Already drafted in `docs/from-claude/2026-09-12-fin-guardrail-desktop-class.md`; listed here for completeness because it is source-only and not yet in an image. | **P0** |

### 4.2 Administration — the missing back office

The largest hole. Zero skills today, and the job with the most hours in it.

| # | Skill | The job a person would have done | Notes / dependency | P |
|---|---|---|---|---|
| A1 | `filing` | Turn the Downloads folder into a filing cabinet, on a naming convention the advisor picks once and Fin keeps | Name-only, inheriting `spplus-organize.ts` verbatim — Fin must say the sentence and the read-block must be live. Convention stored as a notebook `note`. | **P0** |
| A2 | `paperwork` | Fill, merge, split, flatten and stamp PDFs — the actual daily substance of insurance admin | Ghostscript and LibreOffice already ship; no install needed. Gated by X1 the moment a form carries client data. | **P0** |
| A3 | `find-it` | "Where is the Johnson application?" answered without the advisor knowing what a path is | Name and metadata search first; content search only with an explicit, logged consent (X4). Directly serves the standing rule that navigation must never assume vocabulary. | **P1** |
| A4 | `scan` | Paper application → straight PDF in the right folder with the right name | Needs a scanner path and OCR; OCR is a package addition and therefore an image change with an update path (constraint 10). Do not let Fin install it ad hoc — that is exactly the rpm-ostree failure. | **P2** |
| A5 | `evidence-report` | Produce and *explain* the Security Evidence Report | Product Definition job #9. Fin's contribution is the plain-language narration and the send; the report itself is system-side. Must state evidence, never compliance. | **P1** |
| A6 | `passwords` | Get Bitwarden actually adopted, and rescue the advisor from the shared-password habit | Bitwarden is already the Welcome optional-tools path. Skill is adoption and hygiene coaching, not credential handling — Fin must never hold a vault secret. | **P2** |
| A7 | `mileage-and-expenses` | The 1099 shoebox | Pure spreadsheet work; LibreOffice Calc present. Low risk, real gratitude. | **P3** |

### 4.3 Executive assistant — the highest ratio of value to risk

No client PII leaves the machine for most of this, and it addresses the failure the advisor
feels every week.

| # | Skill | The job | Notes | P |
|---|---|---|---|---|
| E1 | `after-the-meeting` | Rough notes in → follow-up email draft, task list with dates, and a notebook page out, in one pass | Composes `email` + `save-this-session` + X5. **Highest-leverage single skill in this document**: it is the moment the advisor is most overloaded and least likely to do the work. Notebook write goes through the PII guard, so client names never land. | **P0** |
| E2 | `follow-ups` | The tickler: what is owed, to whom, by when, reviewed unprompted at the start of a conversation | Plain markdown in `Documents/Fin`. Useless without X5. | **P0** |
| E3 | `meeting-prep` | Assemble the folder and the one-page brief before the appointment | Reads client files ⇒ X1 and X4 mandatory. Deliberately reads *only* what the advisor points at. | **P1** |
| E4 | `my-day` | One screen: what is due, what is unfiled, what is unanswered | Composition of E2 + A1 + `email`. Build last, after its inputs are real. | **P2** |
| E5 | `calendar` | Agenda awareness | Requires Google/M365, i.e. a browser and an account boundary that is unresolved. **Defer explicitly** — do not half-build it. | **P3** |

### 4.4 Marketing — one skill exists; it needs a department around it

`marketing/SKILL.md` is good and correctly scoped to the one-pager. The gap is everything
that makes marketing a *habit* rather than an artifact, and the review step.

| # | Skill | The job | Notes | P |
|---|---|---|---|---|
| M1 | `review-before-it-goes-out` | The compliance read that an IMO marketing desk would do | Reframes, never strips. Checks language against carrier advertising rules and the guaranteed-values rule; flags unsupported claims; never asserts approval. Pairs with X2, which makes the disclosure block mechanical. | **P0** |
| M2 | `seminar` | The whole event kit: invitation, reply card, sign-in sheet, Impress deck, and the follow-up sequence | LibreOffice Impress ships. This is the one marketing motion this ICP actually runs. | **P1** |
| M3 | `newsletter` | The monthly client letter that never gets written | Facts only from X3-vetted sources. Voice profile is a hard prerequisite. | **P1** |
| M4 | `social` | Drafts for the advisor's own channels | Draft-and-hand-off only. Advisors connect their own accounts and bear their own platform costs; Fin does not publish and does not hold channel credentials. | **P2** |
| M5 | `recruiting` | For the principal with 1–2 staff: the agent-recruiting message | The angle is fixed and is Christopher's call, not a tool's: the IMO pitch has not changed in 25 years, answered by being a producing agent. Copy leads with truth, downplays the call to action. | **P3** |

### 4.5 Advisory support — the paraplanner, and the sharpest edges in the product

Highest value to the advisor, highest regulatory exposure, and the only category where a
wrong output is dangerous rather than merely unhelpful. **None of these ship before X1 and X2.**

| # | Skill | The job | Notes | P |
|---|---|---|---|---|
| V1 | `fact-finder` | Capture the client picture from whatever the advisor actually has | No required input; extra data only adds more math. Local only, never leaves the machine. | **P1** |
| V2 | `income-sketch` | The one-page retirement income rough draft that starts the conversation | It is a conversation tool, not a plan. Readability outranks modelling sophistication. Guaranteed values only; assumptions labelled. Income and assets do not share the page. | **P1** |
| V3 | `explain-this` | Turn a carrier document, illustration or statement into something the client understands | Pure translation, no recommendation. X2 enforces the no-recommendation boundary at export. | **P1** |
| V4 | `concept-sheet` | Teach one idea with pictures — the concept surface, kept clean of planning detail | Ground it in the practice's existing teaching material before inventing anything from research. | **P2** |
| V5 | `policy-review` | Read an in-force illustration and say what changed | Heaviest PII exposure in the catalogue. Gate hard or do not build. | **P2** |
| V6 | `annuity-compare` | Side-by-side of guaranteed values | Guaranteed only. Non-guaranteed columns are not a feature to be added later; they are prohibited. | **P2** |

### 4.6 Explicitly not building

Recorded so the analysis is not repeated in six months.

- **Anything that sends.** No email send, no post, no e-signature submission, no carrier
  portal submission. Fin drafts; the advisor sends. This is the same boundary that governs
  the fleet's own mail handling and it is not negotiable per-feature.
- **A CRM.** The advisor has one. Competing with it produces a second place client data
  lives and no migration path.
- **Client-facing chat.** Fin talks to the advisor. A client on the other end of Fin is a
  supervision problem with no answer.
- **Local model inference.** Below the line for v1 by the Product Definition, and the
  hardware is not there.
- **Browser automation of carrier portals.** Credential handling plus fragile selectors plus
  a regulated submission path. The cost of a wrong click is not recoverable by `bootc rollback`.

---

## 5. Sequencing

Three waves. Each wave is shippable on its own and each one earns the next.

**Wave 1 — the boundary (X7, X1, X2).** Nothing in §4.2–4.5 can be trusted until PII cannot
silently leave and client-facing output cannot silently carry a recommendation. X7 is already
drafted and only needs to reach an image. This wave has no advisor-visible feature in it, and
shipping it anyway is the discipline.

**Wave 2 — the office (A1, A2, E1, E2, X5, M1).** Six items that together make Fin read as
staff rather than as help. E1 alone changes how the product feels; A1 and A2 are where the
hours are; M1 is the thing that makes marketing output safe to use.

**Wave 3 — the paraplanner (X3, X4, V1–V3, A5, M2, M3).** Now that the boundary holds and the
consent ledger exists, client data can be worked with, and the advisory and evidence skills
become buildable.

Everything at P2/P3 is a backlog, not a plan.

---

## 6. Standards any of these must meet before being called done

- Written code is not working software. A skill is done when it has been **run on a booted SP+
  machine and observed producing the right artifact**, not when the markdown is committed.
- Each extension ships with a gate that has been mutation-tested red, in the pattern already
  set by the six existing gates. A gate that cannot fail is a false positive.
- Every skill is legible to an advisor: plain language, well defined, no Linux vocabulary, and
  discoverable without knowing the right word to type.
- Every skill and extension reaches the machine through the image update lane. Nothing
  self-updates from the network.
