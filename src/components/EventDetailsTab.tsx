import React, { useState, useEffect } from 'react';
import { FiMapPin, FiCalendar, FiClock, FiBookmark, FiImage } from 'react-icons/fi';
import Image from 'next/image';
import { EventItem } from '@/lib/types';
import ShareButtons from './ShareButtons';
import { useAuth } from '@/hooks/useAuth';
import { supabase, TABLES } from '@/lib/supabase';
import { getEventPrimaryImage, getAllImageUrls } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface EventDetailsTabProps {
  event: EventItem;
  onImageExpand: (index: number) => void;
}

const EventDetailsTab: React.FC<EventDetailsTabProps> = ({ event, onImageExpand }) => {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);



  // Check if event is saved on component mount
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from(TABLES.SAVED_EVENTS)
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', event.id)
          .single();

        if (data && !error) {
          setBookmarked(true);
        }
      } catch (error) {
        // Event not saved, that's fine
      }
    };

    checkIfSaved();
  }, [user, event.id]);

  // Save/Bookmark logic
  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || loading) return;

    setLoading(true);
    try {
      if (bookmarked) {
        // Remove from saved events
        const { error } = await supabase
          .from(TABLES.SAVED_EVENTS)
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', event.id);

        if (!error) {
          setBookmarked(false);
        }
      } else {
        // Add to saved events
        const { error } = await supabase
          .from(TABLES.SAVED_EVENTS)
          .insert({
            user_id: user.id,
            event_id: event.id
          });

        if (!error) {
          setBookmarked(true);
        }
      }
    } catch (error) {
      console.error('Error saving/unsaving event:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Event Image and Details Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Left Column: Event Images */}
        <div className="order-2 lg:order-1 h-full">
          {/* Primary Image */}
          <div
            className="relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 cursor-pointer border border-gray-200/50 bg-gradient-to-br from-gray-50 to-white h-full"
            onClick={() => onImageExpand(0)}
          >
            {/* Loading skeleton */}
            {imageLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-2xl" />
            )}

            {/* Loading spinner */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-400 border-t-transparent"></div>
              </div>
            )}

            <Image
              src={getEventPrimaryImage(event)}
              alt={event?.name ? `${event.name} main image` : 'Event Image'}
              width={600}
              height={400}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
              loading="eager"
              onLoad={() => setImageLoading(false)}
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                (e.target as HTMLImageElement).src = '/window.svg';
                setImageLoading(false);
              }}
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300">
                <FiImage size={24} className="text-gray-700" />
              </div>
            </div>

            {/* Image counter */}
            {getAllImageUrls(event?.image_urls).length > 1 && (
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                1 / {getAllImageUrls(event?.image_urls).length}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Location and Date/Time */}
        <div className="order-1 lg:order-2 space-y-4 sm:space-y-4">
          {/* Location Card */}
          <div className="flex flex-col gap-4 sm:gap-4 p-5 sm:p-5 rounded-2xl bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200/60 shadow-md hover:shadow-lg transition-all duration-300">
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
            <div className="flex flex-col gap-4 sm:gap-4 p-5 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-blue-50 border border-indigo-200/60 shadow-md hover:shadow-lg transition-all duration-300">
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

      {/* Additional Images Thumbnails */}
      {getAllImageUrls(event?.image_urls).length > 1 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {getAllImageUrls(event?.image_urls).slice(1, 6).map((imageUrl: string, index: number) => (
            <div
              key={index}
              className="relative cursor-pointer group rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200/50 hover:border-yellow-300 bg-white"
              onClick={() => onImageExpand(index + 1)}
            >
              <Image
                src={imageUrl}
                alt={event?.name ? `${event.name} image ${index + 2}` : `Event image ${index + 2}`}
                width={200}
                height={150}
                className="w-full h-20 sm:h-24 md:h-28 object-cover transition-all duration-300 group-hover:scale-110"
                loading="lazy"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg transform scale-75 group-hover:scale-100 transition-all duration-300">
                  <FiImage size={14} className="text-gray-700" />
                </div>
              </div>

              {/* More images indicator */}
              {index === 4 && getAllImageUrls(event?.image_urls).length > 6 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">+{getAllImageUrls(event?.image_urls).length - 6}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons Section */}
      <div className="pt-4 border-t border-gray-200/60 flex justify-center sm:justify-end gap-3">
        {/* Save/Bookmark button for logged-in users */}
        {user && (
          <button
            onClick={handleBookmark}
            className={`p-3 sm:p-2.5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-yellow-100 shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 border border-gray-200/50 min-w-[48px] min-h-[48px] flex items-center justify-center ${bookmarked ? 'text-yellow-700 bg-yellow-50' : ''} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={bookmarked ? 'Remove Bookmark' : 'Save Event'}
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
            ) : (
              <FiBookmark size={20} className={bookmarked ? 'fill-current' : ''} />
            )}
          </button>
        )}

        <ShareButtons event={event} />
      </div>
    </div>
  );
};

export default EventDetailsTab;
