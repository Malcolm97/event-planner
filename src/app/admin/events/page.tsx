"use client"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

interface Event {
  id: string
  title: string
  description?: string
  category_id?: string
  date: string
  location?: string
  image_url?: string
  created_by: string
  approved: boolean
  created_at: string
  creator_name?: string
  creator_avatar?: string
  category_name?: string
  saved_count?: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const { toast } = useToast()

  const fetchEvents = async (page = 1) => {
    try {
      setError(null)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        search: searchTerm,
        status: statusFilter,
        category: categoryFilter
      })

      const response = await fetch(`/api/admin/events?${params}`)
      const data = await response.json()
      if (response.ok) {
        setEvents(data.data || [])
        setPagination(data.pagination)
      } else {
        setError("Failed to fetch events")
        toast({
          title: "Error",
          description: "Failed to fetch events",
          variant: "destructive",
        })
      }
    } catch (error) {
      setError("Network error occurred")
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setLoading(true)
    fetchEvents(1)
  }

  const handlePageChange = (page: number) => {
    setLoading(true)
    fetchEvents(page)
  }

  useEffect(() => {
    fetchEvents()

    // Set up realtime subscription for events table
    const channel = supabase
      .channel('events_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          console.log('Events change detected:', payload)
          // Refresh data when changes occur
          fetchEvents()
        }
      )
      .subscribe()

    // Auto-refresh every 30 seconds as fallback
    const interval = setInterval(fetchEvents, 30000)

    return () => {
      channel.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const handleApprove = async (eventId: string) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Event approved successfully",
        })
        fetchEvents() // Refresh the list
      } else {
        toast({
          title: "Error",
          description: "Failed to approve event",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve event",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Event deleted successfully",
        })
        fetchEvents() // Refresh the list
      } else {
        toast({
          title: "Error",
          description: "Failed to delete event",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading events...</div>
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg lg:text-xl font-bold text-gray-900">Event Management</h2>
        <div className="mt-2 sm:mt-0 text-sm text-gray-600">
          {pagination ? `${pagination.total} event${pagination.total !== 1 ? 's' : ''} total` : `${events.length} event${events.length !== 1 ? 's' : ''} total`}
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {/* TODO: Load categories dynamically */}
            </select>
          </div>
          <div>
            <Button onClick={handleSearch} className="w-full">
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Mobile card view for very small screens */}
        <div className="block md:hidden">
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No events found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {events.map((event) => (
                <div key={event.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {event.title}
                      </div>
                      {event.description && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {event.description}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-2">
                      {!event.approved && (
                        <Button
                          onClick={() => handleApprove(event.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDelete(event.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50 text-xs px-2 py-1"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-3">
                      <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                      {event.location && <span>📍 {event.location}</span>}
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      event.approved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-4 lg:px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 max-w-xs">
                      {event.title}
                    </div>
                    {event.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs mt-1">
                        {event.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(event.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.location || "N/A"}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      event.approved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {!event.approved && (
                        <Button
                          onClick={() => handleApprove(event.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white min-w-[80px]"
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDelete(event.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50 min-w-[70px]"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {events.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No events found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
