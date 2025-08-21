'use client';

import { FiStar, FiMapPin, FiCalendar, FiClock, FiUser, FiMail, FiPhone, FiBriefcase, FiX } from 'react-icons/fi';
import { User, Event } from '../lib/supabase';
import Image from 'next/image';

interface EventModalProps {
  selectedEvent: Event | null;
  host: User | null;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  categoryIconMap: { [key: string]: any };
}

export default function EventModal({ selectedEvent, host, dialogOpen, setDialogOpen, categoryIconMap }: EventModalProps) {
  if (!dialogOpen || !selectedEvent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 relative animate-fade-in border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={() => setDialogOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <FiX size={20} />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
              {(() => {
                const Icon = categoryIconMap[selectedEvent?.category || 'Other'] || FiStar;
                return <Icon size={32} className="text-yellow-600" />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-bold text-gray-900 leading-tight truncate">{selectedEvent?.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-block px-3 py-1 rounded-full bg-yellow-200 text-yellow-800 font-semibold text-sm">
                  {selectedEvent?.category || 'Other'}
                </span>
                {selectedEvent?.presale_price !== undefined && selectedEvent.presale_price > 0 && (
                  <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                    Presale: K {selectedEvent.presale_price.toFixed(0)}
                  </span>
                )}
                {selectedEvent?.gate_price !== undefined && selectedEvent.gate_price > 0 && (
                  <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                    Gate: K {selectedEvent.gate_price.toFixed(0)}
                  </span>
                )}
                {(selectedEvent?.presale_price === undefined || selectedEvent.presale_price === 0) && (selectedEvent?.gate_price === undefined || selectedEvent.gate_price === 0) && (
                  <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold text-sm">
                    Free Event
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Event Image */}
          {selectedEvent?.image_url && (
            <div className="mb-6">
              <Image
                src={selectedEvent.image_url}
                alt={selectedEvent.name}
                width={400}
                height={200}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
              <FiMapPin size={20} className="text-gray-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-800">Location</h4>
                <p className="text-gray-600">{selectedEvent?.location}</p>
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

          {selectedEvent?.description && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">About this event</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
            </div>
          )}

          {/* Host Information */}
          {selectedEvent && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Event Host</h3>
              {host ? (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
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
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-gray-600 text-sm">{host.about}</p>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-lg">
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
                    <p>Host details for user ID "{selectedEvent.created_by}" are not available or could not be fetched.</p>
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
  );
}
