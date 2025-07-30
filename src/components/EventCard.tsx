import { FiMusic, FiCamera, FiCoffee, FiMonitor, FiHeart, FiSmile, FiUsers, FiBook, FiTrendingUp, FiStar } from 'react-icons/fi';

export interface Event {
  id: string;
  name: string;
  category?: string;
  location: string;
  price: number;
  description: string;
  image: string;
  createdAt?: any;
  featured?: boolean;
  date?: string;
  createdBy?: string;
}

export default function EventCard({ event, onClick }: { event: Event; onClick?: () => void }) {
  const hasCategory = event.category && event.category.trim();
  const categoryLabel = hasCategory ? event.category : 'Other';

  // Color and icon mapping
  const categoryColorMap: Record<string, string> = {
    Music: 'bg-yellow-400 text-black',
    Art: 'bg-pink-400 text-white',
    Food: 'bg-amber-300 text-black',
    Technology: 'bg-yellow-300 text-black',
    Wellness: 'bg-green-400 text-black',
    Comedy: 'bg-yellow-200 text-black',
    Business: 'bg-red-600 text-white',
    Education: 'bg-black text-yellow-300',
    Community: 'bg-red-400 text-white',
    Festival: 'bg-fuchsia-400 text-white',
    Conference: 'bg-cyan-400 text-black',
    Workshop: 'bg-lime-300 text-black',
    Sports: 'bg-amber-500 text-black',
    Meetup: 'bg-gray-300 text-black',
    Other: 'bg-gray-300 text-black',
  };
  const categoryColor = categoryColorMap[categoryLabel!] || 'bg-gray-300 text-black';

  const categoryIconMap: Record<string, JSX.Element> = {
    Music: <FiMusic size={48} />,
    Art: <FiCamera size={48} />,
    Food: <FiCoffee size={48} />,
    Technology: <FiMonitor size={48} />,
    Wellness: <FiHeart size={48} />,
    Comedy: <FiSmile size={48} />,
    Business: <FiTrendingUp size={48} />,
    Education: <FiBook size={48} />,
    Community: <FiUsers size={48} />,
    Festival: <FiStar size={48} />,
    Conference: <FiTrendingUp size={48} />,
    Workshop: <FiBook size={48} />,
    Sports: <FiStar size={48} />,
    Meetup: <FiUsers size={48} />,
    Other: <FiUsers size={48} />,
  };
  const categoryIcon = categoryIconMap[categoryLabel!] || <FiUsers size={48} />;

  return (
    <div
      className={`bg-white rounded-2xl border-2 border-gray-100 shadow-lg hover:shadow-2xl transition-shadow cursor-pointer flex flex-col h-full group relative overflow-hidden`}
      onClick={onClick}
    >
      {/* Vibrant top bar for category */}
      <div className={`h-2 w-full ${categoryColor}`}></div>
      <div className="relative w-full h-36 bg-yellow-50 flex items-center justify-center">
        {/* Category icon as photo substitute */}
        <div className="flex items-center justify-center w-full h-full text-gray-400 text-5xl font-bold">
          {categoryIcon}
        </div>
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${categoryColor}`}>{categoryLabel}</span>
          <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-400 text-black shadow-sm">
            {event.price === 0 ? "Free" : `PGK ${event.price.toFixed(2)}`}
          </span>
        </div>
        <h2 className="font-extrabold text-lg text-black truncate mb-1 group-hover:text-yellow-600 transition">{event.name}</h2>
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
          <span>📍 {event.location}</span>
          {event.date && (
            <span className="ml-auto">📅 {new Date(event.date).toLocaleDateString()}</span>
          )}
        </div>
        {/* Description removed from card for cleaner look */}
      </div>
    </div>
  );
}