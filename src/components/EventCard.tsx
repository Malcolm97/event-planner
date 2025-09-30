import React from 'react';
import { FiStar, FiMapPin, FiCalendar, FiDollarSign, FiClock, FiShare2, FiLink, FiHome, FiBookmark, FiTrash2, FiEdit, FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile } from 'react-icons/fi';
import { FaFacebook, FaTwitter, FaLinkedin, FaWhatsapp } from 'react-icons/fa';
import { EventItem } from '@/lib/types';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getEventPrimaryImage } from '@/lib/utils';
import { supabase, TABLES, recordActivity } from '@/lib/supabase';

// Define category mappings directly in this component
const categoryColorMap: { [key: string]: string } = {
  'Music': 'bg-purple-100 text-purple-600',
  'Art': 'bg-pink-100 text-pink-600',
  'Food': 'bg-orange-100 text-orange-600',
  'Technology': 'bg-blue-100 text-blue-600',
  'Wellness': 'bg-green-100 text-green-600',
  'Comedy': 'bg-yellow-100 text-yellow-600',
  'Other': 'bg-gray-100 text-gray-700',
};

const categoryIconMap: { [key: string]: any } = {
  'Music': FiMusic,
  'Art': FiImage,
  'Food': FiCoffee,
  'Technology': FiCpu,
  'Wellness': FiHeart,
  'Comedy': FiSmile,
  'Other': FiStar,
};

