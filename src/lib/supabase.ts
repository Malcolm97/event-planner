import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && 
         supabaseAnonKey && 
         !supabaseUrl.includes('your-project-id') && 
         !supabaseAnonKey.includes('your-anon-key')
}

export const supabase = createClient(
  supabaseUrl || 'https://your-project-id.supabase.co',
  supabaseAnonKey || 'your-anon-key-here'
)

// Database table names
export const TABLES = {
  EVENTS: 'events',
  USERS: 'users',
  USERS_BY_EMAIL: 'users_by_email',
  SAVED_EVENTS: 'saved_events',
  ACTIVITIES: 'activities'
} as const

// Event interface for Supabase
export interface Event {
  id: string
  name: string
  category?: string
  location: string
  venue?: string
  presale_price?: number
  gate_price?: number
  description: string
  image_urls?: string[]
  created_at?: string
  featured?: boolean
  date: string
  created_by?: string
}

// User interface for Supabase
export interface User {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
  about?: string
  photo_url?: string
  contact_method?: 'email' | 'phone' | 'both' | 'none'
  whatsapp_number?: string
  contact_visibility?: boolean
  updated_at?: string
}

// Activity interface for tracking user activities
export interface Activity {
  id: string
  user_id: string
  activity_type: 'event_created' | 'event_updated' | 'event_saved' | 'event_completed' | 'profile_updated' | 'event_viewed'
  description: string
  metadata?: Record<string, any>
  created_at: string
  event_id?: string
  event_name?: string
}

// Activity tracking functions
export const recordActivity = async (
  userId: string,
  activityType: Activity['activity_type'],
  description: string,
  metadata?: Record<string, any>,
  eventId?: string,
  eventName?: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLES.ACTIVITIES)
      .insert({
        user_id: userId,
        activity_type: activityType,
        description,
        metadata,
        event_id: eventId,
        event_name: eventName,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error recording activity:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to record activity:', error);
  }
};

export const getUserActivities = async (userId: string, limit: number = 10): Promise<Activity[]> => {
  try {
    // Validate inputs
    if (!userId) {
      console.warn('getUserActivities: User ID is required to fetch activities');
      return [];
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('getUserActivities: Supabase is not properly configured. Please check your environment variables.');
      return [];
    }

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('getUserActivities: User must be authenticated to fetch activities');
      return [];
    }

    console.log('Fetching activities for user:', userId);
    console.log('Supabase client status:', {
      configured: isSupabaseConfigured(),
      url: supabaseUrl ? 'URL available' : 'No URL',
      hasKey: supabaseAnonKey ? 'Key available' : 'No key'
    });

    const { data, error } = await supabase
      .from(TABLES.ACTIVITIES)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    console.log('Supabase query result - data:', data, 'error:', error);

    if (error) {
      console.error('Supabase error occurred');
      console.error('Message:', error?.message || 'Unknown error');
      console.error('Details:', error?.details || 'No details available');
      console.error('Hint:', error?.hint || 'No hint available');
      console.error('Code:', error?.code || 'Unknown code');
      console.error('User ID:', userId);
      console.error('Error type:', typeof error);
      console.error('Error string:', String(error));
      console.error('Error JSON:', (() => { try { return JSON.stringify(error); } catch { return 'Cannot stringify error'; } })());
      console.error('Raw error:', error);

      // Provide more specific error messages based on error codes
      if (error.code === 'PGRST116') {
        console.error(`Activities table not found. Please ensure the activities table exists in your database. Error: ${error.message}`);
        return [];
      }
      if (error.code === '42501') {
        console.error(`Permission denied. Please check Row Level Security policies for the activities table. Error: ${error.message}`);
        return [];
      }
      if (error.code === 'PGRST301') {
        console.error(`Database connection error. Please check your Supabase configuration. Error: ${error.message}`);
        return [];
      }

      console.error(`Failed to fetch activities: ${error.message || 'Unknown error'}`);
      return [];
    }

    console.log('Successfully fetched activities:', data?.length || 0, 'records');

    return (data as Activity[]) || [];
  } catch (error) {
    console.error('Failed to fetch activities:', {
      error: error instanceof Error ? error.message : String(error),
      userId: userId,
      timestamp: new Date().toISOString()
    });

    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
};

// Get total user count from database
export const getUserCount = async (): Promise<number> => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('getUserCount: Supabase is not properly configured. Please check your environment variables.');
      return 0;
    }

    const { count, error } = await supabase
      .from(TABLES.USERS)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching user count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Failed to fetch user count:', error);
    return 0;
  }
};

// Get total events count from database
export const getEventsCount = async (): Promise<number> => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('getEventsCount: Supabase is not properly configured. Please check your environment variables.');
      return 0;
    }

    const { count, error } = await supabase
      .from(TABLES.EVENTS)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching events count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Failed to fetch events count:', error);
    return 0;
  }
};

// Get unique categories count from events
export const getCategoriesCount = async (): Promise<number> => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('getCategoriesCount: Supabase is not properly configured. Please check your environment variables.');
      return 0;
    }

    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('Error fetching categories:', error);
      return 0;
    }

    // Get unique categories
    const uniqueCategories = new Set(data?.map(event => event.category).filter(Boolean) || []);
    return uniqueCategories.size;
  } catch (error) {
    console.error('Failed to fetch categories count:', error);
    return 0;
  }
};

// Get recent activities count (last 30 days)
export const getRecentActivitiesCount = async (): Promise<number> => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('getRecentActivitiesCount: Supabase is not properly configured. Please check your environment variables.');
      return 0;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count, error } = await supabase
      .from(TABLES.ACTIVITIES)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Error fetching recent activities count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Failed to fetch recent activities count:', error);
    return 0;
  }
};

// Get saved events count
export const getSavedEventsCount = async (): Promise<number> => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('getSavedEventsCount: Supabase is not properly configured. Please check your environment variables.');
      return 0;
    }

    const { count, error } = await supabase
      .from(TABLES.SAVED_EVENTS)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching saved events count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Failed to fetch saved events count:', error);
    return 0;
  }
};
