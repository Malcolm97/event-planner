'use client';

import Header from "../components/Header";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { collection, query, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import EventCard, { Event } from "../components/EventCard";
import { FiMusic, FiCamera, FiCoffee, FiMonitor, FiHeart, FiSmile, FiUsers, FiBook, FiTrendingUp, FiStar } from 'react-icons/fi';

const allCategories = [
  { name: "Music" },
  { name: "Art" },
  { name: "Food" },
  { name: "Technology", color: 'bg-yellow-100 text-yellow-700' },
  { name: "Wellness" },
  { name: "Comedy" },
  { name: "Business" },
  { name: "Education" },
  { name: "Community" },
  { name: "Festival" },
  { name: "Conference" },
  { name: "Workshop" },
  { name: "Sports" },
  { name: "Meetup" },
];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [host, setHost] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "events"));
    const unsub = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
      setEvents(eventsData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch host info when selectedEvent changes
  useEffect(() => {
    if (
      selectedEvent &&
      typeof selectedEvent.createdBy === "string" &&
      selectedEvent.createdBy.trim()
    ) {
      const fetchHost = async () => {
        const userDoc = await getDoc(doc(db, "users", selectedEvent.createdBy!));
        if (userDoc.exists()) setHost(userDoc.data());
        else setHost(null);
      };
      fetchHost();
    } else {
      setHost(null);
    }
  }, [selectedEvent]);

  const now = new Date();
  const upcomingEvents = events.filter(ev => ev.date && new Date(ev.date) >= now);
  const previousEvents = events.filter(ev => ev.date && new Date(ev.date) < now);

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
            <input className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Search events, artists, or venues..." />
            <select className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900">
              <option>All Dates</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
            <button className="rounded-lg px-6 py-2 bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition">Find Events</button>
          </div>
          {/* Stats */}
          <div className="flex gap-8 mt-6 text-center justify-center">
            <div>
              <div className="text-2xl font-bold text-indigo-600">500+</div>
              <div className="text-gray-600 text-sm">Events this month</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">50K+</div>
              <div className="text-gray-600 text-sm">Happy attendees</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">100+</div>
              <div className="text-gray-600 text-sm">Cities covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events (now real-time) */}
      <section className="max-w-6xl mx-auto w-full py-12 px-4 sm:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>✨</span> Featured Events
            </h2>
            <p className="text-gray-500 text-sm mt-1">Discover the most popular events happening near you.</p>
          </div>
          <button className="rounded-lg px-4 py-2 bg-white border border-black text-red-600 font-semibold hover:bg-yellow-300 hover:text-black transition text-sm shadow">View All</button>
        </div>
        {/* Upcoming Events */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading events...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} onClick={() => { setSelectedEvent(event); setDialogOpen(true); }} />
              )) : <div className="text-gray-500 col-span-full">No upcoming events.</div>}
            </div>
          </>
        )}
        <div className="flex justify-center mt-8">
          <button className="px-6 py-2 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition shadow">View all Events</button>
        </div>
      </section>

      {/* Previous Events Section */}
      {previousEvents.length > 0 && (
        <section className="max-w-6xl mx-auto w-full py-8 px-4 sm:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Previous Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {previousEvents.map(event => (
              <EventCard key={event.id} event={event} onClick={() => { setSelectedEvent(event); setDialogOpen(true); }} />
            ))}
          </div>
        </section>
      )}

      {/* Event Dialog */}
      {dialogOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative animate-fade-in">
            <button onClick={() => setDialogOpen(false)} className="absolute top-3 right-3 text-gray-500 hover:text-black text-2xl font-bold">&times;</button>
            <h2 className="text-2xl font-extrabold mb-2 text-black">{selectedEvent.name}</h2>
            <div className="mb-2 text-sm text-gray-700">
              <span className="inline-block px-2 py-0.5 rounded bg-yellow-400 text-black font-bold uppercase mr-2">{selectedEvent.category || 'Other'}</span>
              <span className="inline-block px-2 py-0.5 rounded bg-gray-200 text-black font-bold">{selectedEvent.price === 0 ? 'Free' : `PGK ${selectedEvent.price.toFixed(2)}`}</span>
            </div>
            <div className="mb-2 text-gray-600 text-sm">📍 {selectedEvent.location}</div>
            {selectedEvent.date && (
              <div className="mb-2 text-gray-600 text-sm">📅 {new Date(selectedEvent.date).toLocaleString()}</div>
            )}
            <p className="mb-4 text-gray-800 text-base">{selectedEvent.description}</p>
            <hr className="my-4" />
            <h3 className="text-lg font-bold mb-2 text-black">Event Host</h3>
            {host ? (
              <div className="mb-2 text-gray-800 text-base">
                <div><span className="font-semibold">Name:</span> {host.name || 'N/A'}</div>
                <div><span className="font-semibold">Email:</span> {host.email || 'N/A'}</div>
                {host.phone && <div><span className="font-semibold">Phone:</span> {host.phone}</div>}
                {host.company && <div><span className="font-semibold">Company:</span> {host.company}</div>}
                {host.about && <div className="mt-2 text-gray-600 text-sm">{host.about}</div>}
              </div>
            ) : (
              <div className="text-gray-500">Host information not available.</div>
            )}
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
                const Icon = {
                  Music: FiMusic,
                  Art: FiCamera,
                  Food: FiCoffee,
                  Technology: FiMonitor,
                  Wellness: FiHeart,
                  Comedy: FiSmile,
                  Business: FiTrendingUp,
                  Education: FiBook,
                  Community: FiUsers,
                  Festival: FiStar,
                  Conference: FiTrendingUp,
                  Workshop: FiBook,
                  Sports: FiStar,
                  Meetup: FiUsers,
                }[cat.name] || FiStar;
                const categoryColor = {
                  Music: 'bg-yellow-400 text-black',
                  Art: 'bg-pink-400 text-white',
                  Food: 'bg-amber-300 text-black',
                  Technology: 'bg-yellow-300 text-black',
                  Wellness: 'bg-green-400 text-black',
                  Comedy: 'bg-yellow-200 text-black',
                  Business: 'bg-red-600 text-white',
                  Education: 'bg-black text-yellow-300',
                  Community: 'bg-red-400 text-white',
                  Festival: 'bg-fuchsia-400 text-white',
                  Conference: 'bg-cyan-400 text-black',
                  Workshop: 'bg-lime-300 text-black',
                  Sports: 'bg-amber-500 text-black',
                  Meetup: 'bg-gray-300 text-black',
                  Other: 'bg-gray-300 text-black',
                }[cat.name] || 'bg-yellow-100 text-black';
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