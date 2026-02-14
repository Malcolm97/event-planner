import React, { useState, useEffect } from 'react';
import { FiMapPin, FiCalendar, FiClock, FiBookmark, FiImage } from 'react-icons/fi';
import { EventItem } from '@/lib/types';
import ShareButtons from './ShareButtons';
import { useAuth } from '@/hooks/useAuth';
import { supabase, TABLES } from '@/lib/supabase';
import { getEventPrimaryImage, getValidImageUrls } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface EventDetailsTabProps {
  event: EventItem;
  onImageExpand: (index: number) => void;
}

interface ThumbnailImageProps {
  src: string;
  alt: string;
  onClick: () => void;
  showMoreIndicator?: boolean;
  moreCount?: number;
}

const ThumbnailImage: React.FC<ThumbnailImageProps> = ({
  src,
  alt,
  onClick,
  showMoreIndicator = false,
  moreCount = 0
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="relative cursor-pointer group rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200/50 hover:border-yellow-300 bg-white"
      onClick={onClick}
    >
      {/* Loading skeleton */}
      {imageLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-xl" />
      )}

      {/* Error state */}
      {imageError && !imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-1">📷</div>
            <p className="text-xs">Unavailable</p>
          </div>
        </div>
      )}

      {!imageError && (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
        />
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg transform scale-75 group-hover:scale-100 transition-all duration-300">
          <FiImage size={14} className="text-gray-700" />
        </div>
      </div>

      {/* More images indicator */}
      {showMoreIndicator && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-white font-bold text-sm">+{moreCount}</span>
        </div>
      )}
    </div>
  );
};

const EventDetailsTab: React.FC<EventDetailsTabProps> = ({ event, onImageExpand }) => {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);



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
    <div className="space-y-3 sm:space-y-4">
      {/* Event Image and Details Grid */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        {/* Left Column: Event Images */}
        <div className="order-2 lg:order-1 h-full">
          {/* Primary Image */}
          <div
            className="relative group rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200/50 bg-gradient-to-br from-gray-50 to-white aspect-[4/3] lg:aspect-auto"
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

            {/* Error state */}
            {imageError && !imageLoading && (
              <div
                className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100 rounded-2xl cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageError(false);
                  setImageLoading(true);
                }}
              >
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-sm font-medium">Image unavailable</p>
                  <p className="text-xs text-gray-400 mt-1">Click to try again</p>
                </div>
              </div>
            )}

            {!imageError && (
              <img
                src={getEventPrimaryImage(event)}
                alt={event?.name ? `${event.name} main image` : 'Event Image'}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                onLoad={() => {
                  setImageLoading(false);
                  setImageError(false);
                }}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300">
                <FiImage size={24} className="text-gray-700" />
              </div>
            </div>

            {/* Image counter */}
            {getValidImageUrls(event?.image_urls).length > 1 && (
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                1 / {getValidImageUrls(event?.image_urls).length}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Location and Date/Time */}
        <div className="order-1 lg:order-2 space-y-2 sm:space-y-3">
          {/* Location Card */}
          <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200/60 shadow-sm">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
              <FiMapPin size={14} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-700 text-xs sm:text-sm font-medium">
                {event?.location || 'Not specified'}
              </p>
              {event?.venue && (
                <p className="text-gray-500 text-xs mt-0.5">{event.venue}</p>
              )}
            </div>
          </div>

          {/* Date & Time Card */}
          {event?.date && (
            <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-indigo-50 via-white to-blue-50 border border-indigo-200/60 shadow-sm">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
                <FiCalendar size={14} className="text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-700 text-xs sm:text-sm font-medium">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                  {event.end_date && ` - ${new Date(event.end_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}`}
                </p>
                <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                  <FiClock size={10} className="text-orange-600" />
                  {new Date(event.date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                  {event.end_date &&
                    ` - ${new Date(event.end_date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Images Thumbnails */}
      {getValidImageUrls(event?.image_urls).length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {getValidImageUrls(event?.image_urls).slice(1, 6).map((imageUrl: string, index: number) => (
            <ThumbnailImage
              key={index}
              src={imageUrl}
              alt={event?.name ? `${event.name} image ${index + 2}` : `Event image ${index + 2}`}
              onClick={() => onImageExpand(index + 1)}
              showMoreIndicator={index === 4 && getValidImageUrls(event?.image_urls).length > 6}
              moreCount={getValidImageUrls(event?.image_urls).length - 6}
            />
          ))}
        </div>
      )}

      {/* Action Buttons Section */}
      <div className="pt-2 border-t border-gray-200/60 flex justify-center sm:justify-end gap-2">
        {/* Save/Bookmark button for logged-in users */}
        {user && (
          <button
            onClick={handleBookmark}
            className={`p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-yellow-100 shadow-md hover:shadow-lg transition-all duration-200 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 border border-gray-200/50 w-9 h-9 flex items-center justify-center ${bookmarked ? 'text-yellow-700 bg-yellow-50' : ''} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={bookmarked ? 'Remove Bookmark' : 'Save Event'}
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
            ) : (
              <FiBookmark size={16} className={bookmarked ? 'fill-current' : ''} />
            )}
          </button>
        )}

        <ShareButtons event={event} />
      </div>
    </div>
  );
};

export default EventDetailsTab;
