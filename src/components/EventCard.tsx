import React, { memo, useMemo, useState, useEffect } from 'react';
import { FiStar, FiMapPin, FiCalendar, FiDollarSign, FiClock, FiShare2, FiBookmark, FiTrash2, FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile, FiUsers, FiEye } from 'react-icons/fi';
import { FaFacebook, FaTwitter, FaLinkedin, FaWhatsapp } from 'react-icons/fa';
import { EventItem } from '@/lib/types';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { getEventPrimaryImage, isEventUpcomingOrActive } from '@/lib/utils';
import { supabase, TABLES, recordActivity } from '@/lib/supabase';
import { toast } from 'react-hot-toast';


// Define category mappings directly in this component
const categoryColorMap: { [key: string]: string } = {
  'Music': 'bg-purple-500/90 text-white',
  'Art': 'bg-pink-500/90 text-white',
  'Food': 'bg-orange-500/90 text-white',
  'Technology': 'bg-blue-500/90 text-white',
  'Wellness': 'bg-emerald-500/90 text-white',
  'Comedy': 'bg-yellow-500/90 text-white',
  'Other': 'bg-gray-500/90 text-white',
};

const categoryIconMap: { [key: string]: React.ComponentType<{ size?: number; className?: string }> } = {
  'Music': FiMusic,
  'Art': FiImage,
  'Food': FiCoffee,
  'Technology': FiCpu,
  'Wellness': FiHeart,
  'Comedy': FiSmile,
  'Other': FiStar,
};

// Helper function to format date
const formatDate = (date: Date): string => {
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();

  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
};

// ShareButtons Component
function ShareButtons({ event }: { event: EventItem }) {
  const [showShareOptions, setShowShareOptions] = useState<boolean>(false);
  const [eventUrl, setEventUrl] = useState<string>('');
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      setEventUrl(`${window.location.origin}/events/${event.id}`);
    }
  }, [event.id]);

  const shareText = `Check out this event: ${event.name ?? ''} at ${event.location ?? ''} on ${event.date ? new Date(event.date).toLocaleDateString() : ''}.`;

  const handleShare = async () => {
    if (isClient && navigator.share) {
      try {
        await navigator.share({
          title: event.name ?? '',
          text: shareText,
          url: eventUrl,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      setShowShareOptions((prev) => !prev);
    }
  };

  const shareOnFacebook = () => {
    if (typeof window !== 'undefined' && eventUrl) {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`, '_blank');
    }
  };

  const shareOnTwitter = () => {
    if (typeof window !== 'undefined' && eventUrl) {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(eventUrl)}`, '_blank');
    }
  };

  const shareOnLinkedIn = () => {
    if (typeof window !== 'undefined' && eventUrl) {
      window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(eventUrl)}&title=${encodeURIComponent(event.name ?? '')}&summary=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  const shareOnWhatsApp = () => {
    if (typeof window !== 'undefined' && eventUrl) {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${eventUrl}`)}`, '_blank');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleShare();
        }}
        className="p-2 rounded-xl bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 border border-gray-200/50 min-w-[36px] min-h-[36px] flex items-center justify-center"
        aria-label="Share Event"
      >
        <FiShare2 size={14} />
      </button>

      {showShareOptions && (
        <div className="absolute bottom-full right-0 mb-2 w-auto bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-100/50 p-2 flex gap-1 z-30 animate-slide-up">
          <button onClick={(e) => { e.stopPropagation(); shareOnFacebook(); }} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" aria-label="Share on Facebook">
            <FaFacebook size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); shareOnTwitter(); }} className="p-2 rounded-lg hover:bg-sky-50 text-sky-500 transition-colors" aria-label="Share on Twitter">
            <FaTwitter size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); shareOnLinkedIn(); }} className="p-2 rounded-lg hover:bg-blue-50 text-blue-700 transition-colors" aria-label="Share on LinkedIn">
            <FaLinkedin size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); shareOnWhatsApp(); }} className="p-2 rounded-lg hover:bg-green-50 text-green-500 transition-colors" aria-label="Share on WhatsApp">
            <FaWhatsapp size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

