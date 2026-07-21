# Backend API tests

Import these two files into Postman:

- `backend-all.postman_collection.json`
- `cloud.postman_environment.json`

Select the **Tracking System V2 - Cloud** environment and set:

- `baseUrl` to the deployed backend URL, without a trailing slash.
- `supabaseUrl` and `supabaseKey`.
- Either the admin/fellow email and password pairs, or valid `adminToken` and
  `fellowToken` access tokens.

The admin account must already map to a database user with `role = 'admin'`;
the fellow account must map to `role = 'fellow'`.

Run the complete collection in order. The login requests are skipped when a
token is already set. Clear an expired token to let the collection log in
again.

`runMutations` defaults to `false`, so cloud data is not changed. Set it to
`true` only when you want the CRUD, submission, sync, and cleanup tests.

The write run deletes its temporary fellow, case, sprint, resource, event, and
their dependent rows. It leaves one assignment named `POSTMAN DELETE ME ...`
because the backend has no assignment-delete endpoint.

The case-submission sync test needs a team. The collection takes the first
team returned by `GET /api/teams`; set `teamId` manually when the database has
no teams.

Optional command-line run:

```powershell
npx newman run docs/postman/backend-all.postman_collection.json `
  -e docs/postman/cloud.postman_environment.json `
  --env-var "baseUrl=https://your-backend.example.com" `
  --env-var "adminToken=..." `
  --env-var "fellowToken=..."
```

Do not commit an exported environment containing real passwords, keys, or
tokens.
