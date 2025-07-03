-- +goose Up
CREATE SCHEMA IF NOT EXISTS dogdish;

-- Adding User and User Permissions
-- +goose ENVSUB ON
CREATE USER $DATABASE_USER WITH PASSWORD '$DATABASE_PASSWORD';

GRANT USAGE ON SCHEMA dogdish TO $DATABASE_USER;
ALTER USER $DATABASE_USER SET search_path TO dogdish, public;

ALTER DEFAULT PRIVILEGES IN SCHEMA dogdish GRANT ALL ON TABLES TO $DATABASE_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA dogdish GRANT ALL ON SEQUENCES TO $DATABASE_USER;
-- +goose ENVSUB OFF

-- Adding Types and Tables
CREATE TYPE dogdish.preference_enum AS ENUM ('vegan', 'vegetarian');
CREATE TYPE dogdish.food_type_enum AS ENUM ('entrees_and_sides', 'salad_bar');

CREATE TABLE dogdish.cuisine (
  id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL
);
CREATE TABLE dogdish.event (
  id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  date VARCHAR(255) NOT NULL,
  iso_date DATE NOT NULL
);
CREATE TABLE dogdish.allergen (
  id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL
);
CREATE TABLE dogdish.food (
  id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  cuisine_id UUID, 
  event_id UUID,
  name VARCHAR(255) NOT NULL,

  CONSTRAINT fk_cuisine_id
    FOREIGN KEY (cuisine_id)
    REFERENCES dogdish.cuisine(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_event_id
    FOREIGN KEY (event_id)
    REFERENCES dogdish.event(id)
    ON DELETE CASCADE
);
CREATE TABLE dogdish.food_allergen (
  food_id UUID, 
  allergen_id UUID,

  CONSTRAINT fk_food_id
    FOREIGN KEY (food_id)
    REFERENCES dogdish.food(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_allergen_id
    FOREIGN KEY (allergen_id)
    REFERENCES dogdish.allergen(id)
    ON DELETE CASCADE
);

-- +goose Down
-- +goose ENVSUB ON
-- Remove User and Permissions
REVOKE ALL ON ALL TABLES IN SCHEMA dogdish FROM $DATABASE_USER;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA dogdish FROM $DATABASE_USER;
REVOKE USAGE ON SCHEMA dogdish FROM $DATABASE_USER;

ALTER DEFAULT PRIVILEGES IN SCHEMA dogdish REVOKE ALL ON TABLES FROM $DATABASE_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA dogdish REVOKE ALL ON SEQUENCES FROM $DATABASE_USER;

ALTER USER $DATABASE_USER SET search_path TO public;

DROP TABLE IF EXISTS dogdish.food_allergen;
DROP TABLE IF EXISTS dogdish.food;
DROP TABLE IF EXISTS dogdish.allergen;
DROP TABLE IF EXISTS dogdish.event;
DROP TABLE IF EXISTS dogdish.cuisine;

-- Drop types
DROP TYPE IF EXISTS dogdish.preference_enum;
DROP TYPE IF EXISTS dogdish.food_type_enum;

-- Now drop the user (after all objects are gone)
DROP USER IF EXISTS $DATABASE_USER;

-- +goose ENVSUB OFF

-- Finally drop the schema
DROP SCHEMA IF EXISTS dogdish;