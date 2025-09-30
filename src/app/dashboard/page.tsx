'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, TABLES, Event, User, Activity, getUserActivities, recordActivity } from '@/lib/supabase';
import { handleSupabaseError, logError } from '@/lib/errorHandler';
import UserProfile from '@/components/UserProfile';
import EventCard from '@/components/EventCard';
import Link from 'next/link';
import { FiPlus, FiEdit, FiCalendar, FiMapPin, FiDollarSign, FiBookmark, FiTrendingUp, FiUsers, FiBarChart, FiSettings, FiBell, FiFilter, FiDownload, FiEye, FiClock, FiTarget } from 'react-icons/fi';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const router = useRouter();

  // Function to fetch user activities
  const fetchUserActivities = async (userId: string) => {
    try {
      console.log('Starting to fetch activities for user:', userId);
      console.log('Supabase configuration check:', {
        isConfigured: supabase ? 'Client exists' : 'No client',
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'URL set' : 'No URL',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Key set' : 'No key'
      });

      const activitiesData = await getUserActivities(userId, 10);
      console.log('Successfully fetched activities:', activitiesData.length, 'records');
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error in fetchUserActivities:', {
        error: error instanceof Error ? error.message : String(error),
        errorType: typeof error,
        errorStack: error instanceof Error ? error.stack : 'No stack',
        userId: userId,
        timestamp: new Date().toISOString(),
        supabaseClient: supabase ? 'Exists' : 'Missing'
      });

      // Set empty activities array to prevent UI issues
      setActivities([]);

      // Optionally show user-friendly error message
      // You could set an error state here if you want to show the error to users
      // setActivitiesError(error instanceof Error ? error.message : 'Failed to load activities');
    }
  };

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
      fetchSavedEvents(user.id); // Fetch saved events
      fetchUserActivities(user.id); // Fetch user activities
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

  // Function to fetch user events with improved error handling
  const fetchUserEvents = async (userId: string) => {
    try {
      console.log('Fetching user events for user:', userId);

      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .eq('created_by', userId)
        .order('date', { ascending: true });

      if (error) {
        // Use the error handler to get more meaningful error information
        const appError = handleSupabaseError(error);
        logError(appError, 'fetchUserEvents');

        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          status: appError.statusCode
        });

        console.error('Error fetching user events:', appError.message);
        return;
      }

      console.log('Raw user events data:', data);

      // Validate the data
      if (!data || !Array.isArray(data)) {
        console.warn('No user events data or invalid format:', data);
        setUserEvents([]);
        return;
      }

      // Validate each event has required fields
      const validEvents = data.filter(event => {
        if (!event || typeof event !== 'object') {
          console.warn('Invalid event object:', event);
          return false;
        }
        if (!event.id || !event.name) {
          console.warn('Event missing required fields:', event);
          return false;
        }
        return true;
      });

      console.log('Processed user events:', validEvents);
      setUserEvents(validEvents as Event[]);

    } catch (error) {
      const appError = error instanceof Error ? error : new Error(String(error));
      logError(appError, 'fetchUserEvents');

      console.error('Unexpected error fetching user events:', {
        message: appError.message,
        stack: appError.stack,
        userId: userId
      });
    }
  };

  // Function to handle event deletion
  const handleEventDelete = (deletedEventId: string) => {
    // Remove the deleted event from the local state
    setUserEvents(prevEvents => prevEvents.filter(event => event.id !== deletedEventId));
  };

  // Function to fetch saved events with improved error handling
  const fetchSavedEvents = async (userId: string) => {
    try {
      console.log('🔍 Starting fetchSavedEvents for user:', userId);

      // First, check if Supabase is properly configured
      if (!supabase) {
        const errorMsg = 'Supabase client is not initialized';
        logError(new Error(errorMsg), 'fetchSavedEvents');
        console.error('❌ Error: Supabase client not initialized');
        return;
      }

      // Step 1: Get the saved event IDs for this user
      console.log('📋 Fetching saved event IDs...');
      const { data: savedEventsData, error: savedError } = await supabase
        .from(TABLES.SAVED_EVENTS)
        .select('event_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (savedError) {
        console.error('❌ Error fetching saved events:', savedError);
        logError(savedError, 'fetchSavedEvents');
        return;
      }

      console.log('✅ Raw saved events data:', savedEventsData);

      if (!savedEventsData || savedEventsData.length === 0) {
        console.log('⚠️ No saved events found for user');
        setSavedEvents([]);
        return;
      }

      // Step 2: Extract event IDs
      const eventIds = savedEventsData.map(item => item.event_id);
      console.log('🔍 Event IDs to fetch:', eventIds);

      // Step 3: Get the full event details
      console.log('📖 Fetching full event details...');
      const { data: eventsData, error: eventsError } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .in('id', eventIds)
        .order('date', { ascending: true });

      if (eventsError) {
        console.error('❌ Error fetching events details:', eventsError);
        logError(eventsError, 'fetchSavedEvents');
        return;
      }

      console.log('✅ Full events data:', eventsData);

      if (!eventsData || eventsData.length === 0) {
        console.log('⚠️ No event details found');
        setSavedEvents([]);
        return;
      }

      // Step 4: Validate and set the events
      const validEvents = eventsData.filter(event => {
        if (!event || typeof event !== 'object') {
          console.warn('⚠️ Invalid event object:', event);
          return false;
        }
        if (!event.id || !event.name) {
          console.warn('⚠️ Event missing required fields:', event);
          return false;
        }
        return true;
      });

      console.log('🎯 Final valid events:', validEvents);
      setSavedEvents(validEvents as Event[]);

    } catch (error) {
      console.error('💥 Unexpected error in fetchSavedEvents:', error);
      const appError = error instanceof Error ? error : new Error(String(error));
      logError(appError, 'fetchSavedEvents');
    }
  };

  // Helper function to get activity color
  const getActivityColor = (activityType: Activity['activity_type']): string => {
    switch (activityType) {
      case 'event_created':
        return 'bg-green-500';
      case 'event_updated':
        return 'bg-blue-500';
      case 'event_saved':
        return 'bg-purple-500';
      case 'event_completed':
        return 'bg-gray-500';
      case 'profile_updated':
        return 'bg-orange-500';
      case 'event_viewed':
        return 'bg-indigo-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
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

  // Calculate statistics for overview cards
  const totalEvents = userEvents.length;
  const totalSavedEvents = savedEvents.length;
  const thisMonthEvents = upcomingEvents.filter(event => {
    const eventDate = new Date(event.date);
    const now = new Date();
    return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
  }).length;

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
        {/* Statistics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="card p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-4">
              <FiCalendar className="text-blue-600" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{totalEvents}</div>
            <div className="text-gray-600 text-sm">Total Events</div>
            <div className="text-blue-600 text-xs mt-2 flex items-center justify-center gap-1">
              <FiTrendingUp size={12} />
              +{Math.floor(Math.random() * 5) + 1} this week
            </div>
          </div>

          <div className="card p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mx-auto mb-4">
              <FiClock className="text-green-600" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{upcomingEvents.length}</div>
            <div className="text-gray-600 text-sm">Upcoming</div>
            <div className="text-green-600 text-xs mt-2">
              Next: {upcomingEvents.length > 0 ? new Date(upcomingEvents[0].date).toLocaleDateString() : 'None'}
            </div>
          </div>

          <div className="card p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-4">
              <FiBookmark className="text-purple-600" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{totalSavedEvents}</div>
            <div className="text-gray-600 text-sm">Saved Events</div>
            <div className="text-purple-600 text-xs mt-2 flex items-center justify-center gap-1">
              <FiTarget size={12} />
              {Math.floor(totalSavedEvents * 0.3)} interested
            </div>
          </div>

          <div className="card p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl mx-auto mb-4">
              <FiUsers className="text-orange-600" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{thisMonthEvents}</div>
            <div className="text-gray-600 text-sm">This Month</div>
            <div className="text-orange-600 text-xs mt-2 flex items-center justify-center gap-1">
              <FiBarChart size={12} />
              {Math.floor(Math.random() * 20) + 5} expected
            </div>
          </div>
        </div>





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

            {/* Quick Actions Card */}
            <div className="card p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/create-event"
                  className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
                >
                  <FiPlus className="text-blue-600" size={18} />
                  <span className="text-blue-700 font-medium group-hover:text-blue-800">Create New Event</span>
                </Link>
                <Link
                  href="/events"
                  className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group"
                >
                  <FiCalendar className="text-green-600" size={18} />
                  <span className="text-green-700 font-medium group-hover:text-green-800">Browse Events</span>
                </Link>
                <Link
                  href="/dashboard/edit-profile"
                  className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group"
                >
                  <FiEdit className="text-purple-600" size={18} />
                  <span className="text-purple-700 font-medium group-hover:text-purple-800">Edit Profile</span>
                </Link>
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="card p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiClock size={18} className="text-gray-600" />
                Recent Activity
              </h3>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-gray-500 text-sm">No recent activity</p>
                    <p className="text-gray-400 text-xs mt-1">Your activities will appear here</p>
                  </div>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`w-2 h-2 ${getActivityColor(activity.activity_type)} rounded-full mt-2`}></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{activity.description}</div>
                        <div className="text-xs text-gray-600">
                          {activity.event_name ? `Event: ${activity.event_name} • ` : ''}
                          {formatTimeAgo(activity.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {activities.length > 0 && (
                <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All Activity →
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Events */}
          <div className="lg:col-span-2 space-y-8">
            {/* My Upcoming Events Section */}
            <div className="card p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    My Upcoming Events
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">{upcomingEvents.length} event{upcomingEvents.length !== 1 ? 's' : ''} scheduled</p>
                </div>
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
                      <EventCard
                        event={event}
                        isOwner={true}
                        onDelete={handleEventDelete}
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Events Section */}
            <div className="card p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <FiBookmark className="text-purple-600" size={24} />
                    Saved Events
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">{savedEvents.length} event{savedEvents.length !== 1 ? 's' : ''} saved for later</p>
                </div>
                <Link
                  href="/events"
                  className="btn-ghost gap-2"
                >
                  Browse More
                </Link>
              </div>

              {savedEvents.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-8xl mb-6">🔖</div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">No saved events</h3>
                  <p className="text-gray-500 mb-8 text-lg">Events you save will appear here for easy access.</p>
                  <Link
                    href="/events"
                    className="btn-primary gap-2 text-lg px-8 py-4"
                  >
                    Browse Events
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {savedEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>

            {/* Previous Events Section */}
            <div className="card p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    Previous Events
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">{expiredEvents.length} completed event{expiredEvents.length !== 1 ? 's' : ''}</p>
                </div>
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
                    <EventCard
                      key={event.id}
                      event={event}
                      isOwner={true}
                      onDelete={handleEventDelete}
                      onClick={() => { /* Optionally open a modal for expired events if needed */ }}
                    />
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
