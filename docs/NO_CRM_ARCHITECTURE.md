# SecureProspective — "Never Need a CRM" Architecture & Panel Findings

**Status:** Research/decision document. Nothing built yet. This is the map for what's realistically possible *today*, per Christopher's framing: perfect the today-layer before reaching for the bleeding edge, and expect to edit this mid-stream rather than treat it as final.

**Governing rule:** `feedback_portability_rule_business_builds` (adopted 2026-08-15) — business logic in portable markdown, every data store needs a documented export path, credentials carved out separately.

**How this was produced:** a four-model expert panel (DeepSeek V4 Flash-thinking, Nemotron 3 Ultra, Gemini 3.6 Flash, MiMo V2.5 — four distinct vendors, dispatched independently via `opencode run` on Beelink, no shared context between them), explicitly instructed not to be agreeable and to actively find flaws. Full raw transcripts: `/root/.claude/plans/this-session-is-a-smooth-piglet.md` session history (2026-08-15). This doc is the synthesis, not a vote — convergence across independently-run models is treated as real corroboration only where the *reasoning*, not just the conclusion, matches (`lesson_panel_convergence_not_corroboration`).

---

## ⚠️ The one finding you need to weigh before anything else

Christopher's stated decision (this session): no CRM, full stop, both business lines, no carve-out — the IMO producer/compliance side included.

**All four panelists, independently and unprompted, disagreed with including the IMO side.** Not "raised a concern" — direct pushback, using words like "wrong," "naive," "ideological purity masquerading as pragmatism," and "malpractice territory." This is the strongest, most unanimous disagreement any panel has returned on this project. Their reasoning converges on the same three points:

