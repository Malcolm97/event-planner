import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { withAdminAuth, createAdminResponse } from "@/lib/admin-auth"

async function locationsHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const search = searchParams.get('search')

  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })

  if (countError) {
    console.error("Error getting locations count:", countError)
    return createAdminResponse(
      { error: "Failed to fetch locations", details: countError.message },
      { status: 500 }
    )
  }

  // Get locations with pagination and search
  let locationsQuery = supabase.from("locations").select("*")

  if (search) {
    locationsQuery = locationsQuery.ilike('name', `%${search}%`)
  }

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  locationsQuery = locationsQuery.range(from, to).order('created_at', { ascending: false })

  const { data: locationsData, error: locationsError } = await locationsQuery

  if (locationsError) {
    console.error("Error fetching locations:", locationsError)
    return createAdminResponse(
      { error: "Failed to fetch locations", details: locationsError.message },
      { status: 500 }
    )
  }

  return createAdminResponse({
    data: locationsData || [],
    pagination: {
      page,
      limit,
      total: totalCount || 0,
      totalPages: Math.ceil((totalCount || 0) / limit)
    }
  })
}

// Export the wrapped handler
export const GET = withAdminAuth(locationsHandler)
