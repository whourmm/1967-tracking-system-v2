# Tracking System V2

Full-stack cohort tracking app for the ASEAN 1967 Fellowship.

The app is split into separate route areas:

- Public area: planned
- Fellow area: `/fellow`
- Admin area: `/admin`

The current default route redirects to the Fellow portal.

## Tech Stack

- Frontend: Vite, React, TypeScript, Tailwind CSS
- Backend: Go
- Database: PostgreSQL
- Local full-stack option: Docker Compose

## Current Routes

Fellow:

```txt
/fellow
/fellow/assignments
/fellow/learning
/fellow/teams
```

Admin:

```txt
/admin
/admin/cases
/admin/resources
/admin/sprints
/admin/events
/admin/teams
/admin/fellows
/admin/assignments
```

## Setup

Create local environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Download backend dependencies:

```bash
cd backend
go mod download
```

## Run Locally

Start the backend API:

```bash
cd backend
go run ./cmd/api
```

Backend API:

```txt
http://localhost:8080
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Frontend:

```txt
http://localhost:5173
```

## Docker Development

For a clean hosted backend and database deployment, see [Google Cloud Run and Supabase Setup](docs/CLOUD_RUN_SUPABASE_SETUP.md).

Start the backend stack in the background:

```powershell
docker compose up -d db backend
```

Rebuild and start the backend stack:

```powershell
docker compose up -d --build db backend
```

Start the full stack:

```powershell
docker compose up -d --build
```

Reset the local PostgreSQL volume after schema changes:

```powershell
docker compose down -v
docker compose up -d --build db backend
```

Services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- PostgreSQL: `localhost:5432`
- Database name: `asean_tracker`

Backend logs:

```powershell
docker compose logs -f backend
```

## Environment Variables

Frontend:

```txt
VITE_API_BASE_URL=http://localhost:8080
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Backend:

```txt
APP_ENV=development
PORT=8080
DATABASE_URL=postgres://postgres:postgres@db:5432/asean_tracker?sslmode=disable
MIGRATIONS_PATH=/app/migrations
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

For non-Docker local backend runs, use a localhost PostgreSQL URL such as:

```txt
DATABASE_URL=postgres://postgres:postgres@localhost:5432/asean_tracker?sslmode=disable
MIGRATIONS_PATH=backend/migrations
```

## Backend API

Implemented endpoints:

```txt
GET /api/health
GET /api/fellows
GET /api/admin/overview
GET /api/cases
GET /api/admin/cases
GET /api/admin/cases/{caseId}
POST /api/admin/cases
PATCH /api/admin/cases/{caseId}
DELETE /api/admin/cases/{caseId}
GET /api/cohorts/active/sprints
GET /api/admin/sprints
GET /api/admin/sprints/{sprintId}
POST /api/admin/sprints
PATCH /api/admin/sprints/{sprintId}
DELETE /api/admin/sprints/{sprintId}
GET /api/resources
GET /api/admin/resources
GET /api/admin/resources/{resourceId}
POST /api/admin/resources
PATCH /api/admin/resources/{resourceId}
DELETE /api/admin/resources/{resourceId}
GET /api/admin/resources/read-status
```

Planned API paths are registered as skeleton routes and return `501 Not Implemented`:

```json
{
  "data": null,
  "error": "not implemented"
}
```

The backend connects to PostgreSQL, applies SQL migrations on startup, and seeds demo fellow data when the database is empty. The base schema lives in:

```txt
backend/migrations/001_init.sql
```

API documentation:

```txt
docs/API.md
```

## Verification

Frontend:

```powershell
cd frontend
npm run build
```

Backend:

```powershell
cd backend
go test ./...
```

Run Go commands from `backend`, not the repo root.

API smoke test:

```powershell
curl.exe http://localhost:8080/api/health
curl.exe http://localhost:8080/api/fellows
curl.exe http://localhost:8080/api/admin/overview
curl.exe http://localhost:8080/api/admin/cases
curl.exe http://localhost:8080/api/admin/sprints
curl.exe http://localhost:8080/api/admin/resources
```

Database migration check:

```powershell
docker compose exec db psql -U postgres -d asean_tracker -c "select version from schema_migrations;"
```

Expected migration version:

```txt
001_init.sql
```

## Notes

- Do not commit real `.env` files.
- Do not commit real production database credentials or dumps.
- Use `AGENTS.md` for project-specific Codex instructions.
- The Fellow portal currently has real dashboard, assignments, learning-system, and placeholder teams pages.
- The Admin portal currently has dashboard, cases, resources, and sprint screens plus placeholders for some future sections.
