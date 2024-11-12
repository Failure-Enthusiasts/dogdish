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
  CREATE TABLE caterer (
    id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL
  );

  CREATE TABLE event (
    id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL
  );

  CREATE TABLE allergen (
    id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL
  );

  CREATE TABLE preference (
    id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(255) NOT NULL
  );

  CREATE TABLE food (
    id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    caterer_id UUID, 
    event_id UUID,
    name VARCHAR(255) NOT NULL,
    decription VARCHAR(255),

    CONSTRAINT fk_caterer_id
      FOREIGN KEY (caterer_id)
      REFERENCES caterer(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_event_id
      FOREIGN KEY (event_id)
      REFERENCES event(id)
      ON DELETE CASCADE
  );

  CREATE TABLE food_preference (
    food_id UUID, 
    preference_id UUID,
    CONSTRAINT fk_food_id
      FOREIGN KEY (food_id)
      REFERENCES food(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_preference_id
      FOREIGN KEY (preference_id)
      REFERENCES event(id)
      ON DELETE CASCADE
  );

  GRANT ALL ON SCHEMA public TO $DATABASE_USER;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO $DATABASE_USER;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $DATABASE_USER;
EOSQL
