# Fin as advisor-office staff — rigorous skills and extensions report

**Date:** 2026-09-12  
**Author:** Bee  
**Status:** recommendation and architecture report; no implementation authorized  
**Project reviewed:** `work/secureprospective-advisor-os/projects/sp-plus/`  
**Scope:** marketing, administration/operations, executive-assistant/client-service, and advisory/paraplanning work

## Executive finding

Fin should be built as a **supervised office-work system**, not as an unrestricted chatbot pretending to be four employees.

The highest-value first release is not an annuity comparison or a social-media generator. It is this chain:

1. prepare for a meeting;
2. turn rough meeting notes into a factual recap, task list, and follow-up draft;
3. keep the commitments visible until closed;
4. intake, name, validate, and file the resulting paperwork;
5. package any public/client-facing draft with its sources and review status.

That chain crosses all four office roles, happens repeatedly, and saves work without letting Fin recommend, transmit, publish, submit, or approve anything.

The current SP+ roadmap correctly identifies administration and advisory support as the two empty departments, and correctly separates skills from guardrails. It is not yet safe enough in three places:

- **A Pi extension running inside Fin is not a security boundary.** DN-31 Amendment A1/A2 already reaches the right answer: Fin needs its own identity and a root-owned typed broker.
- **A PII detector is not an egress boundary.** Names, free text, images, OCR mistakes, filenames, browser profiles, mail stores, and prompt injection defeat regex-only protection. File access and outbound transmission need separate, external controls.
- **The project has an unresolved privacy contradiction.** `config/fin-system-prompt.md` says client data must never leave the machine; the product is cloud-first; DN-31 discusses per-file consent for cloud transmission. Consent does not make “must never leave” true. Until Christopher settles this, client-document skills must use local deterministic processing or redacted/user-authored excerpts only.

**Recommendation:** build the boundary first, then ship a six-capability office tranche: `after-the-meeting`, `follow-ups`, `filing`, `paperwork`, `not-in-good-order`, and `review-package`.

---

## 1. The ICP, based on the project

The primary user is an independent insurance or financial advisor, usually 45–70, operating alone or with one or two staff. They came from Windows or Mac, do most work in browser-based carrier, CRM, e-signature, email, meeting, and office tools, hold highly sensitive client information, have little or no IT support, and will abandon a safer system if it interrupts the working day. This is stated directly in `docs/01-PRODUCT-DEFINITION.md`.

The relevant characteristics are:

| ICP fact | Product consequence for Fin |
|---|---|
| One-person practice or 1–2 staff | Fin must cover workflows that normally cross several job titles. |
| Relationship expert, not systems expert | Skills start from outcomes: “get ready for tomorrow’s review,” not file formats or commands. |
| Browser-centered practice | Do not build a parallel CRM, calendar, email, or carrier back office. Prepare work for existing systems. |
| Client PII and financial/health data on disk | Access, export, retention, and egress controls are product architecture, not prompt wording. |
| Near-zero disruption tolerance | Every mutation needs preview, new-output defaults, undo, and visible verification. |
| No IT/MSP | Recovery and plain-language evidence are first-class office functions. |
| Regulated communications | Every externally usable artifact needs source, preparer, version, review status, and final human action. |
| Incomplete inputs are normal | Skills must produce a useful partial result and label missing facts; they must not invent them. |

The four-role framing in `docs/from-claude/2026-09-12-fin-skills-and-extensions-roadmap.md` is directionally right, but “Fin is the four missing staff” overstates authority. A safer product thesis is:

> **Fin prepares the work of four missing staff; the advisor retains every professional, approval, and external-action decision.**

That sentence defines both the value and the limit.

### External task validation

The proposed work is not inferred only from project prose:

- O*NET lists personal-financial-advisor work including interviewing clients, analyzing financial information, keeping plans current, preparing or interpreting reports/summaries/projections, contacting clients, and administrative paperwork. It also reports daily email for 92% of respondents and “extremely important” accuracy for 65%.[W1]
- O*NET lists executive-assistant work including schedule management, correspondence, reports, financial documents, records, regulatory documentation, mail, meeting records, and coordination; 97% report daily email and 53% report accuracy as extremely important.[W2]
- O*NET lists marketing-specialist work including translating findings into written reports, customer/market research, competitor analysis, trend monitoring, and effectiveness measurement.[W3]

