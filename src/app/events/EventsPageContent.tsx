"use client";


import AppFooter from '@/components/AppFooter';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiSmile, FiFilter, FiX } from 'react-icons/fi';
import EventCard from '../../components/EventCard';
import EventModal from '../../components/EventModal';
import { useEvents } from '@/hooks/useOfflineFirstData';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { supabase, TABLES, User } from '@/lib/supabase';
import { EventItem } from '@/lib/types';
import CustomSelect from '@/components/CustomSelect';
import { isEventUpcomingOrActive, isEventCurrentlyHappening, sortEventsByDate } from '@/lib/utils';



export default function EventsPageContent() {
  const { data: events = [], isLoading: loading } = useEvents();
  const { isSyncing, syncError, lastSyncTime } = useNetworkStatus();
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [host, setHost] = useState<User | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [initialTab, setInitialTab] = useState<'event-details' | 'about-event' | 'host-details'>('event-details');
  const now = new Date();

  // Read initialTab from URL params (for deep linking)
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam === 'about-event') {
      setInitialTab(tabParam);
    }
  }, [searchParams]);

  // Extract unique locations from CURRENT/UPCOMING events only
  const { availableLocations, hasOtherLocations } = useMemo(() => {
    const locations = new Set<string>();
    let otherLocsCount = 0;

    // Only consider current and upcoming events for available locations
    // Use proper timing logic - event is current/upcoming if it hasn't ended yet
    const currentEvents = events.filter(event => isEventUpcomingOrActive(event));

    currentEvents.forEach(event => {
      if (event.location) {
        const firstPart = event.location.split(',')[0]?.trim();
        if (firstPart) {
          if (firstPart.toLowerCase() === 'other') {
            otherLocsCount++;
          } else {
            locations.add(firstPart);
          }
        }
      }
    });

    return {
      availableLocations: Array.from(locations).sort(),
      hasOtherLocations: otherLocsCount > 0
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
      if (selectedLocation === 'other') {
        // For "Other" locations, match events that start with "other"
        const firstPart = event.location.split(',')[0]?.trim();
        return firstPart?.toLowerCase() === 'other';
      }

      // For regular locations, match the first part
      const firstPart = event.location.split(',')[0]?.trim();
      return firstPart === selectedLocation;
    });
  }, [events, selectedLocation]);

  const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago

  // Use proper timing logic - event is upcoming/current if it hasn't ended yet
  const upcomingEvents = filteredEvents.filter(event => isEventUpcomingOrActive(event));
  
  // Separate events into "Happening Now" and "Upcoming" categories
  const happeningNowEvents = upcomingEvents.filter(event => isEventCurrentlyHappening(event));
  const upcomingOnlyEvents = upcomingEvents.filter(event => !isEventCurrentlyHappening(event));

  // Sort events: happening now first (by end date), then upcoming (by start date)
  const sortedHappeningNow = sortEventsByDate(happeningNowEvents);
  const sortedUpcoming = sortEventsByDate(upcomingOnlyEvents);
  
  const previousEvents = filteredEvents.filter(event =>
    !isEventUpcomingOrActive(event) &&
    event.date &&
    new Date(event.date) >= oneWeekAgo
  );

  const fetchHost = useCallback(async (userId: string) => {
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
  }, []);

  useEffect(() => {
    if (selectedEvent?.created_by) {
      fetchHost(selectedEvent.created_by);
    } else {
      setHost(null);
    }
  }, [selectedEvent, fetchHost]);

  return (
    <div className="min-h-screen bg-white" role="main" tabIndex={-1} aria-label="Events Page">
      {/* Hero section */}
      <section className="w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-yellow-300 to-red-600 border-b border-black">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-display-lg text-white mb-4 sm:mb-6 tracking-tight">
            Events by Location
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Find events happening in your area. Filter by location to discover what's happening near you.
          </p>
        </div>
      </section>

      {/* Location Filter */}
      {!loading && events.length > 0 && (availableLocations.length > 0 || hasOtherLocations) && (
        <section className="py-4 sm:py-6 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto container-padding">
            <div className="flex flex-col gap-3 sm:gap-4 items-center text-center">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-md mx-auto">
                <div className="flex items-center gap-2 sm:gap-3 justify-center">
                  <FiFilter className="text-gray-600" size={18} />
                  <span className="text-sm sm:text-base font-medium text-gray-700">Filter by location:</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <CustomSelect
                    options={[
                      { value: 'all', label: 'All Locations' },
                      ...availableLocations.map(location => ({ value: location, label: location })),
                      ...(hasOtherLocations ? [{ value: 'other', label: 'Other Locations' }] : [])
                    ]}
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    placeholder="Select location"
                    className="flex-1 sm:flex-none min-w-[140px] sm:min-w-[160px]"
                    searchable={availableLocations.length > 5}
                  />
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
                <div className="text-sm text-gray-600 text-center">
                  Showing events in <span className="font-medium text-gray-900">{selectedLocation === 'other' ? 'Other Locations' : selectedLocation}</span>
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
          <h2 className="text-heading-lg mb-2">No events found</h2>
          <p className="mb-4 text-base sm:text-lg">Check back later for new events.</p>
        </div>
      )}

      {/* Events grid */}
      {!loading && upcomingEvents.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Happening Now Section - only show if there are events currently happening */}
          {sortedHappeningNow.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <h3 className="text-heading-2xl">
                  Happening Now
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-6 md:gap-8 animate-fade-in">
                {sortedHappeningNow.map((event: EventItem) => (
                  <EventCard key={event.id} event={event} onClick={() => { setSelectedEvent(event); setDialogOpen(true); }} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Events Section */}
          {sortedUpcoming.length > 0 && (
            <div>
              {sortedHappeningNow.length > 0 && (
                <h3 className="text-heading-2xl flex items-center justify-center gap-4 mb-6">
                  <span className="text-2xl">📅</span> Upcoming Events
                </h3>
              )}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-6 md:gap-8 animate-fade-in">
                {sortedUpcoming.map((event: EventItem) => (
                  <EventCard key={event.id} event={event} onClick={() => { setSelectedEvent(event); setDialogOpen(true); }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Previous Events */}
      {previousEvents.length > 0 && (
        <section className="py-12 bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-heading-2xl text-gray-900 mb-3">Previous Events</h2>
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

      <EventModal 
        selectedEvent={selectedEvent} 
        host={host} 
        dialogOpen={dialogOpen} 
        setDialogOpen={setDialogOpen}
        initialTab={initialTab}
      />

      <AppFooter />
    </div>
  );
}
