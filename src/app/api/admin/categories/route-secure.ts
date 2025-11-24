import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { withAdminAuth, createAdminResponse } from "@/lib/admin-auth"

async function categoriesHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const search = searchParams.get('search')

  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })

  if (countError) {
    console.error("Error getting categories count:", countError)
    return createAdminResponse(
      { error: "Failed to fetch categories", details: countError.message },
      { status: 500 }
    )
  }

  // Get categories with pagination and search
  let categoriesQuery = supabase.from("categories").select("*")

  if (search) {
    categoriesQuery = categoriesQuery.ilike('name', `%${search}%`)
  }

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  categoriesQuery = categoriesQuery.range(from, to).order('created_at', { ascending: false })

  const { data: categoriesData, error: categoriesError } = await categoriesQuery

  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError)
    return createAdminResponse(
      { error: "Failed to fetch categories", details: categoriesError.message },
      { status: 500 }
    )
  }

  return createAdminResponse({
    data: categoriesData || [],
    pagination: {
      page,
      limit,
      total: totalCount || 0,
      totalPages: Math.ceil((totalCount || 0) / limit)
    }
  })
}

// Export the wrapped handler
export const GET = withAdminAuth(categoriesHandler)
