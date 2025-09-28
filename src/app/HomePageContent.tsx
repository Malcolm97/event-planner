'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import EventCard from '@/components/EventCard';
import Button from '@/components/Button';
import { supabase, TABLES, User } from '@/lib/supabase';
import { getEvents as getCachedEvents } from '@/lib/indexedDB';
import { EventItem } from '@/lib/types';
import { FiStar, FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import Link from 'next/link';
import AppFooter from '@/components/AppFooter';
import dynamic from 'next/dynamic';
import { useNetworkStatus } from '@/context/NetworkStatusContext';

const EventModal = dynamic(() => import('@/components/EventModal'), { ssr: false });

// Define categories and their properties
const allCategories = [
  { name: 'Music', icon: FiMusic, color: 'bg-purple-100 text-purple-600' },
  { name: 'Art', icon: FiImage, color: 'bg-pink-100 text-pink-600' },
  { name: 'Food', icon: FiCoffee, color: 'bg-orange-100 text-orange-600' },
  { name: 'Technology', icon: FiCpu, color: 'bg-blue-100 text-blue-600' },
  { name: 'Wellness', icon: FiHeart, color: 'bg-green-100 text-green-600' },
  { name: 'Comedy', icon: FiSmile, color: 'bg-yellow-100 text-yellow-600' },
  { name: 'Other', icon: FiStar, color: 'bg-gray-100 text-gray-700' },
];

const categoryIconMap: { [key: string]: IconType } = {
  'Music': FiMusic,
  'Art': FiImage,
  'Food': FiCoffee,
  'Technology': FiCpu,
  'Wellness': FiHeart,
  'Comedy': FiSmile,
  'Other': FiStar,
};

const serializableCategoryIconMap = Object.keys(categoryIconMap).reduce((acc, key) => {
  acc[key] = key;
  return acc;
}, {} as { [key: string]: string });

const categoryColorMap: { [key: string]: string } = {
  'Music': 'bg-purple-100 text-purple-600',
  'Art': 'bg-pink-100 text-pink-600',
  'Food': 'bg-orange-100 text-orange-600',
  'Technology': 'bg-blue-100 text-blue-600',
  'Wellness': 'bg-green-100 text-green-600',
  'Comedy': 'bg-yellow-100 text-yellow-600',
  'Other': 'bg-gray-100 text-gray-700',
};

const popularPngCities = [
  "Port Moresby", "Lae", "Madang", "Mount Hagen", "Goroka", "Rabaul", "Wewak",
  "Popondetta", "Arawa", "Kavieng", "Daru", "Vanimo", "Kimbe", "Mendi",
  "Kundiawa", "Lorengau", "Wabag", "Kokopo", "Buka", "Alotau"
];

interface HomePageContentProps {
    initialEvents: EventItem[];
    initialTotalEvents: number | null;
    initialTotalUsers: number | null;
    initialCitiesCovered: number | null;
}

export default function HomePageContent({ initialEvents, initialTotalEvents, initialTotalUsers, initialCitiesCovered }: HomePageContentProps) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('All Dates');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('All Areas');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [host, setHost] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [totalEvents, setTotalEvents] = useState<number | null>(initialTotalEvents);
  const [totalUsers, setTotalUsers] = useState<number | null>(initialTotalUsers);
  const [citiesCoveredCount, setCitiesCoveredCount] = useState<number | null>(initialCitiesCovered);
  const router = useRouter();
  const { isOnline, isSyncing } = useNetworkStatus();

  const [displayedLocations, setDisplayedLocations] = useState<string[]>(['All Areas']);
  const [displayedDates, setDisplayedDates] = useState<string[]>(['All Dates']);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();

    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Offline-first: load events from cache if offline
  useEffect(() => {
    const loadOfflineEvents = async () => {
      if (!isOnline) {
        try {
          const offlineEvents = await getCachedEvents();
          if (offlineEvents.length > 0) {
            setEvents(offlineEvents);
            setFilteredEvents(offlineEvents);
          }
        } catch (error) {
          // fallback: show empty state
          setEvents([]);
          setFilteredEvents([]);
        }
      }
    };
    loadOfflineEvents();
  }, [isOnline]);

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

  useEffect(() => {
    if (selectedEvent?.created_by) {
      fetchHost(selectedEvent.created_by);
    } else {
      setHost(null);
    }
  }, [selectedEvent]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents.filter((ev: EventItem) => ev.date && new Date(ev.date) >= now);
  }, [filteredEvents]);

  const previousEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents.filter((ev: EventItem) => ev.date && new Date(ev.date) < now);
  }, [filteredEvents]);

  useEffect(() => {
    const filterEvents = () => {
      let tempEvents = events;

      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        tempEvents = tempEvents.filter((event: EventItem) =>
          event.name.toLowerCase().includes(searchTermLower) ||
          event.location.toLowerCase().includes(searchTermLower) ||
          (event.venue && event.venue.toLowerCase().includes(searchTermLower))
        );
      }

      if (selectedDate !== 'All Dates') {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        tempEvents = tempEvents.filter((event: EventItem) => {
          if (!event.date) return false;
          const eventDate = new Date(event.date);
          switch (selectedDate) {
            case 'Today':
              return eventDate.toDateString() === now.toDateString();
            case 'This Week':
              return eventDate >= now && eventDate <= endOfWeek;
            case 'This Month':
              return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
            default:
              const [monthName, yearString] = selectedDate.split(' ');
              if (monthName && yearString) {
                const selectedMonth = new Date(Date.parse(monthName + " 1, " + yearString)).getMonth();
                const selectedYear = parseInt(yearString);
                return eventDate.getMonth() === selectedMonth && eventDate.getFullYear() === selectedYear;
              }
              return true;
          }
        });
      }

      if (selectedLocationFilter !== 'All Areas') {
        tempEvents = tempEvents.filter((event: EventItem) => {
          if (!event.location) return false;
          const firstPart = event.location.split(',')[0]?.trim();
          if (selectedLocationFilter === 'Other Locations') {
            return firstPart && !popularPngCities.includes(firstPart);
          } else {
            return firstPart === selectedLocationFilter;
          }
        });
      }

      setFilteredEvents(tempEvents);
    };

    filterEvents();
  }, [events, searchTerm, selectedDate, selectedLocationFilter]);

  useEffect(() => {
    const otherLocationEvents = upcomingEvents.filter((event: EventItem) => {
      const firstPart = event.location?.split(',')[0]?.trim();
      return firstPart && !popularPngCities.includes(firstPart);
    });

    const newAvailableLocations = ['All Areas'];
    popularPngCities.forEach(city => {
      if (upcomingEvents.some(event => event.location?.includes(city))) {
        newAvailableLocations.push(city);
      }
    });
    if (otherLocationEvents.length > 0) {
      newAvailableLocations.push('Other Locations');
    }
    setDisplayedLocations(newAvailableLocations);

    const newAvailableDates = ['All Dates'];
    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    if (upcomingEvents.some((event: EventItem) => event.date && new Date(event.date).toDateString() === today.toDateString())) {
      newAvailableDates.push('Today');
    }
    if (upcomingEvents.some((event: EventItem) => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= endOfWeek;
    })) {
      newAvailableDates.push('This Week');
    }
    if (upcomingEvents.some((event: EventItem) => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
    })) {
      newAvailableDates.push('This Month');
    }

    const futureMonths = new Set<string>();
    upcomingEvents.forEach((event: EventItem) => {
      if (event.date) {
        const eventDate = new Date(event.date);
        if (eventDate > today) {
          const monthYear = eventDate.toLocaleString('default', { month: 'long', year: 'numeric' });
          futureMonths.add(monthYear);
        }
      }
    });

    Array.from(futureMonths).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    }).forEach(monthYear => {
      if (!newAvailableDates.includes(monthYear)) {
        newAvailableDates.push(monthYear);
      }
    });

    setDisplayedDates(newAvailableDates);
  }, [events, upcomingEvents]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <section className="w-full py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-yellow-300 to-red-600 border-b border-black">
        {/* Sync indicator */}
        {isSyncing && (
          <div className="w-full text-center py-2 bg-yellow-50 text-yellow-800 font-semibold text-sm animate-pulse">Syncing events...</div>
        )}
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-6 sm:gap-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-2 sm:mb-4 tracking-tight leading-tight">
            Local Events Near You
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-100 max-w-4xl leading-relaxed px-4">
            Find concerts, festivals, workshops, and more happening in your area.
            Create memories with events that matter to you.
          </p>
          <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-4xl mt-2 sm:mt-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input
                className="flex-1 input-field text-base sm:text-lg"
                placeholder="Search events, locations, or venues..."
                aria-label="Search events, locations, or venues"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="input-field w-full sm:w-auto sm:min-w-[140px] text-base sm:text-lg"
                aria-label="Filter by location"
                value={selectedLocationFilter}
                onChange={(e) => setSelectedLocationFilter(e.target.value)}
              >
                {displayedLocations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <select
                className="input-field flex-1 text-base sm:text-lg"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              >
                {displayedDates.map(dateOption => (
                  <option key={dateOption} value={dateOption}>{dateOption}</option>
                ))}
              </select>
              <Button size="lg" aria-label="Find Events">Find Events</Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8 w-full max-w-2xl">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{totalEvents !== null ? totalEvents : '...'}</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-200 font-medium">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{totalUsers !== null ? totalUsers : '...'}</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-200 font-medium">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{citiesCoveredCount !== null ? citiesCoveredCount : '...'}</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-200 font-medium">Cities Covered</div>
            </div>
          </div>
        </div>
      </section>
      <EventModal selectedEvent={selectedEvent} host={host} dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} />

      <section className="max-w-7xl mx-auto w-full section-padding bg-white dark:bg-gray-900">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-4 mb-6">
            <span className="text-2xl">📅</span> Upcoming Events
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-xl max-w-3xl mx-auto leading-relaxed">Discover all upcoming events happening near you.</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-8 text-xl">Loading events...</p>
          </div>
        ) : !isOnline && events.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <div className="text-8xl mb-6">📴</div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">No cached events available offline</h3>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Connect to the internet to load events for offline use.</p>
          </div>
        ) : (
          <>
            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-4 md:gap-8 animate-fade-in">
                {upcomingEvents.slice(0, 4).map(event => (
                  <EventCard key={event.id} event={event} onClick={() => { setSelectedEvent(event); setDialogOpen(true); }} />
                ))}
              </div>
            ) : (
              <div className="col-span-full text-center py-20">
                <div className="text-8xl mb-6">📅</div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">No upcoming events</h3>
                <p className="text-gray-500 dark:text-gray-400 text-lg">Check back later for new events.</p>
                <Button
                  variant="secondary"
                  size="lg"
                  className="mt-8"
                  aria-label="Retry loading events"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            )}
          </>
        )}

          <div className="flex justify-center mt-16">
            <Button asChild size="lg">
              <Link href="/events">
                View all Events
              </Link>
            </Button>
          </div>
      </section>

      <section className="max-w-7xl mx-auto w-full section-padding bg-gray-50 dark:bg-gray-800">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-4 mb-6">
            <span className="text-2xl">✨</span> Featured Events
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-xl max-w-3xl mx-auto leading-relaxed">Featured events will appear here soon!</p>
        </div>
      </section>

      <section className="w-full section-padding bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Explore by Category</h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">Discover events that match your interests</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {allCategories
              .filter(cat => {
                if (cat.name === 'Other') {
                  const predefinedCategoryNames = allCategories.filter(c => c.name !== 'Other').map(c => c.name);
                  return events.some(ev => ev.category && !predefinedCategoryNames.includes(ev.category));
                } else {
                  return events.some(ev => ev.category === cat.name);
                }
              })
              .map((cat) => {
                const Icon = categoryIconMap[cat.name] || FiStar;
                const categoryColor = categoryColorMap[cat.name] || 'bg-yellow-100 text-black';
                return (
                  <Link
                    href={`/categories?category=${encodeURIComponent(cat.name)}`}
                    key={cat.name}
                    className={`card-hover flex flex-col items-center justify-center gap-3 px-6 py-8 rounded-2xl border-2 border-border-color font-bold shadow-lg hover:shadow-xl hover:border-yellow-400 transition-all duration-300 min-h-[140px] ${categoryColor} group`}
                  >
                    <span className="flex items-center justify-center w-12 h-12 rounded-full bg-card-background border-2 border-border-color group-hover:border-yellow-400 transition-all duration-300 shadow-md">
                      <Icon size={28} />
                    </span>
                    <span className="text-base font-bold text-center">{cat.name}</span>
                  </Link>
                );
              })}
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
