"use client";
import AppFooter from '@/components/AppFooter';

// Offline mode detection
const isOffline = typeof window !== 'undefined' && !navigator.onLine;
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase, TABLES, User } from '@/lib/supabase';
import { EventItem } from '../../lib/types';
import { useEvents, useOfflineFirstData } from '@/hooks/useOfflineFirstData';
import EventCard from '@/components/EventCard';
import { FiStar, FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile } from 'react-icons/fi';
import EventModal from '@/components/EventModal';
import Link from 'next/link';
import { useNetworkStatus } from '@/context/NetworkStatusContext';

// Define categories and their properties
const allCategories = [
  { name: 'All Events', icon: 'FiStar', color: 'bg-gray-200 text-gray-800' },
  { name: 'Music', icon: 'FiMusic', color: 'bg-purple-100 text-purple-600' },
  { name: 'Art', icon: 'FiImage', color: 'bg-pink-100 text-pink-600' },
  { name: 'Food', icon: 'FiCoffee', color: 'bg-orange-100 text-orange-600' },
  { name: 'Technology', icon: 'FiCpu', color: 'bg-blue-100 text-blue-600' },
  { name: 'Wellness', icon: 'FiHeart', color: 'bg-green-100 text-green-600' },
  { name: 'Comedy', icon: 'FiSmile', color: 'bg-yellow-100 text-yellow-600' },
  { name: 'Other', icon: 'FiStar', color: 'bg-gray-100 text-gray-600' }, // Ensure 'Other' has an icon
];

const categoryIconMap: { [key: string]: React.ElementType } = { // Use React.ElementType for type safety
  'FiStar': FiStar,
  'FiMusic': FiMusic,
  'FiImage': FiImage,
  'FiCoffee': FiCoffee,
  'FiCpu': FiCpu,
  'FiHeart': FiHeart,
  'FiSmile': FiSmile,
};

const categoryColorMap: { [key: string]: string } = {
  'All Events': 'bg-gray-200 text-gray-800',
  'Music': 'bg-purple-100 text-purple-600',
  'Art': 'bg-pink-100 text-pink-600',
  'Food': 'bg-orange-100 text-orange-600',
  'Technology': 'bg-blue-100 text-blue-600',
  'Wellness': 'bg-green-100 text-green-600',
  'Comedy': 'bg-yellow-100 text-yellow-600',
  'Other': 'bg-gray-100 text-gray-700', // Ensure 'Other' has a color
};

interface CategoriesPageContentInnerProps {
  initialEvents: EventItem[];
  initialDisplayCategories: typeof allCategories;
  initialTotalEvents: number | null;
  initialTotalUsers: number | null;
  initialCitiesCovered: number;
}

// Hook to get events from IndexedDB when offline
const useOfflineEvents = (setEvents: (events: EventItem[]) => void) => {
  useEffect(() => {
    const loadOfflineEvents = async () => {
      if (!navigator.onLine) {
        try {
          const { getItems } = await import('../../lib/indexedDB');
          const offlineEvents = await getItems('events');
          if (offlineEvents.length > 0) {
            setEvents(offlineEvents as EventItem[]);
          }
        } catch (error) {
          // ...existing code...
        }
      }
    };
    loadOfflineEvents();
  }, [setEvents]);
}

