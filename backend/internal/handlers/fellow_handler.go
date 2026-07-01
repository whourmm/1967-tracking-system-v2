package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
)

// FellowHandler serves fellow-related endpoints.
type FellowHandler struct {
	DB *sql.DB
}

// Me returns the current fellow profile using the temporary dev identity.
// GET /api/me
func (h *FellowHandler) Me(w http.ResponseWriter, r *http.Request) {
	id, err := currentFellowID(r.Context(), h.DB)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "current fellow not found")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	type FellowSummary struct {
		TeamID     *int64  `json:"team_id"`
		TeamName   *string `json:"team_name"`
		CohortID   *int64  `json:"cohort_id"`
		CohortName *string `json:"cohort_name"`
		University *string `json:"university"`
		Major      *string `json:"major"`
		Status     *string `json:"status"`
		Teamflow   *string `json:"teamflow"`
	}

	type MeResponse struct {
		ID       int64          `json:"id"`
		Name     *string        `json:"name"`
		Email    *string        `json:"email"`
		Role     *string        `json:"role"`
		PhotoURL *string        `json:"photo_url"`
		Fellow   *FellowSummary `json:"fellow"`
	}

	var res MeResponse
	var fellow FellowSummary
	var teamID, cohortID sql.NullInt64
	var teamName, cohortName sql.NullString

	err = h.DB.QueryRowContext(r.Context(), `
		SELECT
			u.id, u.name, u.gmail, u.role, u.photo_url,
			fp.team_id, t.name,
			g.cohort_id, c.name,
			fp.university, fp.major, fp.status, fp.teamflow
		FROM "user" u
		JOIN fellow fp ON fp.user_id = u.id
		LEFT JOIN team t ON t.id = fp.team_id
		LEFT JOIN "group" g ON g.id = COALESCE(fp.group_id, t.group_id)
		LEFT JOIN cohort c ON c.id = g.cohort_id
		WHERE u.id = $1
	`, id).Scan(
		&res.ID, &res.Name, &res.Email, &res.Role, &res.PhotoURL,
		&teamID, &teamName,
		&cohortID, &cohortName,
		&fellow.University, &fellow.Major, &fellow.Status, &fellow.Teamflow,
	)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "current fellow not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	fellow.TeamID = int64Ptr(teamID)
	fellow.TeamName = stringPtr(teamName)
	fellow.CohortID = int64Ptr(cohortID)
	fellow.CohortName = stringPtr(cohortName)
	res.Fellow = &fellow

	writeData(w, http.StatusOK, res)
}

// List returns all fellows as JSON (raw, no envelope — existing contract).
func (h *FellowHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.QueryContext(r.Context(), `
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

	type FellowItem struct {
		ID        int64  `json:"id"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		Status    string `json:"status"`
		CreatedAt string `json:"created_at"`
	}

	fellows := []FellowItem{}
	for rows.Next() {
		var f FellowItem
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

// GetDetail returns one fellow's full profile.
// GET /api/fellows/{fellowId}
func (h *FellowHandler) GetDetail(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "fellowId")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid fellow id")
		return
	}

	type TeamRef struct {
		ID   int64  `json:"id"`
		Name string `json:"name"`
	}

	type FellowDetail struct {
		ID          int64      `json:"id"`
		Name        *string    `json:"name"`
		Email       *string    `json:"email"`
		DiscordName *string    `json:"discord_name"`
		LineID      *string    `json:"line_id"`
		Phone       *string    `json:"phone"`
		LinkedIn    *string    `json:"linkedin"`
		PhotoURL    *string    `json:"photo_url"`
		Country     *string    `json:"country"`
		University  *string    `json:"university"`
		Major       *string    `json:"major"`
		Status      *string    `json:"status"`
		Teamflow    *string    `json:"teamflow"`
		Team        *TeamRef   `json:"team"`
		CreatedAt   time.Time  `json:"created_at"`
		LastLoginAt *time.Time `json:"last_login_at"`
	}

	var d FellowDetail
	var teamID sql.NullInt64
	var teamName sql.NullString

	err := h.DB.QueryRowContext(r.Context(), `
		SELECT
			u.id, u.name, u.gmail, u.discord_name, u.line_id, u.phone, u.linkedin, u.photo_url,
			u.country, fp.university, fp.major, fp.status, fp.teamflow,
			fp.team_id, t.name,
			u.created_at, u.last_login_at
		FROM "user" u
		JOIN fellow fp ON fp.user_id = u.id
		LEFT JOIN team t ON t.id = fp.team_id
		WHERE u.id = $1
	`, id).Scan(
		&d.ID, &d.Name, &d.Email, &d.DiscordName, &d.LineID, &d.Phone, &d.LinkedIn, &d.PhotoURL,
		&d.Country, &d.University, &d.Major, &d.Status, &d.Teamflow,
		&teamID, &teamName,
		&d.CreatedAt, &d.LastLoginAt,
	)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "fellow not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if teamID.Valid {
		d.Team = &TeamRef{ID: teamID.Int64, Name: teamName.String}
	}

	writeData(w, http.StatusOK, d)
}

