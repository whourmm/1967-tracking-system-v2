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
	dbPath := getenv("DATABASE_PATH", "./data/asean_tracker.db")

	db, err := database.Open(dbPath)
	if err != nil {
		log.Fatalf("failed to open database at %s: %v", dbPath, err)
	}
	defer db.Close()

	handler := routes.New(db)

	addr := ":" + port
	log.Printf("backend listening on %s (db: %s)", addr, dbPath)
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
