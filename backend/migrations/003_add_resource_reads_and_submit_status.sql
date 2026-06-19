BEGIN;

ALTER TABLE assignment_submission
  ADD COLUMN IF NOT EXISTS submit_status INTEGER NOT NULL DEFAULT 0;

ALTER TABLE assignment_submission
  ALTER COLUMN submitted_at DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'assignment_submission_submit_status_check'
  ) THEN
    ALTER TABLE assignment_submission
      ADD CONSTRAINT assignment_submission_submit_status_check
      CHECK (submit_status IN (0, 1));
  END IF;
END $$;

UPDATE assignment_submission
SET submit_status = 1
WHERE submitted_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS resource_read (
  resource_id INTEGER,
  member_id INTEGER,
  read_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (resource_id, member_id),
  FOREIGN KEY (resource_id) REFERENCES resource(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resource_read_member_id ON resource_read(member_id);

COMMIT;
