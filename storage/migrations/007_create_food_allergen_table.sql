-- +goose Up
-- +goose ENVSUB ON
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

ALTER TABLE food_allergen OWNER TO $DATABASE_USER;
-- +goose ENVSUB OFF

-- +goose Down
DROP TABLE food_allergen;