'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';
import { handleApiResponse, retryAsync } from '@/utils/errorUtils';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

// Move data fetching outside component to prevent re-creation
const fetchMenuData = async (): Promise<MenuData> => {
  const response = await fetch('/data/menu.json');
  const data = await handleApiResponse<MenuData>(response);
  return data;
};

interface MenuItem {
  name: string;
  allergens: string[];
  preferences: string[];
}

interface SaladBar {
  toppings: MenuItem[];
  dressings: MenuItem[];
}

interface Event {
  weekday: string;
  iso_date: string;
  cuisine: string;
  entrees_and_sides: MenuItem[];
  salad_bar: SaladBar;
}

interface MenuData {
  events: Event[];
}

function AdminDashboardContent() {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showToppingModal, setShowToppingModal] = useState(false);
  const [showDressingModal, setShowDressingModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPdfUploadModal, setShowPdfUploadModal] = useState(false);
  const [showJsonPreviewModal, setShowJsonPreviewModal] = useState(false);
  
  // Edit states
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingItem, setEditingItem] = useState<{ item: MenuItem; index: number; type: 'entree' | 'topping' | 'dressing' } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'event' | 'item'; data: Event | { item: MenuItem; type: string; index: number }; index?: number } | null>(null);
  
  // Form states
  const [eventFormData, setEventFormData] = useState({
    weekday: '',
    iso_date: '',
    cuisine: '',
    entrees_and_sides: [] as MenuItem[],
    salad_bar: { toppings: [] as MenuItem[], dressings: [] as MenuItem[] }
  });
  
  const [itemFormData, setItemFormData] = useState({
    name: '',
    allergens: [] as string[],
    preferences: [] as string[]
  });
  
  // PDF Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedEvents, setParsedEvents] = useState<Event[] | null>(null);
  const [rawJsonData, setRawJsonData] = useState<string | null>(null);

  // Helper functions for statistics
  const getTotalMenuItems = (events: Event[]) => {
    return events.reduce((total, event) => 
      total + event.entrees_and_sides.length + event.salad_bar.toppings.length + event.salad_bar.dressings.length, 0);
  };

  const getVeganItemsCount = (events: Event[]) => {
    return events.reduce((total, event) => {
      const veganEntrees = event.entrees_and_sides.filter(item => item.preferences.includes('vegan')).length;
      const veganToppings = event.salad_bar.toppings.filter(item => item.preferences.includes('vegan')).length;
      const veganDressings = event.salad_bar.dressings.filter(item => item.preferences.includes('vegan')).length;
      return total + veganEntrees + veganToppings + veganDressings;
    }, 0);
  };

  const getUniqueCuisines = (events: Event[]) => {
    return new Set(events.map(event => event.cuisine)).size;
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // API skeleton functions - ready for backend integration
  const saveEvent = async (event: Event, isNew: boolean = false): Promise<void> => {
    // TODO: Replace with actual API call
    // const response = await fetch('/api/events', {
    //   method: isNew ? 'POST' : 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update local state for now
    if (menuData) {
      const updatedEvents = isNew 
        ? [...menuData.events, event]
        : menuData.events.map(e => e.iso_date === event.iso_date ? event : e);
      
      setMenuData({ events: updatedEvents });
      if (!isNew && selectedEvent?.iso_date === event.iso_date) {
        setSelectedEvent(event);
      }
    }
  };

  const deleteEvent = async (eventDate: string): Promise<void> => {
    // TODO: Replace with actual API call
    // await fetch(`/api/events/${eventDate}`, { method: 'DELETE' });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update local state for now
    if (menuData) {
      const updatedEvents = menuData.events.filter(e => e.iso_date !== eventDate);
      setMenuData({ events: updatedEvents });
      if (selectedEvent?.iso_date === eventDate) {
        setSelectedEvent(updatedEvents.length > 0 ? updatedEvents[0] : null);
      }
    }
  };

  const saveMenuItem = async (item: MenuItem, eventDate: string, type: 'entree' | 'topping' | 'dressing', index?: number): Promise<void> => {
    // TODO: Replace with actual API call
    // const response = await fetch(`/api/events/${eventDate}/items`, {
    //   method: index !== undefined ? 'PUT' : 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ item, type, index })
    // });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Update local state for now
    if (menuData && selectedEvent) {
      const updatedEvents = menuData.events.map(event => {
        if (event.iso_date === eventDate) {
          const updatedEvent = { ...event };
          
          if (type === 'entree') {
            if (index !== undefined) {
              updatedEvent.entrees_and_sides[index] = item;
            } else {
              updatedEvent.entrees_and_sides.push(item);
            }
          } else if (type === 'topping') {
            if (index !== undefined) {
              updatedEvent.salad_bar.toppings[index] = item;
            } else {
              updatedEvent.salad_bar.toppings.push(item);
            }
          } else if (type === 'dressing') {
            if (index !== undefined) {
              updatedEvent.salad_bar.dressings[index] = item;
            } else {
              updatedEvent.salad_bar.dressings.push(item);
            }
          }
          
          return updatedEvent;
        }
        return event;
      });
      
      setMenuData({ events: updatedEvents });
      const updatedSelectedEvent = updatedEvents.find(e => e.iso_date === eventDate);
      if (updatedSelectedEvent) {
        setSelectedEvent(updatedSelectedEvent);
      }
    }
  };

  const deleteMenuItem = async (eventDate: string, type: 'entree' | 'topping' | 'dressing', index: number): Promise<void> => {
    // TODO: Replace with actual API call
    // await fetch(`/api/events/${eventDate}/items/${type}/${index}`, { method: 'DELETE' });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update local state for now
    if (menuData && selectedEvent) {
      const updatedEvents = menuData.events.map(event => {
        if (event.iso_date === eventDate) {
          const updatedEvent = { ...event };
          
          if (type === 'entree') {
            updatedEvent.entrees_and_sides.splice(index, 1);
          } else if (type === 'topping') {
            updatedEvent.salad_bar.toppings.splice(index, 1);
          } else if (type === 'dressing') {
            updatedEvent.salad_bar.dressings.splice(index, 1);
          }
          
          return updatedEvent;
        }
        return event;
      });
      
      setMenuData({ events: updatedEvents });
      const updatedSelectedEvent = updatedEvents.find(e => e.iso_date === eventDate);
      if (updatedSelectedEvent) {
        setSelectedEvent(updatedSelectedEvent);
      }
    }
  };

  // Action handlers
  const handleAddEvent = () => {
    setEditingEvent(null);
    setEventFormData({
      weekday: '',
      iso_date: '',
      cuisine: '',
      entrees_and_sides: [],
      salad_bar: { toppings: [], dressings: [] }
    });
    setShowEventModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventFormData({
      weekday: event.weekday,
      iso_date: event.iso_date,
      cuisine: event.cuisine,
      entrees_and_sides: event.entrees_and_sides,
      salad_bar: event.salad_bar
    });
    setShowEventModal(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setDeleteTarget({ type: 'event', data: event });
    setShowDeleteModal(true);
  };

  const handleAddItem = (type: 'entree' | 'topping' | 'dressing') => {
    setEditingItem(null);
    setItemFormData({
      name: '',
      allergens: [],
      preferences: []
    });
    if (type === 'entree') setShowItemModal(true);
    else if (type === 'topping') setShowToppingModal(true);
    else if (type === 'dressing') setShowDressingModal(true);
  };

  const handleEditItem = (item: MenuItem, index: number, type: 'entree' | 'topping' | 'dressing') => {
    setEditingItem({ item, index, type });
    setItemFormData({
      name: item.name,
      allergens: [...item.allergens],
      preferences: [...item.preferences]
    });
    if (type === 'entree') setShowItemModal(true);
    else if (type === 'topping') setShowToppingModal(true);
    else if (type === 'dressing') setShowDressingModal(true);
  };

  const handleDeleteItem = (item: MenuItem, index: number, type: 'entree' | 'topping' | 'dressing') => {
    setDeleteTarget({ type: 'item', data: { item, type, index } });
    setShowDeleteModal(true);
  };

  // PDF Upload handlers
  const handleFileSelect = (file: File) => {
    if (file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const uploadAndParsePdf = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // TODO: Replace with actual API endpoint
      // const response = await fetch('/api/pdf/parse', {
      //   method: 'POST',
      //   body: formData
      // });
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response - replace with actual API response
      const mockParsedData = {
        events: [
          {
            weekday: "thursday",
            iso_date: "2025-01-16",
            cuisine: "italian",
            entrees_and_sides: [
              { name: "Pasta Marinara", allergens: ["gluten"], preferences: ["vegetarian"] },
              { name: "Chicken Parmigiana", allergens: ["gluten", "dairy"], preferences: [] }
            ],
            salad_bar: {
              toppings: [
                { name: "Mozzarella Cheese", allergens: ["dairy"], preferences: ["vegetarian"] },
                { name: "Cherry Tomatoes", allergens: [], preferences: ["vegan"] }
              ],
              dressings: [
                { name: "Balsamic Vinaigrette", allergens: [], preferences: ["vegan"] }
              ]
            }
          }
        ]
      };

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Store parsed data
      setParsedEvents(mockParsedData.events);
      setRawJsonData(JSON.stringify(mockParsedData, null, 2));
      
      // Close upload modal and show preview
      setShowPdfUploadModal(false);
      setShowJsonPreviewModal(true);
      
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Error processing PDF. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const acceptParsedData = () => {
    if (parsedEvents && menuData) {
      // Merge parsed events with existing data
      const updatedEvents = [...menuData.events, ...parsedEvents];
      setMenuData({ events: updatedEvents });
      
      // Clear parsed data
      setParsedEvents(null);
      setRawJsonData(null);
      setSelectedFile(null);
      setShowJsonPreviewModal(false);
      
      alert(`Successfully added ${parsedEvents.length} events from PDF!`);
    }
  };

  const saveParsedEventsToDatabase = async () => {
    if (!parsedEvents) return;

    try {
      // TODO: Replace with actual API call to save events
      // const response = await fetch('/api/events/batch', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ events: parsedEvents })
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add to local state as well
      acceptParsedData();
      
      alert('Events saved to database successfully!');
    } catch (error) {
      console.error('Error saving events:', error);
      alert('Error saving events to database. Please try again.');
    }
  };

  // Simple async function without useCallback
  const loadMenuData = async () => {
    
    try {
      setFetchError(null);
      setIsLoading(true);
      const data = await retryAsync(fetchMenuData, 2, 1000);
      setMenuData(data);
      // Set the first event as selected by default
      if (data.events && data.events.length > 0) {
        setSelectedEvent(data.events[0]);
      }
      setIsLoading(false);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Failed to load menu data');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Wait for Clerk to load
    if (!isLoaded) return;
    
    // If user is not signed in, redirect to login
    if (!isSignedIn) {
      router.push('/admin/login');
      return;
    }
    
    // Inline the data loading logic to avoid function reference issues
    const loadData = async () => {
      try {
        setFetchError(null);
        setIsLoading(true);
        const data = await retryAsync(fetchMenuData, 2, 1000);
        setMenuData(data);
        // Set the first event as selected by default
        if (data.events && data.events.length > 0) {
          setSelectedEvent(data.events[0]);
        }
        setIsLoading(false);
      } catch (error) {
        setFetchError(error instanceof Error ? error.message : 'Failed to load menu data');
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [isLoaded, isSignedIn, router]);

  // Show loading while Clerk is loading
  if (!isLoaded) {
    return <LoadingSpinner fullScreen message="Loading authentication..." />;
  }

  // Redirect if not signed in (this should be handled by middleware, but just in case)
  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading admin dashboard..." />;
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{fetchError}</p>
          <button 
            onClick={loadMenuData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Delete Confirmation Modal
  const DeleteConfirmationModal = () => {
    if (!showDeleteModal || !deleteTarget) return null;

    const handleConfirmDelete = async () => {
      if (deleteTarget.type === 'event') {
        const event = deleteTarget.data as Event;
        await deleteEvent(event.iso_date);
      } else if (deleteTarget.type === 'item' && selectedEvent) {
        const itemData = deleteTarget.data as { item: MenuItem; type: string; index: number };
        await deleteMenuItem(
          selectedEvent.iso_date,
          itemData.type as 'entree' | 'topping' | 'dressing',
          itemData.index
        );
      }
      setShowDeleteModal(false);
      setDeleteTarget(null);
    };

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete {deleteTarget.type === 'event' ? 'this event' : 'this item'}? This action cannot be undone.
          </p>
          <div className="flex space-x-3 justify-end">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteTarget(null);
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Event Modal (Add/Edit)
  const EventModal = () => {
    if (!showEventModal) return null;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await saveEvent(eventFormData as Event, !editingEvent);
      setShowEventModal(false);
      setEditingEvent(null);
    };

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {editingEvent ? 'Edit Event' : 'Add New Event'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weekday</label>
              <select
                value={eventFormData.weekday}
                onChange={(e) => setEventFormData({ ...eventFormData, weekday: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              >
                <option value="">Select weekday</option>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={eventFormData.iso_date}
                onChange={(e) => setEventFormData({ ...eventFormData, iso_date: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
              <input
                type="text"
                value={eventFormData.cuisine}
                onChange={(e) => setEventFormData({ ...eventFormData, cuisine: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., Italian, Mexican, Asian"
                required
              />
            </div>
            <div className="flex space-x-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowEventModal(false);
                  setEditingEvent(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editingEvent ? 'Update' : 'Create'} Event
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Menu Item Modal (Add/Edit)
  const MenuItemModal = ({ type }: { type: 'entree' | 'topping' | 'dressing' }) => {
    const isVisible = 
      (type === 'entree' && showItemModal) ||
      (type === 'topping' && showToppingModal) ||
      (type === 'dressing' && showDressingModal);

    if (!isVisible) return null;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedEvent) {
        await saveMenuItem(
          itemFormData as MenuItem,
          selectedEvent.iso_date,
          type,
          editingItem?.index
        );
      }
      
      if (type === 'entree') setShowItemModal(false);
      else if (type === 'topping') setShowToppingModal(false);
      else if (type === 'dressing') setShowDressingModal(false);
      
      setEditingItem(null);
    };

    const closeModal = () => {
      if (type === 'entree') setShowItemModal(false);
      else if (type === 'topping') setShowToppingModal(false);
      else if (type === 'dressing') setShowDressingModal(false);
      setEditingItem(null);
    };

    const addAllergen = (allergen: string) => {
      if (allergen && !itemFormData.allergens.includes(allergen)) {
        setItemFormData({ ...itemFormData, allergens: [...itemFormData.allergens, allergen] });
      }
    };

    const removeAllergen = (allergen: string) => {
      setItemFormData({ ...itemFormData, allergens: itemFormData.allergens.filter(a => a !== allergen) });
    };

    const addPreference = (preference: string) => {
      if (preference && !itemFormData.preferences.includes(preference)) {
        setItemFormData({ ...itemFormData, preferences: [...itemFormData.preferences, preference] });
      }
    };

    const removePreference = (preference: string) => {
      setItemFormData({ ...itemFormData, preferences: itemFormData.preferences.filter(p => p !== preference) });
    };

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {editingItem ? 'Edit' : 'Add'} {type === 'entree' ? 'Menu Item' : type === 'topping' ? 'Topping' : 'Dressing'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={itemFormData.name}
                onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter item name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allergens</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {itemFormData.allergens.map((allergen, index) => (
                  <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm flex items-center">
                    {allergen}
                    <button
                      type="button"
                      onClick={() => removeAllergen(allergen)}
                      className="ml-1 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <select
                onChange={(e) => {
                  addAllergen(e.target.value);
                  e.target.value = '';
                }}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Add allergen</option>
                <option value="dairy">Dairy</option>
                <option value="egg">Egg</option>
                <option value="fish">Fish</option>
                <option value="gluten">Gluten</option>
                <option value="nuts">Nuts</option>
                <option value="sesame">Sesame</option>
                <option value="soy">Soy</option>
                <option value="shellfish">Shellfish</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Preferences</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {itemFormData.preferences.map((preference, index) => (
                  <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm flex items-center">
                    {preference}
                    <button
                      type="button"
                      onClick={() => removePreference(preference)}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <select
                onChange={(e) => {
                  addPreference(e.target.value);
                  e.target.value = '';
                }}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Add dietary preference</option>
                <option value="vegan">Vegan</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="gluten-free">Gluten Free</option>
                <option value="keto">Keto</option>
                <option value="paleo">Paleo</option>
              </select>
            </div>

            <div className="flex space-x-3 justify-end pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {editingItem ? 'Update' : 'Add'} {type === 'entree' ? 'Item' : type}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // PDF Upload Modal
  const PdfUploadModal = () => {
    if (!showPdfUploadModal) return null;

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-md max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 flex-shrink-0">
            <h3 className="text-lg font-semibold mb-4">Upload PDF Menu</h3>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors"
            >
            {selectedFile ? (
              <div className="space-y-4">
                <svg className="w-12 h-12 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                
                {isUploading && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600">Processing PDF... {uploadProgress}%</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">Drag and drop your PDF file here, or</p>
                  <label className="text-purple-600 hover:text-purple-700 cursor-pointer font-medium">
                    browse to upload
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">PDF files only, max 10MB</p>
              </div>
                          )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex space-x-3 justify-end p-6 flex-shrink-0">
            <button
              onClick={() => {
                setShowPdfUploadModal(false);
                setSelectedFile(null);
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              onClick={uploadAndParsePdf}
              disabled={!selectedFile || isUploading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Processing...' : 'Parse PDF'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // JSON Preview Modal
  const JsonPreviewModal = () => {
    if (!showJsonPreviewModal) return null;

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-6xl max-h-[95vh] flex flex-col">
          {/* Fixed Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-lg font-semibold">Parsed Menu Data</h3>
            <button
              onClick={() => setShowJsonPreviewModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-hidden p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Formatted Preview */}
              <div className="flex flex-col h-full">
                <h4 className="font-medium text-gray-900 mb-3 flex-shrink-0">Formatted Preview</h4>
                <div className="bg-gray-50 rounded-lg p-4 flex-1 overflow-y-auto">
                {parsedEvents?.map((event, index) => (
                  <div key={index} className="mb-6 bg-white rounded-lg p-4 border">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-semibold text-lg capitalize">{event.weekday}</h5>
                        <p className="text-gray-600">{event.iso_date}</p>
                        <p className="text-purple-600 capitalize">{event.cuisine} Cuisine</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h6 className="font-medium text-sm text-gray-700 mb-2">Entrees & Sides ({event.entrees_and_sides.length})</h6>
                        <div className="space-y-1">
                          {event.entrees_and_sides.map((item, i) => (
                            <div key={i} className="text-sm bg-gray-50 p-2 rounded">
                              <span className="font-medium">{item.name}</span>
                              {item.allergens.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.allergens.map((allergen, j) => (
                                    <span key={j} className="text-xs bg-red-100 text-red-700 px-1 rounded">
                                      {allergen}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {item.preferences.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.preferences.map((pref, j) => (
                                    <span key={j} className="text-xs bg-green-100 text-green-700 px-1 rounded">
                                      {pref}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <h6 className="font-medium text-sm text-gray-700 mb-2">Toppings ({event.salad_bar.toppings.length})</h6>
                          <div className="space-y-1">
                            {event.salad_bar.toppings.map((item, i) => (
                              <div key={i} className="text-xs bg-blue-50 p-1 rounded">{item.name}</div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h6 className="font-medium text-sm text-gray-700 mb-2">Dressings ({event.salad_bar.dressings.length})</h6>
                          <div className="space-y-1">
                            {event.salad_bar.dressings.map((item, i) => (
                              <div key={i} className="text-xs bg-orange-50 p-1 rounded">{item.name}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

              {/* Raw JSON */}
              <div className="flex flex-col h-full">
                <h4 className="font-medium text-gray-900 mb-3 flex-shrink-0">Raw JSON Data</h4>
                <div className="bg-gray-900 text-green-400 rounded-lg p-4 flex-1 overflow-y-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {rawJsonData}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex space-x-3 justify-end p-6 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={() => setShowJsonPreviewModal(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={acceptParsedData}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add to Menu
            </button>
            <button
              onClick={saveParsedEventsToDatabase}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save to Database
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <title>Admin Dashboard</title>
      
      {/* Modals */}
      <DeleteConfirmationModal />
      <EventModal />
      <MenuItemModal type="entree" />
      <MenuItemModal type="topping" />
      <MenuItemModal type="dressing" />
      <PdfUploadModal />
      <JsonPreviewModal />
      
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              {user && (
                <p className="text-sm text-gray-600">Welcome, {user.emailAddresses[0]?.emailAddress}</p>
              )}
            </div>
            <div className="flex space-x-4 items-center">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                View Site
              </Link>
              <SignOutButton>
                <button className="text-gray-600 hover:text-gray-900">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Events Overview */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Events Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Total Events</div>
                <div className="text-2xl font-bold">{menuData?.events.length || 0}</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Total Menu Items</div>
                <div className="text-2xl font-bold">
                  {menuData ? getTotalMenuItems(menuData.events) : 0}
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Vegan Options</div>
                <div className="text-2xl font-bold">
                  {menuData ? getVeganItemsCount(menuData.events) : 0}
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-sm text-orange-600 font-medium">Cuisines</div>
                <div className="text-2xl font-bold">
                  {menuData ? getUniqueCuisines(menuData.events) : 0}
                </div>
              </div>
            </div>
          </div>

          {/* PDF Upload Section */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Import Menu from PDF</h2>
                <p className="text-gray-600 text-sm">Upload a PDF menu to automatically extract events and menu items</p>
              </div>
              <button
                onClick={() => setShowPdfUploadModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upload PDF</span>
              </button>
            </div>
            
            {parsedEvents && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-800 font-medium">
                      PDF processed successfully! Found {parsedEvents.length} event(s)
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowJsonPreviewModal(true)}
                      className="text-green-700 hover:text-green-900 text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={acceptParsedData}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Add to Menu
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Event Selection */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Select Event</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {menuData?.events.map((event, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedEvent(event)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedEvent?.iso_date === event.iso_date
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900 capitalize">{event.weekday}</div>
                  <div className="text-sm text-gray-600">{formatDate(event.iso_date)}</div>
                  <div className="text-sm text-gray-500 capitalize">{event.cuisine} Cuisine</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {event.entrees_and_sides.length} entrees & sides • {event.salad_bar.toppings.length} toppings • {event.salad_bar.dressings.length} dressings
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Event Details */}
          {selectedEvent && (
            <div className="space-y-6">
              {/* Event Header */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-semibold capitalize">
                      {selectedEvent.weekday} - {selectedEvent.cuisine} Cuisine
                    </h2>
                    <p className="text-gray-600">{formatDate(selectedEvent.iso_date)}</p>
                    <div className="flex space-x-4 mt-2 text-sm text-gray-500">
                      <span>{selectedEvent.entrees_and_sides.length} entrees & sides</span>
                      <span>{selectedEvent.salad_bar.toppings.length} toppings</span>
                      <span>{selectedEvent.salad_bar.dressings.length} dressings</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditEvent(selectedEvent)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit Event
                    </button>
                    <button 
                      onClick={() => handleDeleteEvent(selectedEvent)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete Event
                    </button>
                  </div>
                </div>
              </div>

              {/* Entrees and Sides */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Entrees & Sides</h3>
                  <button 
                    onClick={() => handleAddItem('entree')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add Item
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
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
                      {selectedEvent.entrees_and_sides.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{item.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {item.preferences.map((pref, i) => (
                                <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                                  {pref}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {item.allergens.map((allergen, i) => (
                                <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 capitalize">
                                  {allergen}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            <button 
                              onClick={() => handleEditItem(item, index, 'entree')}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteItem(item, index, 'entree')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Salad Bar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Toppings */}
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Salad Bar Toppings</h3>
                    <button 
                      onClick={() => handleAddItem('topping')}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      Add Topping
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selectedEvent.salad_bar.toppings.map((topping, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{topping.name}</div>
                          <div className="flex space-x-2 mt-1">
                            {topping.preferences.map((pref, i) => (
                              <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded capitalize">
                                {pref}
                              </span>
                            ))}
                            {topping.allergens.map((allergen, i) => (
                              <span key={i} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded capitalize">
                                {allergen}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditItem(topping, index, 'topping')}
                            className="text-indigo-600 hover:text-indigo-900 text-sm"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(topping, index, 'topping')}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dressings */}
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Salad Bar Dressings</h3>
                    <button 
                      onClick={() => handleAddItem('dressing')}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      Add Dressing
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selectedEvent.salad_bar.dressings.map((dressing, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{dressing.name}</div>
                          <div className="flex space-x-2 mt-1">
                            {dressing.preferences.map((pref, i) => (
                              <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded capitalize">
                                {pref}
                              </span>
                            ))}
                            {dressing.allergens.map((allergen, i) => (
                              <span key={i} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded capitalize">
                                {allergen}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditItem(dressing, index, 'dressing')}
                            className="text-indigo-600 hover:text-indigo-900 text-sm"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(dressing, index, 'dressing')}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add New Event Button */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <button 
                onClick={handleAddEvent}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
              >
                Add New Event
              </button>
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