# API Roadmap

Backend API reference and implementation roadmap for the ASEAN 1967 Fellowship tracking system.

This document is intentionally split between:

- **Implemented**: registered today in `backend/internal/routes/routes.go`.
- **Planned**: contract expected by the app and backed by the current PostgreSQL schema; skeleton routes may return `501 Not Implemented`.
- **Schema gap**: frontend behavior exists or is expected, but the current schema does not yet fully support the contract.
- **Frontend-only**: intentionally kept in the web app for now.

## Base API

Base URL:

```txt
http://localhost:8080
```

Content type:

```txt
application/json
```

Frontend environment:

```txt
VITE_API_BASE_URL=http://localhost:8080
```

Backend environment:

```txt
PORT=8080
DATABASE_URL=postgres://postgres:postgres@localhost:5432/asean_tracker?sslmode=disable
MIGRATIONS_PATH=backend/migrations
```

Docker Compose uses the internal database host:

```txt
DATABASE_URL=postgres://postgres:postgres@db:5432/asean_tracker?sslmode=disable
MIGRATIONS_PATH=/app/migrations
```

Source-of-truth data model:

```txt
schema.dbml
backend/migrations/001_init.sql
```

## CORS

The backend currently applies permissive development CORS:

| Header | Value |
| --- | --- |
| `Access-Control-Allow-Origin` | `*` |
| `Access-Control-Allow-Methods` | `GET, POST, PUT, PATCH, DELETE, OPTIONS` |
| `Access-Control-Allow-Headers` | `Content-Type, Authorization` |

`OPTIONS` requests return `204 No Content`.

## Response Format

`GET /api/health` and `GET /api/fellows` currently return raw JSON for compatibility. Admin endpoints use the project-standard envelope:

```json
{
  "data": {},
  "error": null
}
```

Planned error response shape:

```json
{
  "data": null,
  "error": "Error message"
}
```

Use snake_case response fields for backend contracts.

## Implementation Status Summary

| Method | Path | Status | Primary consumer |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Implemented | Frontend API connectivity |
| `GET` | `/api/fellows` | Implemented | Current `frontend/src/lib/api.ts` |
| `GET` | `/api/admin/overview` | Implemented | Admin overview |
| `GET` | `/api/me` | Planned | Authenticated layouts and profile |
| `GET` | `/api/fellows/{fellowId}` | Implemented | Fellow roster detail, admin fellow profile |
| `GET` | `/api/admin/fellows` | Implemented | Admin fellow management |
| `POST` | `/api/admin/fellows` | Implemented | Admin fellow management |
| `PATCH` | `/api/admin/fellows/{fellowId}` | Implemented | Admin fellow management |
| `DELETE` | `/api/admin/fellows/{fellowId}` | Implemented | Admin fellow management |
| `GET` | `/api/cohorts/active/sprints` | Implemented | Fellow sprint timeline |
| `GET` | `/api/admin/sprints` | Implemented | Admin sprint management |
| `GET` | `/api/admin/sprints/{sprintId}` | Implemented | Admin sprint management |
| `POST` | `/api/admin/sprints` | Implemented | Admin sprint management |
| `PATCH` | `/api/admin/sprints/{sprintId}` | Implemented | Admin sprint management |
| `DELETE` | `/api/admin/sprints/{sprintId}` | Implemented | Admin sprint management |
| `GET` | `/api/fellow/assignments` | Planned | Fellow dashboard and assignments |
| `POST` | `/api/fellow/assignments/{assignmentId}/submit` | Planned | Fellow assignment submission |
| `GET` | `/api/admin/assignments` | Implemented | Admin form tracker |
| `POST` | `/api/admin/assignments` | Implemented | Admin form tracker |
| `PATCH` | `/api/admin/assignments/{assignmentId}` | Implemented | Admin form tracker |
| `POST` | `/api/admin/assignments/{assignmentId}/sync` | Implemented | Google Form response sync |
| `GET` | `/api/admin/assignments/{assignmentId}/submissions` | Implemented | Admin submission matrix |
| `GET` | `/api/resources` | Implemented | Fellow learning/resources |
| `POST` | `/api/fellow/resources/{resourceId}/read` | Planned | Fellow resource completion |
| `GET` | `/api/admin/resources` | Implemented | Admin resources |
| `GET` | `/api/admin/resources/{resourceId}` | Implemented | Admin resources |
| `POST` | `/api/admin/resources` | Implemented | Admin resources |
| `PATCH` | `/api/admin/resources/{resourceId}` | Implemented | Admin resources |
| `DELETE` | `/api/admin/resources/{resourceId}` | Implemented | Admin resources |
| `GET` | `/api/admin/resources/read-status` | Implemented | Admin read tracking |
| `GET` | `/api/fellow/learning` | Planned | Fellow learning system |
| `GET` | `/api/cases` | Implemented | Fellow assignments, admin cases |
| `GET` | `/api/admin/cases` | Implemented | Admin case management |
| `GET` | `/api/admin/cases/{caseId}` | Implemented | Admin case management |
| `POST` | `/api/admin/cases` | Implemented | Admin case management |
| `PATCH` | `/api/admin/cases/{caseId}` | Implemented | Admin case management |
| `DELETE` | `/api/admin/cases/{caseId}` | Implemented | Admin case management |
| `GET` | `/api/teams` | Implemented | Team builder, roster |
| `GET` | `/api/fellow/team` | Planned | Fellow team page |
| `POST` | `/api/admin/teams/assignments` | Implemented | Admin team builder |
| `GET` | `/api/progress` | Planned | Shared cohort progress |
| `GET` | `/api/progress/fellows/{fellowId}` | Planned | Shared fellow progress detail |
| `GET` | `/api/events` | Implemented | Fellow/admin calendar |
| `POST` | `/api/admin/events` | Implemented | Admin event management |
| `PATCH` | `/api/admin/events/{eventId}` | Implemented | Admin event management |
| `DELETE` | `/api/admin/events/{eventId}` | Implemented | Admin event management |
| `GET` | `/api/fellow/notifications` | Schema gap | Fellow notifications |
| `PATCH` | `/api/fellow/profile` | Schema gap | Fellow profile/settings |

