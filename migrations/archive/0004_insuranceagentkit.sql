-- =====================================================================
-- InsuranceAgentKit — D1 migration 0002
-- =====================================================================
-- STATUS: RUNNING FOR REAL as of 2026-08-09, against a fresh, fully
-- isolated D1 (`secureprospective-insuranceagentkit-db`) inside the
-- secureprospective-site Cloudflare Pages project. Not the sandbox this
-- was drafted in.
--
-- CORRECTED 2026-08-09 (Claude, live-deploy pass): the original draft
-- assumed co-location with SecureProspective's back-office `users` /
-- `sessions` tables ("mirror the existing sessions / email_verification
-- tables") and had `kit_installs.user_id REFERENCES users(id)`. That
-- directly contradicts this project's own locked architecture rule —
-- "its own separate D1 instance... never shares data with TFM or SP's
-- own site" — and D1/SQLite has no cross-database foreign keys anyway,
-- so the reference would never have resolved once actually isolated.
-- Fixed: the `users(id)` foreign keys are dropped (kit_installs itself
-- IS the one-row-per-agent identity — no separate users table exists or
-- is needed, since the wizard has no login/password, only the
-- single-hardcoded-invite-token gate per Gate 2), and this file now
-- defines its OWN local `sessions` table matching exactly what
-- `_lib/session.ts` already assumed, instead of borrowing one that was
-- never actually reachable from this database.
--
-- CONFIDENT / STANDARD:
--   * Table design, column set, and the hash-not-secret convention.
--   * SQLite syntax generally. D1 is SQLite.
--
-- STILL TRUE FROM THE ORIGINAL DRAFT:
--   * Phase D change vs the pass-2 mockup: `retain_google_access` was
--     REMOVED. Roadmap §1.2 + Phase 6 revision 6 (lines ~77, ~104, ~547)
--     ruled revocation UNCONDITIONAL — Gate 1 killed pass 2's Option B
--     opt-in retention checkbox. No column, no toggle, no dead path.
--   * Whether foreign keys are enforced. D1 enables them by default on
--     newer databases, but the ON DELETE CASCADE behaviour should be
--     confirmed with an actual delete before relying on it for
--     data-removal compliance.
--   * This MUST run against SecureProspective's OWN D1 instance, never
--     the sister project's, and never the back-office's either. Data
--     separation is a hard project rule.
-- =====================================================================


-- ---------------------------------------------------------------------
-- sessions
-- Local to this database — NOT the back-office's `sessions` table,
-- which lives in a different D1 entirely and is unreachable from here.
-- Exactly the shape `_lib/session.ts` already assumed.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);


