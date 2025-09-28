
'use client';
import Link from 'next/link';
import Button from './Button';
import '../components/EventModal.animations.css';
import React, { ElementType, useState, useRef, useEffect } from 'react';

import { FiStar, FiMapPin, FiCalendar, FiClock, FiUser, FiMail, FiPhone, FiBriefcase, FiX, FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile, FiShare2, FiLink, FiHome, FiEdit } from 'react-icons/fi';
import { FaFacebook, FaTwitter, FaLinkedin, FaWhatsapp } from 'react-icons/fa';
import { User } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { EventItem } from '@/lib/types';
import Image from 'next/image';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { getEventPrimaryImage } from '@/lib/utils';

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

// Helper function to get all image URLs, handling stringified JSON or single string
const getAllImageUrls = (imageUrls: string[] | string | null | undefined): string[] => {
  if (!imageUrls) return [];

  if (typeof imageUrls === 'string') {
    try {
      const parsed = JSON.parse(imageUrls);
      return Array.isArray(parsed) ? parsed : [imageUrls]; // If it's a string, treat it as a single URL
    } catch (error) {
      // If JSON parsing fails, treat the string as a single URL
      return [imageUrls];
    }
  }

  return Array.isArray(imageUrls) ? imageUrls : [];
};

export default function EventModal({ selectedEvent, host, dialogOpen, setDialogOpen }: EventModalProps) {
  // Accessibility: focus trap and keyboard navigation
  const modalRef = useRef<HTMLDivElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState<'event-details' | 'about-event' | 'host-details'>('event-details');
  const [imageExpanded, setImageExpanded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const { user: authUser } = useAuth();

  useEffect(() => {
    setIsOffline(typeof navigator !== 'undefined' && !navigator.onLine);
  }, [dialogOpen]);

  useEffect(() => {
    if (!dialogOpen) return;
    lastActiveElement.current = document.activeElement as HTMLElement;
    if (modalRef.current) modalRef.current.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDialogOpen(false);
      if (e.key === 'Tab') {
        // Trap focus inside modal
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      lastActiveElement.current?.focus();
    };
  }, [dialogOpen, setDialogOpen]);

  // Error handling for missing event/host
  useEffect(() => {
    setError(null);
    setLoading(false);
    if (!selectedEvent) {
      setError('No event selected.');
    }
    // Simulate loading state for async fetches (if needed)
    // setLoading(true); setTimeout(() => setLoading(false), 300);
  }, [selectedEvent]);

  // Navigation helper functions
  const handlePrevImage = () => {
    const imageUrls = getAllImageUrls(selectedEvent?.image_urls);
    if (imageUrls.length > 0) {
      setActiveImageIndex((prevIndex) => (prevIndex - 1 + imageUrls.length) % imageUrls.length);
    }
  };
  const handleNextImage = () => {
    const imageUrls = getAllImageUrls(selectedEvent?.image_urls);
    if (imageUrls.length > 0) {
      setActiveImageIndex((prevIndex) => (prevIndex + 1) % imageUrls.length);
    }
  };

  // Helper function to get the correct icon component based on the string name
  const getIconComponent = (name: string | undefined) => {
    const Icon = localCategoryIconMap[name || 'Other'];
    return Icon || FiStar;
  };

  if (!dialogOpen) return null;
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto mb-6"></div>
          <p className="text-lg text-gray-700">Loading event details...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }
  if (!selectedEvent) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-md p-1 sm:p-2 md:p-4 animate-fade-in"
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      aria-labelledby="event-modal-title"
      aria-describedby="event-modal-desc"
    >
      <div
        className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[99vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto relative animate-modal-in border border-gray-200 overflow-hidden focus:outline-none flex flex-col"
        style={{
          minHeight: '50vh',
          maxHeight: '95vh',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        {isOffline && (
          <div className="w-full bg-yellow-100 text-yellow-800 text-center py-2 text-sm sm:text-base font-semibold" role="alert">
            You are offline. Event details may be cached.
          </div>
        )}
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 border-b border-gray-200 relative">
          <button
            onClick={() => setDialogOpen(false)}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 p-1.5 sm:p-2 md:p-3 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 z-20"
            aria-label="Close Modal"
            tabIndex={0}
            style={{ lineHeight: 0 }}
          >
            <FiX size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            <span className="sr-only">Close (ESC)</span>
          </button>

          {/* Manage button for event creators */}
          {authUser && selectedEvent?.created_by === authUser.id && (
            <Link
              href={`/dashboard/edit-event/${selectedEvent.id}`}
              className="absolute top-2 right-12 sm:top-3 sm:right-12 md:top-4 md:right-16 p-1.5 sm:p-2 md:p-3 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white shadow focus:outline-none focus:ring-2 focus:ring-yellow-500 z-20 transition-colors"
              aria-label="Manage Event"
              tabIndex={0}
            >
              <FiEdit size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
              <span className="sr-only">Manage Event</span>
            </Link>
          )}

          <div className="flex items-center gap-3 sm:gap-4 md:gap-6 mt-8 sm:mt-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center flex-shrink-0 shadow-lg">
              {(() => {
              const category = selectedEvent?.category;
              const IconComponent = getIconComponent(category || 'Other');

                return React.createElement(IconComponent as ElementType, { size: 24, className: "text-yellow-600 sm:w-8 sm:h-8 md:w-10 md:h-10" });
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-bold text-gray-900 leading-tight line-clamp-2 break-words text-wrap">{selectedEvent?.name}</h2>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mt-1.5 sm:mt-2 md:mt-4">
                <span className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-2 rounded-full bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800 font-bold text-xs sm:text-sm shadow-sm">
                  {selectedEvent?.category || 'Other'}
                </span>
                {selectedEvent?.presale_price !== undefined && selectedEvent.presale_price !== null && selectedEvent.presale_price > 0 ? (
                  <span className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-2 rounded-full bg-green-100 text-green-700 font-bold text-xs sm:text-sm shadow-sm">
                    Presale: K{selectedEvent.presale_price.toFixed(0)}
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-2 rounded-full bg-gray-100 text-gray-600 font-bold text-xs sm:text-sm shadow-sm">
                    Presale: None
                  </span>
                )}
                {selectedEvent?.gate_price !== undefined && selectedEvent.gate_price !== null && selectedEvent.gate_price > 0 ? (
                  <span className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-2 rounded-full bg-blue-100 text-blue-700 font-bold text-xs sm:text-sm shadow-sm">
                    Gate: K{selectedEvent.gate_price.toFixed(0)}
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-2 rounded-full bg-gray-100 text-gray-600 font-bold text-xs sm:text-sm shadow-sm">
                    Gate: None
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

    {/* Content */}
    <div className="p-4 sm:p-6 md:p-8">
          {/* Tab Navigation */}
          <div className="flex mb-4 sm:mb-6 md:mb-8 border-b border-gray-200 bg-gray-50 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('event-details')}
              className={`flex-1 px-2 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 font-bold rounded-lg transition-all duration-200 text-xs sm:text-sm md:text-base ${activeTab === 'event-details' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            >
              <span className="hidden sm:inline">Event Details</span>
              <span className="sm:hidden">Details</span>
            </button>
            <button
              onClick={() => setActiveTab('about-event')}
              className={`flex-1 px-2 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 font-bold rounded-lg transition-all duration-200 text-xs sm:text-sm md:text-base ${activeTab === 'about-event' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            >
              <span className="hidden sm:inline">About Event</span>
              <span className="sm:hidden">About</span>
            </button>
            <button
              onClick={() => setActiveTab('host-details')}
              className={`flex-1 px-2 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 font-bold rounded-lg transition-all duration-200 text-xs sm:text-sm md:text-base ${activeTab === 'host-details' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            >
              <span className="hidden sm:inline">Host Details</span>
              <span className="sm:hidden">Host</span>
            </button>
          </div>

          <div className="space-y-8">
            {/* Event Details Section */}
            {activeTab === 'event-details' && (
              <div className="space-y-8">

                {/* Event Image and Details Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
                  {/* On mobile, stack columns vertically. On tablet/desktop, use side-by-side layout. */}
                  {/* Responsive image sizing and spacing */}
                  {/* Left Column: Event Images */}
                  <div className="order-2 md:order-1">
                    {(() => {
                      const primaryImageUrl = selectedEvent ? getEventPrimaryImage(selectedEvent) : '/next.svg';
                      const allImageUrls = getAllImageUrls(selectedEvent?.image_urls);
                      const currentHasImages = allImageUrls.length > 0;

                      return (
                        <div className="space-y-6">
                          {/* Primary Image */}
                          <div
                            className="relative group rounded-2xl overflow-hidden shadow-lg w-full h-56 sm:h-72 md:h-96"
                          >
                            {/* Navigation arrows for multiple images */}
                            {currentHasImages && allImageUrls.length > 1 && (
                              <>
                                <button
                                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow transition z-10"
                                  onClick={e => { e.stopPropagation(); setActiveImageIndex((prev) => (prev - 1 + allImageUrls.length) % allImageUrls.length); }}
                                  aria-label="Previous image"
                                >
                                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
                                </button>
                                <button
                                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow transition z-10"
                                  onClick={e => { e.stopPropagation(); setActiveImageIndex((prev) => (prev + 1) % allImageUrls.length); }}
                                  aria-label="Next image"
                                >
                                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
                                </button>
                              </>
                            )}
                            {/* Loading spinner */}
                            <div id="event-image-spinner" className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
                              <span className="animate-spin h-8 w-8 border-4 border-yellow-400 border-t-transparent rounded-full opacity-70"></span>
                            </div>
                            <Zoom>
                              <Image
                                src={currentHasImages ? allImageUrls[activeImageIndex] : primaryImageUrl}
                                alt={selectedEvent?.name ? `${selectedEvent.name} image ${activeImageIndex + 1}` : 'Event Image'}
                                width={400}
                                height={300}
                                className="w-full h-72 md:h-96 object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="eager"
                                onLoad={() => {
                                  const spinner = document.getElementById('event-image-spinner');
                                  if (spinner) spinner.style.display = 'none';
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/window.svg';
                                }}
                              />
                            </Zoom>
                            {/* Image count indicator */}
                            {currentHasImages && allImageUrls.length > 1 && (
                              <span className="absolute bottom-2 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10">
                                {activeImageIndex + 1} / {allImageUrls.length}
                              </span>
                            )}
                            {currentHasImages && (
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-95 rounded-full p-3 shadow-lg">
                                  <FiImage size={24} className="text-gray-700" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Additional Images */}
                          {currentHasImages && allImageUrls.length > 1 && (
                            <div className="grid grid-cols-2 gap-2 sm:gap-4">
                              {allImageUrls.slice(1).map((imageUrl: string, index: number) => (
                                <div
                                  key={index}
                                  className="relative cursor-pointer group rounded-xl overflow-hidden shadow-md"
                                  onClick={() => { setActiveImageIndex(index + 1); setImageExpanded(true); }}
                                >
                                  <Image
                                    src={imageUrl}
                                    alt={selectedEvent?.name ? `${selectedEvent.name} image ${index + 2}` : `Event image ${index + 2}`}
                                    width={200}
                                    height={150}
                                    className="w-full h-24 sm:h-36 object-cover transition-transform duration-300 group-hover:scale-110"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-95 rounded-full p-2 shadow-lg">
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
                  <div className="order-1 md:order-2 space-y-6 w-full">
                    <div className="flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                      <FiMapPin size={20} className="text-gray-500 mt-1 flex-shrink-0" />
                      <div className="space-y-2 sm:space-y-4 w-full">
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">Location</h4>
                          <p className="text-gray-700 text-base">{selectedEvent?.location || 'Not specified'}</p>
                        </div>
                        {selectedEvent?.venue && (
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">Venue</h4>
                            <p className="text-gray-700 text-base">{selectedEvent.venue}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedEvent?.date && (
                      <div className="flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                        <FiCalendar size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                        <div className="w-full">
                          <h4 className="font-bold text-gray-900 text-lg">Date & Time</h4>
                          <p className="text-gray-700 text-base font-medium break-words">
                            {new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            {selectedEvent.end_date ?
                              ` - ${new Date(selectedEvent.end_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
                              : ''}
                          </p>
                          <p className="text-gray-700 text-base break-words">
                            {new Date(selectedEvent.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            {selectedEvent.end_date ?
                              ` - ${new Date(selectedEvent.end_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                              : ''}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Share Feature */}
                <div className="pt-6 border-t border-gray-200 flex justify-end">
                  <ShareButtons event={selectedEvent} />
                </div>
              </div>
            )}

            {/* About Event Section */}
            {activeTab === 'about-event' && (
              <div className="space-y-6">
                {selectedEvent?.description ? (
                  <div className="flex items-start gap-4 p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">{selectedEvent.description}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 text-gray-600 px-8 py-6 rounded-2xl text-center">
                    <p className="text-lg">No description available for this event.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'host-details' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Event Host</h3>
                {host ? (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shadow-lg">
                        {host?.photo_url ? (
                          <Image src={host.photo_url} alt={host.name || 'Host'} width={64} height={64} className="w-full h-full object-cover" />
                        ) : (
                          <FiUser size={28} className="text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        {host?.name && (
                          <div className="flex items-center gap-3">
                            <FiUser size={18} className="text-gray-500" />
                            <span className="font-bold text-xl text-gray-900">{host.name}</span>
                          </div>
                        )}
                        {host?.company && (
                          <div className="flex items-center gap-3">
                            <FiBriefcase size={18} className="text-gray-500" />
                            <span className="text-gray-700 text-lg">{host.company}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {host?.about && (
                      <div className="mb-6">
                        <p className="text-gray-700 text-base leading-relaxed">{host.about}</p>
                      </div>
                    )}
                    <div className="flex flex-col gap-3 sm:flex-row items-center sm:gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
                      {authUser ? (
                        <>
                          {host?.email ? (
                            <div className="flex items-center gap-3 text-blue-600 rounded-lg px-4 py-3 bg-blue-50 font-medium">
                              <FiMail size={18} />
                              <span>{host.email}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-red-600 font-semibold">
                              <FiMail size={18} />
                              <span>Email not available</span>
                            </div>
                          )}
                          {host?.phone ? (
                            <div className="flex items-center gap-3 text-green-600 rounded-lg px-4 py-3 bg-green-50 font-medium">
                              <FiPhone size={18} />
                              <span>{host.phone}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-red-600 font-semibold">
                              <FiPhone size={18} />
                              <span>Phone not available</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full text-center py-4 px-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 font-medium">
                          <p>To view the host's email and phone number, please <span className="font-bold">log in</span> to your account.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl text-center">
                    {selectedEvent?.created_by ? (
                      <p className="font-medium">Host details could not be fetched for user ID "{selectedEvent.created_by}".</p>
                    ) : (
                      <p className="font-medium">Host details are not available for this event.</p>
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
        const allImageUrls = getAllImageUrls(selectedEvent?.image_urls);
        const hasImages = allImageUrls.length > 0;

  if (!hasImages) return null;

  // Determine the current image URL and alt text
  let currentImageUrl = '';
  let currentImageAlt = 'Event Image';

  if (allImageUrls.length > 0) {
    // Ensure activeImageIndex is within bounds of allImageUrls array
    const safeIndex = activeImageIndex % allImageUrls.length;
    currentImageUrl = allImageUrls[safeIndex];
    currentImageAlt = selectedEvent?.name ? `${selectedEvent.name} image ${safeIndex + 1}` : 'Event Image';
  } else {
    currentImageUrl = getEventPrimaryImage(selectedEvent || { name: 'Event' }); // Fallback using getEventPrimaryImage
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
                loading="lazy"
              />

              {/* Show additional images if available */}
              {allImageUrls.length > 0 && (
                <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto">
{allImageUrls.map((imageUrl: string, index: number) => (
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
      loading="lazy"
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