## Implemented Endpoints

### Health Check

**Status:** Implemented

```http
GET /api/health
```

Returns API availability.

Response `200`:

```json
{
  "status": "ok"
}
```

### List Fellows

**Status:** Implemented

```http
GET /api/fellows
```

Returns fellows from the PostgreSQL `"user"` and `fellow` tables.

Response `200`:

```json
[
  {
    "id": 1,
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "status": "confirmed",
    "created_at": "2026-06-18T12:00:00Z"
  }
]
```

Fields:

| Field | Type | Source |
| --- | --- | --- |
| `id` | number | `"user".id` |
| `name` | string | `"user".name` |
| `email` | string | `"user".gmail` |
| `status` | string | `fellow.status` |
| `created_at` | string | `"user".created_at` as RFC3339 |

Errors:

| Status | Meaning |
| --- | --- |
| `500` | Database query or scan failure |

## Auth And Session

Auth0 is planned but not wired yet. Current frontend auth is local mock state in `frontend/src/lib/auth.ts`.

### Current User

**Status:** Planned

```http
GET /api/me
```

Returns the authenticated user, role, and role-specific profile summary.

Response target `200`:

```json
{
  "data": {
    "id": 24,
    "name": "Sirada Wong",
    "email": "sirada.w@example.com",
    "role": "fellow",
    "photo_url": null,
    "fellow": {
      "team_id": 3,
      "team_name": "Team Mekong",
      "cohort_id": 1,
      "cohort_name": "Cohort 2026",
      "university": "Chulalongkorn University",
      "major": null,
      "status": "confirmed",
      "teamflow": "Initiator"
    }
  },
  "error": null
}
```

Authorization:

| Route group | Required role |
| --- | --- |
| `/api/admin/*` | `admin` |
| `/api/fellow/*` | `fellow` |
| Shared read endpoints | authenticated unless explicitly public |
| Public endpoints | none |

Backend authorization must be enforced server-side. Frontend role checks are only UX.

## Fellows

### Get Fellow Detail

**Status:** Planned

```http
GET /api/fellows/{fellowId}
```

Returns roster/profile detail for one fellow.

Response target `200`:

