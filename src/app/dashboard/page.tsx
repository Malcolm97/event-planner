'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import UserProfile from '@/components/UserProfile';
import DashboardStats from '@/components/DashboardStats';
import DashboardEventsSection from '@/components/DashboardEventsSection';
import DashboardActivity from '@/components/DashboardActivity';
import Link from 'next/link';
import { FiPlus, FiEdit, FiCalendar, FiBookmark, FiClock, FiRefreshCw, FiWifi, FiWifiOff } from 'react-icons/fi';
import { isEventUpcomingOrActive } from '@/lib/utils';
import { EventItem } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const { 
    user, 
    userProfile, 
    userEvents, 
    savedEvents, 
    activities, 
    loading, 
    error, 
    refetch,
    isRefreshing,
    lastUpdated
  } = useDashboardData();

  // Pull to refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const pullStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleEventDelete = async (deletedEventId: string) => {
    await refetch();
  };

  // Pull to refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && !isRefreshing) {
      pullStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - pullStartY.current;
    
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      const distance = Math.min(diff * 0.5, 100);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !isRefreshing) {
      await refetch();
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  if (loading && !userEvents.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto"
          />
          <p className="text-gray-500 mt-6 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg"
        >
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to load dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => refetch()}
              className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-xl"
            >
              Try Again
            </motion.button>
            <Link 
              href="/signin" 
              className="block w-full py-3 px-4 text-center text-gray-600 hover:text-gray-900 font-medium"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
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
    <div 
      ref={containerRef}
      className="min-h-screen bg-gray-50 overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ 
              opacity: 1, 
              y: Math.max(0, pullDistance - 20),
              rotate: isRefreshing ? 360 : pullDistance * 2
            }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ rotate: { duration: 0.5, repeat: isRefreshing ? Infinity : 0 } }}
            className="fixed top-0 left-0 right-0 z-50 flex justify-center py-4"
          >
            <div className="bg-white rounded-full p-3 shadow-lg">
              <FiRefreshCw className="w-6 h-6 text-yellow-500" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto lg:max-w-[1400px] px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex justify-between items-center py-3 sm:py-4 lg:py-6">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-600 text-sm">Manage your events and profile</p>
                {/* Online/Offline indicator */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    isOnline 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {isOnline ? (
                    <>
                      <FiWifi className="w-3 h-3" />
                      <span className="hidden sm:inline">Online</span>
                    </>
                  ) : (
                    <>
                      <FiWifiOff className="w-3 h-3" />
                      <span className="hidden sm:inline">Offline</span>
                    </>
                  )}
                </motion.div>
              </div>
            </div>
            
            {/* Refresh button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => refetch()}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors disabled:opacity-50"
            >
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
              >
                <FiRefreshCw className="w-4 h-4" />
              </motion.div>
              <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto lg:max-w-[1400px] px-4 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-4 lg:py-8">
        {/* Last updated indicator */}
        {lastUpdated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-400 mb-3 text-center"
          >
            Last updated: {lastUpdated.toLocaleTimeString()}
          </motion.div>
        )}

        {/* Statistics Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DashboardStats
            userEvents={userEvents}
            savedEvents={savedEvents}
            loading={loading && !userEvents.length}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-8 mt-3 sm:mt-4 lg:mt-8">
          {/* Left Column - Profile & Actions */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Profile Section */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-4 sm:p-6 lg:p-8"
            >
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
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-4 sm:p-6"
            >
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
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <DashboardActivity activities={activities} loading={loading} />
            </motion.div>
          </div>

          {/* Right Column - Events */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-5">
            {/* My Upcoming Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
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
                loading={loading && !userEvents.length}
                sectionType="upcoming"
              />
            </motion.div>

            {/* Saved Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
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
                loading={loading && !savedEvents.length}
                maxVisible={4}
                sectionType="saved"
              />
            </motion.div>

            {/* Previous Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
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
                loading={loading && !userEvents.length}
                collapsible={true}
                defaultExpanded={false}
                maxVisible={3}
                sectionType="previous"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}