package main

import (
	"log"
	"net/http"
	"os"

	"github.com/tracking-system-v2/backend/internal/database"
	"github.com/tracking-system-v2/backend/internal/routes"
)

func main() {
	port := getenv("PORT", "8080")
	databaseURL := getenv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/asean_tracker?sslmode=disable")
	migrationsPath := getenv("MIGRATIONS_PATH", "migrations")
	supabaseURL := os.Getenv("SUPABASE_URL")
	publishableKey := os.Getenv("SUPABASE_PUBLISHABLE_KEY")
	if supabaseURL == "" || publishableKey == "" {
		log.Println("WARNING: SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY not set — running without auth (dev mode)")
	}

	db, err := database.Open(databaseURL, migrationsPath)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()

	handler := routes.New(db, supabaseURL, publishableKey)

	addr := ":" + port
	log.Printf("backend listening on %s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