```json
{
  "data": {
    "id": 24,
    "name": "Sirada Wong",
    "email": "sirada.w@example.com",
    "discord_name": "sirada_w",
    "line_id": null,
    "phone": null,
    "linkedin": null,
    "photo_url": null,
    "country": "Thailand",
    "university": "Chulalongkorn University",
    "major": null,
    "status": "confirmed",
    "teamflow": "Initiator",
    "team": {
      "id": 3,
      "name": "Team Mekong"
    },
    "created_at": "2026-06-18T12:00:00Z",
    "last_login_at": "2026-06-19T08:00:00Z"
  },
  "error": null
}
```

### Admin List Fellows

**Status:** Planned

```http
GET /api/admin/fellows
```

Returns the admin fellow management roster with team and cohort context.

Response target `200`:

```json
{
  "data": [
    {
      "id": 24,
      "name": "Sirada Wong",
      "email": "sirada.w@example.com",
      "country": "Thailand",
      "university": "Chulalongkorn University",
      "teamflow": "Initiator",
      "team_id": 3,
      "team_name": "Team Mekong",
      "status": "confirmed",
      "created_at": "2026-06-18T12:00:00Z"
    }
  ],
  "error": null
}
```

### Admin Create Fellow

**Status:** Planned

```http
POST /api/admin/fellows
```

Creates a `"user"` row plus the related `fellow` row.

Request target:

```json
{
  "name": "Sirada Wong",
  "gmail": "sirada.w@example.com",
  "country": "Thailand",
  "university": "Chulalongkorn University",
  "major": "Business Administration",
  "teamflow": "Initiator",
  "status": "confirmed",
  "team_id": 3,
  "group_id": 3
}
```

Response target `201`:

```json
{
  "data": {
    "id": 24,
    "name": "Sirada Wong",
    "email": "sirada.w@example.com",
    "status": "confirmed"
  },
  "error": null
}
```

### Admin Update Fellow

**Status:** Planned

```http
PATCH /api/admin/fellows/{fellowId}
```

Updates editable `"user"` and `fellow` fields.

Request target:

```json
{
  "name": "Sirada Wong",
  "status": "confirmed",
  "team_id": 3,
  "teamflow": "Initiator"
}
```

Response target `200`:

```json
{
  "data": {
    "id": 24,
    "name": "Sirada Wong",
    "status": "confirmed",
    "team_id": 3,
    "teamflow": "Initiator"
  },
  "error": null
}
```

### Admin Remove Fellow

**Status:** Planned

```http
DELETE /api/admin/fellows/{fellowId}
```

Removes a fellow account or marks it unavailable, depending on the final product decision.

Response target `204`: no body.

## Cohorts And Sprints

### List Active Cohort Sprints

**Status:** Implemented

```http
GET /api/cohorts/active/sprints
```

Returns the sprint timeline for the active cohort.

Response target `200`:

```json
{
  "data": [
    {
      "id": 4,
      "cohort_id": 1,
      "name": "Sprint 4 - Market Validation",
      "description": "Validate the problem statement with real users.",
      "starts_on": "2026-06-08T00:00:00Z",
      "submission_deadline": "2026-06-21T16:00:00Z",
      "is_current": true
    }
  ],
  "error": null
}
```

### Admin List Sprints

**Status:** Implemented

```http
GET /api/admin/sprints
```

Returns sprints for admin sprint management.

Response target `200`:

```json
{
  "data": [
    {
      "id": 4,
      "cohort_id": 1,
      "name": "Sprint 4 - Market Validation",
      "description": "Validate the problem statement with real users.",
      "starts_on": "2026-06-08T00:00:00Z",
      "submission_deadline": "2026-06-21T16:00:00Z",
      "is_current": true,
      "created_at": "2026-06-18T12:00:00Z",
      "update_at": "2026-06-18T12:00:00Z",
      "created_by": 10
    }
  ],
  "error": null
}
```

### Admin Get Sprint

**Status:** Implemented

```http
GET /api/admin/sprints/{sprintId}
```

Returns one sprint by `id`.

### Admin Create Sprint

**Status:** Implemented

```http
POST /api/admin/sprints
```

Request target:

```json
{
  "cohort_id": 1,
  "name": "Sprint 4 - Market Validation",
  "description": "Validate the problem statement with real users.",
  "starts_on": "2026-06-08T00:00:00Z",
  "submission_deadline": "2026-06-21T16:00:00Z",
  "is_current": true
}
```

Response target `201`:

```json
{
  "data": {
    "id": 4,
    "cohort_id": 1,
    "name": "Sprint 4 - Market Validation"
  },
  "error": null
}
```

