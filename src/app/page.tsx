'use client';

import { useState, useEffect, useContext, useMemo } from 'react'; // Import useContext
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import EventCard from '../components/EventCard';
import { supabase, TABLES, Event, User, isSupabaseConfigured } from '../lib/supabase';
import { FiStar, FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile, FiMapPin, FiCalendar } from 'react-icons/fi';
import Link from 'next/link'; // Ensure Link is imported
import { useNetworkStatus } from '../context/NetworkStatusContext'; // Import the hook

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
];

const categoryIconMap: { [key: string]: any } = {
  'Music': FiMusic,
  'Art': FiImage,
  'Food': FiCoffee,
  'Technology': FiCpu,
  'Wellness': FiHeart,
  'Comedy': FiSmile,
};

const categoryColorMap: { [key: string]: string } = {
  'Music': 'bg-purple-100 text-purple-600',
  'Art': 'bg-pink-100 text-pink-600',
  'Food': 'bg-orange-100 text-orange-600',
  'Technology': 'bg-blue-100 text-blue-600',
  'Wellness': 'bg-green-100 text-green-600',
  'Comedy': 'bg-yellow-100 text-yellow-600',
};

const popularPngCities = [
  "Port Moresby", "Lae", "Madang", "Mount Hagen", "Goroka", "Rabaul", "Wewak",
  "Popondetta", "Arawa", "Kavieng", "Daru", "Vanimo", "Kimbe", "Mendi",
  "Kundiawa", "Lorengau", "Wabag", "Kokopo", "Buka", "Alotau"
];

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('All Dates');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('All Areas');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [host, setHost] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();
  const { isOnline, setLastSaved, isPwaOnMobile } = useNetworkStatus();

  // State for dynamically generated options to prevent hydration mismatch
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
        setEvents(data);
        setFilteredEvents(data);
        const timestamp = new Date().toISOString();
        setLastSaved(timestamp);
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
  }, [isOnline, isPwaOnMobile]);

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

  // Calculate upcoming and previous events based on filteredEvents
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents.filter((ev: Event) => ev.date && new Date(ev.date) >= now);
  }, [filteredEvents]);

  const previousEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents.filter((ev: Event) => ev.date && new Date(ev.date) < now);
  }, [filteredEvents]);

  useEffect(() => {
    const filterEvents = () => {
      let tempEvents = events;

      if (searchTerm) {
        tempEvents = tempEvents.filter((event: Event) =>
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

        tempEvents = tempEvents.filter((event: Event) => {
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
              // Handle specific month/year (e.g., "August 2025")
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
        tempEvents = tempEvents.filter((event: Event) => {
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

  // Effect to update displayedLocations and displayedDates after events are loaded
  useEffect(() => {
    // Group events by location for "Other" category
    const otherLocationEvents = upcomingEvents.filter((event: Event) => {
      const firstPart = event.location?.split(',')[0]?.trim();
      return firstPart && !popularPngCities.includes(firstPart);
    });

    // Generate available locations for the dropdown
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

    // Generate available date options for the dropdown
    const newAvailableDates = ['All Dates'];
    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    if (upcomingEvents.some((event: Event) => event.date && new Date(event.date).toDateString() === today.toDateString())) {
      newAvailableDates.push('Today');
    }
    if (upcomingEvents.some((event: Event) => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= endOfWeek;
    })) {
      newAvailableDates.push('This Week');
    }
    if (upcomingEvents.some((event: Event) => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
    })) {
      newAvailableDates.push('This Month');
    }

    // Add future months/years if events exist
    const futureMonths = new Set<string>();
    upcomingEvents.forEach((event: Event) => {
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
  }, [events, upcomingEvents]); // Recalculate when events or upcomingEvents change

  const categorizedEvents = upcomingEvents.filter((event: Event) => {
    const firstPart = event.location?.split(',')[0]?.trim();
    return firstPart && popularPngCities.includes(firstPart);
  });

  const otherLocationEvents = upcomingEvents.filter((event: Event) => {
    const firstPart = event.location?.split(',')[0]?.trim();
    return firstPart && !popularPngCities.includes(firstPart);
  });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      {/* Hero Section */}
      <section className="w-full py-12 px-4 sm:px-8 bg-gradient-to-b from-yellow-300 to-red-600 border-b border-black">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-6">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">
            Local Events Near You
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Find concerts, festivals, workshops, and more happening in your area.
            Create memories with events that matter to you.
          </p>
          {/* Search/Filter Bar */}
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
          {/* Stats */}
          <div className="flex gap-8 mt-6 text-center justify-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">500+</div>
              <div className="text-gray-600 text-sm">Events this month</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">50K+</div>
              <div className="text-gray-600 text-sm">Happy attendees</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">100+</div>
              <div className="text-gray-600 text-sm">Cities covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events (now real-time) */}
      <section className="max-w-7xl mx-auto w-full py-16 px-4 sm:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-3">
            <span className="text-2xl">✨</span> Featured Events
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">Discover the most popular events happening near you.</p>
        </div>

        {/* Upcoming Events */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="text-gray-500 mt-6 text-lg">Loading events...</p>
          </div>
        ) : (
          <>
            {categorizedEvents.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Events in Popular Cities</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {categorizedEvents.map(event => (
                    <EventCard key={event.id} event={event} onClick={() => { setSelectedEvent(event); setDialogOpen(true); }} />
                  ))}
                </div>
              </div>
            )}

            {otherLocationEvents.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Events in Other Locations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {otherLocationEvents.map(event => (
                    <EventCard key={event.id} event={event} onClick={() => { setSelectedEvent(event); setDialogOpen(true); }} />
                  ))}
                </div>
              </div>
            )}

            {upcomingEvents.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming events</h3>
                <p className="text-gray-500">Check back later for new events.</p>
              </div>
            )}
          </>
        )}

        <div className="flex justify-center mt-12">
          <button className="px-8 py-3 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            View all Events
          </button>
        </div>
      </section>

      {/* Previous Events Section */}
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

      {/* Event Dialog */}
      {dialogOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 relative animate-fade-in border border-gray-200">
            {/* Header */}
            <div className="p-6 pb-4">
              <button
                onClick={() => setDialogOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                &times;
              </button>

              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  {(() => {
                    const Icon = categoryIconMap[selectedEvent.category || 'Other'] || FiStar;
                    return <Icon size={24} className="text-yellow-600" />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{selectedEvent.name}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-semibold text-sm">
                      {selectedEvent.category || 'Other'}
                    </span>
                    <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                      {selectedEvent.price === 0 ? 'Free' : `PGK ${selectedEvent.price.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <FiMapPin size={18} className="text-gray-400 flex-shrink-0" />
                  <span className="font-medium">{selectedEvent.location}</span>
                </div>

                {selectedEvent.date && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <FiCalendar size={18} className="text-gray-400 flex-shrink-0" />
                    <span className="font-medium">{new Date(selectedEvent.date).toLocaleString()}</span>
                  </div>
                )}

                {selectedEvent.description && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
                  </div>
                )}
              </div>

              {/* Host Information */}
              {selectedEvent && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Host</h3>
                  {host ? (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {host.name && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Name:</span>
                          <span className="text-gray-900">{host.name}</span>
                        </div>
                      )}
                      {host.email && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Email:</span>
                          <a href={`mailto:${host.email}`} className="text-blue-600 hover:underline text-gray-900">{host.email}</a>
                        </div>
                      )}
                      {host.phone && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Phone:</span>
                          <a href={`tel:${host.phone}`} className="text-blue-600 hover:underline text-gray-900">{host.phone}</a>
                        </div>
                      )}
                      {host.company && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Company:</span>
                          <span className="text-gray-900">{host.company}</span>
                        </div>
                      )}
                      {host.about && (
                        <div className="pt-2">
                          <span className="text-gray-600 text-sm">{host.about}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg text-center">
                      {selectedEvent?.created_by ? (
                        <p>Host details for user ID "{selectedEvent.created_by}" are not available or could not be fetched.</p>
                      ) : (
                        <p>Host details are not available for this event.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Explore by Category */}
      <section className="w-full py-10 px-4 sm:px-8 bg-white border-t border-black">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Explore by Category</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 justify-center">
            {allCategories
              .filter(cat => events.some(ev => ev.category === cat.name))
              .map((cat) => {
                const Icon = categoryIconMap[cat.name] || FiStar;
                const categoryColor = categoryColorMap[cat.name] || 'bg-yellow-100 text-black';
                return (
                  <a
                    href={`/categories?category=${encodeURIComponent(cat.name)}`}
                    key={cat.name}
                    className={`flex flex-col items-center justify-center gap-2 px-6 py-6 rounded-2xl border-2 border-black font-bold shadow-lg hover:bg-yellow-400 hover:text-black transition min-h-[120px] min-w-[120px] ${categoryColor}`}
                  >
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-yellow-400 mb-1">
                      <Icon size={24} />
                    </span>
                    <span className="text-base font-semibold">{cat.name}</span>
                  </a>
                );
              })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 px-4 sm:px-8 bg-black border-t border-red-600 mt-auto">
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
