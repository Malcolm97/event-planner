"use client"
import { useState } from "react"
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react"

interface ExportButtonProps {
  type: 'users' | 'events'
  filters?: Record<string, string>
  disabled?: boolean
}

export default function ExportButton({ type, filters = {}, disabled = false }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const handleExport = async (format: 'csv' | 'json') => {
    setLoading(true)
    setShowDropdown(false)
    
    try {
      const params = new URLSearchParams({ format, ...filters })
      const response = await fetch(`/api/admin/export/${type}?${params}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get the blob from response
      const blob = await response.blob()
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : `${type}-export.${format}`

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={disabled || loading}
        className="inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        <span>Export</span>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-20 border border-gray-200">
            <button
              onClick={() => handleExport('csv')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
            >
              <FileSpreadsheet size={16} className="text-green-600" />
              <span>Export as CSV</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
            >
              <FileJson size={16} className="text-blue-600" />
              <span>Export as JSON</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}