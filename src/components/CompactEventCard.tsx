import { Event } from "../lib/supabase";

export default function CompactEventCard({ event }: { event: Event }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="text-sm font-medium text-gray-900 mb-1">{event.name}</div>
      <div className="text-xs text-gray-600 mb-1">📍 {event.location}</div>
      {event.date && (
        <div className="text-xs text-gray-500">📅 {new Date(event.date).toLocaleDateString()}</div>
      )}
      {(event.presale_price !== undefined || event.gate_price !== undefined) && (
        <div className="text-xs font-medium text-indigo-600 mt-1">
          {(() => {
            const presale = event.presale_price;
            const gate = event.gate_price;

            if (presale !== undefined && presale > 0) {
              return `PGK ${presale.toFixed(2)} (Presale)`;
            }
            if (gate !== undefined && gate > 0) {
              return `PGK ${gate.toFixed(2)} (Gate)`;
            }
            return 'Free';
          })()}
        </div>
      )}
    </div>
  );
}
