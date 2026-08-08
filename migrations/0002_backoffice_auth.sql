-- migrations/0002_backoffice_auth.sql
-- SecureProspective back-office members-area: identity, sessions, invites.
-- This database belongs to SecureProspective ONLY. It must never be shared
-- with, or merged into, Tech Freedom Ministries' data store or any other
-- business's data. See feedback_tfm_sp_data_separation in the backbone
-- memory: this is a nonnegotiable data-separation boundary, not a technical
-- convenience call. The auth PATTERN was copied from TFM's members build
-- (reference_cloudflare_d1_auth_pattern); this DATABASE and its rows were not.
--
-- Invite-only, not open self-registration: there is no public /register
-- endpoint. An admin creates an invites row (out-of-band, via a scoped
-- endpoint), sends the accept-invite link to the agent by hand, and the
-- agent sets their own password to redeem it. Invite-link possession is
-- treated as proof of email ownership, so there is no separate
-- email_verification_codes table here (unlike TFM's public-registration
-- flow, which needed one).

-- One row per human. Email is the login handle.
CREATE TABLE IF NOT EXISTS users (
  id                 TEXT PRIMARY KEY,          -- crypto.randomUUID()
  email              TEXT NOT NULL UNIQUE,
  password_hash      TEXT NOT NULL,             -- scrypt: "scrypt$N$r$p$salt$hash"
  role               TEXT NOT NULL DEFAULT 'member',
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  email_verified_at  TEXT                       -- set at invite redemption time
);

-- One row per live session. The token column holds a HASH of the session
-- token, never the token itself.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- One row per outstanding invite. token_hash is sha256(raw token); the raw
-- token only ever lives in the URL sent to the invitee, never stored.
-- A redeemed or expired invite is kept (not deleted) as an audit trail of
-- who was invited and when, but can never be redeemed twice.
CREATE TABLE IF NOT EXISTS invites (
  id           TEXT PRIMARY KEY,          -- crypto.randomUUID()
  email        TEXT NOT NULL UNIQUE,
  token_hash   TEXT NOT NULL UNIQUE,
  created_by   TEXT NOT NULL,             -- free-text identifier, e.g. "christopher"
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at   TEXT NOT NULL,
  redeemed_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user     ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry   ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_invites_expiry    ON invites(expires_at);
