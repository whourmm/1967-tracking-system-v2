package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/tracking-system-v2/backend/internal/middleware"
	"github.com/tracking-system-v2/backend/internal/models"
)

type AdminHandler struct {
	DB *sql.DB
}

type adminOverview struct {
	Fellows                int      `json:"fellows"`
	Countries              int      `json:"countries"`
	Teams                  int      `json:"teams"`
	Sprints                int      `json:"sprints"`
	Cases                  int      `json:"cases"`
	Resources              int      `json:"resources"`
	UpcomingEvents         int      `json:"upcoming_events"`
	AssignmentProgress     progress `json:"assignment_progress"`
	CaseSubmissionProgress progress `json:"case_submission_progress"`
	ResourceReadProgress   progress `json:"resource_read_progress"`
}

type progress struct {
	Done    int `json:"done"`
	Total   int `json:"total"`
	Pending int `json:"pending"`
	Percent int `json:"percent"`
}

type casePayload struct {
	CohortID        *int64  `json:"cohort_id"`
	SprintID        *int64  `json:"sprint_id"`
	Title           *string `json:"title"`
	CaseOwner       *string `json:"case_owner"`
	Status          *string `json:"status"`
	Summary         *string `json:"summary"`
	FileName        *string `json:"file_name"`
	PublishedDate   *string `json:"published_date"`
	GoogleDriveLink *string `json:"googledrive_link"`
	Theme           *string `json:"theme"`
	CreateBy        *int64  `json:"create_by"`
}

type sprintPayload struct {
	CohortID           *int64  `json:"cohort_id"`
	Name               *string `json:"name"`
	Description        *string `json:"description"`
	StartsOn           *string `json:"starts_on"`
	SubmissionDeadline *string `json:"submission_deadline"`
	IsCurrent          *bool   `json:"is_current"`
	CreatedBy          *int64  `json:"created_by"`
}

type resourcePayload struct {
	Type            *string `json:"type"`
	Name            *string `json:"name"`
	Description     *string `json:"description"`
	URL             *string `json:"url"`
	Duration        *string `json:"duration"`
	Author          *string `json:"author"`
	Tag             *string `json:"tag"`
	LearningBlockID *int64  `json:"learning_block_id"`
	SortOrder       *int    `json:"sort_order"`
	CreatedBy       *int64  `json:"created_by"`
}

type resourceReadStatus struct {
	ResourceID int64 `json:"resource_id"`
	Read       int   `json:"read"`
	Unread     int   `json:"unread"`
	Total      int   `json:"total"`
	Percent    int   `json:"percent"`
}

type scanner interface {
	Scan(dest ...any) error
}

func (h *AdminHandler) Overview(w http.ResponseWriter, r *http.Request) {
	var overview adminOverview
	if err := h.DB.QueryRow(`SELECT COUNT(*) FROM fellow`).Scan(&overview.Fellows); err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if err := h.DB.QueryRow(`
		SELECT COUNT(DISTINCT NULLIF(u.country, ''))
		FROM fellow f
		JOIN "user" u ON u.id = f.user_id
	`).Scan(&overview.Countries); err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}

	counts := []struct {
		query string
		dest  *int
	}{
		{`SELECT COUNT(*) FROM team`, &overview.Teams},
		{`SELECT COUNT(*) FROM sprint`, &overview.Sprints},
		{`SELECT COUNT(*) FROM "case"`, &overview.Cases},
		{`SELECT COUNT(*) FROM resource`, &overview.Resources},
		{`SELECT COUNT(*) FROM events WHERE event_date >= CURRENT_DATE`, &overview.UpcomingEvents},
	}
	for _, item := range counts {
		if err := h.DB.QueryRow(item.query).Scan(item.dest); err != nil {
			writeAPIError(w, http.StatusInternalServerError, err.Error())
			return
		}
	}

	var assignmentDone, assignmentTotal int
	if err := h.DB.QueryRow(`
		SELECT
			(SELECT COUNT(*) FROM assignment_submission WHERE submit_status = 1),
			(SELECT COUNT(*) FROM assignment) * (SELECT COUNT(*) FROM fellow)
	`).Scan(&assignmentDone, &assignmentTotal); err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	overview.AssignmentProgress = newProgress(assignmentDone, assignmentTotal)

	var caseDone, caseTotal int
	if err := h.DB.QueryRow(`
		SELECT
			COALESCE(SUM(CASE WHEN status IN ('submitted', 'reviewed') THEN 1 ELSE 0 END), 0),
			COUNT(*)
		FROM case_submission
	`).Scan(&caseDone, &caseTotal); err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	overview.CaseSubmissionProgress = newProgress(caseDone, caseTotal)

	var resourceReads int
	if err := h.DB.QueryRow(`SELECT COUNT(*) FROM resource_read`).Scan(&resourceReads); err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	overview.ResourceReadProgress = newProgress(resourceReads, overview.Resources*overview.Fellows)

	writeData(w, http.StatusOK, overview)
}

