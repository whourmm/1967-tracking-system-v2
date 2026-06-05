package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/tracking-system-v2/backend/internal/models"
)

// FellowHandler serves fellow-related endpoints.
type FellowHandler struct {
	DB *sql.DB
}

// List returns all fellows as JSON.
func (h *FellowHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`SELECT id, name, email, status, created_at FROM fellows ORDER BY id`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	fellows := []models.Fellow{}
	for rows.Next() {
		var f models.Fellow
		if err := rows.Scan(&f.ID, &f.Name, &f.Email, &f.Status, &f.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		fellows = append(fellows, f)
	}

	writeJSON(w, http.StatusOK, fellows)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
