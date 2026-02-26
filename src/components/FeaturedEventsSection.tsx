'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiCalendar, FiMapPin, FiClock, FiChevronRight, FiStar } from 'react-icons/fi';
import { Event } from '@/lib/supabase';

// Default placeholder image for events
const DEFAULT_EVENT_IMAGE = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgODAwIDYwMCI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiNlN2U3ZTciLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM5Y2EzYWYiPkV2ZW50PC90ZXh0Pjwvc3ZnPg==`;

interface FeaturedEventsSectionProps {
  events: Event[];
  maxVisible?: number;
}

export default function FeaturedEventsSection({ 
  events, 
  maxVisible = 3 
}: FeaturedEventsSectionProps) {
  const [showAll, setShowAll] = useState(false);

  if (events.length === 0) return null;

  const featuredEvents = events.slice(0, maxVisible);
  const hasMore = events.length > maxVisible;
  const visibleEvents = showAll ? events : featuredEvents;

  return (
    <div className="card overflow-hidden">
      {/* Header - Compact */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-yellow-500 flex items-center justify-center">
              <FiStar size={12} className="text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Featured Events</h3>
          </div>
          <Link
            href="#all-events"
            className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
          >
            View all
            <FiChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* Featured Event Cards - Horizontal scroll on mobile */}
      <div className="p-4 sm:p-6">
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible">
          {visibleEvents.map((event) => {
            const eventDate = event.date ? new Date(event.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            }) : 'TBA';
            const imageUrl = event.image_urls 
              ? (Array.isArray(event.image_urls) ? event.image_urls[0] : event.image_urls)
              : DEFAULT_EVENT_IMAGE;

            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="flex-shrink-0 w-[280px] sm:w-auto group"
              >
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-yellow-300 transition-all duration-300 group-hover:scale-[1.02]">
                  {/* Image */}
                  <div className="relative h-36 sm:h-40">
                    <Image
                      src={imageUrl}
                      alt={event.name || 'Event'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 280px, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    
                    {/* Date Badge */}
                    <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                      <p className="text-xs font-semibold text-gray-900">{eventDate}</p>
                    </div>

                    {/* Category Badge */}
                    {event.category && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-500 text-white rounded-lg text-xs font-medium">
                        {event.category}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-4">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1 group-hover:text-yellow-600 transition-colors">
                      {event.name}
                    </h4>
                    
                    <div className="mt-2 space-y-1.5">
                      {event.venue && (
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs sm:text-sm">
                          <FiMapPin size={12} />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      )}
                      
                      {event.location && (
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs sm:text-sm">
                          <FiMapPin size={12} />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    {(event.presale_price || event.gate_price) && (
                      <div className="mt-3 flex items-center gap-2">
                        {event.presale_price && (
                          <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-md">
                            ${event.presale_price} presale
                          </span>
                        )}
                        {event.gate_price && !event.presale_price && (
                          <span className="px-2 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-md">
                            ${event.gate_price} at gate
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Show More Button */}
        {hasMore && !showAll && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
            >
              <FiCalendar size={16} />
              View all {events.length} events
            </button>
          </div>
        )}
      </div>
    </div>
  );
}