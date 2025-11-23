"use client"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

interface Location {
  id: string
  name: string
  description?: string
  total_events?: number
  approved_events?: number
  pending_events?: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function LocationsContent() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const fetchLocations = async (page = 1, retryCount = 0) => {
    try {
      setError(null)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        search: searchTerm
      })

      // Add cache busting for real-time updates
      params.append('_t', Date.now().toString())

      const response = await fetch(`/api/admin/locations?${params}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 500 && retryCount < 2) {
          // Retry on server errors up to 2 times
          console.log(`Retrying locations fetch (attempt ${retryCount + 1})...`)
          setTimeout(() => fetchLocations(page, retryCount + 1), 1000 * (retryCount + 1))
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setLocations(data.data || [])
      setPagination(data.pagination)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch locations"

      // Only show error toast if this isn't a retry attempt
      if (retryCount === 0) {
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }

      console.error("Locations fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setLoading(true)
    fetchLocations(1)
  }

  const handlePageChange = (page: number) => {
    setLoading(true)
    fetchLocations(page)
  }

  useEffect(() => {
    fetchLocations()

    // Set up realtime subscription for locations table
    const channel = supabase
      .channel('locations_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'locations' },
        (payload) => {
          console.log('Locations change detected:', payload)
          // Refresh data when changes occur
          fetchLocations()
        }
      )
      .subscribe()

    // Auto-refresh every 30 seconds as fallback
    const interval = setInterval(fetchLocations, 30000)

    return () => {
      channel.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return <div className="text-center py-8">Loading locations...</div>
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg lg:text-xl font-bold text-gray-900">Location Management</h2>
        <div className="mt-2 sm:mt-0 text-sm text-gray-600">
          {pagination ? `${pagination.total} location${pagination.total !== 1 ? 's' : ''} total` : `${locations.length} location${locations.length !== 1 ? 's' : ''} total`}
        </div>
      </div>

      {/* Search Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleSearch} className="w-full md:w-auto">
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Mobile card view for very small screens */}
        <div className="block md:hidden">
          {locations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No locations found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {locations.map((location) => (
                <div key={location.id} className="p-4">
                  <div className="font-medium text-gray-900">
                    {location.name}
                  </div>
                  {location.description && (
                    <div className="text-sm text-gray-500 mt-1">
                      {location.description}
                    </div>
                  )}
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
                  Name
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Events
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approved
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locations.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50">
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {location.name}
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {location.description || "No description"}
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {location.total_events || 0}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {location.approved_events || 0}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {location.pending_events || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {locations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No locations found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
