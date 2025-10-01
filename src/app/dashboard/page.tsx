'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useDashboardData } from '@/hooks/useDashboardData';
import UserProfile from '@/components/UserProfile';
import DashboardStats from '@/components/DashboardStats';
import DashboardEventsSection from '@/components/DashboardEventsSection';
import DashboardActivity from '@/components/DashboardActivity';
import Link from 'next/link';
import { FiPlus, FiEdit, FiCalendar, FiBookmark, FiClock } from 'react-icons/fi';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const router = useRouter();
  const { user, userEvents, savedEvents, activities, loading, error, refetch } = useDashboardData();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleEventDelete = async (deletedEventId: string) => {
    // Refetch data after event deletion
    await refetch();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-6 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to load dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => refetch()}
              className="btn-primary w-full"
            >
              Try Again
            </button>
            <Link href="/signin" className="btn-ghost w-full block text-center">
              Sign In
            </Link>
          </div>
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600 text-lg">Manage your events and profile</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Statistics Overview */}
        <DashboardStats
          userEvents={userEvents}
          savedEvents={savedEvents}
          loading={loading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column - Profile & Actions */}
          <div className="lg:col-span-1 space-y-8">
            {/* Profile Section */}
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
              <UserProfile />
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
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

            {/* Recent Activity */}
            <DashboardActivity activities={activities} loading={loading} />
          </div>

          {/* Right Column - Events */}
          <div className="lg:col-span-2 space-y-8">
            {/* My Upcoming Events */}
            <DashboardEventsSection
              title="My Upcoming Events"
              events={upcomingEvents}
              icon={FiCalendar}
              emptyState={{
                emoji: "📅",
                title: "No upcoming events",
                description: "Create your first event to get started!",
                actionText: "Create Your First Event",
                actionLink: "/create-event"
              }}
              isOwner={true}
              onDelete={handleEventDelete}
              loading={loading}
            />

            {/* Saved Events */}
            <DashboardEventsSection
              title="Saved Events"
              events={savedEvents}
              icon={FiBookmark}
              emptyState={{
                emoji: "🔖",
                title: "No saved events",
                description: "Events you save will appear here for easy access.",
                actionText: "Browse Events",
                actionLink: "/events"
              }}
              loading={loading}
              maxVisible={4}
            />

            {/* Previous Events */}
            <DashboardEventsSection
              title="Previous Events"
              events={expiredEvents}
              icon={FiClock}
              emptyState={{
                emoji: "🎉",
                title: "No previous events",
                description: "Your past events will appear here.",
              }}
              isOwner={true}
              onDelete={handleEventDelete}
              loading={loading}
              collapsible={true}
              defaultExpanded={false}
              maxVisible={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
