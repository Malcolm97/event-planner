
import { FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile, FiUsers, FiBook, FiTrendingUp, FiStar } from 'react-icons/fi';
import { EventItem } from '@/lib/types';

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
  Art: FiImage,
  Food: FiCoffee,
  Technology: FiCpu,
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

/**
 * Get the primary image URL from an event, with support for multiple images
 * @param event - Event object that may have image_urls array
 * @returns The primary image URL or fallback placeholder
 */
export function getEventPrimaryImage(event: EventItem | { image_urls?: string[] | null | string; name?: string }): string {
  if (event.image_urls) {
    let imageUrls: string[] | null = null;

    if (typeof event.image_urls === 'string') {
      try {
        const parsedUrls = JSON.parse(event.image_urls);
        if (Array.isArray(parsedUrls) && parsedUrls.length > 0 && parsedUrls[0]) {
          imageUrls = parsedUrls;
        } else {
          imageUrls = [event.image_urls];
        }
      } catch (error) {
        console.warn('Failed to parse image_urls as JSON, treating as single URL:', error);
        imageUrls = [event.image_urls];
      }
    } else if (Array.isArray(event.image_urls)) {
      imageUrls = event.image_urls;
    }

    if (imageUrls && imageUrls.length > 0 && imageUrls[0]) {
      return imageUrls[0];
    }
  }

  return `/next.svg`;
}
