#!/bin/bash

echo "Testing POST /events endpoint with comprehensive data..."

curl -X POST http://localhost:1323/events \
  -H "Content-Type: application/json" \
  -d '{
    "weekday": "Monday",
    "iso_date": "2024-06-01",
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

echo -e "\nTest completed!"