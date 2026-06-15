PRAGMA foreign_keys = OFF;

BEGIN;

ALTER TABLE assignment_submission RENAME TO assignment_submission_old;

CREATE TABLE assignment_submission (
  assignment_id INTEGER,
  member_id INTEGER,
  submit_status INTEGER NOT NULL DEFAULT 0 CHECK (submit_status IN (0, 1)),
  submitted_at TEXT,
  PRIMARY KEY (assignment_id, member_id),
  FOREIGN KEY (assignment_id) REFERENCES assignment(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES "user"(id) ON DELETE CASCADE
);

INSERT INTO assignment_submission (assignment_id, member_id, submit_status, submitted_at)
SELECT assignment_id, member_id, 1, submitted_at
FROM assignment_submission_old;

DROP TABLE assignment_submission_old;

CREATE TABLE IF NOT EXISTS resource_read (
  resource_id INTEGER,
  member_id INTEGER,
  read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (resource_id, member_id),
  FOREIGN KEY (resource_id) REFERENCES resource(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resource_read_member_id ON resource_read(member_id);

COMMIT;

PRAGMA foreign_keys = ON;
