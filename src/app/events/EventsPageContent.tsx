"use client";


import AppFooter from '@/components/AppFooter';
import { useState, useEffect, useMemo } from 'react';
import { FiSmile, FiFilter, FiX } from 'react-icons/fi';
import EventCard from '../../components/EventCard';
import EventModal from '../../components/EventModal';
import { useEvents } from '@/hooks/useOfflineFirstData';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { supabase, TABLES, User } from '@/lib/supabase';
import { EventItem } from '@/lib/types';



export default function EventsPageContent() {
  const { data: events = [], isLoading: loading } = useEvents();
  const { isSyncing, syncError, lastSyncTime } = useNetworkStatus();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [host, setHost] = useState<User | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const now = new Date();

  // Extract unique locations from events and group "Other" locations
  const { availableLocations, otherLocations } = useMemo(() => {
    const locations = new Set<string>();
    const otherLocs = new Set<string>();

    events.forEach(event => {
      if (event.location) {
        const firstPart = event.location.split(',')[0]?.trim();
        if (firstPart) {
          if (firstPart.toLowerCase() === 'other') {
            // For "Other" locations, extract the actual location after the comma
            const actualLocation = event.location.split(',')[1]?.trim();
            if (actualLocation && actualLocation.toLowerCase() !== 'other') {
              otherLocs.add(actualLocation);
            }
          } else {
            locations.add(firstPart);
          }
        }
      }
    });

    return {
      availableLocations: Array.from(locations).sort(),
      otherLocations: Array.from(otherLocs).sort()
    };
  }, [events]);

  // Filter events based on selected location
  const filteredEvents = useMemo(() => {
    if (selectedLocation === 'all') {
      return events;
    }

    return events.filter(event => {
      if (!event.location) return false;

      // Check if this is an "Other" location selection
      if (otherLocations.includes(selectedLocation)) {
        // For "Other" locations, match the full location string
        return event.location.toLowerCase().includes(selectedLocation.toLowerCase());
      }

      // For regular locations, match the first part
      const firstPart = event.location.split(',')[0]?.trim();
      return firstPart === selectedLocation;
    });
  }, [events, selectedLocation, otherLocations]);

  const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago

  const upcomingEvents = filteredEvents.filter(event => event.date && new Date(event.date) >= now);
  const previousEvents = filteredEvents.filter(event =>
    event.date &&
    new Date(event.date) < now &&
    new Date(event.date) >= oneWeekAgo
  );

  const fetchHost = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId);

      if (error) {
        console.error('Error fetching host:', error);
        return;
      }

      if (data && data.length > 0) {
        setHost(data[0]);
      } else {
        setHost(null);
      }
    } catch (err: any) {
      console.error('Error fetching host:', err);
    }
  };

  useEffect(() => {
    if (selectedEvent?.created_by) {
      fetchHost(selectedEvent.created_by);
    } else {
      setHost(null);
    }
  }, [selectedEvent]);

  return (
    <div className="min-h-screen bg-white" role="main" tabIndex={-1} aria-label="Events Page">
      {/* Sync status indicator */}
      <div className="w-full bg-yellow-50 border-b border-yellow-200 py-2 flex flex-col items-center text-sm" role="status" aria-live="polite" tabIndex={0} id="sync-indicator">
        {isSyncing && (
          <span className="flex items-center gap-2 text-yellow-700">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></span>
            Syncing events...
          </span>
        )}
        {syncError && (
          <span className="text-red-600">Sync error: {syncError}</span>
        )}
        {lastSyncTime && !isSyncing && !syncError && (
          <span className="text-gray-600">Last synced: {lastSyncTime.toLocaleString()}</span>
        )}
      </div>

      {/* Hero section */}
      <section className="w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-yellow-300 to-red-600 border-b border-black">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight">
            Events by Location
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Find events happening in your area. Filter by location to discover what's happening near you.
          </p>
        </div>
      </section>

      {/* Location Filter */}
      {!loading && events.length > 0 && (availableLocations.length > 0 || otherLocations.length > 0) && (
        <section className="py-4 sm:py-6 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto container-padding">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <FiFilter className="text-gray-600" size={18} />
                  <span className="text-sm sm:text-base font-medium text-gray-700">Filter by location:</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="flex-1 sm:flex-none input-field min-w-[140px] sm:min-w-[160px]"
                    aria-label="Filter events by location"
                  >
                    <option value="all">All Locations</option>

                    {/* Regular locations */}
                    {availableLocations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}

                    {/* Other locations section */}
                    {otherLocations.length > 0 && (
                      <optgroup label="Other Locations">
                        {otherLocations.map((location) => (
                          <option key={`other-${location}`} value={location}>
                            {location}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {selectedLocation !== 'all' && (
                    <button
                      onClick={() => setSelectedLocation('all')}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors whitespace-nowrap"
                      aria-label="Clear location filter"
                    >
                      <FiX size={16} />
                      Clear
                    </button>
                  )}
                </div>
              </div>
              {selectedLocation !== 'all' && (
                <div className="text-sm text-gray-600">
                  Showing events in <span className="font-medium text-gray-900">{selectedLocation}</span>
                  {upcomingEvents.length !== filteredEvents.length && (
                    <span className="ml-2">
                      ({upcomingEvents.length} upcoming, {filteredEvents.length - upcomingEvents.length} previous)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Skeleton loader while loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8" role="list" aria-label="Event List">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl h-72 shadow flex flex-col gap-4 p-6">
              <div className="bg-gray-200 h-32 w-full rounded-xl" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* No events found message */}
      {!loading && upcomingEvents.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <FiSmile size={40} className="mx-auto mb-4 text-yellow-400" />
          <h2 className="text-xl sm:text-2xl font-semibold mb-2">No events found</h2>
          <p className="mb-4 text-base sm:text-lg">Check back later for new events.</p>
        </div>
      )}

      {/* Events grid */}
      {!loading && upcomingEvents.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-6 md:gap-8 animate-fade-in">
            {upcomingEvents.map((event: EventItem) => (
              <EventCard key={event.id} event={event} onClick={() => { setSelectedEvent(event); setDialogOpen(true); }} />
            ))}
          </div>
        </div>
      )}

      {/* Previous Events */}
      {previousEvents.length > 0 && (
        <section className="py-12 bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Previous Events</h2>
              <p className="text-gray-600">Browse events that have already taken place.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-6 md:gap-8 animate-fade-in">
              {previousEvents.map((event: EventItem) => (
                <EventCard key={event.id} event={event} onClick={() => { setSelectedEvent(event); setDialogOpen(true); }} />
              ))}
            </div>
          </div>
        </section>
      )}

      <EventModal selectedEvent={selectedEvent} host={host} dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} />

      <AppFooter />
    </div>
  );
}
// All code below this line has been removed to eliminate duplicates and errors.
