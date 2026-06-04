# Tracking System V2

Sample project structure for a Vite frontend, Go backend, SQLite database, and Docker deployment flow.

## Project Instructions

Use `AGENTS.md` as the project instruction file. If your editor shows `AGENTS(1).md`, that tab is not a file in this workspace; close it and open `AGENTS.md`.

## Setup

Create local environment files:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Initialize the local SQLite database from the base migration:

```powershell
@'
import sqlite3
from pathlib import Path

db_path = Path("backend/data/asean_tracker.db")
schema_path = Path("backend/migrations/001_init.sql")

conn = sqlite3.connect(db_path)
try:
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(schema_path.read_text(encoding="utf-8"))
    print("database initialized:", db_path)
finally:
    conn.close()
'@ | python -
```

Recheck the database:

```powershell
@'
import sqlite3
from pathlib import Path

conn = sqlite3.connect(Path("backend/data/asean_tracker.db"))
try:
    tables = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).fetchall()
    violations = conn.execute("PRAGMA foreign_key_check").fetchall()
    print("tables:", len(tables))
    print("foreign key violations:", len(violations))
finally:
    conn.close()
'@ | python -
```

## Docker Development

Start the full stack:

```powershell
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- SQLite database path inside container: `/app/data/asean_tracker.db`
- SQLite database path on host: `backend/data/asean_tracker.db`

## Database

The base SQLite schema lives in:

```txt
backend/migrations/001_init.sql
```

## Notes

The Docker setup is ready, but the project still needs the real Vite app files and Go module contents before the images can build successfully.
