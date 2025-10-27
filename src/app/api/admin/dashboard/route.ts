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

export async function GET() {
  // Check admin access for all admin API routes
  const { isAdmin, error } = await checkAdminAccess()

  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required', details: error },
      { status: 403 }
    )
  }
  try {
    // Get comprehensive dashboard statistics
    const [
      usersResult,
      eventsResult,
      categoriesResult,
      pendingEventsResult,
      recentUsersResult,
      recentEventsResult,
      recentActivitiesResult,
      approvedEventsResult,
      userActivityResult
    ] = await Promise.all([
      // Total users
      supabase.from("profiles").select("*", { count: "exact", head: true }),

      // Total events
      supabase.from("events").select("*", { count: "exact", head: true }),

      // Total categories
      supabase.from("categories").select("*", { count: "exact", head: true }),

      // Pending approvals (unapproved events)
      supabase.from("events").select("*", { count: "exact", head: true }).eq("approved", false),

      // Recent users (last 7 days)
      supabase.from("profiles").select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

      // Recent events (last 7 days)
      supabase.from("events").select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

      // Recent activities (last 10 activities)
      supabase.from("activities").select(`
        id,
        activity_type,
        description,
        metadata,
        event_id,
        event_name,
        created_at,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `).order("created_at", { ascending: false }).limit(10),

      // Approved events count
      supabase.from("events").select("*", { count: "exact", head: true }).eq("approved", true),

      // User activity stats (last 30 days)
      supabase.from("activities").select("activity_type", { count: "exact" })
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    ])

    // Get events by category
    const { data: eventsByCategory } = await supabase
      .from("events")
      .select("categories(name)")
      .eq("approved", true)

    // Calculate category popularity
    const categoryStats = eventsByCategory?.reduce((acc: Record<string, number>, event: any) => {
      const categoryName = event.categories?.name || "Uncategorized"
      acc[categoryName] = (acc[categoryName] || 0) + 1
      return acc
    }, {}) || {}

    // Get user roles distribution
    const { data: userRoles } = await supabase
      .from("profiles")
      .select("role")

    const roleStats = userRoles?.reduce((acc: Record<string, number>, user: any) => {
      acc[user.role || "user"] = (acc[user.role || "user"] || 0) + 1
      return acc
    }, {}) || {}

    // Get monthly user registrations (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: monthlyUsers } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", sixMonthsAgo.toISOString())
      .order("created_at")

    const monthlyStats = monthlyUsers?.reduce((acc: Record<string, number>, user: any) => {
      const month = new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {}) || {}

    const dashboardData = {
      stats: {
        totalUsers: usersResult.count || 0,
        totalEvents: eventsResult.count || 0,
        totalCategories: categoriesResult.count || 0,
        pendingApprovals: pendingEventsResult.count || 0,
        approvedEvents: approvedEventsResult.count || 0,
        recentUsers: recentUsersResult.count || 0,
        recentEvents: recentEventsResult.count || 0,
      },
      recentActivities: recentActivitiesResult?.data || [],
      categoryStats,
      roleStats,
      monthlyStats,
      trends: {
        userGrowth: Object.values(monthlyStats).slice(-2),
        eventActivity: recentEventsResult.count || 0,
        approvalRate: approvedEventsResult.count && eventsResult.count
          ? Math.round((approvedEventsResult.count / eventsResult.count) * 100)
          : 0
      }
    }

    return NextResponse.json({ data: dashboardData })
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}
