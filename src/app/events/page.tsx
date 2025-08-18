'use client';

import Header from '../../components/Header';
import { useState, useEffect } from 'react';
import { supabase, TABLES, Event } from '../../lib/supabase';
import EventCard from '../../components/EventCard';
import { FiMapPin, FiCalendar, FiDollarSign } from 'react-icons/fi';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState('All Areas');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from(TABLES.EVENTS)
          .select('*')
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching events:', error);
          return;
        }

        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Extract unique areas from events
  const locationAreas = events.map(event => event.location?.split(',')[0]).filter(Boolean);
  const areas = ['All Areas', ...Array.from(new Set(locationAreas))];

  const now = new Date();
  const upcomingEvents = events.filter(event => event.date && new Date(event.date) >= now);      

  const filteredEvents = selectedArea === 'All Areas' 
    ? upcomingEvents 
    : upcomingEvents.filter(event => event.location?.includes(selectedArea));

  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* Hero Section */}
      <section className="w-full py-16 px-4 sm:px-8 bg-gradient-to-br from-yellow-300 to-red-600 border-b border-black">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Events by Location
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Find events happening in your area. Filter by location to discover what's happening near you.
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="py-8 px-4 sm:px-8 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <FiMapPin className="text-yellow-600 text-xl" />
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Area Cards */}
      <section className="py-12 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Popular Areas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {areas.slice(1).map(area => {
              const areaEvents = events.filter(event => event.location?.includes(area));
              const upcomingCount = areaEvents.filter(event => event.date && new Date(event.date) >= now).length;
              
              return (
                <div
                  key={area}
                  onClick={() => setSelectedArea(area)}
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

      {/* All Upcoming Events Section */}
      <section className="py-16 px-4 sm:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {selectedArea === 'All Areas' ? 'All Upcoming Events' : `${selectedArea} Events`}
            </h2>
            <p className="text-gray-600 text-lg">
              Showing {filteredEvents.length} upcoming event{filteredEvents.length !== 1 ? 's' : ''}
              {selectedArea !== 'All Areas' && ` in ${selectedArea}`}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="text-gray-500 mt-6 text-lg">Loading events...</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
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

      {/* Footer */}
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
    </div>
  );
}