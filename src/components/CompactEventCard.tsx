import { Event } from "@/lib/supabase";

export default function CompactEventCard({ event }: { event: Event }) {
  return (
    <div className="bg-gray-50 rounded-lg event-card-compact border border-gray-200">
      <div className="text-sm font-medium text-gray-900 mb-1">{event.name}</div>
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
  );
}
