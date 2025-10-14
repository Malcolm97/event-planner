import { Event } from "@/lib/supabase";
import { getEventPrimaryImage } from "@/lib/utils";
import LazyImage from "./LazyImage";
import { useMemo } from "react";

export default function CompactEventCard({ event }: { event: Event }) {
  // Memoize image source with error handling
  const imageSrc = useMemo(() => {
    try {
      const src = getEventPrimaryImage(event as any);
      // Validate the URL is not empty and doesn't point to the fallback
      if (src && src !== '/next.svg') {
        // Basic URL validation
        try {
          new URL(src, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
          return src;
        } catch (urlError) {
          console.warn('Invalid image URL for compact event:', event.name, src);
          return '/next.svg';
        }
      }
      return '/next.svg';
    } catch (error) {
      console.error('Error getting image for compact event:', event.name, error);
      return '/next.svg';
    }
  }, [(event as any).image_urls, event.name]);

  return (
    <div className="bg-gray-50 rounded-lg event-card-compact border border-gray-200 overflow-hidden">
      {/* Event Image */}
      <div className="relative h-24 bg-gradient-to-br from-gray-100 to-gray-200">
        <LazyImage
          src={imageSrc}
          alt={`Event image for ${event.name}`}
          fill={true}
          sizes="96px"
          className="object-cover"
        />
      </div>

      {/* Event Details */}
      <div className="p-3">
        <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">{event.name}</div>
        <div className="text-xs text-gray-600 mb-1">📍 {event.location}</div>
        {event.venue && (
          <div className="text-xs text-gray-600 mb-1">🏠 {event.venue}</div>
        )}
        {event.date && (
          <div className="text-xs text-gray-500">📅 {new Date(event.date).toLocaleDateString()}</div>
        )}
        {(event.presale_price !== undefined && event.presale_price !== null || event.gate_price !== undefined && event.gate_price !== null) && (
          <div className="text-xs font-medium text-indigo-600 mt-1">
            {(() => {
              const presale = typeof event.presale_price === 'number' ? event.presale_price : null;
              const gate = typeof event.gate_price === 'number' ? event.gate_price : null;

              if (presale !== null && presale > 0) {
                return `PGK ${presale.toFixed(2)} (Presale)`;
              }
              if (gate !== null && gate > 0) {
                return `PGK ${gate.toFixed(2)} (Gate)`;
              }
              if (presale === 0 && gate === 0) {
                return 'Free';
              }
              return '';
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
