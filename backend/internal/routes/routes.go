package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/tracking-system-v2/backend/internal/handlers"
	"github.com/tracking-system-v2/backend/internal/middleware"
)

// New builds the application's HTTP handler with all routes registered.
func New(db *sql.DB) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	fellows := &handlers.FellowHandler{DB: db}
	mux.HandleFunc("GET /api/fellows", fellows.List)

	for _, route := range plannedRoutes {
		mux.HandleFunc(route, notImplemented)
	}

	return middleware.CORS(mux)
}

var plannedRoutes = []string{
	"GET /api/me",
	"GET /api/fellows/{fellowId}",
	"GET /api/admin/fellows",
	"POST /api/admin/fellows",
	"PATCH /api/admin/fellows/{fellowId}",
	"DELETE /api/admin/fellows/{fellowId}",
	"GET /api/cohorts/active/sprints",
	"GET /api/admin/sprints",
	"POST /api/admin/sprints",
	"PATCH /api/admin/sprints/{sprintId}",
	"DELETE /api/admin/sprints/{sprintId}",
	"GET /api/fellow/assignments",
	"POST /api/fellow/assignments/{assignmentId}/submit",
	"GET /api/admin/assignments",
	"POST /api/admin/assignments",
	"PATCH /api/admin/assignments/{assignmentId}",
	"POST /api/admin/assignments/{assignmentId}/sync",
	"GET /api/admin/assignments/{assignmentId}/submissions",
	"GET /api/resources",
	"POST /api/fellow/resources/{resourceId}/read",
	"GET /api/admin/resources",
	"POST /api/admin/resources",
	"PATCH /api/admin/resources/{resourceId}",
	"DELETE /api/admin/resources/{resourceId}",
	"GET /api/admin/resources/read-status",
	"GET /api/fellow/learning",
	"GET /api/cases",
	"POST /api/admin/cases",
	"PATCH /api/admin/cases/{caseId}",
	"DELETE /api/admin/cases/{caseId}",
	"GET /api/teams",
	"GET /api/fellow/team",
	"POST /api/admin/teams/assignments",
	"GET /api/progress",
	"GET /api/progress/fellows/{fellowId}",
	"GET /api/events",
	"POST /api/admin/events",
	"PATCH /api/admin/events/{eventId}",
	"DELETE /api/admin/events/{eventId}",
	"PATCH /api/fellow/profile",
}

func notImplemented(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"data":  nil,
		"error": "not implemented",
	})
}
