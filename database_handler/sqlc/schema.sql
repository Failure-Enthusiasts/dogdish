CREATE SCHEMA IF NOT EXISTS dogdish;

CREATE TYPE dogdish.preference_enum AS ENUM ('', 'vegan', 'vegetarian');
CREATE TYPE dogdish.food_type_enum AS ENUM ('entrees_and_sides', 'toppings', 'dressings');

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
  cuisine_id UUID NOT NULL, 
  event_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  food_type dogdish.food_type_enum NOT NULL,
  preference dogdish.preference_enum NULL,

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
  food_id UUID NOT NULL, 
  allergen_id UUID NOT NULL,

  CONSTRAINT fk_food_id
    FOREIGN KEY (food_id)
    REFERENCES dogdish.food(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_allergen_id
    FOREIGN KEY (allergen_id)
    REFERENCES dogdish.allergen(id)
    ON DELETE CASCADE
);
