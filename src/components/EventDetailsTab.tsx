import React, { useState, useEffect, useMemo } from 'react';
import { FiMapPin, FiCalendar, FiClock, FiBookmark, FiImage, FiCopy, FiNavigation, FiCalendar as FiCalendarAdd, FiCheck } from 'react-icons/fi';
import { EventItem } from '@/lib/types';
import ShareButtons from './ShareButtons';
import { useAuth } from '@/hooks/useAuth';
import { supabase, TABLES } from '@/lib/supabase';
import { getValidImageUrls, isEventPast, isEventCurrentlyHappening } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface EventDetailsTabProps {
  event: EventItem;
  onImageExpand: (index: number) => void;
}

// Event Status Badge Component
interface EventStatusBadgeProps {
  event: EventItem;
}

const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({ event }) => {
  const status = useMemo(() => {
    if (!event?.date) return null;

    const now = new Date();
    const eventDate = new Date(event.date);

    // Check if event has ended
    if (isEventPast(event)) {
      return { label: 'Event Ended', color: 'bg-gray-500/90 text-white', icon: '📅' };
    }

    // Check if event is currently happening
    if (isEventCurrentlyHappening(event)) {
      return { label: 'Happening Now!', color: 'bg-green-500/90 text-white animate-pulse', icon: '🔴' };
    }

    // Calculate days until event
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDay = new Date(eventDate);
    eventDay.setHours(0, 0, 0, 0);

    const diffTime = eventDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { label: 'Today!', color: 'bg-yellow-500/90 text-white', icon: '⭐' };
    } else if (diffDays === 1) {
      return { label: 'Tomorrow', color: 'bg-orange-500/90 text-white', icon: '🌅' };
    } else if (diffDays <= 7) {
      return { label: `In ${diffDays} days`, color: 'bg-blue-500/90 text-white', icon: '📆' };
    } else if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return { label: `In ${weeks} week${weeks > 1 ? 's' : ''}`, color: 'bg-indigo-500/90 text-white', icon: '🗓️' };
    } else {
      const months = Math.floor(diffDays / 30);
      return { label: `In ${months} month${months > 1 ? 's' : ''}`, color: 'bg-purple-500/90 text-white', icon: '📅' };
    }
  }, [event]);

  if (!status) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${status.color} shadow-lg`}>
      <span>{status.icon}</span>
      <span>{status.label}</span>
    </div>
  );
};

// Quick Action Button Component
interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
  loading = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex flex-col items-center justify-center gap-1 p-2 sm:p-3 rounded-xl transition-all duration-200 min-w-[60px] sm:min-w-[72px] ${
        active
          ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'
          : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
      } ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-95'}`}
      aria-label={label}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-yellow-500" />
      ) : (
        icon
      )}
      <span className="text-[10px] sm:text-xs font-medium">{label}</span>
    </button>
  );
};

