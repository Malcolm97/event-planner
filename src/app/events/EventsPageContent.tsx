'use client';

import Header from '../../components/Header';
import { useState, useEffect } from 'react';
import { supabase, TABLES, Event, User } from '../../lib/supabase';
import EventCard from '../../components/EventCard';
import { FiMapPin, FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile, FiStar } from 'react-icons/fi';
import EventModal from '../../components/EventModal';
import { EventItem } from '@/lib/types';

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
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState('All Areas');

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
        console.error('Error fetching host:', error.message || error);
        return;
      }

      if (data && data.length > 0) {
        setHost(data[0]);
      } else {
        setHost(null);
      }
    } catch (err: any) {
      console.error('Error fetching host:', err.message || err);
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
    <div className="min-h-screen bg-white">
      <Header />
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
          <div className="flex items-center gap-4">
            <FiMapPin className="text-yellow-600 text-xl" />
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value ?? 'All Areas')}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="text-gray-500 mt-6 text-lg">Loading events...</p>
            </div>
          ) : filteredUpcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredUpcomingEvents.map(event => (
                <EventCard key={event.id} event={event} onClick={() => { setSelectedEvent(event); setDialogOpen(true); }} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming events found</h3>
              <p className="text-gray-500">
                {selectedArea === 'All Areas' 
                  ? 'No upcoming events found. Check back later!'
                  : `No upcoming events found in ${selectedArea}. Try selecting a different area.`
                }
              </p>
            </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredPreviousEvents.map(event => (
                <EventCard key={event.id} event={event} onClick={() => { setSelectedEvent(event); setDialogOpen(true); }} />
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="w-full py-8 px-4 sm:px-8 bg-black border-t border-red-600">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
          <div className="flex gap-6 mb-2 md:mb-0">
            <a href="/events" className="hover:text-yellow-300 text-white">Events</a>
            <a href="/categories" className="hover:text-yellow-300 text-white">Categories</a>
            <a href="/about" className="hover:text-yellow-300 text-white">About</a>
          </div>
          <div className="text-center text-white">© 2025 PNG Events. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-yellow-300 text-white">Terms</a>
            <a href="#" className="hover:text-yellow-300 text-white">Privacy</a>
          </div>
        </div>
      </footer>
      <EventModal selectedEvent={selectedEvent} host={host} dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} />
    </div>
  );
}
