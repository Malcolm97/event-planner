'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Header from '../../components/Header';
import EventCard, { Event } from '../../components/EventCard';
import { FiMusic, FiCamera, FiCoffee, FiMonitor, FiHeart, FiSmile, FiUsers, FiBook, FiTrendingUp, FiStar } from 'react-icons/fi';

const categories = [
  { name: 'Music', icon: FiMusic, color: 'bg-purple-100 text-purple-600', description: 'Concerts, festivals, and live performances' },
  { name: 'Art', icon: FiCamera, color: 'bg-pink-100 text-pink-600', description: 'Exhibitions, galleries, and creative workshops' },
  { name: 'Food', icon: FiCoffee, color: 'bg-orange-100 text-orange-600', description: 'Food festivals, cooking classes, and tastings' },
  { name: 'Technology', icon: FiMonitor, color: 'bg-blue-100 text-blue-600', description: 'Tech conferences, workshops, and meetups' },
  { name: 'Wellness', icon: FiHeart, color: 'bg-green-100 text-green-600', description: 'Yoga, meditation, and health workshops' },
  { name: 'Comedy', icon: FiSmile, color: 'bg-yellow-100 text-yellow-600', description: 'Stand-up shows, improv, and entertainment' },
  { name: 'Business', icon: FiTrendingUp, color: 'bg-indigo-100 text-indigo-600', description: 'Networking, conferences, and seminars' },
  { name: 'Education', icon: FiBook, color: 'bg-teal-100 text-teal-600', description: 'Workshops, courses, and learning sessions' },
  { name: 'Community', icon: FiUsers, color: 'bg-red-100 text-red-600', description: 'Local meetups, social events, and gatherings' },
  { name: 'Festival', icon: FiStar, color: 'bg-fuchsia-100 text-fuchsia-600', description: 'Festivals and large celebrations' },
  { name: 'Conference', icon: FiTrendingUp, color: 'bg-cyan-100 text-cyan-600', description: 'Professional and industry conferences' },
  { name: 'Workshop', icon: FiBook, color: 'bg-lime-100 text-lime-600', description: 'Hands-on learning and workshops' },
  { name: 'Sports', icon: FiStar, color: 'bg-amber-100 text-amber-600', description: 'Sports events and competitions' },
  { name: 'Meetup', icon: FiUsers, color: 'bg-gray-100 text-gray-600', description: 'Casual meetups and gatherings' },
];
// Categories now match event creation page exactly

