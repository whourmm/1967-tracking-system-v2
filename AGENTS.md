# AGENTS.md

## Project Name

`tracking-system-v2`

This is a full-stack tracking system project. The goal is to build a maintainable web app with separate public, fellow, and admin areas.

This project may start from a suggested structure, but the structure is not fixed forever. Codex may adjust the structure when there is a good reason, as long as the project stays clean, readable, and easy to maintain.

---

## Tech Stack

Current planned stack:

- Frontend: Vite + React
- Backend: Golang
- Database: PostgreSQL
- Local/Server Environment: Docker VM
- Main Deployment Target: Azure
- Backup Deployment Target: Vercel

The stack can evolve later if the user asks. Do not introduce major new frameworks, databases, or deployment systems unless there is a clear reason or the user requests it.

---

## Main Project Idea

The app has three main user areas:

- Public area
  - Landing page
  - Application page

- Fellow area
  - Fellow dashboard
  - Fellows roster
  - Teams
  - My submissions

- Admin area
  - Admin dashboard
  - Fellow management
  - Team builder
  - Form tracker
  - Case management

Keep these areas logically separated, even if the exact folder structure changes later.

---

## Database Schema (Source of Truth)

The database schema is the source of truth for the project's data model.

Authoritative files:

```txt
schema.dbml                      # human-readable schema (DBML) — read this first
backend/migrations/001_init.sql  # the SQL that creates the same tables
```

These two must stay in sync. They currently define these tables:

```txt
cohort, user, admin, mentor, fellow, sprint, group, team,
case, assignment, assignment_submission, resource, api, events
```

Rules:

- Before creating a new feature or editing existing behavior, read `schema.dbml`
  (and `backend/migrations/001_init.sql`) and make the work consistent with it.
- Match real table names, column names, types, and relationships. Do not invent
  fields or rename existing ones casually.
- Frontend `types/` and mock data should mirror the schema's entities and fields
  so the mock layer maps cleanly onto the real backend later.
- API request/response shapes should reflect schema entities and relationships.
- If a feature genuinely needs a schema change, update **both** `schema.dbml`
  and the SQL migration together, keep them in sync, and call out the change
  explicitly in your summary.
- Do not silently diverge the code's data model from the schema. If the schema
  looks wrong or incomplete for the requested feature, surface it instead of
  guessing.

---

## Suggested Starting Structure

This is the preferred initial structure, but it is flexible.

Use this structure when starting the project from zero:

```txt
tracking-system-v2/
│
├── frontend/                 # Vite React app
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   │
│   │   ├── routes/
│   │   │   ├── PublicRoutes.tsx
│   │   │   ├── FellowRoutes.tsx
│   │   │   └── AdminRoutes.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   ├── fellow/
│   │   │   └── admin/
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── ui/
│   │   │   └── shared/
│   │   │
│   │   ├── lib/
│   │   └── types/
│   │
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
│
├── backend/                  # Go API
│   ├── cmd/
│   │   └── api/
│   │       └── main.go
│   │
│   ├── internal/
│   │   ├── database/
│   │   ├── models/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   └── routes/
│   │
│   ├── data/
│   ├── go.mod
│   ├── go.sum
│   └── .env.example
│
├── README.md
├── AGENTS.md
└── .gitignore
```

---

## Flexible Structure Rules

Codex does not need to follow the suggested structure exactly if the project changes.

Acceptable changes:

- Add new folders when they make the code easier to understand.
- Rename files if the new names are clearer.
- Split large files into smaller files.
- Add a `services/` folder if backend logic becomes too large for handlers.
- Add a `hooks/` folder if frontend React hooks are needed.
- Add a `schemas/` or `validation/` folder if validation becomes important.
- Add a `config/` folder if configuration grows.
- Add a `migrations/` folder if database schema changes need tracking.
- Add Docker files only when deployment or container setup is requested.
- Add deployment folders only when Azure or Vercel setup is requested.

Avoid unnecessary changes:

- Do not rename folders just for style.
- Do not add complex architecture too early.
- Do not create many empty folders without a near-term purpose.
- Do not move files around if it makes the project harder to understand.
- Do not introduce a framework-specific structure unless the project actually uses that framework.

When changing the structure, explain why the change was made.

---

## Frontend Guidance

Frontend should live in:

```txt
frontend/
```

Preferred frontend approach:

- Use Vite React.
- Use TypeScript if the project is initialized with TypeScript.
- Use React Router for routing unless another router is already installed.
- Keep public, fellow, and admin pages logically separated.
- Keep reusable components separate from page components.
- Keep API helper code in a central place such as `src/lib/api.ts`.
- Keep auth helper code in a central place such as `src/lib/auth.ts`.

Suggested frontend folders:

```txt
frontend/src/routes/
frontend/src/pages/
frontend/src/components/
frontend/src/lib/
frontend/src/types/
```

Optional frontend folders if needed later:

```txt
frontend/src/hooks/
frontend/src/context/
frontend/src/features/
frontend/src/assets/
frontend/src/styles/
frontend/src/constants/
```

Do not create optional folders unless they are useful.

### Responsive Design Guidance

Responsive behavior is documented in:

```txt
RESPONSIVE.md
```

Rules:

- Before creating or editing responsive behavior, mobile layouts, tablet layouts,
  narrow-width navigation, overflow fixes, adaptive cards/lists, or viewport
  behavior, read `RESPONSIVE.md`.
- Follow `RESPONSIVE.md` for minimum viewport support, phone/tablet/desktop
  layout patterns, bottom navigation behavior, overflow prevention, and testing.
- The fellow portal is the current reference implementation.
- When applying responsive work to the admin portal later, use the admin guidance
  in `RESPONSIVE.md` instead of simply shrinking desktop tables.
- Verify responsive work at the viewport widths listed in `RESPONSIVE.md` and
  mention any intentional exception in the summary.

---

## Backend Guidance

Backend should live in:

```txt
backend/
```

Preferred backend approach:

- Use Go.
- Keep the app entry point in `backend/cmd/api/main.go`.
- Keep private application code inside `backend/internal`.
- Keep database code separate from HTTP handlers.
- Keep route registration separate from handler implementation.
- Keep middleware separate from handlers.
- Use PostgreSQL as the database.

Suggested backend folders:

```txt
backend/internal/database/
backend/internal/models/
backend/internal/handlers/
backend/internal/middleware/
backend/internal/routes/
```

Optional backend folders if needed later:

```txt
backend/internal/services/
backend/internal/repositories/
backend/internal/validation/
backend/internal/config/
backend/internal/auth/
backend/migrations/
backend/scripts/
```

Do not create optional backend layers too early. Start simple, then refactor when the project becomes harder to manage.

---

## Routing Guidance

The frontend should support these route groups.

Public:

```txt
/
 /apply
```

Fellow:

```txt
/fellow
/fellow/roster
/fellow/teams
/fellow/submissions
```

Admin:

```txt
/admin
/admin/fellows
/admin/teams
/admin/forms
/admin/cases
```

Route names can change if the user changes the product requirements.

Keep route definitions readable. Do not put large page logic inside route files.

---

## API Guidance

Use simple REST-style API endpoints unless the user asks for a different API style.

Suggested API groups:

```txt
/api/health
/api/me
/api/fellows
/api/teams
/api/forms
/api/submissions
```

Suggested response shape:

```json
{
  "data": {},
  "error": null
}
```

Suggested error shape:

```json
{
  "data": null,
  "error": "Error message"
}
```

Use proper HTTP status codes.

Suggested status code meanings:

- `200` success
- `201` created
- `400` invalid request
- `401` not authenticated
- `403` not allowed
- `404` not found
- `500` server error

---

## Authentication Guidance

Auth0 is planned.

Expected user roles:

```txt
public
fellow
admin
```

Rules:

- Public pages should be accessible without login.
- Fellow pages should require fellow access.
- Admin pages should require admin access.
- Frontend role checks are for user experience only.
- Backend role checks are required for real protection.
- Do not trust role data coming only from the frontend.

Middleware files may start as:

```txt
backend/internal/middleware/auth0.go
backend/internal/middleware/require_role.go
```

These can be adjusted if a better auth structure is needed later.

---

## PostgreSQL Guidance

PostgreSQL is the planned database.

Default local connection URL:

```txt
postgres://postgres:postgres@localhost:5432/asean_tracker?sslmode=disable
```

Rules:

- Use parameterized queries.
- Do not build SQL using raw user input.
- Do not commit real production data, database dumps, or credentials.
- Keep local demo data clearly marked as demo data.
- If schema changes become complex, add migrations.
- If migrations are added, document how to run them.

Possible migration locations:

```txt
backend/migrations/
```

or:

```txt
backend/internal/database/migrations/
```

Pick one and stay consistent.

---

## Docker Guidance

Docker is planned, but it does not need to exist on day one.

When Docker is added, prefer:

```txt
docker-compose.yml
frontend/Dockerfile
backend/Dockerfile
```

Rules:

- Keep Docker setup simple.
- Use a named volume for PostgreSQL data when persistence is needed.
- Do not store important database data only inside a temporary container.
- Make local development easy to run.

---

## Deployment Guidance

Primary deployment plan:

```txt
Azure
```

Backup deployment plan:

```txt
Vercel
```

Rules:

- Use Azure as the main deployment target when full-stack deployment is needed.
- Use Vercel only as a backup or frontend-only deployment option.
- If frontend is deployed on Vercel, backend must still be deployed somewhere else.
- Do not add deployment config until deployment is requested.
- Keep deployment environment variables separate from local environment variables.

---

## Environment Variable Guidance

Use `.env.example` for documentation.

Do not commit real `.env` files.

Possible frontend variables:

```txt
VITE_API_URL=http://localhost:8080
VITE_AUTH0_DOMAIN=
VITE_AUTH0_CLIENT_ID=
VITE_AUTH0_AUDIENCE=
```

Possible backend variables:

```txt
PORT=8080
DATABASE_URL=postgres://postgres:postgres@localhost:5432/asean_tracker?sslmode=disable
MIGRATIONS_PATH=backend/migrations
AUTH0_DOMAIN=
AUTH0_AUDIENCE=
```

Rules:

- Never hardcode secrets.
- Never expose Auth0 secrets.
- Never commit production credentials.
- Add new variables to `.env.example` when needed.

---

## Development Commands

Codex should inspect the actual project files before assuming commands.

Likely frontend commands:

```bash
cd frontend
npm install
npm run dev
npm run build
```

Likely backend commands:

```bash
cd backend
go mod tidy
go run ./cmd/api
go test ./...
```

Likely Docker command after Docker setup exists:

```bash
docker compose up --build
```

If a command fails, explain the failure clearly.

---

## Coding Style

General:

- Keep code simple.
- Prefer readable code over clever code.
- Make small changes.
- Avoid unrelated edits.
- Avoid unnecessary dependencies.
- Follow existing patterns once the project has code.

Frontend:

- Use PascalCase for React component files.
- Keep pages focused on page-level layout and behavior.
- Keep reusable UI in components.
- Keep API calls centralized when practical.
- Avoid deeply nested component trees without reason.

Backend:

- Use `gofmt`.
- Use short lowercase Go package names.
- Keep handlers readable.
- Keep database access separate when possible.
- Return clear errors.
- Do not panic for normal request errors.

---

## First Setup Guidance

Because this project may start with no code, the first setup should stay minimal.

Good first setup:

1. Create the frontend Vite React app.
2. Create the backend Go API skeleton.
3. Add a simple health endpoint.
4. Add placeholder route/page structure.
5. Add `.env.example` files.
6. Add `.gitignore`.
7. Add README setup instructions.

Do not build all product features in the first setup unless the user asks.

---

## Suggested First Health Endpoint

Backend:

```txt
GET /api/health
```

Response:

```json
{
  "data": {
    "status": "ok"
  },
  "error": null
}
```

This can later be used by the frontend to test API connectivity.

---

## Git Rules

Codex should not create commits unless the user asks.

Before finishing, summarize:

1. What changed
2. Files modified
3. Commands run
4. Any assumptions
5. Any remaining issues

Do not modify lockfiles unless dependencies changed.

---

## Do Not Touch Without Permission

Do not modify these unless the user directly asks:

- Real `.env` files
- Real secrets
- Production database files
- Deployment credentials
- Git history
- Generated build output
- Unrelated files
- Lockfiles, unless dependencies changed

---

## Codex Behavior

When working on this repository:

- Read this file first.
- Read `schema.dbml` before creating or editing any feature that touches data,
  and keep the work consistent with it (see "Database Schema (Source of Truth)").
- Treat the suggested structure as a guide, not a strict rule.
- Keep the project easy to understand.
- Prefer simple setup first.
- Add complexity only when needed.
- Ask only when the decision would significantly affect architecture.
- If there is a reasonable default, choose it and mention the assumption.
- Explain any structural changes.
- Do not add unrelated features.