These support Fin as a preparation, organization, documentation, and drafting system. They do **not** support giving Fin autonomous professional judgment.

---

## 2. Current Fin baseline and gaps

### What exists now

**Skills:** `email`, `marketing`, `notebook`, `printer`, `save-this-session`, `voice`.

**Extensions:** `spplus-guardrails`, `spplus-notebook`, `spplus-opening`, `spplus-organize`, `spplus-session-meter`, `spplus-workspace`.

**Observed strengths**

- `email` correctly drafts but does not send.
- `marketing` correctly labels output as a draft and avoids inventing claims, numbers, approvals, and disclosure language.
- `voice` makes drafts useful to the advisor instead of generically polished.
- `notebook` and `save-this-session` address continuity.
- `spplus-organize` mechanically blocks content reads during name-only organizing.
- `spplus-workspace` confines Pi `write`/`edit` calls to `Documents/Fin`.
- `spplus-guardrails` has grown from a dramatic-command denylist into a meaningful accident/persistence floor, informed by real red-team failures.

**Observed gaps**

1. Administration has no end-to-end skill.
2. Advisory support has no skill.
3. Follow-ups are stored but not reliably surfaced.
4. Client-document reading/egress policy is acknowledged but not implemented.
5. Indirect prompt injection remains unresolved in DN-31.
6. The current extensions gate model tool calls, but Fin still needs the separate identity and typed broker accepted in DN-31 Amendment A1/A2.
7. `spplus-workspace` gates Pi `write` and `edit`, while useful filing necessarily mutates files outside `Documents/Fin`; the product needs a typed file-operation broker rather than more shell regexes.
8. Current notebook PII checks are useful hygiene but heuristic. They cannot establish anonymization or safely classify general client content.
9. There is no artifact lifecycle: draft → advisor-reviewed → compliance-submitted/approved → used/retired.
10. There is no canonical task/case ledger on which an opening-page tickler can depend.

### Regulatory/product implications

- FINRA Rule 2210 requires principal approval for many retail communications, records including communication/approval/source information, and fair, balanced, non-misleading content.[R2]
- The FTC Safeguards Rule guidance calls for data inventory, encryption, MFA, app assessment, secure disposal, staff training, and service-provider monitoring.[R3]
- The SEC’s Regulation S-P amendments add incident-response, customer-notification, service-provider, and recordkeeping obligations for covered institutions; scope depends on the practice’s registrations and business.[R1]

Fin must therefore produce **reviewable evidence and drafts**, never claim that it performed compliance or made a practice compliant.

---

## 3. Decision rule: skill, extension, or system service

The existing roadmap uses a good two-way distinction but needs a third class.

| Class | Purpose | Example | Trust level |
|---|---|---|---|
| **Skill** | Teaches Fin how to perform a bounded job | Turn notes into a follow-up draft | Advisory behavior; may be ignored or misapplied |
| **Extension** | Adds UI, orchestration, tool shaping, and local policy feedback | Show due items on opening; require artifact status before export | Useful enforcement inside Fin, but not a hostile-process boundary |
| **System service/broker** | Enforces identity, file, privilege, network, parser, and audit boundaries outside Fin | Read approved file handle; restart allowlisted printer service | Security boundary owned by the OS |

Use this test:

1. **Is it craft, sequence, tone, or role judgment?** Skill.
2. **Must it happen on every Fin path, but compromise of Fin is not the threat?** Extension.
3. **Would bypass expose client data, corrupt records, alter the machine, or create an unapproved external action?** External system service/broker.

OWASP explicitly describes indirect prompt injection through files and websites and recommends least privilege, code-enforced functions, filtering, and human approval for high-risk actions.[S2] That supports DN-31 A1/A2 and means no in-process TypeScript extension should be called the PII or egress security boundary.

---

## 4. Required cross-cutting architecture

These are prerequisites, not optional polish.

### P0 — before client-document or advisory work

#### X0. `fin-identity` + `spplus-capability-broker` — **system boundary**

