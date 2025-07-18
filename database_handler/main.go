package main

import (
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
	Field   string `json:"field"`
	Message string `json:"message"`
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

		// Validate Data
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
				Error:      "Invalid data for event",
				FieldError: fieldErrors,
			})
		}

		for _, entree := range event.EntreesAndSides {
			fmt.Printf("Validating Entree and Sides: %v\n", entree)
			err = validate.Struct(entree)
			if err != nil {
				var fieldErrors []FieldError

				for _, err := range err.(validator.ValidationErrors) {
					fieldErrors = append(fieldErrors, FieldError{
						Field:   err.Field(),
						Message: err.Tag(),
					})
				}
				fmt.Printf("Failed to validate the entree: %q\n", fieldErrors)
				return c.JSON(http.StatusBadRequest, FieldErrorResponse{
					Error:      "Invalid data for entree_and_sides",
					FieldError: fieldErrors,
				})
			}
		}

		isoDate, err := time.Parse(time.DateOnly, event.ISODate)
		if err != nil {
			fmt.Printf("Error: %q\n", err.Error())
			return c.JSON(http.StatusBadRequest, FieldErrorResponse{
				Error: "Invalid date format for iso_date",
				FieldError: []FieldError{
					{
						Field:   "ISODate",
						Message: "Failed to parse",
					},
				},
			})
		}
		fmt.Printf("Date Time: %q\n", isoDate.Format(time.DateOnly))

		// Database
		queries := storage.New(db)
		tx, err := db.BeginTx(c.Request().Context(), nil)
		if err != nil {
			fmt.Printf("Failed to begin transaction: %q", err)
			return c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error: "Failed to create event",
			})
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
		newEventID, err := qtx.InsertEvent(c.Request().Context(), storage.InsertEventParams{
			Date:    event.Weekday,
			IsoDate: isoDate,
		})
		if err != nil {
			fmt.Printf("Failed to insert event into database: %q", err.Error())
			return c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error: "Failed to create event",
			})
		}

		// Create Cuisine
		newCuisineID, err := qtx.InsertCuisine(c.Request().Context(), event.Cuisine)
		if err != nil {
			fmt.Printf("Failed to insert cuisine into database: %q", err.Error())
			return c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error: "Failed to create cuisine",
			})
		}

		// Handle Entree
		var entreePreference storage.NullDogdishPreferenceEnum
		var foodID uuid.UUID
		for _, entree := range event.EntreesAndSides {
			switch entree.Preference {
			case string(storage.DogdishPreferenceEnumValue0):
				entreePreference = storage.NullDogdishPreferenceEnum{Valid: false}
			case string(storage.DogdishPreferenceEnumVegan):
				entreePreference = storage.NullDogdishPreferenceEnum{
					DogdishPreferenceEnum: storage.DogdishPreferenceEnumVegan,
					Valid:                 true,
				}
			case string(storage.DogdishPreferenceEnumVegetarian):
				entreePreference = storage.NullDogdishPreferenceEnum{
					DogdishPreferenceEnum: storage.DogdishPreferenceEnumVegetarian,
					Valid:                 true,
				}
			default:
				entreePreference = storage.NullDogdishPreferenceEnum{Valid: false}
			}

			// Create food
			foodID, err = qtx.InsertFood(c.Request().Context(), storage.InsertFoodParams{
				CuisineID:  newCuisineID,
				EventID:    newEventID,
				Name:       entree.Name,
				FoodType:   storage.DogdishFoodTypeEnumEntreesAndSides,
				Preference: entreePreference,
			})
			if err != nil {
				fmt.Printf("Failed to insert food into database: %q", err.Error())
				return c.JSON(http.StatusInternalServerError, ErrorResponse{
					Error: "Failed to create food",
				})
			}

			// Handle entree_and_sides allergens
			for _, allergen := range entree.Allergens {
				// Check to see is the allergen already exist
				allergenID, err := queries.GetAllergenByName(c.Request().Context(), allergen)

				// Allergen doesn't exist, add it to the database
				if err != nil {
					fmt.Printf("New Allergen detected: %q, adding to database\n", allergen)
					allergenID, err = queries.InsertAllergen(c.Request().Context(), allergen)
					if err != nil {
						fmt.Printf("Failed to insert allergen: %q", err.Error())
						return c.JSON(http.StatusInternalServerError, ErrorResponse{
							Error: "Failed to create food",
						})
					}
				}

				// Create the food allergen join table
				_, err = qtx.InsertFoodAllergen(c.Request().Context(), storage.InsertFoodAllergenParams{
					FoodID:     foodID,
					AllergenID: allergenID,
				})
				if err != nil {
					fmt.Printf("Failed to insert food allergen: %q", err.Error())
					return c.JSON(http.StatusInternalServerError, ErrorResponse{
						Error: "Failed to create food",
					})
				}
			}

		}

		// Handle SaladBar Toppings
		var toppingPreference storage.NullDogdishPreferenceEnum
		for _, toppings := range event.SaladBar.Toppings {
			switch toppings.Preference {
			case string(storage.DogdishPreferenceEnumValue0):
				toppingPreference = storage.NullDogdishPreferenceEnum{Valid: false}
			case string(storage.DogdishPreferenceEnumVegan):
				toppingPreference = storage.NullDogdishPreferenceEnum{
					DogdishPreferenceEnum: storage.DogdishPreferenceEnumVegan,
					Valid:                 true,
				}
			case string(storage.DogdishPreferenceEnumVegetarian):
				toppingPreference = storage.NullDogdishPreferenceEnum{
					DogdishPreferenceEnum: storage.DogdishPreferenceEnumVegetarian,
					Valid:                 true,
				}
			default:
				toppingPreference = storage.NullDogdishPreferenceEnum{Valid: false}
			}

			// Create food
			foodID, err = qtx.InsertFood(c.Request().Context(), storage.InsertFoodParams{
				CuisineID:  newCuisineID,
				EventID:    newEventID,
				Name:       toppings.Name,
				FoodType:   storage.DogdishFoodTypeEnumEntreesAndSides,
				Preference: toppingPreference,
			})
			if err != nil {
				fmt.Printf("Failed to insert food into database: %q", err.Error())
				return c.JSON(http.StatusInternalServerError, ErrorResponse{
					Error: "Failed to create food",
				})
			}

			// Handle Allergens
			for _, allergen := range toppings.Allergens {
				// Check to see is the allergen already exist
				allergenID, err := queries.GetAllergenByName(c.Request().Context(), allergen)

				// Allergen doesn't exist, add it to the database
				if err != nil {
					fmt.Printf("New Allergen detected: %q, adding to database\n", allergen)
					allergenID, err = queries.InsertAllergen(c.Request().Context(), allergen)
					if err != nil {
						fmt.Printf("Failed to insert allergen: %q", err.Error())
						return c.JSON(http.StatusInternalServerError, ErrorResponse{
							Error: "Failed to create food",
						})
					}
				}

				// Create the food allergen join table
				_, err = qtx.InsertFoodAllergen(c.Request().Context(), storage.InsertFoodAllergenParams{
					FoodID:     foodID,
					AllergenID: allergenID,
				})
				if err != nil {
					fmt.Printf("Failed to insert food allergen: %q", err.Error())
					return c.JSON(http.StatusInternalServerError, ErrorResponse{
						Error: "Failed to create food",
					})
				}
			}
		}

		// Handle SaladBar Dressings
		var dressingsPreference storage.NullDogdishPreferenceEnum
		for _, dressings := range event.SaladBar.Dressings {

			// Handle Preference
			switch dressings.Preference {
			case string(storage.DogdishPreferenceEnumValue0):
				dressingsPreference = storage.NullDogdishPreferenceEnum{Valid: false}
			case string(storage.DogdishPreferenceEnumVegan):
				dressingsPreference = storage.NullDogdishPreferenceEnum{
					DogdishPreferenceEnum: storage.DogdishPreferenceEnumVegan,
					Valid:                 true,
				}
			case string(storage.DogdishPreferenceEnumVegetarian):
				dressingsPreference = storage.NullDogdishPreferenceEnum{
					DogdishPreferenceEnum: storage.DogdishPreferenceEnumVegetarian,
					Valid:                 true,
				}
			default:
				dressingsPreference = storage.NullDogdishPreferenceEnum{Valid: false}
			}

			// Create food
			foodID, err = qtx.InsertFood(c.Request().Context(), storage.InsertFoodParams{
				CuisineID:  newCuisineID,
				EventID:    newEventID,
				Name:       dressings.Name,
				FoodType:   storage.DogdishFoodTypeEnumEntreesAndSides,
				Preference: dressingsPreference,
			})
			if err != nil {
				fmt.Printf("Failed to insert food into database: %q", err.Error())
				return c.JSON(http.StatusInternalServerError, ErrorResponse{
					Error: "Failed to create food",
				})
			}

			// Handle Allergens
			for _, allergen := range dressings.Allergens {
				// Check to see is the allergen already exist
				allergenID, err := queries.GetAllergenByName(c.Request().Context(), allergen)

				// Allergen doesn't exist, add it to the database
				if err != nil {
					fmt.Printf("New Allergen detected: %q, adding to database\n", allergen)
					allergenID, err = queries.InsertAllergen(c.Request().Context(), allergen)
					if err != nil {
						fmt.Printf("Failed to insert allergen: %q", err.Error())
						return c.JSON(http.StatusInternalServerError, ErrorResponse{
							Error: "Failed to create food",
						})
					}
				}

				_, err = qtx.InsertFoodAllergen(c.Request().Context(), storage.InsertFoodAllergenParams{
					FoodID:     foodID,
					AllergenID: allergenID,
				})
				if err != nil {
					fmt.Printf("Failed to insert food allergen: %q", err.Error())
					return c.JSON(http.StatusInternalServerError, ErrorResponse{
						Error: "Failed to create food",
					})
				}
			}
		}

		if err := tx.Commit(); err != nil {
			fmt.Printf("Failed to commit transaction: %q", err.Error())
			return c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error: "Failed to create food",
			})
		}
		return c.JSON(http.StatusOK, map[string]uuid.UUID{
			"event_id": newEventID,
		})

	})
	e.Logger.Fatal(e.Start(":1323"))
}
