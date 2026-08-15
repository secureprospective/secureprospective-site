# SecureProspective Google Workspace Pilot — Build Map & Test Sequence

**Status:** Planned, not started. No connector has been enabled, no config touched. This doc is the map for the next working session.

**Why SP is the pilot:** SP's own market pitch is helping other businesses become AI-native. Running its own real Google Workspace workflow through ClaudeBox is dogfooding — a genuine live use case, not a synthetic test. See memory `project_google_workspace_integration_decision`.

**Governing rule:** every layer of this build (SOPs, data, credentials) must satisfy the adopted portability rule — memory `feedback_portability_rule_business_builds`. Read that before building anything here. Short version: business logic lives in this markdown, not in Claude-only automation; every data store touched needs a documented export path; credentials never live in markdown.

**Standing segregation (unchanged by this build):** ClaudeBox (head brain) owns this integration. Buzz stays walled off — never touches SP's Workspace. Tom stays out of this role — unbuilt/unvetted for it. Hermes only gets access later, to specific proven-workflow slices, not a blanket grant. See `feedback_tfm_sp_data_separation` — this is SP's own Workspace, no TFM crossover, ever.

---

## Phase 0 — Prep (before touching Settings → Connectors)

1. **Confirm the exact Google account in scope.** `secureprospective@gmail.com` is the account already used as this project's D1 admin identity — confirm with Christopher whether this is the same account SP's real day-to-day email/calendar/Drive runs on, or whether a distinct Workspace domain account is intended. Don't assume; a wrong account means testing against the wrong mailbox.
2. **Inventory current real usage** in one pass, informal: what SP email patterns exist today (client inquiries, invoices, internal notes), what's on the calendar (client calls, internal deadlines), what lives in Drive (proposals, contracts, financials). This sets what "real low-stakes workflow" actually means for SP specifically — don't guess at test content, use the real inventory to pick genuinely low-stakes items.
3. **Write the portability scaffolding first, not after.** Create `docs/google-workspace-sops/` in this repo (flat markdown, one file per workflow) before any connector is enabled. Empty is fine to start — the point is the structure exists before real SOPs get written into it, so nothing "temporary" ends up living only in a chat session.
4. **Define the boundary explicitly, in writing, before first use:** Claude may read Drive/Calendar, draft (never send) Gmail, read/write Calendar events. No autonomous send, no autonomous delete, no bulk operations without a human reviewing each one first. This mirrors what Anthropic's connector already enforces (Gmail is draft-only) but should be stated as SP's own rule too, not just inherited from the vendor's current limits — if Anthropic loosens the send restriction later, SP's own rule still holds until Christopher explicitly changes it.

## Phase 1 — Connect

5. Claude.ai or Claude Desktop (Chat tab, **not** Cowork tab) → Settings → Connectors → enable Gmail, Calendar, Drive against the confirmed SP account. OAuth grant happens here; nothing else changes.
6. Sanity-check the connection with the lowest-possible-stakes read: ask Claude to name today's date from Calendar, or list the Drive folder names at the top level. Confirms the plumbing works before any real content is touched.

## Phase 2 — Staged test sequence

Each step is pass/fail against a **named, real** item chosen in Phase 0 step 2 — not a hypothetical. Do not proceed to the next step until the current one is verified correct by Christopher, not just "looked plausible." Order goes low-risk/read-only → higher-risk/write → cross-tool chaining, matching how the actual day-to-day workload will use it.

| # | Test | What "pass" looks like | What to watch for |
|---|---|---|---|
| 1 | **Drive read** — ask Claude to summarize one real, low-sensitivity Doc. | Summary matches the source doc's actual content, no invented details. | Hallucinated specifics not in the source — the single biggest risk with document summarization. |
| 2 | **Drive write** — have Claude create/save one throwaway test file. | File appears in Drive, correct name/location/format, readable normally (not corrupted). | Wrong folder, wrong format, or a file that only renders correctly inside Claude's own view. |
| 3 | **Calendar read** — ask Claude to list this week's real events, or find open times. | Matches what's actually on the calendar, checked by Christopher against the real Calendar view side by side. | Missed recurring events, wrong timezone, silently ignoring declined/tentative events. |
| 4 | **Calendar write** — create one throwaway test event, clearly labeled as a test. | Event appears correctly (title, time, timezone) in Google Calendar itself, not just in Claude's chat confirmation. Delete it after verifying. | Wrong timezone (most common real-world connector bug), silent no-op that Claude reports as success. |
| 5 | **Gmail read/search** — ask Claude to find and summarize one real, low-sensitivity thread. | Summary accurate, correctly identifies sender/date/thread, no invented content. | Same hallucination risk as Drive read, plus mixing up multiple similar threads. |
| 6 | **Gmail draft** — ask Claude to draft a reply to a real (low-stakes) email. | Draft lands in Gmail's actual Drafts folder, correct thread, content matches intent, **not sent**. | Confirm directly in Gmail's Drafts, not just Claude's chat — this is the step most worth double-checking since a false "it's just a draft" belief is exactly what would make later real usage risky. |
| 7 | **Cross-tool chained workflow** — one realistic day-to-day task spanning two+ connectors, e.g. "find [specific real thread], check the calendar for open times next week, draft a reply proposing three of them." | Every sub-step correct independently (per steps 3/5/6 above) AND the final draft correctly reflects all of them together. | This is where compounding errors show up — each step can look right in isolation while the combination is wrong (e.g., proposing times that are technically open but violate an unstated real constraint). |
| 8 | **Deliberate ambiguity probe** — give Claude a prompt with a real gap (e.g., an email that could reasonably go to two different people, or a scheduling request with a missing constraint). | Claude asks a clarifying question instead of guessing on real business data. | Silent confident guessing on ambiguous real-world input is the actual production failure mode this step is built to catch before it happens for real. |
| 9 | **Export/portability drill** (the "process must remain" requirement — memory `feedback_portability_rule_business_builds`). Actually export a sample of Drive content (Google Takeout or API), a sample of Calendar (iCal export), and Gmail (mbox export). Open each outside Google and confirm it's genuinely readable/restorable. | Exports succeed, open cleanly in a non-Google tool, content matches. | An export path that exists in theory but was never actually run — that's the exact failure mode the rule was written to prevent. |

## Phase 3 — Sign-off and go-live

10. Christopher reviews all nine results together, explicitly signs off before any *real* (non-test) task runs through the connectors.
11. Log the pass/fail table's outcome in this doc (append below, don't overwrite) so there's a record of what was actually verified and when — not just an unqualified "it works."
12. Schedule the export/portability drill (step 9) as a recurring task, not a one-time check — owner and cadence decided at sign-off, per the rule's "process must remain" requirement.

## Explicit non-goals for this pilot

- No Cowork. No autonomous scheduled tasks. No plugin marketplace.
- No Hermes or Tom access to these connectors in this phase.
- No bulk operations (mass email drafting, mass calendar changes) until the staged sequence above has passed on real single-item cases first.
- No expansion to a second business (TFM or otherwise) until SP's pilot has run long enough to surface real problems, per the original point of picking a pilot at all.

---

## Test log

*(Append results here as each phase-2 step is actually run — date, step #, pass/fail, notes. Empty until the pilot begins.)*
