import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Helper function to check admin access
async function checkAdminAccess() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { isAdmin: false, error: 'Not authenticated' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      const isProfileNotFound = profileError.code === 'PGRST116' ||
                               profileError.message?.includes('No rows found') ||
                               profileError.code === 'PGRST204' ||
                               !profileError.code

      if (isProfileNotFound) {
        return { isAdmin: false, error: 'Profile not found' }
      } else {
        return { isAdmin: false, error: 'Database error' }
      }
    }

    return { isAdmin: profile?.role === 'admin', user }
  } catch (error) {
    return { isAdmin: false, error: 'Unexpected error' }
  }
}

export async function GET(request: Request) {
  // Admin API routes are now publicly accessible - no authentication required
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    // First, get users with pagination and search
    let usersQuery = supabase.from("users").select("*")

    if (search) {
      usersQuery = usersQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error getting user count:", countError)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    usersQuery = usersQuery.range(from, to).order('updated_at', { ascending: false })

    const { data: usersData, error: usersError } = await usersQuery

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json(
        { error: "Failed to fetch users", details: usersError.message },
        { status: 500 }
      )
    }

    // Get profiles data for all users
    const userIds = usersData?.map(user => user.id) || []
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, role, approved, updated_at")
      .in('id', userIds)

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError)
    }

    // Create a map of profiles by id
    const profilesMap = (profilesData || []).reduce((acc: Record<string, any>, profile: any) => {
      acc[profile.id] = profile
      return acc
    }, {})

    // Apply role and status filters
    let filteredUsers = usersData || []

    if (role && role !== 'all') {
      filteredUsers = filteredUsers.filter(user => profilesMap[user.id]?.role === role)
    }

    if (status === 'approved') {
      filteredUsers = filteredUsers.filter(user => profilesMap[user.id]?.approved === true)
    } else if (status === 'pending') {
      filteredUsers = filteredUsers.filter(user => profilesMap[user.id]?.approved === false)
    }

    // Enrich data with activity counts and map fields
    const enrichedData = await Promise.all(filteredUsers.map(async (user) => {
      // Count events created by this user
      const { count: eventsCreated } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      // Count events saved by this user
      const { count: eventsSaved } = await supabase
        .from('saved_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return {
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
        role: profilesMap[user.id]?.role || 'user',
        approved: profilesMap[user.id]?.approved || false,
        created_at: profilesMap[user.id]?.updated_at || user.updated_at,
        updated_at: user.updated_at,
        events_created: eventsCreated || 0,
        events_saved: eventsSaved || 0
      };
    }));

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
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
