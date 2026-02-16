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
import { isEventUpcomingOrActive } from '@/lib/utils';
import { EventItem } from '@/lib/types';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const router = useRouter();
  const { user, userProfile, userEvents, savedEvents, activities, loading, error, refetch } = useDashboardData();

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

  // Use proper timing logic - event is upcoming/current if it hasn't ended yet
  const upcomingEvents = userEvents.filter(event => isEventUpcomingOrActive(event as EventItem));
  const expiredEvents = userEvents.filter(event => !isEventUpcomingOrActive(event as EventItem));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4 lg:py-5">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 text-sm sm:text-base mt-1">Manage your events and profile</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5">
        {/* Statistics Overview */}
        <DashboardStats
          userEvents={userEvents}
          savedEvents={savedEvents}
          loading={loading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mt-3 sm:mt-4 lg:mt-5">
          {/* Left Column - Profile & Actions */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Profile Section */}
            <div className="card p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Profile</h2>
                <Link
                  href="/dashboard/edit-profile"
                  className="btn-ghost text-xs sm:text-sm gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2"
                >
                  <FiEdit size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Edit Profile</span>
                </Link>
              </div>
              <UserProfile userProfile={userProfile} />
            </div>

            {/* Quick Actions */}
            <div className="card p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
              <div className="space-y-2 sm:space-y-3">
                <Link
                  href="/create-event"
                  className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
                >
                  <FiPlus className="text-blue-600" size={16} />
                  <span className="text-blue-700 text-sm font-medium group-hover:text-blue-800">Create Event</span>
                </Link>
                <Link
                  href="/events"
                  className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group"
                >
                  <FiCalendar className="text-green-600" size={16} />
                  <span className="text-green-700 text-sm font-medium group-hover:text-green-800">Browse Events</span>
                </Link>
                <Link
                  href="/dashboard/edit-profile"
                  className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group"
                >
                  <FiEdit className="text-purple-600" size={16} />
                  <span className="text-purple-700 text-sm font-medium group-hover:text-purple-800">Edit Profile</span>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <DashboardActivity activities={activities} loading={loading} />
          </div>

          {/* Right Column - Events */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-5">
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
              sectionType="upcoming"
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
              sectionType="saved"
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
              sectionType="previous"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
