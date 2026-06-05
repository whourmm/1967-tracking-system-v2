PRAGMA foreign_keys = ON;

BEGIN;

-- Track the most recent successful login per user.
ALTER TABLE "user" ADD COLUMN last_login_at TEXT;

COMMIT;