### Admin Update Sprint

**Status:** Implemented

```http
PATCH /api/admin/sprints/{sprintId}
```

Updates sprint metadata.

### Admin Delete Sprint

**Status:** Implemented

```http
DELETE /api/admin/sprints/{sprintId}
```

Response `200`:

```json
{
  "data": {
    "deleted": true
  },
  "error": null
}
```

## Assignments And Submissions

### Fellow List Assignments

**Status:** Planned

```http
GET /api/fellow/assignments
```

Returns assignment cards for the signed-in fellow, including derived submission status.

Status rule:

```txt
submit_status = 0 -> pending
submit_status = 1 -> submitted
submit_status = 0 and assignment.deadline < now -> overdue
```

Response target `200`:

```json
{
  "data": [
    {
      "id": 1,
      "cohort_id": 1,
      "sprint_id": 4,
      "learning_block_id": 3,
      "title": "Sprint reflection",
      "form_url": "https://forms.gle/example",
      "deadline": "2026-06-21T16:00:00Z",
      "description": "Submit your reflection.",
      "submit_status": 0,
      "status_name": "pending",
      "submitted_at": null,
      "grade": null
    }
  ],
  "error": null
}
```

### Fellow Submit Assignment

**Status:** Planned

```http
POST /api/fellow/assignments/{assignmentId}/submit
```

Creates or updates `assignment_submission` for the authenticated fellow.

Database write:

```txt
assignment_submission(assignment_id, member_id, submit_status, submitted_at)
```

Response target `200`:

```json
{
  "data": {
    "assignment_id": 1,
    "member_id": 24,
    "submit_status": 1,
    "status_name": "submitted",
    "submitted_at": "2026-06-18T12:00:00Z"
  },
  "error": null
}
```

### Admin List Assignments

**Status:** Planned

```http
GET /api/admin/assignments
```

Returns assignments with cohort-wide submission counts.

Response target `200`:

```json
{
  "data": [
    {
      "id": 1,
      "cohort_id": 1,
      "sprint_id": 4,
      "learning_block_id": 3,
      "title": "Sprint reflection",
      "form_url": "https://forms.gle/example",
      "deadline": "2026-06-21T16:00:00Z",
      "description": "Submit your reflection.",
      "submitted_count": 18,
      "total_fellows": 24,
      "created_at": "2026-06-18T12:00:00Z",
      "update_at": "2026-06-18T12:00:00Z"
    }
  ],
  "error": null
}
```

### Admin Create Assignment

**Status:** Planned

```http
POST /api/admin/assignments
```

Creates an `assignment` row.

Request target:

```json
{
  "cohort_id": 1,
  "sprint_id": 4,
  "learning_block_id": 3,
  "title": "Sprint reflection",
  "form_url": "https://forms.gle/example",
  "deadline": "2026-06-21T16:00:00Z",
  "description": "Submit your reflection."
}
```

Response target `201`:

```json
{
  "data": {
    "id": 1,
    "title": "Sprint reflection",
    "form_url": "https://forms.gle/example"
  },
  "error": null
}
```

### Admin Update Assignment

**Status:** Planned

```http
PATCH /api/admin/assignments/{assignmentId}
```

Updates assignment metadata.

### Admin Sync Assignment Submissions

**Status:** Planned

```http
POST /api/admin/assignments/{assignmentId}/sync
```

Syncs Google Form responses into `assignment_submission`. The current schema has an `api` table for sync audit rows.

Request target:

```json
{
  "submitted_member_ids": [1, 2, 3]
}
```

Response target `200`:

```json
{
  "data": {
    "assignment_id": 1,
    "updated_count": 3,
    "synced_at": "2026-06-18T12:00:00Z"
  },
  "error": null
}
```

### Admin Assignment Submission Matrix

**Status:** Planned

```http
GET /api/admin/assignments/{assignmentId}/submissions
```

Returns per-fellow submission state for one assignment.

Response target `200`:

```json
{
  "data": {
    "assignment_id": 1,
    "title": "Sprint reflection",
    "deadline": "2026-06-21T16:00:00Z",
    "submitted_count": 18,
    "total_fellows": 24,
    "fellows": [
      {
        "member_id": 24,
        "name": "Sirada Wong",
        "submit_status": 1,
        "status_name": "submitted",
        "submitted_at": "2026-06-18T12:00:00Z"
      },
      {
        "member_id": 25,
        "name": "Naphat Tan",
        "submit_status": 0,
        "status_name": "pending",
        "submitted_at": null
      }
    ]
  },
  "error": null
}
```

