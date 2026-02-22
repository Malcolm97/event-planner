"use client"
import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { 
  Check, 
  X, 
  Trash2, 
  Star,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X as CloseIcon,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import ExportButton from "../components/ExportButton"

interface Event {
  id: string
  name: string
  description?: string
  category?: string
  date: string
  end_date?: string
  location?: string
  venue?: string
  image_url?: string
  image_urls?: string[]
  created_by?: string
  approved: boolean
  featured: boolean
  created_at: string
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
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Event | null>(null)
  const { toast } = useToast()

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await supabase
          .from('categories')
          .select('id, name')
          .order('name')

        if (data) {
          setCategories(data)
        }
      } catch (err) {
        console.error('Failed to load categories:', err)
      }
    }

    loadCategories()
  }, [])

  const fetchEvents = useCallback(async (page = 1) => {
    try {
      setError(null)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
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
  }, [searchTerm, statusFilter, categoryFilter, toast])

  const handleSearch = () => {
    setLoading(true)
    fetchEvents(1)
  }

  const handlePageChange = (page: number) => {
    setLoading(true)
    fetchEvents(page)
  }

  const handleApprovalChange = async (eventId: string, approved: boolean) => {
    setActionLoading(eventId)
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved })
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: approved ? "Event approved" : "Event approval revoked",
        })
        fetchEvents(pagination?.page || 1)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update approval",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update approval",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleFeatureChange = async (eventId: string, featured: boolean) => {
    setActionLoading(eventId)
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured })
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: featured ? "Event featured" : "Event unfeatured",
        })
        fetchEvents(pagination?.page || 1)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update feature status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update feature status",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteEvent = async () => {
    if (!deleteConfirm) return
    
    setActionLoading(deleteConfirm.id)
    try {
      const response = await fetch(`/api/admin/events/${deleteConfirm.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: "Event deleted successfully",
        })
        fetchEvents(pagination?.page || 1)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete event",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
      setDeleteConfirm(null)
    }
  }

  useEffect(() => {
    fetchEvents()

    // Set up realtime subscription for events table
    const channel = supabase
      .channel('events_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => fetchEvents(pagination?.page || 1)
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  if (loading && events.length === 0) {
    return <div className="text-center py-8">Loading events...</div>
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg lg:text-xl font-bold text-gray-900">Event Management</h2>
        <div className="mt-2 sm:mt-0 flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {pagination ? `${pagination.total} event${pagination.total !== 1 ? 's' : ''} total` : `${events.length} event${events.length !== 1 ? 's' : ''} total`}
          </div>
          <ExportButton 
            type="events" 
            filters={{ status: statusFilter, category: categoryFilter }}
            disabled={loading || events.length === 0}
          />
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
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="featured">Featured</option>
            </select>
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Button onClick={handleSearch} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Mobile card view */}
        <div className="block md:hidden">
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No events found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {events.map((event) => (
                <div key={event.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 truncate">
                          {event.name}
                        </span>
                        {event.featured && (
                          <Star size={16} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      {event.description && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {event.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar size={12} />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin size={12} />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApprovalChange(event.id, !event.approved)}
                        disabled={actionLoading === event.id}
                        className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                          event.approved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {event.approved ? <Check size={12} /> : <X size={12} />}
                        <span>{event.approved ? 'Approved' : 'Pending'}</span>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleFeatureChange(event.id, !event.featured)}
                        disabled={actionLoading === event.id}
                        className={`p-1.5 rounded-md transition-colors ${
                          event.featured
                            ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={event.featured ? 'Unfeature' : 'Feature'}
                      >
                        <Star size={16} className={event.featured ? 'fill-yellow-500' : ''} />
                      </button>
                      <Link
                        href={`/events/${event.id}`}
                        target="_blank"
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md"
                        title="View event"
                      >
                        <ExternalLink size={16} />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm(event)}
                        disabled={actionLoading === event.id}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
                  Event
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
                  Featured
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                        {event.image_url || (event.image_urls && event.image_urls[0]) ? (
                          <img 
                            src={event.image_url || event.image_urls?.[0]} 
                            alt="" 
                            className="w-12 h-12 object-cover" 
                          />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {event.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {event.category || "No category"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} className="text-gray-400" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-1 max-w-[150px]">
                      <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{event.location || "N/A"}</span>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleApprovalChange(event.id, !event.approved)}
                      disabled={actionLoading === event.id}
                      className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                        event.approved
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      }`}
                    >
                      {event.approved ? (
                        <>
                          <Check size={12} />
                          <span>Approved</span>
                        </>
                      ) : (
                        <>
                          <X size={12} />
                          <span>Pending</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleFeatureChange(event.id, !event.featured)}
                      disabled={actionLoading === event.id}
                      className={`p-2 rounded-md transition-colors ${
                        event.featured
                          ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={event.featured ? 'Click to unfeature' : 'Click to feature'}
                    >
                      <Star size={18} className={event.featured ? 'fill-yellow-500' : ''} />
                    </button>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Link
                        href={`/events/${event.id}`}
                        target="_blank"
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        title="View event"
                      >
                        <ExternalLink size={18} />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm(event)}
                        disabled={actionLoading === event.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                        title="Delete event"
                      >
                        <Trash2 size={18} />
                      </button>
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft size={16} />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Event</h3>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <CloseIcon size={20} />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? 
              This action cannot be undone and will remove all saved references to this event.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleDeleteEvent}
                disabled={actionLoading === deleteConfirm.id}
              >
                {actionLoading === deleteConfirm.id ? "Deleting..." : "Delete Event"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}