import React from 'react';
import Link from 'next/link';
import { FiX, FiEdit } from 'react-icons/fi';
import { User } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { EventItem } from '@/lib/types';

interface EventModalHeaderProps {
  selectedEvent: EventItem;
  onClose: () => void;
}

const EventModalHeader: React.FC<EventModalHeaderProps> = ({ selectedEvent, onClose }) => {
  const { user: authUser } = useAuth();

  return (
    <div className="relative border-b border-gray-200/80 bg-gradient-to-r from-white via-gray-50/50 to-white p-6 sm:p-8">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl hover:bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
        aria-label="Close Modal"
      >
        <FiX size={20} className="text-gray-600" />
      </button>

      {/* Edit Button for Event Creators */}
      {authUser && selectedEvent?.created_by === authUser.id && (
        <Link
          href={`/dashboard/edit-event/${selectedEvent.id}`}
          className="absolute top-4 right-16 z-10 p-2 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
          aria-label="Manage Event"
        >
          <FiEdit size={18} />
        </Link>
      )}

      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
        {/* Category Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-yellow-100 via-orange-50 to-yellow-200 flex items-center justify-center shadow-md border border-yellow-200/50">
            <span className="text-lg sm:text-xl">🎯</span>
          </div>
        </div>

        {/* Event Title and Badges */}
        <div className="flex-1 min-w-0 space-y-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight break-words">
            {selectedEvent?.name}
          </h1>

          {/* Category and Pricing Badges */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold text-xs shadow-sm">
              {selectedEvent?.category || 'Other'}
            </span>

            {selectedEvent?.presale_price !== undefined && selectedEvent.presale_price !== null && selectedEvent.presale_price > 0 ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold text-xs shadow-sm">
                Presale: K{selectedEvent.presale_price.toFixed(0)}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold text-xs shadow-sm">
                Presale: None
              </span>
            )}

            {selectedEvent?.gate_price !== undefined && selectedEvent.gate_price !== null && selectedEvent.gate_price > 0 ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-semibold text-xs shadow-sm">
                Gate: K{selectedEvent.gate_price.toFixed(0)}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold text-xs shadow-sm">
                Gate: None
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModalHeader;
