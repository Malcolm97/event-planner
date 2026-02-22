'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiClock, FiChevronRight, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Activity } from '@/lib/supabase';

interface DashboardActivityProps {
  activities: Activity[];
  loading?: boolean;
}

export default function DashboardActivity({ activities, loading = false }: DashboardActivityProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const maxVisible = 5;
  const visibleActivities = showAll ? activities : activities.slice(0, maxVisible);
  const hasMore = activities.length > maxVisible;

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

  if (loading) {
    return (
      <div className="card p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3 sm:space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-200 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FiClock size={16} className="text-gray-600 sm:w-[18px] sm:h-[18px]" />
          <span className="hidden sm:inline">Recent Activity</span>
          <span className="sm:hidden">Activity</span>
        </h3>
        {activities.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-800 transition-colors text-xs sm:text-sm px-2 py-1 rounded-lg hover:bg-gray-100"
          >
            {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            <span className="hidden sm:inline">{isExpanded ? 'Less' : 'More'}</span>
          </button>
        )}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <div className="text-base sm:text-base lg:text-2xl mb-2 sm:mb-3">📭</div>
            <p className="text-gray-500 text-sm">No recent activity</p>
            <p className="text-gray-400 text-xs mt-1">Your activities will appear here</p>
          </div>
        ) : (
          <>
            {visibleActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-2 sm:gap-3">
                <div className={`w-2 h-2 ${getActivityColor(activity.activity_type)} rounded-full mt-1.5 sm:mt-2 flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-gray-900 leading-tight line-clamp-2">{activity.description}</div>
                  <div className="text-xs text-gray-500 mt-0.5 sm:mt-1">
                    {activity.event_name && (
                      <span className="font-medium hidden sm:inline">Event: {activity.event_name} • </span>
                    )}
                    {formatTimeAgo(activity.created_at)}
                  </div>
                </div>
              </div>
            ))}

            {hasMore && !isExpanded && (
              <div className="text-center pt-1 sm:pt-2">
                <button
                  onClick={() => setShowAll(true)}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all {activities.length} →
                </button>
              </div>
            )}

            {isExpanded && activities.length > maxVisible && (
              <div className="text-center pt-1 sm:pt-2">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showAll ? 'Show less' : `Show all ${activities.length}`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
