'use client';
import React, { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { type Menu } from '@/utils/menuHelpers';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import ErrorBoundary from '@/components/ErrorBoundary';
import Link from 'next/link';


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

// Helper function to convert a string to slug format
const toSlug = (str: string) => {
  console.log('Converting slug:', str);
  // First, deal with the spaces and special characters then deal with regular characters.
  const slug = str.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and').replace(/[^a-z0-9-]/g, '');
  console.log('Resulting slug:', slug);
  return slug;
};
// Helper function to validate if a menu exists
const isValidMenu = (dateSlug: string, cuisineSlug: string, availableMenus: Menu[]) => {
  console.log('Validating menu with:', { dateSlug, cuisineSlug });
  console.log('Available menus:', availableMenus);
  
  const isValid = availableMenus.some(menu => {
    const menuSlug = toSlug(menu.cuisine);
    console.log('Comparing:', {
      dates: { provided: dateSlug, available: menu.event_date_iso },
      slugs: { provided: cuisineSlug, converted: menuSlug }
    });
    return menu.event_date_iso === dateSlug && menuSlug === cuisineSlug;
  });
  
  console.log('Menu is valid:', isValid);
  return isValid;
};

const MenuRendererContent = () => {
  const params = useParams();
  const [activeFilter, setActiveFilter] = useState('No Preferences');
  const [activeAllergenFilter, setActiveAllergenFilter] = useState('All Allergens');
  const [menuData, setMenuData] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const { error, isError, clearError, handleError } = useErrorHandler();

  // Extract date and cuisine from the slug 
  const [dateSlug, cuisineSlug] = params.cuisine as string[];

  const loadMenuData = () => {
    try {
      console.log('Loading menu data for:', { dateSlug, cuisineSlug });
      setLoading(true);
      
      // In a real app, you'd fetch this from an API
      // For now, we'll use the static data with proper error handling
      const availableMenus = [
        {
          "cuisine": "Olive & Basil",
          "event_date": "Monday, March 17",
          "event_date_iso": "2025-03-17",
          "menu_items": [
            {
              "title": "Balsamic Chicken",
              "description": "Grilled chicken breast with blistered cherry tomatoes, confit garlic, balsamic glaze",
              "preferences": [],
              "allergens": ["Garlic", "Nightshades"]
            },
            {
              "title": "Mediterranean Salmon",
              "description": "Salmon with olives, tomatoes, capers, garlic, scallions, red wine vinaigrette",
              "preferences": ["PESCATARIAN"],
              "allergens": ["Garlic", "Nightshades", "Onions", "Seafood"]
            },
            {
              "title": "Vegan Agri Dolce Eggplant and Mixed Vegetables",
              "description": "Braised eggplant, seasonal vegetables with sugar, red wine vinegar, basil and garlic",
              "preferences": ["VEGAN", "VEGETARIAN"],
              "allergens": ["Garlic", "Nightshades", "Onions"]
            },
            {
              "title": "Garden Salad",
              "description": "Mixed green salad with cucumbers, tomatoes, carrots and peppers with side of dressing.",
              "preferences": ["VEGAN", "LIGHT CARB"],
              "allergens": ["Nightshades"]
            },
            {
              "title": "Garlic Bread",
              "description": "Garlic bread",
              "preferences": [],
              "allergens": ["Dairy", "Garlic", "Wheat"]
            },
            {
              "title": "Gluten Free Spaghetti Aglio Olio - Vegan/No Cheese",
              "description": "Gluten Free Spaghetti with olive oil - No Cheese",
              "preferences": ["VEGAN"],
              "allergens": ["Garlic"]
            },
            {
              "title": "Italian Roasted Vegetables",
              "description": "Roasted zucchini, eggplant, peppers with herbs.",
              "preferences": ["VEGAN", "LIGHT CARB"],
              "allergens": ["Garlic", "Nightshades"]
            },
            {
              "title": "Linguini Aglio Olio - Vegan/No Cheese",
              "description": "Linguini with olive oil - No Cheese",
              "preferences": ["VEGAN"],
              "allergens": ["Garlic", "Wheat"]
            },
            {
              "title": "Green Goddess Dressing",
              "description": "Served with garden salad.",
              "preferences": ["VEGAN"],
              "allergens": []
            }
          ]
        }
      ];

      // Validate parameters
      if (!dateSlug || !cuisineSlug) {
        handleError('Invalid menu parameters. Date and cuisine are required.');
        return;
      }

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

      if (!menu) {
        console.log('Menu data not found after validation');
        notFound();
        return;
      }

      console.log('Successfully loaded menu:', menu.cuisine);
      setMenuData(menu);
      setLoading(false);
      
    } catch (error) {
      console.error('Error loading menu data:', error);
      handleError(error, 'Loading menu data');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuData();
  }, [dateSlug, cuisineSlug]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading menu..." />;
  }

  if (isError && error) {
    return (
      <ErrorDisplay
        error={error}
        variant="fullscreen"
        onRetry={() => {
          clearError();
          loadMenuData();
        }}
        onDismiss={() => window.location.href = '/'}
        showDetails={process.env.NODE_ENV === 'development'}
      />
    );
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
        
           {/* Back to Home Link */}
           <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
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

// Wrap with error boundary for comprehensive error handling
const MenuRenderer = () => {
  return (
    <ErrorBoundary>
      <MenuRendererContent />
    </ErrorBoundary>
  );
};

export default MenuRenderer;