function CategoriesPageContentInner({ initialEvents, initialDisplayCategories, initialTotalEvents, initialTotalUsers, initialCitiesCovered }: CategoriesPageContentInnerProps) {
  const { data: events = [], isLoading: loading } = useEvents();
  const { data: users = [] } = useOfflineFirstData<User>(TABLES.USERS);
  const { isOnline } = useNetworkStatus();
  const [displayCategories] = useState<typeof allCategories>(initialDisplayCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Events');
  const now = new Date();

  const selectedCategoryInfo = displayCategories.find(cat => cat.name === selectedCategory);
  const Icon = selectedCategoryInfo?.icon ? categoryIconMap[selectedCategoryInfo.icon] : FiStar;

  // Modal states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [host, setHost] = useState<User | null>(null);

  // Fetch host details based on the event's creator ID
  const fetchHost = async (userId: string) => {
    try {
      // First try to find user in cached data
      const cachedUser = users.find(user => user.id === userId);
      if (cachedUser) {
        setHost(cachedUser);
        return;
      }

      // If not in cache and online, fetch from server
      if (isOnline) {
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
      } else {
        // Offline and not in cache
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

  const filteredEvents = events.filter(event => {
    if (!selectedCategory || selectedCategory === 'All Events') return true;
    return event.category === selectedCategory;
  });

  const upcomingEvents = filteredEvents.filter(event => {
    if (!event.date) return false;
    return new Date(event.date) >= now;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="w-full py-16 px-4 sm:px-8 bg-gradient-to-br from-yellow-300 to-red-600 border-b border-black">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            {selectedCategory !== 'All Events' ? `${selectedCategory} Events` : 'All Categories'}
          </h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            {selectedCategory !== 'All Events'
              ? `Discover amazing ${selectedCategory.toLowerCase()} events happening near you.`
              : 'Explore events by category and find something that interests you.'
            }
          </p>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="py-12 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Browse by Category</h2>
          {isOffline && (
            <div className="text-center mb-4">
              <div className="inline-block bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold text-base">Offline Mode: Registration, login, and event creation are disabled.</div>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {displayCategories
              .filter(cat => {
                // Always show "All Events" category
                if (cat.name === 'All Events') return true;

                // Only show other categories that have upcoming events
                const upcomingEvents = events.filter(event => {
                  if (!event.date) return false;
                  return new Date(event.date) >= new Date();
                });

                if (cat.name === 'Other') {
                  const predefinedCategoryNames = allCategories.filter(c => c.name !== 'Other').map(c => c.name);
                  return upcomingEvents.some(ev => ev.category && !predefinedCategoryNames.includes(ev.category));
                } else {
                  return upcomingEvents.some(ev => ev.category === cat.name);
                }
              })
              .map((cat) => {
              const CategoryIcon = categoryIconMap[cat.icon];
              return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`card-hover flex flex-col items-center justify-center gap-3 px-6 py-8 rounded-2xl border-2 border-border-color font-bold shadow-lg hover:shadow-xl hover:border-yellow-400 transition-all duration-300 min-h-[140px] ${cat.color} group ${selectedCategory === cat.name ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}`}
                  >
                    <span className="flex items-center justify-center w-12 h-12 rounded-full bg-card-background border-2 border-border-color group-hover:border-yellow-400 transition-all duration-300 shadow-md">
                      <CategoryIcon size={28} />
                    </span>
                    <span className="text-base font-bold text-center">{cat.name}</span>
                  </button>
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
              {selectedCategory !== 'All Events' ? `${selectedCategory} Events` : 'All Events'}
            </h2>
            <p className="text-gray-600 text-lg">
              {selectedCategory !== 'All Events'
                ? `Showing ${upcomingEvents.length} upcoming ${selectedCategory.toLowerCase()} events`
                : `Showing ${upcomingEvents.length} upcoming events across all categories`
              }
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="text-gray-500 mt-6 text-lg">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📴</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No cached events available offline</h3>
              <p className="text-gray-500">Connect to the internet to load events for offline use.</p>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-4 md:gap-8">
              {upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} onClick={() => { setSelectedEvent(event); setDialogOpen(true); }} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {selectedCategory !== 'All Events' ? `No ${selectedCategory} events found` : 'No events found'}
              </h3>
              <p className="text-gray-500">
                {selectedCategory !== 'All Events'
                  ? `Check back later for ${selectedCategory.toLowerCase()} events.`
                  : 'Check back later for new events.'
                }
              </p>
            </div>
          )}
        </div>
      </section>
<EventModal selectedEvent={selectedEvent} host={host} dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} />

      <AppFooter />
    </div>
  );
}

export default function CategoriesPageContent({ initialEvents, initialDisplayCategories, initialTotalEvents, initialTotalUsers, initialCitiesCovered }: CategoriesPageContentInnerProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-gray-500 mt-6 text-lg">Loading categories...</p>
        </div>
      </div>
    }>
<CategoriesPageContentInner
        initialEvents={initialEvents}
        initialDisplayCategories={initialDisplayCategories}
        initialTotalEvents={initialTotalEvents}
        initialTotalUsers={initialTotalUsers}
        initialCitiesCovered={initialCitiesCovered}
      />
    </Suspense>
  );
}
