'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiCalendar, FiEye, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import EventCard from '@/components/EventCard';
import { Event } from '@/lib/supabase';

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
  maxVisible = 6
}: DashboardEventsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showAll, setShowAll] = useState(false);

  const visibleEvents = showAll ? events : events.slice(0, maxVisible);
  const hasMore = events.length > maxVisible;

  if (loading) {
    return (
      <div className="card p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <span className="text-gray-500 text-sm">({events.length})</span>
        </div>

        {collapsible && events.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>

      {!isExpanded && collapsible ? null : events.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-6">{emptyState.emoji}</div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">{emptyState.title}</h3>
          <p className="text-gray-500 mb-8 text-lg max-w-md mx-auto">{emptyState.description}</p>
          {emptyState.actionText && emptyState.actionLink && (
            <Link
              href={emptyState.actionLink}
              className="btn-primary gap-2 text-lg px-8 py-4"
            >
              <FiPlus size={18} />
              {emptyState.actionText}
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            {visibleEvents.map(event => (
              <Link key={event.id} href={isOwner ? `/dashboard/edit-event/${event.id}` : `/events/${event.id}`}>
                <EventCard
                  event={event}
                  isOwner={isOwner}
                  onDelete={onDelete}
                />
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="btn-ghost gap-2"
              >
                <FiEye size={16} />
                {showAll ? 'Show Less' : `Show All ${events.length} Events`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
