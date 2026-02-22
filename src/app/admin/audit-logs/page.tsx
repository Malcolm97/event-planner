"use client"
import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { formatAuditAction, getAuditActionIcon, AuditAction } from "@/lib/auditLogger"
import { 
  ChevronLeft, 
  ChevronRight,
  Filter,
  User,
  Calendar,
  RefreshCw
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface AuditLog {
  id: string
  user_id?: string
  user_name?: string
  action: AuditAction
  entity_type?: string
  entity_id?: string
  entity_name?: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  ip_address?: string
  created_at: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

const actionOptions = [
  { value: 'all', label: 'All Actions' },
  { value: 'user.role_changed', label: 'Role Changes' },
  { value: 'user.approved', label: 'User Approvals' },
  { value: 'user.rejected', label: 'User Rejections' },
  { value: 'user.deleted', label: 'User Deletions' },
  { value: 'event.approved', label: 'Event Approvals' },
  { value: 'event.rejected', label: 'Event Rejections' },
  { value: 'event.featured', label: 'Event Featured' },
  { value: 'event.unfeatured', label: 'Event Unfeatured' },
  { value: 'event.deleted', label: 'Event Deletions' },
  { value: 'bulk_action.performed', label: 'Bulk Actions' },
]

const entityTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'user', label: 'Users' },
  { value: 'event', label: 'Events' },
  { value: 'category', label: 'Categories' },
  { value: 'location', label: 'Locations' },
  { value: 'settings', label: 'Settings' },
]

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [actionFilter, setActionFilter] = useState("all")
  const [entityTypeFilter, setEntityTypeFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const { toast } = useToast()

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30',
        action: actionFilter,
        entityType: entityTypeFilter,
        startDate,
        endDate,
      })

      const response = await fetch(`/api/admin/audit-logs?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setLogs(data.data || [])
        setPagination(data.pagination)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch audit logs",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [actionFilter, entityTypeFilter, startDate, endDate, toast])

  const handleFilter = () => {
    fetchLogs(1)
  }

  const handlePageChange = (page: number) => {
    fetchLogs(page)
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const renderValueChange = (log: AuditLog) => {
    if (!log.old_values && !log.new_values) return null

    return (
      <div className="mt-2 text-xs space-y-1">
        {log.old_values && Object.keys(log.old_values).length > 0 && (
          <div className="text-red-600">
            Previous: {JSON.stringify(log.old_values)}
          </div>
        )}
        {log.new_values && Object.keys(log.new_values).length > 0 && (
          <div className="text-green-600">
            New: {JSON.stringify(log.new_values)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg lg:text-xl font-bold text-gray-900">Audit Logs</h2>
        <div className="mt-2 sm:mt-0 text-sm text-gray-600">
          {pagination ? `${pagination.total} log${pagination.total !== 1 ? 's' : ''} total` : 'Loading...'}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              {actionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Entity Type</label>
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              {entityTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
          <div className="flex items-end space-x-2">
            <Button onClick={handleFilter} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              Apply
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchLogs(pagination?.page || 1)}
              title="Refresh"
            >
              <RefreshCw size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No audit logs found</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">
                      {getAuditActionIcon(log.action)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {formatAuditAction(log.action)}
                        </span>
                        {log.entity_name && (
                          <span className="text-gray-600">
                            - {log.entity_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User size={14} />
                          <span>{log.user_name || 'System'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                        </div>
                        {log.entity_type && (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            {log.entity_type}
                          </span>
                        )}
                      </div>
                      {selectedLog?.id === log.id && renderValueChange(log)}
                    </div>
                  </div>
                  {log.ip_address && (
                    <span className="text-xs text-gray-400 hidden sm:block">
                      IP: {log.ip_address}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
    </div>
  )
}