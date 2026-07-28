package models

import "time"

type User struct {
	ID          int64      `json:"id"`
	PublicID    *string    `json:"public_id,omitempty"`
	Name        *string    `json:"name,omitempty"`
	Role        *string    `json:"role,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	DiscordName *string    `json:"discord_name,omitempty"`
	LineID      *string    `json:"line_id,omitempty"`
	Phone       *string    `json:"phone,omitempty"`
	LinkedIn    *string    `json:"linkedin,omitempty"`
	PhotoURL    *string    `json:"photo_url,omitempty"`
	Country     *string    `json:"country,omitempty"`
	UpdateAt    time.Time  `json:"update_at"`
	Gmail       *string    `json:"gmail,omitempty"`
	LastLoginAt *time.Time `json:"last_login_at,omitempty"`
}

type Admin struct {
	UserID int64 `json:"user_id"`
}

type Mentor struct {
	UserID int64 `json:"user_id"`
	TeamID int64 `json:"team_id"`
}

// Fellow is the public list response shape for GET /api/fellows.
type Fellow struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

type FellowProfile struct {
	UserID              int64   `json:"user_id"`
	TeamID              *int64  `json:"team_id,omitempty"`
	University          *string `json:"university,omitempty"`
	Major               *string `json:"major,omitempty"`
	Status              *string `json:"status,omitempty"`
	GroupID             *int64  `json:"group_id,omitempty"`
	Teamflow            *string `json:"teamflow,omitempty"`
	AvailabilityVisible bool    `json:"availability_visible"`
}

type Cohort struct {
	ID               int64      `json:"id"`
	Name             *string    `json:"name,omitempty"`
	StartDate        *time.Time `json:"start_date,omitempty"`
	EndDate          *time.Time `json:"end_date,omitempty"`
	PresentationDate *time.Time `json:"presentation_date,omitempty"`
	IsActive         bool       `json:"is_active"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdateAt         time.Time  `json:"update_at"`
	CreatedBy        *int64     `json:"created_by,omitempty"`
}

type Sprint struct {
	ID                 int64      `json:"id"`
	CohortID           *int64     `json:"cohort_id,omitempty"`
	Name               *string    `json:"name,omitempty"`
	Description        *string    `json:"description,omitempty"`
	StartsOn           *time.Time `json:"starts_on,omitempty"`
	SubmissionDeadline *time.Time `json:"submission_deadline,omitempty"`
	IsCurrent          bool       `json:"is_current"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdateAt           time.Time  `json:"update_at"`
	CreatedBy          *int64     `json:"created_by,omitempty"`
}

type LearningBlock struct {
	ID          int64     `json:"id"`
	CohortID    *int64    `json:"cohort_id,omitempty"`
	Code        *string   `json:"code,omitempty"`
	Kind        *string   `json:"kind,omitempty"`
	Title       *string   `json:"title,omitempty"`
	Description *string   `json:"description,omitempty"`
	SortOrder   int       `json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
	UpdateAt    time.Time `json:"update_at"`
	CreatedBy   *int64    `json:"created_by,omitempty"`
}

type Case struct {
	ID              int64      `json:"id"`
	CohortID        *int64     `json:"cohort_id,omitempty"`
	SprintID        *int64     `json:"sprint_id,omitempty"`
	Title           *string    `json:"title,omitempty"`
	CaseOwner       *string    `json:"case_owner,omitempty"`
	Status          *string    `json:"status,omitempty"`
	Summary         *string    `json:"summary,omitempty"`
	FileName        *string    `json:"file_name,omitempty"`
	PublishedDate   *time.Time `json:"published_date,omitempty"`
	GoogleDriveLink *string    `json:"googledrive_link,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdateAt        time.Time  `json:"update_at"`
	Theme           *string    `json:"theme,omitempty"`
	CreateBy        *int64     `json:"create_by,omitempty"`
}

type Group struct {
	ID        int64      `json:"id"`
	CohortID  *int64     `json:"cohort_id,omitempty"`
	Name      *string    `json:"name,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	CaseID    *int64     `json:"case_id,omitempty"`
	UpdateAt  time.Time  `json:"update_at"`
	StartDate *time.Time `json:"start_date,omitempty"`
	EndDate   *time.Time `json:"end_date,omitempty"`
	CreatedBy *int64     `json:"created_by,omitempty"`
}

