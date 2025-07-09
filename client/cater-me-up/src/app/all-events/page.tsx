'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import ErrorBoundary from '@/components/ErrorBoundary';
import menuJson from '../utils/menuData.json';
import { toSlug } from '@/utils/menuHelpers';

function formatEventDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function PreviousEventsContent() {
  const [loading, setLoading] = useState(true);
  const { error, isError, clearError } = useErrorHandler();
  const [previousEvents, setPreviousEvents] = useState<Array<{
    cuisine: string;
    event_date: string;
    event_date_iso: string;
    cuisineSlug: string;
    dateSlug: string;
    totalMenuItems: number;
    isPast: boolean;
  }>>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Array<{
    cuisine: string;
    event_date: string;
    event_date_iso: string;
    cuisineSlug: string;
    dateSlug: string;
    totalMenuItems: number;
    isPast: boolean;
  }>>([]);

  useEffect(() => {
    setLoading(true);
    const today = new Date();
    today.setHours(0,0,0,0);
    const allEvents = (menuJson.events || []).map(event => {
      const eventDate = new Date(event.iso_date);
      eventDate.setHours(0,0,0,0);
      return {
        cuisine: event.cuisine,
        event_date: formatEventDate(event.iso_date),
        event_date_iso: event.iso_date,
        cuisineSlug: toSlug(event.cuisine),
        dateSlug: event.iso_date,
        totalMenuItems: (event.entrees_and_sides?.length || 0) + (event.salad_bar?.toppings?.length || 0) + (event.salad_bar?.dressings?.length || 0),
        isPast: eventDate < today,
      };
    });
    setPreviousEvents(allEvents.filter(e => e.isPast).sort((a, b) => new Date(b.event_date_iso).getTime() - new Date(a.event_date_iso).getTime()));
    setUpcomingEvents(allEvents.filter(e => !e.isPast).sort((a, b) => new Date(a.event_date_iso).getTime() - new Date(b.event_date_iso).getTime()));
    setLoading(false);
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading all events..." />;
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Events</h1>
          <p className="text-gray-600">Browse menus from our past and upcoming catering events</p>
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

           {/* Upcoming Events */}
           {upcomingEvents.length > 0 && (
          <>
            <div className="text-lg font-semibold text-gray-700 mb-2 mt-8">Upcoming Events</div>
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {upcomingEvents.map((event, index) => (
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
                    <div className="flex items-center text-blue-500 text-xs mb-2">
                      <span>Upcoming Event</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-sm">{event.totalMenuItems} menu items</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* All Events */}
        {previousEvents.length > 0 && (
          <>
            <div className="text-lg font-semibold text-gray-500 mb-2 mt-8">All Events</div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {previousEvents.map((event, index) => (
                <Link
                  key={index}
                  href={`/${event.dateSlug}/${event.cuisineSlug}`}
                  className="bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group opacity-70"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                        {event.cuisine}
                      </h2>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="flex items-center text-gray-500 mb-3">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">{event.event_date}</span>
                    </div>
                    <div className="flex items-center text-gray-400 text-xs mb-2">
                      <span>Past Event</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-sm">{event.totalMenuItems} menu items</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
     
        {/* No Events */}
        {previousEvents.length === 0 && upcomingEvents.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Events</h3>
            <p className="text-gray-600">There are no events to display at the moment.</p>
            <Link 
              href="/" 
              className="mt-4 inline-block bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              View Home
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