func (h *AdminHandler) ListCases(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.CurrentUser(r.Context())
	if !ok {
		writeAPIError(w, http.StatusUnauthorized, "authenticated user missing from request")
		return
	}
	var cohortID *int64
	if user.Role == "fellow" {
		cohortID = memberCohortID(r.Context(), h.DB, user.ID)
	}
	rows, err := h.DB.QueryContext(r.Context(), `
		SELECT id, cohort_id, sprint_id, title, case_owner, status, summary, file_name,
			published_date, googledrive_link, created_at, update_at, theme, create_by
		FROM "case"
		WHERE $1::boolean OR cohort_id = $2
		ORDER BY published_date DESC NULLS LAST, id DESC
	`, user.Role == "admin", cohortID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	cases := []models.Case{}
	for rows.Next() {
		item, err := scanCase(rows)
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, err.Error())
			return
		}
		cases = append(cases, item)
	}
	if err := rows.Err(); err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeData(w, http.StatusOK, cases)
}

func (h *AdminHandler) GetCase(w http.ResponseWriter, r *http.Request) {
	id, ok := adminPathID(w, r, "caseId")
	if !ok {
		return
	}

	item, err := scanCase(h.DB.QueryRow(`
		SELECT id, cohort_id, sprint_id, title, case_owner, status, summary, file_name,
			published_date, googledrive_link, created_at, update_at, theme, create_by
		FROM "case"
		WHERE id = $1
	`, id))
	if errors.Is(err, sql.ErrNoRows) {
		writeAPIError(w, http.StatusNotFound, "case not found")
		return
	}
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeData(w, http.StatusOK, item)
}

func (h *AdminHandler) CreateCase(w http.ResponseWriter, r *http.Request) {
	var payload casePayload
	err := decodeJSON(r, &payload)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := requireString(payload.Title, "title"); err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}
	publishedDate, err := parseDate(payload.PublishedDate)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}
	cohortID, err := resolveCohortID(r.Context(), h.DB, payload.CohortID, payload.SprintID)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	item, err := scanCase(h.DB.QueryRowContext(r.Context(), `
		INSERT INTO "case" (
			cohort_id, sprint_id, title, case_owner, status, summary, file_name,
			published_date, googledrive_link, theme, create_by
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, cohort_id, sprint_id, title, case_owner, status, summary, file_name,
			published_date, googledrive_link, created_at, update_at, theme, create_by
	`, cohortID, payload.SprintID, payload.Title, payload.CaseOwner, payload.Status,
		payload.Summary, payload.FileName, publishedDate, payload.GoogleDriveLink, payload.Theme, payload.CreateBy))
	if err != nil {
		writeDBError(w, err)
		return
	}
	writeData(w, http.StatusCreated, item)
}

