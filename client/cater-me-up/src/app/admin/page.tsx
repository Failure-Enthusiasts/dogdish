'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { handleApiResponse, retryAsync } from '@/utils/errorUtils';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import ErrorBoundary from '@/components/ErrorBoundary';

interface MenuData {
  event_date: string;
  menu_items: Array<{
    title: string;
    description: string;
    preferences: string[];
    allergens: string[];
  }>;
}

function AdminDashboardContent() {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { error, isError, clearError, handleAsyncError } = useErrorHandler();

  const fetchMenuData = async () => {
    const response = await fetch('/data/menu.json');
    const data = await handleApiResponse<MenuData>(response);
    return data;
  };

  const loadMenuData = () => {
    handleAsyncError(async () => {
      setIsLoading(true);
      const data = await retryAsync(fetchMenuData, 2, 1000);
      setMenuData(data);
      setIsLoading(false);
    }, 'Loading menu data');
  };

  useEffect(() => {
    // Check if the user is authenticated (client-side protection)
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    
    loadMenuData();
  }, [router]);

  const handleLogout = () => {
    // Clear authentication state
    localStorage.removeItem('isAuthenticated');
    // Redirect to login page
    router.push('/admin/login');
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading admin dashboard..." />;
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
        onDismiss={() => router.push('/')}
        showDetails={process.env.NODE_ENV === 'development'}
      />
    );
  }

  return (
    <>
      <title>Admin Dashboard | Olive & Basil</title>
      
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                View Site
              </Link>
              <button 
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Menu Overview</h2>
            <div className="flex space-x-4">
              <div className="p-4 bg-green-50 rounded-lg flex-1">
                <div className="text-sm text-green-600 font-medium">Total Menu Items</div>
                <div className="text-2xl font-bold">{menuData?.menu_items.length || 0}</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg flex-1">
                <div className="text-sm text-blue-600 font-medium">Vegan Options</div>
                <div className="text-2xl font-bold">
                  {menuData?.menu_items.filter(item => 
                    item.preferences.includes('VEGAN')).length || 0}
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg flex-1">
                <div className="text-sm text-purple-600 font-medium">Event Date</div>
                <div className="text-2xl font-bold">{menuData?.event_date || 'N/A'}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Menu Items</h2>
              <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
                Add New Item
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preferences
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Allergens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {menuData?.menu_items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-500">{item.description.substring(0, 50)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {item.preferences.map((pref, i) => (
                            <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {pref}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {item.allergens.map((allergen, i) => (
                            <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</a>
                        <a href="#" className="text-red-600 hover:text-red-900">Delete</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// Export the main component wrapped with error boundary
export default function AdminDashboard() {
  return (
    <ErrorBoundary>
      <AdminDashboardContent />
    </ErrorBoundary>
  );
}