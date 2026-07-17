BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_gmail_unique
  ON "user" (LOWER(gmail))
  WHERE gmail IS NOT NULL;

COMMIT;
