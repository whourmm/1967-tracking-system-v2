package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/tracking-system-v2/backend/internal/models"
)

// FellowHandler serves fellow-related endpoints.
type FellowHandler struct {
	DB *sql.DB
}

// List returns all fellows as JSON.
func (h *FellowHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`
		SELECT u.id, COALESCE(u.name, ''), COALESCE(u.gmail, ''), COALESCE(f.status, ''), u.created_at
		FROM fellow f
		JOIN "user" u ON u.id = f.user_id
		ORDER BY u.id
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	fellows := []models.Fellow{}
	for rows.Next() {
		var f models.Fellow
		var createdAt time.Time
		if err := rows.Scan(&f.ID, &f.Name, &f.Email, &f.Status, &createdAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		f.CreatedAt = createdAt.Format(time.RFC3339)
		fellows = append(fellows, f)
	}

	writeJSON(w, http.StatusOK, fellows)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
