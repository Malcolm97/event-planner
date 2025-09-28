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

    const { data, error } = await supabase
      .from(TABLES.ACTIVITIES)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        userId: userId
      });

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
