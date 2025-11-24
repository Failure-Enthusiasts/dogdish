package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	echotrace "github.com/DataDog/dd-trace-go/contrib/labstack/echo.v4/v2"
	"github.com/DataDog/dd-trace-go/v2/ddtrace/tracer"
	"github.com/Failure-Enthusiasts/cater-me-up/internal/config"
	"github.com/Failure-Enthusiasts/cater-me-up/internal/internal_types"
	"github.com/Failure-Enthusiasts/cater-me-up/internal/storage"
	"github.com/Failure-Enthusiasts/cater-me-up/internal/storage/postgres"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
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
	log.SetOutput(os.Stdout)

	// file, err := os.OpenFile("./logs/database_handler.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	// if err == nil {
	// 	log.SetOutput(file)
	// } else {
	// 	log.Info("Failed to log to file, using default stderr")
	// }

	// TODO: Add logic to set the log level based on environment variable
	log.SetLevel(log.InfoLevel)
}

func main() {
	tracer.Start()
	defer tracer.Stop()

	c := config.Load()
	s := storage.NewStorage().
		WithHost(c.DatabaseHost).
		WithPort(c.DatabasePort).
		WithPassword(c.DatabasePassword).
		WithUser(c.DatabaseUser).
		WithDatabase(c.DatabaseName)

	e := echo.New()
	e.Use(echotrace.Middleware())
	// TODO: make this less permissive
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
	}))

	e.POST("/event", createEvent(s))
	e.GET("/health", healthCheck(c))
	e.GET("/front-page-events", getFrontPageEvents(s))
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

type FrontPageEvent struct {
	Weekday         string                                     `json:"weekday"`
	ISODate         string                                     `json:"iso_date"`
	Cuisine         string                                     `json:"cuisine"`
	EntreesAndSides []internal_types.EntreesAndSidesOrSaladBar `json:"entrees_and_sides"`
	SaladBar        internal_types.SaladBar                    `json:"salad_bar"`
}

type GetFrontPageEventsResponse struct {
	Events []FrontPageEvent `json:"events"`
}

func getFrontPageEvents(storage *storage.Storage) echo.HandlerFunc {
	return func(ctx echo.Context) error {
		log.WithFields(log.Fields{"client_ip": ctx.RealIP()}).Info("getting events for front page")

		var frontPageEvents []FrontPageEvent

		eventIDs, err := storage.GetFrontPageEventIDs(ctx.Request().Context())
		if err != nil {
			return ctx.JSON(http.StatusInternalServerError, internal_types.ErrorResponse{
				Error: err.Error(),
			})
		}

		for _, event := range eventIDs {
			log.WithFields(log.Fields{"event_id": event.ID}).Info("event id found")
			var frontPageEvent FrontPageEvent = FrontPageEvent{
				Weekday: event.Date,
				ISODate: event.IsoDate.Format(time.DateOnly),
			}

			log.WithFields(log.Fields{"event_id": event.ID}).Info("Getting food by event id")
			eventFoods, err := storage.GetFoodsByEventId(ctx.Request().Context(), event.ID)
			if err != nil {
				return ctx.JSON(http.StatusInternalServerError, internal_types.ErrorResponse{
					Error: err.Error(),
				})
			}
			foodCount := len(eventFoods)
			log.WithFields(log.Fields{"food_count": foodCount}).Info("Food found")

			if foodCount == 0 {
				log.Info("No food found")
				continue
			}

			cuisine, err := storage.GetCuisineById(ctx.Request().Context(), eventFoods[0].CuisineID)
			if err != nil {
				return ctx.JSON(http.StatusInternalServerError, internal_types.ErrorResponse{
					Error: err.Error(),
				})
			}
			frontPageEvent.Cuisine = cuisine.Name

			for _, eventFood := range eventFoods {
				log.Info("Checking the event food")
				log.WithFields(log.Fields{"food": eventFood}).Info("Event Food")

				allergens := strings.Split(string(eventFood.AllergenNames), ",")
				var preference string
				if eventFood.Preference.Valid {
					preference = string(eventFood.Preference.DogdishPreferenceEnum)
				} else {
					preference = ""
				}

				switch eventFood.FoodType {
				case postgres.DogdishFoodTypeEnumEntreesAndSides:
					frontPageEvent.EntreesAndSides = append(frontPageEvent.EntreesAndSides, internal_types.EntreesAndSidesOrSaladBar{
						Name:       eventFood.Name,
						Allergens:  allergens,
						Preference: preference,
					})
				case postgres.DogdishFoodTypeEnumToppings:

					frontPageEvent.SaladBar.Toppings = append(frontPageEvent.SaladBar.Toppings, internal_types.EntreesAndSidesOrSaladBar{
						Name:       eventFood.Name,
						Allergens:  allergens,
						Preference: preference,
					})
				case postgres.DogdishFoodTypeEnumDressings:

					frontPageEvent.SaladBar.Dressings = append(frontPageEvent.SaladBar.Dressings, internal_types.EntreesAndSidesOrSaladBar{
						Name:       eventFood.Name,
						Allergens:  allergens,
						Preference: preference,
					})
				default:
					log.WithFields(log.Fields{"food_type": eventFood.FoodType}).Info("Unknown food type")
				}
			}
			frontPageEvents = append(frontPageEvents, frontPageEvent)

		}

		return ctx.JSON(http.StatusOK, map[string][]FrontPageEvent{
			"events": frontPageEvents,
		})
	}
}
