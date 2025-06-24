'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { retryAsync } from '@/utils/errorUtils';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import ErrorBoundary from '@/components/ErrorBoundary';

interface PastEvent {
  cuisine: string;
  event_date: string;
  event_date_iso: string;
  cuisineSlug: string;
  dateSlug: string;
  description?: string;
  totalMenuItems?: number;
}

function PreviousEventsContent() {
  const [pastEvents, setPastEvents] = useState<PastEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, isError, clearError, handleAsyncError } = useErrorHandler();



  const fetchPastEvents = async () => {
    // In a real app, this would fetch from your API
    // For now, we'll use static data representing past events
    const staticPastEvents: PastEvent[] = [
      {
        cuisine: "Olive & Basil",
        event_date: "Monday, March 17, 2025",
        event_date_iso: "2025-03-17",
        cuisineSlug: "olive-and-basil",
        dateSlug: "2025-03-17",
        description: "Mediterranean-inspired cuisine with fresh herbs and premium olive oil",
        totalMenuItems: 8
      },
      {
        cuisine: "Moroccan",
        event_date: "Monday, May 12, 2025",
        event_date_iso: "2025-05-12", 
        cuisineSlug: "moroccan",
        dateSlug: "2025-05-12",
        description: "Authentic Moroccan flavors with aromatic spices and traditional preparations",
        totalMenuItems: 6
      },
      {
        cuisine: "Korean",
        event_date: "Wednesday, May 14, 2025",
        event_date_iso: "2025-05-14",
        cuisineSlug: "korean", 
        dateSlug: "2025-05-14",
        description: "Bold Korean dishes featuring fermented ingredients and balanced flavors",
        totalMenuItems: 6
      },
      {
        cuisine: "French Continental",
        event_date: "Friday, May 16, 2025",
        event_date_iso: "2025-05-16",
        cuisineSlug: "french-continental",
        dateSlug: "2025-05-16", 
        description: "Classic French techniques with continental European influences",
        totalMenuItems: 6
      }
    ];

    // Filter to only show past events (dates before today)
    const today = new Date();
    const pastEventsOnly = staticPastEvents.filter(event => {
      const eventDate = new Date(event.event_date_iso);
      return eventDate < today;
    });

    return pastEventsOnly;
  };

  const loadPastEvents = () => {
    handleAsyncError(async () => {
      setLoading(true);
      const data = await retryAsync(fetchPastEvents, 3, 1000);
      setPastEvents(data || []);
      setLoading(false);
    }, 'Loading past events');
  };

  useEffect(() => {
    loadPastEvents();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading previous events..." />;
  }

  if (isError && error) {
    return (
      <ErrorDisplay
        error={error}
        variant="fullscreen"
        onRetry={() => {
          clearError();
          loadPastEvents();
        }}
        onDismiss={() => window.location.href = '/'}
        showDetails={process.env.NODE_ENV === 'development'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Previous Events</h1>
          <p className="text-gray-600">Browse menus from our past catering events</p>
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

        {/* Events Grid */}
        {pastEvents.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pastEvents.map((event, index) => (
              <Link
                key={index}
                href={`/${event.dateSlug}/${event.cuisineSlug}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {event.cuisine}
                    </h2>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">{event.event_date}</span>
                  </div>
                  
                  {event.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  
                  {event.totalMenuItems && (
                    <div className="flex items-center text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-sm">{event.totalMenuItems} menu items</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Previous Events</h3>
            <p className="text-gray-600">There are no past events to display at the moment.</p>
            <Link 
              href="/" 
              className="mt-4 inline-block bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              View Upcoming Events
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Export the main component wrapped with error boundary
export default function PreviousEvents() {
  return (
    <ErrorBoundary>
      <PreviousEventsContent />
    </ErrorBoundary>
  );
} 