Run Fin as its own unprivileged identity. Expose named operations, never `execute(command)`:

- inspect system health;
- restart an allowlisted service;
- query/add/test a printer through a bounded operation;
- list filenames/metadata in an advisor-selected folder;
- copy/move with no-clobber and transaction receipt;
- open an advisor-approved file for a named purpose;
- render/transform a document into a new output;
- query or update the task ledger.

Each call records actor, operation, parameters represented safely, result, time, input/output hashes, and advisor authorization where required. This is already accepted in DN-31 Amendment A1/A2 and should not be re-litigated as another regex extension.

#### X1. `spplus-data-boundary` — **system boundary with extension UI**

Replace the proposed detector-only `spplus-pii-shield` with a capability-based design:

- Fin receives opaque file IDs and safe metadata by default, not arbitrary paths.
- A local classifier treats filenames as potentially sensitive.
- Protected stores start from locations/applications, not extensions: browser profiles, mail, password vaults, share credentials, CRM exports, Downloads/Desktop/Documents, mounted shares.
- Content access is purpose- and file-specific, time-bounded, visible, and revocable.
- Local deterministic tools may process an approved file without automatically placing raw content in the cloud-model context.
- The outbound gateway independently inspects/blocks payloads and destinations.
- No “consent means responsibility transferred” language; DN-31 Amendment A3 correctly withdrew it.

**Required product decision:** either (A) client data never leaves, as the system prompt says, or (B) explicit transmission can occur under a legally reviewed policy. The same build cannot truthfully promise both.

#### X2. `spplus-untrusted-content` — **system boundary + tool protocol**

Documents, OCR, email, web pages, filenames, and metadata are data, never instructions.

Controls:

- parse documents in a sandboxed worker with no network, no credentials, no home-directory access, CPU/memory/time limits, and read-only input;
- return a typed representation with source coordinates;
- label all extracted text as untrusted;
- prevent untrusted text from selecting tools or changing permissions;
- require advisor confirmation for high-impact actions based on document content;
- keep retrieval context separate from policy/system instructions;
- test with hidden text, white-on-white PDF text, image instructions, spreadsheet comments, hyperlinks, and malformed archives.

There is no foolproof prompt-injection detector; containment and least authority are the control.[S2]

#### X3. `spplus-document-transaction` — **broker + extension**

Every document mutation follows:

`inspect → plan → preview/diff → write new file → validate → advisor accepts → optional replacement`

Requirements:

- originals are immutable to Fin by default;
- outputs receive unique names, never silent overwrite;
- input/output hashes and renderer/parser versions are recorded;
- macro, signature, encryption, tracked-change, external-link, and unsupported-feature status is explicit;
- cancellation and partial failure leave no plausible-looking half-output;
- validation reopens the saved artifact independently.

This is more important than supporting many formats.

#### X4. `spplus-publication-workflow` — **system/extension boundary**

Do not merely append a disclaimer block to every artifact. That can alter layouts and still does not prove review. Instead maintain an artifact manifest:

- intended audience: internal / one client or household / public;
- preparer and model;
- source list and hashes;
- factual assumptions and unresolved blanks;
- status: draft / advisor reviewed / submitted for firm review / approved / used / retired;
- required review route selected by the practice;
- version actually approved and version actually used.

Fin may create **draft**. Only the advisor can mark advisor-reviewed. Fin cannot mark firm/compliance-approved. Fin cannot publish or send.

#### X5. `spplus-provenance-ledger` — **system boundary**

Append-only, locally readable receipts for:

- protected-file access;
- brokered mutation;
- document transformation;
- export;
- attempted/blocked network egress;
- artifact review-status changes;
- task creation/completion.

The ledger is evidence of events, not a “compliance report.” It needs rotation, backup, tamper evidence, privacy minimization, and retention policy.

### P1 — needed for credible office staffing

#### X6. `spplus-task-ledger` + opening-page tickler

One typed local store for commitments, not free-form notebook pages. Fields:

- neutral case alias, task, owner, due date/time zone, source, status, next action, dependency, last touched, completion evidence;
- no SSN/account/policy numbers;
- client names only if Christopher explicitly chooses that storage policy.

