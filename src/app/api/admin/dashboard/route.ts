import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import {
  checkRateLimit,
  createSecureResponse,
  logSecurityEvent,
  isSuspiciousRequest
} from "@/lib/security"

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
  // Check admin access
  const adminCheck = await checkAdminAccess();
  if (!adminCheck.isAdmin) {
    logSecurityEvent('unauthorized_admin_access_attempt', {
      path: '/api/admin/dashboard',
      method: 'GET',
    }, request as any);

    return createSecureResponse(
      { error: adminCheck.error || 'Admin access required' },
      { status: 403 }
    );
  }

  // Log successful admin access
  logSecurityEvent('admin_access_granted', {
    path: '/api/admin/dashboard',
    method: 'GET',
    userId: adminCheck.user?.id
  }, request as any);

  try {
    // Get comprehensive dashboard statistics with optimized queries
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      usersCountResult,
      eventsCountResult,
      categoriesCountResult,
      pendingEventsResult,
      recentUsersResult,
      recentEventsResult,
      recentActivitiesResult,
      approvedEventsResult,
      userActivityResult,
      eventsByCategoryResult,
      userRolesResult,
      monthlyUsersResult
    ] = await Promise.all([
      // Total users count
      supabase.from("users").select("id", { count: "exact", head: true }),

      // Total events count
      supabase.from("events").select("id", { count: "exact", head: true }),

      // Total categories count
      supabase.from("categories").select("name", { count: "exact", head: true }),

      // Pending approvals (unapproved events)
      supabase.from("events").select("id", { count: "exact", head: true }).eq("featured", false),

      // Recent users (last 7 days)
      supabase.from("users").select("id", { count: "exact", head: true }).gte("updated_at", sevenDaysAgo),

      // Recent events (last 7 days)
      supabase.from("events").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),

      // Recent activities (last 10 activities)
      supabase.from("activities").select(`
        id,
        activity_type,
        description,
        metadata,
        event_id,
        event_name,
        created_at,
        user_id
      `).order("created_at", { ascending: false }).limit(10),

      // Approved events count
      supabase.from("events").select("id", { count: "exact", head: true }).eq("featured", true),

      // User activity stats (last 30 days) - using batch count
      supabase.from("activities").select("activity_type", { count: "exact" }).gte("created_at", thirtyDaysAgo),

      // Get events by category for stats
      supabase.from("events").select("category, id"),

      // Get user role distribution (sample data)
      supabase.from("users").select("id"),

      // Get monthly user registrations (last 6 months)
      supabase.from("users").select("updated_at").gte("updated_at", new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
    ])

    // Calculate category popularity from fetched data
    const categoryStats: Record<string, number> = {};
    if (eventsByCategoryResult.data) {
      eventsByCategoryResult.data.forEach((event: any) => {
        const categoryName = event.category || "Uncategorized";
        categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
      });
    }

    // Calculate role distribution (simplified)
    const roleStats: Record<string, number> = {
      admin: 0,
      user: userRolesResult.count || 0
    };

    // Calculate monthly stats from user data
    const monthlyStats: Record<string, number> = {};
    if (monthlyUsersResult.data) {
      monthlyUsersResult.data.forEach((user: any) => {
        const month = new Date(user.updated_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short'
        });
        monthlyStats[month] = (monthlyStats[month] || 0) + 1;
      });
    }

    const dashboardData = {
      stats: {
        totalUsers: usersCountResult.count || 0,
        totalEvents: eventsCountResult.count || 0,
        totalCategories: categoriesCountResult.count || 0,
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
        approvalRate: approvedEventsResult.count && eventsCountResult.count
          ? Math.round((approvedEventsResult.count / eventsCountResult.count) * 100)
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
