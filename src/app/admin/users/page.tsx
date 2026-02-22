"use client"
import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { getUserFriendlyError } from "@/lib/userMessages"
import { 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Trash2, 
  Shield, 
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react"
import ExportButton from "../components/ExportButton"

interface User {
  id: string
  full_name?: string
  email?: string
  avatar_url?: string
  role: string
  approved: boolean
  created_at: string
  events_created?: number
  events_saved?: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null)
  const { toast } = useToast()

  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setError(null)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: searchTerm,
        role: roleFilter,
        status: statusFilter
      })

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()
      if (response.ok) {
        setUsers(data.data || [])
        setPagination(data.pagination)
      } else {
        const userMessage = getUserFriendlyError(data, "Unable to load users. Please try again.")
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
  }, [searchTerm, roleFilter, statusFilter, toast])

  const handleSearch = () => {
    setLoading(true)
    fetchUsers(1)
  }

  const handlePageChange = (page: number) => {
    setLoading(true)
    fetchUsers(page)
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: `User role updated to ${newRole}`,
        })
        fetchUsers(pagination?.page || 1)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update role",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
      setActionMenuOpen(null)
    }
  }

  const handleApprovalChange = async (userId: string, approved: boolean) => {
    setActionLoading(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved })
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: approved ? "User approved" : "User approval revoked",
        })
        fetchUsers(pagination?.page || 1)
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
      setActionMenuOpen(null)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return
    
    setActionLoading(deleteConfirm.id)
    try {
      const response = await fetch(`/api/admin/users/${deleteConfirm.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        fetchUsers(pagination?.page || 1)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete user",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
      setDeleteConfirm(null)
    }
  }

  useEffect(() => {
    fetchUsers()

    // Set up realtime subscription
    const channel = supabase
      .channel('profiles_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchUsers(pagination?.page || 1)
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionMenuOpen(null)
    if (actionMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [actionMenuOpen])

  if (loading && users.length === 0) {
    return <div className="text-center py-8">Loading users...</div>
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg lg:text-xl font-bold text-gray-900">User Management</h2>
        <div className="mt-2 sm:mt-0 flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {pagination ? `${pagination.total} user${pagination.total !== 1 ? 's' : ''} total` : `${users.length} user${users.length !== 1 ? 's' : ''} total`}
          </div>
          <ExportButton 
            type="users" 
            filters={{ role: roleFilter, status: statusFilter }}
            disabled={loading || users.length === 0}
          />
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
            </select>
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
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.full_name || "No name"}
                        </div>
                        <div className="text-xs text-gray-500">{user.email || "No email"}</div>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)
                        }}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {actionMenuOpen === user.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border">
                          <button
                            onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin')}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                            disabled={actionLoading === user.id}
                          >
                            <Shield size={16} />
                            <span>{user.role === 'admin' ? 'Make User' : 'Make Admin'}</span>
                          </button>
                          <button
                            onClick={() => handleApprovalChange(user.id, !user.approved)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                            disabled={actionLoading === user.id}
                          >
                            {user.approved ? <UserX size={16} /> : <UserCheck size={16} />}
                            <span>{user.approved ? 'Revoke Approval' : 'Approve User'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirm(user)
                              setActionMenuOpen(null)
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 text-red-600"
                            disabled={actionLoading === user.id}
                          >
                            <Trash2 size={16} />
                            <span>Delete User</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'moderator'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.approved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.approved ? 'Approved' : 'Pending'}
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
                  User
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user.full_name || "No name"}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {user.email || "No email"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={actionLoading === user.id}
                      className={`text-xs font-semibold rounded-full px-3 py-1 border-0 cursor-pointer ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'moderator'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                    </select>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleApprovalChange(user.id, !user.approved)}
                      disabled={actionLoading === user.id}
                      className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                        user.approved
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      }`}
                    >
                      {user.approved ? (
                        <>
                          <UserCheck size={12} />
                          <span>Approved</span>
                        </>
                      ) : (
                        <>
                          <UserX size={12} />
                          <span>Pending</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-4">
                      <span title="Events created">📝 {user.events_created || 0}</span>
                      <span title="Events saved">❤️ {user.events_saved || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => setDeleteConfirm(user)}
                      disabled={actionLoading === user.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      title="Delete user"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found
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
              <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.full_name || "this user"}</strong>? 
              This action cannot be undone.
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
                onClick={handleDeleteUser}
                disabled={actionLoading === deleteConfirm.id}
              >
                {actionLoading === deleteConfirm.id ? "Deleting..." : "Delete User"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}