The opening page shows overdue, due today, waiting, and unscheduled commitments. The advisor can snooze, complete, correct, or open the source. Fin cannot silently close a task.

#### X7. `spplus-template-registry`

Versioned, practice-owned templates and approved language:

- firm identity/contact blocks;
- approved disclosures supplied by the firm;
- letter/email structures;
- meeting agendas;
- fact-finder fields;
- communication review checklist;
- event kit layouts.

Fin selects and fills; it does not invent disclosure text. Template provenance and version flow into X4.

#### X8. `spplus-source-policy`

The current roadmap’s editorial allowlist is too blunt. Split source use into:

- **practice-approved authoritative sources** for externally usable facts;
- **primary sources** such as regulator, agency, carrier-filed, or issuer documents;
- **discovery sources** usable only to find a primary source;
- **blocked sources/data paths**.

Record exact URL, title, publication/update date, retrieval date, and quotation/extract. A political-bias blacklist is not a durable substitute for source type, provenance, and claim-level verification.

### P2 — useful after the office core works

#### X9. `spplus-cost-meter`

Show estimated session/month cost in dollars with provider/model, uncertainty, and budget threshold. Valuable, but not a prerequisite to regulated work.

#### X10. `spplus-connector-gateway`

Later, if the product deliberately supports mail/calendar/CRM connectors:

- separate scoped credentials;
- read/draft-only APIs first;
- no send, invite, submit, delete, or recommendation writes;
- allowlisted fields and accounts;
- visible standing grants with purpose and expiry;
- broker-owned tokens unavailable to model/bash;
- complete receipt trail.

Do not build browser automation for carrier portals. Do not put raw connector tokens in Fin’s process.

---

## 5. Skills catalogue by office position

Priority meanings:

- **P0:** necessary for the first credible “office staff” release.
- **P1:** completes the role after the boundary exists.
- **P2:** strong value but not load-bearing.
- **P3:** defer until field demand proves it.

Authority meanings:

- **Prepare:** create a draft/checklist/packet locally.
- **Propose:** offer changes; advisor chooses.
- **Never:** action Fin must not take.

### 5.1 Administration and operations

| Skill | Actual office job | Output | Authority | Dependency | P |
|---|---|---|---|---|---|
| `intake` | Turn a mixed incoming folder into a work queue | Name-only inventory, duplicates, likely type, unclear items, proposed destinations | Propose; never open in name-only mode | X0, X3 | **P0** |
| `filing` | Apply the practice’s naming/folder convention | Transaction preview and no-clobber moves with receipt | Propose; advisor approves batch | X0, X3 | **P0** |
| `paperwork` | Merge, split, rotate, compress, OCR, flatten, stamp, and extract PDF pages | New validated PDF; source preserved | Prepare; never overwrite source | X1–X3 | **P0** |
| `not-in-good-order` | Catch missing pages, blanks, signatures/dates, inconsistent obvious fields before submission | Exception list with page/field references | Prepare; never assert carrier acceptance | X1–X3, template/checklist | **P0** |
| `find-it` | Locate a case document without path vocabulary | Ranked local results; metadata first, content only under approved access | Read/propose | X1, X5 | **P1** |
| `case-checklist` | Track what a case still needs | Local checklist with due/waiting state | Prepare/propose | X6 | **P1** |
| `case-status-summary` | Convert case notes/receipts into a status update | Internal summary and optional draft message | Prepare | X6, `email` | **P1** |
| `scan-and-name` | Turn paper into a straight, searchable, correctly named PDF | OCR PDF + quality report + proposed filing | Prepare/propose | X2, X3; image-bundled OCR | **P1** |
| `records-retention` | Identify records eligible for archive/destruction under practice policy | Candidate report, policy citation, holds/conflicts | Propose only; never delete | X3, X5, firm policy | **P1** |
| `security-evidence` | Generate and explain the machine evidence report | System-produced report + plain-language explanation | Prepare; never claim compliance | system evidence service | **P1** |
| `licensing-and-ce` | Keep appointment/license/CE renewal dates visible | Non-transactional renewal tracker | Prepare/propose | X6; advisor-supplied facts | **P2** |
| `expenses` | Turn receipts/export into a categorized review sheet | Spreadsheet with source links and uncertain categories | Prepare; never file taxes | X1–X3 | **P3** |

