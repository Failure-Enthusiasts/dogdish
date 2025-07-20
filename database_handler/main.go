package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/Failure-Enthusiasts/cater-me-up/internal/internal_types"
	"github.com/Failure-Enthusiasts/cater-me-up/internal/storage"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	_ "github.com/lib/pq"
)

func validateStruct(v *validator.Validate, data any, location string) []internal_types.FieldError {
	err := v.Struct(data)
	if err != nil {
		var fieldErrors []internal_types.FieldError
		for _, err := range err.(validator.ValidationErrors) {
			fieldErrors = append(fieldErrors, internal_types.FieldError{
				Location: location,
				Field:    err.Field(),
				Message:  err.Tag(),
			})
		}
		return fieldErrors
	}
	return nil
}

func validateEvent(event internal_types.Event) []internal_types.FieldError {
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
		return []internal_types.FieldError{
			{
				Field:   "ISODate",
				Message: "Failed to parse",
			},
		}
	}

	return nil
}

func main() {
	s := storage.NewStorage().
		WithPassword("password123").
		WithUser("app").
		WithDatabase("dogdish")

	e := echo.New()
	e.POST("/events", createEvent(s))
	e.Logger.Fatal(e.Start(":1323"))
}

func createEvent(storage *storage.Storage) echo.HandlerFunc {
	return func(ctx echo.Context) error {
		body := ctx.Request().Body
		defer body.Close()

		var event internal_types.Event
		if err := json.NewDecoder(body).Decode(&event); err != nil {
			return ctx.JSON(http.StatusBadRequest, internal_types.FieldErrorResponse{
				Error: "Invalid JSON",
			})
		}

		eventValidationErrors := validateEvent(event)
		if eventValidationErrors != nil {
			return ctx.JSON(http.StatusBadRequest, internal_types.FieldErrorResponse{
				Error:      "Invalid event data",
				FieldError: eventValidationErrors,
			})
		}

		newEventID, err := storage.StoreEvent(ctx.Request().Context(), event)
		if err != nil {
			return ctx.JSON(http.StatusInternalServerError, internal_types.ErrorResponse{
				Error: err.Error(),
			})
		}

		return ctx.JSON(http.StatusOK, map[string]uuid.UUID{
			"event_id": newEventID,
		})
	}

}
