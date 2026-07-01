package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
)

type AssignmentHandler struct {
	DB *sql.DB
}

// FellowList returns assignment cards for the current fellow.
// GET /api/fellow/assignments
func (h *AssignmentHandler) FellowList(w http.ResponseWriter, r *http.Request) {
	memberID, err := currentFellowID(r.Context(), h.DB)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "current fellow not found")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	rows, err := h.DB.QueryContext(r.Context(), `
		SELECT
			a.id, a.cohort_id, a.sprint_id, a.learning_block_id, lb.code,
			a.title, a.form_url, a.deadline, a.description,
			COALESCE(asub.submit_status, 0), asub.submitted_at, asub.grade
		FROM assignment a
		LEFT JOIN learning_block lb ON lb.id = a.learning_block_id
		LEFT JOIN assignment_submission asub
			ON asub.assignment_id = a.id AND asub.member_id = $1
		ORDER BY a.deadline NULLS LAST, a.id
	`, memberID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	type FellowAssignment struct {
		ID              int64      `json:"id"`
		CohortID        *int64     `json:"cohort_id"`
		SprintID        *int64     `json:"sprint_id"`
		LearningBlockID *int64     `json:"learning_block_id"`
		LearningBlock   *string    `json:"learning_block"`
		Title           *string    `json:"title"`
		FormURL         *string    `json:"form_url"`
		Deadline        *time.Time `json:"deadline"`
		Description     *string    `json:"description"`
		SubmitStatus    int        `json:"submit_status"`
		StatusName      string     `json:"status_name"`
		SubmittedAt     *time.Time `json:"submitted_at"`
		Grade           *string    `json:"grade"`
	}

	assignments := []FellowAssignment{}
	now := time.Now()
	for rows.Next() {
		var item FellowAssignment
		var cohortID, sprintID, learningBlockID sql.NullInt64
		var learningBlock, title, formURL, description, grade sql.NullString
		var deadline, submittedAt sql.NullTime

		if err := rows.Scan(
			&item.ID, &cohortID, &sprintID, &learningBlockID, &learningBlock,
			&title, &formURL, &deadline, &description,
			&item.SubmitStatus, &submittedAt, &grade,
		); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		item.CohortID = int64Ptr(cohortID)
		item.SprintID = int64Ptr(sprintID)
		item.LearningBlockID = int64Ptr(learningBlockID)
		item.LearningBlock = stringPtr(learningBlock)
		item.Title = stringPtr(title)
		item.FormURL = stringPtr(formURL)
		item.Deadline = timePtr(deadline)
		item.Description = stringPtr(description)
		item.SubmittedAt = timePtr(submittedAt)
		item.Grade = stringPtr(grade)
		item.StatusName = "pending"
		if item.SubmitStatus == 1 {
			item.StatusName = "submitted"
		} else if item.Deadline != nil && item.Deadline.Before(now) {
			item.StatusName = "overdue"
		}

		assignments = append(assignments, item)
	}
	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeData(w, http.StatusOK, assignments)
}

// FellowSubmit marks one assignment submitted for the current fellow.
// POST /api/fellow/assignments/{assignmentId}/submit
func (h *AssignmentHandler) FellowSubmit(w http.ResponseWriter, r *http.Request) {
	assignmentID, ok := pathID(r, "assignmentId")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid assignment id")
		return
	}

	memberID, err := currentFellowID(r.Context(), h.DB)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "current fellow not found")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	var exists bool
	if err := h.DB.QueryRowContext(r.Context(), `SELECT EXISTS (SELECT 1 FROM assignment WHERE id = $1)`, assignmentID).Scan(&exists); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if !exists {
		writeError(w, http.StatusNotFound, "assignment not found")
		return
	}

	var submittedAt time.Time
	err = h.DB.QueryRowContext(r.Context(), `
		INSERT INTO assignment_submission (assignment_id, member_id, submit_status, submitted_at)
		VALUES ($1, $2, 1, NOW())
		ON CONFLICT (assignment_id, member_id) DO UPDATE SET
			submit_status = 1,
			submitted_at = COALESCE(assignment_submission.submitted_at, EXCLUDED.submitted_at)
		RETURNING submitted_at
	`, assignmentID, memberID).Scan(&submittedAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeData(w, http.StatusOK, map[string]any{
		"assignment_id": assignmentID,
		"member_id":     memberID,
		"submit_status": 1,
		"status_name":   "submitted",
		"submitted_at":  submittedAt,
	})
}

