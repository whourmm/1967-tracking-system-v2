# AGENTS.md

Working instructions for anyone (human or AI agent) contributing to **1967 Tracking System V2**.
Read this file first, then `DESIGN.md` before touching any UI.

> There is also a longer, more general `AGENTS.md` on the `dev` branch. This file
> reflects the **current state of the project** and the team's working agreement.
> If the two ever conflict, reconcile them in a dedicated commit — don't silently
> diverge.

---

## 1. What this project is

A full-stack **fellowship / cohort tracking system** for the **SEA Bridge Institute
of Entrepreneurship** ("ASEAN 1967 Fellowship"). It has three logically separate
areas:

- **Public** — landing page, application form
- **Fellow** (participant) — dashboard, assignments, learning system, profile, team, …
- **Admin / PO** — dashboard, fellow management, team builder, form tracker, cases, sprints

Database name: `asean_tracker.db`.

## 2. Tech stack

| Layer    | Choice                                             |
| -------- | -------------------------------------------------- |
| Frontend | Vite + React + TypeScript, **Tailwind CSS v4**     |
| Routing  | React Router                                       |
| Icons    | `lucide-react`                                     |
| Backend  | Go (`net/http`), SQLite                            |
| Deploy   | Azure (primary), Vercel (frontend-only backup)     |
| Auth     | Auth0 (planned) — roles: `fellow`, `admin`, `PO`   |

Do not introduce new frameworks, state libraries, or databases without a clear
reason or an explicit request.

## 3. Repository layout

```txt
frontend/
  src/
    main.tsx, App.tsx
    index.css            # Tailwind v4 entry + design tokens (@theme)
    routes/              # PublicRoutes, FellowRoutes, AdminRoutes
    pages/               # public/ · fellow/ · admin/
    components/
      layout/            # FellowLayout (left sidebar), ...
      ui/                # Card, StatusBadge, reusable primitives
    lib/                 # cn(), format helpers, api client
    data/mock.ts         # mock data (used until the API is wired up)
    types/               # domain types mirroring the DB schema
backend/                 # Go API (cmd/api, internal/{database,handlers,...})
  migrations/001_init.sql  # canonical DB schema (on dev branch)
DESIGN.md                # design system — MANDATORY for all UI work
docker-compose.yml
```

## 4. Current status (read before you build)

**Done (Fellow area, frontend, mock data only):**

- Left **sidebar layout** — `components/layout/FellowLayout.tsx` (always on the left)
- **Dashboard** — `pages/fellow/FellowDashboard.tsx` → `/fellow`
- **Assignments** — `pages/fellow/AssignmentsPage.tsx` → `/fellow/assignments`
- **Learning System** — `pages/fellow/LearningSystemPage.tsx` → `/fellow/learning`
- Design tokens wired to `DESIGN.md` (red-dominant palette, Hanken Grotesk / Inter / JetBrains Mono)

**Not done / out of scope right now:**

- Backend API is a minimal slice only — frontend uses `src/data/mock.ts`, not live data.
- Admin and Public areas are not built on this branch.

## 5. Reserved pages — DO NOT IMPLEMENT (owned by a teammate)

The following **Fellow** pages are claimed by another contributor. Do **not** build
them; only leave the integration points ready:

- **Profile** — `pages/fellow/ProfilePage.tsx` → route `/fellow/profile`
- **Team** — `pages/fellow/TeamPage.tsx` → route `/fellow/team`
- **Fellow Roster** — `pages/fellow/FellowsRoster.tsx` → route `/fellow/roster`
- **Settings** — `pages/fellow/SettingsPage.tsx` → route `/fellow/settings`

Where they plug in when the teammate is ready:

- Routes: add `<Route>` entries in `src/routes/FellowRoutes.tsx`
- Navigation: move the relevant items out of the "Coming soon" group in
  `src/components/layout/FellowLayout.tsx`
- Mock data + types: extend `src/data/mock.ts` and `src/types/`

If you need something from one of these pages, coordinate first — don't pre-empt it.

## 6. Design system (mandatory)

All UI **must** follow `DESIGN.md`. Highlights:

- **Red-dominant palette.** Primary `#DC2626`; hover lightens to mid-red `#EF4444`.
  Use the `brand-*` Tailwind classes (already mapped to red in `index.css`). Never
  use indigo/blue as a brand color.
- **Neutrals:** charcoal `#111827` headings, slate `#6B7280` body/meta, surface
  `#F9FAFB` background, border-grey `#E5E7EB`.
- **Semantic colors are reserved for status only:** green `#10B981` (success),
  amber `#F59E0B` (pending), red (error).
- **Type:** Hanken Grotesk (headlines), Inter (body), JetBrains Mono (labels/status
  pills, uppercase).
- **Shape & depth:** cards `rounded-lg` (8px), flat surfaces with 1px borders, no
  heavy shadows; subtle lift on hover only.

Tokens live in `frontend/src/index.css` `@theme`. Prefer adding/adjusting tokens
there over hard-coding hex values in components.

## 7. Frontend conventions

- TypeScript everywhere; PascalCase component files.
- Pages own layout/behavior; reusable UI goes in `components/ui`.
- Keep API calls centralized in `src/lib/api.ts`; data shapes in `src/types/`.
- Until the backend is ready, read from `src/data/mock.ts` — keep mock shapes
  aligned with `backend/migrations/001_init.sql` so swapping to the API is cheap.
- Run `npx tsc -b` before committing; keep the build type-clean.

## 8. Running locally

```bash
# Frontend
cd frontend
npm install
npm run dev          # http://localhost:5173  (Fellow portal at /fellow)

# Backend (optional — needs Go installed)
cd backend
go mod tidy
go run ./cmd/api     # http://localhost:8080
```

> Note: Docker (`docker compose up`) is configured but not guaranteed to run on
> every machine. The npm / go commands above are the reliable local path.

## 9. Git workflow (IMPORTANT)

This is a shared repo with multiple contributors. **Always sync before you push.**

1. **Pull before you push — every time.** Before pushing, run:
   ```bash
   git pull --rebase origin <branch>
   ```
   This avoids overwriting a teammate's work and keeps history linear.
2. **Work on a feature branch**, not directly on `main`. Branch from the latest:
   ```bash
   git checkout -b feat/<short-description>
   ```
3. **Do not commit unless asked**, and never commit:
   - `.env` files or any secrets/credentials
   - `node_modules/`, build output (`dist/`), or SQLite `*.db` files
   - lockfiles, unless dependencies actually changed
4. **Never force-push `main`** (or any shared branch).
5. Resolve conflicts locally and re-run `tsc`/the app before pushing.
6. Open a PR for review rather than pushing straight to `main`.

Commit message style: short imperative subject, e.g. `feat(fellow): add profile page`.

## 10. Do not touch without asking

- Real `.env` files, secrets, production data, deployment credentials
- Git history (no rewriting shared history)
- Lockfiles (unless deps changed)
- The reserved pages in §5
- Unrelated files outside the scope of your change

## 11. Before finishing a task

Summarize: what changed, files modified, commands run, assumptions made, and any
remaining issues.
