'use client';

import { FiCalendar, FiClock, FiBookmark, FiTrendingUp, FiBarChart } from 'react-icons/fi';
import { Event } from '@/lib/supabase';

interface DashboardStatsProps {
  userEvents: Event[];
  savedEvents: Event[];
  loading?: boolean;
}

export default function DashboardStats({ userEvents, savedEvents, loading = false }: DashboardStatsProps) {
  // Calculate real statistics
  const upcomingEvents = userEvents.filter(event => new Date(event.date) >= new Date());
  const totalEvents = userEvents.length;
  const totalSavedEvents = savedEvents.length;

  const thisMonthEvents = upcomingEvents.filter(event => {
    const eventDate = new Date(event.date);
    const now = new Date();
    return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
  }).length;

  // Calculate growth (this could be enhanced with historical data)
  const recentEvents = userEvents.filter(event => {
    const eventDate = new Date(event.created_at || event.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return eventDate >= weekAgo;
  }).length;

  const stats = [
    {
      icon: FiCalendar,
      label: 'Total Events',
      value: totalEvents,
      color: 'blue',
      trend: recentEvents > 0 ? `+${recentEvents} this week` : 'No new events'
    },
    {
      icon: FiClock,
      label: 'Upcoming',
      value: upcomingEvents.length,
      color: 'green',
      trend: upcomingEvents.length > 0 ? `Next: ${new Date(upcomingEvents[0].date).toLocaleDateString()}` : 'None scheduled'
    },
    {
      icon: FiBookmark,
      label: 'Saved Events',
      value: totalSavedEvents,
      color: 'purple',
      trend: `${Math.round((totalSavedEvents / Math.max(totalEvents, 1)) * 100)}% of total events`
    },
    {
      icon: FiBarChart,
      label: 'This Month',
      value: thisMonthEvents,
      color: 'orange',
      trend: `${thisMonthEvents} event${thisMonthEvents !== 1 ? 's' : ''} planned`
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-xl mx-auto mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="card p-6 text-center hover:shadow-lg transition-shadow">
            <div className={`flex items-center justify-center w-12 h-12 bg-${stat.color}-100 rounded-xl mx-auto mb-4`}>
              <Icon className={`text-${stat.color}-600`} size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
            <div className="text-gray-600 text-sm mb-1">{stat.label}</div>
            <div className={`text-${stat.color}-600 text-xs flex items-center justify-center gap-1`}>
              <FiTrendingUp size={12} />
              {stat.trend}
            </div>
          </div>
        );
      })}
    </div>
  );
}
