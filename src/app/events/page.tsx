'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Header from '../../components/Header';
import EventCard, { Event } from '../../components/EventCard';
import CompactEventCard from '../../components/CompactEventCard';
import { FiMapPin, FiCalendar, FiFilter } from 'react-icons/fi';

const areas = [
  'Port Moresby',
  'Lae',
  'Mount Hagen',
  'Madang',
  'Wewak',
  'Vanimo',
  'Kerema',
  'Daru',
  'Mendi',
  'Popondetta'
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<string>('All Areas');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Event));
      setEvents(eventsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const now = new Date();
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date || event.createdAt);
    return eventDate >= now;
  });
  const previousEvents = events.filter(event => {
    const eventDate = new Date(event.date || event.createdAt);
    return eventDate < now;
  });

  const filteredEvents = selectedArea === 'All Areas' 
    ? upcomingEvents 
    : upcomingEvents.filter(event => event.location?.includes(selectedArea));

  const filteredPreviousEvents = selectedArea === 'All Areas'
    ? previousEvents
    : previousEvents.filter(event => event.location?.includes(selectedArea));

  const groupedEvents = areas.reduce((acc, area) => {
    acc[area] = upcomingEvents.filter(event => event.location?.includes(area));
    return acc;
  }, {} as Record<string, Event[]>);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % areas.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + areas.length) % areas.length);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f6fb]">
      <Header />
      
      {/* Hero Section */}
      <section className="w-full py-16 px-4 sm:px-8 bg-gradient-to-b from-[#e0c3fc] to-[#8ec5fc]">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Discover Amazing Events
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Find the perfect events happening in your area. From concerts to workshops, 
            discover experiences that matter to you.
          </p>
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
            <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow">
              <FiMapPin className="text-indigo-600" />
              <select 
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="bg-transparent focus:outline-none text-gray-900"
              >
                <option value="All Areas">All Areas</option>
                {areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FiCalendar />
              <span className="text-sm">Showing upcoming events</span>
            </div>
          </div>
        </div>
      </section>

      {/* Events by Area Grid */}
      <section className="max-w-6xl mx-auto w-full py-12 px-4 sm:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Events by Area</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {areas.map(area => {
            const areaEvents = upcomingEvents.filter(event => event.location?.includes(area));
            return (
              <div
                key={area}
                className={`bg-white rounded-xl p-6 shadow border border-gray-200 cursor-pointer hover:shadow-lg transition flex flex-col h-full ${selectedArea === area ? 'ring-2 ring-indigo-500' : ''}`}
                onClick={() => setSelectedArea(area)}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FiMapPin className="text-indigo-600" />
                  {area}
                </h3>
                <div className="text-xs text-gray-500 mb-2">{areaEvents.length} upcoming event{areaEvents.length !== 1 ? 's' : ''}</div>
                <div className="flex flex-col gap-1 mb-2">
                  {areaEvents.slice(0, 3).map(event => (
                    <CompactEventCard key={event.id} event={event} />
                  ))}
                  {areaEvents.length === 0 && (
                    <div className="text-gray-400 text-sm text-center py-4">No events found in {area}</div>
                  )}
                </div>
                {areaEvents.length > 3 && (
                  <div className="text-center mt-2">
                    <span className="text-indigo-600 hover:text-indigo-700 font-medium text-xs">+ {areaEvents.length - 3} more</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Location Events Section */}
      {selectedArea !== 'All Areas' && (
        <section className="max-w-6xl mx-auto w-full py-8 px-4 sm:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Events in {selectedArea}</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading events...</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🎭</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No events found</h3>
              <p className="text-gray-500 mb-4">No upcoming events found in {selectedArea}.</p>
              <button 
                onClick={() => setSelectedArea('All Areas')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
              >
                View All Areas
              </button>
            </div>
          )}
        </section>
      )}

      {/* All Events List */}
      <section className="max-w-6xl mx-auto w-full py-12 px-4 sm:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          All Upcoming Events
        </h2>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading events...</p>
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 mb-6">There are no upcoming events at the moment.</p>
            <button 
              onClick={() => setSelectedArea('All Areas')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              View All Areas
            </button>
          </div>
        )}
      </section>

      {/* Previous Events Section */}
      {filteredPreviousEvents.length > 0 && (
        <section className="max-w-6xl mx-auto w-full py-8 px-4 sm:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Previous Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPreviousEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="w-full py-8 px-4 sm:px-8 bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
          <div className="flex gap-6 mb-2 md:mb-0">
            <a href="/events" className="hover:text-indigo-600">Events</a>
            <a href="/categories" className="hover:text-indigo-600">Categories</a>
            <a href="/about" className="hover:text-indigo-600">About</a>
          </div>
          <div className="text-center">© 2025 PNG Events. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-indigo-600">Terms</a>
            <a href="#" className="hover:text-indigo-600">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}