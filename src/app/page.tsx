'use client';

import { useState, useEffect, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import EventCard from '../components/EventCard';
import { supabase, TABLES, User, isSupabaseConfigured } from '@/lib/supabase';
import { EventItem } from '@/lib/types'; // Correct import for EventItem
import { FiStar, FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile, FiMapPin, FiCalendar } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import Link from 'next/link';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import EventModal from '../components/EventModal';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

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

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('All Dates');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('All Areas');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [host, setHost] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [totalEvents, setTotalEvents] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [citiesCoveredCount, setCitiesCoveredCount] = useState<number | null>(null);
  const router = useRouter();
  // Commenting out setLastSaved and isPwaOnMobile as they are not exported by NetworkStatusContext
  const { isOnline } = useNetworkStatus();

  const [displayedLocations, setDisplayedLocations] = useState<string[]>(['All Areas']);
  const [displayedDates, setDisplayedDates] = useState<string[]>(['All Dates']);

  const loadEvents = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured. Please update your .env.local file with valid Supabase credentials.');
        setEvents([]);
        setFilteredEvents([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.warn('Error fetching events from Supabase:', error.message);
        setEvents([]);
        setFilteredEvents([]);
      } else if (data) {
        const typedData: EventItem[] = data.map((event: any) => ({
          ...event,
          date: event.date ? String(event.date) : '',
          id: String(event.id),
          name: event.name,
          location: event.location || '',
          description: event.description || '',
          category: event.category || 'Other',
          presale_price: event.presale_price ?? 0,
          gate_price: event.gate_price ?? 0,
          image_url: event.image_url || '',
          created_at: event.created_at || '',
          featured: event.featured || false,
          created_by: event.created_by || '',
        }));
        setEvents(typedData);
        setFilteredEvents(typedData);
        // const timestamp = new Date().toISOString();
        // setLastSaved(timestamp); // Commented out
      } else {
        setEvents([]);
        setFilteredEvents([]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
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

  useEffect(() => {
    loadEvents();
  }, [isOnline]); // Removed isPwaOnMobile

  // Fetch total events
  useEffect(() => {
    const fetchTotalEvents = async () => {
      if (!isSupabaseConfigured()) {
        setTotalEvents(0);
        return;
      }
      try {
        const { count, error } = await supabase
          .from(TABLES.EVENTS)
          .select('*', { count: 'exact' });
        if (error) {
          console.error('Error fetching total events:', error.message);
          setTotalEvents(0);
        } else {
          setTotalEvents(count);
        }
      } catch (error) {
        console.error('Error fetching total events:', error);
        setTotalEvents(0);
      }
    };
    fetchTotalEvents();
  }, []);

  // Fetch total users
  useEffect(() => {
    const fetchTotalUsers = async () => {
      if (!isSupabaseConfigured()) {
        setTotalUsers(0);
        return;
      }
      try {
        const { count, error } = await supabase
          .from(TABLES.USERS)
          .select('*', { count: 'exact' });
        if (error) {
          console.error('Error fetching total users:', error.message);
          setTotalUsers(0);
        } else {
          setTotalUsers(count);
        }
      } catch (error) {
        console.error('Error fetching total users:', error);
        setTotalUsers(0);
      }
    };
    fetchTotalUsers();
  }, []);

  // Calculate cities covered
  useEffect(() => {
    if (events.length > 0) {
      const uniqueCities = new Set<string>();
      events.forEach((event: EventItem) => {
        if (event.location) {
          const firstPart = event.location.split(',')[0]?.trim();
          if (firstPart) {
            uniqueCities.add(firstPart);
          }
        }
      });
      setCitiesCoveredCount(uniqueCities.size);
    } else {
      setCitiesCoveredCount(0);
    }
  }, [events]);

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
        tempEvents = tempEvents.filter((event: EventItem) =>
          event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location.toLowerCase().includes(searchTerm.toLowerCase())
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

  const categorizedEvents = upcomingEvents.filter((event: EventItem) => {
    const firstPart = event.location?.split(',')[0]?.trim();
    return firstPart && popularPngCities.includes(firstPart);
  });

  const otherLocationEvents = upcomingEvents.filter((event: EventItem) => {
    const firstPart = event.location?.split(',')[0]?.trim();
    return firstPart && !popularPngCities.includes(firstPart);
  });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <section className="w-full py-12 px-4 sm:px-8 bg-gradient-to-b from-yellow-300 to-red-600 border-b border-black">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-6">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">
            Local Events Near You
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Find concerts, festivals, workshops, and more happening in your area.
            Create memories with events that matter to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-2xl justify-center mt-2">
            <input
              className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 flex-1 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Search events, artists, or venues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900"
              value={selectedLocationFilter}
              onChange={(e) => setSelectedLocationFilter(e.target.value)}
            >
              {displayedLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
            <select
              className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              {displayedDates.map(dateOption => (
                <option key={dateOption} value={dateOption}>{dateOption}</option>
              ))}
            </select>
            <button className="rounded-lg px-6 py-2 bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition">Find Events</button>
          </div>
          <div className="flex gap-8 mt-6 text-center justify-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalEvents !== null ? totalEvents : '...'}</div>
              <div className="text-gray-600 text-sm">Total Events</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalUsers !== null ? totalUsers : '...'}</div>
              <div className="text-gray-600 text-sm">Total Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{citiesCoveredCount !== null ? citiesCoveredCount : '...'}</div>
              <div className="text-gray-600 text-sm">Cities Covered</div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto w-full py-16 px-4 sm:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-3">
            <span className="text-2xl">📅</span> Upcoming Events
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">Discover all upcoming events happening near you.</p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="text-gray-500 mt-6 text-lg">Loading events...</p>
          </div>
        ) : (
          <>
            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {upcomingEvents.map(event => (
                  <EventCard key={event.id} event={event} onClick={() => { setSelectedEvent(event); setDialogOpen(true); }} />
                ))}
              </div>
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming events</h3>
                <p className="text-gray-500">Check back later for new events.</p>
              </div>
            )}
          </>
        )}

          <div className="flex justify-center mt-12">
            <Link href="/events" className="px-8 py-3 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center">
              View all Events
            </Link>
          </div>
      </section>

      <section className="max-w-7xl mx-auto w-full py-16 px-4 sm:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-3">
            <span className="text-2xl">✨</span> Featured Events
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">Featured events will appear here soon!</p>
        </div>
      </section>

      {previousEvents.length > 0 && (
        <section className="max-w-7xl mx-auto w-full py-12 px-4 sm:px-8 bg-gray-50 border-t border-gray-200">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Previous Events</h2>
            <p className="text-gray-600">Browse events that have already taken place.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {previousEvents.map(event => (
              <EventCard key={event.id} event={event} onClick={() => { setSelectedEvent(event); setDialogOpen(true); }} />
            ))}
          </div>
        </section>
      )}

      <section className="w-full py-10 px-4 sm:px-8 bg-white border-t border-black">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Explore by Category</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 justify-center">
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
                    className={`flex flex-col items-center justify-center gap-2 px-6 py-6 rounded-2xl border-2 border-black font-bold shadow-lg hover:bg-yellow-400 hover:text-black transition min-h-[120px] min-w-[120px] ${categoryColor}`}
                  >
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-yellow-400 mb-1">
                      <Icon size={24} />
                    </span>
                    <span className="text-base font-semibold">{cat.name}</span>
                  </Link>
                );
              })}
          </div>
        </div>
      </section>

      <footer className="w-full py-8 px-4 sm:px-8 bg-black border-t border-red-600 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:row justify-between items-center gap-4 text-gray-500 text-sm">
          <div className="flex gap-6 mb-2 md:mb-0">
            <Link href="/events" className="hover:text-yellow-300 text-white">Events</Link>
            <Link href="/categories" className="hover:text-yellow-300 text-white">Categories</Link>
            <Link href="/about" className="hover:text-yellow-300 text-white">About</Link>
          </div>
          <div className="text-center text-white">© 2025 PNG Events. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-yellow-300 text-white">Terms</Link>
            <Link href="#" className="hover:text-yellow-300 text-white">Privacy</Link>
          </div>
        </div>
      </footer>
      <EventModal selectedEvent={selectedEvent} host={host} dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} categoryIconMap={serializableCategoryIconMap} />
    </div>
  );
}
