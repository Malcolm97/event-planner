'use client';

import Link from 'next/link';
import AppFooter from '@/components/AppFooter';
import { useState, useEffect, useRef } from 'react';
import { supabase, TABLES, User } from '@/lib/supabase';
import EventCard from '../../components/EventCard';
import { FiMapPin, FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile, FiStar, FiSearch, FiChevronUp } from 'react-icons/fi';
// Event categories (customize as needed)
const categories = [
  'All',
  'Music',
  'Art',
  'Food',
  'Technology',
  'Wellness',
  'Comedy',
  'Other',
];
import EventModal from '../../components/EventModal';
import { EventItem } from '@/lib/types';
import { useEvents } from '@/hooks/useOfflineFirstData';
import { useNetworkStatus } from '@/context/NetworkStatusContext';

// Category and Icon mapping
const categoryIconMap: { [key: string]: any } = {
  'Music': FiMusic,
  'Art': FiImage,
  'Food': FiCoffee,
  'Technology': FiCpu,
  'Wellness': FiHeart,
  'Comedy': FiSmile,
  'Other': FiStar,
};

// List of popular PNG cities, used for categorizing locations
const popularPngCities = [
  "Port Moresby", "Lae", "Madang", "Mount Hagen", "Goroka", "Rabaul", "Wewak",
  "Popondetta", "Arawa", "Kavieng", "Daru", "Vanimo", "Kimbe", "Mendi",
  "Kundiawa", "Lorengau", "Wabag", "Kokopo", "Buka", "Alotau"
];

interface EventsPageContentProps {
  initialEvents: EventItem[];
  initialTotalEvents: number | null;
  initialTotalUsers: number | null;
  initialCitiesCovered: number;
}

