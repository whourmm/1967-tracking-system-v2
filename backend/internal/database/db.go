package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	_ "github.com/lib/pq"
)

// Open opens a PostgreSQL connection, applies SQL migrations, and seeds a small
// demo roster so the API has data in a fresh development database.
func Open(databaseURL, migrationsPath string) (*sql.DB, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}
	if err := migrate(db, migrationsPath); err != nil {
		db.Close()
		return nil, err
	}
	if os.Getenv("APP_ENV") != "production" {
		if err := seed(db); err != nil {
			db.Close()
			return nil, err
		}
	}
	return db, nil
}

func migrate(db *sql.DB, migrationsPath string) error {
	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
	`); err != nil {
		return err
	}

	entries, err := os.ReadDir(migrationsPath)
	if err != nil {
		return err
	}

	files := make([]string, 0, len(entries))
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			files = append(files, entry.Name())
		}
	}
	sort.Strings(files)

	for _, file := range files {
		var exists bool
		if err := db.QueryRow(`SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE version = $1)`, file).Scan(&exists); err != nil {
			return err
		}
		if exists {
			continue
		}

		path := filepath.Join(migrationsPath, file)
		sqlBytes, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		log.Printf("applying migration %s", file)
		if _, err := db.Exec(string(sqlBytes)); err != nil {
			return fmt.Errorf("apply migration %s: %w", file, err)
		}
		if _, err := db.Exec(`INSERT INTO schema_migrations (version) VALUES ($1)`, file); err != nil {
			return err
		}
	}

	return nil
}

func seed(db *sql.DB) error {
	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM "user"`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	log.Println("seeding sample fellows")
	if _, err := db.Exec(`
		INSERT INTO "user" (id, name, role, gmail, country) VALUES
			(1, 'Ada Lovelace', 'fellow', 'ada@example.com', 'Thailand'),
			(2, 'Alan Turing', 'fellow', 'alan@example.com', 'Singapore'),
			(3, 'Grace Hopper', 'fellow', 'grace@example.com', 'Vietnam')
		ON CONFLICT (id) DO NOTHING;

		INSERT INTO fellow (user_id, university, status, teamflow) VALUES
			(1, 'Chulalongkorn University', 'confirmed', 'Initiator'),
			(2, 'National University of Singapore', 'confirmed', 'Sharper'),
			(3, 'VNU University of Science', 'confirmed', 'Finisher')
		ON CONFLICT (user_id) DO NOTHING;

		SELECT setval(pg_get_serial_sequence('"user"', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "user"), 1));
	`); err != nil {
		return err
	}

	return nil
}
