-- =====================================================================
-- secureprospective: D1 migration 0007, no-CRM workspace v1
-- =====================================================================
-- STATUS: WRITTEN, NOT APPLIED ANYWHERE. No database has been created
-- for this, no binding has been added, no wrangler command has been
-- run. Which D1 instance this lands in is an OPEN DECISION for
-- Christopher, not a choice made by this file. This project's standing
-- rule is one isolated database per app (see 0004's header and the
-- feedback_tfm_sp_data_separation boundary), so the plausible options
-- are a new `secureprospective-workspace-db` or reuse of the existing
-- ECOSYSTEM_DB. Do not guess; ask before applying.
--
-- WHAT THIS IS
-- ---------------------------------------------------------------------
-- The v1 data spine for the "never need a CRM" architecture, exactly as
-- locked on 2026-08-15 in docs/NO_CRM_ARCHITECTURE.md ("Scope locked").
-- Four tables, no more:
--
--   contacts    people
--   deals       opportunities against a contact
--   activities  things that happened against a contact or a deal
--   event_log   the append-only audit spine
--
-- Everything here except `event_log` is deliberately minimal and
-- expected to be retooled once real use shows where it fails. That is
-- the locked working method: build simple, see where it breaks, retool.
--
-- DELIBERATELY NOT IN THIS FILE (all explicitly deferred by the locked
-- scope; adding any of them here would be scope creep, not diligence):
--   * hash-chaining or other tamper-evidence on event_log
--   * retention policy automation
--   * RBAC beyond what D1 and Workers give for free
--   * commission ledger, compliance report tables, pipeline Kanban state
--   * a sync_log / reconciliation table for Gmail and Calendar drift
--     (a real named failure mode, but not part of the locked v1 four)
--
-- CONVENTIONS, matching 0004 and 0005 in this repo
-- ---------------------------------------------------------------------
--   * Text UUID primary keys (crypto.randomUUID()) for anything a
--     Worker or a human will reference by id.
--   * Timestamps are INTEGER epoch seconds, same as 0004. Not the TEXT
--     datetime('now') style of 0002, which predates that convention.
--   * Enum-ish columns use named string values with a CHECK, same
--     reasoning as 0004's `step`: a named value survives a later
--     insertion into the list, an integer code does not.
--   * JSON goes in TEXT columns, suffixed `_json`.
--
-- FOREIGN KEYS: D1 supports foreign keys but does NOT enforce them by
-- default on every database, and this migration must not be read as a
-- guarantee that it does. Failure mode 2 in NO_CRM_ARCHITECTURE.md
-- names orphaned records as a real ongoing risk. The references below
-- are declared because they document intent and because they work when
-- enforcement is on, but APP-LEVEL EXISTENCE CHECKS REMAIN REQUIRED on
-- every write path. Do not delete a parent row and assume the children
-- went with it; verify with an actual delete before relying on any
-- ON DELETE behaviour.
--
-- OPTIMISTIC LOCKING: `contacts` and `deals` each carry a `version`
-- integer. D1 has no row-level locking, so concurrent writers are
-- last-write-wins by default, and in this system the concurrent writers
-- are a human and a Claude-driven Worker touching the same record
-- minutes apart. Every update MUST be written as
--   UPDATE ... SET ..., version = version + 1
--   WHERE id = ? AND version = ?
-- and a zero-rows-changed result MUST be treated as a conflict to
-- surface, never as a silent success. `activities` and `event_log` have
-- no version column on purpose: nothing updates them.
-- =====================================================================


-- ---------------------------------------------------------------------
-- contacts
-- One row per person. Email is the natural handle but is NOT unique:
-- shared inboxes and role addresses are real, and a UNIQUE constraint
-- here would reject legitimate people rather than merge them. Dedupe is
-- an app-level judgment call, not a database-level rejection.
--
-- `source` records where the person came from (for example 'r2_lead',
-- 'gmail', 'referral', 'manual') so the lead-to-contact loop stays
-- traceable back to its origin.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
  id          TEXT PRIMARY KEY,            -- crypto.randomUUID()
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  source      TEXT,                        -- free text, where they came from
  notes       TEXT,
  version     INTEGER NOT NULL DEFAULT 1,  -- optimistic locking, see header
  created_at  INTEGER NOT NULL,            -- epoch seconds
  updated_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contacts_email      ON contacts (email);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts (created_at);


-- ---------------------------------------------------------------------
-- deals
-- One row per opportunity, always attached to a contact.
--
-- `next_action` plus `next_action_at` is the load-bearing pair, not
-- decoration: the weekly "what has gone quiet" report is a date-range
-- query over next_action_at, and a deal with no next action is exactly
-- the thing that report exists to surface.
--
-- `stage` is a named enum for the same reason 0004's `step` is: a later
-- pipeline change must not silently reclassify every open deal.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deals (
  id              TEXT PRIMARY KEY,        -- crypto.randomUUID()
  contact_id      TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,

  stage           TEXT NOT NULL DEFAULT 'new'
                    CHECK (stage IN (
                      'new',
                      'qualifying',
                      'proposal',
                      'negotiation',
                      'won',
                      'lost'
                    )),

  next_action     TEXT,                    -- plain language, human readable
  next_action_at  INTEGER,                 -- epoch seconds, NULL = nothing queued

  version         INTEGER NOT NULL DEFAULT 1,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  closed_at       INTEGER                  -- set when stage becomes won or lost
);