**Design note:** `filing` cannot be implemented honestly by letting bash roam through the home folder while `spplus-workspace` claims confinement. It should use broker operations such as `list_names`, `plan_moves`, and `commit_moves(no_clobber=true)`.

### 5.2 Executive assistant and client service

| Skill | Actual office job | Output | Authority | Dependency | P |
|---|---|---|---|---|---|
| `after-the-meeting` | Turn rough notes into follow-up work while context is fresh | Factual recap, decisions, tasks/dates, missing items, email draft | Prepare; advisor confirms facts and sends | X1, X4, X6, `email` | **P0** |
| `follow-ups` | Maintain the tickler and surface what is owed | Due/waiting/overdue view and draft nudges | Propose; never close silently or send | X6 | **P0** |
| `meeting-prep` | Put the right facts/questions in front of the advisor | One-page internal brief with source citations and unknowns | Prepare; no recommendation | X1–X3 | **P1** |
| `inbox-triage` | Sort work that arrived and identify needed responses | Local triage list + draft replies | Prepare; never send/delete/archive remotely | X1, X10 if connected | **P1** |
| `schedule-brief` | Resolve scheduling details without owning the calendar | Proposed times, time-zone check, local `.ics`, draft message | Prepare; never invite or mutate calendar | X6 | **P1** |
| `correspondence` | Draft routine carrier/client/team messages | Draft in advisor voice with blanks for missing facts | Prepare | existing `email`, `voice` | **P1** |
| `my-day` | Give one short operational view | Meetings, due items, waiting items, unfiled intake, priority proposal | Propose priorities; advisor decides | X6 + mature inputs | **P2** |
| `crm-update-sheet` | Prepare clean notes/fields for the practice CRM | Human-review worksheet ready to paste/import | Prepare; never write CRM initially | X1, X4 | **P2** |
| `delegation-brief` | Turn a request into a complete assignment for staff/vendor | Outcome, owner, deadline, inputs, definition of done | Prepare | X6 | **P2** |
| `travel-and-event-logistics` | Assemble seminar/conference logistics | Itinerary/checklist, local calendar file, contact blanks | Prepare; never book/purchase | X6 | **P3** |

`after-the-meeting` is the best single skill in the catalogue because it captures value at the point where memory, service quality, documentation, and workload all collide.

### 5.3 Marketing and communications

| Skill | Actual marketing job | Output | Authority | Dependency | P |
|---|---|---|---|---|---|
| `communication-review` | First-pass review before firm/compliance review | Claim/source/disclosure/version exception report; never “approved” | Prepare only | X4, X7, X8 | **P0** |
| `one-pager` | Produce flyer, invitation, handout, or client sheet | PDF draft + source/review manifest | Prepare | existing `marketing`, X4 | **P0** |
| `campaign-brief` | Define audience, problem, message, offer, channel, and one action | One-page internal brief | Prepare/propose | `voice` | **P1** |
| `seminar-kit` | Produce the common advisor event package | Invitation, reply card, sign-in sheet, deck, follow-up sequence | Prepare; never publish/send | X4, X7, X8 | **P1** |
| `newsletter` | Maintain a repeatable client letter | Draft with claim-level primary sources and review package | Prepare | X4, X7, X8 | **P1** |
| `content-calendar` | Make marketing a habit instead of a one-off | 4–12 week topic/channel/status calendar | Propose | X6, campaign brief | **P1** |
| `client-education` | Explain one concept without turning it into personalized advice | Concept sheet or short article, sources attached | Prepare; no recommendation | X4, X8 | **P1** |
| `social-batch` | Draft a week/month of posts efficiently | Channel-specific drafts, alt text, source pack | Prepare; never publish | X4, X8; social project handoff | **P2** |
| `referral-follow-up` | Prepare respectful referral/COI outreach | Draft sequence in advisor voice | Prepare; never send | `email`, X4 | **P2** |
| `campaign-results` | Measure what worked | Local summary of advisor-supplied/exported metrics | Analyze/prepare; no credentialed scraping | X1–X3 | **P2** |
| `recruiting` | Draft agent/staff recruiting material for principals | Draft message/one-pager | Prepare | X4, X7 | **P3** |

