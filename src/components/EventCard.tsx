import { FiStar, FiMapPin, FiCalendar, FiDollarSign, FiClock, FiShare2, FiLink, FiHome } from 'react-icons/fi';
import { FaFacebook, FaTwitter, FaLinkedin, FaWhatsapp } from 'react-icons/fa';
import { EventItem } from '@/lib/types';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { getEventPrimaryImage } from '@/lib/utils';

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
  'Music': FiStar,
  'Art': FiStar,
  'Food': FiStar,
  'Technology': FiStar,
  'Wellness': FiStar,
  'Comedy': FiStar,
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

export default function EventCard({ event, onClick }: { event: EventItem; onClick?: () => void }) {
  const categoryLabel = event.category?.trim() || 'Other';

  // Color and icon mapping
  const categoryColor = categoryColorMap[categoryLabel] || 'bg-gray-100 text-gray-700';
  const Icon = categoryIconMap[categoryLabel] || FiStar;

  return (
    <div
      className="group relative card cursor-pointer overflow-hidden card-hover h-full"
      onClick={() => {
        if (typeof onClick === 'function') {
          onClick();
        }
      }}
    >
      {/* Category Badge - Top Right */}
      <div className="absolute top-3 right-3 z-10">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${categoryColor} shadow-md backdrop-blur-sm`}>
          <Icon size={12} />
          {categoryLabel}
        </span>
      </div>

      {/* Hero Image Area */}
      <div className="relative h-52 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
        <Image
          src={getEventPrimaryImage(event)}
          alt={event.name || 'Event Image'}
          fill={true}
          priority={true}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="transition-transform duration-500 group-hover:scale-110 object-cover"
        />

        {/* Price Badges - Bottom Left */}
        <div className="absolute bottom-3 left-3 flex flex-col items-start gap-2">
          {event.presale_price !== undefined && event.presale_price !== null && event.presale_price > 0 ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-white/95 backdrop-blur-md text-gray-900 shadow-lg border border-white/20">
              Presale: K{event.presale_price.toFixed(0)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-500/80 backdrop-blur-md text-white shadow-lg">
              Presale: None
            </span>
          )}
          {event.gate_price !== undefined && event.gate_price !== null && event.gate_price > 0 ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-white/95 backdrop-blur-md text-gray-900 shadow-lg border border-white/20">
              Gate: K{event.gate_price.toFixed(0)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-500/80 backdrop-blur-md text-white shadow-lg">
              Gate: None
            </span>
          )}
        </div>

        {/* Featured Badge */}
        {event.featured && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-lg backdrop-blur-sm">
              <FiStar size={10} />
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col h-full">
        <div className="p-6 flex flex-col gap-4">
          {/* Event Title */}
          <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-yellow-600 transition-colors line-clamp-2">
            {event.name}
          </h3>

          {/* Location and Date */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <FiMapPin size={14} className="text-gray-400 flex-shrink-0" />
              <span className="font-medium text-gray-700 text-sm">{event.location}</span>
            </div>
            {event.venue && (
              <div className="flex items-center gap-3">
                <FiHome size={14} className="text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-700 text-sm">{event.venue}</span>
              </div>
            )}
          </div>

          {event.date && (
            <>
              <div className="flex items-center gap-3">
                <FiCalendar size={14} className="text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-700 text-sm">
                  {formatDate(new Date(event.date))}
                  {event.end_date ? ` - ${formatDate(new Date(event.end_date))}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <FiClock size={14} className="text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-700 text-sm">
                  {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  {event.end_date ? ` - ${new Date(event.end_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}` : ''}
                </span>
              </div>
            </>
          )}

          {/* Sharable Website Link */}
          <div className="flex items-center gap-3 text-sm text-gray-600 pt-2 border-t border-gray-100">
            <FiLink size={14} className="text-gray-400 flex-shrink-0" />
            <button
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline truncate text-left transition-colors"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click when clicking button
                if (typeof onClick === 'function') {
                  onClick(); // Trigger the same modal opening logic as the card
                }
              }}
            >
              View Event Details
            </button>
          </div>
        </div>

        {/* Social Share Feature - positioned in bottom right */}
        <div className="absolute bottom-4 right-4 z-10">
          <ShareButtons event={event} />
        </div>

        {/* Hover Overlay Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"></div>
      </div>
    </div>
  );
}

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
        console.log('Event shared successfully');
      } catch (error) {
        console.error('Error sharing event:', error);
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
