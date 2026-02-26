"use client"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import StatCard from "../components/StatCard"
import RecentActivity from "../components/RecentActivity"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { getUserFriendlyError } from "@/lib/userMessages"

interface DashboardData {
  stats: {
    totalUsers: number
    totalEvents: number
    totalCategories: number
    approvedEvents: number
    recentUsers: number
    recentEvents: number
  }
  recentActivities: any[]
  categoryStats: Record<string, number>
  roleStats: Record<string, number>
  monthlyStats: Record<string, number>
  trends: {
    userGrowth: number[]
    eventActivity: number
  }
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const fetchDashboardData = async () => {
    try {
      setError(null)
      const response = await fetch("/api/admin/dashboard")
      const data = await response.json()
      if (response.ok) {
        setDashboardData(data.data)
      } else {
        const userMessage = getUserFriendlyError(data, "Unable to load dashboard. Please try again.")
        setError(userMessage)
        toast({
          title: "Error",
          description: userMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      const userMessage = getUserFriendlyError(error, "Unable to connect. Please check your internet connection.")
      setError(userMessage)
      toast({
        title: "Error",
        description: userMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    // Set up real-time subscriptions for dashboard updates
    const profilesChannel = supabase
      .channel('profiles_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchDashboardData()
      })
      .subscribe()
    const eventsChannel = supabase
      .channel('events_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchDashboardData()
      })
      .subscribe()
    const categoriesChannel = supabase
      .channel('categories_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchDashboardData()
      })
      .subscribe()
    const activitiesChannel = supabase
      .channel('activities_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => {
        fetchDashboardData()
      })
      .subscribe()
    const interval = setInterval(fetchDashboardData, 60000)
    return () => {
      profilesChannel.unsubscribe()
      eventsChannel.unsubscribe()
      categoriesChannel.unsubscribe()
      activitiesChannel.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: current > 0 }
    const change = ((current - previous) / previous) * 100
    return { value: Math.round(change), isPositive: change >= 0 }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats loading */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
        {/* Activity loading */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={fetchDashboardData}>Try Again</Button>
      </div>
    )
  }

  const { stats, recentActivities, trends, categoryStats, roleStats } = dashboardData

  // Calculate trends
  const userTrend = calculateTrend(stats.recentUsers, trends.userGrowth[0] || 0)
  const eventTrend = calculateTrend(stats.recentEvents, trends.eventActivity)

  const statCards = [
    {
      title: "Total Users",
      count: stats.totalUsers,
      subtitle: `${stats.recentUsers} new this week`,
      trend: userTrend.value !== 0 ? { value: userTrend.value, label: "vs last week", isPositive: userTrend.isPositive } : undefined,
      icon: <span className="text-2xl">👥</span>
    },
    {
      title: "Total Events",
      count: stats.totalEvents,
      subtitle: `${stats.approvedEvents} total`,
      trend: eventTrend.value !== 0 ? { value: eventTrend.value, label: "this week", isPositive: eventTrend.isPositive } : undefined,
      icon: <span className="text-2xl">📅</span>
    },
    {
      title: "Categories",
      count: stats.totalCategories,
      subtitle: `${Object.keys(categoryStats).length} active`,
      icon: <span className="text-2xl">🏷️</span>
    },
    {
      title: "User Roles",
      count: Object.keys(roleStats).length,
      subtitle: `${roleStats.admin || 0} admins, ${roleStats.user || 0} users` + (roleStats.moderator ? `, ${roleStats.moderator} moderators` : ""),
      icon: <span className="text-2xl">👑</span>
    },
    {
      title: "System Health",
      count: "Online",
      subtitle: "All services running",
      icon: <span className="text-2xl">✅</span>
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header with quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base sm:text-base lg:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor your event platform's performance</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="outline"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/events')}
          >
            View Events
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/users')}
          >
            View Users
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            count={card.count}
            subtitle={card.subtitle}
            trend={card.trend}
            icon={card.icon}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <RecentActivity activities={recentActivities} loading={loading} />

        {/* Quick Stats Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Most Popular Category</span>
              <span className="font-medium">
                {Object.entries(categoryStats).length > 0
                  ? Object.entries(categoryStats).reduce((a, b) => categoryStats[a[0]] > categoryStats[b[0]] ? a : b)[0]
                  : "None"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Events This Week</span>
              <span className="font-medium">{stats.recentEvents}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Users This Week</span>
              <span className="font-medium">{stats.recentUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Categories</span>
              <span className="font-medium">{stats.totalCategories}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
