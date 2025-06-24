-- +goose Up
-- +goose ENVSUB ON
CREATE TYPE preference_enum AS ENUM ('vegan', 'vegetarian');
CREATE TYPE food_type_enum AS ENUM ('entrees_and_sides', 'salad_bar');

ALTER TYPE preference_enum OWNER TO $DATABASE_USER;
ALTER TYPE food_type_enum OWNER TO $DATABASE_USER;
-- +goose ENVSUB OFF

-- +goose Down
DROP TYPE preference_enum;
DROP TYPE food_type_enum;