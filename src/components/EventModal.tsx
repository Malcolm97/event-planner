'use client';
import React, { ElementType, useState, useRef, useEffect } from 'react';

import { FiStar, FiMapPin, FiCalendar, FiClock, FiUser, FiMail, FiPhone, FiBriefcase, FiX, FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile, FiShare2, FiLink, FiHome } from 'react-icons/fi';
import { FaFacebook, FaTwitter, FaLinkedin, FaWhatsapp } from 'react-icons/fa';
import { User } from '../lib/supabase';
import { EventItem } from '@/lib/types';
import Image from 'next/image';

interface EventModalProps {
  selectedEvent: EventItem | null;
  host: User | null;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

// Local map to reconstruct icon components
const localCategoryIconMap: { [key: string]: React.ElementType } = {
  'Music': FiMusic,
  'Art': FiImage,
  'Food': FiCoffee,
  'Technology': FiCpu,
  'Wellness': FiHeart,
  'Comedy': FiSmile,
  'Other': FiStar,
};

// Helper function to parse image URLs consistently
const getImageUrls = (imageUrls: string[] | string | null | undefined): string[] => {
  if (!imageUrls) return [];

  if (typeof imageUrls === 'string') {
    try {
      const parsed = JSON.parse(imageUrls);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Failed to parse image_urls as JSON:', error);
      return [];
    }
  }

  return Array.isArray(imageUrls) ? imageUrls : [];
};

export default function EventModal({ selectedEvent, host, dialogOpen, setDialogOpen }: EventModalProps) {
  if (!dialogOpen || !selectedEvent) return null;

  const [activeTab, setActiveTab] = useState<'event-details' | 'about-event' | 'host-details'>('event-details');
  const [imageExpanded, setImageExpanded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0); // New state for active image

  // Navigation helper functions
  const handlePrevImage = () => {
    const imageUrls = getImageUrls(selectedEvent?.image_urls);
    if (imageUrls.length > 0) {
      setActiveImageIndex((prevIndex) => (prevIndex - 1 + imageUrls.length) % imageUrls.length);
    }
  };

  const handleNextImage = () => {
    const imageUrls = getImageUrls(selectedEvent?.image_urls);
    if (imageUrls.length > 0) {
      setActiveImageIndex((prevIndex) => (prevIndex + 1) % imageUrls.length);
    }
  };

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setDialogOpen(false);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [setDialogOpen]);

  // Helper function to get the correct icon component based on the string name
  const getIconComponent = (name: string | undefined) => { // Removed iconMap parameter
    const Icon = localCategoryIconMap[name || 'Other']; // Use the local map
    return Icon || FiStar;
  };