func (h *AdminHandler) UpdateCase(w http.ResponseWriter, r *http.Request) {
	id, ok := adminPathID(w, r, "caseId")
	if !ok {
		return
	}
	var payload casePayload
	err := decodeJSON(r, &payload)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := rejectBlank(payload.Title, "title"); err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}
	publishedDate, err := parseDate(payload.PublishedDate)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	item, err := scanCase(h.DB.QueryRow(`
		UPDATE "case"
		SET cohort_id = COALESCE($1, cohort_id),
			sprint_id = COALESCE($2, sprint_id),
			title = COALESCE($3, title),
			case_owner = COALESCE($4, case_owner),
			status = COALESCE($5, status),
			summary = COALESCE($6, summary),
			file_name = COALESCE($7, file_name),
			published_date = COALESCE($8, published_date),
			googledrive_link = COALESCE($9, googledrive_link),
			theme = COALESCE($10, theme),
			create_by = COALESCE($11, create_by),
			update_at = CURRENT_TIMESTAMP
		WHERE id = $12
		RETURNING id, cohort_id, sprint_id, title, case_owner, status, summary, file_name,
			published_date, googledrive_link, created_at, update_at, theme, create_by
	`, payload.CohortID, payload.SprintID, payload.Title, payload.CaseOwner, payload.Status,
		payload.Summary, payload.FileName, publishedDate, payload.GoogleDriveLink, payload.Theme, payload.CreateBy, id))
	if errors.Is(err, sql.ErrNoRows) {
		writeAPIError(w, http.StatusNotFound, "case not found")
		return
	}
	if err != nil {
		writeDBError(w, err)
		return
	}
	writeData(w, http.StatusOK, item)
}

func (h *AdminHandler) DeleteCase(w http.ResponseWriter, r *http.Request) {
	h.deleteByID(w, r, "caseId", `DELETE FROM "case" WHERE id = $1`)
}