export default function EventsPageContent({ initialEvents, initialTotalEvents, initialTotalUsers, initialCitiesCovered }: EventsPageContentProps) {
  const { data: events = [], isLoading: loading, error } = useEvents();
  const { isSyncing, syncError, lastSyncTime } = useNetworkStatus();
  const [selectedArea, setSelectedArea] = useState('All Areas');

  // Enhanced UI state
  const [search, setSearch] = useState('');
  // Multi-select state for category and location
  const [category, setCategory] = useState<string[]>([]);
  const [location, setLocation] = useState<string[]>([]);
  const [date, setDate] = useState<string>('');
  const [sort, setSort] = useState('date-asc');
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Show back-to-top button on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Modal states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [host, setHost] = useState<User | null>(null);

  const now = new Date();

  // Fetch host details based on the event's creator ID
  const fetchHost = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId);

      if (error) {
  // ...existing code...
        return;
      }

      if (data && data.length > 0) {
        setHost(data[0]);
      } else {
        setHost(null);
      }
    } catch (err: any) {
  // ...existing code...
    }
  };

  // Effect to fetch host details when selectedEvent changes
  useEffect(() => {
    if (selectedEvent?.created_by) {
      fetchHost(selectedEvent.created_by);
    } else {
      setHost(null);
    }
  }, [selectedEvent]);

  // Extract unique areas from events, categorizing custom locations as "Other Locations"
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


  // Filter, search, and sort logic
  const upcomingEvents = events.filter(event => event.date && new Date(event.date) >= now);
  const previousEvents = events.filter(event => event.date && new Date(event.date) < now);

  let filteredUpcomingEvents = selectedArea === 'All Areas'
    ? upcomingEvents
    : selectedArea === 'Other Locations'
      ? upcomingEvents.filter(event => {
          const location = event.location;
          if (!location) return false;
          const firstPart = location.split(',')[0]?.trim();
          return firstPart && !popularPngCities.includes(firstPart);
        })
      : upcomingEvents.filter(event => event.location?.includes(selectedArea));

  // Multi-category filter
  if (category.length > 0) {
    filteredUpcomingEvents = filteredUpcomingEvents.filter(event => event.category && category.includes(event.category));
  }
  // Multi-location filter
  if (location.length > 0) {
    filteredUpcomingEvents = filteredUpcomingEvents.filter(event => {
      const loc = event.location?.split(',')[0]?.trim();
      return loc && location.includes(loc);
    });
  }
  // Date filter
  if (date) {
    filteredUpcomingEvents = filteredUpcomingEvents.filter(event => event.date && event.date.startsWith(date));
  }
  // Debounced search filter
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 250);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search]);
  if (debouncedSearch.trim()) {
    const q = debouncedSearch.trim().toLowerCase();
    filteredUpcomingEvents = filteredUpcomingEvents.filter(event =>
      event.name?.toLowerCase().includes(q) ||
      event.location?.toLowerCase().includes(q)
    );
  }
  // Sort
  filteredUpcomingEvents = [...filteredUpcomingEvents].sort((a, b) => {
    if (sort === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sort === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sort === 'price-asc') {
      const aPrice = a.presale_price ?? a.gate_price ?? 0;
      const bPrice = b.presale_price ?? b.gate_price ?? 0;
      return aPrice - bPrice;
    }
    if (sort === 'price-desc') {
      const aPrice = a.presale_price ?? a.gate_price ?? 0;
      const bPrice = b.presale_price ?? b.gate_price ?? 0;
      return bPrice - aPrice;
    }
    return 0;
  });

  let filteredPreviousEvents = selectedArea === 'All Areas'
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

      <section className="py-8 px-4 sm:px-8 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <FiMapPin className="text-yellow-600 text-xl" />
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value ?? 'All Areas')}
              className="w-full min-w-[120px] max-w-md px-4 py-4 text-lg border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              aria-label="Filter by area"
            >
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Popular Areas</h2>
          {events.length === 0 && !loading ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📴</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No cached events available offline</h3>
              <p className="text-gray-500">Connect to the internet to load events for offline use.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {areas.slice(1).map(area => {
                const areaEvents = area === 'Other Locations'
                  ? events.filter(event => {
                      const location = event.location;
                      if (!location) return false;
                      const firstPart = location.split(',')[0]?.trim();
                      return firstPart && !popularPngCities.includes(firstPart);
                    })
                  : events.filter(event => event.location?.includes(area));
                const upcomingCount = areaEvents.filter(event => event.date && new Date(event.date) >= now).length;
                return (
                  <div
                    key={area}
                    onClick={() => setSelectedArea(area ?? 'All Areas')}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedArea === area
                        ? 'border-yellow-400 bg-yellow-50 ring-4 ring-yellow-400 ring-offset-2'
                        : 'border-gray-200 bg-white hover:border-yellow-300 hover:shadow-lg'
                    }`}
                  >
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{area}</h3>
                      <p className="text-sm text-gray-600 mb-3">{upcomingCount} upcoming events</p>
                      <button className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                        View Events →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 px-4 sm:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {selectedArea === 'All Areas' ? 'All Events' : `${selectedArea} Events`}
            </h2>
            <p className="text-gray-600 text-lg">
              Showing {filteredUpcomingEvents.length} upcoming event{filteredUpcomingEvents.length !== 1 ? 's' : ''}
              {selectedArea !== 'All Areas' && ` in ${selectedArea}`}
            </p>
          </div>

          {/* Enhanced event controls */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 mb-8 w-full">
            <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white rounded-lg shadow px-3 py-2 w-full sm:w-auto focus-within:ring-2 focus-within:ring-yellow-400">
              <FiSearch className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search events by name or location..."
                className="w-full min-w-0 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-base sm:text-sm focus:ring-2 focus:ring-yellow-400"
                aria-label="Search events"
              />
            </div>
              <div className="flex gap-4 w-full sm:w-auto">
                <select
                  id="category-filter"
                  multiple
                  value={category}
                  onChange={e => setCategory(Array.from(e.target.selectedOptions, o => o.value))}
                  className="min-w-[120px] rounded-lg border-gray-200 px-4 py-2 bg-white shadow text-gray-700 text-base sm:text-sm h-20"
                  aria-label="Filter by category"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select
                  id="sort-filter"
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="min-w-[120px] rounded-lg border-gray-200 px-4 py-2 bg-white shadow text-gray-700 text-base sm:text-sm"
                  aria-label="Sort events"
                >
                  <option value="date-asc">Date (Soonest)</option>
                  <option value="date-desc">Date (Latest)</option>
                  <option value="price-asc">Price (Lowest)</option>
                  <option value="price-desc">Price (Highest)</option>
                </select>
              </div>
              {/* Multi-category filter */}
              <div className="flex flex-col gap-1 min-w-[140px]">
                <label htmlFor="category-filter" className="text-xs font-semibold text-gray-600">Category</label>
                <select
                  id="category-filter"
                  multiple
                  value={category}
                  onChange={e => setCategory(Array.from(e.target.selectedOptions, o => o.value))}
                  className="rounded-lg border-gray-200 px-4 py-2 bg-white shadow text-gray-700 text-base sm:text-sm h-20"
                  aria-label="Filter by category"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              {/* Multi-location filter */}
              <div className="flex flex-col gap-1 min-w-[140px]">
                <label htmlFor="location-filter" className="text-xs font-semibold text-gray-600">Location</label>
                <select
                  id="location-filter"
                  multiple
                  value={location}
                  onChange={e => setLocation(Array.from(e.target.selectedOptions, o => o.value))}
                  className="rounded-lg border-gray-200 px-4 py-2 bg-white shadow text-gray-700 text-base sm:text-sm h-20"
                  aria-label="Filter by location"
                >
                  {areas.filter(a => a !== 'All Areas').map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {/* Date picker */}
              <div className="flex flex-col gap-1 min-w-[140px]">
                <label htmlFor="date-filter" className="text-xs font-semibold text-gray-600">Date</label>
                <input
                  id="date-filter"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="rounded-lg border-gray-200 px-4 py-2 bg-white shadow text-gray-700 text-base sm:text-sm"
                  aria-label="Filter by date"
                />
              </div>
          </div>

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
              <p className="mb-4 text-base sm:text-lg">Try adjusting your search, filters, or check back later for new events.</p>
              <Link href="/create-event" className="inline-block bg-yellow-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold shadow hover:bg-yellow-600 transition text-base sm:text-lg whitespace-nowrap">Create an Event</Link>
            </div>
          )}

          {/* Events grid */}
          {!loading && filteredUpcomingEvents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredUpcomingEvents.map(event => {
                // Event status
                const now = new Date();
                const eventDate = new Date(event.date);
                let status = 'upcoming';
                if (eventDate < now) status = 'past';
                if (eventDate.toDateString() === now.toDateString()) status = 'ongoing';
                // Social proof placeholder
                const attendees = (event as any).attendees_count || Math.floor(Math.random() * 100 + 1);
                return (
                  <div key={event.id} className="relative group focus-within:ring-2 focus-within:ring-yellow-400" tabIndex={0} aria-label={event.name} role="listitem">
                    {/* Status badge */}
                    <span className={`absolute top-2 left-2 z-20 px-2 sm:px-3 py-1 rounded-full text-xs font-bold shadow-lg ${status === 'upcoming' ? 'bg-blue-100 text-blue-700' : status === 'ongoing' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    {/* Featured badge */}
                    {event.featured && <span className="absolute top-2 right-2 z-20 px-2 sm:px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-lg">Featured</span>}
                    {/* New badge */}
                    {event.created_at && (now.getTime() - new Date(event.created_at).getTime() < 1000 * 60 * 60 * 24 * 7) && (
                      <span className="absolute bottom-2 left-2 z-20 px-2 sm:px-3 py-1 rounded-full text-xs font-bold bg-green-200 text-green-800 shadow">New</span>
                    )}
                    {/* Popular badge (placeholder logic) */}
                    {attendees > 50 && <span className="absolute bottom-2 right-2 z-20 px-2 sm:px-3 py-1 rounded-full text-xs font-bold bg-pink-200 text-pink-800 shadow">Popular</span>}
                    <EventCard event={event} onClick={() => { setSelectedEvent(event); setDialogOpen(true); }} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Back to Top button */}
          {showBackToTop && (
            <button
              className="fixed right-4 sm:right-8 z-50 bg-yellow-500 text-white p-2 sm:p-3 rounded-full shadow-lg hover:bg-yellow-600 transition flex items-center focus:outline-none focus:ring-2 focus:ring-yellow-400"
              style={{ bottom: isSyncing ? '5.5rem' : '2rem' }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Back to top"
            >
              <FiChevronUp size={20} className="sm:w-6 sm:h-6 w-5 h-5" />
            </button>
          )}
        </div>
      </section>

      {filteredPreviousEvents.length > 0 && (
        <section className="py-12 px-4 sm:px-8 bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Previous Events</h2>
              <p className="text-gray-600">Browse events that have already taken place.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-8">
              {filteredPreviousEvents.map(event => (
                <EventCard key={event.id} event={event} onClick={() => { setSelectedEvent(event); setDialogOpen(true); }} />
              ))}
            </div>
          </div>
        </section>
      )}

      <AppFooter />
      <EventModal selectedEvent={selectedEvent} host={host} dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} />
    </div>
  );
}