**Correction to the current marketing skill:** rules differ by practice type, affiliation, jurisdiction, product, audience, and firm procedure. Fin should not state that every item “typically” requires the same approval route. X4 should ask the practice to configure its real review route, while preserving the universal rule that Fin itself never approves.

### 5.4 Advisory and paraplanning support

These skills have the highest upside and sharpest liability. They prepare facts, calculations, questions, and drafts. They do not select products or make recommendations.

| Skill | Actual paraplanner/advisor-support job | Output | Authority | Dependency | P |
|---|---|---|---|---|---|
| `fact-finder` | Build the client picture from incomplete information | Structured facts, source locations, unknowns, conflicts | Prepare; advisor validates | X1–X3 | **P1** |
| `plan-inputs` | Extract data needed by the advisor’s approved planning system | Review sheet mapped to destination fields | Prepare; never import/write initially | X1–X3, templates | **P1** |
| `data-discrepancies` | Catch conflicting values and stale dates | Exception report with both sources; no silent resolution | Prepare | X1–X3 | **P1** |
| `explain-this` | Translate a statement, illustration, policy, or report | Plain-language annotated explanation with page citations | Prepare; no recommendation | X1–X4 | **P1** |
| `review-prep` | Prepare for an annual/policy/plan review | Change summary, open questions, expiring/stale facts, agenda | Prepare | X1–X3, X6 | **P1** |
| `income-sketch` | Make a simple retirement-income conversation sheet | Guaranteed income surface; assumptions separately labelled | Prepare/propose; not a plan | X3, X4, approved calculator | **P1** |
| `meeting-summary` | Create the factual client-facing recap | Decisions made by advisor/client, actions, owners, dates | Prepare; advisor confirms | X4, X6 | **P1** |
| `policy-review` | Compare current policy/illustration to prior or expected state | Factual change/exception report with page citations | Prepare; no keep/replace advice | X1–X4 | **P2** |
| `annuity-compare` | Compare guaranteed contractual values | Side-by-side guaranteed values, definitions, source pages | Prepare; no ranking/recommendation | X1–X4, deterministic calculator | **P2** |
| `scenario-compare` | Show effects of advisor-selected assumptions | Reproducible scenarios with assumptions/sensitivities | Prepare; no “best” scenario | X3, X4, approved calculator | **P2** |
| `suitability-evidence` | Check whether required firm facts/evidence are present | Missing/ambiguous-evidence checklist with citations | Prepare; never determine suitability | X1–X4, firm checklist | **P2** |
| `concept-sheet` | Teach one concept separately from personal planning | Clean educational surface, no client assets/income mixed in | Prepare | X4, X7, X8 | **P2** |
| `insurance-needs-worksheet` | Reproduce advisor-selected inputs and arithmetic | Deterministic worksheet with every assumption visible | Prepare; no product recommendation | X3, X4, approved formula | **P3** |

**Hard language boundary:** name the skill `suitability-evidence`, not `suitability-review`. It checks the record; it does not make the professional determination.

---

## 6. What should never be a Fin skill

Do not build:

1. **Email sending, social publishing, calendar invitations, e-signature submission, carrier-portal submission, trades, money movement, or purchases.** Fin prepares; the advisor takes the external action.
2. **Compliance approval.** Fin may flag and package. It never labels an artifact compliant or approved.
3. **Suitability, best-interest, fiduciary, tax, or legal conclusions.** Fin identifies facts, gaps, and calculations for the professional.
4. **A second CRM or client master record.** It creates drift, retention problems, and another breach surface.
5. **Browser automation of carrier portals.** It combines credentials, fragile selectors, and irreversible regulated submissions.
6. **A client-facing chatbot.** Fin serves the advisor; it is not an unsupervised representative of the practice.
7. **Model-authored financial math.** Calculations belong in tested deterministic libraries with displayed formulas/assumptions.
8. **Model-authored disclosure language.** Use exact practice/firm-approved templates.
9. **Automatic deletion or retention enforcement.** Fin identifies candidates and holds; a human executes under policy.
10. **Runtime self-install/update of skills.** Fin changes only through the SP+ image update lane.

