#!/bin/bash

set -e

# Creates the applications database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE USER $DATABASE_USER WITH PASSWORD '$DATABASE_PASSWORD';
	CREATE DATABASE $DATABASE_NAME;
	GRANT ALL PRIVILEGES ON DATABASE $DATABASE_NAME TO $DATABASE_USER;
EOSQL

# creating tables and grants
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$DATABASE_NAME" <<-EOSQL
  CREATE TABLE cuisine (
    id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL
  );

  CREATE TABLE event (
    id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    date VARCHAR(255) NOT NULL,
    iso_date DATE NOT NULL
  );

  CREATE TABLE allergen (
    id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL
  );

  CREATE TYPE preference_enum AS ENUM ('vegan', 'vegetarian');

  CREATE TYPE food_type_enum AS ENUM ('entrees_and_sides', 'salad_bar');

  CREATE TABLE food_allergen (
    food_id UUID, 
    allergen_id UUID,

    CONSTRAINT fk_food_id
      FOREIGN KEY (food_id)
      REFERENCES food(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_allergen_id
      FOREIGN KEY (allergen_id)
      REFERENCES allergen(id)
      ON DELETE CASCADE
  );


  CREATE TABLE food (
    id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    cuisine_id UUID, 
    event_id UUID,
    name VARCHAR(255) NOT NULL,

    CONSTRAINT fk_cuisine_id
      FOREIGN KEY (caterer_id)
      REFERENCES caterer(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_event_id
      FOREIGN KEY (event_id)
      REFERENCES event(id)
      ON DELETE CASCADE
  );


  GRANT ALL ON SCHEMA public TO $DATABASE_USER;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO $DATABASE_USER;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $DATABASE_USER;
EOSQL
