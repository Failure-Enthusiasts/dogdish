package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	echotrace "github.com/DataDog/dd-trace-go/contrib/labstack/echo.v4/v2"
	"github.com/DataDog/dd-trace-go/v2/ddtrace/tracer"
	"github.com/Failure-Enthusiasts/cater-me-up/internal/config"
	"github.com/Failure-Enthusiasts/cater-me-up/internal/internal_types"
	"github.com/Failure-Enthusiasts/cater-me-up/internal/storage"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	_ "github.com/lib/pq"
	log "github.com/sirupsen/logrus"
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

func init() {
	log.SetFormatter(&log.JSONFormatter{})
	// TODO: Add logic to log to stdout based on environment variable
	// log.SetOutput(os.Stdout)
	file, err := os.OpenFile("./logs/database_handler.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err == nil {
		log.SetOutput(file)
	} else {
		log.Info("Failed to log to file, using default stderr")
	}
	// TODO: Add logic to set the log level based on environment variable
	log.SetLevel(log.InfoLevel)
}

func main() {
	tracer.Start()
	defer tracer.Stop()

	c := config.Load()
	s := storage.NewStorage().
		WithPassword(c.DatabasePassword).
		WithUser(c.DatabaseUser).
		WithDatabase(c.DatabaseName)

	e := echo.New()
	e.Use(echotrace.Middleware())

	e.POST("/event", createEvent(s))
	e.GET("/health", healthCheck(c))
	e.Logger.Fatal(e.Start(fmt.Sprintf(":%d", c.Port)))
}

func healthCheck(c *config.Config) echo.HandlerFunc {
	return func(ctx echo.Context) error {
		log.WithFields(log.Fields{"client_ip": ctx.RealIP(), "version": c.Version}).Info("health check hit")
		return ctx.JSON(http.StatusOK, map[string]string{
			"version": c.Version,
		})
	}
}

func createEvent(storage *storage.Storage) echo.HandlerFunc {
	return func(ctx echo.Context) error {
		log.WithFields(log.Fields{"client_ip": ctx.RealIP()}).Info("creating event")

		body := ctx.Request().Body
		defer body.Close()

		log.WithFields(log.Fields{"client_ip": ctx.RealIP(), "data": body}).Debug("json received")
		var event internal_types.Event
		if err := json.NewDecoder(body).Decode(&event); err != nil {
			err_msg := "failed to decode json"
			log.WithFields(log.Fields{"client_ip": ctx.RealIP()}).Error(err_msg)
			return ctx.JSON(http.StatusBadRequest, internal_types.FieldErrorResponse{
				Error: err_msg,
			})
		}

		eventValidationErrors := validateEvent(event)
		if eventValidationErrors != nil {
			err_msg := "invalid event data"
			log.WithFields(log.Fields{"client_ip": ctx.RealIP()}).Error(err_msg)

			return ctx.JSON(http.StatusBadRequest, internal_types.FieldErrorResponse{
				Error:      err_msg,
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
