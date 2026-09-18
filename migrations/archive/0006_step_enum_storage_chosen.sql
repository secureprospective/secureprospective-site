-- =====================================================================
-- secureprospective — D1 migration 0006: 'storage_chosen' step value (InsuranceAgentKit 0004, renumbered)
-- =====================================================================
-- STATUS: WRITTEN, NOT YET APPLIED. Same posture as 0003: the target
-- database is live and carries a real row, so this is not a fresh
-- create.
--
-- WHY THIS EXISTS (research/wizard-reshape-r2-blocker.md, full analysis)
-- ---------------------------------------------------------------------
-- Two of screen 2's three paths (native Google connector, local folder)
-- never run drive-provision.ts — nothing is created on our side for
-- either of them. Without an honest `step` value for "screen 2
-- answered, nothing provisioned," wizard-flow.js has no route to screen
-- 3 for these two paths.
--
-- `kit_installs.step`'s CHECK is a column constraint baked into
-- CREATE TABLE. SQLite cannot ALTER a CHECK in place — adding a value
-- means rebuilding the table (create-new / copy / drop / rename), which
-- is what this file does.
--
-- DECISION (Claude, head brain, 2026-08-09 night, adopting Tom's own
-- recommendation): do this now, while kit_installs holds exactly one
-- real row (Christopher's, from the live walkthrough) — the cheapest
-- this rebuild will ever be. See WIZARD_RESHAPE_TASKS.md R2 and the
-- blocker doc for the two options this rejected and why.
--
-- WHAT CHANGES
-- ---------------------------------------------------------------------
-- Only the `step` CHECK's allowed values, adding 'storage_chosen'
-- between 'google_connected' and 'provisioned' (the point in the
-- sequence where a delegated path's screen 2 hands off to screen 3,
-- having provisioned nothing). Every other column, index, and
-- constraint is copied byte-for-byte from 0002+0003's cumulative shape.
--
-- 'storage_chosen' is set by the new functions/api/wizard/
-- set-storage-mode.ts route (R2), used only by the two delegated paths.
-- The scoped path continues straight from 'google_connected' to
-- 'provisioned' via the existing OAuth-callback -> provision.ts flow,
-- unchanged — it does not pass through 'storage_chosen'.
--
-- VERIFIED, not assumed: this file was executed against Node's built-in
-- node:sqlite (3.51.3) before commit, against a DB seeded to reproduce
-- 0002+0003's cumulative shape plus a pre-existing row. Confirmed: the
-- rebuild preserves the existing row (all columns, including step and
-- the 0003 capability-state columns) with no data loss; 'storage_chosen'
-- is now a valid step value; the old CHECK still rejects bogus step
-- values; the four 0003 CHECK/default behaviors (storage_location,
-- drive_scope, gmail_connected, calendar_connected) are unchanged.
-- =====================================================================

PRAGMA foreign_keys = OFF;

CREATE TABLE kit_installs_new (
  user_id                  TEXT PRIMARY KEY,

  step                     TEXT NOT NULL DEFAULT 'registered'
                             CHECK (step IN (
                               'registered',
                               'profile_saved',
                               'google_connected',
                               'storage_chosen',
                               'provisioned',
                               'handoff_ack',
                               'verified_read',
                               'verified_write',
                               'complete'
                             )),

  agent_display_name       TEXT,
  agency_name               TEXT,
  stated_work_email        TEXT,
  profile_json             TEXT,

  google_email             TEXT,
  google_sub               TEXT,
  google_scope             TEXT,
  google_refresh_token_enc TEXT,
  google_connected_at      INTEGER,
  google_revoked_at        INTEGER,

  drive_folder_id          TEXT,
  drive_folder_url         TEXT,
  drive_folder_name        TEXT,
  provisioned_at           INTEGER,

  setup_code               TEXT,
  setup_code_attempts      INTEGER NOT NULL DEFAULT 0,
  verified_read_at         INTEGER,
  verified_write_at        INTEGER,

  -- 0003's capability-state columns, carried over unchanged. Same two
  -- per-column CHECKs; 0003's own header note about them not catching
  -- cross-column incoherence still applies and is unaffected by this
  -- rebuild — the writing route (set-storage-mode.ts) is still where
  -- coherence is enforced, in one statement.
  storage_location          TEXT CHECK (storage_location IN ('drive', 'local')),
  drive_scope               TEXT CHECK (drive_scope IN ('scoped', 'full')),
  gmail_connected           INTEGER NOT NULL DEFAULT 0,
  calendar_connected        INTEGER NOT NULL DEFAULT 0,

  created_at               INTEGER NOT NULL,
  updated_at               INTEGER NOT NULL,
  completed_at              INTEGER
);

INSERT INTO kit_installs_new (
  user_id, step, agent_display_name, agency_name, stated_work_email, profile_json,
  google_email, google_sub, google_scope, google_refresh_token_enc,
  google_connected_at, google_revoked_at,
  drive_folder_id, drive_folder_url, drive_folder_name, provisioned_at,
  setup_code, setup_code_attempts, verified_read_at, verified_write_at,
  storage_location, drive_scope, gmail_connected, calendar_connected,
  created_at, updated_at, completed_at
)
SELECT
  user_id, step, agent_display_name, agency_name, stated_work_email, profile_json,
  google_email, google_sub, google_scope, google_refresh_token_enc,
  google_connected_at, google_revoked_at,
  drive_folder_id, drive_folder_url, drive_folder_name, provisioned_at,
  setup_code, setup_code_attempts, verified_read_at, verified_write_at,
  storage_location, drive_scope, gmail_connected, calendar_connected,
  created_at, updated_at, completed_at
FROM kit_installs;

DROP TABLE kit_installs;
ALTER TABLE kit_installs_new RENAME TO kit_installs;

CREATE INDEX IF NOT EXISTS idx_kit_installs_google_email
  ON kit_installs (google_email);

PRAGMA foreign_keys = ON;

-- =====================================================================
-- Applying this
-- =====================================================================
-- Apply AFTER 0003, same live database, same command shape:
--   wrangler d1 migrations apply secureprospective-insuranceagentkit-db --remote
--
-- Rehearse on Preview first — this drops and recreates a table that
-- carries a real row (kit_install_files/kit_oauth_states hold FK
-- references to kit_installs(user_id); PRAGMA foreign_keys=OFF during
-- the rebuild and back ON after is what keeps the DROP from being
-- rejected and keeps those references valid once the table exists again
-- under the same name).
--
-- After applying, confirm with:
--   wrangler d1 execute <db> --remote --command "PRAGMA table_info(kit_installs);"
--   wrangler d1 execute <db> --remote --command "SELECT user_id, step FROM kit_installs;"
-- and check the existing row's step and all other values are unchanged.
-- =====================================================================
