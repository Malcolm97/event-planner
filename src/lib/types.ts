// Define the EventItem type here for shared use across the application
export interface EventItem {
  id: string;
  name: string;
  category?: string;
  location: string;
  venue?: string;
  presale_price?: number;
  gate_price?: number;
  description: string;
  image_urls?: string[] | string | null; // Support both array and JSON string formats
  image_url?: string; // Keep for backward compatibility
  created_at?: string;
  featured?: boolean;
  date: string; // Assuming date is stored as string in API/cache, matching current usage
  created_by?: string;
}
