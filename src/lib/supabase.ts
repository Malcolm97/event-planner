import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set correctly.'
  )
}

if (!supabaseUrl.startsWith('https://') || supabaseUrl.includes('your-project-id')) {
  throw new Error(
    'Invalid Supabase URL. Please replace the placeholder in .env.local with your actual Supabase project URL from your project settings.'
  )
}

if (supabaseAnonKey.includes('your-anon-key')) {
  throw new Error(
    'Invalid Supabase anon key. Please replace the placeholder in .env.local with your actual Supabase anon key from your project settings.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  price: number
  description: string
  image_url?: string // Add image_url property
  created_at?: string
  featured?: boolean
  date?: string
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
