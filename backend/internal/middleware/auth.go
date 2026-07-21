package middleware

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type AuthenticatedUser struct {
	ID    int64
	Name  string
	Email string
	Role  string
}

type authUserKey struct{}

type supabaseUser struct {
	Email        string         `json:"email"`
	UserMetadata map[string]any `json:"user_metadata"`
}

var authHTTPClient = &http.Client{Timeout: 10 * time.Second}

func SupabaseAuth(db *sql.DB, supabaseURL, publishableKey string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/health" {
			next.ServeHTTP(w, r)
			return
		}

		token := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
		if token == "" || token == r.Header.Get("Authorization") {
			writeAuthError(w, http.StatusUnauthorized, "authentication required")
			return
		}

		supabaseAccount, err := fetchSupabaseUser(r.Context(), supabaseURL, publishableKey, token)
		if err != nil {
			writeAuthError(w, http.StatusUnauthorized, "invalid or expired session")
			return
		}

		user, err := findOrCreateUser(r.Context(), db, supabaseAccount)
		if err != nil {
			writeAuthError(w, http.StatusInternalServerError, "failed to load account")
			return
		}

		requiredRole := roleForPath(r.URL.Path)
		if requiredRole != "" && user.Role != requiredRole {
			writeAuthError(w, http.StatusForbidden, "you do not have access to this area")
			return
		}

		ctx := context.WithValue(r.Context(), authUserKey{}, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func CurrentUser(ctx context.Context) (AuthenticatedUser, bool) {
	user, ok := ctx.Value(authUserKey{}).(AuthenticatedUser)
	return user, ok
}

func fetchSupabaseUser(ctx context.Context, supabaseURL, publishableKey, token string) (supabaseUser, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, strings.TrimRight(supabaseURL, "/")+"/auth/v1/user", nil)
	if err != nil {
		return supabaseUser{}, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("apikey", publishableKey)

	res, err := authHTTPClient.Do(req)
	if err != nil {
		return supabaseUser{}, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return supabaseUser{}, fmt.Errorf("supabase auth returned %s", res.Status)
	}

	var user supabaseUser
	if err := json.NewDecoder(res.Body).Decode(&user); err != nil {
		return supabaseUser{}, err
	}
	if user.Email == "" {
		return supabaseUser{}, errors.New("supabase user has no email")
	}
	return user, nil
}

func findOrCreateUser(ctx context.Context, db *sql.DB, account supabaseUser) (AuthenticatedUser, error) {
	var user AuthenticatedUser
	err := db.QueryRowContext(ctx, `
		SELECT id, COALESCE(name, ''), gmail, COALESCE(role, '')
		FROM "user"
		WHERE LOWER(gmail) = LOWER($1)
	`, account.Email).Scan(&user.ID, &user.Name, &user.Email, &user.Role)
	if err == nil {
		if _, err := db.ExecContext(ctx, `UPDATE "user" SET last_login_at = NOW() WHERE id = $1`, user.ID); err != nil {
			return AuthenticatedUser{}, err
		}
		switch user.Role {
		case "fellow":
			_, err = db.ExecContext(ctx, `
				INSERT INTO fellow (user_id, status)
				VALUES ($1, 'pending')
				ON CONFLICT (user_id) DO NOTHING
			`, user.ID)
		case "admin":
			_, err = db.ExecContext(ctx, `
				INSERT INTO admin (user_id)
				VALUES ($1)
				ON CONFLICT (user_id) DO NOTHING
			`, user.ID)
		}
		if err != nil {
			return AuthenticatedUser{}, err
		}
		return user, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return AuthenticatedUser{}, err
	}

	name, _ := account.UserMetadata["full_name"].(string)
	if strings.TrimSpace(name) == "" {
		name = strings.Split(account.Email, "@")[0]
	}
	err = db.QueryRowContext(ctx, `
		WITH new_user AS (
			INSERT INTO "user" (name, gmail, role, last_login_at)
			VALUES ($1, LOWER($2), 'fellow', NOW())
			RETURNING id, name, gmail, role
		), new_fellow AS (
			INSERT INTO fellow (user_id, status)
			SELECT id, 'pending' FROM new_user
			RETURNING user_id
		)
		SELECT u.id, COALESCE(u.name, ''), u.gmail, u.role
		FROM new_user u
		JOIN new_fellow f ON f.user_id = u.id
	`, name, account.Email).Scan(&user.ID, &user.Name, &user.Email, &user.Role)
	return user, err
}

func roleForPath(path string) string {
	if strings.HasPrefix(path, "/api/admin/") {
		return "admin"
	}
	if strings.HasPrefix(path, "/api/fellow/") {
		return "fellow"
	}
	return ""
}

func writeAuthError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]any{"data": nil, "error": message})
}
