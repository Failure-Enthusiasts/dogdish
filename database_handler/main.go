package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/Failure-Enthusiasts/cater-me-up/internal/storage"
	"github.com/go-playground/validator"
	"github.com/labstack/echo/v4"
	_ "github.com/lib/pq"
)

type EntreesAndSidesOrSaladBar struct {
	Name        string   `json:"name"`
	Allergens   []string `json:"allergens"`
	Preferences []string `json:"preferences"`
}

type Event struct {
	Weekday         string                      `json:"weekday" validate:"required"`
	ISODate         string                      `json:"iso_date" validate:"required"`
	Cuisine         string                      `json:"cuisine" validate:"required"`
	EntreesAndSides []EntreesAndSidesOrSaladBar `json:"entrees_and_sides" validate:"required"`
	SaladBar        []EntreesAndSidesOrSaladBar `json:"salad_bar" validate:"required"`
}

type EventValidator struct {
	validator *validator.Validate
}

func (cv *EventValidator) Validate(e Event) error {
	if err := cv.validator.Struct(e); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return nil
}

func main() {
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

	e := echo.New()
	e.POST("/events", func(c echo.Context) error {
		body := c.Request().Body
		defer body.Close()

		var event Event
		if err := json.NewDecoder(body).Decode(&event); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid JSON",
			})
		}
		return c.JSON(http.StatusOK, event)
	})
	e.Logger.Fatal(e.Start(":1323"))

}
