-- +goose Up
-- +goose ENVSUB ON
CREATE TABLE event (
  id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  date VARCHAR(255) NOT NULL,
  iso_date DATE NOT NULL
);

ALTER TABLE event OWNER TO $DATABASE_USER;
-- +goose ENVSUB OFF

-- +goose Down
DROP TABLE event;