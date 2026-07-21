package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
)

type TeamHandler struct {
	DB *sql.DB
}

// List returns teams with group, case, and member summary.
// GET /api/teams
func (h *TeamHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.QueryContext(r.Context(), `
		SELECT
			t.id, t.group_id, t.name, t.case_id,
			c.title AS case_title,
			COUNT(f.user_id) AS member_count,
			t.created_at, t.update_at
		FROM team t
		LEFT JOIN "case" c ON c.id = t.case_id
		LEFT JOIN fellow f ON f.team_id = t.id
		GROUP BY t.id, c.title
		ORDER BY t.id
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	type TeamItem struct {
		ID          int64     `json:"id"`
		GroupID     *int64    `json:"group_id"`
		Name        *string   `json:"name"`
		CaseID      *int64    `json:"case_id"`
		CaseTitle   *string   `json:"case_title"`
		MemberCount int       `json:"member_count"`
		CreatedAt   time.Time `json:"created_at"`
		UpdateAt    time.Time `json:"update_at"`
	}

	teams := []TeamItem{}
	for rows.Next() {
		var t TeamItem
		if err := rows.Scan(
			&t.ID, &t.GroupID, &t.Name, &t.CaseID, &t.CaseTitle,
			&t.MemberCount, &t.CreatedAt, &t.UpdateAt,
		); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		teams = append(teams, t)
	}

	writeData(w, http.StatusOK, teams)
}

// AdminSaveAssignments bulk-assigns fellows to teams and groups.
// POST /api/admin/teams/assignments
func (h *TeamHandler) AdminSaveAssignments(w http.ResponseWriter, r *http.Request) {
	var body struct {
		SprintID    *int64 `json:"sprint_id"`
		Assignments []struct {
			MemberID int64  `json:"member_id"`
			TeamID   *int64 `json:"team_id"`
			GroupID  *int64 `json:"group_id"`
		} `json:"assignments"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	tx, err := h.DB.BeginTx(r.Context(), nil)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer tx.Rollback()

	var updatedCount int
	for _, a := range body.Assignments {
		res, err := tx.ExecContext(r.Context(), `
			UPDATE fellow SET
				team_id  = $1,
				group_id = $2
			WHERE user_id = $3
		`, a.TeamID, a.GroupID, a.MemberID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if n, _ := res.RowsAffected(); n > 0 {
			updatedCount++
		}
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeData(w, http.StatusOK, map[string]any{"updated_count": updatedCount})
}
