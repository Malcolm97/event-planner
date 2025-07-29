'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Header from '../../components/Header';
import EventCard, { Event } from '../../components/EventCard';
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
      
      // Filter upcoming events and sort by date
      const upcomingEvents = eventsData
        .filter(event => {
          const eventDate = new Date(event.date || event.createdAt);
          return eventDate >= new Date();
        })
        .sort((a, b) => {
          const dateA = new Date(a.date || a.createdAt);
          const dateB = new Date(b.date || b.createdAt);
          return dateA.getTime() - dateB.getTime();
        });
      
      setEvents(upcomingEvents);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredEvents = selectedArea === 'All Areas' 
    ? events 
    : events.filter(event => event.location?.includes(selectedArea));

  const groupedEvents = areas.reduce((acc, area) => {
    acc[area] = events.filter(event => event.location?.includes(area));
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

      {/* Events by Area Slider */}
      <section className="max-w-6xl mx-auto w-full py-12 px-4 sm:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Events by Area</h2>
          <div className="flex gap-2">
            <button 
              onClick={prevSlide}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition"
            >
              ←
            </button>
            <button 
              onClick={nextSlide}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition"
            >
              →
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {areas.map((area, index) => (
              <div key={area} className="w-full flex-shrink-0 px-2">
                <div className="bg-white rounded-xl p-6 shadow border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiMapPin className="text-indigo-600" />
                    {area}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedEvents[area]?.slice(0, 6).map(event => (
                      <EventCard key={event.id} event={event} />
                    )) || (
                      <div className="col-span-full text-center text-gray-500 py-8">
                        No events found in {area}
                      </div>
                    )}
                  </div>
                  {groupedEvents[area]?.length > 6 && (
                    <div className="text-center mt-4">
                      <button className="text-indigo-600 hover:text-indigo-700 font-medium">
                        View all {groupedEvents[area].length} events in {area}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {areas.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition ${
                index === currentSlide ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </section>

      {/* All Events List */}
      <section className="max-w-6xl mx-auto w-full py-12 px-4 sm:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {selectedArea === 'All Areas' ? 'All Upcoming Events' : `Events in ${selectedArea}`}
        </h2>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 mb-6">
              {selectedArea === 'All Areas' 
                ? "There are no upcoming events at the moment." 
                : `No upcoming events found in ${selectedArea}.`}
            </p>
            <button 
              onClick={() => setSelectedArea('All Areas')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              View All Areas
            </button>
          </div>
        )}
      </section>

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