// ListCaseSubmissionStatuses returns the aggregate submission state per case.
func (h *AdminHandler) ListCaseSubmissionStatuses(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.QueryContext(r.Context(), `
		SELECT c.id,
			CASE
				WHEN COUNT(cs.team_id) = 0 THEN 'pending'
				WHEN BOOL_AND(cs.status = 'reviewed') THEN 'reviewed'
				WHEN BOOL_OR(cs.status IN ('submitted', 'reviewed')) THEN 'submitted'
				ELSE 'pending'
			END
		FROM "case" c
		LEFT JOIN case_submission cs ON cs.case_id = c.id
		GROUP BY c.id
		ORDER BY c.id
	`)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	type caseStatus struct {
		CaseID int64  `json:"case_id"`
		Status string `json:"status"`
	}
	items := []caseStatus{}
	for rows.Next() {
		var item caseStatus
		if err := rows.Scan(&item.CaseID, &item.Status); err != nil {
			writeAPIError(w, http.StatusInternalServerError, err.Error())
			return
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeData(w, http.StatusOK, items)
}

func (h *AdminHandler) SyncCaseSubmission(w http.ResponseWriter, r *http.Request) {
	caseID, ok := adminPathID(w, r, "caseId")
	if !ok {
		return
	}

	var payload struct {
		TeamID        *int64  `json:"team_id"`
		SubmissionURL *string `json:"submission_url"`
	}
	if err := decodeJSON(r, &payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}
	if payload.TeamID == nil || *payload.TeamID <= 0 {
		writeAPIError(w, http.StatusBadRequest, "team_id is required")
		return
	}

	var submittedAt time.Time
	err := h.DB.QueryRowContext(r.Context(), `
		INSERT INTO case_submission (case_id, team_id, status, submission_url, submitted_at)
		VALUES ($1, $2, 'submitted', $3, NOW())
		ON CONFLICT (case_id, team_id) DO UPDATE SET
			status = CASE
				WHEN case_submission.status = 'reviewed' THEN case_submission.status
				ELSE 'submitted'
			END,
			submission_url = COALESCE(EXCLUDED.submission_url, case_submission.submission_url),
			submitted_at = COALESCE(case_submission.submitted_at, EXCLUDED.submitted_at),
			updated_at = NOW()
		RETURNING submitted_at
	`, caseID, *payload.TeamID, payload.SubmissionURL).Scan(&submittedAt)
	if err != nil {
		writeDBError(w, err)
		return
	}

	writeData(w, http.StatusOK, map[string]any{
		"case_id":      caseID,
		"team_id":      *payload.TeamID,
		"status":       "submitted",
		"submitted_at": submittedAt,
	})
}

func (h *AdminHandler) ListSprints(w http.ResponseWriter, r *http.Request) {
	h.listSprints(w, "")
}

func (h *AdminHandler) ListActiveCohortSprints(w http.ResponseWriter, r *http.Request) {
	h.listSprints(w, `WHERE s.cohort_id IN (SELECT id FROM cohort WHERE is_active = true)`)
}

func (h *AdminHandler) GetSprint(w http.ResponseWriter, r *http.Request) {
	id, ok := adminPathID(w, r, "sprintId")
	if !ok {
		return
	}

	item, err := scanSprint(h.DB.QueryRow(`
		SELECT id, cohort_id, name, description, starts_on, submission_deadline,
			is_current, created_at, update_at, created_by
		FROM sprint
		WHERE id = $1
	`, id))
	if errors.Is(err, sql.ErrNoRows) {
		writeAPIError(w, http.StatusNotFound, "sprint not found")
		return
	}
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeData(w, http.StatusOK, item)
}

func (h *AdminHandler) CreateSprint(w http.ResponseWriter, r *http.Request) {
	var payload sprintPayload
	err := decodeJSON(r, &payload)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := requireString(payload.Name, "name"); err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}
	startsOn, deadline, err := sprintTimes(payload)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}
	cohortID, err := resolveCohortID(r.Context(), h.DB, payload.CohortID, nil)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	item, err := scanSprint(h.DB.QueryRowContext(r.Context(), `
		INSERT INTO sprint (cohort_id, name, description, starts_on, submission_deadline, is_current, created_by)
		VALUES ($1, $2, $3, $4, $5, COALESCE($6, false), $7)
		RETURNING id, cohort_id, name, description, starts_on, submission_deadline,
			is_current, created_at, update_at, created_by
	`, cohortID, payload.Name, payload.Description, startsOn, deadline, payload.IsCurrent, payload.CreatedBy))
	if err != nil {
		writeDBError(w, err)
		return
	}
	writeData(w, http.StatusCreated, item)
}

func (h *AdminHandler) UpdateSprint(w http.ResponseWriter, r *http.Request) {
	id, ok := adminPathID(w, r, "sprintId")
	if !ok {
		return
	}
	var payload sprintPayload
	err := decodeJSON(r, &payload)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := rejectBlank(payload.Name, "name"); err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}
	startsOn, deadline, err := sprintTimes(payload)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	item, err := scanSprint(h.DB.QueryRow(`
		UPDATE sprint
		SET cohort_id = COALESCE($1, cohort_id),
			name = COALESCE($2, name),
			description = COALESCE($3, description),
			starts_on = COALESCE($4, starts_on),
			submission_deadline = COALESCE($5, submission_deadline),
			is_current = COALESCE($6, is_current),
			created_by = COALESCE($7, created_by),
			update_at = CURRENT_TIMESTAMP
		WHERE id = $8
		RETURNING id, cohort_id, name, description, starts_on, submission_deadline,
			is_current, created_at, update_at, created_by
	`, payload.CohortID, payload.Name, payload.Description, startsOn, deadline, payload.IsCurrent, payload.CreatedBy, id))
	if errors.Is(err, sql.ErrNoRows) {
		writeAPIError(w, http.StatusNotFound, "sprint not found")
		return
	}
	if err != nil {
		writeDBError(w, err)
		return
	}
	writeData(w, http.StatusOK, item)
}

