-- migrations/0003_must_change_password.sql
-- Forces a real password change the first time someone logs in with a
-- password an admin chose for them (bootstrap, or an admin-triggered reset
-- via /members/admin's "Set password"). Not set for invite-redeemed
-- accounts, since those passwords are chosen by the member themselves.

ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