const EventDetailsTab: React.FC<EventDetailsTabProps> = ({ event, onImageExpand }) => {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copied, setCopied] = useState<'location' | null>(null);

  const validImageUrls = useMemo(() => getValidImageUrls(event?.image_urls), [event?.image_urls]);

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
  const handleBookmark = async () => {
    if (!user) {
      toast.error('Please sign in to save events');
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      if (bookmarked) {
        const { error } = await supabase
          .from(TABLES.SAVED_EVENTS)
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', event.id);

        if (!error) {
          setBookmarked(false);
          toast.success('Event removed from saved');
        }
      } else {
        const { error } = await supabase
          .from(TABLES.SAVED_EVENTS)
          .insert({
            user_id: user.id,
            event_id: event.id
          });

        if (!error) {
          setBookmarked(true);
          toast.success('Event saved!');
        }
      }
    } catch (error) {
      console.error('Error saving/unsaving event:', error);
      toast.error('Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  // Copy location to clipboard
  const handleCopyLocation = async () => {
    if (!event?.location) return;

    try {
      await navigator.clipboard.writeText(event.location);
      setCopied('location');
      toast.success('Location copied!');
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast.error('Failed to copy location');
    }
  };

  // Open directions in Google Maps
  const handleGetDirections = () => {
    if (!event?.location && !event?.venue) return;

    // Combine venue and location for more specific search
    // e.g., "Stanley Hotel, Port Moresby" instead of just "Port Moresby"
    const searchQuery = event.venue && event.location
      ? `${event.venue}, ${event.location}`
      : event.venue || event.location;

    const encodedQuery = encodeURIComponent(searchQuery);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedQuery}`, '_blank');
  };

  // Add to Calendar
  const handleAddToCalendar = () => {
    if (!event?.date) return;

    const startDate = new Date(event.date);
    const endDate = event.end_date ? new Date(event.end_date) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.set('text', event.name || 'Event');
    googleCalendarUrl.searchParams.set('dates', `${formatDate(startDate)}/${formatDate(endDate)}`);
    if (event.location) {
      googleCalendarUrl.searchParams.set('location', event.location);
    }
    if (event.description) {
      googleCalendarUrl.searchParams.set('details', event.description);
    }

    window.open(googleCalendarUrl.toString(), '_blank');
  };

  // Format date with relative time and end date
  const formatDateInfo = () => {
    if (!event?.date) return null;

    const startDate = new Date(event.date);
    const endDate = event.end_date ? new Date(event.end_date) : null;
    const now = new Date();
    const diffMs = startDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Check if it's a same-day event
    const isSameDay = endDate
      ? startDate.toDateString() === endDate.toDateString()
      : true;

    // Format start date
    const formattedStartDate = startDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: startDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });

    // Format start time
    const formattedStartTime = startDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Format end date and time
    let formattedEndDate = '';
    let formattedEndTime = '';
    let duration = '';

    if (endDate) {
      formattedEndDate = endDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: endDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
      formattedEndTime = endDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // Calculate duration
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
      const durationDays = Math.floor(durationHours / 24);
      const remainingHours = durationHours % 24;

      if (durationDays > 0) {
        duration = `${durationDays} day${durationDays > 1 ? 's' : ''}`;
        if (remainingHours > 0) {
          duration += ` ${remainingHours} hr${remainingHours > 1 ? 's' : ''}`;
        }
      } else if (durationHours > 0) {
        duration = `${durationHours} hour${durationHours > 1 ? 's' : ''}`;
      }
    }

    // Relative time
    let relativeTime = '';
    if (diffDays > 0 && diffDays <= 7) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      if (hours < 24) {
        relativeTime = `in ${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        relativeTime = `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
      }
    }

    // Full formatted date for display
    const fullFormattedDate = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: startDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });

    return {
      formattedStartDate,
      formattedStartTime,
      formattedEndDate,
      formattedEndTime,
      fullFormattedDate,
      relativeTime,
      duration,
      isSameDay,
      hasEndDate: !!endDate
    };
  };

  const dateInfo = formatDateInfo();

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Mobile: Status Banner - Centered */}
      <div className="flex items-center justify-center md:hidden">
        <EventStatusBadge event={event} />
      </div>

      {/* Two-Column Layout for Tablet/Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Left Column: Image Gallery */}
        <div className="space-y-2">
          {/* Primary Image */}
          <div
            className="relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200/50 bg-gradient-to-br from-gray-50 to-white aspect-[16/9] md:aspect-[4/3]"
            onClick={() => onImageExpand(activeImageIndex)}
          >
            {/* Loading skeleton */}
            {imageLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-2xl" />
            )}

            {/* Error state */}
            {imageError && !imageLoading && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageError(false);
                  setImageLoading(true);
                }}
              >
                <div className="text-center text-gray-500">
                  <div className="text-5xl mb-3">📷</div>
                  <p className="text-sm font-medium">Image unavailable</p>
                  <p className="text-xs text-gray-400 mt-1">Tap to retry</p>
                </div>
              </div>
            )}

            {!imageError && validImageUrls[activeImageIndex] && (
              <img
                src={validImageUrls[activeImageIndex]}
                alt={event?.name ? `${event.name} image` : 'Event Image'}
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300">
                <FiImage size={24} className="text-gray-700" />
              </div>
            </div>

            {/* Image counter */}
            {validImageUrls.length > 1 && (
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <FiImage size={12} />
                <span>{activeImageIndex + 1} / {validImageUrls.length}</span>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {validImageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {validImageUrls.map((imageUrl: string, index: number) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveImageIndex(index);
                    setImageLoading(true);
                  }}
                  className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    activeImageIndex === index
                      ? 'border-yellow-400 ring-2 ring-yellow-400/30'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`${event?.name} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Event Details */}
        <div className="space-y-3 md:space-y-4">
          {/* Tablet/Desktop: Status Banner */}
          <div className="hidden md:flex items-center justify-start">
            <EventStatusBadge event={event} />
          </div>

          {/* Date & Time Card */}
          {dateInfo && (
            <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl p-4 border border-indigo-200/60 shadow-sm">
              {/* Same-day event - Compact display */}
              {dateInfo.isSameDay ? (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                    <FiCalendar size={22} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-semibold text-sm sm:text-base">
                      {dateInfo.fullFormattedDate}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <FiClock size={14} className="text-indigo-500" />
                      <span className="text-gray-700 text-sm font-medium">
                        {dateInfo.formattedStartTime}
                        {dateInfo.formattedEndTime && ` - ${dateInfo.formattedEndTime}`}
                      </span>
                    </div>
                    {dateInfo.duration && (
                      <div className="mt-1.5 text-xs text-indigo-600 font-medium">
                        ⏱️ {dateInfo.duration}
                      </div>
                    )}
                    {dateInfo.relativeTime && (
                      <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                        ⏰ {dateInfo.relativeTime}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAddToCalendar}
                    className="flex-shrink-0 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
                    aria-label="Add to Calendar"
                  >
                    <FiCalendarAdd size={18} className="text-gray-500 group-hover:text-indigo-600" />
                  </button>
                </div>
              ) : (
                /* Multi-day event - Split display */
                <div className="space-y-3">
                  {/* Start Date/Time */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
                      <span className="text-white text-xs font-bold">START</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-semibold text-sm">
                        {dateInfo.formattedStartDate}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <FiClock size={12} className="text-green-500" />
                        <span className="text-gray-700 text-sm">{dateInfo.formattedStartTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Divider with duration */}
                  <div className="flex items-center gap-2 px-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />
                    {dateInfo.duration && (
                      <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                        ⏱️ {dateInfo.duration}
                      </span>
                    )}
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />
                  </div>

                  {/* End Date/Time */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-md">
                      <span className="text-white text-xs font-bold">END</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-semibold text-sm">
                        {dateInfo.formattedEndDate}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <FiClock size={12} className="text-red-500" />
                        <span className="text-gray-700 text-sm">{dateInfo.formattedEndTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Relative time and calendar button */}
                  <div className="flex items-center justify-between pt-2 border-t border-indigo-200/60">
                    {dateInfo.relativeTime && (
                      <div className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                        ⏰ {dateInfo.relativeTime}
                      </div>
                    )}
                    <button
                      onClick={handleAddToCalendar}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-xs font-medium text-gray-600"
                      aria-label="Add to Calendar"
                    >
                      <FiCalendarAdd size={14} />
                      <span>Add to Calendar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Location Card */}
          {event?.location && (
            <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 rounded-2xl p-4 border border-blue-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                  <FiMapPin size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  {event?.venue && (
                    <p className="text-gray-900 font-semibold text-sm truncate">{event.venue}</p>
                  )}
                  <p className="text-gray-700 text-sm mt-0.5 break-words">{event.location}</p>
                </div>
              </div>

              {/* Location Actions */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleCopyLocation}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm font-medium text-gray-700"
                >
                  {copied === 'location' ? (
                    <>
                      <FiCheck size={16} className="text-green-500" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <FiCopy size={16} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleGetDirections}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition-all duration-200 text-sm font-medium text-white shadow-sm"
                >
                  <FiNavigation size={16} />
                  <span>Directions</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Bar - Full Width at Bottom */}
      <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-3 border border-gray-200/60">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <QuickActionButton
            icon={<FiBookmark size={18} className={bookmarked ? 'fill-current' : ''} />}
            label="Save"
            onClick={handleBookmark}
            active={bookmarked}
            loading={loading}
            disabled={!user}
          />
          <QuickActionButton
            icon={<FiCalendarAdd size={18} />}
            label="Calendar"
            onClick={handleAddToCalendar}
          />
          <QuickActionButton
            icon={<FiNavigation size={18} />}
            label="Directions"
            onClick={handleGetDirections}
            disabled={!event?.location && !event?.venue}
          />
          <div className="flex-shrink-0">
            <ShareButtons event={event} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsTab;