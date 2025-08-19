import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Using placeholder values for development.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
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
  price: number
  description: string
  image: string
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