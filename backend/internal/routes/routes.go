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

	admin := &handlers.AdminHandler{DB: db}
	mux.HandleFunc("GET /api/admin/overview", admin.Overview)
	mux.HandleFunc("GET /api/cases", admin.ListCases)
	mux.HandleFunc("GET /api/admin/cases", admin.ListCases)
	mux.HandleFunc("GET /api/admin/cases/{caseId}", admin.GetCase)
	mux.HandleFunc("POST /api/admin/cases", admin.CreateCase)
	mux.HandleFunc("PATCH /api/admin/cases/{caseId}", admin.UpdateCase)
	mux.HandleFunc("DELETE /api/admin/cases/{caseId}", admin.DeleteCase)
	mux.HandleFunc("GET /api/cohorts/active/sprints", admin.ListActiveCohortSprints)
	mux.HandleFunc("GET /api/admin/sprints", admin.ListSprints)
	mux.HandleFunc("GET /api/admin/sprints/{sprintId}", admin.GetSprint)
	mux.HandleFunc("POST /api/admin/sprints", admin.CreateSprint)
	mux.HandleFunc("PATCH /api/admin/sprints/{sprintId}", admin.UpdateSprint)
	mux.HandleFunc("DELETE /api/admin/sprints/{sprintId}", admin.DeleteSprint)
	mux.HandleFunc("GET /api/resources", admin.ListResources)
	mux.HandleFunc("GET /api/admin/resources", admin.ListResources)
	mux.HandleFunc("GET /api/admin/resources/{resourceId}", admin.GetResource)
	mux.HandleFunc("POST /api/admin/resources", admin.CreateResource)
	mux.HandleFunc("PATCH /api/admin/resources/{resourceId}", admin.UpdateResource)
	mux.HandleFunc("DELETE /api/admin/resources/{resourceId}", admin.DeleteResource)
	mux.HandleFunc("GET /api/admin/resources/read-status", admin.ResourceReadStatus)

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
	"GET /api/fellow/assignments",
	"POST /api/fellow/assignments/{assignmentId}/submit",
	"GET /api/admin/assignments",
	"POST /api/admin/assignments",
	"PATCH /api/admin/assignments/{assignmentId}",
	"POST /api/admin/assignments/{assignmentId}/sync",
	"GET /api/admin/assignments/{assignmentId}/submissions",
	"POST /api/fellow/resources/{resourceId}/read",
	"GET /api/fellow/learning",
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
