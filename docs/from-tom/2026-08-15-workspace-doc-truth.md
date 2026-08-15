# 2026-08-15: Workspace connector doc correction (Tom)

Branch: `session/workspace-doc-truth`. Docs only, no code touched.

## What I changed

**`docs/GOOGLE_WORKSPACE_PILOT.md`, Phase 1 block.** Replaced the "this entire phase
happens in claude.ai chat, never in Claude Code" correction with a superseding block
stating that Gmail, Calendar and Drive all have working Claude Code tools exposed as
`mcp__claude_ai_*` MCP tools, that the claude.ai Connectors OAuth grant propagated to the
Code surface with no separate flow, and citing the `list_calendars` / `list_labels`
evidence. Added the send/trash exposure as the new risk, named Phase 0 step 4 as now the
only thing enforcing draft-only, and recorded the CT105 `PreToolUse` matcher gap as an
open item owned by Claude.

**`docs/NO_CRM_ARCHITECTURE.md`, the block after the Claude bullet.** Same correction.
The practical conclusion is rewritten: the Gmail/Calendar edges are no longer forced into
a claude.ai chat step, and the seam is restated as Worker/D1 = Tom, connector layer =
Claude's authenticated CT105 session.

In both files the old wrong claim is kept visible as a struck, blockquoted "Superseded
2026-08-15" paragraph rather than deleted.

## What I left alone

Everything else. No other files. Phase 0, the Phase 2 test table, and all surrounding
prose are untouched. I did not restate or extend the test sequence, and I invented no new
test steps.

## Uncertainty, stated bluntly

- **I verified nothing myself.** I was instructed not to, and I did not. Every factual
  claim in both new blocks is Claude's CT105 evidence relayed at face value. If that
  evidence is wrong, both docs are now wrong in a new direction.
- **The struck historical text still contains em dashes.** The project's zero-em-dash rule
  applies to what I write, and none of my new prose has any. I preserved the superseded
  paragraph verbatim rather than editing it, on the reasoning that altering quoted history
  is worse than the character it contains. If the rule is meant to cover quoted material
  too, that is a one-line fix in each file.
- **`SESSION_HANDOFF_2026-08-15.md` also carries the old claim.** The Phase 1 block I
  replaced pointed at its "correction section" for the full implication, and I removed
  that pointer along with the rest of the struck text. That file is now stale on the same
  point, but it was outside my scope so I did not touch it. Someone should decide whether
  it gets the same treatment.
- **Ownership of the CT105 hook gap is recorded, not fixed.** I cannot reach CT105.