---

## 7. Build versus adopt

### Build and own

SP+ should own the domain skill text, schemas, templates, approval language, receipts, and gates. Advisor-office workflows are too specific to inherit safely from generic coding-agent packages.

Prefer small skills that compose typed local tools over large extensions that register broad filesystem/network capabilities.

### Use mature local components behind owned wrappers

Candidates for engineering evaluation, not automatic inclusion:

- PDF: qpdf, Poppler, Ghostscript, OCRmyPDF/Tesseract, LibreOffice headless conversion;
- Office: LibreOffice UNO/headless plus independent reopen/render validation;
- metadata/hash: ExifTool and standard cryptographic tools;
- OCR/image: sandboxed Tesseract/ImageMagick where licensing and attack surface are accepted;
- deterministic calculations: an SP+-owned tested library with golden fixtures, not model arithmetic.

Every parser operates in the X2 sandbox. “Local” does not mean “safe”; document parsers process attacker-controlled files.

### Third-party Pi packages

The 2026-08-27 Bee research found two promising guarded document extensions, `@firstpick/pi-extension-workbook` and `@firstpick/pi-extension-docx`, but both shared a dominant single maintainer and required additional runtime/toolchain commitments. It found no mature privacy-safe Pi-native PDF package. Those findings still support **evaluation/fork/reference**, not an appliance support promise.

Do not bundle broad web, Google, hosted-transcription, universal-file, or arbitrary-MCP packages into regulated mode. Their capability surface defeats least privilege even when individual features are convenient.

---

## 8. Recommended sequence

### Wave 0 — settle truth and authority

1. Decide the privacy statement: strict no-client-data egress, or a legally reviewed explicit-transmission model.
2. Implement DN-31 A1/A2: separate Fin identity and typed privileged broker.
3. Build X1 data boundary, X2 untrusted-content sandbox, X3 transactions, X5 receipts.
4. Make current in-process guardrails defense-in-depth rather than the claimed boundary.

**Exit test:** a malicious PDF, filename, and web page cannot obtain a new permission, choose a privileged operation, read an unapproved file, transmit protected content, or create persistence.

### Wave 1 — the useful office

Build:

- `after-the-meeting`;
- `follow-ups` + X6 tickler;
- `filing`;
- `paperwork`;
- `not-in-good-order`;
- `communication-review` + X4 publication workflow.

**Why this wave:** highest recurring time saved, visible outputs, limited need for autonomous judgment, and one coherent end-to-end workflow.

### Wave 2 — client service and review preparation

Build:

- `meeting-prep`;
- `find-it`;
- `case-checklist` and `case-status-summary`;
- `fact-finder`;
- `plan-inputs` and `data-discrepancies`;
- `explain-this`;
- `review-prep`;
- `security-evidence`.

### Wave 3 — repeatable marketing

Build:

- X7 template registry and X8 source policy;
- `campaign-brief`;
- `seminar-kit`;
- `newsletter`;
- `content-calendar`;
- `client-education`;
- `social-batch` handoff to SecureProspective Social.

### Wave 4 — deterministic planning surfaces

Only after the first three waves have field evidence:

- `income-sketch`;
- `policy-review`;
- `annuity-compare`;
- `scenario-compare`;
- `suitability-evidence`.

These require approved formulas, representative test corpora, professional review, and hard output boundaries.

---

## 9. Acceptance standard

A skill is not done when `SKILL.md` exists. It is done when a target-ICP user completes the job on a booted SP+ machine.

### Every skill

- starts from advisor language and incomplete inputs;
- states what it will produce and what it will not do;
- produces a useful partial output without inventing missing facts;
- uses existing notebook/voice information without re-asking;
- never requires paths, commands, package names, or Linux vocabulary;
- saves only through approved typed operations;
- gives one clear next action;
- is tested with ordinary, incomplete, conflicting, and malicious inputs.

### Every document workflow

