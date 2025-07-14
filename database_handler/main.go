package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/Failure-Enthusiasts/cater-me-up/internal/storage"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
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
	ISODate         string                      `json:"iso_date" validate:"required,datetime=2006-01-02"`
	Cuisine         string                      `json:"cuisine" validate:"required"`
	EntreesAndSides []EntreesAndSidesOrSaladBar `json:"entrees_and_sides" validate:"required"`
	SaladBar        []EntreesAndSidesOrSaladBar `json:"salad_bar" validate:"required"`
}

type FieldErrorResponse struct {
	Error      string       `json:"error"`
	FieldError []FieldError `json:"field_errors"`
}
type ErrorResponse struct {
	Error string `json:"error"`
}

type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
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

		validate := validator.New(validator.WithRequiredStructEnabled())

		var event Event
		if err := json.NewDecoder(body).Decode(&event); err != nil {
			return c.JSON(http.StatusBadRequest, FieldErrorResponse{
				Error: "Invalid JSON",
			})
		}

		err = validate.Struct(event)
		if err != nil {
			var fieldErrors []FieldError

			for _, err := range err.(validator.ValidationErrors) {
				fieldErrors = append(fieldErrors, FieldError{
					Field:   err.Field(),
					Message: err.Tag(),
				})
			}
			return c.JSON(http.StatusBadRequest, FieldErrorResponse{
				Error:      "Invalid Schema",
				FieldError: fieldErrors,
			})
		}

		isoDate, err := time.Parse(time.DateOnly, event.ISODate)
		if err != nil {
			fmt.Printf("Error: %q\n", err.Error())
			return c.JSON(http.StatusBadRequest, FieldErrorResponse{
				Error: "Invalid Schema",
				FieldError: []FieldError{
					{
						Field:   "ISODate",
						Message: "Failed to parse ",
					},
				},
			})
		}
		fmt.Printf("Date Time: %q\n", isoDate.Format(time.DateOnly))

		queries := storage.New(db)
		insertEventParams := storage.InsertEventParams{
			Date:    event.Weekday,
			IsoDate: isoDate,
		}
		newEventID, err := queries.InsertEvent(c.Request().Context(), insertEventParams)
		if err != nil {
			fmt.Printf("Failed to insert event into database: %q", err.Error())
			return c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error: "Failed to create event",
			})
		}

		newCuisineID, err := queries.InsertCuisine(c.Request().Context(), event.Cuisine)
		if err != nil {
			fmt.Printf("Failed to insert cuisine into database: %q", err.Error())
			return c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error: "Failed to create cuisine",
			})
		}
		return c.JSON(http.StatusOK, map[string]uuid.UUID{
			"event_id":   newEventID,
			"cuisine_id": newCuisineID,
		})
	})
	e.Logger.Fatal(e.Start(":1323"))

}
