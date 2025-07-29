import Image from "next/image";

export interface Event {
  id: string;
  name: string;
  location: string;
  price: number;
  description: string;
  image: string;
  createdAt?: any; // Add createdAt as optional for sorting
  featured?: boolean; // Add featured flag for filtering
  date?: string; // Add date for sorting by event date
}

export default function EventCard({ event, onClick }: { event: Event; onClick?: () => void }) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden flex flex-col h-full"
      onClick={onClick}
    >
      <div className="relative w-full h-40 bg-gray-100">
        {event.image ? (
          <Image
            src={event.image}
            alt={event.name}
            fill
            className="object-cover w-full h-full"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-400 text-4xl font-bold">
            ?
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h2 className="font-bold text-base text-gray-900 truncate mb-1">{event.name}</h2>
        <div className="text-xs text-gray-500 mb-1">{event.location}</div>
        <div className="text-xs font-semibold text-indigo-600 mb-1">
          {event.price === 0 ? "Free" : `$${event.price.toFixed(2)}`}
        </div>
        <p className="text-gray-700 text-xs line-clamp-2 flex-1">{event.description}</p>
      </div>
    </div>
  );
}
