import { createServerSupabaseClient } from './supabase-server'

/**
 * Get Supabase server client for admin data fetching
 * No authentication required - public read-only access for admin dashboard
 */
export async function getAdminClient() {
  return await createServerSupabaseClient()
}