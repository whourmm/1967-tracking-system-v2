# Google Cloud Run and Supabase Setup

This guide creates a clean hosted environment for the tracking system:

- Supabase provides PostgreSQL and email/password authentication.
- Google Cloud Run hosts the Go backend.
- Cloud Run builds `backend/Dockerfile` and runs the migrations packaged in `backend/migrations`.

The safest reset is to create a new Supabase project and a new Cloud Run revision, verify them, and only then remove old resources. Deleting a Supabase project permanently deletes its database.

## 1. Prerequisites

Install and sign in to the Google Cloud CLI, have a Google Cloud project with billing enabled, and have a Supabase account.

Run commands from the repository root in PowerShell:

```powershell
cd 1967-tracking-system-v2
gcloud auth login
```

Set names for this deployment. `asia-southeast1` is the Google Cloud Singapore region; choose another region if it is closer to the Supabase project.

```powershell
$GcpProject = "YOUR_GOOGLE_CLOUD_PROJECT_ID"
$Region = "asia-southeast1"
$Service = "tracking-system-api"
$RuntimeServiceAccount = "tracking-system-api"
$DatabaseSecret = "tracking-system-database-url"

gcloud config set project $GcpProject
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com iam.googleapis.com
```

## 2. Create the Supabase project

1. In the [Supabase dashboard](https://supabase.com/dashboard), create a new project.
2. Choose a region close to the Cloud Run region.
3. Generate a strong database password and store it in a password manager.
4. Wait until the project reports that it is ready.

Do not run the migration SQL manually. The backend applies the repository migrations when it first starts.

### Collect the Supabase values

From the project **Connect** dialog or **Settings > API Keys**, copy:

- Project URL, such as `https://abc123.supabase.co`
- Publishable key, beginning with `sb_publishable_`
- PostgreSQL **Session pooler** connection string on port `5432`

Use the Session pooler string because this Go process keeps database connections while its Cloud Run instance is alive, and the pooler supports IPv4. Keep `sslmode=require` in the connection string. If the password is inserted manually, URL-encode special characters; copying the completed string from Supabase is safer.

Set the non-secret values for the later deployment command:

```powershell
$SupabaseUrl = "https://YOUR_PROJECT_REF.supabase.co"
$SupabasePublishableKey = "sb_publishable_YOUR_KEY"
```

The publishable key is intended for browser use. Do not use a Supabase secret key or legacy `service_role` key in either frontend or backend configuration.

### Configure authentication

In **Authentication > Sign In / Providers**, keep Email enabled. In **Authentication > URL Configuration**:

- Set **Site URL** to the deployed frontend URL.
- Add `http://localhost:5173/**` as a development redirect URL if local sign-up confirmation is needed.

If the frontend has not been deployed yet, return here and set the production Site URL after it receives a URL.

### Disable the Data API

This project uses Supabase Auth from the browser but reads and writes application tables only through the Go API. In the Supabase **Data API** integration settings, turn **Enable Data API** off. Supabase Auth continues to work, while the tables created in the `public` schema are not exposed through generated REST or GraphQL endpoints.

## 3. Store the database URL securely

Create a dedicated Cloud Run runtime service account:

```powershell
gcloud iam service-accounts create $RuntimeServiceAccount --display-name="Tracking System Cloud Run API"
$RuntimeServiceAccountEmail = "${RuntimeServiceAccount}@${GcpProject}.iam.gserviceaccount.com"
```

In [Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager):

1. Create a secret named `tracking-system-database-url`.
2. Paste the complete Supabase Session pooler connection string as version 1.
3. Do not add quotes or a trailing space.

Grant only the runtime service account access to this secret:

```powershell
gcloud secrets add-iam-policy-binding $DatabaseSecret `
  --member="serviceAccount:$RuntimeServiceAccountEmail" `
  --role="roles/secretmanager.secretAccessor"
```

## 4. Deploy the backend to Cloud Run

Deploy from the repository root. Cloud Run uses `backend/Dockerfile`, which copies the migration files into `/app/migrations`.

```powershell
gcloud run deploy $Service `
  --source backend `
  --region $Region `
  --allow-unauthenticated `
  --service-account $RuntimeServiceAccountEmail `
  --set-secrets "DATABASE_URL=${DatabaseSecret}:1" `
  --set-env-vars "APP_ENV=production,MIGRATIONS_PATH=/app/migrations,SUPABASE_URL=$SupabaseUrl,SUPABASE_PUBLISHABLE_KEY=$SupabasePublishableKey" `
  --port 8080 `
  --max-instances 1
```

`--allow-unauthenticated` lets browsers reach the API. Application endpoints still validate Supabase bearer tokens in the Go middleware. Cloud Run supplies the `PORT` environment variable automatically, so do not configure it as a secret or environment variable.

Keep `--max-instances 1` for the current backend. Migrations run at application startup and the migration runner does not yet hold a cross-instance lock; concurrent first starts could race. Move migrations to a one-off job or add a PostgreSQL advisory lock before increasing this limit.

`APP_ENV=production` is required. Without it, a new database is populated with development demo fellows.

## 5. Verify the backend and database

Get the service URL and call the public health endpoint:

```powershell
$BackendUrl = gcloud run services describe $Service --region $Region --format='value(status.url)'
$BackendUrl
curl.exe "$BackendUrl/api/health"
```

Expected response:

```json
{
  "data": {
    "status": "ok"
  },
  "error": null
}
```

Read startup and migration logs:

```powershell
gcloud run services logs read $Service --region $Region --limit 100
```

In the Supabase SQL Editor, verify the migrations:

```sql
SELECT version, applied_at
FROM schema_migrations
ORDER BY applied_at, version;
```

The result should contain every `.sql` file currently in `backend/migrations`:

```txt
001_init.sql
002_unique_user_email.sql
003_assignment_sheet_tab.sql
003_backfill_role_rows.sql
004_add_user_public_id.sql
```

No demo users should be present because Cloud Run is configured with `APP_ENV=production`.

## 6. Point the frontend at the hosted services

Set these variables in the frontend hosting platform, then rebuild and redeploy the frontend:

```txt
VITE_API_BASE_URL=https://YOUR_CLOUD_RUN_SERVICE_URL
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

The frontend and backend must use the same Supabase project. Vite embeds these values at build time, so changing them requires a new frontend build.

After the frontend has its final URL, update the Supabase Auth **Site URL** and allowed redirect URLs.

## 7. Create the first admin

1. Register through the frontend with email and password.
2. Confirm the email if email confirmation is enabled.
3. Sign in once. The first authenticated API request creates a matching application user with the `fellow` role.
4. In the Supabase SQL Editor, replace the example email and run:

```sql
BEGIN;

UPDATE "user"
SET role = 'admin'
WHERE LOWER(gmail) = LOWER('admin@example.com');

INSERT INTO admin (user_id)
SELECT id
FROM "user"
WHERE LOWER(gmail) = LOWER('admin@example.com')
ON CONFLICT (user_id) DO NOTHING;

DELETE FROM fellow
WHERE user_id = (
  SELECT id
  FROM "user"
  WHERE LOWER(gmail) = LOWER('admin@example.com')
);

COMMIT;
```

Sign out and sign in again so the UI reloads the updated role.

## 8. Future backend deployments

Run the same `gcloud run deploy` command from section 4. Cloud Run creates a new revision, and the backend applies only migration filenames not already recorded in `schema_migrations`.

When rotating or changing the database URL:

1. Add a new version to `tracking-system-database-url` in Secret Manager.
2. Deploy a new revision pinned to that version, for example:

```powershell
gcloud run services update $Service `
  --region $Region `
  --update-secrets "DATABASE_URL=${DatabaseSecret}:2"
```

3. Verify health and logs before disabling the old secret version or deleting the old Supabase project.

## Troubleshooting

### Cloud Run revision does not become ready

Read its logs:

```powershell
gcloud run services logs read $Service --region $Region --limit 100
```

- `failed to open database`: check the Session pooler URL, encoded password, and `sslmode=require`.
- Secret access error: confirm that the runtime service account has `roles/secretmanager.secretAccessor` on the database secret.
- Missing migration directory: confirm `MIGRATIONS_PATH=/app/migrations`.
- Migration error: fix the migration or configuration before retrying; do not edit `schema_migrations` manually.

### API returns `401 invalid or expired session`

- Confirm the frontend and backend use the same Supabase URL and publishable key.
- Confirm the browser sends `Authorization: Bearer <session-token>`.
- Confirm the Supabase project is active and the user has a valid session.

### API returns `403`

The authenticated user does not have the role required by the route. `/api/admin/...` requires `admin`; `/api/fellow/...` requires `fellow`.

### Browser cannot reach Cloud Run

Confirm the service allows unauthenticated invocation. Cloud Run IAM must allow the browser request to reach the backend; the Go middleware performs application authentication.

## Production checklist

- `DATABASE_URL` is stored in Secret Manager and pinned to a numbered version.
- The connection string uses SSL and is never committed.
- `APP_ENV=production` is set.
- Supabase Data API is disabled because this app does not use it.
- Only the publishable Supabase key is used; no secret or `service_role` key is exposed.
- Cloud Run remains at one maximum instance until migration locking is implemented.
- The Supabase Auth Site URL matches the production frontend.
- The Cloud Run health endpoint works and all migration filenames are recorded.
- Old Cloud Run revisions and the old Supabase project are retained until the new environment is verified.

## Official references

- [Deploy a Cloud Run service from source](https://cloud.google.com/run/docs/deploying-source-code)
- [Configure Cloud Run secrets](https://cloud.google.com/run/docs/configuring/services/secrets)
- [Configure a Cloud Run service identity](https://cloud.google.com/run/docs/configuring/services/service-identity)
- [Cloud Run authentication overview](https://cloud.google.com/run/docs/authenticating/overview)
- [Supabase database connection methods](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Secure or disable the Supabase Data API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase Auth redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