1. **Regulatory retention and audit-trail requirements are not optional software features.** State DOI (Department of Insurance) audits and market-conduct exams can demand complete, timestamped, producer-attributed communication records on demand — commonly a 3–7 year retention window (NAIC model regs, varies by state). D1 has **no built-in audit trail** — anyone with write access can alter or delete a row with no trace, unless one is deliberately engineered. Google Workspace's free tier doesn't give you enforced retention either (that's Vault/admin-console territory, paid).
2. **E&O (errors and omissions) exposure is about proving process, not storing files.** When a complaint or claim arrives, what matters is a documented, defensible chain: what was recommended, what was disclosed, that suitability review happened. Freeform Sheets/Drive/markdown "permits" this structure but doesn't enforce or prove it. A CRM at least forces the skeleton; your stack as currently scoped doesn't.
3. **Commission/chargeback math is a deterministic, high-stakes calculation, not a Claude-judgment task.** 8 producers × carrier-specific statement formats × chargeback windows × vesting schedules. A formula error or a missed entry is real cash — overpay or underpay, either one damages the business (E&O exposure or producer trust). This needs a rigid, tested, deterministic engine, not natural-language-assisted spreadsheet math.

**What this does NOT mean:** it doesn't mean "buy Salesforce for the IMO." Every panelist was explicit that the CRM-vendor pitch of "you need our AI" is weak — Claude will likely outperform a CRM's built-in AI at this scale. What they converged on is narrower: **the IMO side needs a genuinely engineered compliance/audit spine (append-only D1 event log + configured retention + tested exports + deterministic commission calculation) before "no CRM" can honestly be claimed as met there — and that spine is real, budgeted engineering work, not a free byproduct of the portability rule.** One panelist (DeepSeek) framed the acceptable version as a carve-*in*, not a carve-*out*: keep the no-CRM mandate on the IMO side, but require the compliance spine to exist and be tested before considering the mandate satisfied, rather than exempting the IMO side from the discipline entirely.

**This is a decision for you to make, not one I'm making for you.** The consulting-side no-CRM plan below has strong, converged support with no comparable pushback. The IMO piece is where the panel says the stakes and the current plan don't yet match. Worth an explicit answer before build starts on that half of the business.

### What "a real engineered compliance/audit spine" concretely means (2026-08-15, answering Christopher's follow-up)

Not a vague aspiration — eight concrete, buildable pieces, all on infrastructure already in this stack (D1, R2, Workers), no CRM SaaS required:

1. **Append-only event log.** Every business-relevant action (communication logged, document sent/received, recommendation made, disclosure delivered, stage change) is written as an immutable row: who, what, when, before-state, after-state. Rows are never `UPDATE`d or `DELETE`d — a correction is a *new* event that references the one it corrects, so the history itself is never rewritten.
2. **Tamper-evidence.** Buildable today without a paid vendor: hash-chain each event (each row's hash includes the previous row's hash, so any retroactive edit breaks the chain, detectable on read). Periodically anchor the chain's current hash somewhere outside Cloudflare's own control (a signed digest written to R2 and/or Drive on a schedule) so it isn't just "trust Cloudflare's word for it."
3. **Retention configuration.** Explicit, documented retention windows, automated so nothing purges before the window closes. This has a real non-engineering dependency: **the actual retention period and required document types are a state insurance-regulation question, not an engineering one** — that's a fact to gather (you likely already know it from running the IMO, or it's a quick lookup), not something I should assume or that the panel could responsibly guess at.
4. **Access control / producer isolation.** Enforced at the D1/Worker layer, not Google folder permissions (which get messy at scale, per one panelist's specific point) — producer A's book stays invisible to producer B, tested, not just configured and trusted.
5. **Chain of custody for documents.** Signed disclosures, policy PDFs, applications live in R2 (versioned object storage), each one's hash chained into the same event log as step 2 — so you can prove a document wasn't swapped after the fact, not just that a file with that name exists.
6. **A deterministic commission ledger**, separate table from the general activity log, same append-only/immutable discipline — carrier, policy, rate, payout status, chargeback window — with a reconciliation check that flags math that doesn't add up rather than silently trusting manual entries.
7. **Tested export/restore**, not theoretical. The same "process must remain" discipline already locked into the portability rule ([[feedback_portability_rule_business_builds]]) applies here directly: actually run the export, actually restore it somewhere independent, actually confirm it answers a regulator-shaped question, on a schedule — not "it should work."
8. **A real, pre-built answer to "produce all records for Producer X, Client Y, dates A–B"** as an actual runnable, tested query — built and dry-run before it's ever needed for real, not improvised under audit pressure.

None of this requires a CRM. All of it requires deliberate engineering time that doesn't happen by accident — it's the price of the carve-in, not a reason to abandon it.

---

## A. What a CRM actually does — functional breakdown, converged across all four panelists

| Function | Replaceable today? | Reality |
|---|---|---|
| **Contact/account records** | Yes | D1 (or Sheets at this scale) works fine structurally. Gap: no dedup, no auto-enrichment, no relational integrity unless D1 enforces it — data quality is a discipline, not a feature you get for free. |
| **Pipeline/deal-stage tracking** | Yes, with a caveat | Simple state (lead→proposal→closed) is trivial in D1/Sheets. Gap: no automatic stage progression, no "stuck deal" alerts, and critically — **no stage-history log unless built from day one** (append-only, not in-place updates). Retrofitting history later is painful. |
| **Task/follow-up reminders** | Partially | Calendar connector makes scheduling easy when Claude is actively asked. Gap: **Claude is passive — nothing fires on its own without a Cloudflare Cron Worker.** A "show me everything gone quiet for 14 days" report needs a scheduled build, not a default. |
| **Email-thread linkage** | Weak/brittle | Gmail connector gives read/search, not structural auto-filing. Forwarding and secondary addresses break naive matching. **This is one of the two hardest pieces to get right** — treat it as its own build, not a byproduct of having the connector. |
| **Reporting/dashboards** | Yes, with engineering | D1 SQL / Sheets pivot + a Claude-written weekly summary is realistic, and arguably better than a canned CRM dashboard at this size. Gap: point-in-time historical snapshots need explicit snapshot tables — raw current-state data can't answer "what did the pipeline look like a year ago." |
| **Compliance recordkeeping** | **No, not as currently scoped** | The hard stop — see the flagged finding above. Needs an engineered append-only log + configured retention, not a byproduct of markdown discipline. |
| **Commission/producer tracking** | **No, not as currently scoped** | Same hard stop, financial-math version. Needs a deterministic engine, tested against real carrier statement formats, not spreadsheet-plus-Claude. |

**One specific implementation trap all four converged on or implied, worth naming before any build starts:** the approved Drive connector is **file-level** access, not the Google Sheets API. Asking Claude to "update a cell" through the Drive connector risks opaque whole-file rewrites that destroy formulas/formatting. If Sheets plays any role as a human-editable surface, the write path needs to be a deliberate choice (Sheets API via a Worker, or Apps Script) — not assumed to come free with the Drive connector.

---

## B. The IMO/producer side — see the flagged finding above. Not repeated here to avoid burying it.

## C. Concrete architecture — converged proposal

**Cloudflare D1 is the system of record. Google Sheets/Docs are generated views or a synced human-editable layer, never assumed to be the source of truth. Cloudflare Workers are the engine Claude calls through — Claude never holds direct database credentials.** All four panelists converged on this shape independently.

```
Google Workspace (Gmail/Calendar/Drive)  →  Worker sync/cron  →  D1 (source of truth)
                                                                    ↓
                                                        Sheets (generated view / human edit layer)
                                                                    ↓
                                              Claude, via Worker/MCP endpoints (not direct DB access)
```

- **D1**: contacts, deals/activities (append-only log, not in-place updates), producers, commissions, `changelog`/audit table. Already live in this stack (`ECOSYSTEM_DB`), real SQLite, exportable (`wrangler d1 export`), cheap to migrate to Postgres later if it's ever outgrown.
- **Sheets**: either read-only generated views, or — if a human-editable surface is genuinely needed (e.g. producers who won't use a database) — a *deliberately built* bidirectional sync Worker, polling on a schedule (Sheets has no webhooks), with validation to catch orphaned/invalid rows.
- **Workers**: cron jobs for the no-touch/follow-up report, inbound-email routing (Cloudflare Email Routing → Worker → D1), the API surface Claude actually calls.
- **Claude**: reads/writes through Worker endpoints and the approved connectors, schema and SOP knowledge living in portable markdown per the adopted rule.

### Failure modes, named honestly (converged across panelists)

1. **Concurrent edits / last-write-wins.** D1 has no row-level locking by default. Needs optimistic locking (a `version` column) or single-writer-by-area conventions.
2. **No enforced relational integrity.** D1 supports foreign keys but doesn't enforce them by default — orphaned records are a real, ongoing risk without app-level checks.
3. **No native event bus.** Everything is polling (cron), not push. A lead landing in Gmail isn't "seen" until the next cron run — this is a real latency gap versus a CRM's native webhooks.
4. **Sync drift.** Gmail/Calendar and D1 will diverge — missed emails, duplicate `Message-ID` on forwards, mis-linked threads. Needs a `sync_log` and a periodic reconciliation pass, not a "set and forget" assumption.
5. **Schema drift / maintenance tax.** Every new field is a multi-file change (markdown spec + D1 migration + Worker endpoint + Claude prompt + any Sheet view). Fine at today's scale (one owner, 8 producers); the tax roughly doubles the moment a second person touches the pipeline — a real trigger point to watch for.
6. **Single point of failure: the Google account, and separately, Christopher's own bandwidth.** Workspace suspension or compromise takes the whole record set unless exports actually run on a schedule (automate, don't trust). Equally real: there's no vendor to call when something breaks — Christopher (or whoever builds this) is the entire support org.
7. **Claude non-determinism at the write path.** Same instruction, different phrasing, occasional wrong-field write. Mitigate with strict schemas, confirm-before-write on anything hard to reverse, and the audit log so a bad write is at least detectable.

---

## D. Steelmanning the CRM vendor — the two arguments that actually hold up

Every panelist converged on these two, independently, and explicitly rejected the weaker "our AI is better" pitch as not credible at this scale.

1. **This isn't cheaper, it's a different kind of expensive.** A small-business CRM runs roughly $30–200/month. The DIY build is realistically weeks of skilled dev time (one panelist estimated $2,000–4,000 in labor-equivalent for the initial build alone), plus an ongoing, never-fully-zero maintenance tax — every API break, sync bug, and schema change is founder time that isn't billable consulting hours. The honest framing: this is a bet that unbilled build time beats a subscription, not a philosophy that makes the cost disappear.
2. **Operational risk and the bus factor — Christopher's direct rebuttal, 2026-08-15, and both halves now resolved by design intent (not yet built).** The panel's version bundled two things: vendor support/documentation exists, and new hires already know the tool.
   - **Vendor-support half — defeated outright.** CRM vendor support is structurally unresponsive to small/solo accounts (a single account's churn or complaint can't move a company that size), so "call support" is often no more useful in practice than self-diagnosis, and Claude understands SP's specific business better than a support queue ever will regardless. Recorded as a standing worldview maxim (`christopher_worldview_maxims` #4: "only economics move the needle, not breakage").
   - **New-hire-familiarity half — reframed, not defeated by assertion.** Christopher's counter: plain-English chat is what everyone already knows how to use, more than sifting documentation or hunting down what a colleague said, and that only gets more true as chatbot use becomes universal. This holds up on one condition: it requires an actual build, not just the SOP markdown existing. Documentation alone isn't self-service; a retrieval layer over it is. **This is real, additive scope** — a Claude-grounded onboarding/support assistant over the SOP markdown, ideally extending to computer-use later. The good news: SP already has a proven, live version of exactly this pattern (`functions/api/ask.ts`, the RAG chatbot, adversarially tested to refuse rather than guess on ungrounded content) — reuse that pattern and its refusal discipline here, don't build a looser version for internal use just because the stakes feel lower. Getting a confidently wrong answer from an internal assistant is worse than no answer at all, especially anywhere near the IMO compliance side.
   - **Net effect:** the operational-risk steelman is now considered addressed *in design intent*, contingent on this onboarding-assistant layer actually getting built with the same anti-hallucination discipline as the existing chatbot. Not a disqualifier, per Christopher — but not free either; it's a named build item now, not an assumption.

**Note on portability, raised sharply by one panelist and worth carrying forward:** the adopted portability rule protects data and markdown business logic, but doesn't cover the *intelligence layer* — Claude itself, the connector plumbing, the MCP server behavior. That's arguably the single biggest vendor dependency in this whole architecture, and today's portability doctrine doesn't have an answer for it. Not a blocker, but worth being honest about rather than assuming the rule already covers everything.

---

## E. The single most valuable next build

Converged theme across all four (specific proposals varied in emphasis, same shape): **start small, end-to-end, on the consulting side only — not the IMO side, and not a scattered feature list.** Prove the plumbing works on the lower-stakes, revenue-adjacent half of the business before any compliance/commission engineering begins.

**Recommended first build, synthesized from the four proposals:** the lead → contact record → booked call → pipeline entry loop, consulting side only, exercising every approved connector and the full portability rule in one small, visible flow:

1. A lead lands (already captured via the existing R2 lead system).
2. A Worker creates the D1 contact + deal record.
3. Claude drafts an intro/qualifying email (draft only, never auto-sent, per the standing connector rule).
4. Claude creates the calendar slot for the call.
5. The deal enters the pipeline with a next-action and an automatic 5-day follow-up event.
6. A weekly Worker-generated no-touch report surfaces anything gone quiet.

**Why this one:** it's small, reversible, and its success is externally checkable — a lead went in, a booked call and a real pipeline entry came out, no human re-entry, no CRM. If it breaks, it breaks cheaply. If it works, it's the concrete proof-of-concept for the entire "AI-native" pitch SP sells to its own consulting clients — which makes it doubly valuable, not just as internal tooling but as the dogfooding case study `project_google_workspace_integration_decision` already names as the reason SP is the pilot.

**Deliberately deferred, not started:** pipeline Kanban UI, commission calculation, compliance report generation, producer-facing portal, the SOP-grounded onboarding/support assistant (see steelman #2 above — real scope, reuses the `functions/api/ask.ts` pattern, not urgent until there's a second person to onboard), anything on the IMO side pending the answer to the flagged finding above.

---

## Scope locked, 2026-08-15 (supersedes the "open decision" framing above)

Christopher's final call, after the exchanges recorded above: **no CRM *SaaS* specifically — not no-cloud.** Cloudflare and Google Workspace stay as the infrastructure substrate; SP is a real, operating one-man-show business today, not a green-field build. "We could go full Nextcloud and eliminate Cloudflare/Google entirely, but you go to war with the military you have" — that bigger self-hosted fork is explicitly rejected for now, not forgotten, just out of scope.

**Working method, locked:** start simple — markdown SOPs + spreadsheets where they genuinely help + a dashboard for human visual feedback — build it, see where it fails, retool. Applies across the whole business, including the IMO side; this effectively resolves the earlier "open decision" above by choosing DeepSeek's carve-in path implicitly (no-CRM stays everywhere, compliance gets engineered in, not exempted) rather than either extreme.

**One exception to "build now, retool later," flagged and agreed:** everything in this system is retrofittable except the append-only event/audit log (§ "What a real engineered compliance/audit spine means," piece 1). A log that didn't run during a given period can't be reconstructed after the fact. So the v1 scope stays simple as described, but includes a minimal version of that log table from day one — cheap now, impossible to backfill later. Everything else (retention policy detail, hash-chain tamper-evidence, RBAC, chain-of-custody, the deterministic commission ledger) can genuinely wait and be retrofitted when the business actually needs it.

**v1 scope, concretely:** Google Workspace connectors (Gmail/Calendar/Drive, per `GOOGLE_WORKSPACE_PILOT.md`) + a small D1 schema (contacts, deals, activities, and a minimal append-only `event_log` table from day one) + Sheets where a human-editable surface is genuinely needed + a simple dashboard for visual feedback, all governed by the portability rule. No Kanban UI, no commission engine, no hash-chaining, no RBAC beyond what D1/Workers give for free — those come later, if and when they're actually needed.
