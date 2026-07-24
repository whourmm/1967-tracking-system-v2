package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/tracking-system-v2/backend/internal/handlers"
	"github.com/tracking-system-v2/backend/internal/middleware"
)

// New builds the application's HTTP handler with all routes registered.
func New(db *sql.DB, supabaseURL, publishableKey string) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	fellow := &handlers.FellowHandler{DB: db}
	mux.HandleFunc("GET /api/me", fellow.Me)
	mux.HandleFunc("GET /api/fellows", fellow.List)
	mux.HandleFunc("GET /api/fellows/{fellowId}", fellow.GetDetail)
	mux.HandleFunc("GET /api/admin/fellows", fellow.AdminList)
	mux.HandleFunc("POST /api/admin/fellows", fellow.AdminCreate)
	mux.HandleFunc("PATCH /api/admin/fellows/{fellowId}", fellow.AdminUpdate)
	mux.HandleFunc("DELETE /api/admin/fellows/{fellowId}", fellow.AdminDelete)

	assignment := &handlers.AssignmentHandler{DB: db}
	mux.HandleFunc("GET /api/fellow/assignments", assignment.FellowList)
	mux.HandleFunc("POST /api/fellow/assignments/{assignmentId}/submit", assignment.FellowSubmit)
	mux.HandleFunc("GET /api/admin/assignments", assignment.AdminList)
	mux.HandleFunc("POST /api/admin/assignments", assignment.AdminCreate)
	mux.HandleFunc("PATCH /api/admin/assignments/{assignmentId}", assignment.AdminUpdate)
	mux.HandleFunc("DELETE /api/admin/assignments/{assignmentId}", assignment.AdminDelete)
	mux.HandleFunc("POST /api/admin/assignments/{assignmentId}/sync", assignment.AdminSync)
	mux.HandleFunc("GET /api/admin/assignments/{assignmentId}/submissions", assignment.AdminSubmissions)

	event := &handlers.EventHandler{DB: db}
	mux.HandleFunc("GET /api/events", event.List)
	mux.HandleFunc("POST /api/admin/events", event.AdminCreate)
	mux.HandleFunc("PATCH /api/admin/events/{eventId}", event.AdminUpdate)
	mux.HandleFunc("DELETE /api/admin/events/{eventId}", event.AdminDelete)

	team := &handlers.TeamHandler{DB: db}
	mux.HandleFunc("GET /api/teams", team.List)
	mux.HandleFunc("POST /api/admin/teams/assignments", team.AdminSaveAssignments)

	admin := &handlers.AdminHandler{DB: db}
	learning := &handlers.LearningHandler{DB: db}
	mux.HandleFunc("GET /api/admin/overview", admin.Overview)
	mux.HandleFunc("GET /api/cases", admin.ListCases)
	mux.HandleFunc("GET /api/admin/cases", admin.ListCases)
	mux.HandleFunc("GET /api/admin/cases/{caseId}", admin.GetCase)
	mux.HandleFunc("POST /api/admin/cases", admin.CreateCase)
	mux.HandleFunc("PATCH /api/admin/cases/{caseId}", admin.UpdateCase)
	mux.HandleFunc("DELETE /api/admin/cases/{caseId}", admin.DeleteCase)
	mux.HandleFunc("POST /api/admin/cases/{caseId}/sync", admin.SyncCaseSubmission)
	mux.HandleFunc("GET /api/cohorts/active/sprints", admin.ListActiveCohortSprints)
	mux.HandleFunc("GET /api/admin/sprints", admin.ListSprints)
	mux.HandleFunc("GET /api/admin/sprints/{sprintId}", admin.GetSprint)
	mux.HandleFunc("POST /api/admin/sprints", admin.CreateSprint)
	mux.HandleFunc("PATCH /api/admin/sprints/{sprintId}", admin.UpdateSprint)
	mux.HandleFunc("DELETE /api/admin/sprints/{sprintId}", admin.DeleteSprint)
	mux.HandleFunc("GET /api/resources", learning.ListResources)
	mux.HandleFunc("GET /api/fellow/learning", learning.GetLearning)
	mux.HandleFunc("POST /api/fellow/resources/{resourceId}/read", learning.MarkResourceRead)
	mux.HandleFunc("GET /api/admin/resources", admin.ListResources)
	mux.HandleFunc("GET /api/admin/resources/{resourceId}", admin.GetResource)
	mux.HandleFunc("POST /api/admin/resources", admin.CreateResource)
	mux.HandleFunc("PATCH /api/admin/resources/{resourceId}", admin.UpdateResource)
	mux.HandleFunc("DELETE /api/admin/resources/{resourceId}", admin.DeleteResource)
	mux.HandleFunc("GET /api/admin/resources/read-status", admin.ResourceReadStatus)

	for _, route := range plannedRoutes {
		mux.HandleFunc(route, notImplemented)
	}

	return middleware.CORS(middleware.SupabaseAuth(db, supabaseURL, publishableKey, mux))
}

var plannedRoutes = []string{
	"GET /api/fellow/team",
	"GET /api/progress",
	"GET /api/progress/fellows/{fellowId}",
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