function UpcomingPreviousSlider({ events, categories, type, selectedCategory, loading }: {
  events: Event[];
  categories: any[];
  type: 'upcoming' | 'previous';
  selectedCategory: string;
  loading: boolean;
}) {
  const [slide, setSlide] = useState(0);
  const now = new Date();
  const filtered = events
    .filter(ev => ev.date && (type === 'upcoming' ? new Date(ev.date) >= now : new Date(ev.date) < now))
    .sort((a, b) => type === 'upcoming'
      ? new Date(a.date).getTime() - new Date(b.date).getTime()
      : new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  const perSlide = 3;
  const maxSlide = Math.max(0, Math.ceil(filtered.length / perSlide) - 1);
  const eventsToShow = filtered.slice(slide * perSlide, slide * perSlide + perSlide);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {selectedCategory === 'All'
            ? (type === 'upcoming' ? 'Upcoming Events' : 'Previous Events')
            : `${type === 'upcoming' ? 'Upcoming' : 'Previous'} ${selectedCategory} Events`}
        </h2>
        <div className="text-sm text-gray-500">
          {filtered.length} event{filtered.length !== 1 ? 's' : ''} found
        </div>
      </div>
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading events...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventsToShow.map(event => (
              <div key={event.id} className="relative">
                <EventCard event={event} />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    categories.find(cat => cat.name === event.category)?.color || 'bg-gray-100 text-gray-600'
                  }`}>
                    {event.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {filtered.length > perSlide && (
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => setSlide(s => Math.max(0, s - 1))}
                disabled={slide === 0}
                className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50"
                aria-label="Previous slide"
              >
                &larr;
              </button>
              <button
                onClick={() => setSlide(s => Math.min(maxSlide, s + 1))}
                disabled={slide === maxSlide}
                className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50"
                aria-label="Next slide"
              >
                &rarr;
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No {type} events found</h3>
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const initialCategory = (() => {
    const param = searchParams?.get('category');
    if (param && categories.some(cat => cat.name === param)) return param;
    return 'All';
  })();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'events'));
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

  const getEventCategory = (event: Event): string => {
    const eventName = event.name?.toLowerCase() || '';
    const eventDesc = event.description?.toLowerCase() || '';
    const eventLocation = event.location?.toLowerCase() || '';
    
    const text = `${eventName} ${eventDesc} ${eventLocation}`;
    
    for (const category of categories) {
      const categoryName = category.name.toLowerCase();
      if (text.includes(categoryName) || 
          text.includes(categoryName.slice(0, -1)) || // singular form
          (categoryName === 'technology' && (text.includes('tech') || text.includes('digital'))) ||
          (categoryName === 'wellness' && (text.includes('health') || text.includes('fitness'))) ||
          (categoryName === 'business' && (text.includes('network') || text.includes('conference'))) ||
          (categoryName === 'education' && (text.includes('workshop') || text.includes('training'))) ||
          (categoryName === 'community' && (text.includes('meetup') || text.includes('social')))) {
        return category.name;
      }
    }
    return 'Community'; // Default category
  };

  const categorizedEvents = categories.reduce((acc, category) => {
    acc[category.name] = events.filter(event => event.category === category.name);
    return acc;
  }, {} as Record<string, Event[]>);

  const filteredEvents = selectedCategory === 'All' 
    ? events.filter(event => 
        event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : events.filter(event => 
        event.category === selectedCategory && (
          event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f6fb]">
      <Header />
      
      {/* Hero Section */}
      <section className="w-full py-16 px-4 sm:px-8 bg-gradient-to-b from-[#e0c3fc] to-[#8ec5fc]">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Explore by Category
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Discover events that match your interests. From music and art to technology and wellness,
            find experiences tailored to your passions.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow"
            />
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="max-w-6xl mx-auto w-full py-12 px-4 sm:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Choose Your Interest</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`p-6 rounded-xl border-2 transition-all duration-200 ${
              selectedCategory === 'All'
                ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-105'
                : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={`p-3 rounded-full ${selectedCategory === 'All' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                <FiStar size={24} />
              </div>
              <span className="font-semibold text-gray-900">All Events</span>
              <span className="text-xs text-gray-500">{events.length} events</span>
            </div>
          </button>
          
          {categories.map((category) => {
            const Icon = category.icon;
            const now = new Date();
            const eventCount = (categorizedEvents[category.name] || []).filter(ev => ev.date && new Date(ev.date) >= now).length;
            
            return (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                  selectedCategory === category.name
                    ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-105'
                    : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-3 rounded-full ${category.color}`}>
                    <Icon size={24} />
                  </div>
                  <span className="font-semibold text-gray-900">{category.name}</span>
                  <span className="text-xs text-gray-500 text-center">{category.description}</span>
                  <span className="text-xs text-indigo-600 font-medium">{eventCount} events</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Upcoming Events Display */}
      <section className="max-w-6xl mx-auto w-full py-8 px-4 sm:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedCategory === 'All' ? 'Upcoming Events' : `Upcoming ${selectedCategory} Events`}
          </h2>
          <div className="text-sm text-gray-500">
            {(() => {
              const now = new Date();
              const upcoming = filteredEvents.filter(ev => ev.date && new Date(ev.date) >= now);
              return `${upcoming.length} event${upcoming.length !== 1 ? 's' : ''} found`;
            })()}
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading events...</p>
          </div>
        ) : (() => {
          const now = new Date();
          const upcoming = filteredEvents.filter(ev => ev.date && new Date(ev.date) >= now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          if (upcoming.length > 0) {
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map(event => (
                  <div key={event.id} className="relative">
                    <EventCard event={event} />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        categories.find(cat => cat.name === event.category)?.color || 'bg-gray-100 text-gray-600'
                      }`}>
                        {event.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          } else {
            return (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming events found</h3>
              </div>
            );
          }
        })()}
      </section>
      {/* Previous Events Display */}
      <section className="max-w-6xl mx-auto w-full py-8 px-4 sm:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedCategory === 'All' ? 'Previous Events' : `Previous ${selectedCategory} Events`}
          </h2>
          <div className="text-sm text-gray-500">
            {(() => {
              const now = new Date();
              const previous = filteredEvents.filter(ev => ev.date && new Date(ev.date) < now);
              return `${previous.length} event${previous.length !== 1 ? 's' : ''} found`;
            })()}
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading events...</p>
          </div>
        ) : (() => {
          const now = new Date();
          const previous = filteredEvents
            .filter(ev => ev.date && new Date(ev.date) < now)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          if (previous.length > 0) {
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {previous.map(event => (
                  <div key={event.id} className="relative">
                    <EventCard event={event} />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        categories.find(cat => cat.name === event.category)?.color || 'bg-gray-100 text-gray-600'
                      }`}>
                        {event.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          } else {
            return (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No previous events found</h3>
              </div>
            );
          }
        })()}
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