// Helper function to format date as "16th September, 2025"
const formatDate = (date: Date): string => {
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();

  // Add ordinal suffix
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

const EventCard = React.memo(function EventCard({ event, onClick, onDelete, isOwner = false }: { event: EventItem; onClick?: () => void; onDelete?: (eventId: string) => void; isOwner?: boolean }) {
  const categoryLabel = event.category?.trim() || 'Other';
  const categoryColor = categoryColorMap[categoryLabel] || 'bg-gray-100 text-gray-700';
  const Icon = categoryIconMap[categoryLabel] || FiStar;
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  // New badge logic (created within last 7 days)
  const now = new Date();
  const isNew = event.created_at && (now.getTime() - new Date(event.created_at).getTime() < 1000 * 60 * 60 * 24 * 7);

  // Check if event is current (not past)
  const isCurrentEvent = event.date && new Date(event.date) >= now;

  // Popular badge logic: only show on current events with high save count by logged-in users
  const isPopular = isCurrentEvent && saveCount >= 5; // Threshold for popular events

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
        // Remove from saved events
        const { error } = await supabase
          .from(TABLES.SAVED_EVENTS)
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', event.id);

        if (!error) {
          setBookmarked(false);
          setSaveCount(prev => Math.max(0, prev - 1)); // Update save count
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
          setSaveCount(prev => prev + 1); // Update save count
        }
      }
    } catch (error) {
      console.error('Error saving/unsaving event:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete event logic
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || deleting || !isOwner) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      // Delete the event from Supabase
      const { error } = await supabase
        .from(TABLES.EVENTS)
        .delete()
        .eq('id', event.id)
        .eq('created_by', user.id); // Ensure user can only delete their own events

      if (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
        return;
      }

      // Call the onDelete callback to refresh the events list
      if (onDelete) {
        onDelete(event.id);
      }

      // Record activity
      await recordActivity(
        user.id,
        'event_completed', // Using existing activity type
        `Deleted event: ${event.name}`,
        { event_id: event.id, event_name: event.name },
        event.id,
        event.name
      );

    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="group relative card cursor-pointer overflow-hidden card-hover h-full rounded-2xl shadow transition-transform duration-200 hover:scale-[1.025] focus-within:scale-[1.025] focus:outline-none"
      tabIndex={0}
      aria-label={event.name}
      onClick={() => {
        if (typeof onClick === 'function') {
          onClick();
        }
      }}
    >
      {/* Top Badges Row */}
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 flex flex-row flex-wrap items-center gap-1 sm:gap-2 min-w-[0]">
        {/* Popular Badge */}
        {isPopular && (
          <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700 shadow">Popular</span>
        )}
        {/* Featured Badge */}
        {event.featured && (
          <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-lg">Featured</span>
        )}
        {/* New Badge */}
        {isNew && (
          <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold bg-green-200 text-green-800 shadow">New</span>
        )}
      </div>

      {/* Category Badge & Bookmark - Top Right */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex items-center gap-1 sm:gap-2">
        <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold ${categoryColor} shadow-md backdrop-blur-sm`}>
          <Icon size={10} className="sm:w-3 sm:h-3" />
          <span className="hidden sm:inline">{categoryLabel}</span>
          <span className="sm:hidden sr-only">{categoryLabel}</span>
        </span>
        {/* Save/Bookmark button for logged-in users */}
        {user && (
          <button
            className={`ml-1 sm:ml-2 p-1 sm:p-1.5 rounded-full bg-white/90 hover:bg-yellow-100 shadow border border-yellow-100 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 ${bookmarked ? 'text-yellow-700' : 'text-yellow-600 hover:text-yellow-700'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={bookmarked ? 'Remove Bookmark' : 'Save Event'}
            onClick={handleBookmark}
            disabled={loading}
            tabIndex={0}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-yellow-600"></div>
            ) : (
              <FiBookmark size={14} className="sm:w-4 sm:h-4" />
            )}
          </button>
        )}
      </div>

      {/* Hero Image Area */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden rounded-t-2xl">
        <Image
          src={getEventPrimaryImage(event)}
          alt={`Event image for ${event.name}`}
          fill={true}
          priority={true}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="transition-transform duration-500 group-hover:scale-110 object-cover"
        />
        {/* Price Badges - Bottom Left */}
        <div className="absolute bottom-3 left-3 flex flex-col items-start gap-2">
          {event.presale_price !== undefined && event.presale_price !== null ? (
            event.presale_price === 0 ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/80 backdrop-blur-md text-white shadow-lg">
                Presale: Free
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-white/95 backdrop-blur-md text-gray-900 shadow-lg border border-white/20">
                Presale: K{event.presale_price.toFixed(0)}
              </span>
            )
          ) : null}
          {event.gate_price !== undefined && event.gate_price !== null ? (
            event.gate_price === 0 ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/80 backdrop-blur-md text-white shadow-lg">
                Gate: Free
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-white/95 backdrop-blur-md text-gray-900 shadow-lg border border-white/20">
                Gate: K{event.gate_price.toFixed(0)}
              </span>
            )
          ) : null}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col h-full">
        <div className="event-card-container event-card-content">
          {/* Event Title */}
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight group-hover:text-yellow-600 transition-colors line-clamp-2">
            {event.name}
          </h3>

          {/* Location and Date */}
          <div className="event-card-section">
            <div className="flex items-start gap-2 sm:gap-3">
              <FiMapPin size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="font-medium text-gray-700 text-xs sm:text-sm leading-tight">{event.location}</span>
            </div>
            {event.venue && (
              <div className="flex items-start gap-2 sm:gap-3">
                <FiHome size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="font-medium text-gray-700 text-xs sm:text-sm leading-tight">{event.venue}</span>
              </div>
            )}
          </div>

          {event.date && (
            <>
              <div className="flex items-start gap-2 sm:gap-3">
                <FiCalendar size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="font-medium text-gray-700 text-xs sm:text-sm leading-tight">
                  {formatDate(new Date(event.date))}
                  {event.end_date ? ` - ${formatDate(new Date(event.end_date))}` : ''}
                </span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <FiClock size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="font-medium text-gray-700 text-xs sm:text-sm leading-tight">
                  {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  {event.end_date ? ` - ${new Date(event.end_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}` : ''}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons - positioned in bottom area */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 flex items-center gap-2">
          {/* Delete button for event owners */}
          {isOwner && (
            <button
              className={`p-2.5 rounded-full bg-red-50 hover:bg-red-100 shadow border border-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 ${deleting ? 'opacity-50 cursor-not-allowed' : 'text-red-600 hover:text-red-700'}`}
              aria-label="Delete Event"
              onClick={handleDelete}
              disabled={deleting}
              tabIndex={0}
            >
              <FiTrash2 size={18} />
            </button>
          )}

          {/* Social Share Feature */}
          <ShareButtons event={event} />
        </div>

        {/* Hover Overlay Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"></div>
      </div>
    </div>
  );
});
export default EventCard;

// ShareButtons Component
function ShareButtons({ event }: { event: EventItem }) {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [eventUrl, setEventUrl] = useState(''); // State for event URL
  const [isClient, setIsClient] = useState(false);

  // Use useEffect to construct the eventUrl safely on the client
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      setEventUrl(`${window.location.origin}/events/${event.id}`);
    }
  }, [event.id]); // Re-run if event.id changes

  const shareText = `Check out this event: ${event.name} at ${event.location} on ${new Date(event.date).toLocaleDateString()}.`;

  const handleShare = async () => {
    if (isClient && navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: shareText,
          url: eventUrl,
        });
  // ...existing code...
      } catch (error) {
  // ...existing code...
      }
    } else {
      setShowShareOptions(!showShareOptions); // Fallback to showing custom buttons
    }
  };

  const shareOnFacebook = () => {
    if (typeof window !== 'undefined' && eventUrl) { // Check for window and eventUrl
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`, '_blank');
    }
  };

  const shareOnTwitter = () => {
    if (typeof window !== 'undefined' && eventUrl) { // Check for window and eventUrl
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(eventUrl)}`, '_blank');
    }
  };

  const shareOnLinkedIn = () => {
    if (typeof window !== 'undefined' && eventUrl) { // Check for window and eventUrl
      window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(eventUrl)}&title=${encodeURIComponent(event.name)}&summary=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  const shareOnWhatsApp = () => {
    if (typeof window !== 'undefined' && eventUrl) { // Check for window and eventUrl
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${eventUrl}`)}`, '_blank');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent card click
          handleShare();
        }}
        className="p-2.5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 border border-gray-200/50"
        aria-label="Share Event"
      >
        <FiShare2 size={18} />
      </button>

      {showShareOptions && (
        <div className="absolute bottom-full right-0 mb-3 w-auto bg-white rounded-xl shadow-xl border border-gray-200 p-3 flex gap-2 z-20 animate-slide-up">
          <button onClick={(e) => { e.stopPropagation(); shareOnFacebook(); }} className="p-2.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" aria-label="Share on Facebook">
            <FaFacebook size={20} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); shareOnTwitter(); }} className="p-2.5 rounded-lg hover:bg-blue-50 text-blue-400 transition-colors" aria-label="Share on Twitter">
            <FaTwitter size={20} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); shareOnLinkedIn(); }} className="p-2.5 rounded-lg hover:bg-blue-50 text-blue-700 transition-colors" aria-label="Share on LinkedIn">
            <FaLinkedin size={20} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); shareOnWhatsApp(); }} className="p-2.5 rounded-lg hover:bg-green-50 text-green-500 transition-colors" aria-label="Share on WhatsApp">
            <FaWhatsapp size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
