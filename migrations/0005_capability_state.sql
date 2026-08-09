-- =====================================================================
-- secureprospective — D1 migration 0005: capability state (InsuranceAgentKit 0003, renumbered)
-- =====================================================================
-- STATUS: WRITTEN, NOT YET APPLIED. Unlike 0002 at the time it was
-- drafted, the target database is now LIVE and carries real rows
-- (`secureprospective-insuranceagentkit-db`, bound as KIT_DB, applied
-- 2026-08-09). So this is an ALTER against a table with real data in it,
-- not a fresh create — see "Applying this" at the bottom.
--
-- WHY THIS EXISTS
-- ---------------------------------------------------------------------
-- The wizard's screen 2 (Connect Google) becomes a genuine three-way
-- choice rather than one path with two footnotes:
--
--   1. This kit's own OAuth, `drive.file` scope  -> drive  / scoped
--   2. Anthropic's native Google Drive connector -> drive  / full
--   3. A local folder on the agent's machine     -> local  / NULL
--
-- Screens 3 and 4 are then ONE component each, reading this state and
-- adapting — not three hardcoded variants apiece. The point of storing
-- it as capability state rather than as a "which screen did they take"
-- marker is that adding a fourth connection path later should need new
-- flag VALUES, not new branches in every downstream screen.
--
-- Design source: research/wizard-reshape-brief.md §3, which records the
-- decision verbatim ("downstream screens should be driven by a
-- capability state (what was actually granted), not hardcoded per-path
-- branches").
--
-- ADDITIVE ONLY, AND DELIBERATELY SO
-- ---------------------------------------------------------------------
-- Same discipline as 0002's note on the `step` enum being a named string
-- rather than an integer: "inserting a screen later must not teleport
-- every in-flight user." Nothing here drops, renames, or rewrites an
-- existing column, and every added column is either nullable or has a
-- default — so every row that already exists stays valid and unchanged
-- the moment this runs. There is one such row today (Christopher's own
-- install, used for the live walkthrough), and it must survive this.
--
-- NOTE ON THE CHECK CONSTRAINTS
-- ---------------------------------------------------------------------
-- A CHECK whose expression evaluates to NULL PASSES in SQLite — only an
-- explicitly false result rejects. So `storage_location IN
-- ('drive','local')` does not reject the NULLs that every pre-existing
-- row will have; it only constrains rows that actually set a value.
-- That is the behaviour we want here (an install that has not reached
-- screen 2 yet has no storage location, and that is not an error), but
-- it does mean the constraint is NOT a substitute for the application
-- checking that the value is present before screens 3/4 branch on it.
--
-- WHAT THESE CONSTRAINTS DO *NOT* CATCH — read before branching on them
-- ---------------------------------------------------------------------
-- Each CHECK constrains ONE column in isolation. Nothing here enforces
-- the relationship BETWEEN storage_location and drive_scope, so both of
-- these incoherent rows are accepted by the database today (verified,
-- not assumed — both were executed against real SQLite):
--
--   storage_location='local'  + drive_scope='scoped'   <- nonsense
--   storage_location='drive'  + drive_scope=NULL       <- incomplete
--
-- That is a real limitation of ALTER TABLE ADD COLUMN in SQLite: a
-- table-level CHECK spanning two columns cannot be added to an existing
-- table without rebuilding it (create-new/copy/drop/rename), and
-- rebuilding a live table carrying a real install is a far bigger risk
-- than the one it would remove.
--
-- So coherence is the WRITING code's job — the single route that sets
-- these must set both columns together, in one statement, from one
-- decision. Screens 3/4 should treat an incoherent pair as "screen 2 is
-- not finished" and route back to it, rather than guessing which of the
-- two columns to believe.
--
-- VERIFIED, not assumed: this file was executed against real SQLite
-- 3.46.1 before commit — the ALTERs apply, a pre-existing row survives
-- with its step and NULLs intact, all three real capability combinations
-- (drive/scoped, drive/full, local/NULL) are accepted, and bad values
-- ('dropbox', 'readonly', empty string, NULL into the flags) are all
-- rejected.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Where the brain folder actually lives.
--
-- 'drive' — a folder in the agent's Google Drive.
-- 'local' — a folder on the agent's own machine, reached through Claude
--           Desktop's ordinary local file access. Nothing of ours talks
--           to Google at all on this path.
--
-- NULL until screen 2 is answered.
-- ---------------------------------------------------------------------
ALTER TABLE kit_installs
  ADD COLUMN storage_location TEXT
    CHECK (storage_location IN ('drive', 'local'));


-- ---------------------------------------------------------------------
-- How much of Drive the assistant can see. Only meaningful when
-- storage_location = 'drive'; stays NULL for 'local'.
--
-- 'scoped' — this kit's own OAuth grant, `drive.file`. Per-file by
--            construction: the app can only ever see files it created
--            itself, so it sees the one folder it made and nothing else
--            in the agent's Drive.
--
-- 'full'   — Anthropic's native Google Drive connector. Zero setup on
--            our side, and it can create folders rather than only read
--            them — but Google's connector model has no per-folder
--            delegation, so it requests visibility over the agent's
--            ENTIRE Drive to work with one folder in it.
--
-- Be careful with this distinction in user-facing copy. It describes
-- what each grant can REACH. It is not a claim that the assistant is
-- fenced into the folder on the 'scoped' path — the folder fence is a
-- prompt-level instruction, not a capability boundary (panel finding #1,
-- pending Phase 0 test T8). Screen 2 is the exact surface where that
-- gets said to a real user, so it gets said accurately there.
-- ---------------------------------------------------------------------
ALTER TABLE kit_installs
  ADD COLUMN drive_scope TEXT
    CHECK (drive_scope IN ('scoped', 'full'));


-- ---------------------------------------------------------------------
-- Screen 4's two connector flags. 0 = not connected, 1 = connected.
--
-- SQLite has no boolean type; INTEGER 0/1 is the standard spelling and
-- matches how the rest of this schema stores flags.
--
-- These are SELF-REPORTED, not observed. There is no API into claude.ai
-- and no way for this server to see which connectors an agent turned on.
-- A 1 here means the agent told us he did it — which is worth recording
-- so screen 4 does not ask him twice across sessions, and is NOT worth
-- treating as verification. Any UI reading these must not imply we
-- checked. (Same posture as verify.write.selfreport in the audit log:
-- both are legitimate records, only one kind is evidence we produced.)
--
-- NOT NULL DEFAULT 0 is safe on ALTER in SQLite because the default is a
-- constant — every existing row gets 0, which is the truthful starting
-- value for all of them.
-- ---------------------------------------------------------------------
ALTER TABLE kit_installs
  ADD COLUMN gmail_connected INTEGER NOT NULL DEFAULT 0;

ALTER TABLE kit_installs
  ADD COLUMN calendar_connected INTEGER NOT NULL DEFAULT 0;


-- =====================================================================
-- Applying this
-- =====================================================================
-- NOT RUN YET. 0002 is already live, so this ALTERs a real table:
--
--   wrangler d1 migrations apply secureprospective-insuranceagentkit-db --remote
--
-- from the secureprospective-site Pages project, NEVER against the
-- back-office or TFM databases — the separate-database-per-app rule is
-- a hard project constraint, and this file names kit_installs, which
-- only exists in the kit's own D1.
--
-- Worth doing first on the Preview binding, which points at the same
-- isolated database family and gives a real ALTER a rehearsal.
--
-- After applying, confirm with:
--   wrangler d1 execute <db> --remote --command "PRAGMA table_info(kit_installs);"
-- and check the four new columns are present and that the existing
-- install row still reads back with its original step value intact.
-- =====================================================================
