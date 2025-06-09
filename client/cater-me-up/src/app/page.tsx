'use client';
import { useState, useEffect } from 'react';
import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';
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
  {
    cuisineSlug: 'olive-and-basil',
    dateSlug: '2025-03-17',
    cuisineName: 'Olive & Basil',
    eventDate: 'Monday, March 17'
  },
];

// In the future, we'll fetch the data from the API
export default function Home() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // You can either use the static data:
    setMenus(availableMenus);
    setLoading(false);

    // Or fetch from an API:
    /*
    const fetchMenus = async () => {
      try {
        const response = await fetch('/api/available-menus');
        const data = await response.json();
        setMenus(data);
      } catch (error) {
        console.error('Error fetching menus:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
    */
  }, []);

  if (loading) {
    return <div>Loading available menus...</div>;
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
              <div className="text-lg font-bold mt-1">Upcoming event - {menus[0]?.cuisineName || 'Cuisine'}</div>
            </div>
            {/* <button className="text-lg px-2 py-1" aria-label="Next event">⟶</button> */}
          </div>
          <ul className="list-disc pl-6 cursor-pointer">
            <li onClick={() => alert('Show menu details')}>${menus[4]?.cuisineName}</li>
            <li onClick={() => alert('Show menu details')}>${menus[1]?.cuisineName}</li>
            <li onClick={() => alert('Show menu details')}>${menus[2]?.cuisineName}</li>
            <li onClick={() => alert('Show menu details')}>${menus[3]?.cuisineName}</li>
            <li>ETC</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
