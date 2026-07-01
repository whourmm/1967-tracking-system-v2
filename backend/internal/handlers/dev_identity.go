package handlers

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"strconv"
)

// currentFellowID is the temporary development identity resolver.
// Auth0 middleware should replace this once real authentication is wired.
func currentFellowID(ctx context.Context, db *sql.DB) (int64, error) {
	if raw := os.Getenv("DEV_FELLOW_ID"); raw != "" {
		id, err := strconv.ParseInt(raw, 10, 64)
		if err != nil || id <= 0 {
			return 0, fmt.Errorf("invalid DEV_FELLOW_ID")
		}
		return id, nil
	}

	var id int64
	err := db.QueryRowContext(ctx, `
		SELECT u.id
		FROM fellow f
		JOIN "user" u ON u.id = f.user_id
		ORDER BY u.id
		LIMIT 1
	`).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}
