import { createServerSupabaseClient } from './supabase-server'

/**
 * Get Supabase server client for admin data fetching
 */
export async function getAdminClient() {
  return await createServerSupabaseClient()
}
