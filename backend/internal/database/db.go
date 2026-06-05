package database

import (
	"database/sql"
	"log"

	_ "modernc.org/sqlite"
)

// Open opens (and if needed creates) the SQLite database at path, applies the
// schema, and seeds a little sample data so the app has something to show.
func Open(path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	if err := migrate(db); err != nil {
		return nil, err
	}
	if err := seed(db); err != nil {
		return nil, err
	}
	return db, nil
}

func migrate(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS fellows (
			id         INTEGER PRIMARY KEY AUTOINCREMENT,
			name       TEXT    NOT NULL,
			email      TEXT    NOT NULL UNIQUE,
			status     TEXT    NOT NULL DEFAULT 'active',
			created_at TEXT    NOT NULL DEFAULT (datetime('now'))
		);
	`)
	return err
}

func seed(db *sql.DB) error {
	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM fellows`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	log.Println("seeding sample fellows")
	_, err := db.Exec(`
		INSERT INTO fellows (name, email, status) VALUES
			('Ada Lovelace',    'ada@example.com',    'active'),
			('Alan Turing',     'alan@example.com',   'active'),
			('Grace Hopper',    'grace@example.com',  'alumni');
	`)
	return err
}
