package handlers

import (
	"context"
	"fmt"

	"github.com/tracking-system-v2/backend/internal/middleware"
)

func currentFellowID(ctx context.Context) (int64, error) {
	user, ok := middleware.CurrentUser(ctx)
	if !ok {
		return 0, fmt.Errorf("authenticated user missing from request")
	}
	return user.ID, nil
}
