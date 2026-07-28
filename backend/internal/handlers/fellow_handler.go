package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/tracking-system-v2/backend/internal/middleware"
)

// FellowHandler serves fellow-related endpoints.
type FellowHandler struct {
	DB *sql.DB
}

// Me returns the current authenticated app profile.
// GET /api/me
func (h *FellowHandler) Me(w http.ResponseWriter, r *http.Request) {
	id, err := currentFellowID(r.Context())
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
		ID          int64          `json:"id"`
		Name        *string        `json:"name"`
		Email       *string        `json:"email"`
		Role        *string        `json:"role"`
		PhotoURL    *string        `json:"photo_url"`
		DiscordName *string        `json:"discord_name"`
		LineID      *string        `json:"line_id"`
		Phone       *string        `json:"phone"`
		LinkedIn    *string        `json:"linkedin"`
		Country     *string        `json:"country"`
		Fellow      *FellowSummary `json:"fellow"`
	}

	var res MeResponse
	var fellow FellowSummary
	var teamID, cohortID sql.NullInt64
	var teamName, cohortName sql.NullString

	err = h.DB.QueryRowContext(r.Context(), `
		SELECT
			u.id, u.name, u.gmail, u.role, u.photo_url,
			u.discord_name, u.line_id, u.phone, u.linkedin, u.country,
			fp.team_id, t.name,
			g.cohort_id, c.name,
			fp.university, fp.major, fp.status, fp.teamflow
		FROM "user" u
		LEFT JOIN fellow fp ON fp.user_id = u.id
		LEFT JOIN team t ON t.id = fp.team_id
		LEFT JOIN "group" g ON g.id = COALESCE(fp.group_id, t.group_id)
		LEFT JOIN cohort c ON c.id = g.cohort_id
		WHERE u.id = $1
	`, id).Scan(
		&res.ID, &res.Name, &res.Email, &res.Role, &res.PhotoURL,
		&res.DiscordName, &res.LineID, &res.Phone, &res.LinkedIn, &res.Country,
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
	if res.Role != nil && *res.Role == "fellow" {
		res.Fellow = &fellow
	}

	writeData(w, http.StatusOK, res)
}

// List returns all fellows as JSON (raw, no envelope — existing contract).
func (h *FellowHandler) List(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.CurrentUser(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "authenticated user missing from request")
		return
	}
	var cohortID *int64
	if user.Role == "fellow" {
		cohortID = memberCohortID(r.Context(), h.DB, user.ID)
	}
	rows, err := h.DB.QueryContext(r.Context(), `
		WITH visible_fellows AS (
			SELECT
				u.id, COALESCE(u.name, '') AS name, COALESCE(u.gmail, '') AS email,
				u.photo_url, u.country, COALESCE(f.status, '') AS status,
				f.university, f.teamflow, f.team_id, t.name AS team_name,
				u.created_at,
				COALESCE(g.cohort_id, tg.cohort_id, $2) AS cohort_id
			FROM fellow f
			JOIN "user" u ON u.id = f.user_id
			LEFT JOIN "group" g ON g.id = f.group_id
			LEFT JOIN team t ON t.id = f.team_id
			LEFT JOIN "group" tg ON tg.id = t.group_id
			WHERE $1::boolean OR COALESCE(g.cohort_id, tg.cohort_id, $2) = $2
		)
		SELECT
			v.id, v.name, v.email, v.photo_url, v.country, v.status,
			v.university, v.teamflow, v.team_id, v.team_name, v.created_at,
			COUNT(a.id) AS total_assignments,
			COUNT(asub.assignment_id) FILTER (WHERE asub.submit_status = 1) AS completed_assignments
		FROM visible_fellows v
		LEFT JOIN assignment a ON a.cohort_id = v.cohort_id
		LEFT JOIN assignment_submission asub
			ON asub.assignment_id = a.id AND asub.member_id = v.id
		GROUP BY v.id, v.name, v.email, v.photo_url, v.country, v.status,
			v.university, v.teamflow, v.team_id, v.team_name, v.created_at
		ORDER BY v.id
	`, user.Role == "admin", cohortID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type FellowItem struct {
		ID                   int64   `json:"id"`
		Name                 string  `json:"name"`
		Email                string  `json:"email"`
		PhotoURL             *string `json:"photo_url"`
		Country              *string `json:"country"`
		Status               string  `json:"status"`
		University           *string `json:"university"`
		Teamflow             *string `json:"teamflow"`
		TeamID               *int64  `json:"team_id"`
		TeamName             *string `json:"team_name"`
		CreatedAt            string  `json:"created_at"`
		TotalAssignments     int     `json:"total_assignments"`
		CompletedAssignments int     `json:"completed_assignments"`
		ProgressPercent      int     `json:"progress_percent"`
	}

	fellows := []FellowItem{}
	for rows.Next() {
		var f FellowItem
		var createdAt time.Time
		if err := rows.Scan(
			&f.ID, &f.Name, &f.Email, &f.PhotoURL, &f.Country, &f.Status,
			&f.University, &f.Teamflow, &f.TeamID, &f.TeamName, &createdAt,
			&f.TotalAssignments, &f.CompletedAssignments,
		); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		f.CreatedAt = createdAt.Format(time.RFC3339)
		if f.TotalAssignments > 0 {
			f.ProgressPercent = int(float64(f.CompletedAssignments)/float64(f.TotalAssignments)*100 + 0.5)
		}
		fellows = append(fellows, f)
	}

	writeJSON(w, http.StatusOK, fellows)
}