// AdminList returns all assignments with cohort-wide submission counts.
// GET /api/admin/assignments
func (h *AssignmentHandler) AdminList(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.QueryContext(r.Context(), `
		SELECT
			a.id, a.cohort_id, a.sprint_id, a.title, a.form_url, a.deadline, a.description,
			COUNT(asub.member_id) FILTER (WHERE asub.submit_status = 1) AS submitted_count,
			(SELECT COUNT(*) FROM fellow) AS total_fellows,
			a.created_at, a.update_at
		FROM assignment a
		LEFT JOIN assignment_submission asub ON asub.assignment_id = a.id
		GROUP BY a.id
		ORDER BY a.created_at DESC
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	type AssignmentAdmin struct {
		ID             int64      `json:"id"`
		CohortID       *int64     `json:"cohort_id"`
		SprintID       *int64     `json:"sprint_id"`
		Title          *string    `json:"title"`
		FormURL        *string    `json:"form_url"`
		Deadline       *time.Time `json:"deadline"`
		Description    *string    `json:"description"`
		SubmittedCount int        `json:"submitted_count"`
		TotalFellows   int        `json:"total_fellows"`
		CreatedAt      time.Time  `json:"created_at"`
		UpdateAt       time.Time  `json:"update_at"`
	}

	assignments := []AssignmentAdmin{}
	for rows.Next() {
		var a AssignmentAdmin
		if err := rows.Scan(
			&a.ID, &a.CohortID, &a.SprintID, &a.Title, &a.FormURL, &a.Deadline, &a.Description,
			&a.SubmittedCount, &a.TotalFellows,
			&a.CreatedAt, &a.UpdateAt,
		); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		assignments = append(assignments, a)
	}

	writeData(w, http.StatusOK, assignments)
}

// AdminCreate creates a new assignment.
// POST /api/admin/assignments
func (h *AssignmentHandler) AdminCreate(w http.ResponseWriter, r *http.Request) {
	var body struct {
		CohortID        *int64     `json:"cohort_id"`
		SprintID        *int64     `json:"sprint_id"`
		LearningBlockID *int64     `json:"learning_block_id"`
		Title           *string    `json:"title"`
		FormURL         *string    `json:"form_url"`
		Deadline        *time.Time `json:"deadline"`
		Description     *string    `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var id int64
	err := h.DB.QueryRowContext(r.Context(), `
		INSERT INTO assignment (cohort_id, sprint_id, learning_block_id, title, form_url, deadline, description)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, body.CohortID, body.SprintID, body.LearningBlockID, body.Title, body.FormURL, body.Deadline, body.Description).Scan(&id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeData(w, http.StatusCreated, map[string]any{
		"id":       id,
		"title":    body.Title,
		"form_url": body.FormURL,
	})
}

// AdminUpdate updates assignment metadata.
// PATCH /api/admin/assignments/{assignmentId}
func (h *AssignmentHandler) AdminUpdate(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "assignmentId")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid assignment id")
		return
	}

	var body struct {
		SprintID    *int64     `json:"sprint_id"`
		Title       *string    `json:"title"`
		FormURL     *string    `json:"form_url"`
		Deadline    *time.Time `json:"deadline"`
		Description *string    `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	res, err := h.DB.ExecContext(r.Context(), `
		UPDATE assignment SET
			sprint_id   = COALESCE($1, sprint_id),
			title       = COALESCE($2, title),
			form_url    = COALESCE($3, form_url),
			deadline    = COALESCE($4, deadline),
			description = COALESCE($5, description),
			update_at   = NOW()
		WHERE id = $6
	`, body.SprintID, body.Title, body.FormURL, body.Deadline, body.Description, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		writeError(w, http.StatusNotFound, "assignment not found")
		return
	}

	writeData(w, http.StatusOK, map[string]any{"id": id})
}

// AdminSync upserts Google Form responses into assignment_submission.
// POST /api/admin/assignments/{assignmentId}/sync
func (h *AssignmentHandler) AdminSync(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "assignmentId")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid assignment id")
		return
	}

	var body struct {
		SubmittedMemberIDs []int64 `json:"submitted_member_ids"`
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
	for _, memberID := range body.SubmittedMemberIDs {
		res, err := tx.ExecContext(r.Context(), `
			INSERT INTO assignment_submission (assignment_id, member_id, submit_status, submitted_at)
			VALUES ($1, $2, 1, NOW())
			ON CONFLICT (assignment_id, member_id) DO UPDATE SET
				submit_status = 1,
				submitted_at  = COALESCE(assignment_submission.submitted_at, NOW())
		`, id, memberID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if n, _ := res.RowsAffected(); n > 0 {
			updatedCount++
		}
	}

	// Record sync audit row.
	_, err = tx.ExecContext(r.Context(), `
		INSERT INTO api (assignment_id) VALUES ($1)
	`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeData(w, http.StatusOK, map[string]any{
		"assignment_id": id,
		"updated_count": updatedCount,
		"synced_at":     time.Now().UTC().Format(time.RFC3339),
	})
}

// AdminSubmissions returns per-fellow submission state for one assignment.
// GET /api/admin/assignments/{assignmentId}/submissions
func (h *AssignmentHandler) AdminSubmissions(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "assignmentId")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid assignment id")
		return
	}

	// Get assignment info.
	type AssignmentMeta struct {
		Title    *string
		Deadline *time.Time
	}
	var meta AssignmentMeta
	err := h.DB.QueryRowContext(r.Context(), `
		SELECT title, deadline FROM assignment WHERE id = $1
	`, id).Scan(&meta.Title, &meta.Deadline)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "assignment not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Get per-fellow submission status.
	rows, err := h.DB.QueryContext(r.Context(), `
		SELECT
			u.id AS member_id,
			COALESCE(u.name, '') AS name,
			COALESCE(asub.submit_status, 0) AS submit_status,
			asub.submitted_at
		FROM fellow f
		JOIN "user" u ON u.id = f.user_id
		LEFT JOIN assignment_submission asub
			ON asub.assignment_id = $1 AND asub.member_id = u.id
		ORDER BY u.id
	`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	type FellowSub struct {
		MemberID     int64      `json:"member_id"`
		Name         string     `json:"name"`
		SubmitStatus int        `json:"submit_status"`
		StatusName   string     `json:"status_name"`
		SubmittedAt  *time.Time `json:"submitted_at"`
	}

	fellows := []FellowSub{}
	submitted := 0
	for rows.Next() {
		var fs FellowSub
		if err := rows.Scan(&fs.MemberID, &fs.Name, &fs.SubmitStatus, &fs.SubmittedAt); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		fs.StatusName = "pending"
		if fs.SubmitStatus == 1 {
			fs.StatusName = "submitted"
			submitted++
		} else if meta.Deadline != nil && meta.Deadline.Before(time.Now()) {
			fs.StatusName = "overdue"
		}
		fellows = append(fellows, fs)
	}

	writeData(w, http.StatusOK, map[string]any{
		"assignment_id":   id,
		"title":           meta.Title,
		"deadline":        meta.Deadline,
		"submitted_count": submitted,
		"total_fellows":   len(fellows),
		"fellows":         fellows,
	})
}
