package internal_types

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
