# SOP 03: Weekly No-Touch Report

**Status: stub.** This workflow has not been run yet. Purpose and Trigger below are real. Every
other section is a TODO placeholder, to be filled in from what actually happens the first time
it runs, not invented ahead of time.

## Purpose

Surface deals that have gone quiet, once a week, so nothing is lost simply because nobody
remembered it. This is the piece a CRM would normally provide as "stuck deal" alerting, and it
is step 6 of the v1 loop in `docs/NO_CRM_ARCHITECTURE.md` section E. Nothing in this stack
fires on its own, so if this report is not built, the silence is invisible.

## Trigger

A schedule, weekly. The day and time are set at build, not assumed here. The report is generated
on a schedule; acting on it is a human reading it.

## Surface(s)

TODO. Names which surface computes the report and which, if any, delivers it. The query side is
Claude Code and Worker territory; delivery may or may not touch a connector, and that choice
should be made explicitly rather than by default.

## Preconditions

TODO. Lists what must exist first: enough activity history in D1 for "quiet" to mean anything,
and an agreed definition of quiet in days.

## Steps

TODO. Numbered procedure, each step naming its surface, written after the first real run.

## What "done" looks like

TODO. Describes the checkable end state: a report a person actually read, listing deals that a
person agrees really have gone quiet. A report that is always empty, or always full, is a
failed report even if it ran.

## Failure modes

TODO. Records what actually went wrong. A scheduled job that stopped running without anyone
noticing is the failure this report is most exposed to, since its own absence looks like good
news.

## Export path

TODO. Names the export for each store touched, with the real command and the date last run.
Expect D1 to be the only store here unless report history is kept somewhere else.

## Last reviewed

Never. Created 2026-08-15 as an empty scaffold.
