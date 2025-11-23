'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { EventItem } from '@/lib/types';
import EventCard from '@/components/EventCard';
import { SkeletonEventCard, SkeletonGrid } from '@/components/SkeletonLoader';
import Button from '@/components/Button';

interface EventsListProps {
  events: EventItem[];
  loading?: boolean;
  onEventClick: (event: EventItem) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  showViewAllButton?: boolean;
  viewAllHref?: string;
  emptyStateMessage?: string;
  emptyStateIcon?: string;
  emptyStateTitle?: string;
}

const EventsList = memo(function EventsList({
  events,
  loading = false,
  onEventClick,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  showViewAllButton = true,
  viewAllHref = '/events',
  emptyStateMessage = 'Check back later for new events.',
  emptyStateIcon = '📅',
  emptyStateTitle = 'No upcoming events'
}: EventsListProps) {
  const [displayedEvents, setDisplayedEvents] = useState<EventItem[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Update displayed events when events prop changes
  useEffect(() => {
    if (events && events.length > 0) {
      setDisplayedEvents(events);
    } else {
      setDisplayedEvents([]);
    }
  }, [events]);

  const handleLoadMore = useCallback(async () => {
    if (!onLoadMore || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setIsLoadingMore(false);
    }
  }, [onLoadMore, isLoadingMore, hasMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const sentinel = document.getElementById('load-more-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [handleLoadMore, hasMore, isLoadingMore, onLoadMore]);

  if (loading) {
    return (
      <SkeletonGrid count={4}>
        <SkeletonEventCard />
      </SkeletonGrid>
    );
  }

  if (displayedEvents.length === 0) {
    return (
      <div className="col-span-full text-center py-20">
        <div className="text-8xl mb-6">{emptyStateIcon}</div>
        <h3 className="text-heading-lg mb-4">{emptyStateTitle}</h3>
        <p className="text-body-sm text-gray-500">{emptyStateMessage}</p>
        {showViewAllButton && (
          <Button
            variant="secondary"
            size="lg"
            className="mt-8"
            aria-label="Retry loading events"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-4 md:gap-8 animate-fade-in">
        {displayedEvents.map(event => (
          <EventCard
            key={event.id}
            event={event}
            onClick={() => onEventClick(event)}
          />
        ))}
      </div>

      {/* Load More Sentinel for Infinite Scroll */}
      {hasMore && (
        <div id="load-more-sentinel" className="flex justify-center py-8">
          {isLoadingMore ? (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
              <span className="text-sm text-gray-600">Loading more events...</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="lg"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              Load More Events
            </Button>
          )}
        </div>
      )}

      {/* View All Button */}
      {showViewAllButton && !hasMore && (
        <div className="flex justify-center mt-16">
          <Button asChild size="lg">
            <a href={viewAllHref}>
              View all Events
            </a>
          </Button>
        </div>
      )}
    </div>
  );
});

EventsList.displayName = 'EventsList';

export default EventsList;