  return (
    <div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 relative animate-fade-in border border-gray-200 overflow-y-auto max-h-screen">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-200"> {/* Adjusted padding for responsiveness */}
          <button
            onClick={() => setDialogOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <FiX size={20} />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
              {(() => {
              const category = selectedEvent?.category;
              const IconComponent = getIconComponent(category || 'Other');

                return React.createElement(IconComponent as ElementType, { size: 32, className: "text-yellow-600" });
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-bold text-gray-900 leading-tight truncate">{selectedEvent?.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-block px-3 py-1 rounded-full bg-yellow-200 text-yellow-800 font-semibold text-sm">
                  {selectedEvent?.category || 'Other'}
                </span>
                {selectedEvent?.presale_price !== undefined && selectedEvent.presale_price !== null && selectedEvent.presale_price > 0 ? (
                  <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                    Presale: K{selectedEvent.presale_price.toFixed(0)}
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                    Presale: None
                  </span>
                )}
                {selectedEvent?.gate_price !== undefined && selectedEvent.gate_price !== null && selectedEvent.gate_price > 0 ? (
                  <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                    Gate: K{selectedEvent.gate_price.toFixed(0)}
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                    Gate: None
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tab Navigation */}
          <div className="flex mb-4 md:mb-6 border-b border-gray-200"> {/* Adjusted margin for responsiveness */}
            <button
              onClick={() => setActiveTab('event-details')}
              className={`px-4 py-2 font-semibold ${activeTab === 'event-details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              Event Details
            </button>
            <button
              onClick={() => setActiveTab('about-event')}
              className={`px-4 py-2 font-semibold ${activeTab === 'about-event' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              About this event
            </button>
            <button
              onClick={() => setActiveTab('host-details')}
              className={`px-4 py-2 font-semibold ${activeTab === 'host-details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              Host Details
            </button>
          </div>

          <div className="space-y-6">
            {/* Event Details Section */}
            {activeTab === 'event-details' && (
              <div className="space-y-4">
                {/* Event Image and Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* Left Column: Event Images */}
                  <div className="order-2 md:order-1">
                    {(() => {
                      const placeholderImageUrl = 'https://via.placeholder.com/400x300?text=No+Image+Available';
                      const currentImageUrls = getImageUrls(selectedEvent?.image_urls);
                      const currentHasImages = currentImageUrls.length > 0;
                      const primaryImageUrl = currentHasImages ? currentImageUrls[0] : (selectedEvent?.image_url || placeholderImageUrl);

                      return (
                        <div className="space-y-4">
                          {/* Primary Image */}
                          <div
                            className="relative cursor-pointer group"
                            onClick={() => {
                              if (currentHasImages || selectedEvent?.image_url) {
                                setActiveImageIndex(0);
                                setImageExpanded(true);
                              }
                            }}
                          >
                            <Image
                              src={primaryImageUrl}
                              alt={selectedEvent?.name ? `${selectedEvent.name} primary image` : 'Event Primary Image'}
                              width={400}
                              height={300}
                              className="w-full h-64 md:h-80 object-cover rounded-lg transition-transform group-hover:scale-105"
                            />
                            {(currentHasImages || selectedEvent?.image_url) && (
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-2">
                                  <FiImage size={24} className="text-gray-700" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Additional Images */}
                          {currentHasImages && currentImageUrls.length > 1 && (
                            <div className="grid grid-cols-2 gap-2">
                              {currentImageUrls.slice(1).map((imageUrl: string, index: number) => (
                                <div
                                  key={index}
                                  className="relative cursor-pointer group"
                                  onClick={() => { setActiveImageIndex(index + 1); setImageExpanded(true); }}
                                >
                                  <Image
                                    src={imageUrl}
                                    alt={selectedEvent?.name ? `${selectedEvent.name} image ${index + 2}` : `Event image ${index + 2}`}
                                    width={200}
                                    height={150}
                                    className="w-full h-32 object-cover rounded-lg transition-transform group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-1">
                                      <FiImage size={16} className="text-gray-700" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Right Column: Location and Date/Time */}
                  <div className="order-1 md:order-2 space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                      <FiMapPin size={20} className="text-gray-500 mt-1 flex-shrink-0" />
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">Location</h4>
                          <p className="text-gray-600">{selectedEvent?.location || 'Not specified'}</p>
                        </div>
                        {selectedEvent?.venue && (
                          <div>
                            <h4 className="font-semibold text-gray-800">Venue</h4>
                            <p className="text-gray-600">{selectedEvent.venue}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedEvent?.date && (
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                        <FiCalendar size={20} className="text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-gray-800">Date & Time</h4>
                          <p className="text-gray-600">{new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          <p className="text-gray-600">{new Date(selectedEvent.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Share Feature */}
                <div className="pt-4 border-t border-gray-200 flex justify-end">
                  <ShareButtons event={selectedEvent} />
                </div>
              </div>
            )}

            {/* About Event Section */}
            {activeTab === 'about-event' && (
              <div className="space-y-4">
                {selectedEvent?.description ? (
                  <div className="flex items-start gap-3 p-6 rounded-lg bg-gray-50">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-base">{selectedEvent.description}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 text-gray-600 px-6 py-4 rounded-lg text-center">
                    <p>No description available for this event.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'host-details' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Event Host</h3>
                {host ? (
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {host?.photo_url ? (
                          <Image src={host.photo_url} alt={host.name || 'Host'} width={64} height={64} className="w-full h-full object-cover" />
                        ) : (
                          <FiUser size={32} className="text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        {host?.name && (
                          <div className="flex items-center gap-2">
                            <FiUser size={16} className="text-gray-500" />
                            <span className="font-bold text-lg text-gray-900">{host.name}</span>
                          </div>
                        )}
                        {host?.company && (
                          <div className="flex items-center gap-2">
                            <FiBriefcase size={16} className="text-gray-500" />
                            <span className="text-gray-700">{host.company}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {host?.about && (
                      <div className="mb-4">
                        <p className="text-gray-600 text-sm">{host.about}</p>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50 p-3 rounded-lg">
                      {host?.email ? (
                        <a href={`mailto:${host.email}`} className="flex items-center gap-2 text-blue-600 hover:underline rounded-md p-2 hover:bg-blue-100 hover:text-blue-800">
                          <FiMail size={16} />
                          <span>Email</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600 font-semibold">
                          <FiMail size={16} />
                          <span>Email not available</span>
                        </div>
                      )}
                      {host?.phone ? (
                        <a href={`tel:${host.phone}`} className="flex items-center gap-2 text-blue-600 hover:underline rounded-md p-2 hover:bg-blue-100 hover:text-blue-800">
                          <FiPhone size={16} />
                          <span>Call</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600 font-semibold">
                          <FiPhone size={16} />
                          <span>Phone not available</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-center">
                    {selectedEvent?.created_by ? (
                      <p>Host details could not be fetched for user ID "{selectedEvent.created_by}".</p>
                    ) : (
                      <p>Host details are not available for this event.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Image Modal */}
      {imageExpanded && (() => {
        const imageUrls = getImageUrls(selectedEvent?.image_urls);
        const hasImages = imageUrls.length > 0 || selectedEvent?.image_url;

  if (!hasImages) return null;

  // Determine the current image URL and alt text
  let currentImageUrl = '';
  let currentImageAlt = 'Event Image';

  if (imageUrls.length > 0) {
    // Ensure activeImageIndex is within bounds of imageUrls array
    const safeIndex = activeImageIndex % imageUrls.length;
    currentImageUrl = imageUrls[safeIndex];
    currentImageAlt = selectedEvent?.name ? `${selectedEvent.name} image ${safeIndex + 1}` : 'Event Image';
  } else if (selectedEvent?.image_url) {
    currentImageUrl = selectedEvent.image_url;
    currentImageAlt = selectedEvent?.name ? `${selectedEvent.name} image` : 'Event Image';
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4"
      onClick={() => setImageExpanded(false)}
    >
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageExpanded(false);
                }}
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20 z-10"
              >
                <FiX size={24} />
              </button>

              {/* Navigation Buttons */}
              <button
                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity z-10"
                aria-label="Previous Image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity z-10"
                aria-label="Next Image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Show first image or single image */}
              <Image
  src={currentImageUrl}
  alt={currentImageAlt}
                width={800}
                height={600}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Show additional images if available */}
              {imageUrls.length > 0 && (
                <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto">
{imageUrls.map((imageUrl: string, index: number) => (
  <div
    key={index}
    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer transition-colors ${
      activeImageIndex === index ? 'border-2 border-white scale-105' : 'border-2 border-white/20 hover:border-white/50'
    }`}
    onClick={(e) => { e.stopPropagation(); setActiveImageIndex(index); }} // Update active index
  >
    <Image
      src={imageUrl}
      alt={`${selectedEvent?.name} image ${index + 1}`}
      width={80}
      height={80}
      className="w-full h-full object-cover"
    />
  </div>
))}
                </div>
              )}

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-lg font-semibold bg-black bg-opacity-50 rounded px-3 py-2 inline-block">
                  {selectedEvent?.name}
                </h3>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ShareButtons Component (copied from EventCard.tsx and adapted for modal context)
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
          e.stopPropagation(); // Prevent modal close if clicked directly
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