type Team struct {
	ID        int64     `json:"id"`
	GroupID   *int64    `json:"group_id,omitempty"`
	Name      *string   `json:"name,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	CaseID    *int64    `json:"case_id,omitempty"`
	UpdateAt  time.Time `json:"update_at"`
	CreatedBy *int64    `json:"created_by,omitempty"`
}

type CaseSubmission struct {
	CaseID        int64      `json:"case_id"`
	TeamID        int64      `json:"team_id"`
	Status        string     `json:"status"`
	SubmissionURL *string    `json:"submission_url,omitempty"`
	SubmittedAt   *time.Time `json:"submitted_at,omitempty"`
	ReviewedAt    *time.Time `json:"reviewed_at,omitempty"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type Assignment struct {
	ID              int64      `json:"id"`
	CohortID        *int64     `json:"cohort_id,omitempty"`
	SprintID        *int64     `json:"sprint_id,omitempty"`
	LearningBlockID *int64     `json:"learning_block_id,omitempty"`
	Title           *string    `json:"title,omitempty"`
	FormURL         *string    `json:"form_url,omitempty"`
	Deadline        *time.Time `json:"deadline,omitempty"`
	Description     *string    `json:"description,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdateAt        time.Time  `json:"update_at"`
	CreatedBy       *int64     `json:"created_by,omitempty"`
}

type AssignmentSubmission struct {
	AssignmentID int64      `json:"assignment_id"`
	MemberID     int64      `json:"member_id"`
	SubmitStatus int        `json:"submit_status"`
	SubmittedAt  *time.Time `json:"submitted_at,omitempty"`
	Grade        *string    `json:"grade,omitempty"`
}

type Resource struct {
	ID              int64     `json:"id"`
	Type            *string   `json:"type,omitempty"`
	Name            *string   `json:"name,omitempty"`
	Description     *string   `json:"description,omitempty"`
	URL             *string   `json:"url,omitempty"`
	Duration        *string   `json:"duration,omitempty"`
	Author          *string   `json:"author,omitempty"`
	Tag             *string   `json:"tag,omitempty"`
	LearningBlockID *int64    `json:"learning_block_id,omitempty"`
	SortOrder       int       `json:"sort_order"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	CreatedBy       *int64    `json:"created_by,omitempty"`
}

type ResourceRead struct {
	ResourceID int64     `json:"resource_id"`
	MemberID   int64     `json:"member_id"`
	ReadAt     time.Time `json:"read_at"`
}

type APISync struct {
	ID           int64     `json:"id"`
	AssignmentID *int64    `json:"assignment_id,omitempty"`
	UpdatedAt    time.Time `json:"updated_at"`
	CreatedAt    time.Time `json:"created_at"`
}

type Event struct {
	ID          int64      `json:"id"`
	CohortID    *int64     `json:"cohort_id,omitempty"`
	Name        *string    `json:"name,omitempty"`
	Description *string    `json:"description,omitempty"`
	EventDate   *time.Time `json:"event_date,omitempty"`
	AllDay      bool       `json:"all_day"`
	StartTime   *string    `json:"start_time,omitempty"`
	EndTime     *string    `json:"end_time,omitempty"`
	Timezone    *string    `json:"timezone,omitempty"`
	Location    *string    `json:"location,omitempty"`
	UserID      *int64     `json:"user_id,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	CreateBy    *int64     `json:"create_by,omitempty"`
}

type FellowAvailability struct {
	MemberID  int64     `json:"member_id"`
	DayOfWeek string    `json:"day_of_week"`
	Available bool      `json:"available"`
	UpdatedAt time.Time `json:"updated_at"`
}
