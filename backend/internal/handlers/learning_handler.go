package handlers

import (
	"database/sql"
	"net/http"
	"time"
)

type LearningHandler struct {
	DB *sql.DB
}

type fellowLearningAssignment struct {
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

type fellowLearningResource struct {
	ID              int64      `json:"id"`
	Type            *string    `json:"type"`
	Name            *string    `json:"name"`
	Description     *string    `json:"description"`
	URL             *string    `json:"url"`
	Duration        *string    `json:"duration"`
	Author          *string    `json:"author"`
	Tag             *string    `json:"tag"`
	LearningBlockID *int64     `json:"learning_block_id"`
	SortOrder       int        `json:"sort_order"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	CreatedBy       *int64     `json:"created_by"`
	ReadAt          *time.Time `json:"read_at"`
}

type fellowLearningSection struct {
	ID          *int64                     `json:"id"`
	Code        *string                    `json:"code"`
	Kind        string                     `json:"kind"`
	Title       string                     `json:"title"`
	Description *string                    `json:"description"`
	SortOrder   int                        `json:"sort_order"`
	Resources   []fellowLearningResource   `json:"resources"`
	Assignments []fellowLearningAssignment `json:"assignments"`
}

// ListResources returns resources with the current fellow's read state.
// GET /api/resources
func (h *LearningHandler) ListResources(w http.ResponseWriter, r *http.Request) {
	memberID, err := currentFellowID(r.Context())
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "current fellow not found")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	resources, err := h.resourcesForFellow(r, memberID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeData(w, http.StatusOK, resources)
}

// GetLearning returns sections, resources, and form assignments for the current fellow.
// GET /api/fellow/learning
func (h *LearningHandler) GetLearning(w http.ResponseWriter, r *http.Request) {
	memberID, err := currentFellowID(r.Context())
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "current fellow not found")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	sections, err := h.learningSections(r, memberID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	blocks := []fellowLearningSection{}
	special := []fellowLearningSection{}
	for _, section := range sections {
		if section.Kind == "block" {
			blocks = append(blocks, section)
		} else {
			special = append(special, section)
		}
	}

	writeData(w, http.StatusOK, map[string]any{
		"blocks":           blocks,
		"special_sections": special,
	})
}

// MarkResourceRead marks one resource read for the current fellow.
// POST /api/fellow/resources/{resourceId}/read
func (h *LearningHandler) MarkResourceRead(w http.ResponseWriter, r *http.Request) {
	resourceID, ok := pathID(r, "resourceId")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid resource id")
		return
	}

	memberID, err := currentFellowID(r.Context())
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "current fellow not found")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	var exists bool
	if err := h.DB.QueryRowContext(r.Context(), `SELECT EXISTS (SELECT 1 FROM resource WHERE id = $1)`, resourceID).Scan(&exists); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if !exists {
		writeError(w, http.StatusNotFound, "resource not found")
		return
	}

	var readAt time.Time
	err = h.DB.QueryRowContext(r.Context(), `
		INSERT INTO resource_read (resource_id, member_id, read_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (resource_id, member_id) DO UPDATE SET
			read_at = resource_read.read_at
		RETURNING read_at
	`, resourceID, memberID).Scan(&readAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeData(w, http.StatusOK, map[string]any{
		"resource_id": resourceID,
		"member_id":   memberID,
		"read_at":     readAt,
	})
}

func (h *LearningHandler) learningSections(r *http.Request, memberID int64) ([]fellowLearningSection, error) {
	rows, err := h.DB.QueryContext(r.Context(), `
		SELECT id, code, kind, title, description, sort_order
		FROM learning_block
		ORDER BY sort_order, id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	sections := []fellowLearningSection{}
	byID := map[int64]int{}
	for rows.Next() {
		var id int64
		var code, kind, title, description sql.NullString
		var sortOrder int
		if err := rows.Scan(&id, &code, &kind, &title, &description, &sortOrder); err != nil {
			return nil, err
		}
		sectionKind := "block"
		if kind.Valid && kind.String != "" {
			sectionKind = kind.String
		}
		sectionTitle := "Untitled section"
		if title.Valid && title.String != "" {
			sectionTitle = title.String
		}
		idCopy := id
		sections = append(sections, fellowLearningSection{
			ID:          &idCopy,
			Code:        stringPtr(code),
			Kind:        sectionKind,
			Title:       sectionTitle,
			Description: stringPtr(description),
			SortOrder:   sortOrder,
			Resources:   []fellowLearningResource{},
			Assignments: []fellowLearningAssignment{},
		})
		byID[id] = len(sections) - 1
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	resources, err := h.resourcesForFellow(r, memberID)
	if err != nil {
		return nil, err
	}
	unassignedResources := []fellowLearningResource{}
	for _, resource := range resources {
		if resource.LearningBlockID != nil {
			if index, ok := byID[*resource.LearningBlockID]; ok {
				sections[index].Resources = append(sections[index].Resources, resource)
				continue
			}
		}
		unassignedResources = append(unassignedResources, resource)
	}

	assignments, err := h.assignmentsForFellow(r, memberID)
	if err != nil {
		return nil, err
	}
	unassignedAssignments := []fellowLearningAssignment{}
	for _, assignment := range assignments {
		if assignment.LearningBlockID != nil {
			if index, ok := byID[*assignment.LearningBlockID]; ok {
				sections[index].Assignments = append(sections[index].Assignments, assignment)
				continue
			}
		}
		unassignedAssignments = append(unassignedAssignments, assignment)
	}

	if len(unassignedResources) > 0 || len(unassignedAssignments) > 0 {
		code := "shared"
		sections = append(sections, fellowLearningSection{
			Code:        &code,
			Kind:        "special",
			Title:       "Shared resources",
			SortOrder:   9999,
			Resources:   unassignedResources,
			Assignments: unassignedAssignments,
		})
	}

	return sections, nil
}

func (h *LearningHandler) resourcesForFellow(r *http.Request, memberID int64) ([]fellowLearningResource, error) {
	rows, err := h.DB.QueryContext(r.Context(), `
		SELECT
			r.id, r.type, r.name, r.description, r.url, r.duration, r.author, r.tag,
			r.learning_block_id, r.sort_order, r.created_at, r.updated_at, r.created_by,
			rr.read_at
		FROM resource r
		LEFT JOIN resource_read rr ON rr.resource_id = r.id AND rr.member_id = $1
		ORDER BY r.sort_order, r.id
	`, memberID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resources := []fellowLearningResource{}
	for rows.Next() {
		var item fellowLearningResource
		var itemType, name, description, url, duration, author, tag sql.NullString
		var learningBlockID, createdBy sql.NullInt64
		var readAt sql.NullTime
		if err := rows.Scan(
			&item.ID, &itemType, &name, &description, &url, &duration, &author, &tag,
			&learningBlockID, &item.SortOrder, &item.CreatedAt, &item.UpdatedAt, &createdBy,
			&readAt,
		); err != nil {
			return nil, err
		}
		item.Type = stringPtr(itemType)
		item.Name = stringPtr(name)
		item.Description = stringPtr(description)
		item.URL = stringPtr(url)
		item.Duration = stringPtr(duration)
		item.Author = stringPtr(author)
		item.Tag = stringPtr(tag)
		item.LearningBlockID = int64Ptr(learningBlockID)
		item.CreatedBy = int64Ptr(createdBy)
		item.ReadAt = timePtr(readAt)
		resources = append(resources, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return resources, nil
}

func (h *LearningHandler) assignmentsForFellow(r *http.Request, memberID int64) ([]fellowLearningAssignment, error) {
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
		return nil, err
	}
	defer rows.Close()

	assignments := []fellowLearningAssignment{}
	now := time.Now()
	for rows.Next() {
		var item fellowLearningAssignment
		var cohortID, sprintID, learningBlockID sql.NullInt64
		var learningBlock, title, formURL, description, grade sql.NullString
		var deadline, submittedAt sql.NullTime

		if err := rows.Scan(
			&item.ID, &cohortID, &sprintID, &learningBlockID, &learningBlock,
			&title, &formURL, &deadline, &description,
			&item.SubmitStatus, &submittedAt, &grade,
		); err != nil {
			return nil, err
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
		return nil, err
	}
	return assignments, nil
}
