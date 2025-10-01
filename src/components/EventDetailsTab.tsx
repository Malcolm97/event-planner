import React from 'react';
import { FiMapPin, FiCalendar, FiClock } from 'react-icons/fi';
import { EventItem } from '@/lib/types';
import ImageGallery from './ImageGallery';
import ShareButtons from './ShareButtons';

interface EventDetailsTabProps {
  event: EventItem;
  onImageExpand: (index: number) => void;
}

const EventDetailsTab: React.FC<EventDetailsTabProps> = ({ event, onImageExpand }) => {
  return (
    <div className="space-y-6">
      {/* Event Image and Details Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Left Column: Event Images */}
        <div className="order-2 lg:order-1">
          <ImageGallery event={event} onImageExpand={onImageExpand} />
        </div>

        {/* Right Column: Location and Date/Time */}
        <div className="order-1 lg:order-2 space-y-4">
          {/* Location Card */}
          <div className="flex flex-col gap-4 p-5 rounded-2xl bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200/60 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-sm">
                <FiMapPin size={18} className="text-blue-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Location</h3>
                  <p className="text-gray-700 text-base leading-relaxed font-medium">
                    {event?.location || 'Not specified'}
                  </p>
                </div>
                {event?.venue && (
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">Venue</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {event.venue}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Date & Time Card */}
          {event?.date && (
            <div className="flex flex-col gap-4 p-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-blue-50 border border-indigo-200/60 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-sm">
                  <FiCalendar size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Date & Time</h3>
                  <div className="space-y-1">
                    <p className="text-gray-700 text-base font-medium leading-relaxed">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {event.end_date ?
                        ` - ${new Date(event.end_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}`
                        : ''}
                    </p>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FiClock size={14} />
                      <p className="text-sm leading-relaxed">
                        {new Date(event.date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                        {event.end_date ?
                          ` - ${new Date(event.end_date).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}`
                          : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Social Share Section */}
      <div className="pt-4 border-t border-gray-200/60 flex justify-center sm:justify-end">
        <ShareButtons event={event} />
      </div>
    </div>
  );
};

export default EventDetailsTab;
