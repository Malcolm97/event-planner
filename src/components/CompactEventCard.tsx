import { Event } from "./EventCard";

export default function CompactEventCard({ event }: { event: Event }) {
  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg px-3 py-2 mb-2 shadow-sm hover:shadow transition cursor-pointer">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-900 text-sm truncate">{event.name}</span>
        <span className="text-xs text-indigo-600 font-bold">{event.price === 0 ? "Free" : `PGK ${event.price.toFixed(2)}`}</span>
      </div>
      {event.date && (
        <div className="text-xs text-gray-500 mt-1">{new Date(event.date).toLocaleDateString()}</div>
      )}
    </div>
  );
}
