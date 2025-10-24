"use client"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

interface Category {
  id: string
  name: string
  description?: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchCategories = async () => {
    try {
      setError(null)
      const response = await fetch("/api/admin/categories")
      const data = await response.json()
      if (response.ok) {
        setCategories(data.data || [])
      } else {
        setError("Failed to fetch categories")
        toast({
          title: "Error",
          description: "Failed to fetch categories",
          variant: "destructive",
        })
      }
    } catch (error) {
      setError("Network error occurred")
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()

    // Set up realtime subscription for categories table
    const channel = supabase
      .channel('categories_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          console.log('Categories change detected:', payload)
          // Refresh data when changes occur
          fetchCategories()
        }
      )
      .subscribe()

    // Auto-refresh every 30 seconds as fallback
    const interval = setInterval(fetchCategories, 30000)

    return () => {
      channel.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Category deleted successfully",
        })
        fetchCategories() // Refresh the list
      } else {
        toast({
          title: "Error",
          description: "Failed to delete category",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading categories...</div>
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg lg:text-xl font-bold text-gray-900">Category Management</h2>
        <div className="mt-2 sm:mt-0 text-sm text-gray-600">
          {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} total
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Mobile card view for very small screens */}
        <div className="block md:hidden">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No categories found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {categories.map((category) => (
                <div key={category.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {category.name}
                    </div>
                    {category.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {category.description}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleDelete(category.id)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50 ml-3"
                  >
                    Delete
                  </Button>
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {category.name}
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {category.description || "No description"}
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      onClick={() => handleDelete(category.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50 min-w-[70px]"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {categories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No categories found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