CREATE INDEX IF NOT EXISTS idx_deals_contact        ON deals (contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage          ON deals (stage);
CREATE INDEX IF NOT EXISTS idx_deals_next_action_at ON deals (next_action_at);


-- ---------------------------------------------------------------------
-- activities
-- Things that happened: a call, an email, a meeting, a note. Attached to
-- a contact, a deal, or both. At least one of the two SHOULD be set; an
-- activity attached to nothing is not retrievable by any real query.
--
-- This is the business-visible timeline a human reads. It is NOT the
-- audit log, and the two must not be conflated: activities are editable
-- business records, event_log is not. A typo in an activity summary gets
-- fixed in place, and that fix is itself recorded in event_log.
--
-- `external_ref` holds the origin-system identifier where one exists,
-- for example a Gmail Message-ID or a Calendar event id, so the sync
-- drift named as failure mode 4 is at least detectable.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
  id            TEXT PRIMARY KEY,          -- crypto.randomUUID()
  contact_id    TEXT REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id       TEXT REFERENCES deals(id)    ON DELETE CASCADE,

  type          TEXT NOT NULL
                  CHECK (type IN (
                    'email',
                    'call',
                    'meeting',
                    'note',
                    'task'
                  )),

  summary       TEXT NOT NULL,
  body          TEXT,                      -- optional longer detail
  external_ref  TEXT,                      -- Gmail Message-ID, Calendar id, etc.
  occurred_at   INTEGER NOT NULL,          -- epoch seconds, when it happened
  created_at    INTEGER NOT NULL           -- epoch seconds, when it was recorded
);

CREATE INDEX IF NOT EXISTS idx_activities_contact_at ON activities (contact_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_activities_deal_at    ON activities (deal_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_activities_occurred   ON activities (occurred_at);
CREATE INDEX IF NOT EXISTS idx_activities_external   ON activities (external_ref);


-- =====================================================================
-- event_log
-- =====================================================================
--   *** APPEND ONLY. READ THIS BEFORE YOU TOUCH THIS TABLE. ***
--
-- Rows in this table are NEVER updated and NEVER deleted. Not to fix a
-- typo, not to clean up test data, not to correct a wrong value, not
-- during a migration, not "just this once." There is no UPDATE and no
-- DELETE against event_log anywhere in this system, and if you find
-- yourself writing one, the answer you are looking for is a new row.
--
-- A correction is a NEW ROW that points at the row it corrects, via
-- `corrects_event_id`. The original stays exactly as written. The
-- history is never rewritten; it only ever grows. A reader wanting
-- current truth follows the correction chain forward, and a reader
-- wanting to know what was believed at the time reads the original.
--
-- WHY THIS ONE TABLE IS DIFFERENT FROM EVERYTHING ELSE HERE:
-- every other part of this system can be retrofitted later. A missing
-- column gets added, a wrong stage name gets migrated, a whole table
-- gets redesigned once real use shows what it should have been. This
-- table cannot. A log that was not running during a given period cannot
-- be reconstructed after the fact, at any price, by anyone. That is the
-- entire reason it exists in v1 rather than "later" (see the locked
-- scope in docs/NO_CRM_ARCHITECTURE.md, 2026-08-15). Weakening it later
-- is not a small change; it is permanent, silent, and unrecoverable.
--
-- Every row answers five questions:
--   who    -> actor, actor_type
--   what   -> action
--   which  -> entity_type + entity_id
--   when   -> occurred_at
--   change -> before_json / after_json
--
-- DELIBERATELY NOT HERE, per the locked scope: hash-chaining, tamper
-- evidence, signatures, retention automation, RBAC. Those are real
-- things that may be wanted one day, and unlike the log itself they CAN
-- be added later. Do not add them now.
--
-- Do not write secrets, tokens, or credential material into
-- before_json / after_json. Those columns are permanent by design, so
-- anything written there can never be unwritten.
-- =====================================================================
CREATE TABLE IF NOT EXISTS event_log (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,

  -- WHO
  actor              TEXT NOT NULL,     -- 'christopher', 'worker:lead-intake',
                                        -- 'claude:gmail-triage', ...
  actor_type         TEXT NOT NULL DEFAULT 'system'
                       CHECK (actor_type IN ('human', 'system', 'claude')),

  -- WHAT
  action             TEXT NOT NULL,     -- 'contact.created', 'deal.stage_changed',
                                        -- 'activity.updated', 'event.corrected', ...

  -- WHICH
  entity_type        TEXT NOT NULL
                       CHECK (entity_type IN (
                         'contact',
                         'deal',
                         'activity',
                         'event_log',
                         'system'
                       )),
  entity_id          TEXT NOT NULL,     -- id of the affected row, or a stable
                                        -- label when entity_type = 'system'

  -- CHANGE. Both may be NULL: a creation has no before, a deletion has
  -- no after, and a pure observation may have neither.
  before_json        TEXT,
  after_json         TEXT,

  -- CORRECTION CHAIN. Set only on a row whose purpose is to correct an
  -- earlier row. The earlier row is left untouched, forever.
  corrects_event_id  INTEGER REFERENCES event_log(id),
  note               TEXT,              -- why, in plain language, especially
                                        -- on a correction

  -- WHEN. occurred_at is when the thing actually happened; recorded_at
  -- is when this row was written. They differ whenever a cron run
  -- discovers something after the fact, which in a polling architecture
  -- is often. Keep both.
  occurred_at        INTEGER NOT NULL,  -- epoch seconds
  recorded_at        INTEGER NOT NULL   -- epoch seconds
);

CREATE INDEX IF NOT EXISTS idx_event_log_entity      ON event_log (entity_type, entity_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_event_log_occurred_at ON event_log (occurred_at);
CREATE INDEX IF NOT EXISTS idx_event_log_actor       ON event_log (actor, occurred_at);
CREATE INDEX IF NOT EXISTS idx_event_log_action      ON event_log (action, occurred_at);
CREATE INDEX IF NOT EXISTS idx_event_log_corrects    ON event_log (corrects_event_id);
