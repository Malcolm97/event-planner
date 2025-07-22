import Image from "next/image";

export interface Event {
  id: string;
  name: string;
  location: string;
  price: number;
  description: string;
  image: string;
}

export default function EventCard({ event, onClick }: { event: Event; onClick?: () => void }) {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow cursor-pointer overflow-hidden flex flex-col h-full"
      onClick={onClick}
    >
      <div className="relative w-full h-48">
        <Image
          src={event.image}
          alt={event.name}
          fill
          className="object-cover w-full h-full"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h2 className="font-bold text-lg text-gray-900 dark:text-white truncate">{event.name}</h2>
        <div className="text-sm text-gray-500 dark:text-gray-300">{event.location}</div>
        <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
          {event.price === 0 ? "Free" : `$${event.price.toFixed(2)}`}
        </div>
        <p className="text-gray-700 dark:text-gray-200 text-sm line-clamp-2 flex-1">{event.description}</p>
      </div>
    </div>
  );
}