## Resources And Learning

### List Resources

**Status:** Implemented

```http
GET /api/resources
```

Returns records from `resource`.

Response target `200`:

```json
{
  "data": [
    {
      "id": 1,
      "type": "ARTICLE",
      "name": "Customer interview guide",
      "description": "How to run useful discovery interviews.",
      "url": "https://seabridge.example.com/articles/interviews",
      "duration": "12 min read",
      "author": "The Mom Test",
      "tag": "Research",
      "learning_block_id": 2,
      "sort_order": 1,
      "created_at": "2026-06-18T12:00:00Z",
      "updated_at": "2026-06-18T12:00:00Z",
      "created_by": 10,
      "read_at": null
    }
  ],
  "error": null
}
```

### Fellow Mark Resource As Read

**Status:** Planned

```http
POST /api/fellow/resources/{resourceId}/read
```

Creates or updates a `resource_read` row for the authenticated fellow.

Database write:

```txt
resource_read(resource_id, member_id, read_at)
```

Response target `200`:

```json
{
  "data": {
    "resource_id": 1,
    "member_id": 24,
    "read_at": "2026-06-18T12:00:00Z"
  },
  "error": null
}
```

### Admin List Resources

**Status:** Implemented

```http
GET /api/admin/resources
```

Returns shared resources with read counts.

Response target `200`:

```json
{
  "data": [
    {
      "id": 1,
      "type": "ARTICLE",
      "name": "Customer interview guide",
      "description": "How to run useful discovery interviews.",
      "url": "https://seabridge.example.com/articles/interviews",
      "duration": "12 min read",
      "author": "The Mom Test",
      "tag": "Research",
      "learning_block_id": 2,
      "sort_order": 1,
      "read_count": 18,
      "total_fellows": 24,
      "created_at": "2026-06-18T12:00:00Z",
      "updated_at": "2026-06-18T12:00:00Z",
      "created_by": 10
    }
  ],
  "error": null
}
```

### Admin Get Resource

**Status:** Implemented

```http
GET /api/admin/resources/{resourceId}
```

Returns one resource by `id`.

### Admin Create Resource

**Status:** Implemented

```http
POST /api/admin/resources
```

Creates a `resource` row.

Request target:

```json
{
  "type": "ARTICLE",
  "name": "Customer interview guide",
  "description": "How to run useful discovery interviews.",
  "url": "https://seabridge.example.com/articles/interviews",
  "duration": "12 min read",
  "author": "The Mom Test",
  "tag": "Research",
  "learning_block_id": 2,
  "sort_order": 1
}
```

Response target `201`:

```json
{
  "data": {
    "id": 1,
    "type": "ARTICLE",
    "name": "Customer interview guide"
  },
  "error": null
}
```

### Admin Update Resource

**Status:** Implemented

```http
PATCH /api/admin/resources/{resourceId}
```

Updates a `resource` row.

### Admin Delete Resource

**Status:** Implemented

```http
DELETE /api/admin/resources/{resourceId}
```

Response `200`:

```json
{
  "data": {
    "deleted": true
  },
  "error": null
}
```

### Admin Resource Read Tracking

**Status:** Implemented

```http
GET /api/admin/resources/read-status
```

Returns per-resource read counts and fellow lists.

Response target `200`:

```json
{
  "data": [
    {
      "resource_id": 1,
      "name": "Customer interview guide",
      "read_count": 18,
      "total_fellows": 24,
      "readers": [1, 2, 3],
      "not_readers": [4, 5, 6]
    }
  ],
  "error": null
}
```

### Fellow Learning System

**Status:** Planned

```http
GET /api/fellow/learning
```

Returns blocks, special curriculum sections, resources, and assignment form items grouped for the fellow learning page.

Schema support:

| Need | Table/field |
| --- | --- |
| Blocks and special sections | `learning_block` |
| External links and resources | `resource.url`, `resource.learning_block_id`, `resource.sort_order` |
| Form assignments under a block | `assignment.learning_block_id` |
| Fellow read progress | `resource_read` |

