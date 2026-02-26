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
    <div className="py-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-500">
          Events ({totalEventsCount})
        </h4>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {events.map((event, index) => {
          const isUpcoming = isEventUpcomingOrActive(event);
          return (
            <div
              key={event.id || index}
              className="relative rounded-xl overflow-hidden group cursor-pointer shadow-md"
            >
              <div className="aspect-[4/3] relative">
                {getEventPrimaryImage(event) !== '/next.svg' ? (
                  <Image
                    src={getEventPrimaryImage(event)}
                    alt={event.name || 'Event'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 25vw"
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
                  <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-[9px] font-bold rounded-full">
                    UPCOMING
                  </div>
                )}
              </div>
              
              {/* Event info */}
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="text-white font-semibold text-xs truncate">{event.name}</p>
                {event.date && (
                  <p className="text-white/70 text-[10px] mt-0.5">
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