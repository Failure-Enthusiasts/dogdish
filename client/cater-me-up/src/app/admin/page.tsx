'use client';
import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation'; // Keep if used for other things, not for auth redirect
import Link from 'next/link';
import Head from 'next/head';
import { UserButton, useUser } from "@clerk/nextjs"; // Added useUser

interface MenuItem {
  title: string;
  description: string;
  preferences: string[];
  allergens: string[];
  // Add other properties if they exist in your menu.json structure
}

interface MenuData {
  event_date?: string;
  menu_items: MenuItem[];
}

export default function AdminDashboard() {
  // const router = useRouter(); // Keep if used for non-auth purposes
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const { isLoaded, isSignedIn, user } = useUser(); // Clerk's hook

  useEffect(() => {
    // Data fetching logic - now assumes user is authenticated by middleware
    // If not isSignedIn and isLoaded, middleware should have redirected.
    // However, you might want to avoid fetching if not signed in as an extra check.
    if (isLoaded && isSignedIn) {
      const fetchData = async () => {
        setIsLoadingMenu(true);
        try {
          const response = await fetch('/data/menu.json');
          if (!response.ok) {
            throw new Error(`Failed to fetch menu data: ${response.statusText}`);
          }
          const data = await response.json();
          setMenuData(data);
        } catch (error) {
          console.error('Error fetching menu data:', error);
          setMenuData(null);
        } finally {
          setIsLoadingMenu(false);
        }
      };
      fetchData();
    } else if (isLoaded && !isSignedIn) {
        // This case should ideally be handled by middleware redirecting.
        // If component somehow renders, show minimal or redirect.
        // For now, rely on middleware. Can add client redirect if flicker occurs.
        console.log("AdminDashboard: User not signed in, middleware should have redirected.");
        setIsLoadingMenu(false); // Stop loading if no user
    }
  }, [isLoaded, isSignedIn]); // Depend on Clerk's auth state

  // Display loading state while Clerk is verifying auth or menu is loading
  if (!isLoaded || isLoadingMenu) {
    // If Clerk hasn't loaded, show a generic loading.
    // If Clerk has loaded but user isn't signed in, middleware should have redirected.
    // If Clerk has loaded, user is signed in, but menu is loading, show menu loading.
    let loadingMessage = "Loading...";
    if (!isLoaded) loadingMessage = "Authenticating user...";
    else if (isLoadingMenu) loadingMessage = "Loading menu data...";

    return <div className="flex justify-center items-center min-h-screen">{loadingMessage}</div>;
  }

  // If Clerk has loaded and user is not signed in,
  // this indicates a potential issue if middleware didn't redirect.
  // However, Clerk's components like <SignedIn> <SignedOut> handle this gracefully too.
  // For now, we assume middleware handles the redirect. If not, content below would be shown to unauth user.

  return (
    <>
      <Head>
        <title>Admin Dashboard | Cater Me Up</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              {isSignedIn && user?.primaryEmailAddress?.emailAddress && (
                <p className="text-sm text-gray-600">Signed in as: {user.primaryEmailAddress.emailAddress}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                View Site
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* ... rest of the menu display logic (should be fine) ... */}
          {/* Ensure menuData related rendering is robust if menuData is null */}
          {isSignedIn && menuData ? (
            <>
              {/* ... existing menu overview and menu items table ... */}
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
                  <div className="flex space-x-2">
                    <button
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                      onClick={() => alert('Add New Item functionality not yet implemented.')} // Placeholder action
                    >
                      Add New Item (Manual)
                    </button>
                    <Link
                      href="/admin/upload-pdf"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Upload PDF Menu
                    </Link>
                  </div>
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
            </>
          ) : (
             <div className="text-center py-10">
                <p className="text-xl text-gray-700">
                  {isSignedIn ? "No menu data available or failed to load." : "Please sign in to view admin content."}
                </p>
             </div>
          )}
        </main>
      </div>
    </>
  );
}