- source remains unchanged;
- output receives a unique name;
- saved output is reopened and validated independently;
- every extracted fact links to page/sheet/cell where possible;
- OCR and ambiguous values are labelled;
- active content, signatures, encryption, external links, and lossy conversion are detected or refused;
- interruption leaves neither corruption nor a plausible false-success artifact.

### Every client/public artifact

- has intended audience, preparer/model, sources, assumptions, unresolved blanks, version, and review status;
- cannot be marked firm-approved by Fin;
- cannot be sent or published by Fin;
- preserves the exact approved version and the actual-used version;
- never claims compliance.

### Every extension/system boundary

- has positive, negative, bypass, and mutation tests;
- fails closed without UI/authorization;
- is tested against alternate tools and shell paths, symlinks, archives, malformed documents, prompt injection, process crash, reboot, rollback, and clock/time-zone changes as relevant;
- emits a plain-language receipt;
- reaches the system only through the image update lane.

### Pilot success metrics

For a 30-day advisor pilot, measure:

- minutes from meeting end to complete follow-up packet;
- percentage of due follow-ups surfaced and closed on time;
- NIGO defects caught before submission;
- time to find a named document;
- number of originals overwritten or outputs falsely reported successful (**target: zero**);
- protected-content egress attempts allowed without policy (**target: zero**);
- public/client drafts with complete review package (**target: 100%**);
- corrections per draft and percentage accepted after one revision;
- total support time, preserving the product-definition target of under one hour over 30 days.

Do not use “number of skills shipped” or “tokens consumed” as product success measures.

---

## 10. Final priority call

If SP+ funds only ten things, fund these in order:

1. Separate Fin identity and typed capability broker.
2. Data-access plus independent egress boundary; settle the privacy promise.
3. Sandboxed untrusted-document pipeline.
4. Transactional document/output service.
5. Provenance and artifact-review ledger.
6. `after-the-meeting`.
7. Task ledger + `follow-ups` opening tickler.
8. `paperwork`.
9. `filing`.
10. `not-in-good-order` + `communication-review` as the two quality gates around office output.

This gives Fin the shape of office staff without pretending it has the authority of the advisor, principal, compliance officer, carrier, custodian, or client.

---

## Sources

### Project sources

- `docs/01-PRODUCT-DEFINITION.md`
- `config/fin-system-prompt.md`
- `config/fin-skills/*/SKILL.md`
- `config/fin-extensions/*.ts`
- `config/fin-pi-config/web-search.json`
- `docs/ledger/DN-31-fin-help-layer.md`, including Amendment 1
- `docs/ledger/DN-32-MAKE-MY-COMPUTER-BETTER.md`
- `docs/from-claude/2026-09-12-fin-skills-and-extensions-roadmap.md`
- `work/sp-plus/bee/REPORT-pi-skills-extensions.md` (outside the code repo)

### Work and role sources

- **[W1]** O*NET OnLine, Personal Financial Advisors, tasks and work context: https://www.onetonline.org/link/summary/13-2052.00
- **[W2]** O*NET OnLine, Executive Secretaries and Executive Administrative Assistants: https://www.onetonline.org/link/summary/43-6011.00
- **[W3]** O*NET OnLine, Market Research Analysts and Marketing Specialists: https://www.onetonline.org/link/summary/13-1161.00

### Regulatory sources

- **[R1]** SEC, *Enhancements to Regulation S-P: A Small Entity Compliance Guide*: https://www.sec.gov/files/rules/final/2024/regulation-s-p-small-entity-compliance-guide.pdf
- **[R2]** FINRA Rule 2210, Communications with the Public: https://www.finra.org/rules-guidance/rulebooks/finra-rules/2210
- **[R3]** FTC, *Safeguards Rule: What Your Business Needs to Know*: https://www.ftc.gov/business-guidance/resources/ftc-safeguards-rule-what-your-business-needs-know

Regulatory applicability differs among insurance-only producers, broker-dealer representatives, SEC/state RIAs, and other entities. These sources justify controls, not a legal conclusion for every SP+ user.

### AI/agent risk sources

- **[S1]** NIST AI 600-1, *Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile*: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence
- **[S2]** OWASP GenAI, LLM01:2025 Prompt Injection: https://genai.owasp.org/llmrisk/llm01-prompt-injection/
