'use client';

import { useState, useEffect } from 'react';
import { supabase, TABLES } from '../lib/supabase'; // Removed Event type import as we'll use EventItem
import EventCard from './EventCard';
import { getEvents as getCachedEvents, addEvents } from '@/lib/indexedDB';
import { EventItem } from '@/lib/types'; // Import EventItem from shared types
import { useNetworkStatus } from '@/context/NetworkStatusContext'; // Import network status hook

export default function EventsList() {
  const [events, setEvents] = useState<EventItem[]>([]); // Use EventItem type
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false); // State for syncing indicator
  const { isOnline, setLastSaved } = useNetworkStatus();

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setIsSyncing(false); // Reset syncing state on initial load
      try {
        // 1. Try to load from cache first
        const cachedEvents = await getCachedEvents();
        if (cachedEvents && cachedEvents.length > 0) {
          setEvents(cachedEvents);
          // If online, try to refresh from API in the background
          if (isOnline) {
            refreshEventsFromAPI(); // This will set isSyncing true internally
          }
        } else {
          // If cache is empty, try to fetch from API
          if (isOnline) {
            await refreshEventsFromAPI(); // This will set isSyncing true internally
          } else {
            // Offline and no cache: show fallback message
            setEvents([]); // Ensure events is empty for fallback display
          }
        }
      } catch (error) {
        console.error('Error loading events:', error);
        // Handle cache read errors, potentially fall back to API or show error
        if (isOnline) {
          await refreshEventsFromAPI(); // This will set isSyncing true internally
        } else {
          setEvents([]); // Ensure events is empty for fallback display
        }
      } finally {
        setLoading(false);
      }
    };

    const refreshEventsFromAPI = async () => {
      if (!isOnline) return; // Only sync if online

      setIsSyncing(true); // Start syncing
      try {
        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        const data: EventItem[] = await response.json();
        setEvents(data);
        // Update cache with fresh data
        await addEvents(data);
        setLastSaved(new Date().toISOString()); // Update last synced timestamp
      } catch (error) {
        console.error('Error fetching events from API:', error);
        // If API fetch fails, and we have cached data, keep the cached data.
        // If no cached data and API fails, the fallback message will be shown.
      } finally {
        setIsSyncing(false); // End syncing
      }
    };

    fetchEvents();
  }, [isOnline]); // Re-run effect if online status changes

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
        <p className="text-gray-500 mt-6 text-lg">Loading events...</p>
      </div>
    );
  }

  // Show syncing indicator if syncing and no events are loaded yet
  if (isSyncing && events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-6 text-lg">Syncing events...</p>
      </div>
    );
  }

  // Modified empty state to show fallback message when offline and no cache
  if (events.length === 0 && !isOnline) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">You are offline</h3>
        <p className="text-gray-500">No events could be loaded. Please check your connection.</p>
      </div>
    );
  }
  
  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
        <p className="text-gray-500">Check back later for new events.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
