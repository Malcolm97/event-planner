import { FiStar, FiMapPin, FiCalendar, FiDollarSign, FiClock } from 'react-icons/fi';
import { categoryColorMap, categoryIconMap } from '../lib/utils';
import { Event } from '../lib/supabase';
import Image from 'next/image'; // Import the Image component

export default function EventCard({ event, onClick }: { event: Event; onClick?: () => void }) {
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
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.name}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          /* Category Icon as Hero (fallback if no image) */
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm shadow-lg">
            <Icon size={32} />
          </div>
        )}
        
        {/* Price Badges - Bottom Left */}
        <div className="absolute bottom-3 left-3 flex flex-col items-start gap-1">
          {event.presale_price !== undefined && event.presale_price !== null && event.presale_price > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm text-gray-900 shadow-sm">
              Presale: K {event.presale_price.toFixed(0)}
            </span>
          )}
          {event.gate_price !== undefined && event.gate_price !== null && event.gate_price > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm text-gray-900 shadow-sm">
              Gate: K {event.gate_price.toFixed(0)}
            </span>
          )}
          {(event.presale_price === undefined || event.presale_price === null || event.presale_price === 0) && (event.gate_price === undefined || event.gate_price === null || event.gate_price === 0) && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold bg-white/90 backdrop-blur-sm text-gray-900 shadow-sm">
              <FiDollarSign size={14} />
              Free
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
      <div className="p-5 flex flex-col gap-3">
        {/* Event Title */}
        <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-2 group-hover:text-yellow-600 transition-colors duration-200">
          {event.name}
        </h3>

        {/* Location and Date */}
        <div className="flex flex-col gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <FiMapPin size={14} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
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
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-3">
          <div className="w-full h-1 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </div>

      {/* Hover Overlay Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
}
