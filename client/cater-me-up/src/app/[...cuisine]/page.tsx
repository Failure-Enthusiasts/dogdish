'use client';
import React, { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { type Menu } from '@/utils/menuHelpers';


// Sample menu data from the JSON
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sampleMenuData: Menu = {
  cuisine: "Olive & Basil", 
  event_date: "Monday, March 17",
  event_date_iso: "2025-03-17",
  menu_items: [
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



// Let's create a type for our menu data
// type MenuData = {
//   cuisine: string; 
//   event_date: string;
//   event_date_iso: string;
//   menu_items: Array<{
//     title: string;
//     description: string;
//     preferences: string[];
//     allergens: string[];
//   }>;
// };

// Helper function to convert a string to slug format with proper sanitization
const toSlug = (str: string) => {
  console.log('Converting slug:', str);
  
  // Input validation and sanitization
  if (typeof str !== 'string' || str.length === 0) {
    throw new Error('Invalid input for slug conversion');
  }
  
  // Limit input length to prevent DoS
  if (str.length > 200) {
    throw new Error('Input too long for slug conversion');
  }
  
  // First, sanitize by removing potentially dangerous characters
  const sanitized = str
    .trim()
    .replace(/[<>"/\\]/g, '') // Remove dangerous characters
    .toLowerCase();
  
  // Convert to slug format
  const slug = sanitized
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/&/g, 'and')           // Replace & with 'and'
    .replace(/[^a-z0-9-]/g, '')     // Remove non-alphanumeric characters except hyphens
    .replace(/-+/g, '-')            // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens
  
  console.log('Resulting slug:', slug);
  
  // Final validation
  if (slug.length === 0 || slug.length > 100) {
    throw new Error('Invalid slug generated');
  }
  
  return slug;
};

// Helper function to validate URL parameters
const validateUrlParams = (params: string[]): { dateSlug: string; cuisineSlug: string } => {
  // Validate params array
  if (!Array.isArray(params) || params.length !== 2) {
    throw new Error('Invalid URL parameters');
  }
  
  const [dateSlug, cuisineSlug] = params;
  
  // Validate date slug format (YYYY-MM-DD)
  if (typeof dateSlug !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateSlug)) {
    throw new Error('Invalid date format');
  }
  
  // Validate that date is actually a valid date
  const parsedDate = new Date(dateSlug);
  if (isNaN(parsedDate.getTime())) {
    throw new Error('Invalid date value');
  }
  
  // Don't allow dates too far in the past or future
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  if (parsedDate < oneYearAgo || parsedDate > oneYearFromNow) {
    throw new Error('Date out of valid range');
  }
  
  // Validate cuisine slug format
  if (typeof cuisineSlug !== 'string' || !/^[a-z0-9-]+$/.test(cuisineSlug)) {
    throw new Error('Invalid cuisine slug format');
  }
  
  // Limit slug length
  if (cuisineSlug.length < 1 || cuisineSlug.length > 100) {
    throw new Error('Cuisine slug length invalid');
  }
  
  // Prevent certain suspicious patterns
  const suspiciousPatterns = [
    /\.\./, // Directory traversal
    /[<>]/, // HTML/XML tags
    /javascript:/i, // JavaScript protocol
    /data:/i, // Data protocol
    /vbscript:/i, // VBScript protocol
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(dateSlug) || pattern.test(cuisineSlug)) {
      throw new Error('Suspicious characters detected');
    }
  }
  
  return { dateSlug, cuisineSlug };
};

// Helper function to validate if a menu exists
const isValidMenu = (dateSlug: string, cuisineSlug: string, availableMenus: Menu[]) => {
  console.log('Validating menu with:', { dateSlug, cuisineSlug });
  console.log('Available menus:', availableMenus);
  
  try {
    const isValid = availableMenus.some(menu => {
      try {
        const menuSlug = toSlug(menu.cuisine);
        console.log('Comparing:', {
          dates: { provided: dateSlug, available: menu.event_date_iso },
          slugs: { provided: cuisineSlug, converted: menuSlug }
        });
        return menu.event_date_iso === dateSlug && menuSlug === cuisineSlug;
      } catch (error) {
        console.error('Error processing menu:', menu, error);
        return false;
      }
    });
    
    console.log('Menu is valid:', isValid);
    return isValid;
  } catch (error) {
    console.error('Error validating menu:', error);
    return false;
  }
};

const MenuRenderer = () => {
  const params = useParams();
  const [activeFilter, setActiveFilter] = useState('No Preferences');
  const [activeAllergenFilter, setActiveAllergenFilter] = useState('All Allergens');
  const [menuData, setMenuData] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        // Extract and validate URL parameters with comprehensive security checks
        const cuisine = params.cuisine as string[];
        
        if (!cuisine || !Array.isArray(cuisine)) {
          throw new Error('Invalid URL structure');
        }
        
        const { dateSlug, cuisineSlug } = validateUrlParams(cuisine);
        
        console.log('Validated URL parameters:', { dateSlug, cuisineSlug });

        // In a real app, you'd fetch this from an API
        // For now, we'll use the static data
        const availableMenus = [
          {
          "cuisine": "Olive & Basil",
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
          }
        ];

        console.log('Checking menu validity for:', { dateSlug, cuisineSlug });
        
        // Check if the requested menu exists
        if (!isValidMenu(dateSlug, cuisineSlug, availableMenus)) {
          console.log('Menu not found, redirecting to 404');
          notFound();
          return;
        }

        // Find the matching menu
        const menu = availableMenus.find(m => 
          m.event_date_iso === dateSlug && toSlug(m.cuisine) === cuisineSlug
        );

        console.log('Found menu:', menu);
        setMenuData(menu || null);
      } catch (error) {
        console.error('Error fetching menu:', error);
        
        // Handle validation errors gracefully
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unexpected error occurred');
        }
        
        // For security/validation errors, redirect to 404
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, [params.cuisine]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!menuData) {
    notFound();
    return null;
  }

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
          <h1 className="text-4xl font-bold mb-2">{menuData.cuisine}</h1>
          <div className="flex items-center justify-center text-gray-600">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{menuData.event_date}</span>
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