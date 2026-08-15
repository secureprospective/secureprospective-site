# SOP 01: Lead Intake

**Status: stub.** This workflow has not been run yet. Purpose and Trigger below are real. Every
other section is a TODO placeholder, to be filled in from what actually happens the first time
it runs, not invented ahead of time.

## Purpose

Turn an inbound consulting lead into a durable record in the system of truth: a contact row and
a deal row in D1, with the first activity logged, so that no lead exists only in an inbox or
only in someone's memory. This is step 1 and 2 of the v1 loop in
`docs/NO_CRM_ARCHITECTURE.md` section E, and it is the point where "we never need a CRM" either
holds or does not.

## Trigger

A new consulting lead arrives. Today that means one of two things:

- The site's existing lead capture writes a lead object to the R2 bucket `ccwork-leads` (the
  chat widget's name plus email gate).
- An inbound email lands in `secureprospective@gmail.com` that is plainly a new inquiry rather
  than an existing thread.

## Surface(s)

TODO. Names which surface does the D1 write, which one reads Gmail, and which decisions stay
with a human. Expect the D1 and R2 work to be Claude Code and the inbox read to require a
connector session.

## Preconditions

TODO. Lists what must exist first: the D1 tables (contacts, deals, activities, event_log), the
binding on the Pages project, and a live connector grant if the Gmail path is used.

## Steps

TODO. Numbered procedure, each step naming its surface, written after the first real run rather
than guessed at now.

## What "done" looks like

TODO. Describes the checkable end state: a contact row and a deal row that a person can query
and recognize, with an event_log entry recording the intake.

## Failure modes

TODO. Records what actually went wrong in practice. Duplicate leads from the same person and
inbound mail that is not really a lead are the two worth watching for first.

## Export path

TODO. Names the export for each store touched, with the real command and the date it was last
actually run. Expect D1 and R2 to both appear here.

## Last reviewed

Never. Created 2026-08-15 as an empty scaffold.