func (h *AdminHandler) DeleteSprint(w http.ResponseWriter, r *http.Request) {
	h.deleteByID(w, r, "sprintId", `DELETE FROM sprint WHERE id = $1`)
}

func (h *AdminHandler) ListResources(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`
		SELECT id, type, name, description, url, duration, author, tag,
			learning_block_id, sort_order, created_at, updated_at, created_by
		FROM resource
		ORDER BY sort_order, id DESC
	`)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	resources := []models.Resource{}
	for rows.Next() {
		item, err := scanResource(rows)
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, err.Error())
			return
		}
		resources = append(resources, item)
	}
	if err := rows.Err(); err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeData(w, http.StatusOK, resources)
}

func (h *AdminHandler) GetResource(w http.ResponseWriter, r *http.Request) {
	id, ok := adminPathID(w, r, "resourceId")
	if !ok {
		return
	}

	item, err := scanResource(h.DB.QueryRow(`
		SELECT id, type, name, description, url, duration, author, tag,
			learning_block_id, sort_order, created_at, updated_at, created_by
		FROM resource
		WHERE id = $1
	`, id))
	if errors.Is(err, sql.ErrNoRows) {
		writeAPIError(w, http.StatusNotFound, "resource not found")
		return
	}
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeData(w, http.StatusOK, item)
}

func (h *AdminHandler) CreateResource(w http.ResponseWriter, r *http.Request) {
	var payload resourcePayload
	err := decodeJSON(r, &payload)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := requireString(payload.Name, "name"); err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}
	item, err := scanResource(h.DB.QueryRow(`
		INSERT INTO resource (
			type, name, description, url, duration, author, tag,
			learning_block_id, sort_order, created_by
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 0), $10)
		RETURNING id, type, name, description, url, duration, author, tag,
			learning_block_id, sort_order, created_at, updated_at, created_by
	`, payload.Type, payload.Name, payload.Description, payload.URL, payload.Duration, payload.Author,
		payload.Tag, payload.LearningBlockID, payload.SortOrder, payload.CreatedBy))
	if err != nil {
		writeDBError(w, err)
		return
	}
	writeData(w, http.StatusCreated, item)
}

func (h *AdminHandler) UpdateResource(w http.ResponseWriter, r *http.Request) {
	id, ok := adminPathID(w, r, "resourceId")
	if !ok {
		return
	}
	var payload resourcePayload
	err := decodeJSON(r, &payload)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := rejectBlank(payload.Name, "name"); err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}
	item, err := scanResource(h.DB.QueryRow(`
		UPDATE resource
		SET type = COALESCE($1, type),
			name = COALESCE($2, name),
			description = COALESCE($3, description),
			url = COALESCE($4, url),
			duration = COALESCE($5, duration),
			author = COALESCE($6, author),
			tag = COALESCE($7, tag),
			learning_block_id = COALESCE($8, learning_block_id),
			sort_order = COALESCE($9, sort_order),
			created_by = COALESCE($10, created_by),
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $11
		RETURNING id, type, name, description, url, duration, author, tag,
			learning_block_id, sort_order, created_at, updated_at, created_by
	`, payload.Type, payload.Name, payload.Description, payload.URL, payload.Duration, payload.Author,
		payload.Tag, payload.LearningBlockID, payload.SortOrder, payload.CreatedBy, id))
	if errors.Is(err, sql.ErrNoRows) {
		writeAPIError(w, http.StatusNotFound, "resource not found")
		return
	}
	if err != nil {
		writeDBError(w, err)
		return
	}
	writeData(w, http.StatusOK, item)
}

func (h *AdminHandler) DeleteResource(w http.ResponseWriter, r *http.Request) {
	h.deleteByID(w, r, "resourceId", `DELETE FROM resource WHERE id = $1`)
}

