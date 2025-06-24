-- +goose Up
-- +goose ENVSUB ON
CREATE TABLE food (
  id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  cuisine_id UUID, 
  event_id UUID,
  name VARCHAR(255) NOT NULL,

  CONSTRAINT fk_cuisine_id
    FOREIGN KEY (cuisine_id)
    REFERENCES cuisine(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_event_id
    FOREIGN KEY (event_id)
    REFERENCES event(id)
    ON DELETE CASCADE
);

ALTER TABLE food OWNER TO $DATABASE_USER;
-- +goose ENVSUB OFF

-- +goose Down
DROP TABLE food;