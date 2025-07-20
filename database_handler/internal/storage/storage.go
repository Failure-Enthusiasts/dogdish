package storage

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/Failure-Enthusiasts/cater-me-up/internal/internal_types"
	"github.com/Failure-Enthusiasts/cater-me-up/internal/storage/postgres"
	"github.com/google/uuid"
)

type DBType string

const (
	// DBTypes
	DBTypePostgres DBType = "postgres"

	// Default connection options
	DefaultMaxOpenConns    = 25
	DefaultMaxIdleConns    = 10
	DefaultConnMaxLifetime = 300 // 5 minutes in seconds

	// Default connection string values
	DefaultDBType   DBType = DBTypePostgres
	DefaultHost     string = "localhost"
	DefaultUser     string = "postgres"
	DefaultPassword string = "password"
	DefaultPort     uint   = 5432
	DefaultDatabase string = "postgres"
)

type Storage struct {
	dbType   DBType
	host     string
	user     string
	password string
	port     uint
	database string
}

func NewStorage() *Storage {
	return &Storage{
		dbType:   DefaultDBType,
		host:     DefaultHost,
		user:     DefaultUser,
		password: DefaultPassword,
		port:     DefaultPort,
		database: DefaultDatabase,
	}
}
func (s *Storage) WithDBType(databaseType DBType) *Storage {
	s.dbType = databaseType
	return s
}

func (s *Storage) WithHost(host string) *Storage {
	s.host = host
	return s
}

func (s *Storage) WithUser(user string) *Storage {
	s.user = user
	return s
}

func (s *Storage) WithPassword(password string) *Storage {
	s.password = password
	return s
}

func (s *Storage) WithPort(port uint) *Storage {
	s.port = port
	return s
}

func (s *Storage) WithDatabase(database string) *Storage {
	s.database = database
	return s
}

func (s *Storage) validateConnectionValues() error {
	if s.host == "" {
		return fmt.Errorf("host cannot be empty")
	}
	if s.user == "" {
		return fmt.Errorf("user cannot be empty")
	}
	if s.database == "" {
		return fmt.Errorf("database cannot be empty")
	}
	if s.port == 0 {
		return fmt.Errorf("port cannot be zero")
	}
	return nil
}

func (s *Storage) GetDBConnection() (*sql.DB, error) {
	err := s.validateConnectionValues()
	if err != nil {
		return nil, err
	}
	connectionString, err := s.createConnectionString()
	if err != nil {
		return nil, err
	}
	dbConnection, err := sql.Open(string(s.dbType), connectionString)
	if err != nil {
		return nil, fmt.Errorf("failed to form a connection with the database: %q", err)
	}

	dbConnection.SetMaxOpenConns(DefaultMaxOpenConns)
	dbConnection.SetMaxIdleConns(DefaultMaxIdleConns)
	dbConnection.SetConnMaxLifetime(time.Duration(DefaultConnMaxLifetime) * time.Second)

	return dbConnection, nil
}

func (s *Storage) createConnectionString() (string, error) {
	switch s.dbType {
	case DBTypePostgres:
		return fmt.Sprintf(
			"postgres://%s:%s@%s:%d/%s?sslmode=disable",
			s.user, s.password, s.host, s.port, s.database,
		), nil
	default:
		return "", fmt.Errorf("unsupported database type: %s", s.dbType)
	}
}

func (s *Storage) GetQueryExecutor(db *sql.DB) (*postgres.Queries, error) {
	switch s.dbType {
	case DBTypePostgres:
		return postgres.New(db), nil
	default:
		return nil, fmt.Errorf("database type %s not supported", s.dbType)
	}
}

func (s *Storage) GetQueryExecutorWithTx(db *sql.DB, tx *sql.Tx) (*postgres.Queries, error) {
	switch s.dbType {
	case DBTypePostgres:
		return postgres.New(db).WithTx(tx), nil
	default:
		return nil, fmt.Errorf("database type %s not supported", s.dbType)
	}
}