const EventCard = memo(function EventCard({ event, onClick, onDelete, isOwner = false }: { event: EventItem; onClick?: () => void; onDelete?: (eventId: string) => void; isOwner?: boolean }) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  // Memoize expensive computations
  const categoryLabel = useMemo(() => event.category?.trim() || 'Other', [event.category]);
  const categoryColor = useMemo(() => categoryColorMap[categoryLabel] || 'bg-gray-500/90 text-white', [categoryLabel]);
  const Icon = useMemo(() => categoryIconMap[categoryLabel] || FiStar, [categoryLabel]);

  // Memoize date calculations
  const now = useMemo(() => new Date(), []);
  const isNew = useMemo(() =>
    event.created_at && (now.getTime() - new Date(event.created_at).getTime() < 1000 * 60 * 60 * 24 * 7),
    [event.created_at, now]
  );
  // Use proper timing logic - event is current/upcoming if it hasn't ended yet
  const isCurrentEvent = useMemo(() =>
    isEventUpcomingOrActive(event),
    [event.date, event.end_date]
  );
  const isPopular = useMemo(() =>
    isCurrentEvent && saveCount >= 5,
    [isCurrentEvent, saveCount]
  );

  // Memoize formatted dates and times
  const formattedDate = useMemo(() => {
    if (!event.date) return null;
    const date = new Date(event.date);
    return formatDate(date);
  }, [event.date]);

  const formattedTime = useMemo(() => {
    if (!event.date) return null;
    const date = new Date(event.date);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }, [event.date]);

  const formattedEndDate = useMemo(() => {
    if (!event.end_date) return null;
    const date = new Date(event.end_date);
    return formatDate(date);
  }, [event.end_date]);

  const formattedEndTime = useMemo(() => {
    if (!event.end_date) return null;
    const date = new Date(event.end_date);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }, [event.end_date]);

  // Memoize image source with better error handling
  const imageSrc = useMemo(() => {
    try {
      const src = getEventPrimaryImage(event);
      return src;
    } catch (error) {
      console.error('Error getting image for event:', event.name, error);
      return '/next.svg';
    }
  }, [event.image_urls, event.name, event.date, event]);

  // Fetch save count for popular badge logic
  useEffect(() => {
    const fetchSaveCount = async () => {
      try {
        const { count, error } = await supabase
          .from(TABLES.SAVED_EVENTS)
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);

        if (!error && count !== null) {
          setSaveCount(count);
        }
      } catch (error) {
        console.error('Error fetching save count:', error);
      }
    };

    fetchSaveCount();
  }, [event.id]);

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
        const { error } = await supabase
          .from(TABLES.SAVED_EVENTS)
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', event.id);

        if (!error) {
          setBookmarked(false);
          setSaveCount(prev => Math.max(0, prev - 1));
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
          setSaveCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error saving/unsaving event:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete event logic
  const performDelete = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Authentication session expired. Please sign in again.');
        setDeleting(false);
        return;
      }

      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error deleting event:', errorData);
        toast.error(errorData.error || 'Failed to delete event. Please try again.');
        setDeleting(false);
        return;
      }

      if (onDelete) {
        onDelete(event.id);
      }

      await recordActivity(
        user.id,
        'event_completed',
        `Deleted event: ${event.name}`,
        { event_id: event.id, event_name: event.name },
        event.id,
        event.name
      );

      toast.success('Event deleted successfully.');

    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || deleting || !isOwner) return;

    toast((t) => (
      <div className="p-2">
        <p className="font-semibold mb-2 text-gray-900">Delete Event</p>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete "{event.name}"? This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              performDelete();
            }}
            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  return (
    <article
      data-event-id={event.id}
      className="group relative bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full border border-gray-100/50"
      tabIndex={0}
      role="button"
      aria-label={`View details for ${event.name} event`}
      onClick={() => {
        if (typeof onClick === 'function') {
          onClick();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (typeof onClick === 'function') {
            onClick();
          }
        }
      }}
    >
      {/* Hero Image Area */}
      <div className="relative h-36 sm:h-44 md:h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {imageSrc && (typeof imageSrc === 'string') ? (
          (imageSrc.startsWith('data:') || imageSrc.startsWith('blob:')) ? (
            <img
              src={imageSrc}
              alt={`Event image for ${event.name}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <Image
              src={imageSrc}
              alt={`Event image for ${event.name}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="transition-transform duration-700 group-hover:scale-110 object-cover"
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-200/50 flex items-center justify-center">
              <FiImage size={32} className="text-gray-300" />
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
          <div className="flex flex-wrap gap-1.5">
            {event.featured && (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg">
                Featured
              </span>
            )}
            {isPopular && (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg flex items-center gap-1">
                <FiStar size={10} /> Popular
              </span>
            )}
            {isNew && (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg">
                New
              </span>
            )}
          </div>

          {/* Category Badge */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold ${categoryColor} shadow-lg backdrop-blur-sm`}>
            <Icon size={10} />
            {categoryLabel}
          </span>
        </div>

        {/* Price Badge - Bottom Left */}
        <div className="absolute bottom-3 left-3 z-10">
          {event.presale_price !== undefined && event.presale_price !== null ? (
            event.presale_price === 0 ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/95 backdrop-blur-sm text-gray-900 shadow-lg flex items-center gap-1">
                Free Event
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg">
                K{event.presale_price.toFixed(0)}
              </span>
            )
          ) : null}
        </div>

        {/* Gate Price - Bottom Right */}
        {event.gate_price !== undefined && event.gate_price !== null && event.gate_price > 0 && (
          <div className="absolute bottom-3 right-3 z-10">
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/95 backdrop-blur-sm text-gray-700 shadow-lg">
              Gate: K{event.gate_price.toFixed(0)}
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5">
        {/* Event Title */}
        <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight group-hover:text-yellow-600 transition-colors line-clamp-2 mb-3 text-left">
          {event.name}
        </h3>

        {/* Location */}
        <div className="flex items-start gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
            <FiMapPin size={12} />
          </div>
          <span className="text-sm text-gray-600 font-medium line-clamp-1">{event.location}</span>
        </div>

        {/* Date and Time */}
        {event.date && (
          <div className="flex items-start gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-red-50 text-red-600 flex-shrink-0">
              <FiCalendar size={12} />
            </div>
            <div>
              <span className="text-sm text-gray-700 font-medium block">
                {formattedEndDate ? (
                  <>
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(event.end_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </>
                ) : (
                  formattedDate
                )}
              </span>
              {formattedTime && (
                <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <FiClock size={10} />
                  {formattedTime}
                  {formattedEndTime ? ` - ${formattedEndTime}` : ''}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Save Count */}
        {saveCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
            <FiUsers size={12} />
            <span>{saveCount} {saveCount === 1 ? 'save' : 'saves'}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100/50">
          <div className="flex items-center gap-2">
            {/* Delete button for event owners */}
            {isOwner && (
              <button
                className={`p-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 min-w-[40px] min-h-[40px] flex items-center justify-center ${
                  deleting 
                    ? 'bg-red-100 text-red-400 cursor-not-allowed opacity-50' 
                    : 'bg-red-50 hover:bg-red-100 text-red-600'
                }`}
                aria-label="Delete Event"
                onClick={handleDelete}
                disabled={deleting}
                tabIndex={0}
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                ) : (
                  <FiTrash2 size={14} />
                )}
              </button>
            )}

            {/* Save/Bookmark button for logged-in users */}
            {user && (
              <button
                className={`p-2.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 min-w-[40px] min-h-[40px] flex items-center justify-center shadow-sm ${
                  bookmarked 
                    ? 'bg-yellow-400 text-gray-900' 
                    : 'bg-gray-50 hover:bg-yellow-50 text-gray-600 hover:text-yellow-600'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={bookmarked ? 'Remove Bookmark' : 'Save Event'}
                onClick={handleBookmark}
                disabled={loading}
                tabIndex={0}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                ) : (
                  <FiBookmark size={14} className={bookmarked ? 'fill-current' : ''} />
                )}
              </button>
            )}
          </div>

          {/* Share Button */}
          <ShareButtons event={event} />
        </div>
      </div>
    </article>
  );
});

// Set displayName for React DevTools
EventCard.displayName = "EventCard";

export default EventCard;
