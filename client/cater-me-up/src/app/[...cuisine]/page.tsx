'use client';
import React, { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { type Menu } from '@/utils/menuHelpers';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import ErrorBoundary from '@/components/ErrorBoundary';
import Link from 'next/link';
import menuJson from '../utils/menuData.json';

// Define types for the imported JSON structure
interface RawMenuItem {
  name: string;
  allergens: string[];
  preferences: string[];
}
interface RawEvent {
  weekday: string;
  iso_date: string;
  cuisine: string;
  entrees_and_sides: RawMenuItem[];
  salad_bar: {
    toppings: RawMenuItem[];
    dressings: RawMenuItem[];
  };
}
interface RawMenuJson {
  events: RawEvent[];
}

// Helper function to transform the imported JSON to Menu[]
const transformMenuData = (jsonData: RawMenuJson): Menu[] => {
  if (!jsonData || !Array.isArray(jsonData.events)) return [];
  return jsonData.events.map((event) => {
    // Flatten entrees_and_sides, salad_bar.toppings, and salad_bar.dressings into menu_items
    const menu_items = [
      ...(event.entrees_and_sides || []).map((item) => ({
        title: item.name,
        description: '', // No description in source
        preferences: item.preferences || [],
        allergens: item.allergens || [],
      })),
      ...((event.salad_bar?.toppings || []).map((item) => ({
        title: item.name,
        description: 'Salad Bar Topping',
        preferences: item.preferences || [],
        allergens: item.allergens || [],
      })) || []),
      ...((event.salad_bar?.dressings || []).map((item) => ({
        title: item.name,
        description: 'Salad Bar Dressing',
        preferences: item.preferences || [],
        allergens: item.allergens || [],
      })) || []),
    ];
    return {
      cuisine: event.cuisine,
      event_date: event.weekday.charAt(0).toUpperCase() + event.weekday.slice(1),
      event_date_iso: event.iso_date,
      menu_items,
    };
  });
};

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

// Add a date formatting function like in prev-events and home page
function formatEventDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

const MenuRendererContent = () => {
  const params = useParams();
  const [activeFilter, setActiveFilter] = useState('No Preferences');
  const [activeAllergenFilter, setActiveAllergenFilter] = useState('Show All Allergens');
  const [menuData, setMenuData] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const { error, isError, clearError, handleError } = useErrorHandler();

  // Extract date and cuisine from the slug 
  const [dateSlug, cuisineSlug] = params.cuisine as string[];

  const loadMenuData = () => {
    try {
      console.log('Loading menu data for:', { dateSlug, cuisineSlug });
      setLoading(true);
      // Use the transformed menu data
      const availableMenus = transformMenuData(menuJson);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // Get unique allergens from menu items
  const allergens = [
    'Show All Allergens',
    ...Array.from(new Set(menuData.menu_items.flatMap(item => item.allergens.map(a => a.charAt(0).toUpperCase() + a.slice(1).toLowerCase())))).sort()
  ];
  
  // Filter menu items based on active filters
  const filteredItems = menuData.menu_items.filter(item => {
    // Dietary preference filter
    if (activeFilter !== 'No Preferences') {
      const prefs = item.preferences.map(p => p.toUpperCase());
      if (activeFilter === 'Pescatarian') {
        const isPescatarian =
          prefs.includes('PESCATARIAN') ||
          prefs.includes('VEGETARIAN') ||
          prefs.includes('VEGAN') ||
          item.allergens.some(a => a.toLowerCase() === 'seafood' || a.toLowerCase() === 'fish');
        if (!isPescatarian) return false;
      } else if (activeFilter === 'Vegetarian') {
        const isVegetarian = prefs.includes('VEGETARIAN') || prefs.includes('VEGAN');
        if (!isVegetarian) return false;
      } else if (activeFilter === 'Vegan') {
        const isVegan = prefs.includes('VEGAN');
        if (!isVegan) return false;
      }
    }
    // Allergen filter (only show items WITHOUT the selected allergen)
    if (activeAllergenFilter !== 'Show All Allergens') {
      return !item.allergens.map(a => a.toLowerCase()).includes(activeAllergenFilter.toLowerCase());
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
            <span>{formatEventDate(menuData.event_date_iso)}</span>
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