## Cases

### List Cases

**Status:** Implemented

```http
GET /api/cases
```

Returns records from `"case"`.

Response target `200`:

```json
{
  "data": [
    {
      "id": 1,
      "cohort_id": 1,
      "sprint_id": 4,
      "title": "Merchant onboarding research",
      "case_owner": "Grab",
      "status": "Published",
      "summary": "Interview merchants and identify onboarding friction.",
      "file_name": "merchant-onboarding.pdf",
      "published_date": "2026-06-18",
      "googledrive_link": "https://drive.google.com/example",
      "theme": "Market validation",
      "created_at": "2026-06-18T12:00:00Z",
      "update_at": "2026-06-18T12:00:00Z",
      "create_by": 10
    }
  ],
  "error": null
}
```

### Admin Get Case

**Status:** Implemented

```http
GET /api/admin/cases/{caseId}
```

Returns one case by `id`.

### Admin Create Case

**Status:** Implemented

```http
POST /api/admin/cases
```

Request target:

```json
{
  "cohort_id": 1,
  "sprint_id": 4,
  "title": "Merchant onboarding research",
  "case_owner": "Grab",
  "status": "Published",
  "summary": "Interview merchants and identify onboarding friction.",
  "file_name": "merchant-onboarding.pdf",
  "published_date": "2026-06-18",
  "googledrive_link": "https://drive.google.com/example",
  "theme": "Market validation"
}
```

Response target `201`:

```json
{
  "data": {
    "id": 1,
    "title": "Merchant onboarding research",
    "status": "Published"
  },
  "error": null
}
```

### Admin Update Case

**Status:** Implemented

```http
PATCH /api/admin/cases/{caseId}
```

Updates a `"case"` row.

### Admin Delete Case

**Status:** Implemented

```http
DELETE /api/admin/cases/{caseId}
```

Response `200`:

```json
{
  "data": {
    "deleted": true
  },
  "error": null
}
```

## Teams

### List Teams

**Status:** Planned

```http
GET /api/teams
```

Returns teams with related group, case, and member summary.

Response target `200`:

```json
{
  "data": [
    {
      "id": 3,
      "group_id": 3,
      "name": "Team Mekong",
      "case_id": 1,
      "case_title": "Merchant onboarding research",
      "member_count": 4,
      "created_at": "2026-06-18T12:00:00Z",
      "update_at": "2026-06-18T12:00:00Z"
    }
  ],
  "error": null
}
```

### Fellow Team Detail

**Status:** Planned

```http
GET /api/fellow/team
```

Returns the authenticated fellow's current team and members.

Response target `200`:

```json
{
  "data": {
    "id": 3,
    "name": "Team Mekong",
    "case": {
      "id": 1,
      "title": "Merchant onboarding research"
    },
    "members": [
      {
        "id": 24,
        "name": "Sirada Wong",
        "country": "Thailand",
        "university": "Chulalongkorn University",
        "teamflow": "Initiator"
      }
    ]
  },
  "error": null
}
```

### Admin Save Team Assignments

**Status:** Planned

```http
POST /api/admin/teams/assignments
```

Updates fellow `team_id` and/or `group_id` assignments for team-builder workflows.

Request target:

```json
{
  "sprint_id": 4,
  "assignments": [
    {
      "member_id": 24,
      "team_id": 3,
      "group_id": 3
    }
  ]
}
```

Response target `200`:

```json
{
  "data": {
    "updated_count": 1
  },
  "error": null
}
```

## Events

### List Events

**Status:** Planned

```http
GET /api/events
```

Returns events from `events`.

Response target `200`:

```json
{
  "data": [
    {
      "id": 1,
      "cohort_id": 1,
      "name": "Sprint 4 Demo Day",
      "description": "Each team presents a 5-minute demo.",
      "event_date": "2026-06-12",
      "all_day": false,
      "start_time": "14:00",
      "end_time": "16:00",
      "timezone": "Asia/Bangkok",
      "location": "Online - Zoom",
      "user_id": 10,
      "created_at": "2026-06-18T12:00:00Z",
      "updated_at": "2026-06-18T12:00:00Z",
      "create_by": 10
    }
  ],
  "error": null
}
```

### Admin Create Event

**Status:** Planned

```http
POST /api/admin/events
```

Creates an `events` row with the calendar fields needed by the admin event UI.

