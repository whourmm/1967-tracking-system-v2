# Tracking System V2

Sample project structure for a Vite frontend, Go backend, SQLite database, and Docker deployment flow.

## Docker Development

Create local environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Start the full stack:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- SQLite database path inside container: `/app/data/asean_tracker.db`
- SQLite database path on host: `backend/data/asean_tracker.db`

## Notes

The Docker setup is ready, but the project still needs the real Vite app files and Go module contents before the images can build successfully.
