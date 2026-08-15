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

**✅ Correction, verified 2026-08-15 (supersedes the struck block below): Gmail, Calendar and Drive DO have working Claude Code tools.** They are exposed as MCP tools named `mcp__claude_ai_Gmail__*`, `mcp__claude_ai_Google_Calendar__*` and `mcp__claude_ai_Google_Drive__*`. The claude.ai Settings→Connectors OAuth grant propagated to the Claude Code surface on its own. No separate OAuth flow from inside Code was needed.

Evidence, from real tool calls in Claude's CT105 session on 2026-08-15:

- `list_calendars` returned `secureprospective@gmail.com` plus "Holidays in United States", timezone `America/Chicago`.
- `list_labels` returned INBOX 963 messages / 99 unread, SENT 164, DRAFT 1, TRASH 90.

**New risk, stated plainly: the Gmail tool surface is not draft-only.** It includes `send_message`, `reply`, `forward`, `trash_message`, `trash_thread` and `mark_message_spam`. Real send and real destructive operations are exposed, with no vendor-side guardrail standing between a tool call and a delivered or deleted message.

**Consequence for this pilot: SP's own rule in Phase 0 step 4 is now the only thing enforcing draft-only.** That step anticipated this exact case by saying SP's rule holds even if Anthropic loosens the send restriction. That contingency is now the live situation, not a hypothetical. The rule is load-bearing.

**~~Open item~~ RESOLVED 2026-08-15 — see "Enforced gates" below.** A connector gate hook (`confirm-connector.sh`) was written with per-server `PreToolUse` matchers covering all three connectors. It is now active and verified firing. **But the hook alone was not sufficient**, and the reason is worth reading before trusting any hook-based gate: the hook returns a correct `ask`, yet an `allow` entry in `permissions` silently outranks it, so the call runs unprompted anyway. The real enforcement is the layered `deny`/`ask` permission config, with the hook as a second layer. Details, including the child-session bypass that makes `ask` unreliable for automation, are in the "Enforced gates" section below.

> **Superseded 2026-08-15, kept visible as history (this claim was wrong):**
> ~~**⚠️ Correction, verified 2026-08-15: this entire phase happens in claude.ai chat, never in Claude Code.** Gmail and Calendar have no Claude Code tool at all — confirmed by searching Claude Code's own tool list directly, not a config gap. Drive has a separate Claude Code MCP integration, but it requires its own OAuth flow from inside Code and is unrelated to the claude.ai Settings→Connectors Drive connection. Every step in Phase 2 below that touches Gmail or Calendar must be run from an actual claude.ai chat window — Tom and ClaudeBox (both Claude Code) cannot execute these steps themselves. See `SESSION_HANDOFF_2026-08-15.md`'s correction section for the full implication.~~

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

## Enforced gates (added 2026-08-15)

Everything above this line describes governance as *policy* — the draft-never-send rule, no
autonomous delete, no bulk ops. As of 2026-08-15 that policy is backed by actual enforcement in
CT105's `permissions` config, not doctrine alone. This section is the ground truth for what the
harness will and will not allow.

**Denied outright (8).** These tools are removed from Claude's toolset entirely — not promptable,
not callable by mistake, not callable by a background agent. Chosen because a bypass cannot be
walked back: mail that has left the building and files shared outside the account are permanent.

`Gmail send_message` · `reply` · `forward` · `trash_message` · `trash_thread` ·
`Drive share_file` · `trash_file` · `Calendar delete_event`

**Gated on `ask` (6).** Prompt before running. Chosen because a bypass is recoverable.

`Gmail mark_message_spam` · `mark_thread_spam` · `Drive update_file` ·
`Calendar create_event` · `update_event` · `respond_to_event`

Everything else on the three connectors — all read, search, and **draft** operations — runs without
friction. The draft-only workflow this pilot specifies is fully unblocked.

### The caveat that matters most

