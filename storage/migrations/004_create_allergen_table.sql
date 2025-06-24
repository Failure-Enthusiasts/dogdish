-- +goose Up
-- +goose ENVSUB ON
CREATE TABLE allergen (
  id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL
);

ALTER TABLE allergen OWNER TO $DATABASE_USER;
-- +goose ENVSUB OFF

-- +goose Down
DROP TABLE allergen;