-- ---------------------------------------------------------------------
-- kit_invites
-- Gates who may start the wizard. This is a hand-sold service, not open
-- signup; without this table anyone with the URL could burn our Google
-- OAuth client's quota and create Drive folders on it.
-- The raw token is emailed and NEVER stored — same posture as sessions.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kit_invites (
  token_hash          TEXT PRIMARY KEY,        -- sha256Hex(raw invite token)
  email               TEXT NOT NULL,           -- who it was issued to
  note                TEXT,                    -- free text for Christopher
  created_at          INTEGER NOT NULL,        -- epoch seconds
  expires_at          INTEGER NOT NULL,
  consumed_at         INTEGER,
  consumed_by_user_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_kit_invites_email ON kit_invites (email);


-- ---------------------------------------------------------------------
-- kit_installs
-- One row per agent. The durable record of the whole install.
--
-- `step` is a NAMED enum, deliberately not an integer: inserting a
-- screen later must not teleport every in-flight user. Store the
-- FURTHEST step reached; the UI may navigate backwards freely.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kit_installs (
  user_id                  TEXT PRIMARY KEY,

  step                     TEXT NOT NULL DEFAULT 'registered'
                             CHECK (step IN (
                               'registered',
                               'profile_saved',
                               'google_connected',
                               'provisioned',
                               'handoff_ack',
                               'verified_read',
                               'verified_write',
                               'complete'
                             )),

  -- ---- Screen 4: the ONLY place per-agent facts are collected. -------
  -- Kept as discrete columns where we query them and JSON where we
  -- only ever template them into agency-profile.md.
  agent_display_name       TEXT,
  agency_name              TEXT,
  stated_work_email        TEXT,   -- what the agent TYPED (a hint only)
  profile_json             TEXT,   -- states, lines, carriers, disclaimer

  -- ---- Google authorization ① (SecureProspective's own) --------------
  -- NOTE FOR FUTURE READERS: this is NOT the claude.ai connector token.
  -- See LEVEL 3 of tom-findings-wizard-design.md. They are different
  -- tokens, different scopes, held by different companies.
  google_email             TEXT,   -- AUTHORITATIVE: from Google's id_token,
                                   -- never from what the user typed
  google_sub               TEXT,   -- stable Google subject id
  google_scope             TEXT,   -- scopes actually granted
  google_refresh_token_enc TEXT,   -- 'v1.<iv_b64url>.<ct_b64url>', AES-GCM
                                   -- AAD = user_id. NULL once revoked.
  google_connected_at      INTEGER,
  google_revoked_at        INTEGER,

  -- Access tokens are deliberately NOT stored. They live ~1 hour and we
  -- need one for ~3 seconds, a few times per install. Minting on demand
  -- is one extra round trip and one fewer secret at rest.

  -- ---- Provisioning results ------------------------------------------
  drive_folder_id          TEXT,
  drive_folder_url         TEXT,
  -- The name the folder was ACTUALLY created with. Stored rather than
  -- recomputed from agency_name, because the agent can edit his agency
  -- name on screen 1 after provisioning and we never rename the Drive
  -- folder. Wizard screen 3 tells him which name to expect in Anthropic's
  -- folder-confirmation dialog, and a recomputed name would tell him to
  -- expect one that is not there — turning that screen's one real safety
  -- instruction into noise.
  drive_folder_name        TEXT,
  provisioned_at           INTEGER,

  -- ---- Screen 8 proof-of-life ----------------------------------------
  setup_code               TEXT,    -- four words, e.g. 'harbor-lantern-quiet-fern'
  setup_code_attempts      INTEGER NOT NULL DEFAULT 0,  -- rate limiting
  verified_read_at         INTEGER,
  verified_write_at        INTEGER,

  created_at               INTEGER NOT NULL,
  updated_at               INTEGER NOT NULL,
  completed_at             INTEGER
);

CREATE INDEX IF NOT EXISTS idx_kit_installs_google_email
  ON kit_installs (google_email);


-- ---------------------------------------------------------------------
-- kit_install_files
-- (user_id, logical_path) -> drive_file_id
--
-- This table is what makes provisioning idempotent, and therefore what
-- makes "continue where you left off" and one-click support repair
-- possible. Without it, a re-run creates a SECOND folder tree, which is
-- the single worst outcome for this user: no error appears and their
-- notes quietly split across two places.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kit_install_files (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        TEXT NOT NULL REFERENCES kit_installs(user_id) ON DELETE CASCADE,
  logical_path   TEXT NOT NULL,   -- 'identity/agency-profile.md', '' = root
  kind           TEXT NOT NULL CHECK (kind IN ('folder', 'file')),
  drive_file_id  TEXT NOT NULL,
  created_at     INTEGER NOT NULL,
  UNIQUE (user_id, logical_path)
);


-- ---------------------------------------------------------------------
-- kit_oauth_states
-- Short-lived CSRF state + PKCE verifier for the Google round trip.
-- Single-use: DELETE on read. TTL 10 minutes.
--
-- Binding the state to user_id is what prevents an attacker from
-- grafting their own Google account onto someone else's install.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kit_oauth_states (
  state_hash        TEXT PRIMARY KEY,   -- sha256Hex(raw state)
  user_id           TEXT NOT NULL REFERENCES kit_installs(user_id) ON DELETE CASCADE,
  code_verifier_enc TEXT NOT NULL,      -- AES-GCM sealed, AAD = user_id
  created_at        INTEGER NOT NULL,
  expires_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kit_oauth_states_expires
  ON kit_oauth_states (expires_at);


-- ---------------------------------------------------------------------
-- kit_audit_log
-- Append-only. Worth building at one customer, because the customer is
-- a licensed professional whose regulator or E&O carrier may one day
-- ask what an AI system did with client data. Cheap now, impossible to
-- reconstruct later.
--
-- Never write client PII or token material into detail_json.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kit_audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT,
  at          INTEGER NOT NULL,
  event       TEXT NOT NULL,   -- 'install.created', 'google.connected',
                               -- 'google.refreshed', 'drive.file_created',
                               -- 'verify.read.pass', 'google.revoked', ...
  detail_json TEXT,
  ip_hash     TEXT             -- sha256Hex(CF-Connecting-IP); not the IP
);

CREATE INDEX IF NOT EXISTS idx_kit_audit_user_at
  ON kit_audit_log (user_id, at);
