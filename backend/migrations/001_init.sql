PRAGMA foreign_keys = ON;

BEGIN;

CREATE TABLE IF NOT EXISTS cohort (
  id INTEGER PRIMARY KEY,
  name TEXT,
  start_date TEXT,
  end_date TEXT,
  presentation_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "user" (
  id INTEGER PRIMARY KEY,
  name TEXT,
  role TEXT CHECK (role IS NULL OR role IN ('fellow', 'admin', 'PO')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  discord_name TEXT,
  line_id TEXT,
  phone TEXT,
  linkedin TEXT,
  photo_url TEXT,
  country TEXT,
  update_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  gmail TEXT
);

CREATE TABLE IF NOT EXISTS admin (
  user_id INTEGER PRIMARY KEY,
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fellow (
  user_id INTEGER PRIMARY KEY,
  team_id INTEGER,
  university TEXT,
  major TEXT,
  status TEXT CHECK (status IS NULL OR status IN ('confirmed', 'pending', 'dropped')),
  group_id INTEGER,
  teamflow TEXT,
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES team(id) ON DELETE SET NULL,
  FOREIGN KEY (group_id) REFERENCES "group"(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sprint (
  id INTEGER PRIMARY KEY,
  cohort_id INTEGER,
  name TEXT,
  description TEXT,
  starts_on TEXT,
  submission_deadline TEXT,
  is_current INTEGER NOT NULL DEFAULT 0 CHECK (is_current IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (cohort_id) REFERENCES cohort(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "group" (
  id INTEGER PRIMARY KEY,
  cohort_id INTEGER,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  case_id INTEGER,
  update_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  start_date TEXT,
  end_date TEXT,
  created_by INTEGER,
  FOREIGN KEY (cohort_id) REFERENCES cohort(id) ON DELETE CASCADE,
  FOREIGN KEY (case_id) REFERENCES "case"(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS team (
  id INTEGER PRIMARY KEY,
  group_id INTEGER,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  case_id INTEGER,
  update_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (group_id) REFERENCES "group"(id) ON DELETE CASCADE,
  FOREIGN KEY (case_id) REFERENCES "case"(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS mentor (
  user_id INTEGER,
  team_id INTEGER,
  PRIMARY KEY (user_id, team_id),
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES team(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "case" (
  id INTEGER PRIMARY KEY,
  cohort_id INTEGER,
  sprint_id INTEGER,
  title TEXT,
  case_owner TEXT,
  status TEXT,
  summary TEXT,
  file_name TEXT,
  published_date TEXT,
  googledrive_link TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  theme TEXT,
  create_by INTEGER,
  FOREIGN KEY (cohort_id) REFERENCES cohort(id) ON DELETE CASCADE,
  FOREIGN KEY (sprint_id) REFERENCES sprint(id) ON DELETE SET NULL,
  FOREIGN KEY (create_by) REFERENCES "user"(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS assignment (
  id INTEGER PRIMARY KEY,
  cohort_id INTEGER,
  sprint_id INTEGER,
  title TEXT,
  form_url TEXT,
  deadline TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (cohort_id) REFERENCES cohort(id) ON DELETE CASCADE,
  FOREIGN KEY (sprint_id) REFERENCES sprint(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS assignment_submission (
  assignment_id INTEGER,
  member_id INTEGER,
  submit_status INTEGER NOT NULL DEFAULT 0 CHECK (submit_status IN (0, 1)),
  submitted_at TEXT,
  PRIMARY KEY (assignment_id, member_id),
  FOREIGN KEY (assignment_id) REFERENCES assignment(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resource (
  id INTEGER PRIMARY KEY,
  type TEXT CHECK (type IS NULL OR type IN ('CASE', 'LECTURE', 'ARTICLE')),
  name TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS resource_read (
  resource_id INTEGER,
  member_id INTEGER,
  read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (resource_id, member_id),
  FOREIGN KEY (resource_id) REFERENCES resource(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api (
  id INTEGER PRIMARY KEY,
  assignment_id INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES assignment(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  cohort_id INTEGER,
  name TEXT,
  description TEXT,
  user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  create_by INTEGER,
  FOREIGN KEY (cohort_id) REFERENCES cohort(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE SET NULL,
  FOREIGN KEY (create_by) REFERENCES "user"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_cohort_created_by ON cohort(created_by);
CREATE INDEX IF NOT EXISTS idx_fellow_team_id ON fellow(team_id);
CREATE INDEX IF NOT EXISTS idx_fellow_group_id ON fellow(group_id);
CREATE INDEX IF NOT EXISTS idx_sprint_cohort_id ON sprint(cohort_id);
CREATE INDEX IF NOT EXISTS idx_group_cohort_id ON "group"(cohort_id);
CREATE INDEX IF NOT EXISTS idx_group_case_id ON "group"(case_id);
CREATE INDEX IF NOT EXISTS idx_team_group_id ON team(group_id);
CREATE INDEX IF NOT EXISTS idx_team_case_id ON team(case_id);
CREATE INDEX IF NOT EXISTS idx_case_cohort_id ON "case"(cohort_id);
CREATE INDEX IF NOT EXISTS idx_case_sprint_id ON "case"(sprint_id);
CREATE INDEX IF NOT EXISTS idx_assignment_cohort_id ON assignment(cohort_id);
CREATE INDEX IF NOT EXISTS idx_assignment_sprint_id ON assignment(sprint_id);
CREATE INDEX IF NOT EXISTS idx_resource_created_by ON resource(created_by);
CREATE INDEX IF NOT EXISTS idx_resource_read_member_id ON resource_read(member_id);
CREATE INDEX IF NOT EXISTS idx_api_assignment_id ON api(assignment_id);
CREATE INDEX IF NOT EXISTS idx_events_cohort_id ON events(cohort_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);

COMMIT;
