-- Inserts

-- name: InsertCuisine :one
INSERT INTO dogdish.cuisine (name) VALUES ($1) RETURNING id;

-- name: InsertEvent :one
INSERT INTO dogdish.event (date, iso_date) VALUES ($1, $2) RETURNING id;

-- name: InsertAllergen :one
INSERT INTO dogdish.allergen (name) VALUES ($1) RETURNING id;

-- name: InsertFood :one
INSERT INTO dogdish.food (cuisine_id, event_id, name, food_type, preference) VALUES ($1, $2, $3, $4, $5) RETURNING id;

-- name: InsertFoodAllergen :one
INSERT INTO dogdish.food_allergen (food_id, allergen_id) VALUES ($1, $2) RETURNING (food_id, allergen_id);

-- name: GetFutureEvents :many
SELECT id, date, iso_date FROM dogdish.event WHERE iso_date > CURRENT_DATE LIMIT $1;

-- name: GetCurrentEvent :one
SELECT id, date, iso_date FROM dogdish.event WHERE iso_date = CURRENT_DATE LIMIT 1;

-- name: GetPreviousEvent :one
SELECT id, date, iso_date FROM dogdish.event WHERE iso_date < CURRENT_DATE LIMIT 1;

-- name: GetFoodsByEventId :many
SELECT 
    f.name, 
    f.food_type, 
    f.preference, 
    f.cuisine_id,
    STRING_AGG(a.name, ',') as allergen_names
FROM dogdish.food f 
JOIN dogdish.food_allergen fa ON f.id = fa.food_id 
JOIN dogdish.allergen a ON fa.allergen_id = a.id 
WHERE event_id = $1
GROUP BY f.name, f.food_type, f.preference, f.cuisine_id;


-- name: GetCuisineById :one
SELECT id, name FROM dogdish.cuisine WHERE id = $1;

-- Selects

-- name: GetAllergenByName :one
SELECT id FROM dogdish.allergen WHERE name=$1 LIMIT 1;

--

-- name: GetAllCuisines :many
SELECT * FROM dogdish.cuisine;

-- name: GetAllEvents :many
SELECT * FROM dogdish.event;

-- name: GetAllAllergens :many
SELECT * FROM dogdish.allergen;

-- name: GetAllFoods :many
SELECT * FROM dogdish.food;

-- name: GetAllFoodAllergens :many
SELECT * FROM dogdish.food_allergen;

-- name: GetAllFoodsByEventId :many
SELECT * FROM dogdish.food WHERE event_id = $1;

-- name: GetAllFoodsByCuisineId :many
SELECT * FROM dogdish.food WHERE cuisine_id = $1;

