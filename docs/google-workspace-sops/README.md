# SecureProspective Google Workspace SOPs

Portable, human-readable procedures for the business workflows that run through Google
Workspace (Gmail, Calendar, Drive) and the Cloudflare side of the stack (Workers, D1).

## What this directory is

This is the scaffolding required by `docs/GOOGLE_WORKSPACE_PILOT.md` Phase 0 step 3: the
structure exists *before* real SOPs get written into it, so no business process ends up
living only inside a chat session. Flat markdown, one file per workflow, numbered in the
order the v1 loop runs.

It satisfies the adopted portability rule (memory `feedback_portability_rule_business_builds`):

1. **Business logic lives in this markdown**, not in Claude-only automation. If Claude went
   away tomorrow, a person with these files could still run the business by hand.
2. **Every data store an SOP touches names its export path.** Not "an export exists in
   theory," but the actual command or menu path, written down, and actually run at least
   once. That is why every SOP has an Export path section and it is not optional.
3. **Credentials never appear in these files.** No tokens, no API keys, no connection
   strings, not even realistic-looking placeholders. Where an SOP needs a secret, it names
   *where the secret lives* (Cloudflare Pages secret, `wrangler secret`, the operator's own
   password manager) and stops there.

The workflows here mirror the v1 loop locked in `docs/NO_CRM_ARCHITECTURE.md` section E.
Nothing outside that loop belongs in this directory yet: no dashboard, no commission
calculation, no IMO-side compliance procedure.

## Index

| # | SOP | Covers | Status |
|---|---|---|---|
| 01 | [01-lead-intake.md](./01-lead-intake.md) | A lead lands and becomes a D1 contact plus deal record | Stub, procedure not yet run |
| 02 | [02-call-booking.md](./02-call-booking.md) | Qualifying email drafted, calendar slot created | Stub, procedure not yet run |
| 03 | [03-weekly-no-touch.md](./03-weekly-no-touch.md) | Weekly report surfacing deals gone quiet | Stub, procedure not yet run |

New SOPs start from [`_TEMPLATE.md`](./_TEMPLATE.md) and get added to this table in the same
commit that creates them.

## The surface seam rule

**Every step in every SOP must name which surface executes it.** There are two, and neither
one does everything:

- **Claude Code** owns the repo, Cloudflare Workers, D1, migrations, scheduled jobs, and
  anything that reads or writes the source of truth.
- **Claude with Workspace connectors** owns Gmail, Calendar and Drive. As of 2026-08-15 these
  are reachable from Claude Code on CT105 as MCP tools, but only inside a session that holds
  the connector grant. Not every session has it. Tom's sessions do not.

Do not write a step that silently assumes one surface can reach the other's territory. When a
workflow crosses the seam, say so on the step, and say who is holding the session. A step that
cannot name its surface is a step that has not actually been designed yet.

## The standing safety rule

**Gmail is draft-only.** Claude drafts, a human reviews, a human sends. This is SP's own rule,
not an inherited vendor limit: the connector tool surface does expose `send_message`, `reply`,
`forward`, `trash_message`, `trash_thread` and `mark_message_spam`, so nothing outside this
rule is stopping a send. It holds until Christopher explicitly changes it.

Alongside it:

- **Claude never auto-sends.** No SOP step may end with a message leaving the account without
  a human having read it first.
- **Claude never bulk-operates.** One item at a time, reviewed, on Gmail and Calendar alike.
- **Claude never deletes.** Not messages, not threads, not events, not Drive files. Removal is
  a human action.

The only email address that ever appears in these files is `secureprospective@gmail.com`. Real
client names, real client addresses and real thread contents stay out of committed markdown.
