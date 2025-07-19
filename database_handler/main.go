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
	Name       string   `json:"name" validate:"required"`
	Allergens  []string `json:"allergens" validate:"required"`
	Preference string   `json:"preference"`
}

type SaladBar struct {
	Toppings  []EntreesAndSidesOrSaladBar `json:"toppings" validate:"required"`
	Dressings []EntreesAndSidesOrSaladBar `json:"dressings" validate:"required"`
}

type Event struct {
	Weekday         string                      `json:"weekday" validate:"required"`
	ISODate         string                      `json:"iso_date" validate:"required,datetime=2006-01-02"`
	Cuisine         string                      `json:"cuisine" validate:"required"`
	EntreesAndSides []EntreesAndSidesOrSaladBar `json:"entrees_and_sides" validate:"required"`
	SaladBar        SaladBar                    `json:"salad_bar" validate:"required"`
}

type FieldErrorResponse struct {
	Error      string       `json:"error"`
	FieldError []FieldError `json:"field_errors"`
}
type ErrorResponse struct {
	Error string `json:"error"`
}

type FieldError struct {
	Location string `json:"location"`
	Field    string `json:"field"`
	Message  string `json:"message"`
}

func validateStruct(v *validator.Validate, data any, location string) []FieldError {
	err := v.Struct(data)
	if err != nil {
		var fieldErrors []FieldError
		for _, err := range err.(validator.ValidationErrors) {
			fieldErrors = append(fieldErrors, FieldError{
				Location: location,
				Field:    err.Field(),
				Message:  err.Tag(),
			})
		}
		return fieldErrors
	}
	return nil
}

func validateEvent(event Event) []FieldError {
	validate := validator.New(validator.WithRequiredStructEnabled())

	// Validate event's root level fields
	eventErrors := validateStruct(validate, event, "Event")
	if eventErrors != nil {
		return eventErrors
	}

	// Validate event entress and sides
	for ix, entree := range event.EntreesAndSides {
		fmt.Printf("Validating Entree and Sides: %v\n", entree)
		entreeErrors := validateStruct(validate, entree, fmt.Sprintf("Entree [%d]", ix))
		if entreeErrors != nil {
			return entreeErrors
		}
	}

	// Validate salad bar
	saladBarErrors := validateStruct(validate, event.SaladBar, "Salad Bar")
	fmt.Printf("Validating Salad Dressing: %v\n", event.SaladBar)
	if saladBarErrors != nil {
		return saladBarErrors
	}

	// Validate salad bar toppings
	for ix, topping := range event.SaladBar.Toppings {
		fmt.Printf("Validating Topping: %v\n", topping)
		toppingsErrors := validateStruct(validate, topping, fmt.Sprintf("Salad Bar - Topping [%d]", ix))
		if toppingsErrors != nil {
			return toppingsErrors
		}
	}

	// Validate salad bar dressings
	for ix, dressing := range event.SaladBar.Dressings {
		fmt.Printf("Validating Dressing: %v\n", dressing)
		dressingsErrors := validateStruct(validate, dressing, fmt.Sprintf("Salad Bar - Dressing [%d]", ix))
		if dressingsErrors != nil {
			return dressingsErrors
		}
	}

	// Handle
	_, err := time.Parse(time.DateOnly, event.ISODate)
	if err != nil {
		return []FieldError{
			{
				Field:   "ISODate",
				Message: "Failed to parse",
			},
		}
	}

	return nil
}

