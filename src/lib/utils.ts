
import { FiMusic, FiCamera, FiCoffee, FiMonitor, FiHeart, FiSmile, FiUsers, FiBook, FiTrendingUp, FiStar } from 'react-icons/fi';

export const allCategories = [
  { name: "Music" },
  { name: "Art" },
  { name: "Food" },
  { name: "Technology" },
  { name: "Wellness" },
  { name: "Comedy" },
  { name: "Business" },
  { name: "Education" },
  { name: "Community" },
  { name: "Festival" },
  { name: "Conference" },
  { name: "Workshop" },
  { name: "Sports" },
  { name: "Meetup" },
];

export const categoryIconMap: Record<string, React.ComponentType<{ size: number }>> = {
  Music: FiMusic,
  Art: FiCamera,
  Food: FiCoffee,
  Technology: FiMonitor,
  Wellness: FiHeart,
  Comedy: FiSmile,
  Business: FiTrendingUp,
  Education: FiBook,
  Community: FiUsers,
  Festival: FiStar,
  Conference: FiTrendingUp,
  Workshop: FiBook,
  Sports: FiStar,
  Meetup: FiUsers,
};

export const categoryColorMap: Record<string, string> = {
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