func (h *AdminHandler) ResourceReadStatus(w http.ResponseWriter, r *http.Request) {
	var fellows int
	if err := h.DB.QueryRow(`SELECT COUNT(*) FROM fellow`).Scan(&fellows); err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	rows, err := h.DB.Query(`
		SELECT r.id, COUNT(rr.member_id)
		FROM resource r
		LEFT JOIN resource_read rr ON rr.resource_id = r.id
		GROUP BY r.id
		ORDER BY r.id
	`)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	statuses := []resourceReadStatus{}
	for rows.Next() {
		var status resourceReadStatus
		status.Total = fellows
		if err := rows.Scan(&status.ResourceID, &status.Read); err != nil {
			writeAPIError(w, http.StatusInternalServerError, err.Error())
			return
		}
		status.Unread = max(fellows-status.Read, 0)
		status.Percent = percent(status.Read, fellows)
		statuses = append(statuses, status)
	}
	if err := rows.Err(); err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeData(w, http.StatusOK, statuses)
}

func (h *AdminHandler) listSprints(w http.ResponseWriter, where string) {
	rows, err := h.DB.Query(`
		SELECT s.id, s.cohort_id, s.name, s.description, s.starts_on, s.submission_deadline,
			s.is_current, s.created_at, s.update_at, s.created_by
		FROM sprint s
		` + where + `
		ORDER BY s.starts_on NULLS LAST, s.id
	`)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	sprints := []models.Sprint{}
	for rows.Next() {
		item, err := scanSprint(rows)
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, err.Error())
			return
		}
		sprints = append(sprints, item)
	}
	if err := rows.Err(); err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeData(w, http.StatusOK, sprints)
}

func (h *AdminHandler) deleteByID(w http.ResponseWriter, r *http.Request, name, query string) {
	id, ok := adminPathID(w, r, name)
	if !ok {
		return
	}
	result, err := h.DB.Exec(query, id)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	affected, err := result.RowsAffected()
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if affected == 0 {
		writeAPIError(w, http.StatusNotFound, "not found")
		return
	}
	writeData(w, http.StatusOK, map[string]bool{"deleted": true})
}

func scanCase(s scanner) (models.Case, error) {
	var item models.Case
	var cohortID, sprintID, createBy sql.NullInt64
	var title, caseOwner, status, summary, fileName, googleDriveLink, theme sql.NullString
	var publishedDate sql.NullTime

	err := s.Scan(&item.ID, &cohortID, &sprintID, &title, &caseOwner, &status, &summary,
		&fileName, &publishedDate, &googleDriveLink, &item.CreatedAt, &item.UpdateAt, &theme, &createBy)
	item.CohortID = int64Ptr(cohortID)
	item.SprintID = int64Ptr(sprintID)
	item.Title = stringPtr(title)
	item.CaseOwner = stringPtr(caseOwner)
	item.Status = stringPtr(status)
	item.Summary = stringPtr(summary)
	item.FileName = stringPtr(fileName)
	item.PublishedDate = timePtr(publishedDate)
	item.GoogleDriveLink = stringPtr(googleDriveLink)
	item.Theme = stringPtr(theme)
	item.CreateBy = int64Ptr(createBy)
	return item, err
}

func scanSprint(s scanner) (models.Sprint, error) {
	var item models.Sprint
	var cohortID, createdBy sql.NullInt64
	var name, description sql.NullString
	var startsOn, deadline sql.NullTime

	err := s.Scan(&item.ID, &cohortID, &name, &description, &startsOn, &deadline,
		&item.IsCurrent, &item.CreatedAt, &item.UpdateAt, &createdBy)
	item.CohortID = int64Ptr(cohortID)
	item.Name = stringPtr(name)
	item.Description = stringPtr(description)
	item.StartsOn = timePtr(startsOn)
	item.SubmissionDeadline = timePtr(deadline)
	item.CreatedBy = int64Ptr(createdBy)
	return item, err
}

