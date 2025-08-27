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
  USERS_BY_EMAIL: 'users_by_email'
} as const

// Event interface for Supabase
export interface Event {
  id: string
  name: string
  category?: string
  location: string
  venue?: string
  presale_price?: number // Added presale price
  gate_price?: number    // Added gate price
  description: string
  image_urls?: string[] // Changed from single image_url to array of URLs
  image_url?: string // Keep for backward compatibility
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