// AdminList returns all fellows with team context for the admin roster.
// GET /api/admin/fellows
func (h *FellowHandler) AdminList(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.QueryContext(r.Context(), `
		SELECT
			u.id, u.name, u.gmail, u.country,
			fp.university, fp.teamflow, fp.team_id, t.name AS team_name,
			fp.status, u.created_at, u.last_login_at
		FROM "user" u
		JOIN fellow fp ON fp.user_id = u.id
		LEFT JOIN team t ON t.id = fp.team_id
		ORDER BY u.id
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	type FellowAdmin struct {
		ID          int64      `json:"id"`
		Name        *string    `json:"name"`
		Email       *string    `json:"email"`
		Country     *string    `json:"country"`
		University  *string    `json:"university"`
		Teamflow    *string    `json:"teamflow"`
		TeamID      *int64     `json:"team_id"`
		TeamName    *string    `json:"team_name"`
		Status      *string    `json:"status"`
		CreatedAt   time.Time  `json:"created_at"`
		LastLoginAt *time.Time `json:"last_login_at"`
	}

	fellows := []FellowAdmin{}
	for rows.Next() {
		var f FellowAdmin
		if err := rows.Scan(
			&f.ID, &f.Name, &f.Email, &f.Country,
			&f.University, &f.Teamflow, &f.TeamID, &f.TeamName,
			&f.Status, &f.CreatedAt, &f.LastLoginAt,
		); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		fellows = append(fellows, f)
	}

	writeData(w, http.StatusOK, fellows)
}

// AdminCreate creates a user + fellow row.
// POST /api/admin/fellows
func (h *FellowHandler) AdminCreate(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name       *string `json:"name"`
		Gmail      *string `json:"gmail"`
		Country    *string `json:"country"`
		University *string `json:"university"`
		Major      *string `json:"major"`
		Teamflow   *string `json:"teamflow"`
		Status     *string `json:"status"`
		TeamID     *int64  `json:"team_id"`
		GroupID    *int64  `json:"group_id"`
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

	var userID int64
	err = tx.QueryRowContext(r.Context(), `
		INSERT INTO "user" (name, gmail, country, role)
		VALUES ($1, $2, $3, 'fellow')
		RETURNING id
	`, body.Name, body.Gmail, body.Country).Scan(&userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	_, err = tx.ExecContext(r.Context(), `
		INSERT INTO fellow (user_id, university, major, teamflow, status, team_id, group_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, userID, body.University, body.Major, body.Teamflow, body.Status, body.TeamID, body.GroupID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeData(w, http.StatusCreated, map[string]any{
		"id":     userID,
		"name":   body.Name,
		"email":  body.Gmail,
		"status": body.Status,
	})
}

// AdminUpdate updates editable user/fellow fields.
// PATCH /api/admin/fellows/{fellowId}
func (h *FellowHandler) AdminUpdate(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "fellowId")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid fellow id")
		return
	}

	var body struct {
		Name       *string `json:"name"`
		Country    *string `json:"country"`
		University *string `json:"university"`
		Major      *string `json:"major"`
		Teamflow   *string `json:"teamflow"`
		Status     *string `json:"status"`
		TeamID     *int64  `json:"team_id"`
		GroupID    *int64  `json:"group_id"`
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

	res, err := tx.ExecContext(r.Context(), `
		UPDATE "user" SET
			name    = COALESCE($1, name),
			country = COALESCE($2, country),
			update_at = NOW()
		WHERE id = $3
	`, body.Name, body.Country, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		writeError(w, http.StatusNotFound, "fellow not found")
		return
	}

	_, err = tx.ExecContext(r.Context(), `
		UPDATE fellow SET
			university = COALESCE($1, university),
			major      = COALESCE($2, major),
			teamflow   = COALESCE($3, teamflow),
			status     = COALESCE($4, status),
			team_id    = COALESCE($5, team_id),
			group_id   = COALESCE($6, group_id)
		WHERE user_id = $7
	`, body.University, body.Major, body.Teamflow, body.Status, body.TeamID, body.GroupID, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeData(w, http.StatusOK, map[string]any{
		"id":       id,
		"name":     body.Name,
		"status":   body.Status,
		"team_id":  body.TeamID,
		"teamflow": body.Teamflow,
	})
}

// AdminDelete removes a fellow and their user account.
// DELETE /api/admin/fellows/{fellowId}
func (h *FellowHandler) AdminDelete(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "fellowId")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid fellow id")
		return
	}

	res, err := h.DB.ExecContext(r.Context(), `DELETE FROM "user" WHERE id = $1`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		writeError(w, http.StatusNotFound, "fellow not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
