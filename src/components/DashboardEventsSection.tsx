'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiCalendar, FiEye, FiChevronDown, FiChevronUp, FiBookmark, FiClock } from 'react-icons/fi';
import EventCard from '@/components/EventCard';
import { Event } from '@/lib/supabase';

// Color mappings for different event section types
const sectionColors = {
  upcoming: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    dot: 'bg-blue-500',
    border: 'border-blue-200',
  },
  saved: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    dot: 'bg-yellow-500',
    border: 'border-yellow-200',
  },
  previous: {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    dot: 'bg-gray-500',
    border: 'border-gray-200',
  },
};

interface DashboardEventsSectionProps {
  title: string;
  events: Event[];
  icon: React.ComponentType<{ size?: number; className?: string }>;
  emptyState: {
    emoji: string;
    title: string;
    description: string;
    actionText?: string;
    actionLink?: string;
  };
  isOwner?: boolean;
  onDelete?: (eventId: string) => void;
  loading?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  maxVisible?: number;
  sectionType?: 'upcoming' | 'saved' | 'previous';
}

export default function DashboardEventsSection({
  title,
  events,
  icon: Icon,
  emptyState,
  isOwner = false,
  onDelete,
  loading = false,
  collapsible = false,
  defaultExpanded = true,
  maxVisible = 6,
  sectionType = 'upcoming'
}: DashboardEventsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showAll, setShowAll] = useState(false);

  const visibleEvents = showAll ? events : events.slice(0, maxVisible);
  const hasMore = events.length > maxVisible;
  const colors = sectionColors[sectionType];

  if (loading) {
    return (
      <div className="card p-3 sm:p-4 lg:p-5">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 sm:h-36 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-3 sm:p-4 lg:p-5 ${colors.bg}`}>
      {/* Header Section - Improved for mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          {/* Icon Container with color */}
          <div className={`w-8 h-8 ${colors.bg} ${colors.text} rounded-lg flex items-center justify-center`}>
            <Icon size={14} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-500 text-xs">{events.length} {events.length === 1 ? 'event' : 'events'}</p>
          </div>
        </div>

        {collapsible && events.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 ${colors.text} hover:opacity-80 transition-opacity text-sm font-medium px-3 py-2 rounded-lg touch-target`}
          >
            {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            <span className="hidden sm:inline">{isExpanded ? 'Collapse' : 'Expand'}</span>
          </button>
        )}
      </div>

      {/* Content Section */}
      {!isExpanded && collapsible ? null : events.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="text-4xl sm:text-5xl mb-4">{emptyState.emoji}</div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">{emptyState.title}</h3>
          <p className="text-gray-500 text-sm sm:text-base mb-6 sm:mb-8 max-w-sm mx-auto">{emptyState.description}</p>
          {emptyState.actionText && emptyState.actionLink && (
            <Link
              href={emptyState.actionLink}
              className="btn-primary gap-2 text-sm sm:text-base px-6 py-3 sm:px-8 sm:py-3 inline-flex"
            >
              <FiPlus size={16} />
              {emptyState.actionText}
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Event Cards Grid - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
            {visibleEvents.map(event => (
              <Link 
                key={event.id} 
                href={isOwner ? `/dashboard/edit-event/${event.id}` : `/events/${event.id}`}
                className="block"
              >
                <EventCard
                  event={event}
                  isOwner={isOwner}
                  onDelete={onDelete}
                />
              </Link>
            ))}
          </div>

          {/* Show More Button */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className={`btn-ghost gap-2 ${colors.text} hover:${colors.bg} text-sm sm:text-base px-4 py-2`}
              >
                <FiEye size={16} />
                {showAll ? 'Show Less' : `View All ${events.length} Events`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
