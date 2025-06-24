'use client';
import { useState, useEffect } from 'react';
import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { handleApiResponse, retryAsync } from '@/utils/errorUtils';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import ErrorBoundary from '@/components/ErrorBoundary';
// import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";


datadogRum.init({
    applicationId: '1819a01a-b7b4-471f-bdca-1e35d3f2bd43',
    clientToken: 'pub96ac2515546ca98f9fab346453907a4a',
    site: 'datadoghq.com',
    service:'cater_me_up',
    env: 'dev',
    version: '0.0.1',
    sessionSampleRate:  100,
    sessionReplaySampleRate: 100,
    defaultPrivacyLevel: 'mask-user-input',
    plugins: [reactPlugin({ router: true })],
    trackResources: true,
    trackLongTasks: true,
    trackUserInteractions: true,
});


// If you have a fixed set of menus, you can define them here
interface Menu {
  cuisineSlug: string;
  dateSlug: string;
  cuisineName: string; // For display purposes
  eventDate: string;   // For display purposes
}

// In the future, we'll fetch the data from the API
const availableMenus: Menu[] = [
    { "events": 
      [ { "weekday": "monday",
         "iso_date": "2025-05-12", 
         "cuisine": "moroccan", 
         
         "entrees_and_sides": 
          [ 
            { "name": "Shabazi Spiced Chicken Souvlaki served with tzatziki sauce", "allergens": [ "dairy" ], "preferences": [] }, 
            { "name": "Moroccan Harissa & Preserved Lemon Lamb Stew served with Harissa Yogurt", "allergens": [ "dairy" ], "preferences": [] }, 
            { "name": "Toasted Farroto, Asparagus, Tomato, Cucumber, Feta Cheese", "allergens": [ "gluten", "dairy" ], "preferences": [ "vegetarian" ] }, 
            { "name": "Ras al Hanout Sauteed Spring Green Beans", "allergens": [], "preferences": [ "vegan" ] }, 
            { "name": "Kale Wild Rice with Lemon Agave Dressing", "allergens": [], "preferences": [ "vegan" ] }, 
            { "name": "Mezze Salad with Seared Halloumi, Eggplant, Zucchini, Mint Yogurt Dressing", "allergens": [ "dairy" ], "preferences": [ "vegetarian" ] } ], 
        "salad_bar": { 
          "toppings": 
            [ 
              { "name": "Baby Kale", "allergens": [], "preferences": [] }, 
              { "name": "Za'atar Spiced Chickpeas", "allergens": [], "preferences": [] }, 
              { "name": "Cherry Tomatoes", "allergens": [], "preferences": [] }, 
              { "name": "Sliced Hot House Cucumbers", "allergens": [], "preferences": [] }, 
              { "name": "Shaved Cello Carrot Coins", "allergens": [], "preferences": [] }, 
              { "name": "Turmeric Cauliflower", "allergens": [], "preferences": [] }, 
              { "name": "Tabbouleh", "allergens": [], "preferences": [] }, 
              { "name": "Goat Cheese", "allergens": [ "dairy" ], "preferences": [] } ], 
              
          "dressings": 
            [ 
              { "name": "Caesar Dressing", "allergens": [ "egg", "dairy", "soy" ], "preferences": [] }, 
              { "name": "Lemon-Dijon Vinaigrette", "allergens": [], "preferences": [] }, 
              { "name": "Apple Cider Vinaigrette", "allergens": [], "preferences": [] }, 
              { "name": "Italian Dressing", "allergens": [], "preferences": [] } 
            ] 
          } 
        }, 
              
          { "weekday": "wednesday", 
            "iso_date": "2025-05-14", 
            "cuisine": "korean", 
            "entrees_and_sides": [ 
              { 
                "name": "Gochujang Roasted Salmon Fillet", 
                "allergens": [ "fish", "soy", "gluten", "sesame" ], "preferences": [] 
              }, 
              { 
                "name": "Beef Bulgogi", "allergens": [ "soy", "sesame" ], "preferences": [] 
              }, 
              { 
                "name": "Vegan Kimchi & Tofu Fried Rice", "allergens": [ "soy", "gluten", "sesame" ], "preferences": [ "vegan" ] 
              }, 
              {
                 "name": "Chili Garlic Baby Bok Choy", "allergens": [ "soy", "sesame" ], "preferences": [ "vegan" ] 
              }, 
              { 
                "name": "Japchae", "allergens": [ "soy", "sesame", "gluten" ], "preferences": [ "vegan" ] 

              }, 
              { 
                "name": "Napa Cabbage & Carrot Slaw, Ginger Vinaigrette", "allergens": [ "soy", "sesame" ], "preferences": [ "vegan" ] 
              } 
            ], 
            "salad_bar": { 
              "toppings": 
                [ 
                  { "name": "Boston Bibb", "allergens": [], "preferences": [] },
                  { "name": "Edamame", "allergens": [], "preferences": [] }, 
                  { "name": "Cherry Tomatoes", "allergens": [], "preferences": [] }, 
                  { "name": "Sliced Hot House Cucumbers", "allergens": [], "preferences": [] }, 
                  { "name": "Shaved Cello Carrot Coins", "allergens": [], "preferences": [] }, 
                  { "name": "Pickled Cucumber", "allergens": [], "preferences": [] }, 
                  { "name": "Red Pepper Banchan", "allergens": [], "preferences": [] }, 
                  { "name": "Danmuji", "allergens": [], "preferences": [] }, 
                  { "name": "Mozzarella", "allergens": [ "dairy" ], "preferences": [] } 
                ], 
              "dressings": 
                [ 
                  { "name": "Caesar Dressing", "allergens": [ "egg", "dairy", "soy" ], "preferences": [] }, 
                  { "name": "Lemon-Dijon Vinaigrette", "allergens": [], "preferences": [] }, 
                  { "name": "Apple Cider Vinaigrette", "allergens": [], "preferences": [] }, 
                  { "name": "Italian Dressing", "allergens": [], "preferences": [] } 
                ] 
              } 
            }, 
                  
            { "weekday": "friday", 
              "iso_date": "2025-05-16", 
              "cuisine": "french continental", 
              "entrees_and_sides": 
              [ 
                { "name": "Herb Marinated Grilled Flank Steak", "allergens": [], "preferences": [] }, 
                { "name": "Grilled Herb Chicken Paillard, Carrot & Napa Cabbage Slaw", "allergens": [], "preferences": [] }, 
                { "name": "Provencal Zucchini, Summer Squash Ratatouille", "allergens": [], "preferences": [ "vegan" ] }, 
                { "name": "Sauteed Haricot Verts with Lemon Olive Oil and Crispy Shallots", "allergens": [ "soy" ], "preferences": [ "vegan" ] }, 
                { "name": "Pomme Puree", "allergens": [ "dairy" ], "preferences": [] }, 
                { "name": "Nicoise Salad with Olives, Cucumbers, Haricot Verts, Hard Boiled Eggs, and Emulsified Lemon Vinaigrette", "allergens": [ "egg" ], "preferences": [ "vegetarian" ] } 
              ], 
              
              "salad_bar": 
                { 
                  "toppings": 
                  [ 
                    { "name": "Baby Kale", "allergens": [], "preferences": [] }, 
                    { "name": "Green Lentils", "allergens": [], "preferences": [] }, 
                    { "name": "Cherry Tomatoes", "allergens": [], "preferences": [] }, 
                    { "name": "Sliced Hot House Cucumbers", "allergens": [], "preferences": [] }, 
                    { "name": "Shaved Cello Carrot Coins", "allergens": [], "preferences": [] }, 
                    { "name": "Shaved Fennel", "allergens": [], "preferences": [] }, 
                    { "name": "Castelvetrano Olives", "allergens": [], "preferences": [] }, 
                    { "name": "Gruyere", "allergens": [], "preferences": [] } 
                  ], 
                  
                  "dressings": 
                  [ 
                    { "name": "Caesar Dressing", "allergens": [ "egg", "dairy", "soy" ], "preferences": [] }, 
                    { "name": "Lemon-Dijon Vinaigrette", "allergens": [], "preferences": [] }, 
                    { "name": "Apple Cider Vinaigrette", "allergens": [], "preferences": [] }, 
                    { "name": "Italian Dressing", "allergens": [], "preferences": [] } 
                  ] 
                } 
              } 
            ] 
          },
];

