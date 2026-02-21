// External links interface for events
export interface ExternalLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
}

// Social links interface for users
export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
}

// Main Event interface - single source of truth
export interface EventItem {
  id: string;
  name: string;
  category?: string;
  location: string;
  venue?: string;
  presale_price?: number;
  gate_price?: number;
  description: string;
  image_urls?: string[] | string | null;
  created_at?: string;
  updated_at?: string;
  featured?: boolean;
  date: string;
  end_date?: string | null;
  created_by?: string;
  external_links?: ExternalLinks;
}

// User interface for Supabase
export interface UserItem {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  about?: string;
  photo_url?: string;
  contact_method?: 'email' | 'phone' | 'both' | 'none';
  whatsapp_number?: string;
  contact_visibility?: boolean;
  social_links?: SocialLinks;
  show_social_links?: boolean;
  updated_at?: string;
  role?: string;
}

// Activity interface for tracking user activities
export interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: 'event_created' | 'event_updated' | 'event_saved' | 'event_completed' | 'profile_updated' | 'event_viewed';
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
  event_id?: string;
  event_name?: string;
}

// Legacy type aliases for backward compatibility
export type Event = EventItem;
export type User = UserItem;
export type Activity = ActivityItem;
