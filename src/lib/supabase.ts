// Copyright 2024 PNG Events. All rights reserved.
// This software and its associated intellectual property are protected by copyright law.
// Unauthorized copying, modification, or distribution is prohibited.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  // Check if env vars exist and are valid
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) return false;
  if (url.includes('your-project-id')) return false;
  if (key.includes('your-anon-key')) return false;
  if (url.trim() === '' || key.trim() === '') return false;
  
  return true;
}

// Enhanced Supabase client with better error handling and connection validation
export const supabase = createClient(
  supabaseUrl || 'https://your-project-id.supabase.co',
  supabaseAnonKey || 'your-anon-key-here'
)

// Connection status tracking
let connectionStatus: 'unknown' | 'connected' | 'disconnected' | 'error' = 'unknown'
let connectionCheckPromise: Promise<void> | null = null

// Test database connectivity
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not properly configured. Please check your environment variables.');
      connectionStatus = 'error'
      return false
    }

    // Test connection by making a simple query
    const { error } = await supabase.from('users').select('id').limit(1)
    
    if (error) {
      // Don't treat RLS/access errors as connection failures
      if (error.message?.includes('row-level security') || error.code === '42501') {
        connectionStatus = 'connected' // Table is accessible, just no rows due to RLS
        return true
      }
      console.warn('Supabase query issue:', error.message)
      connectionStatus = 'error'
      return false
    }

    connectionStatus = 'connected'
    return true
  } catch (error: any) {
    // Handle AbortError gracefully - this happens when component unmounts or request is cancelled
    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      console.warn('Supabase connection check was cancelled')
      return false
    }
    // Don't log as error for signal/interruption errors
    if (error?.message?.includes('signal is aborted')) {
      console.warn('Supabase connection check interrupted')
      return false
    }
    console.warn('Supabase connection check failed:', error?.message || error)
    connectionStatus = 'error'
    return false
  }
}

// Get current connection status
export const getSupabaseConnectionStatus = () => connectionStatus

// Initialize connection check (runs once)
export const initializeSupabaseConnection = async (): Promise<void> => {
  if (connectionCheckPromise) {
    await connectionCheckPromise
    return
  }
  
  const connectionResult = await testSupabaseConnection()
  connectionCheckPromise = Promise.resolve()
  return
}

// Enhanced error handler for Supabase operations
export const handleSupabaseError = (error: any, operation: string) => {
  // Don't log RLS or AbortErrors as errors
  if (error?.message?.includes('infinite recursion') || 
      error?.name === 'AbortError' ||
      error?.message?.includes('signal is aborted')) {
    console.warn(`Supabase ${operation} interrupted:`, error.message)
    return error
  }
  
  console.error(`Supabase ${operation} failed:`, error)
  
  // Provide user-friendly error messages based on error type
  if (error?.code === 'PGRST116') {
    console.error(`Table not found. Please ensure the required tables exist in your database. Operation: ${operation}`)
  } else if (error?.code === '42501') {
    console.error(`Permission denied. Please check Row Level Security policies. Operation: ${operation}`)
  } else if (error?.code === 'PGRST301') {
    console.error(`Database connection error. Please check your Supabase configuration. Operation: ${operation}`)
  } else if (error?.message?.includes('infinite recursion')) {
    console.error(`🚨 CRITICAL: RLS policy infinite recursion detected!`)
    console.error(`   This is preventing all database operations.`)
    console.error(`   Solution: Run the RLS policy fix in your Supabase SQL Editor`)
    console.error(`   File: fix-rls-policies.sql contains the exact SQL to run`)
    console.error(`   Operation: ${operation}`)
  }
  
  return error
}

// Database table names - all tables used in the app
export const TABLES = {
  EVENTS: 'events',
  USERS: 'users',
  SAVED_EVENTS: 'saved_events',
  ACTIVITIES: 'activities',
  PUSH_SUBSCRIPTIONS: 'push_subscriptions',
  USERS_BY_EMAIL: 'users_by_email'
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

    const { data, error } = await supabase
      .from(TABLES.ACTIVITIES)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // Don't log noisy errors for activities - just return empty
      return [];
    }

    return (data as Activity[]) || [];
  } catch (error) {
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
};

// Get total user count from database
export const getUserCount = async (): Promise<number> => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return 0;
    }

    const { count, error } = await supabase
      .from(TABLES.USERS)
      .select('*', { count: 'exact', head: true });

    if (error) {
      return 0;
    }

    return count || 0;
  } catch (error) {
    return 0;
  }
};

// Get total events count from database
export const getEventsCount = async (): Promise<number> => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return 0;
    }

    const { count, error } = await supabase
      .from(TABLES.EVENTS)
      .select('*', { count: 'exact', head: true });

    if (error) {
      return 0;
    }

    return count || 0;
  } catch (error) {
    return 0;
  }
};

// Get unique categories count from events
export const getCategoriesCount = async (): Promise<number> => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return 0;
    }

    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .select('category')
      .not('category', 'is', null);

    if (error) {
      return 0;
    }

    // Get unique categories
    const uniqueCategories = new Set(data?.map(event => event.category).filter(Boolean) || []);
    return uniqueCategories.size;
  } catch (error) {
    return 0;
  }
};

// Get recent activities count (last 30 days)
export const getRecentActivitiesCount = async (): Promise<number> => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return 0;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count, error } = await supabase
      .from(TABLES.ACTIVITIES)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      return 0;
    }

    return count || 0;
  } catch (error) {
    return 0;
  }
};

// Get saved events count
export const getSavedEventsCount = async (): Promise<number> => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return 0;
    }

    const { count, error } = await supabase
      .from(TABLES.SAVED_EVENTS)
      .select('*', { count: 'exact', head: true });

    if (error) {
      return 0;
    }

    return count || 0;
  } catch (error) {
    return 0;
  }
};
