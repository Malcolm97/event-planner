
import { FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile, FiUsers, FiBook, FiTrendingUp, FiStar } from 'react-icons/fi';

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
 * @param event - Event object that may have image_urls array or legacy image_url
 * @returns The primary image URL or fallback placeholder
 */
export function getEventPrimaryImage(event: { image_urls?: string[] | null | string; name?: string }): string {
  // First try the new image_urls array (primary image is the first one)
  if (event.image_urls) {
    let imageUrls: string[] | null = null;

    // Handle case where image_urls might be a JSON string
    // Handle cases where image_urls might be a string (single URL or JSON string)
    if (typeof event.image_urls === 'string') {
      try {
        // Attempt to parse as JSON array first
        const parsedUrls = JSON.parse(event.image_urls);
        if (Array.isArray(parsedUrls) && parsedUrls.length > 0 && parsedUrls[0]) {
          imageUrls = parsedUrls;
        } else {
          // If JSON parsing results in an empty array or not an array,
          // treat the original string as a single URL.
          imageUrls = [event.image_urls];
        }
      } catch (error) {
        // If JSON parsing fails, treat the string as a single URL.
        console.warn('Failed to parse image_urls as JSON, treating as single URL:', error);
        imageUrls = [event.image_urls];
      }
    } else if (Array.isArray(event.image_urls)) {
      // If it's already an array, use it directly.
      imageUrls = event.image_urls;
    }

    // Ensure we have at least one valid URL
    if (imageUrls && imageUrls.length > 0 && imageUrls[0]) {
      return imageUrls[0];
    }
  }


  // Final fallback - create a more event-specific placeholder
  const eventName = event.name || 'Event';
  const shortName = eventName.length > 20 ? eventName.substring(0, 20) + '...' : eventName;
  return `/next.svg`; // Using a local placeholder image
}
