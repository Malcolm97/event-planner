"use client";

import Link from 'next/link';
import AppFooter from '@/components/AppFooter';
import { useState } from 'react';
import { FiSmile } from 'react-icons/fi';
import EventCard from '../../components/EventCard';
import { useEvents } from '@/hooks/useOfflineFirstData';
import { useNetworkStatus } from '@/context/NetworkStatusContext';

const popularPngCities = [
  "Port Moresby", "Lae", "Madang", "Mount Hagen", "Goroka", "Rabaul", "Wewak",
  "Popondetta", "Arawa", "Kavieng", "Daru", "Vanimo", "Kimbe", "Mendi",
  "Kundiawa", "Lorengau", "Wabag", "Kokopo", "Buka", "Alotau"
];

export default function EventsPageContent() {
  const { data: events = [], isLoading: loading } = useEvents();
  const { isSyncing, syncError, lastSyncTime } = useNetworkStatus();
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const now = new Date();

  const locationAreas = events.map(event => {
    const location = event.location;
    if (!location) return null;
    const firstPart = location.split(',')[0]?.trim();
    if (!firstPart) return null;
    if (popularPngCities.includes(firstPart)) {
      return firstPart;
    } else {
      return "Other Locations";
    }
  }).filter((location): location is string => !!location);
  const areas = ['All Areas', ...Array.from(new Set(locationAreas))];
  const upcomingEvents = events.filter(event => event.date && new Date(event.date) >= now);
  const previousEvents = events.filter(event => event.date && new Date(event.date) < now);
  const filteredUpcomingEvents = selectedArea === 'All Areas'
    ? upcomingEvents
    : selectedArea === 'Other Locations'
      ? upcomingEvents.filter(event => {
          const location = event.location;
          if (!location) return false;
          const firstPart = location.split(',')[0]?.trim();
          return firstPart && !popularPngCities.includes(firstPart);
        })
      : upcomingEvents.filter(event => event.location?.includes(selectedArea));
  const filteredPreviousEvents = selectedArea === 'All Areas'
    ? previousEvents
    : selectedArea === 'Other Locations'
      ? previousEvents.filter(event => {
          const location = event.location;
          if (!location) return false;
          const firstPart = location.split(',')[0]?.trim();
          return firstPart && !popularPngCities.includes(firstPart);
        })
      : previousEvents.filter(event => event.location?.includes(selectedArea));

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
      <section className="w-full py-16 px-4 sm:px-8 bg-gradient-to-br from-yellow-300 to-red-600 border-b border-black">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight">
            Events by Location
          </h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Find events happening in your area. Filter by location to discover what's happening near you.
          </p>
        </div>
      </section>

      {/* Area filter (first fold only) */}
      <section className="py-8 px-4 sm:px-8 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <label htmlFor="area-filter" className="text-base font-semibold text-gray-700 mr-2">Area:</label>
          <select
            id="area-filter"
            value={selectedArea}
            onChange={e => setSelectedArea(e.target.value)}
            className="rounded-lg border-gray-200 px-4 py-2 bg-white shadow text-gray-700 text-base sm:text-sm min-w-[180px]"
            aria-label="Filter by area"
          >
            {areas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
      </section>

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
      {!loading && filteredUpcomingEvents.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <FiSmile size={40} className="mx-auto mb-4 text-yellow-400" />
          <h2 className="text-xl sm:text-2xl font-semibold mb-2">No events found</h2>
          <p className="mb-4 text-base sm:text-lg">Check back later for new events.</p>
          <Link href="/create-event" className="inline-block bg-yellow-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold shadow hover:bg-yellow-600 transition text-base sm:text-lg whitespace-nowrap">Create an Event</Link>
        </div>
      )}

      {/* Events grid */}
      {!loading && filteredUpcomingEvents.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-4 md:gap-8 animate-fade-in">
            {filteredUpcomingEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Previous Events */}
      {filteredPreviousEvents.length > 0 && (
        <section className="py-12 bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Previous Events</h2>
              <p className="text-gray-600">Browse events that have already taken place.</p>
            </div>
            <div className="px-4 sm:px-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-4 md:gap-8 animate-fade-in">
              {filteredPreviousEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      <AppFooter />
    </div>
  );
}
// All code below this line has been removed to eliminate duplicates and errors.
