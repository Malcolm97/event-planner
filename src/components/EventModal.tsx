'use client';

import { FiStar } from 'react-icons/fi';
import { User, Event } from '../lib/supabase';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 relative animate-fade-in border border-gray-200">
        {/* Header */}
        <div className="p-6 pb-4">
          <button
            onClick={() => setDialogOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            &times;
          </button>

          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              {(() => {
                const Icon = categoryIconMap[selectedEvent?.category || 'Other'] || FiStar;
                return <Icon size={24} className="text-yellow-600" />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{selectedEvent?.name}</h2>
              <div className="flex flex-wrap gap-2">
                <span className="inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-semibold text-sm">
                  {selectedEvent?.category || 'Other'}
                </span>
                {selectedEvent?.presale_price !== undefined && selectedEvent.presale_price > 0 && (
                  <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                    Presale: K {selectedEvent.presale_price.toFixed(0)}
                  </span>
                )}
                {selectedEvent?.gate_price !== undefined && selectedEvent.gate_price > 0 && (
                  <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                    Gate: K {selectedEvent.gate_price.toFixed(0)}
                  </span>
                )}
                {(selectedEvent?.presale_price === undefined || selectedEvent.presale_price === 0) && (selectedEvent?.gate_price === undefined || selectedEvent.gate_price === 0) && (
                  <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                    Free
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-600">
              <FiStar size={18} className="text-gray-400 flex-shrink-0" />
              <span className="font-medium">{selectedEvent?.location}</span>
            </div>

            {selectedEvent?.date && (
              <div className="flex items-center gap-3 text-gray-600">
                <FiStar size={18} className="text-gray-400 flex-shrink-0" />
                <span className="font-medium">{new Date(selectedEvent.date!).toLocaleString()}</span>
              </div>
            )}

            {selectedEvent?.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
              </div>
            )}
          </div>

          {/* Host Information */}
          {selectedEvent && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Host</h3>
              {host ? (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {host?.name && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Name:</span>
                      <span className="text-gray-900">{host.name}</span>
                    </div>
                  )}
                  {host?.email && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Email:</span>
                      <a href={`mailto:${host.email}`} className="text-blue-600 hover:underline text-gray-900">{host.email}</a>
                    </div>
                  )}
                  {host?.phone && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Phone:</span>
                      <a href={`tel:${host.phone}`} className="text-blue-600 hover:underline text-gray-900">{host.phone}</a>
                    </div>
                  )}
                  {host?.company && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Company:</span>
                      <span className="text-gray-900">{host.company}</span>
                    </div>
                  )}
                  {host?.about && (
                    <div className="pt-2">
                      <span className="text-gray-600 text-sm">{host.about}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg text-center">
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
