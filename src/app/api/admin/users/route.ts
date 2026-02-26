import { NextResponse } from "next/server"
import { TABLES, USER_FIELDS } from "@/lib/supabase"
import { getUserFriendlyError } from "@/lib/userMessages"
import { normalizeUser } from "@/lib/types"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { requireAdminAccess, addAdminCacheHeaders } from "@/lib/admin-utils"

export async function GET(request: Request) {
  try {
    // Check admin access first
    const adminError = await requireAdminAccess()
    if (adminError) {
      return adminError
    }

    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    // Build query for profiles table using correct field names
    let profilesQuery = supabase
      .from(TABLES.PROFILES)
      .select('*', { count: 'exact' })

    if (search) {
      // Search in full_name, email, and company fields
      profilesQuery = profilesQuery.or(`${USER_FIELDS.FULL_NAME}.ilike.%${search}%,${USER_FIELDS.EMAIL}.ilike.%${search}%,company.ilike.%${search}%`)
    }

    // Apply role filter
    if (role && role !== 'all') {
      profilesQuery = profilesQuery.eq(USER_FIELDS.ROLE, role)
    }

    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'approved') {
        profilesQuery = profilesQuery.eq(USER_FIELDS.APPROVED, true)
      } else if (status === 'pending') {
        profilesQuery = profilesQuery.eq(USER_FIELDS.APPROVED, false)
      }
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    profilesQuery = profilesQuery.range(from, to).order(USER_FIELDS.UPDATED_AT, { ascending: false })

    const { data: profilesData, error: profilesError, count: totalCount } = await profilesQuery

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError)
      return NextResponse.json(
        { error: getUserFriendlyError(profilesError, "Failed to fetch users") },
        { status: 500 }
      )
    }

    if (!profilesData || profilesData.length === 0) {
      const response = NextResponse.json({
        data: [],
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit)
        }
      })
      return addAdminCacheHeaders(response)
    }

    // Get user IDs for batch queries
    const userIds = profilesData.map(profile => profile.id)

    // OPTIMIZATION: Batch fetch events created and saved counts in parallel
    const [eventsCreatedData, savedEventsData] = await Promise.all([
      supabase
        .from(TABLES.EVENTS)
        .select('created_by')
        .in('created_by', userIds),
      
      supabase
        .from(TABLES.SAVED_EVENTS)
        .select('user_id')
        .in('user_id', userIds)
    ])

    // Count events created per user
    const eventsCreatedMap = new Map<string, number>()
    eventsCreatedData.data?.forEach(event => {
      eventsCreatedMap.set(event.created_by, (eventsCreatedMap.get(event.created_by) || 0) + 1)
    })

    // Count events saved per user
    const eventsSavedMap = new Map<string, number>()
    savedEventsData.data?.forEach(save => {
      eventsSavedMap.set(save.user_id, (eventsSavedMap.get(save.user_id) || 0) + 1)
    })

    // Enrich data with activity counts and normalize field names
    const enrichedData = profilesData.map(profile => {
      // Normalize to include both field name variants
      const normalized = normalizeUser(profile)
      return {
        ...normalized,
        id: profile.id,
        full_name: profile.full_name,
        name: profile.full_name, // Alias for backward compatibility
        email: profile.email,
        avatar_url: profile.avatar_url,
        photo_url: profile.avatar_url, // Alias for backward compatibility
        role: profile.role || 'user',
        approved: profile.approved || false,
        created_at: profile.updated_at,
        updated_at: profile.updated_at,
        events_created: eventsCreatedMap.get(profile.id) || 0,
        events_saved: eventsSavedMap.get(profile.id) || 0
      }
    })

    const response = NextResponse.json({
      data: enrichedData,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })
    
    return addAdminCacheHeaders(response)

  } catch (error) {
    console.error("Unexpected error in users API:", error)
    return NextResponse.json(
      { error: getUserFriendlyError(error, "Internal server error") },
      { status: 500 }
    )
  }
}