import React, { useState, useEffect } from 'react';
import { FiShare2 } from 'react-icons/fi';
import { FaFacebook, FaLinkedin, FaWhatsapp } from 'react-icons/fa';
import { SiX } from 'react-icons/si';
import { EventItem } from '@/lib/types';
import { shareUrls, getEventShareText } from '@/lib/thirdPartyUtils';

interface ShareButtonsProps {
  event: EventItem;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ event }) => {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [eventUrl, setEventUrl] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      setEventUrl(`${window.location.origin}/events/${event.id}`);
    }
  }, [event.id]);

  const shareText = getEventShareText(event);

  const handleShare = async () => {
    if (isClient && navigator.share) {
      try {
        await navigator.share({
          title: event.name || 'Event',
          text: shareText,
          url: eventUrl,
        });
      } catch (error) {
        // User cancelled or error - fallback to showing custom buttons
        setShowShareOptions(!showShareOptions);
      }
    } else {
      setShowShareOptions(!showShareOptions);
    }
  };

  const shareOnFacebook = () => {
    if (typeof window !== 'undefined' && eventUrl) {
      window.open(shareUrls.facebook(eventUrl), '_blank', 'noopener,noreferrer');
    }
  };

  const shareOnX = () => {
    if (typeof window !== 'undefined' && eventUrl) {
      window.open(shareUrls.twitter(shareText, eventUrl), '_blank', 'noopener,noreferrer');
    }
  };

  const shareOnLinkedIn = () => {
    if (typeof window !== 'undefined' && eventUrl) {
      window.open(shareUrls.linkedin(eventUrl, event.name || 'Event', shareText), '_blank', 'noopener,noreferrer');
    }
  };

  const shareOnWhatsApp = () => {
    if (typeof window !== 'undefined' && eventUrl) {
      window.open(shareUrls.whatsapp(shareText, eventUrl), '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleShare();
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transition-all duration-200 text-gray-700 hover:text-gray-900 font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
        aria-label="Share Event"
      >
        <FiShare2 size={16} />
        <span className="hidden sm:inline text-sm">Share Event</span>
      </button>

      {showShareOptions && (
        <div className="absolute bottom-full right-0 mb-2 w-auto bg-white rounded-xl shadow-xl border border-gray-200/80 p-3 flex gap-2 z-20 backdrop-blur-sm">
          <button
            onClick={(e) => { e.stopPropagation(); shareOnFacebook(); }}
            className="p-2.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-all duration-200 hover:scale-105 shadow-sm"
            aria-label="Share on Facebook"
          >
            <FaFacebook size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); shareOnX(); }}
            className="p-2.5 rounded-lg hover:bg-gray-100 text-gray-900 transition-all duration-200 hover:scale-105 shadow-sm"
            aria-label="Share on X"
          >
            <SiX size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); shareOnLinkedIn(); }}
            className="p-2.5 rounded-lg hover:bg-blue-50 text-blue-700 transition-all duration-200 hover:scale-105 shadow-sm"
            aria-label="Share on LinkedIn"
          >
            <FaLinkedin size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); shareOnWhatsApp(); }}
            className="p-2.5 rounded-lg hover:bg-green-50 text-green-500 transition-all duration-200 hover:scale-105 shadow-sm"
            aria-label="Share on WhatsApp"
          >
            <FaWhatsapp size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareButtons;
