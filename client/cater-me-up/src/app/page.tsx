'use client';
import { useState, useEffect } from 'react';
import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import ErrorBoundary from '@/components/ErrorBoundary';
import menuJson from './utils/menuData.json';
import { toSlug } from '@/utils/menuHelpers';
// import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";


datadogRum.init({
    applicationId: '1819a01a-b7b4-471f-bdca-1e35d3f2bd43',
    clientToken: 'pub96ac2515546ca98f9fab346453907a4a',
    site: 'datadoghq.com',
    service:'dogdish',
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


// Add a date formatting function like in prev-events
function formatEventDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function getAllEventsSorted() {
  // Get all events, sorted by date ascending
  return [...(menuJson.events || [])].sort((a, b) => new Date(a.iso_date).getTime() - new Date(b.iso_date).getTime());
}

function getEventIndices() {
  const today = new Date();
  today.setHours(0,0,0,0);
  const allEvents = getAllEventsSorted();
  let prevIdx = -1, currIdx = -1, nextNextIdx = -1;
  for (let i = 0; i < allEvents.length; i++) {
    const eventDate = new Date(allEvents[i].iso_date);
    eventDate.setHours(0,0,0,0);
    if (eventDate < today) prevIdx = i;
    if (currIdx === -1 && eventDate >= today) currIdx = i;
  }
  if (currIdx !== -1 && currIdx + 1 < allEvents.length) nextNextIdx = currIdx + 1;
  return { prevIdx, currIdx, nextNextIdx, allEvents };
}

// Main component with comprehensive error handling
function HomeContent() {
  const [loading, setLoading] = useState(true);
  const { error, isError, clearError } = useErrorHandler();

  // Use the transformed menus from JSON
  useEffect(() => {
    // No need to setMenus
    setLoading(false);
  }, []);

  // Get indices for previous, current, and next-next events
  const { prevIdx, currIdx, nextNextIdx, allEvents } = getEventIndices();
  const prevEvent = prevIdx !== -1 ? allEvents[prevIdx] : null;
  const currEvent = currIdx !== -1 ? allEvents[currIdx] : null;
  const nextNextEvent = nextNextIdx !== -1 ? allEvents[nextNextIdx] : null;

  // Helper to get menu items preview
  interface MenuItem { name: string; type?: string; preferences?: string[]; allergens?: string[]; }
  interface EventData { entrees_and_sides?: MenuItem[]; salad_bar?: { toppings?: MenuItem[]; dressings?: MenuItem[] }; }
  function getMenuPreview(event: EventData, max = 3): MenuItem[] {
    if (!event) return [];
    return [
      ...(event.entrees_and_sides || []),
      ...(event.salad_bar?.toppings || []),
      ...(event.salad_bar?.dressings || [])
    ].slice(0, max);
  }

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
          window.location.reload();
        }}
        onDismiss={() => {
          clearError();
          window.location.href = '/';
        }}
        showDetails={process.env.NODE_ENV === 'development'}
      />
    );
  }
  

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{currEvent?.cuisine || 'Cuisine'}</h1>
          {currEvent && (
            <div className="flex flex-col items-center justify-center text-gray-600">
              <div className="flex items-center mb-1">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatEventDate(currEvent.iso_date)}</span>
              </div>
            </div>
          )}
        </div>
        {/* Main + Side Cards Layout */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Previous Event Card */}
          {prevEvent && (
            <div className="order-2 md:order-1 flex-1 bg-gray-100 border rounded-lg p-4 shadow-sm min-w-[220px] max-w-xs mx-auto lg:mx-0">
              <div className="font-semibold text-gray-700 mb-1">Previous Event</div>
              <div className="text-lg font-bold text-gray-800 mb-1">{prevEvent.cuisine}</div>
              <div className="text-gray-500 text-sm mb-2">{formatEventDate(prevEvent.iso_date)}</div>
              <ul className="text-xs text-gray-700 space-y-1 mb-2">
                {getMenuPreview(prevEvent, 2).map(item => (
                  <li key={item.name}>{item.name}</li>
                ))}
              </ul>
              <button className="text-xs text-blue-700 hover:underline" onClick={() => window.location.href = `/${prevEvent.iso_date}/${toSlug(prevEvent.cuisine)}`}>View Menu</button>
            </div>
          )}
          {/* Main Event Card */}
          <div className="order-1 md:order-2 flex-[2] bg-white border rounded-lg p-4 shadow-md">
            <div className="mb-4 font-semibold text-gray-800 text-lg">Next Event Menu</div>
            {currEvent ? (() => {
              const menuItems = getMenuPreview(currEvent, 6);
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {menuItems.map((item) => (
                    <div key={item.name} className="border rounded-md p-3 bg-gray-50">
                      <div className="font-medium text-gray-900 text-base mb-1 truncate">{item.name}</div>
                      {item.type && <div className="text-xs text-gray-500 mb-1">{item.type}</div>}
                      {item.preferences && item.preferences.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {item.preferences.map((pref: string) => (
                            <span key={pref} className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">{pref.charAt(0).toUpperCase() + pref.slice(1).toLowerCase()}</span>
                          ))}
                        </div>
                      )}
                      {item.allergens && item.allergens.length > 0 && (
                        <div className="flex items-center text-xs text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Contains: {item.allergens.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })() : <div className="text-gray-500">No upcoming events available</div>}
            {currEvent && (
              <div className="flex justify-center mt-4">
                <button
                  className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors text-sm font-semibold"
                  onClick={() => window.location.href = `/${currEvent.iso_date}/${toSlug(currEvent.cuisine)}`}
                >
                  View Full Menu
                </button>
              </div>
            )}
          </div>
          {/* Next-Next Event Card */}
          {nextNextEvent && (
            <div className="order-3 md:order-3  flex-1 bg-gray-100 border rounded-lg p-4 shadow-sm min-w-[220px] max-w-xs mx-auto lg:mx-0">
              <div className="font-semibold text-gray-700 mb-1">Upcoming Event</div>
              <div className="text-lg font-bold text-gray-800 mb-1">{nextNextEvent.cuisine}</div>
              <div className="text-gray-500 text-sm mb-2">{formatEventDate(nextNextEvent.iso_date)}</div>
              <ul className="text-xs text-gray-700 space-y-1 mb-2">
                {getMenuPreview(nextNextEvent, 2).map(item => (
                  <li key={item.name}>{item.name}</li>
                ))}
              </ul>
              <button className="text-xs text-blue-700 hover:underline" onClick={() => window.location.href = `/${nextNextEvent.iso_date}/${toSlug(nextNextEvent.cuisine)}`}>View Menu</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export the main component wrapped with error boundary
export default function Home() {
  return (
    <ErrorBoundary>
      <HomeContent />
    </ErrorBoundary>
  );
}
