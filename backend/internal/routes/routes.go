package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/tracking-system-v2/backend/internal/handlers"
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

	return withCORS(mux)
}

// withCORS allows the Vite dev server (localhost:5173) to call the API.
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
