'use client';

import Header from '../../components/Header';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, TABLES, Event, User } from '../../lib/supabase';
import UserProfile from '../../components/UserProfile';
import EventCard from '../../components/EventCard';
import Link from 'next/link';
import { FiPlus, FiEdit, FiCalendar, FiMapPin, FiDollarSign } from 'react-icons/fi';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const router = useRouter();

  // Effect to check user authentication and fetch events
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signin');
        return;
      }
      setUser(user);
      fetchUserEvents(user.id); // Call the function defined outside
      setLoading(false);
    };

    checkUser();
  }, [router, setUser]); // Dependencies for checkUser

  // Effect to handle redirection if profile error occurs
  useEffect(() => {
    if (profileError === 'Error: Failed to load user profile') {
      router.push('/dashboard/edit-profile');
    }
  }, [profileError, router]); // Dependencies for profileError redirection

  // Function to fetch user events (defined outside useEffect)
  const fetchUserEvents = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .eq('created_by', userId)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching user events:', error);
        return;
      }

      setUserEvents(data || []);
    } catch (error) {
      console.error('Error fetching user events:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-gray-500 mt-6 text-lg">Loading dashboard... ... ...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
                <Link
                  href="/dashboard/edit-profile"
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                >
                  <FiEdit size={16} />
                  Edit Profile
                </Link>
              </div>
              
              <UserProfile onError={setProfileError} />
              
              {profileError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{profileError}</p>
                  <p className="text-red-500 text-xs mt-1">Profile editing is disabled due to errors.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Events */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">My Events</h2>
                <Link
                  href="/create-event"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors shadow-sm"
                >
                  <FiPlus size={16} />
                  Create Event
                </Link>
              </div>

              {userEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No events yet</h3>
                  <p className="text-gray-500 mb-6">Create your first event to get started!</p>
                  <Link
                    href="/create-event"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors shadow-sm"
                  >
                    <FiPlus size={18} />
                    Create Your First Event
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userEvents.map(event => {
                    const now = new Date();
                    const eventDate = new Date(event.date);
                    const isExpired = eventDate < now;

                    if (isExpired) {
                      return (
                        <EventCard key={event.id} event={event} onClick={() => { /* Optionally open a modal for expired events if needed */ }} />
                      );
                    } else {
                      return (
                        <Link key={event.id} href={`/dashboard/edit-event/${event.id}`}>
                          <EventCard event={event} />
                        </Link>
                      );
                    }
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
