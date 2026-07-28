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
	devMode := supabaseURL == "" || publishableKey == ""
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/health" {
			next.ServeHTTP(w, r)
			return
		}

		if devMode {
			user, err := devUser(r.Context(), db, r.Header.Get("X-Dev-Email"))
			if err != nil {
				writeAuthError(w, http.StatusUnauthorized, err.Error())
				return
			}
			ctx := context.WithValue(r.Context(), authUserKey{}, user)
			next.ServeHTTP(w, r.WithContext(ctx))
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

// devUser resolves the identity used when Supabase credentials are not
// configured. If the frontend sends an X-Dev-Email header that matches a user,
// that user is impersonated; otherwise fall back to the first admin, then the
// first user of any role.
func devUser(ctx context.Context, db *sql.DB, email string) (AuthenticatedUser, error) {
	var user AuthenticatedUser
	email = strings.TrimSpace(email)
	if email != "" {
		err := db.QueryRowContext(ctx, `
			SELECT id, COALESCE(name, ''), COALESCE(gmail, ''), COALESCE(role, 'fellow')
			FROM "user"
			WHERE LOWER(gmail) = LOWER($1)
		`, email).Scan(&user.ID, &user.Name, &user.Email, &user.Role)
		if errors.Is(err, sql.ErrNoRows) {
			return AuthenticatedUser{}, fmt.Errorf("dev mode: no user with email %q", email)
		}
		return user, err
	}
	err := db.QueryRowContext(ctx, `
		SELECT id, COALESCE(name, ''), COALESCE(gmail, ''), COALESCE(role, 'admin')
		FROM "user"
		ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, id
		LIMIT 1
	`).Scan(&user.ID, &user.Name, &user.Email, &user.Role)
	return user, err
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
	name, _ := account.UserMetadata["full_name"].(string)
	if strings.TrimSpace(name) == "" {
		name = strings.Split(account.Email, "@")[0]
	}

	var user AuthenticatedUser
	err := db.QueryRowContext(ctx, `
		WITH upserted_user AS (
			INSERT INTO "user" (name, gmail, role, last_login_at)
			VALUES ($1, LOWER($2), 'fellow', NOW())
			ON CONFLICT (LOWER(gmail)) WHERE gmail IS NOT NULL DO UPDATE SET
				last_login_at = EXCLUDED.last_login_at
			RETURNING id, name, gmail, role
		), ensure_fellow AS (
			INSERT INTO fellow (user_id, status)
			SELECT id, 'pending' FROM upserted_user WHERE role = 'fellow'
			ON CONFLICT (user_id) DO NOTHING
		), ensure_admin AS (
			INSERT INTO admin (user_id)
			SELECT id FROM upserted_user WHERE role = 'admin'
			ON CONFLICT (user_id) DO NOTHING
		)
		SELECT u.id, COALESCE(u.name, ''), u.gmail, u.role
		FROM upserted_user u
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
