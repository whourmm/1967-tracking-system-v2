package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
)

type apiResponse struct {
	Data  any     `json:"data"`
	Error *string `json:"error"`
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeData(w http.ResponseWriter, status int, data any) {
	writeJSON(w, status, apiResponse{Data: data})
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, apiResponse{Data: nil, Error: &msg})
}

func pathID(r *http.Request, name string) (int64, bool) {
	s := r.PathValue(name)
	id, err := strconv.ParseInt(s, 10, 64)
	return id, err == nil
}

func resolveCohortID(ctx context.Context, db *sql.DB, explicitID, sprintID *int64) (int64, error) {
	if explicitID != nil && *explicitID > 0 {
		return *explicitID, nil
	}
	if sprintID != nil && *sprintID > 0 {
		var cohortID sql.NullInt64
		err := db.QueryRowContext(ctx, `SELECT cohort_id FROM sprint WHERE id = $1`, *sprintID).Scan(&cohortID)
		if err != nil {
			return 0, err
		}
		if cohortID.Valid {
			return cohortID.Int64, nil
		}
	}

	var cohortID int64
	err := db.QueryRowContext(ctx, `
		SELECT id
		FROM cohort
		WHERE is_active = true
		ORDER BY id
		LIMIT 1
	`).Scan(&cohortID)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, errors.New("an active cohort is required")
	}
	return cohortID, err
}

func memberCohortID(ctx context.Context, db *sql.DB, memberID int64) *int64 {
	var cohortID sql.NullInt64
	_ = db.QueryRowContext(ctx, `
		SELECT COALESCE(g.cohort_id, tg.cohort_id, active.id)
		FROM fellow f
		LEFT JOIN "group" g ON g.id = f.group_id
		LEFT JOIN team t ON t.id = f.team_id
		LEFT JOIN "group" tg ON tg.id = t.group_id
		LEFT JOIN LATERAL (
			SELECT id FROM cohort WHERE is_active = true ORDER BY id LIMIT 1
		) active ON true
		WHERE f.user_id = $1
	`, memberID).Scan(&cohortID)
	if !cohortID.Valid {
		return nil
	}
	return &cohortID.Int64
}
