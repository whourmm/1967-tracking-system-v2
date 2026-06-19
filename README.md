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

Start the full stack:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- PostgreSQL: `localhost:5432`
- Database name: `asean_tracker`

## Environment Variables

Frontend:

```txt
VITE_API_BASE_URL=http://localhost:8080
```

Backend:

```txt
APP_ENV=development
PORT=8080
DATABASE_URL=postgres://postgres:postgres@db:5432/asean_tracker?sslmode=disable
MIGRATIONS_PATH=/app/migrations
```

For non-Docker local backend runs, use a localhost PostgreSQL URL such as:

```txt
DATABASE_URL=postgres://postgres:postgres@localhost:5432/asean_tracker?sslmode=disable
MIGRATIONS_PATH=backend/migrations
```

## Backend API

Current minimal endpoints:

```txt
GET /api/health
GET /api/fellows
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

```bash
cd frontend
npm run build
```

Backend:

```bash
cd backend
go test ./...
```

## Notes

- Do not commit real `.env` files.
- Do not commit real production database credentials or dumps.
- Use `AGENTS.md` for project-specific Codex instructions.
- The Fellow portal currently has real dashboard, assignments, learning-system, and placeholder teams pages.
- The Admin portal currently has dashboard, cases, resources, and sprint screens plus placeholders for some future sections.
