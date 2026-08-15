# SOP NN: [Short name of the workflow]

## Purpose

One or two sentences. What this workflow accomplishes for the business, and why it is worth
having written down. Not the steps, the outcome.

## Trigger

What starts this. A specific event (a form submission, an inbound email matching a pattern), a
schedule (weekly, Monday morning), or a person deciding to start it. If more than one thing can
trigger it, list them.

## Surface(s)

Which surfaces this workflow uses, and who holds the session:

- **Claude Code:** [what it does here, or "not used"]
- **Claude with Workspace connectors:** [what it does here, or "not used"]
- **Human:** [what only a person does here]

## Preconditions

What must already be true before step 1 runs. Bindings that must exist, tables that must be
migrated, a connector grant that must be live, a folder that must exist. Anything that would
make the workflow fail silently if missing belongs here.

## Steps

Numbered, in order. **Every step names its surface.** Keep each step to one action a person
could verify happened.

1. **[Surface]** Do the thing.
2. **[Surface]** Do the next thing.
3. **[Human]** Review and approve before anything leaves the account.

## What "done" looks like

The externally checkable end state. Something a person could confirm by looking, without
trusting a report that says it worked. Name the place they would look.

## Failure modes

What realistically goes wrong, and what to do about each. Be specific and honest. A silent
no-op reported as success is worth naming here more than an obvious crash is.

- **[What goes wrong]:** [how you would notice, what to do]

## Export path

Every data store this SOP touches, and the actual way to get the data out of it. Command or
menu path, not a description. Note the last time the export was really run, not just written
down. No credentials here: name where the secret lives, never the secret.

- **[Store]:** [export command or path], last verified: [date, or "never run"]

## Last reviewed

[Date] by [who]. Note anything that changed since the previous review.