func scanResource(s scanner) (models.Resource, error) {
	var item models.Resource
	var learningBlockID, createdBy sql.NullInt64
	var resourceType, name, description, url, duration, author, tag sql.NullString

	err := s.Scan(&item.ID, &resourceType, &name, &description, &url, &duration,
		&author, &tag, &learningBlockID, &item.SortOrder, &item.CreatedAt, &item.UpdatedAt, &createdBy)
	item.Type = stringPtr(resourceType)
	item.Name = stringPtr(name)
	item.Description = stringPtr(description)
	item.URL = stringPtr(url)
	item.Duration = stringPtr(duration)
	item.Author = stringPtr(author)
	item.Tag = stringPtr(tag)
	item.LearningBlockID = int64Ptr(learningBlockID)
	item.CreatedBy = int64Ptr(createdBy)
	return item, err
}

func decodeJSON(r *http.Request, v any) error {
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		if errors.Is(err, io.EOF) {
			return errors.New("request body is required")
		}
		return err
	}
	return nil
}

func adminPathID(w http.ResponseWriter, r *http.Request, name string) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue(name), 10, 64)
	if err != nil || id <= 0 {
		writeAPIError(w, http.StatusBadRequest, "invalid id")
		return 0, false
	}
	return id, true
}

func sprintTimes(payload sprintPayload) (*time.Time, *time.Time, error) {
	startsOn, err := parseDateTime(payload.StartsOn)
	if err != nil {
		return nil, nil, err
	}
	deadline, err := parseDateTime(payload.SubmissionDeadline)
	if err != nil {
		return nil, nil, err
	}
	return startsOn, deadline, nil
}

func parseDate(value *string) (*time.Time, error) {
	if value == nil || *value == "" {
		return nil, nil
	}
	if t, err := time.Parse("2006-01-02", *value); err == nil {
		return &t, nil
	}
	return parseDateTime(value)
}

func parseDateTime(value *string) (*time.Time, error) {
	if value == nil || *value == "" {
		return nil, nil
	}
	for _, layout := range []string{time.RFC3339, "2006-01-02"} {
		t, err := time.Parse(layout, *value)
		if err == nil {
			return &t, nil
		}
	}
	return nil, errors.New("invalid date")
}

func writeAPIError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]any{
		"data":  nil,
		"error": message,
	})
}

func writeDBError(w http.ResponseWriter, err error) {
	if isBadRequestDBError(err) {
		writeAPIError(w, http.StatusBadRequest, "invalid request data")
		return
	}
	writeAPIError(w, http.StatusInternalServerError, err.Error())
}

func isBadRequestDBError(err error) bool {
	msg := err.Error()
	return strings.Contains(msg, "violates foreign key constraint") ||
		strings.Contains(msg, "violates check constraint") ||
		strings.Contains(msg, "invalid input syntax")
}

func requireString(value *string, field string) error {
	if value == nil || strings.TrimSpace(*value) == "" {
		return errors.New(field + " is required")
	}
	return nil
}

func rejectBlank(value *string, field string) error {
	if value != nil && strings.TrimSpace(*value) == "" {
		return errors.New(field + " cannot be blank")
	}
	return nil
}

func newProgress(done, total int) progress {
	return progress{
		Done:    done,
		Total:   total,
		Pending: max(total-done, 0),
		Percent: percent(done, total),
	}
}

func percent(done, total int) int {
	if total <= 0 {
		return 0
	}
	return (done * 100) / total
}

func int64Ptr(value sql.NullInt64) *int64 {
	if !value.Valid {
		return nil
	}
	return &value.Int64
}

func stringPtr(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}

func timePtr(value sql.NullTime) *time.Time {
	if !value.Valid {
		return nil
	}
	return &value.Time
}