Request target:

```json
{
  "cohort_id": 1,
  "name": "Sprint 4 Demo Day",
  "description": "Each team presents a 5-minute demo.",
  "event_date": "2026-06-12",
  "all_day": false,
  "start_time": "14:00",
  "end_time": "16:00",
  "timezone": "Asia/Bangkok",
  "location": "Online - Zoom"
}
```

### Admin Update Event

**Status:** Planned

```http
PATCH /api/admin/events/{eventId}
```

Updates event metadata and calendar fields.

### Admin Delete Event

**Status:** Planned

```http
DELETE /api/admin/events/{eventId}
```

Deletes an `events` row.

Response target `204`: no body.

## Shared Progress Tracking

Shared progress is derived from existing work tables. Do not store a separate progress row.

### Cohort Progress Overview

**Status:** Planned

```http
GET /api/progress
```

Returns a cohort-wide progress board visible to authenticated users.

Progress sources:

| Progress area | Source |
| --- | --- |
| Assignment progress | `assignment` plus `assignment_submission` |
| Resource progress | `resource` plus `resource_read` |
| Case/team progress | `case_submission` |

### Fellow Progress Detail

**Status:** Planned

```http
GET /api/progress/fellows/{fellowId}
```

Returns one fellow's assignment, resource, and case progress. Keep private account/settings fields out of this response.

## Frontend-Local Or Schema-Gap Features

### Fellow Notifications

**Status:** Schema gap

```http
GET /api/fellow/notifications
```

Notifications are currently mocked in the frontend. The database has no `notification` or announcement table. Do not implement until notifications need server persistence, cross-device read state, or admin-authored announcements.

### Fellow Profile And Settings

**Status:** Schema gap

```http
PATCH /api/fellow/profile
```

The frontend profile/settings pages include display name, university, availability, profile visibility, notification preferences, and account settings. The schema now supports weekly availability and availability visibility, but notification preferences and general account settings remain frontend-local.

## Schema Alignment Notes

| Frontend concept | Current support | Gap |
| --- | --- | --- |
| Learning blocks | Supported | `learning_block` stores regular blocks and special sections. |
| Learning links | Supported | `resource` stores URL, duration, author, tag, order, and block assignment. |
| Admin resource kinds | Supported | `resource.type` supports current and frontend-needed kinds. |
| Resource read tracking | Supported | `resource_read(resource_id, member_id, read_at)` exists. |
| Assignments | Supported | `assignment` and `assignment_submission` exist. |
| Google Form sync audit | Partial | `api` table stores assignment sync timestamps, but not source response IDs or sync errors. |
| Cases | Supported | `"case"` plus `case_submission` cover case metadata and team submission status. |
| Team builder | Partial | `team`, `group`, and `fellow.team_id` exist; sprint-specific team assignment history is not modeled. |
| Events | Supported | `events` includes date, time, timezone, and location fields. |
| Notifications | Frontend-only | No notification table by design for now. |
| Profile visibility | Partial | `fellow.availability_visible` exists; no generic per-field visibility table. |
| Availability | Supported | `fellow_availability(member_id, day_of_week)` stores weekly availability. |
| Auth/session | Planned | Auth0 middleware stubs exist, but frontend auth is mock local state. |

## Status Codes

| Status | Meaning |
| --- | --- |
| `200` | Success |
| `201` | Created |
| `204` | Success with no body |
| `400` | Invalid request |
| `401` | Not authenticated |
| `403` | Not allowed |
| `404` | Not found |
| `409` | Conflict or duplicate record |
| `500` | Server error |

## Backend Implementation Notes

- Keep current implemented endpoints raw until the frontend client is migrated or compatibility handling is added.
- New endpoints should use the response envelope.
- `resource_read` uses `(resource_id, member_id)` as the natural primary key.
- `assignment_submission` uses `(assignment_id, member_id)` as the natural primary key.
- `case_submission` uses `(case_id, team_id)` as the natural primary key.
- Shared progress should be aggregated from submission/read tables, not stored in a `progress` table.
- `overdue` is not stored directly. It is derived from `submit_status = 0` plus the assignment deadline.
- Notifications remain frontend-only until server persistence is actually needed.
- Admin endpoints require server-side authorization once Auth0 is wired.
- Schema changes should update both `schema.dbml` and SQL migrations.