// TeamMembers returns all fellows assigned to the current fellow's team.
// GET /api/fellow/team
func (h *FellowHandler) TeamMembers(w http.ResponseWriter, r *http.Request) {
	memberID, err := currentFellowID(r.Context())
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "current fellow not found")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	var teamID sql.NullInt64
	if err := h.DB.QueryRowContext(r.Context(), `
		SELECT team_id FROM fellow WHERE user_id = $1
	`, memberID).Scan(&teamID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if !teamID.Valid {
		writeData(w, http.StatusOK, []any{})
		return
	}

	rows, err := h.DB.QueryContext(r.Context(), `
		WITH team_fellows AS (
			SELECT
				u.id, u.name, u.gmail, u.photo_url, u.country,
				f.university, f.teamflow, f.team_id, t.name AS team_name,
				COALESCE(g.cohort_id, tg.cohort_id) AS cohort_id
			FROM fellow f
			JOIN "user" u ON u.id = f.user_id
			LEFT JOIN team t ON t.id = f.team_id
			LEFT JOIN "group" g ON g.id = f.group_id
			LEFT JOIN "group" tg ON tg.id = t.group_id
			WHERE f.team_id = $1
		)
		SELECT
			tf.id, tf.name, tf.gmail, tf.photo_url, tf.country,
			tf.university, tf.teamflow, tf.team_id, tf.team_name,
			COUNT(a.id) AS total_assignments,
			COUNT(asub.assignment_id) FILTER (WHERE asub.submit_status = 1) AS completed_assignments
		FROM team_fellows tf
		LEFT JOIN assignment a ON a.cohort_id = tf.cohort_id
		LEFT JOIN assignment_submission asub
			ON asub.assignment_id = a.id AND asub.member_id = tf.id
		GROUP BY tf.id, tf.name, tf.gmail, tf.photo_url, tf.country,
			tf.university, tf.teamflow, tf.team_id, tf.team_name
		ORDER BY CASE WHEN tf.id = $2 THEN 0 ELSE 1 END, tf.name
	`, teamID.Int64, memberID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	type TeamMember struct {
		ID                   int64   `json:"id"`
		Name                 *string `json:"name"`
		Email                *string `json:"email"`
		PhotoURL             *string `json:"photo_url"`
		Country              *string `json:"country"`
		University           *string `json:"university"`
		Teamflow             *string `json:"teamflow"`
		TeamID               *int64  `json:"team_id"`
		TeamName             *string `json:"team_name"`
		TotalAssignments     int     `json:"total_assignments"`
		CompletedAssignments int     `json:"completed_assignments"`
		ProgressPercent      int     `json:"progress_percent"`
	}

	members := []TeamMember{}
	for rows.Next() {
		var item TeamMember
		if err := rows.Scan(
			&item.ID, &item.Name, &item.Email, &item.PhotoURL, &item.Country,
			&item.University, &item.Teamflow, &item.TeamID, &item.TeamName,
			&item.TotalAssignments, &item.CompletedAssignments,
		); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if item.TotalAssignments > 0 {
			item.ProgressPercent = int(float64(item.CompletedAssignments)/float64(item.TotalAssignments)*100 + 0.5)
		}
		members = append(members, item)
	}

	writeData(w, http.StatusOK, members)
}

// UpdateProfile updates the current fellow's editable profile fields.
// PATCH /api/fellow/profile
func (h *FellowHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	memberID, err := currentFellowID(r.Context())
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "current fellow not found")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	var body struct {
		Name        *string `json:"name"`
		PhotoURL    *string `json:"photo_url"`
		DiscordName *string `json:"discord_name"`
		LineID      *string `json:"line_id"`
		Phone       *string `json:"phone"`
		LinkedIn    *string `json:"linkedin"`
		Country     *string `json:"country"`
		University  *string `json:"university"`
		Major       *string `json:"major"`
		Teamflow    *string `json:"teamflow"`
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
			name = COALESCE($1, name),
			photo_url = COALESCE($2, photo_url),
			discord_name = COALESCE($3, discord_name),
			line_id = COALESCE($4, line_id),
			phone = COALESCE($5, phone),
			linkedin = COALESCE($6, linkedin),
			country = COALESCE($7, country),
			update_at = NOW()
		WHERE id = $8
	`, body.Name, body.PhotoURL, body.DiscordName, body.LineID, body.Phone, body.LinkedIn, body.Country, memberID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		writeError(w, http.StatusNotFound, "current fellow not found")
		return
	}

	_, err = tx.ExecContext(r.Context(), `
		UPDATE fellow SET
			university = COALESCE($1, university),
			major = COALESCE($2, major),
			teamflow = COALESCE($3, teamflow)
		WHERE user_id = $4
	`, body.University, body.Major, body.Teamflow, memberID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.Me(w, r)
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
	user, authenticated := middleware.CurrentUser(r.Context())
	if !authenticated {
		writeError(w, http.StatusUnauthorized, "authenticated user missing from request")
		return
	}
	var cohortID *int64
	if user.Role == "fellow" {
		cohortID = memberCohortID(r.Context(), h.DB, user.ID)
	}

	err := h.DB.QueryRowContext(r.Context(), `
		SELECT
			u.id, u.name, u.gmail, u.discord_name, u.line_id, u.phone, u.linkedin, u.photo_url,
			u.country, fp.university, fp.major, fp.status, fp.teamflow,
			fp.team_id, t.name,
			u.created_at, u.last_login_at
		FROM "user" u
		JOIN fellow fp ON fp.user_id = u.id
		LEFT JOIN team t ON t.id = fp.team_id
		LEFT JOIN "group" g ON g.id = fp.group_id
		LEFT JOIN "group" tg ON tg.id = t.group_id
		WHERE u.id = $1
			AND ($2::boolean OR COALESCE(g.cohort_id, tg.cohort_id, $3) = $3)
	`, id, user.Role == "admin", cohortID).Scan(
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
			u.id, u.name, u.gmail, u.photo_url, u.country,
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
		PhotoURL    *string    `json:"photo_url"`
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
			&f.ID, &f.Name, &f.Email, &f.PhotoURL, &f.Country,
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

// AdminCreate creates or updates a user + fellow row.
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
	if body.Name == nil || strings.TrimSpace(*body.Name) == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}
	if body.Gmail == nil || strings.TrimSpace(*body.Gmail) == "" {
		writeError(w, http.StatusBadRequest, "gmail is required")
		return
	}
	*body.Gmail = strings.ToLower(strings.TrimSpace(*body.Gmail))

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
		ON CONFLICT (LOWER(gmail)) WHERE gmail IS NOT NULL DO UPDATE SET
			name = EXCLUDED.name,
			country = COALESCE(EXCLUDED.country, "user".country),
			update_at = NOW()
		WHERE "user".role = 'fellow'
		RETURNING id
	`, body.Name, body.Gmail, body.Country).Scan(&userID)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusConflict, "this email belongs to a non-fellow account")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	_, err = tx.ExecContext(r.Context(), `
		INSERT INTO fellow (user_id, university, major, teamflow, status, team_id, group_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (user_id) DO UPDATE SET
			university = COALESCE(EXCLUDED.university, fellow.university),
			major = COALESCE(EXCLUDED.major, fellow.major),
			teamflow = COALESCE(EXCLUDED.teamflow, fellow.teamflow),
			status = COALESCE(EXCLUDED.status, fellow.status),
			team_id = COALESCE(EXCLUDED.team_id, fellow.team_id),
			group_id = COALESCE(EXCLUDED.group_id, fellow.group_id)
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
