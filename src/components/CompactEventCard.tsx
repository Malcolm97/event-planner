import { Event } from "../lib/supabase";

export default function CompactEventCard({ event }: { event: Event }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="text-sm font-medium text-gray-900 mb-1">{event.name}</div>
      <div className="text-xs text-gray-600 mb-1">📍 {event.location}</div>
      {event.date && (
        <div className="text-xs text-gray-500">📅 {new Date(event.date).toLocaleDateString()}</div>
      )}
      {event.price !== undefined && (
        <div className="text-xs font-medium text-indigo-600 mt-1">
          {event.price === 0 ? 'Free' : `PGK ${event.price.toFixed(2)}`}
        </div>
      )}
    </div>
  );
}
