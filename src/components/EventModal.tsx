'use client';
import React, { ElementType, useState, useRef, useEffect } from 'react';

import { FiStar, FiMapPin, FiCalendar, FiClock, FiUser, FiMail, FiPhone, FiBriefcase, FiX, FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile } from 'react-icons/fi'; // Re-added icon imports
import { User, Event } from '../lib/supabase';
import Image from 'next/image';

interface EventModalProps {
  selectedEvent: Event | null;
  host: User | null;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  categoryIconMap: { [key: string]: string }; // Changed to expect string keys
}

export default function EventModal({ selectedEvent, host, dialogOpen, setDialogOpen, categoryIconMap }: EventModalProps) {
  if (!dialogOpen || !selectedEvent) return null;

  const [activeTab, setActiveTab] = useState<'event-details' | 'host-details'>('event-details');
  const modalRef = useRef<HTMLDivElement>(null); // Ref for the modal container

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setDialogOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount and cleans up on unmount

  // Helper function to get the correct icon component based on the string name
  const getIconComponent = (name: string | undefined) => {
    switch (name) {
      case 'Music': return FiMusic;
      case 'Art': return FiImage;
      case 'Food': return FiCoffee;
      case 'Technology': return FiCpu;
      case 'Wellness': return FiHeart;
      case 'Comedy': return FiSmile;
      case 'Other': return FiStar;
      default: return FiStar; // Default to FiStar if name is undefined or not found
    }
  };

  return (
    <div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 relative animate-fade-in border border-gray-200">
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
                const iconName = category ? categoryIconMap[category] : undefined;
                const otherIconName = categoryIconMap['Other'];

                const IconComponent = getIconComponent(iconName || otherIconName);

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
              onClick={() => setActiveTab('host-details')}
              className={`px-4 py-2 font-semibold ${activeTab === 'host-details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              Host Details
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12"> {/* Adjusted gap for responsiveness */}
            {/* Left Column: Event Image */}
            {selectedEvent?.image_url && (
              <div className="md:sticky md:top-4">
                <Image
                  src={selectedEvent.image_url}
                  alt={selectedEvent.name ? `${selectedEvent.name} image` : 'Event Image'}
                  width={700}
                  height={400}
                  className="w-full h-auto object-cover rounded-lg"
                />
              </div>
            )}

            {/* Right Column: Event Details and Host Information */}
            <div className="flex flex-col">
              {activeTab === 'event-details' && (
                <>
                  {/* Location and Date/Time */}
                  <div className="grid grid-cols-1">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                      <FiMapPin size={20} className="text-gray-500 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-800">Location</h4>
                        <p className="text-gray-600">{selectedEvent?.location || 'Not specified'}</p>
                      </div>
                    </div>

                    {selectedEvent?.date && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                        <FiCalendar size={20} className="text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-gray-800">Date & Time</h4>
                          <p className="text-gray-600">{new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          <p className="text-gray-600">{new Date(selectedEvent.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedEvent?.description && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-0">About this event</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'host-details' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-0">Event Host</h3>
                  {host ? (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <div className="flex items-center gap-4">
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
                        <div>
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
      </div>
    </div>
  );
}
