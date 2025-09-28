'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, TABLES, Event, User } from '@/lib/supabase';
import UserProfile from '@/components/UserProfile';
import EventCard from '@/components/EventCard';
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
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-red-500 to-red-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-gray-500 mt-6 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const upcomingEvents = userEvents.filter(event => new Date(event.date) >= new Date());
  const expiredEvents = userEvents.filter(event => new Date(event.date) < new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-red-500 to-red-600">
  {/* Header removed, now rendered globally in layout */}
      {/* Header */}
      <div className="glass-effect shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600 text-lg">Manage your events and profile</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column - Profile */}
          <div className="lg:col-span-1">
            <div className="card p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
                <Link
                  href="/dashboard/edit-profile"
                  className="btn-ghost text-sm gap-2"
                >
                  <FiEdit size={16} />
                  Edit Profile
                </Link>
              </div>
              
              <UserProfile onError={setProfileError} />
              
              {profileError && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-700 text-sm font-medium">{profileError}</p>
                  <p className="text-red-600 text-xs mt-2">Profile editing is disabled due to errors.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Events */}
          <div className="lg:col-span-2">
            <div className="card p-8 mb-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">My Upcoming Events</h2>
                <Link
                  href="/create-event"
                  className="btn-primary gap-2"
                >
                  <FiPlus size={16} />
                  Create Event
                </Link>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-8xl mb-6">📅</div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">No upcoming events</h3>
                  <p className="text-gray-500 mb-8 text-lg">Create your first event to get started!</p>
                  <Link
                    href="/create-event"
                    className="btn-primary gap-2 text-lg px-8 py-4"
                  >
                    <FiPlus size={18} />
                    Create Your First Event
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {upcomingEvents.map(event => (
                    <Link key={event.id} href={`/dashboard/edit-event/${event.id}`}>
                      <EventCard event={event} />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Previous Events Section */}
            <div className="card p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Previous Events</h2>
              </div>

              {expiredEvents.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-8xl mb-6">🎉</div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">No previous events</h3>
                  <p className="text-gray-500 mb-8 text-lg">Your past events will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {expiredEvents.map(event => (
                    <EventCard key={event.id} event={event} onClick={() => { /* Optionally open a modal for expired events if needed */ }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