func storeEvent(c context.Context, db *sql.DB, event Event) (uuid.UUID, error) {
	// Ignoring error since this was already validated in validateEvent
	isoDate, _ := time.Parse(time.DateOnly, event.ISODate)

	queries := storage.New(db)
	tx, err := db.BeginTx(c, nil)
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to begin transaction: %q", err)
	}

	// Begin Transaction
	qtx := queries.WithTx(tx)
	defer func() {
		if err != nil {
			fmt.Printf("\n\n\nError Found: %q\n\n\nRolling Back\n\n\n", err)
			tx.Rollback()
		}
	}()

	// Create Event
	newEventID, err := qtx.InsertEvent(c, storage.InsertEventParams{
		Date:    event.Weekday,
		IsoDate: isoDate,
	})
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to insert event into database: %q", err)
	}

	// Create Cuisine
	newCuisineID, err := qtx.InsertCuisine(c, event.Cuisine)
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to insert cuisine into database: %q", err)
	}

	// Store Entree
	for _, entree := range event.EntreesAndSides {
		fmt.Printf("inserting entree: %+v\n", entree)
		_, err := storeFood(c, qtx, queries, entree, newEventID, newCuisineID)
		if err != nil {
			return uuid.Nil, fmt.Errorf("failed to insert entree into database: %q", err)
		}
	}

	// Store salad bar toppings
	for _, toppings := range event.SaladBar.Toppings {
		fmt.Printf("inserting topping: %+v\n", toppings)
		_, err := storeFood(c, qtx, queries, toppings, newEventID, newCuisineID)
		if err != nil {
			return uuid.Nil, fmt.Errorf("failed to insert topping into database: %q", err)
		}
	}

	// Store salad bar dressings
	for _, dressings := range event.SaladBar.Dressings {
		fmt.Printf("inserting dressing: %+v\n", dressings)
		_, err := storeFood(c, qtx, queries, dressings, newEventID, newCuisineID)
		if err != nil {
			return uuid.Nil, fmt.Errorf("failed to insert dressing into database: %q", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return uuid.Nil, fmt.Errorf("failed to commit transaction: %q", err)
	}

	return newEventID, nil
}

func storeFood(c context.Context, qtx, q *storage.Queries, food EntreesAndSidesOrSaladBar, eventID, cuisineID uuid.UUID) (uuid.UUID, error) {
	var preference storage.NullDogdishPreferenceEnum
	var foodID uuid.UUID

	// Handle preference
	switch food.Preference {
	case string(storage.DogdishPreferenceEnumValue0):
		preference = storage.NullDogdishPreferenceEnum{Valid: false}
	case string(storage.DogdishPreferenceEnumVegan):
		preference = storage.NullDogdishPreferenceEnum{
			DogdishPreferenceEnum: storage.DogdishPreferenceEnumVegan,
			Valid:                 true,
		}
	case string(storage.DogdishPreferenceEnumVegetarian):
		preference = storage.NullDogdishPreferenceEnum{
			DogdishPreferenceEnum: storage.DogdishPreferenceEnumVegetarian,
			Valid:                 true,
		}
	default:
		preference = storage.NullDogdishPreferenceEnum{Valid: false}
	}

	// Create food
	foodID, err := qtx.InsertFood(c, storage.InsertFoodParams{
		CuisineID:  cuisineID,
		EventID:    eventID,
		Name:       food.Name,
		FoodType:   storage.DogdishFoodTypeEnumEntreesAndSides,
		Preference: preference,
	})
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to insert food into database: %q", err)
	}

	// Handle entree and sides allergens
	for _, allergen := range food.Allergens {
		// Check to see is the allergen already exist
		allergenID, err := q.GetAllergenByName(c, allergen)

		// Allergen doesn't exist, add it to the database
		if err != nil {
			fmt.Printf("New Allergen detected: %q, adding to database\n", allergen)
			allergenID, err = q.InsertAllergen(c, allergen)
			if err != nil {
				return uuid.Nil, fmt.Errorf("failed to insert allergen: %q", err)
			}
		}

		// Create the food allergen join table
		_, err = qtx.InsertFoodAllergen(c, storage.InsertFoodAllergenParams{
			FoodID:     foodID,
			AllergenID: allergenID,
		})
		if err != nil {
			return uuid.Nil, fmt.Errorf("failed to insert food allergen: %q", err.Error())
		}
	}

	return foodID, nil
}

func main() {
	db, err := sql.Open("postgres", "postgres://app:password123@localhost:5432/dogdish?sslmode=disable")
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	e := echo.New()
	e.POST("/events", func(c echo.Context) error {
		body := c.Request().Body
		defer body.Close()

		var event Event
		if err := json.NewDecoder(body).Decode(&event); err != nil {
			return c.JSON(http.StatusBadRequest, FieldErrorResponse{
				Error: "Invalid JSON",
			})
		}

		eventValidationErrors := validateEvent(event)
		if eventValidationErrors != nil {
			return c.JSON(http.StatusBadRequest, FieldErrorResponse{
				Error:      "Invalid event data",
				FieldError: eventValidationErrors,
			})
		}

		newEventID, err := storeEvent(c.Request().Context(), db, event)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error: err.Error(),
			})
		}

		return c.JSON(http.StatusOK, map[string]uuid.UUID{
			"event_id": newEventID,
		})

	})
	e.Logger.Fatal(e.Start(":1323"))
}
