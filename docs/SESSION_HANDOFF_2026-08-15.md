# Handoff — No-CRM / Google Workspace Build, 2026-08-15

**Read this first if you are Tom, picking up this build.** This is the entry point; `NO_CRM_ARCHITECTURE.md` and `GOOGLE_WORKSPACE_PILOT.md` have the full detail this doc summarizes and points to. If anything here conflicts with those two docs, they win — this is a handoff summary, not the source of truth.

---

## Who does what (locked this session)

- **ClaudeBox (Christopher's CT105 Claude Code session) is head brain.** Running Opus, medium effort. Owns judgment calls, code review, merge, and deploy — same role it already has for bird and the Beelink DeepSeek lane in this repo's existing workflow (see `CLAUDE.md`'s Workflow section). ClaudeBox does not do the heavy code-writing on this build.
- **Tom (Beelink) does the heavy lifting — code and token burn.** Running Opus, low effort. Builds the D1 schema/migrations, Worker endpoints, dashboard, and SOP scaffolding per the plan below. **Tom does not merge to `main` and does not deploy** — that's CT105's job, identical to the existing bird/Beelink gate already in place for this repo (`CLAUDE.md`: "Bird never deploys to Cloudflare... CT105 owns the merge"). Push your work to a branch; CT105 fetches, reviews, merges.
- Tom has **no shared filesystem with CT105** (`reference_beelink_claude_subagent`). This doc, and the two docs it points to, are the way context reaches you — they're committed to this repo specifically so a `git pull`/`git fetch` is enough, no cross-machine copy needed.

---

## What was decided this session (context, compressed)

1. **Google Workspace integration decision.** SP connects Claude to its real Gmail/Calendar/Drive via Anthropic's official connectors (MCP-based), chat-mode only — never Cowork (ruled out: no audit-log/export path on any plan tier, plus a disclosed unpatched prompt-injection exfil vuln). Never Tom or Buzz for the connector access itself (Buzz stays walled off from real business per standing doctrine; Tom builds the code but the live Workspace connection is chat-mode-only on ClaudeBox/Claude.ai, not something Tom's build touches directly).
2. **Portability rule adopted** (`feedback_portability_rule_business_builds`): business logic in portable plain markdown, every data store needs a documented lossless export path, credentials in a standard secrets mechanism, never markdown. Applies to everything built here.
3. **"Never need a CRM" — scope locked** (`project_sp_no_crm_architecture`): no CRM *SaaS* specifically, not no-cloud. Cloudflare and Google Workspace stay as infrastructure — SP is a real one-man business operating today, not a green-field build. Applies across the whole business, IMO producer/compliance side included — compliance gets engineered in over time, not exempted and not blocking day-one work.
4. **One hard exception to "build simple now, retool later":** the append-only event/audit log must start recording from day one. Everything else in this system is retrofittable after the fact; a log covering a period before it existed cannot be reconstructed. This is the one place "move fast" doesn't apply — see `NO_CRM_ARCHITECTURE.md`'s compliance-spine section for exactly what this table needs to look like (append-only, no `UPDATE`/`DELETE`, who/what/when/before/after).

A four-model adversarial panel (DeepSeek, Nemotron, Gemini, MiMo — explicitly instructed not to be agreeable) produced the architecture below and unanimously flagged the IMO-compliance risk before Christopher made the final scope call. Their reasoning is preserved in `NO_CRM_ARCHITECTURE.md` — worth reading before building the compliance pieces specifically, since it names concrete failure modes (no relational integrity in Sheets, the Drive-connector-is-file-level-not-Sheets-API trap, sync drift, schema-drift maintenance tax) that the build should design around, not discover the hard way.

---

## v1 build scope (what Tom should actually build)

Keep it simple — this is deliberately not the full architecture in `NO_CRM_ARCHITECTURE.md`, just its first slice:

1. **D1 schema**: `contacts`, `deals` (with a stage-history append-only pattern, not in-place stage updates), `activities`, and `event_log` (the compliance-spine exception above — minimal but real, starts logging from the first commit that touches real data, not added later).
2. **Worker API endpoints** that Claude calls to read/write D1 — Claude never holds DB credentials directly.
3. **Sheets** only where a human-editable surface is genuinely needed (not as the source of truth — D1 is).
4. **A simple dashboard** — visual feedback for Christopher, nothing fancy, matches "handful of spreadsheets, markdown files, and a dashboard" as literally stated.
5. **SOP markdown** documenting the schema and workflows as they're built, per the portability rule — this doubles as the future onboarding-assistant's grounding corpus (`NO_CRM_ARCHITECTURE.md` steelman §D covers that follow-on, not in scope for v1).

**Recommended first concrete build** (converged panel recommendation, `NO_CRM_ARCHITECTURE.md` §E): the lead → contact record → booked call → pipeline entry loop, **consulting side only** first, not the IMO side. Small, end-to-end, externally checkable. Exercises every approved Workspace connector and the full portability rule in one visible flow before anything more ambitious gets attempted.

**Explicitly not in v1:** Kanban UI, commission calculator, hash-chain tamper-evidence, RBAC beyond what D1/Workers give by default, the onboarding chatbot, anything IMO-specific beyond the baseline `event_log` table. Those come later, if and when actually needed — don't build ahead of the business.

---

## ✅ Correction, same day (2026-08-15, supersedes the struck block below): Gmail, Calendar and Drive all have working Claude Code tools

All three connectors are reachable from Claude Code, exposed as MCP tools named `mcp__claude_ai_Gmail__*`, `mcp__claude_ai_Google_Calendar__*` and `mcp__claude_ai_Google_Drive__*`. The claude.ai Settings→Connectors OAuth grant propagated to the Claude Code surface by itself. No separate OAuth flow from inside Code was needed, for Drive or for anything else.

Evidence, from real tool calls in Claude's CT105 session on 2026-08-15:

- `list_calendars` returned `secureprospective@gmail.com` plus "Holidays in United States", timezone `America/Chicago`.
- `list_labels` returned INBOX 963 messages / 99 unread, SENT 164, DRAFT 1, TRASH 90.

**There is no two-surface split. Revise the mental model accordingly:** Gmail, Calendar, Drive, D1, the Worker and the dashboard are all one territory, addressable from a single Code session.

**New risk, stated plainly: the Gmail tool surface is not draft-only.** It includes `send_message`, `reply`, `forward`, `trash_message`, `trash_thread` and `mark_message_spam`. Real send and real destructive operations are exposed, with no vendor-side guardrail between a tool call and a delivered or deleted message. SP's own draft-only rule (`GOOGLE_WORKSPACE_PILOT.md` Phase 0 step 4) is now the only thing enforcing draft-only, and Christopher's standing never-send-without-explicit-permission rule applies to these tools exactly as it does to Thunderbird.

**Practical consequence for the v1 build, corrected:** the "lead → contact record → booked call → pipeline entry" loop (recommended first build, above) **can** be a single Code-driven flow. Drafting the Gmail reply, creating the Calendar event, and writing the D1 records can all happen in one Code session, no claude.ai chat handoff and no human-in-the-loop seam required for tool access reasons. Build it as one flow.

The human-in-the-loop step that remains is a policy step, not a capability limit: **a drafted email is left in Drafts for Christopher to send himself.** Do not wire `send_message`, `reply` or `forward` into any automated path. That is a deliberate rule, not a gap to engineer around.

> **Superseded 2026-08-15, kept visible as history (these claims were wrong):**
>
> ~~## ⚠️ Correction, same day (2026-08-15, after initial handoff written): Gmail/Calendar are NOT reachable from Claude Code at all~~
>
> ~~Verified directly by searching this Code session's own tool list: **there is no Gmail tool and no Calendar tool available to Claude Code, for ClaudeBox or for Tom.** Those connectors are a **claude.ai chat-only feature** (web/desktop/mobile app) — they don't exist as Code tools, full stop, not a config issue, not something to authenticate your way into from here.~~
>
> ~~**Google Drive is different but still not automatic:** there IS a Drive MCP server available to Claude Code (`claude.ai Google Drive`), but it's a **separate integration from claude.ai's Settings→Connectors Drive** — it needs its own OAuth flow run from inside Claude Code specifically, unrelated to whatever's connected in the claude.ai chat UI.~~
>
> ~~**This splits the real architecture into two surfaces, revise the mental model accordingly:**~~
> - ~~**Gmail + Calendar**: only reachable from an actual claude.ai chat window. Neither Tom nor ClaudeBox can touch these directly — any workflow step that needs to read/draft email or read/write calendar events has to be driven from claude.ai chat, by Christopher or as an explicit human-in-the-loop step, not automated inside the Code-based build.~~
> - ~~**Drive + D1/Worker/dashboard**: this is Tom/ClaudeBox's actual territory. Authenticate the Drive MCP server from Code separately if Drive access is needed from a Code session; otherwise Drive can also just go through claude.ai chat like Gmail/Calendar.~~
>
> ~~**Practical consequence for the v1 build:** the "lead → contact record → booked call → pipeline entry" loop (recommended first build, below) cannot be a single Code-driven flow if it needs to draft a Gmail reply or create a Calendar event — those two steps need to happen in a claude.ai chat, with Code/Tom owning the D1 record-keeping and dashboard around them. Design the v1 build with that seam in mind from the start rather than discovering it mid-build.~~

## Before any of this starts: Christopher's Claude.ai setup

The Google Workspace connectors (Gmail/Calendar/Drive) have to be enabled from Claude.ai's Settings UI, which is not something either Claude Code session can do. Once enabled there, the grant reaches Claude Code on its own (see the correction above). Full checklist is in `/root/paste.md` on CT105 (Christopher's side, not this repo). **Do not assume the connectors are live — verify with a trivial read (e.g. "what's on today's calendar") before building anything that depends on them.**

---

## Where everything lives

- `docs/NO_CRM_ARCHITECTURE.md` — full architecture, panel findings, failure modes, steelman arguments, the compliance-spine definition.
- `docs/GOOGLE_WORKSPACE_PILOT.md` — the connector build map and 9-step staged test sequence (Drive/Calendar/Gmail read→write→chained→ambiguity-probe→export-drill). Run this before trusting the connectors with anything real.
- `CLAUDE.md` (this repo's root) — Open Items has pointers to both, plus the existing SP stack/workflow conventions (Astro/Cloudflare Pages, bird/Beelink git remotes, build command, branch discipline).
- Backbone memory (CT105-side, not reachable from Tom directly, but Christopher can relay anything relevant): `project_sp_no_crm_architecture`, `project_google_workspace_integration_decision`, `feedback_portability_rule_business_builds`, `christopher_worldview_maxims` (#4 is relevant here — vendor-support arguments don't hold the way they used to, don't over-index on "what would a CRM vendor's support team do" when making build calls).
