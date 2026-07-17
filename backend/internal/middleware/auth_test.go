package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestFetchSupabaseUser(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer valid-token" || r.Header.Get("apikey") != "publishable-key" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"email":"admin@example.com","user_metadata":{"full_name":"Admin User"}}`))
	}))
	defer server.Close()

	user, err := fetchSupabaseUser(context.Background(), server.URL, "publishable-key", "valid-token")
	if err != nil {
		t.Fatal(err)
	}
	if user.Email != "admin@example.com" || roleForPath("/api/admin/fellows") != "admin" || roleForPath("/api/fellow/learning") != "fellow" {
		t.Fatal("Supabase user or route role was not resolved correctly")
	}
}
