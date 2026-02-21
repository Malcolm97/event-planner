import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { withAdminAuth, createAdminResponse } from "@/lib/admin-auth"

async function dashboardHandler(request: NextRequest) {
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
      .gte("updated_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

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
    .select("updated_at")
    .gte("updated_at", sixMonthsAgo.toISOString())
    .order("updated_at")

  const monthlyStats = monthlyUsers?.reduce((acc: Record<string, number>, user: any) => {
    const month = new Date(user.updated_at).toLocaleDateString('en-US', {
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

  return createAdminResponse({ data: dashboardData })
}

// Export the wrapped handler
export const GET = withAdminAuth(dashboardHandler)
