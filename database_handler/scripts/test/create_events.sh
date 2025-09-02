#!/bin/bash

echo "Testing POST /events endpoint with comprehensive data..."

curl -X POST http://localhost:1313/event \
  -H "Content-Type: application/json" \
  -d '{
    "weekday": "Friday",
    "iso_date": "2025-08-29",
    "cuisine": "Italian",
    "entrees_and_sides": [
      {
        "name": "Spaghetti Carbonara",
        "allergens": ["gluten", "dairy", "eggs"],
        "preference": "vegetarian"
      },
      {
        "name": "Margherita Pizza",
        "allergens": ["gluten", "dairy"],
        "preference": "vegetarian"
      },
      {
        "name": "Chicken Marsala",
        "allergens": ["gluten", "dairy"],
        "preference": ""
      },
      {
        "name": "Bruschetta",
        "allergens": [],
        "preference": "vegan"
      },
      {
        "name": "Tiramisu",
        "allergens": ["gluten", "dairy", "eggs"],
        "preference": "vegetarian"
      }
    ],
    "salad_bar": {
      "toppings": [
        {
          "name": "Croutons",
          "allergens": ["gluten"],
          "preference": "vegetarian"
        },
        {
          "name": "Bacon Bits",
          "allergens": ["pork"],
          "preference": ""
        },
        {
          "name": "Sunflower Seeds",
          "allergens": ["nuts"],
          "preference": "vegan"
        },
        {
          "name": "Cheese Shreds",
          "allergens": ["dairy"],
          "preference": "vegetarian"
        }
      ],
      "dressings": [
        {
          "name": "Caesar Dressing",
          "allergens": ["dairy", "eggs"],
          "preference": "vegetarian"
        },
        {
          "name": "Balsamic Vinaigrette",
          "allergens": [],
          "preference": "vegan"
        },
        {
          "name": "Ranch Dressing",
          "allergens": ["dairy"],
          "preference": "vegetarian"
        }
      ]
    }
  }' | jq '.'

curl -X POST http://localhost:1313/event \
  -H "Content-Type: application/json" \
  -d '{
    "weekday": "Wednesday",
    "iso_date": "2025-09-03",
    "cuisine": "Italian",
    "entrees_and_sides": [
      {
        "name": "Margherita Pizza",
        "allergens": ["gluten", "dairy"],
        "preference": "vegetarian"
      },
      {
        "name": "Chicken Marsala",
        "allergens": ["gluten", "dairy"],
        "preference": ""
      },
      {
        "name": "Bruschetta",
        "allergens": [],
        "preference": "vegan"
      },
      {
        "name": "Tiramisu",
        "allergens": ["gluten", "dairy", "eggs"],
        "preference": "vegetarian"
      }
    ],
    "salad_bar": {
      "toppings": [
        {
          "name": "Croutons",
          "allergens": ["gluten"],
          "preference": "vegetarian"
        },
        {
          "name": "Bacon Bits",
          "allergens": ["pork"],
          "preference": ""
        },
        {
          "name": "Sunflower Seeds",
          "allergens": ["nuts"],
          "preference": "vegan"
        },
        {
          "name": "Cheese Shreds",
          "allergens": ["dairy"],
          "preference": "vegetarian"
        }
      ],
      "dressings": [
        {
          "name": "Caesar Dressing",
          "allergens": ["dairy", "eggs"],
          "preference": "vegetarian"
        },
        {
          "name": "Balsamic Vinaigrette",
          "allergens": [],
          "preference": "vegan"
        },
        {
          "name": "Ranch Dressing",
          "allergens": ["dairy"],
          "preference": "vegetarian"
        }
      ]
    }
  }' | jq '.'

curl -X POST http://localhost:1313/event \
  -H "Content-Type: application/json" \
  -d '{
    "weekday": "Friday",
    "iso_date": "2025-09-05",
    "cuisine": "Italian",
    "entrees_and_sides": [
      {
        "name": "Margherita Pizza",
        "allergens": ["gluten", "dairy"],
        "preference": "vegetarian"
      },
      {
        "name": "Chicken Marsala",
        "allergens": ["gluten", "dairy"],
        "preference": ""
      },
      {
        "name": "Bruschetta",
        "allergens": [],
        "preference": "vegan"
      },
      {
        "name": "Tiramisu",
        "allergens": ["gluten", "dairy", "eggs"],
        "preference": "vegetarian"
      }
    ],
    "salad_bar": {
      "toppings": [
        {
          "name": "Croutons",
          "allergens": ["gluten"],
          "preference": "vegetarian"
        },
        {
          "name": "Bacon Bits",
          "allergens": ["pork"],
          "preference": ""
        },
        {
          "name": "Sunflower Seeds",
          "allergens": ["nuts"],
          "preference": "vegan"
        },
        {
          "name": "Cheese Shreds",
          "allergens": ["dairy"],
          "preference": "vegetarian"
        }
      ],
      "dressings": [
        {
          "name": "Caesar Dressing",
          "allergens": ["dairy", "eggs"],
          "preference": "vegetarian"
        },
        {
          "name": "Balsamic Vinaigrette",
          "allergens": [],
          "preference": "vegan"
        },
        {
          "name": "Ranch Dressing",
          "allergens": ["dairy"],
          "preference": "vegetarian"
        }
      ]
    }
  }' | jq '.'

echo -e "\nTest completed!"


# select f.name as food_name, a.name as allergen_name, f.preference as preference FROM food f left join food_allergen fa on f.id = fa.food_id left join allergen a on fa.allergen_id = a.id;

# delete from event;
