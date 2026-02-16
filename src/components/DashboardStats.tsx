'use client';

import { Event } from '@/lib/supabase';
import { FiCalendar, FiClock, FiBookmark, FiCheckCircle } from 'react-icons/fi';
import { isEventUpcomingOrActive } from '@/lib/utils';
import { EventItem } from '@/lib/types';

interface DashboardStatsProps {
  userEvents: Event[];
  savedEvents: Event[];
  loading?: boolean;
}

export default function DashboardStats({ userEvents, savedEvents, loading = false }: DashboardStatsProps) {
  // Calculate statistics from events using proper timing logic
  const totalEvents = userEvents.length;
  // Use isEventUpcomingOrActive to properly determine if event is upcoming/current
  const upcomingEvents = userEvents.filter(event => isEventUpcomingOrActive(event as EventItem)).length;
  // Event is past only if it has ended
  const pastEvents = userEvents.filter(event => !isEventUpcomingOrActive(event as EventItem)).length;
  const totalSaved = savedEvents.length;

  // Show loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 lg:mb-10">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Stats data - always show stats (zeros if no data)
  const stats = [
    {
      label: 'Total Events',
      value: totalEvents,
      icon: FiCalendar,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Upcoming',
      value: upcomingEvents,
      icon: FiClock,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Past Events',
      value: pastEvents,
      icon: FiCheckCircle,
      color: 'bg-gray-500',
      bgColor: 'bg-gray-50',
    },
    {
      label: 'Saved Events',
      value: totalSaved,
      icon: FiBookmark,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 lg:mb-10">
      {stats.map((stat, index) => (
        <div 
          key={index}
          className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm font-medium text-gray-600">{stat.label}</span>
            <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-3 h-3 sm:w-4 sm:h-4 text-white`} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
