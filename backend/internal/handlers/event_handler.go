package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
)

type EventHandler struct {
	DB *sql.DB
}

// List returns all events.
// GET /api/events
func (h *EventHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.QueryContext(r.Context(), `
		SELECT id, cohort_id, name, description,
		       TO_CHAR(event_date, 'YYYY-MM-DD'), all_day,
		       start_time, end_time, timezone, location,
		       user_id, created_at, updated_at, create_by
		FROM events
		ORDER BY event_date, start_time
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	type EventItem struct {
		ID          int64      `json:"id"`
		CohortID    *int64     `json:"cohort_id"`
		Name        *string    `json:"name"`
		Description *string    `json:"description"`
		EventDate   *string    `json:"date"`
		AllDay      bool       `json:"all_day"`
		Start       *string    `json:"start"`
		End         *string    `json:"end"`
		Timezone    *string    `json:"timezone"`
		Location    *string    `json:"location"`
		UserID      *int64     `json:"user_id"`
		CreatedAt   time.Time  `json:"created_at"`
		UpdatedAt   time.Time  `json:"updated_at"`
		CreateBy    *int64     `json:"create_by"`
	}

	events := []EventItem{}
	for rows.Next() {
		var e EventItem
		if err := rows.Scan(
			&e.ID, &e.CohortID, &e.Name, &e.Description,
			&e.EventDate, &e.AllDay,
			&e.Start, &e.End, &e.Timezone, &e.Location,
			&e.UserID, &e.CreatedAt, &e.UpdatedAt, &e.CreateBy,
		); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		events = append(events, e)
	}

	writeData(w, http.StatusOK, events)
}

// AdminCreate creates a new event.
// POST /api/admin/events
func (h *EventHandler) AdminCreate(w http.ResponseWriter, r *http.Request) {
	var body struct {
		CohortID    *int64  `json:"cohort_id"`
		Name        *string `json:"name"`
		Description *string `json:"description"`
		Date        *string `json:"date"`
		AllDay      bool    `json:"all_day"`
		Start       *string `json:"start"`
		End         *string `json:"end"`
		Timezone    *string `json:"timezone"`
		Location    *string `json:"location"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var id int64
	err := h.DB.QueryRowContext(r.Context(), `
		INSERT INTO events (cohort_id, name, description, event_date, all_day, start_time, end_time, timezone, location)
		VALUES ($1, $2, $3, NULLIF($4, '')::date, $5, $6, $7, $8, $9)
		RETURNING id
	`, body.CohortID, body.Name, body.Description, body.Date, body.AllDay,
		body.Start, body.End, body.Timezone, body.Location).Scan(&id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeData(w, http.StatusCreated, map[string]any{
		"id":   id,
		"name": body.Name,
		"date": body.Date,
	})
}

// AdminUpdate updates an event.
// PATCH /api/admin/events/{eventId}
func (h *EventHandler) AdminUpdate(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "eventId")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	var body struct {
		Name        *string `json:"name"`
		Description *string `json:"description"`
		Date        *string `json:"date"`
		AllDay      *bool   `json:"all_day"`
		Start       *string `json:"start"`
		End         *string `json:"end"`
		Timezone    *string `json:"timezone"`
		Location    *string `json:"location"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	res, err := h.DB.ExecContext(r.Context(), `
		UPDATE events SET
			name        = COALESCE($1, name),
			description = COALESCE($2, description),
			event_date  = COALESCE(NULLIF($3, '')::date, event_date),
			all_day     = COALESCE($4, all_day),
			start_time  = COALESCE($5, start_time),
			end_time    = COALESCE($6, end_time),
			timezone    = COALESCE($7, timezone),
			location    = COALESCE($8, location),
			updated_at  = NOW()
		WHERE id = $9
	`, body.Name, body.Description, body.Date, body.AllDay,
		body.Start, body.End, body.Timezone, body.Location, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		writeError(w, http.StatusNotFound, "event not found")
		return
	}

	writeData(w, http.StatusOK, map[string]any{"id": id})
}

// AdminDelete removes an event.
// DELETE /api/admin/events/{eventId}
func (h *EventHandler) AdminDelete(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "eventId")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	res, err := h.DB.ExecContext(r.Context(), `DELETE FROM events WHERE id = $1`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		writeError(w, http.StatusNotFound, "event not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
