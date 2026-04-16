'use client';

import React from 'react';
import Image from 'next/image';
import { FiCalendar } from 'react-icons/fi';
import { isEventUpcomingOrActive, getEventPrimaryImage } from '@/lib/utils';
import { EventItem } from '@/lib/types';

interface CreatorEventsGalleryProps {
  events: EventItem[];
  totalEventsCount: number;
}

export default function CreatorEventsGallery({ events, totalEventsCount }: CreatorEventsGalleryProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="modal-section-card bg-white/80 border border-gray-100/80 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="modal-section-title text-gray-700">
          Events ({totalEventsCount})
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {events.map((event, index) => {
          const isUpcoming = isEventUpcomingOrActive(event);
          const eventImage = getEventPrimaryImage(event);
          return (
            <div
              key={event.id || index}
              className="relative rounded-2xl overflow-hidden group cursor-pointer shadow-md ring-1 ring-black/5"
            >
              <div className="aspect-[4/3] relative">
                {eventImage !== '/next.svg' ? (
                  <Image
                    src={eventImage}
                    alt={event.name ? `${event.name} event image` : 'Event image'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 25vw"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <FiCalendar size={20} className="text-gray-400" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                
                {/* Upcoming badge */}
                {isUpcoming && (
                  <div className="absolute top-2 right-2 inline-flex items-center px-2 py-1 rounded-full bg-green-500 text-white modal-caption font-bold leading-none tracking-[0.01em]">
                    UPCOMING
                  </div>
                )}
              </div>
              
              {/* Event info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="card-title text-white truncate">{event.name}</p>
                {event.date && (
                  <p className="card-meta text-white/75 mt-1">
                    {new Date(event.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}