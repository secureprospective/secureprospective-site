# SOP 02: Call Booking

**Status: stub.** This workflow has not been run yet. Purpose and Trigger below are real. Every
other section is a TODO placeholder, to be filled in from what actually happens the first time
it runs, not invented ahead of time.

## Purpose

Move a captured lead toward a real conversation: a qualifying email drafted for human review,
and a calendar slot created for the call, with the deal record updated to reflect both. This is
steps 3 through 5 of the v1 loop in `docs/NO_CRM_ARCHITECTURE.md` section E, and it is the
first place the workflow touches an outward-facing surface.

## Trigger

SOP 01 has completed for a given lead and a human has decided the lead is worth a call. This is
a deliberate human decision, not an automatic consequence of intake.

## Surface(s)

TODO. Names which surface drafts the email, which creates the calendar event, and which updates
D1. The Gmail and Calendar steps require a session holding the connector grant.

## Preconditions

TODO. Lists what must be true first: an existing contact and deal record from SOP 01, a live
connector grant, and a known set of hours the operator is willing to offer.

## Steps

TODO. Numbered procedure, each step naming its surface, written after the first real run.
Whatever the shape ends up being, the draft-only rule in the README binds every Gmail step: the
draft lands in Drafts and a human sends it.

## What "done" looks like

TODO. Describes the checkable end state: a draft visible in Gmail's own Drafts folder, an event
visible in Google Calendar itself with the right timezone, and a deal record reflecting the
next action.

## Failure modes

TODO. Records what actually went wrong. Wrong timezone on the created event and a "draft" that
was actually sent are the two worth checking directly rather than trusting a success message.

## Export path

TODO. Names the export for each store touched, with the real command and the date last run.
Expect D1 plus the Calendar iCal export and the Gmail mbox export to appear here.

## Last reviewed

Never. Created 2026-08-15 as an empty scaffold.
