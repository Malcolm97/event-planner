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
// Matches the database schema in public.events table
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
  approved?: boolean;
  // Computed fields (not in database, added by API)
  save_count?: number; // Number of times event has been saved (pre-fetched to avoid N+1 queries)
}

// User interface for Supabase
// Matches the database schema in public.profiles table
// Note: Database uses 'full_name' and 'avatar_url', not 'name' and 'photo_url'
export interface UserItem {
  id: string;
  full_name?: string;          // Database column: full_name (was 'name')
  name?: string;               // Computed alias for backward compatibility
  email?: string;              // Synced from auth.users
  company?: string;
  phone?: string;
  about?: string;
  avatar_url?: string;         // Database column: avatar_url (was 'photo_url')
  photo_url?: string;          // Computed alias for backward compatibility
  contact_method?: 'email' | 'phone' | 'both' | 'none';
  whatsapp_number?: string;
  contact_visibility?: boolean;
  social_links?: SocialLinks;
  show_social_links?: boolean;
  updated_at?: string;
  role?: string;
  approved?: boolean;
  // New profile features
  is_verified?: boolean;       // Creator verification status
  verified_at?: string;        // When the creator was verified
  follower_count?: number;     // Number of followers (denormalized)
  total_attendees?: number;    // Total attendees across all events
  total_event_views?: number;  // Total views across all events
  creator_categories?: string[]; // Event categories this creator specializes in
  avg_response_hours?: number; // Average response time in hours
}

// Activity interface for tracking user activities
// Matches the database schema in public.activities table
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

// Audit Log interface for admin audit trail
// Matches the database schema in public.audit_logs table
export interface AuditLogItem {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Category interface for event categories
// Matches the database schema in public.categories table
export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

// Location interface for event locations
// Matches the database schema in public.locations table
export interface LocationItem {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

// Legacy type aliases for backward compatibility
export type Event = EventItem;
export type User = UserItem;
export type Activity = ActivityItem;
export type AuditLog = AuditLogItem;
export type Category = CategoryItem;
export type Location = LocationItem;

// Helper function to normalize user data from database
export function normalizeUser(dbUser: any): UserItem {
  return {
    ...dbUser,
    name: dbUser.full_name || dbUser.name,
    photo_url: dbUser.avatar_url || dbUser.photo_url,
  };
}

// Helper function to prepare user data for database
export function prepareUserForDb(user: Partial<UserItem>): Record<string, any> {
  const dbUser: Record<string, any> = { ...user };
  
  // Map 'name' to 'full_name' for database
  if (user.name !== undefined) {
    dbUser.full_name = user.name;
    delete dbUser.name;
  }
  
  // Map 'photo_url' to 'avatar_url' for database
  if (user.photo_url !== undefined) {
    dbUser.avatar_url = user.photo_url;
    delete dbUser.photo_url;
  }
  
  return dbUser;
}
