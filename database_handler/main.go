package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	"github.com/Failure-Enthusiasts/cater-me-up/internal/storage"
	_ "github.com/lib/pq"
)

func main() {
	fmt.Println("Hello, World!")

	db, err := sql.Open("postgres", "postgres://app:password123@localhost:5432/dogdish?sslmode=disable")
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	queries := storage.New(db)
	events, err := queries.GetAllEvents(context.Background())
	if err != nil {
		log.Fatalf("Failed to get events: %v", err)
	}

	fmt.Println(events)
}
