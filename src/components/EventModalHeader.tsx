import React from 'react';
import Link from 'next/link';
import { FiX, FiEdit, FiStar, FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile, FiDollarSign } from 'react-icons/fi';
import { User } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { EventItem } from '@/lib/types';

interface EventModalHeaderProps {
  selectedEvent: EventItem;
  onClose: () => void;
}

const EventModalHeader: React.FC<EventModalHeaderProps> = ({ selectedEvent, onClose }) => {
  const { user: authUser } = useAuth();

  // Define category mappings
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

  const categoryLabel = selectedEvent?.category?.trim() || 'Other';
  const categoryColor = categoryColorMap[categoryLabel] || 'bg-gray-100 text-gray-700';
  const Icon = categoryIconMap[categoryLabel] || FiStar;

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

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden flex flex-col gap-4 pr-20">
        {/* Pricing and Category on same line */}
        <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-1.5">
          {/* Pricing */}
          {selectedEvent?.presale_price !== undefined && selectedEvent.presale_price !== null && selectedEvent.presale_price > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold text-xs shadow-lg border border-white/30">
              <FiDollarSign size={10} />
              Presale: K{selectedEvent.presale_price.toFixed(0)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-white font-semibold text-xs shadow-lg border border-white/30">
              <FiDollarSign size={10} />
              Presale: Free
            </span>
          )}

          {selectedEvent?.gate_price !== undefined && selectedEvent.gate_price !== null && selectedEvent.gate_price > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white font-semibold text-xs shadow-lg border border-white/30">
              <FiDollarSign size={10} />
              Gate: K{selectedEvent.gate_price.toFixed(0)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-white font-semibold text-xs shadow-lg border border-white/30">
              <FiDollarSign size={10} />
              Gate: Free
            </span>
          )}

          {/* Category Icon and Text - after gate */}
          <div className="flex-shrink-0">
            <div className={`w-auto px-2 py-1.5 rounded-full bg-gradient-to-br from-yellow-100 via-orange-50 to-yellow-200 flex items-center gap-1.5 shadow-md border border-yellow-200/50`}>
              <Icon size={14} className="text-yellow-700" />
              <span className="text-xs font-semibold text-yellow-800">{categoryLabel}</span>
            </div>
          </div>
        </div>

        {/* Event Title centered below */}
        <div className="text-center pr-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight break-words">
            {selectedEvent?.name}
          </h1>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex justify-between items-center gap-4">
        {/* Event Title - Left */}
        <div className="flex-shrink-0 min-w-0 flex-1">
          <h1 className="text-2xl xl:text-3xl font-bold text-gray-900 leading-tight break-words">
            {selectedEvent?.name}
          </h1>
        </div>

        {/* Pricing and Category - Center */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-wrap justify-center items-center gap-2 xl:gap-3">
          {selectedEvent?.presale_price !== undefined && selectedEvent.presale_price !== null && selectedEvent.presale_price > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold text-sm shadow-lg border border-white/30">
              <FiDollarSign size={12} />
              Presale: K{selectedEvent.presale_price.toFixed(0)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-white font-semibold text-sm shadow-lg border border-white/30">
              <FiDollarSign size={12} />
              Presale: Free
            </span>
          )}

          {selectedEvent?.gate_price !== undefined && selectedEvent.gate_price !== null && selectedEvent.gate_price > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg border border-white/30">
              <FiDollarSign size={12} />
              Gate: K{selectedEvent.gate_price.toFixed(0)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-white font-semibold text-sm shadow-lg border border-white/30">
              <FiDollarSign size={12} />
              Gate: Free
            </span>
          )}

          {/* Category next to gate */}
          <div className="flex-shrink-0">
            <div className={`w-auto px-3 py-2 rounded-full bg-gradient-to-br from-yellow-100 via-orange-50 to-yellow-200 flex items-center gap-2 shadow-md border border-yellow-200/50`}>
              <Icon size={16} className="text-yellow-700" />
              <span className="text-sm font-semibold text-yellow-800">{categoryLabel}</span>
            </div>
          </div>
        </div>

        {/* Empty space - Right (to balance the layout) */}
        <div className="flex-shrink-0 w-32 xl:w-40"></div>
      </div>
    </div>
  );
};

export default EventModalHeader;