func (s *Storage) StoreEvent(ctx context.Context, event internal_types.Event) (uuid.UUID, error) {
	dbConnection, err := s.GetDBConnection()
	if err != nil {
		return uuid.Nil, err
	}
	defer dbConnection.Close()

	dbTx, err := dbConnection.BeginTx(ctx, nil)
	if err != nil {
		return uuid.Nil, err
	}

	queryExecutor, err := s.GetQueryExecutor(dbConnection)
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to create a query executor: %q", err)
	}

	queryExecutorTx, err := s.GetQueryExecutorWithTx(dbConnection, dbTx)
	defer func() {
		if err != nil {
			fmt.Printf("\n\n\nError Found: %q\n\n\nRolling Back\n\n\n", err)
			dbTx.Rollback()
		}
	}()

	storeFood := func(food internal_types.EntreesAndSidesOrSaladBar, eventID, cuisineID uuid.UUID) (uuid.UUID, error) {
		var preference postgres.NullDogdishPreferenceEnum
		var foodID uuid.UUID

		// Handle preference
		switch food.Preference {
		case string(postgres.DogdishPreferenceEnumValue0):
			preference = postgres.NullDogdishPreferenceEnum{Valid: false}
		case string(postgres.DogdishPreferenceEnumVegan):
			preference = postgres.NullDogdishPreferenceEnum{
				DogdishPreferenceEnum: postgres.DogdishPreferenceEnumVegan,
				Valid:                 true,
			}
		case string(postgres.DogdishPreferenceEnumVegetarian):
			preference = postgres.NullDogdishPreferenceEnum{
				DogdishPreferenceEnum: postgres.DogdishPreferenceEnumVegetarian,
				Valid:                 true,
			}
		default:
			preference = postgres.NullDogdishPreferenceEnum{Valid: false}
		}

		// Create food
		foodID, err := queryExecutorTx.InsertFood(ctx, postgres.InsertFoodParams{
			CuisineID:  cuisineID,
			EventID:    eventID,
			Name:       food.Name,
			FoodType:   postgres.DogdishFoodTypeEnumEntreesAndSides,
			Preference: preference,
		})
		if err != nil {
			return uuid.Nil, fmt.Errorf("failed to insert food into database: %q", err)
		}

		// Handle entree and sides allergens
		for _, allergen := range food.Allergens {
			// Check to see is the allergen already exist
			allergenID, err := queryExecutor.GetAllergenByName(ctx, allergen)

			// Allergen doesn't exist, add it to the database
			if err != nil {
				fmt.Printf("New Allergen detected: %q, adding to database\n", allergen)
				allergenID, err = queryExecutor.InsertAllergen(ctx, allergen)
				if err != nil {
					return uuid.Nil, fmt.Errorf("failed to insert allergen: %q", err)
				}
			}

			// Create the food allergen join table
			_, err = queryExecutorTx.InsertFoodAllergen(ctx, postgres.InsertFoodAllergenParams{
				FoodID:     foodID,
				AllergenID: allergenID,
			})
			if err != nil {
				return uuid.Nil, fmt.Errorf("failed to insert food allergen: %q", err.Error())
			}
		}

		return foodID, nil
	}

	// Ignoring error since this was already validated in validateEvent
	isoDate, _ := time.Parse(time.DateOnly, event.ISODate)

	// Create Event
	newEventID, err := queryExecutorTx.InsertEvent(ctx, postgres.InsertEventParams{
		Date:    event.Weekday,
		IsoDate: isoDate,
	})
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to insert event into database: %q", err)
	}

	// Create Cuisine
	newCuisineID, err := queryExecutorTx.InsertCuisine(ctx, event.Cuisine)
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to insert cuisine into database: %q", err)
	}

	// Store Entree
	for _, entree := range event.EntreesAndSides {
		fmt.Printf("inserting entree: %+v\n", entree)
		_, err := storeFood(entree, newEventID, newCuisineID)
		if err != nil {
			return uuid.Nil, fmt.Errorf("failed to insert entree into database: %q", err)
		}
	}

	// Store salad bar toppings
	for _, toppings := range event.SaladBar.Toppings {
		fmt.Printf("inserting topping: %+v\n", toppings)
		_, err := storeFood(toppings, newEventID, newCuisineID)
		if err != nil {
			return uuid.Nil, fmt.Errorf("failed to insert topping into database: %q", err)
		}
	}

	// Store salad bar dressings
	for _, dressings := range event.SaladBar.Dressings {
		fmt.Printf("inserting dressing: %+v\n", dressings)
		_, err := storeFood(dressings, newEventID, newCuisineID)
		if err != nil {
			return uuid.Nil, fmt.Errorf("failed to insert dressing into database: %q", err)
		}
	}

	if err := dbTx.Commit(); err != nil {
		return uuid.Nil, fmt.Errorf("failed to commit transaction: %q", err)
	}

	return newEventID, nil
}
