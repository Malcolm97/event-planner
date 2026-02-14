import { NextResponse } from "next/server"
import { supabase, TABLES } from "@/lib/supabase"
import { getUserFriendlyError } from "@/lib/userMessages"

// Helper function to check admin access - uses 'users' table
async function checkAdminAccess() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { isAdmin: false, error: 'Not authenticated' }
    }

    const { data: userData, error: userError } = await supabase
      .from(TABLES.USERS)
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError) {
      const isUserNotFound = userError.code === 'PGRST116' ||
                               userError.message?.includes('No rows found') ||
                               userError.code === 'PGRST204' ||
                               !userError.code

      if (isUserNotFound) {
        return { isAdmin: false, error: 'We couldn\'t find your profile. Please try signing in again.' }
      } else {
        return { isAdmin: false, error: getUserFriendlyError(userError, 'Something went wrong. Please try again.') }
      }
    }

    return { isAdmin: userData?.role === 'admin', user }
  } catch (error) {
    return { isAdmin: false, error: getUserFriendlyError(error, 'Something unexpected happened. Please try again.') }
  }
}

export async function GET(request: Request) {
  // Admin API routes require authentication
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess()
    
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error || 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Cap at 100
    const search = searchParams.get('search')
    const role = searchParams.get('role')

    // First, get users with pagination and search
    let usersQuery = supabase.from(TABLES.USERS).select("*", { count: 'exact' })

    if (search) {
      usersQuery = usersQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    usersQuery = usersQuery.range(from, to).order('updated_at', { ascending: false })

    const { data: usersData, error: usersError, count: totalCount } = await usersQuery

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json(
        { error: getUserFriendlyError(usersError, "Failed to fetch users") },
        { status: 500 }
      )
    }

    if (!usersData || usersData.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit)
        }
      })
    }

    // Get user IDs for batch queries
    const userIds = usersData.map(user => user.id)

    // OPTIMIZATION: Batch fetch events created and saved counts
    const { data: eventsCreatedData } = await supabase
      .from(TABLES.EVENTS)
      .select('created_by')
      .in('created_by', userIds)

    const { data: savedEventsData } = await supabase
      .from(TABLES.SAVED_EVENTS)
      .select('user_id')
      .in('user_id', userIds)

    // Count events created per user
    const eventsCreatedMap = new Map<string, number>()
    eventsCreatedData?.forEach(event => {
      eventsCreatedMap.set(event.created_by, (eventsCreatedMap.get(event.created_by) || 0) + 1)
    })

    // Count events saved per user
    const eventsSavedMap = new Map<string, number>()
    savedEventsData?.forEach(save => {
      eventsSavedMap.set(save.user_id, (eventsSavedMap.get(save.user_id) || 0) + 1)
    })

    // Apply role filter
    let filteredUsers = usersData
    if (role && role !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === role)
    }

    // Enrich data with activity counts
    const enrichedData = filteredUsers.map(user => ({
      id: user.id,
      full_name: user.name,
      email: user.email,
      company: user.company,
      phone: user.phone,
      about: user.about,
      photo_url: user.photo_url,
      contact_method: user.contact_method,
      whatsapp_number: user.whatsapp_number,
      contact_visibility: user.contact_visibility,
      role: user.role || 'user',
      created_at: user.updated_at,
      updated_at: user.updated_at,
      events_created: eventsCreatedMap.get(user.id) || 0,
      events_saved: eventsSavedMap.get(user.id) || 0
    }))

    return NextResponse.json({
      data: enrichedData,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error("Unexpected error in users API:", error)
    return NextResponse.json(
      { error: getUserFriendlyError(error, "Internal server error") },
      { status: 500 }
    )
  }
}
