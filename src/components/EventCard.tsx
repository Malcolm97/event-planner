import { FiStar, FiMapPin, FiCalendar, FiDollarSign, FiClock, FiShare2, FiLink, FiHome } from 'react-icons/fi';
import { FaFacebook, FaTwitter, FaLinkedin, FaWhatsapp } from 'react-icons/fa';
import { EventItem } from '@/lib/types'; // Import EventItem from shared types
import Image from 'next/image'; // Import the Image component
import { useState, useEffect } from 'react'; // Import useEffect

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

export default function EventCard({ event, onClick }: { event: EventItem; onClick?: () => void }) {
  const categoryLabel = event.category?.trim() || 'Other';

  // Color and icon mapping
  const categoryColor = categoryColorMap[categoryLabel] || 'bg-gray-100 text-gray-700';
  const Icon = categoryIconMap[categoryLabel] || FiStar;

  return (
    <div
      className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden hover:scale-[1.02] h-full"
      onClick={() => {
        console.log('Event card clicked!');
        // Ensure onClick is a function before calling it
        if (typeof onClick === 'function') {
          onClick();
        }
      }}
    >
      {/* Category Badge - Top Right */}
      <div className="absolute top-3 right-3 z-10">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${categoryColor} shadow-sm`}>
          <Icon size={12} />
          {categoryLabel}
        </span>
      </div>

      {/* Hero Image Area */}
      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
        <Image
          src={event.image_url || 'https://via.placeholder.com/400x200?text=No+Image+Available'}
          alt={event.name || 'Event Image'}
          fill={true}
          priority={true}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="transition-transform duration-300 group-hover:scale-105 object-cover"
        />

        {/* Price Badges - Bottom Left */}
        <div className="absolute bottom-3 left-3 flex flex-col items-start gap-1">
          {event.presale_price !== undefined && event.presale_price !== null && event.presale_price > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm text-gray-900 shadow-sm">
              Presale: K{event.presale_price.toFixed(0)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm text-gray-900 shadow-sm">
              Presale: None
            </span>
          )}
          {event.gate_price !== undefined && event.gate_price !== null && event.gate_price > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm text-gray-900 shadow-sm">
              Gate: K{event.gate_price.toFixed(0)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm text-gray-900 shadow-sm">
              Gate: None
            </span>
          )}
        </div>

        {/* Featured Badge */}
        {event.featured && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-400 text-black shadow-sm">
              <FiStar size={10} />
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col h-full">
        <div className="p-5 flex flex-col gap-3">
          {/* Event Title */}
          <h3 className="text-xl font-semibold text-gray-900 leading-tight group-hover:text-yellow-600 transition-colors line-clamp-2">
            {event.name}
          </h3>

          {/* Location and Date */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FiMapPin size={14} className="text-gray-400 flex-shrink-0" />
              <span className="font-medium text-gray-700">{event.location}</span>
            </div>
            {event.venue && (
              <div className="flex items-center gap-2">
                <FiHome size={14} className="text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-700">{event.venue}</span>
              </div>
            )}
          </div>

          {event.date && (
            <>
              <div className="flex items-center gap-2">
                <FiCalendar size={14} className="text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-700">{new Date(event.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiClock size={14} className="text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-700">{new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
              </div>
            </>
          )}

          {/* About this Event Section */}
          {event.description && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
              <div className="flex-shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">About this event</h4>
                <p className="text-gray-600 leading-relaxed text-sm line-clamp-3">{event.description}</p>
              </div>
            </div>
          )}

          {/* Sharable Website Link */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiLink size={14} className="text-gray-400 flex-shrink-0" />
            <button
              className="font-medium text-blue-600 hover:underline truncate text-left"
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

        {/* Social Share Feature */}
        <div className="w-full mt-auto px-5 py-4 flex justify-end border-t border-gray-100">
          <ShareButtons event={event} />
        </div>

        {/* Hover Overlay Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
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
        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
        aria-label="Share Event"
      >
        <FiShare2 size={18} />
      </button>

      {showShareOptions && (
        <div className="absolute bottom-full right-0 mb-2 w-auto bg-white rounded-lg shadow-lg p-2 flex gap-2 z-20">
          <button onClick={(e) => { e.stopPropagation(); shareOnFacebook(); }} className="p-2 rounded-full hover:bg-blue-100 text-blue-600" aria-label="Share on Facebook">
            <FaFacebook size={20} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); shareOnTwitter(); }} className="p-2 rounded-full hover:bg-blue-100 text-blue-400" aria-label="Share on Twitter">
            <FaTwitter size={20} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); shareOnLinkedIn(); }} className="p-2 rounded-full hover:bg-blue-100 text-blue-700" aria-label="Share on LinkedIn">
            <FaLinkedin size={20} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); shareOnWhatsApp(); }} className="p-2 rounded-full hover:bg-green-100 text-green-500" aria-label="Share on WhatsApp">
            <FaWhatsapp size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
