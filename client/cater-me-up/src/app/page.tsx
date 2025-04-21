'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';


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
  catererSlug: string;
  dateSlug: string;
  catererName: string; // For display purposes
  eventDate: string;   // For display purposes
}

// In the future, we'll fetch the data from the API
const availableMenus: Menu[] = [
  {
    catererSlug: 'olive-and-basil',
    dateSlug: '2025-03-17',
    catererName: 'Olive & Basil',
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Available Menus</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          {menus.map((menu, index) => (
            <Link 
              key={index}
              href={`/${menu.dateSlug}/${menu.catererSlug}`} 
              className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h2 className="text-2xl font-bold mb-2">{menu.catererName}</h2>
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{menu.eventDate}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