**`ask` does not prompt in a child / auto-mode session.** This was proven, not assumed, with a
controlled probe on 2026-08-15: the same tool under the same `ask` rule prompted correctly in a
plain interactive session (and wrote nothing to disk), but in a session with
`CLAUDE_CODE_CHILD_SESSION=1` it executed with no prompt and auto-wrote an `allow` entry that then
outranked the `ask` rule sitting beside it in the same object.

The implication runs the wrong way and should not be forgotten: **the sessions that bypass the gate
are the automated, unwatched ones.** Only `deny` held in both session types. So:

- Run connector work from a plain interactive `claude` session on CT105, never a child session, if
  you are relying on an `ask` prompt to catch anything.
- Do not add a destructive tool to `ask` and consider it protected against automation. It is not.
- A `PreToolUse` hook returning `ask` (`confirm-connector.sh`) is defeated the same way. That hook
  is correct and does fire — it was unit-tested with a synthetic payload — but an `allow` entry
  overrides it. The hook was never the problem; precedence was.

### Sending mail when you actually want to

`send_message` is denied, so a legitimate send is a deliberate three-step cycle: lift the single
entry, send, restore. The restore script re-reads the file and verifies each entry landed rather
than trusting its own write. Leaving the wall down between tasks defeats the point, since every
agent on this box shares the config.

### Who edits these gates

**Christopher, not Claude.** Claude's auto-mode classifier blocks Claude from editing the
permission files — twice during setup, through two different tools — and it is right to: the edits
loosen restrictions on Claude itself. Given that the failure mode discovered here was *an `allow`
entry appearing without anyone approving it*, keeping Claude out of that file is the standing
arrangement, not a temporary inconvenience.

---

## Test log

**2026-08-15 — Phase 1 (Connect) — PASS, verified in a fresh claude.ai chat.** All three connectors returned real, specific, verifiable data, not vague/generic answers — this matters because a connector can look "connected" in Settings while actually returning hallucinated or stale content:
- **Calendar**: real event (a real client's actual name, real Google Meet link, real attendee email), correctly reported the rest of the 7-day window as empty rather than inventing filler.
- **Gmail**: real thread IDs/senders/timestamps from the actual inbox, including correctly identifying Google's own connector-confirmation security-alert emails as exactly that.
- **Drive**: real file listing, opened one document and quoted its actual first line verbatim rather than a generic description.

**Note the distinction:** this confirms the connectors work end-to-end (Phase 1), not that the 9-step staged Phase 2 sequence below has been run. Phase 2 (Drive write, Calendar write, Gmail draft, cross-tool chaining, the ambiguity probe, the export/portability drill) is still the next real gate before this is trusted for actual business use — don't skip to real work assuming Phase 1's read-only success covers it.

**Also worth noting for whoever picks this up next:** real, sensitive SP business/personal data is now flowing through this pipeline (a real client name, real church-organization data, real annuity/insurance research documents). Treat every session touching these connectors from here forward as live, not a sandbox — the governance already locked in (chat-mode only, Gmail draft-never-autonomous-send, no Cowork) applies starting now, not just once a "real" workflow is declared.

**2026-08-15 — Gate enforcement — PASS, verified live on CT105.** The connector gate was found *not*
firing: a `trash_message` call with a deliberately fake ID (`GATE_TEST_NOT_A_REAL_ID_0000000000`)
reached Google and returned a real API error rather than being blocked. Root cause was permission
precedence, not the hook (see "Enforced gates" above). Layered `deny`/`ask` config applied and
verified three ways: read back from disk, denied tools observably disappearing from Claude's
toolset the moment the file was written, and a live end-to-end exercise —
`list_labels` returned real inbox counts (963 inbox / 164 sent), then a real email was sent to
secureprospective@gmail.com (message `1a006b5214d7ebbc`) through a deliberate lift→send→restore
cycle, and Christopher confirmed receipt.

**Relationship to Phase 2:** this is *not* Phase 2. The staged 9-step sequence (Drive write,
Calendar write, Gmail draft, cross-tool chaining, ambiguity probe, export/portability drill) is
still unrun and is still the gate before real business use. What this entry establishes is only
that the safety harness underneath Phase 2 is real, so Phase 2 can be run without the standing
rules depending on good behavior alone.
