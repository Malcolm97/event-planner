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

  // Define category mappings - updated with gradient colors matching EventCard
  const categoryColorMap: { [key: string]: string } = {
    'Music': 'bg-purple-500/90 text-white',
    'Art': 'bg-pink-500/90 text-white',
    'Food': 'bg-orange-500/90 text-white',
    'Technology': 'bg-blue-500/90 text-white',
    'Wellness': 'bg-emerald-500/90 text-white',
    'Comedy': 'bg-yellow-500/90 text-white',
    'Other': 'bg-gray-500/90 text-white',
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
  const categoryColor = categoryColorMap[categoryLabel] || 'bg-gray-500/90 text-white';
  const Icon = categoryIconMap[categoryLabel] || FiStar;

  return (
    <div className="relative border-b border-gray-100 bg-gradient-to-r from-white via-gray-50/30 to-white px-4 sm:px-5 md:px-6 lg:px-8 pt-6 sm:pt-7 pb-4 sm:pb-5">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 p-2 sm:p-2.5 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl hover:bg-white hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
        aria-label="Close Modal"
      >
        <FiX size={20} className="text-gray-600" />
      </button>

      {/* Edit Button for Event Creators */}
      {authUser && selectedEvent?.created_by === authUser.id && (
        <Link
          href={`/dashboard/edit-event/${selectedEvent.id}`}
          className="absolute top-3 sm:top-4 right-14 sm:right-16 z-20 p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
          aria-label="Manage Event"
        >
          <FiEdit size={18} />
        </Link>
      )}

      {/* Mobile/Tablet Layout - Compact horizontal layout */}
      <div className="lg:hidden flex flex-col gap-2 sm:gap-3 pr-24 sm:pr-28 overflow-hidden">
        {/* Event Title */}
        <div className="text-center">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight break-words px-2">
            {selectedEvent?.name}
          </h1>
        </div>

        {/* Pricing and Category - Single line compact */}
        <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-1.5">
          {/* Presale Price */}
          {selectedEvent?.presale_price !== undefined && selectedEvent.presale_price !== null && selectedEvent.presale_price > 0 ? (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow">
              <FiDollarSign size={8} className="sm:size-10" />
              <span className="hidden xs:inline">Presale:</span> K{selectedEvent.presale_price.toFixed(0)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow">
              <FiDollarSign size={8} className="sm:size-10" />
              Free
            </span>
          )}

          {/* Gate Price */}
          {selectedEvent?.gate_price !== undefined && selectedEvent.gate_price !== null && selectedEvent.gate_price > 0 && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold bg-white/95 backdrop-blur-sm text-gray-700 shadow border border-gray-200">
              Gate: K{selectedEvent.gate_price.toFixed(0)}
            </span>
          )}

          {/* Category */}
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-semibold ${categoryColor} shadow`}>
            <Icon size={8} className="sm:size-10" />
            {categoryLabel}
          </span>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex justify-between items-center gap-6">
        {/* Event Title - Left */}
        <div className="flex-1 min-w-0 pr-40">
          <h1 className="text-xl xl:text-2xl 2xl:text-3xl font-bold text-gray-900 leading-tight break-words">
            {selectedEvent?.name}
          </h1>
        </div>

        {/* Pricing and Category - Right */}
        <div className="flex flex-wrap items-center gap-2 xl:gap-3 flex-shrink-0">
          {/* Presale Price */}
          {selectedEvent?.presale_price !== undefined && selectedEvent.presale_price !== null && selectedEvent.presale_price > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 xl:px-4 xl:py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg">
              <FiDollarSign size={14} />
              Presale: K{selectedEvent.presale_price.toFixed(0)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 xl:px-4 xl:py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg">
              <FiDollarSign size={14} />
              Free Event
            </span>
          )}

          {/* Gate Price */}
          {selectedEvent?.gate_price !== undefined && selectedEvent.gate_price !== null && selectedEvent.gate_price > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 xl:px-4 xl:py-2 rounded-xl text-sm font-bold bg-white/95 backdrop-blur-sm text-gray-700 shadow-lg border border-gray-200">
              Gate: K{selectedEvent.gate_price.toFixed(0)}
            </span>
          )}

          {/* Category */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 xl:px-4 xl:py-2 rounded-xl text-sm font-semibold ${categoryColor} shadow-lg`}>
            <Icon size={14} />
            {categoryLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EventModalHeader;
