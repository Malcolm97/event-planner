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
  // Check admin access for all admin API routes
  const { isAdmin, error } = await checkAdminAccess()

  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required', details: error },
      { status: 403 }
    )
  }
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    let query = supabase
      .from("profiles")
      .select("*")

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    if (status === 'approved') {
      query = query.eq('approved', true)
    } else if (status === 'pending') {
      query = query.eq('approved', false)
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error getting user count:", countError)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to).order('updated_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json(
        { error: "Failed to fetch users", details: error.message },
        { status: 500 }
      )
    }

    // Enrich data with activity counts
    const enrichedData = data?.map(user => ({
      ...user,
      events_created: 0, // TODO: Calculate this separately if needed
      events_saved: 0 // TODO: Calculate this separately if needed
    })) || []

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
