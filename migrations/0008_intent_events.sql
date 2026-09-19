-- =====================================================================
-- secureprospective: D1 migration 0008, website intent events
-- =====================================================================
-- Target databases: `secureprospective-events-db` bound as EVENTS_DB on
-- Production, and `secureprospective-events-preview-db` bound as the same
-- name on Preview. TWO databases, deliberately. A single shared one was
-- created first and then split, because preview traffic is testing and a
-- test tap on the call button would otherwise be pulled into the ledger
-- and counted in a quarterly report forever. Apply this file to both. A new isolated database rather than a
-- table inside an existing one, per this project's standing rule of one
-- database per app (see 0004's header). Unlike 0007, the target here is
-- not an open question: Christopher settled it on 2026-09-19 and the
-- Beelink owns the creation and the binding.
--
-- WHAT THIS IS
-- ---------------------------------------------------------------------
-- The landing table for the website intent beacon. Cloudflare Web
-- Analytics cannot record custom events, so a visitor tapping the call
-- button, or being unable to submit the form at all, is invisible today.
-- This table is where those events land on their way to Hermes.
--
-- D1 IS A BUFFER, NOT THE ARCHIVE
-- ---------------------------------------------------------------------
-- The permanent record is the Hermes ledger, which is where the
-- dashboard and the weekly/monthly/quarterly/yearly reports will read
-- from. Rows here are pulled, written to the ledger, and only then
-- acknowledged. Acknowledged rows are kept for a short window as a
-- replay buffer against a bad ledger write, then pruned. Nothing should
-- ever be reported out of this table directly: it does not hold
-- history, and it is not the system of record.
--
-- WHAT IS DELIBERATELY NOT STORED
-- ---------------------------------------------------------------------
-- No IP address, no user agent, no referrer, no cookie, no session id,
-- no visitor identifier of any kind, and no free text. `lead.ts` stores
-- an IP because a lead is a person who chose to identify themselves; an
-- intent event is not, and storing less is what keeps this outside
-- consent territory. Both `event` and `detail` are allowlisted in
-- `functions/api/track.ts`, so the columns below can only ever hold a
-- value that file already names.
-- =====================================================================

CREATE TABLE IF NOT EXISTS intent_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Allowlisted in track.ts. Changing this vocabulary is a reporting
  -- decision, not an implementation detail: every historical row keeps
  -- the name it was written with, so renaming an event splits its own
  -- history in two. Add names, do not repurpose them.
  event      TEXT    NOT NULL,

  -- Allowlisted per event in track.ts, and NULL for events that carry
  -- no detail. Never free text from the page.
  detail     TEXT,

  -- Path only. Query strings and fragments are stripped client-side and
  -- again at the endpoint, because that is where an identifier would
  -- otherwise smuggle itself in.
  path       TEXT    NOT NULL,

  -- ISO 8601 UTC, written by the endpoint and never by the client, so a
  -- wrong clock on a visitor's phone cannot land in the record.
  ts         TEXT    NOT NULL,

  -- UTC calendar day, stored so the pull and the prune can group without
  -- parsing. NOT a reporting boundary: the business runs on America/
  -- Chicago, and a UTC day boundary would move every evening event into
  -- the next day. Reporting days are derived on Hermes from `ts`.
  day        TEXT    GENERATED ALWAYS AS (substr(ts, 1, 10)) STORED,

  -- Pull bookkeeping. 0 until Hermes has the row safely in the ledger.
  acked_at   TEXT
);

-- The pull: oldest unacknowledged rows first. Partial, because the
-- acknowledged rows are the ones this query must never walk.
CREATE INDEX IF NOT EXISTS idx_intent_events_unacked
  ON intent_events (id) WHERE acked_at IS NULL;

-- The prune, and any spot check of a single day while debugging.
CREATE INDEX IF NOT EXISTS idx_intent_events_day
  ON intent_events (day);
