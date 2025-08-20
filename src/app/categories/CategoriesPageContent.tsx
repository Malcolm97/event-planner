'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase, TABLES, Event, User, isSupabaseConfigured } from '../../lib/supabase'; // Added User and isSupabaseConfigured
import EventCard from '../../components/EventCard';
import { FiStar, FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile } from 'react-icons/fi';

// Define categories and their properties
const allCategories = [
  { name: 'All Categories', icon: FiStar, color: 'bg-gray-200 text-gray-800' },
  { name: 'Music', icon: FiMusic, color: 'bg-purple-100 text-purple-600' },
  { name: 'Art', icon: FiImage, color: 'bg-pink-100 text-pink-600' },
  { name: 'Food', icon: FiCoffee, color: 'bg-orange-100 text-orange-600' },
  { name: 'Technology', icon: FiCpu, color: 'bg-blue-100 text-blue-600' },
  { name: 'Wellness', icon: FiHeart, color: 'bg-green-100 text-green-600' },
  { name: 'Comedy', icon: FiSmile, color: 'bg-yellow-100 text-yellow-600' },
  { name: 'Other', icon: FiSmile, color: 'bg-gray-100 text-gray-600' }, // Added 'Other' category
];

const categoryIconMap: { [key: string]: any } = {
  'All Categories': FiStar,
  'Music': FiMusic,
  'Art': FiImage,
  'Food': FiCoffee,
  'Technology': FiCpu,
  'Wellness': FiHeart,
  'Comedy': FiSmile,
};

const categoryColorMap: { [key: string]: string } = {
  'All Categories': 'bg-gray-200 text-gray-800',
  'Music': 'bg-purple-100 text-purple-600',
  'Art': 'bg-pink-100 text-pink-600',
  'Food': 'bg-orange-100 text-orange-600',
  'Technology': 'bg-blue-100 text-blue-600',
  'Wellness': 'bg-green-100 text-green-600',
  'Comedy': 'bg-yellow-100 text-yellow-600',
};

function CategoriesPageContentInner() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const [events, setEvents] = useState<Event[]>([]);
  const [displayCategories, setDisplayCategories] = useState<typeof allCategories>([]); // New state for filtered categories
  const [loading, setLoading] = useState(true);

  // Modal states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [host, setHost] = useState<User | null>(null); // State for host details

  useEffect(() => {
    const fetchAndFilterCategories = async () => {
      try {
        setLoading(true);

        // Check if Supabase is properly configured
        if (!isSupabaseConfigured()) {
          console.warn('Supabase not configured. Please update your .env.local file with valid Supabase credentials.');
          setEvents([]);
          setDisplayCategories([]);
          setLoading(false);
          return;
        }

        // 1. Fetch all events
        const { data, error } = await supabase
          .from(TABLES.EVENTS)
          .select('*')
          .gte('date', now.toISOString()) // Filter for upcoming events
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching events:', error);
          setEvents([]);
          setDisplayCategories([]);
          setLoading(false);
          return;
        }

        setEvents(data || []); // Set all events

        // 2. Determine active categories
        const activeCategoryNames = new Set<string>();
        data?.forEach(event => {
          if (event.category) {
            activeCategoryNames.add(event.category);
          }
        });

        // 3. Filter allCategories array
        const filteredCategories = allCategories.filter(cat =>
          cat.name === 'All Categories' || activeCategoryNames.has(cat.name)
        );

        setDisplayCategories(filteredCategories); // Set the state for categories to display

      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
        setDisplayCategories([]);
        setLoading(false);
      }
    };

    fetchAndFilterCategories();
  }, []); // Fetch only once on mount

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


  const filteredEvents = events.filter(event => {
    if (!category || category === 'All Categories') return true;
    return event.category === category;
  });

  const now = new Date();
  const upcomingEvents = filteredEvents.filter(event => {
    if (!event.date) return false;
    return new Date(event.date) >= now;
  });

  const selectedCategory = displayCategories.find(cat => cat.name === category); // Use displayCategories here
  const Icon = selectedCategory?.icon || FiStar;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="w-full py-16 px-4 sm:px-8 bg-gradient-to-br from-yellow-300 to-red-600 border-b border-black">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            {category ? `${category} Events` : 'All Categories'}
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            {category 
              ? `Discover amazing ${category.toLowerCase()} events happening near you.`
              : 'Explore events by category and find something that interests you.'
            }
          </p>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="py-12 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {displayCategories.map((cat) => { // Use displayCategories here
              const Icon = cat.icon;
              return (
                <a
                  key={cat.name}
                  href={`/categories?category=${encodeURIComponent(cat.name)}`}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-black font-bold shadow-lg hover:bg-yellow-400 hover:text-black transition min-h-[140px] ${cat.color} ${category === cat.name ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}`}
                >
                  <span className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-yellow-400">
                    <Icon size={24} />
                  </span>
                  <span className="text-sm text-center">{cat.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-16 px-4 sm:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {category ? `${category} Events` : 'All Events'}
            </h2>
            <p className="text-gray-600 text-lg">
              {category 
                ? `Showing ${upcomingEvents.length} upcoming ${category.toLowerCase()} events`
                : `Showing ${upcomingEvents.length} upcoming events across all categories`
              }
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="text-gray-500 mt-6 text-lg">Loading events...</p>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} onClick={() => { setSelectedEvent(event); setDialogOpen(true); }} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {category ? `No ${category} events found` : 'No events found'}
              </h3>
              <p className="text-gray-500">
                {category 
                  ? `Check back later for ${category.toLowerCase()} events.`
                  : 'Check back later for new events.'
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

export default function CategoriesPageContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-gray-500 mt-6 text-lg">Loading categories...</p>
        </div>
      </div>
    }>
      <CategoriesPageContentInner />
    </Suspense>
  );
}
