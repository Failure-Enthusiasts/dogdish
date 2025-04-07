'use client';
import React, { useState } from 'react';
import { useParams } from 'next/navigation';

// Sample menu data from the JSON
const menuData = {
  "caterer": "Olive & Basil",
  "event_date": "Monday, March 17",
  "event_date_iso": "2025-03-17",
  "menu_items":  [
      {
        "title": "Balsamic Chicken",
        "description": "Grilled chicken breast with blistered cherry tomatoes, confit garlic, balsamic glaze",
        "preferences": [],
        "allergens": [
          "Garlic",
          "Nightshades"
        ]
      },
      {
        "title": "Mediterranean Salmon",
        "description": "Salmon with olives, tomatoes, capers, garlic, scallions, red wine vinaigrette",
        "preferences": [
          "PESCATARIAN"
        ],
        "allergens": [
          "Garlic",
          "Nightshades",
          "Onions",
          "Seafood"
        ]
      },
      {
        "title": "Vegan Agri Dolce Eggplant and Mixed Vegetables",
        "description": "Braised eggplant, seasonal vegetables with sugar, red wine vinegar, basil and garlic",
        "preferences": [
          "VEGAN",
          "VEGETARIAN"
        ],
        "allergens": [
          "Garlic",
          "Nightshades",
          "Onions"
        ]
      },
      {
        "title": "Garden Salad",
        "description": "Mixed green salad with cucumbers, tomatoes, carrots and peppers with side of dressing.",
        "preferences": [
          "VEGAN",
          "LIGHT CARB"
        ],
        "allergens": [
          "Nightshades"
        ]
      },
      {
        "title": "Garlic Bread",
        "description": "Garlic bread",
        "preferences": [],
        "allergens": [
          "Dairy",
          "Garlic",
          "Wheat"
        ]
      },
      {
        "title": "Gluten Free Spaghetti Aglio Olio - Vegan/No Cheese",
        "description": "Gluten Free Spaghetti with olive oil - No Cheese",
        "preferences": [
          "VEGAN"
        ],
        "allergens": [
          "Garlic"
        ]
      },
      {
        "title": "Italian Roasted Vegetables",
        "description": "Roasted zucchini, eggplant, peppers with herbs.",
        "preferences": [
          "VEGAN",
          "LIGHT CARB"
        ],
        "allergens": [
          "Garlic",
          "Nightshades"
        ]
      },
      {
        "title": "Linguini Aglio Olio - Vegan/No Cheese",
        "description": "Linguini with olive oil - No Cheese",
        "preferences": [
          "VEGAN"
        ],
        "allergens": [
          "Garlic",
          "Wheat"
        ]
      },
      {
        "title": "Green Goddess Dressing",
        "description": "Served with garden salad.",
        "preferences": [
          "VEGAN"
        ],
        "allergens": []
      }
    ]
  };


  type MenuParams = {
    params: {
      slug: string[]
    }
  }

const MenuRenderer = ({}: MenuParams) => {
    // The params.slug will be an array where:
  // params.slug[0] would be the event date ISO
  // params.slug[1] would be the caterer name
  const params = useParams();
  const [activeFilter, setActiveFilter] = useState('No Preferences');
  const [activeAllergenFilter, setActiveAllergenFilter] = useState('All Allergens');
   // Extract caterer and date from the slug
   const [dateSlug, catererSlug] = params.restaurant as string[];

   // Get unique dietary preferences
   const dietaryPreferences = ['No Preferences', 'Vegan', 'Vegetarian', 'Pescatarian'];
  // Get unique allergens
  // TODO: fetch unique allergens from menu items 
  // const allergens = [...new Set(menuData.menu_items.flatMap(item => item.allergens))];
  const allergens = ['All Allergens', 'Dairy', 'Garlic', 'Nightshades', 'Onions', 'Seafood', 'Wheat'];
  
  // Filter menu items based on active filters
  const filteredItems = menuData.menu_items.filter(item => {
    // Dietary preference filter
    if (activeFilter !== 'No Preferences') {
      const matchesPreference = item.preferences.some(
        pref => pref.toLowerCase() === activeFilter.toLowerCase()
      );
      if (!matchesPreference) return false;
    }
    
    // Allergen filter (only show items WITHOUT the selected allergen)
    if (activeAllergenFilter !== 'All Allergens') {
      return !item.allergens.includes(activeAllergenFilter);
    }
    
    return true;
  });
  
  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{catererSlug}</h1>
          <div className="flex items-center justify-center text-gray-600">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{dateSlug}</span>
          </div>
        </div>
        
        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {dietaryPreferences.map(pref => (
              <button
                key={pref}
                onClick={() => setActiveFilter(pref)}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  activeFilter === pref 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-white text-gray-800 border border-gray-300'
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {allergens.map(allergen => (
              <button
                key={allergen}
                onClick={() => setActiveAllergenFilter(allergen)}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  activeAllergenFilter === allergen 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-white text-gray-800 border border-gray-300'
                }`}
              >
                {allergen}
              </button>
            ))}
          </div>
        </div>
        
        {/* Menu Items */}
        <div className="space-y-6">
          {filteredItems.map((item, index) => (
            <div key={index} className="bg-white border rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl text-gray-900 font-bold mb-2">{item.title}</h2>
              <p className="text-gray-600 mb-4">{item.description}</p>
              
              {/* Dietary Preferences */}
              {item.preferences.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {item.preferences.map((pref) => (
                    <span 
                      key={pref}
                      className={`inline-block px-3 py-1 rounded-full text-sm ${
                        pref === 'VEGAN' ? 'bg-green-100 text-green-800' : 
                        pref === 'VEGETARIAN' ? 'bg-green-100 text-green-800' :
                        pref === 'PESCATARIAN' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {pref.charAt(0) + pref.slice(1).toLowerCase()}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Allergens */}
              {item.allergens.length > 0 && (
                <div className="flex items-center text-gray-500">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Contains: {item.allergens.join(', ')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuRenderer;