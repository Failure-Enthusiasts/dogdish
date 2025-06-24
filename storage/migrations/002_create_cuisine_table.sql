-- +goose Up
-- +goose ENVSUB ON
CREATE TABLE cuisine (
  id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL
);

ALTER TABLE cuisine OWNER TO $DATABASE_USER;
-- +goose ENVSUB OFF

-- +goose Down
DROP TABLE cuisine;