// Main component with comprehensive error handling
function HomeContent() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, isError, clearError, handleAsyncError } = useErrorHandler();

  const fetchMenus = async () => {
    const response = await fetch('/api/availableCuisine');
    const data = await handleApiResponse<Menu[]>(response);
    return data;
  };

  const loadMenus = () => {
    handleAsyncError(async () => {
      setLoading(true);
      const data = await retryAsync(fetchMenus, 3, 1000);
      setMenus(data || availableMenus);
      setLoading(false);
    }, 'Loading available menus');
  };

  useEffect(() => {
    loadMenus();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading available menus..." />;
  }

  if (isError && error) {
    return (
      <ErrorDisplay
        error={error}
        variant="fullscreen"
        onRetry={() => {
          clearError();
          loadMenus();
        }}
        onDismiss={() => {
          clearError();
          setMenus(availableMenus); // Fallback to static data
          setLoading(false);
        }}
        showDetails={process.env.NODE_ENV === 'development'}
      />
    );
  }

  // Get today's date for display
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            {/* <button className="text-lg px-2 py-1" aria-label="Previous event">⟵</button> */}
            <div className="text-center w-full">
              <div className="font-semibold text-gray-700">{today}</div>
              <div className="text-lg font-bold mt-1">
                Upcoming event - {menus[0]?.cuisineName || 'Cuisine'}
              </div>
            </div>
            {/* <button className="text-lg px-2 py-1" aria-label="Next event">⟶</button> */}
          </div>
          
          {menus.length > 0 ? (
            <ul className="list-disc pl-6 cursor-pointer">
              {menus.slice(0, 4).map((menu, index) => (
                <li 
                  key={menu.cuisineSlug} 
                  onClick={() => window.location.href = `/${menu.dateSlug}/${menu.cuisineSlug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {menu.cuisineName}
                </li>
              ))}
              {menus.length > 4 && <li>And more...</li>}
            </ul>
          ) : (
            <div className="text-center text-gray-500 py-4">
              No upcoming events available
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Export the main component wrapped with error boundary
export default function Home() {
  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('Home page error:', error);
        // Could send to error reporting service here
      }}
    >
      <HomeContent />
    </ErrorBoundary>
  );
}
