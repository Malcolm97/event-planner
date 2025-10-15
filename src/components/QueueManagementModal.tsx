'use client';

import React, { useState, useEffect } from 'react';
import { getQueuedUploads, getUploadQueueStats, QueuedImageUpload } from '../lib/imageUpload';

interface QueueManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QueueManagementModal({ isOpen, onClose }: QueueManagementModalProps) {
  const [queueStats, setQueueStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  });
  const [queuedUploads, setQueuedUploads] = useState<QueuedImageUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'failed' | 'processing'>('all');

  useEffect(() => {
    if (isOpen) {
      loadQueueData();
    }
  }, [isOpen]);

  const loadQueueData = async () => {
    setLoading(true);
    try {
      const [stats, uploads] = await Promise.all([
        getUploadQueueStats(),
        getQueuedUploads()
      ]);
      setQueueStats(stats);
      setQueuedUploads(uploads);
    } catch (error) {
      console.error('Failed to load queue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUploads = queuedUploads.filter(upload => {
    if (filter === 'all') return true;
    return upload.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-blue-600 bg-blue-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Upload Queue Management</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Stats Overview */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{queueStats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{queueStats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{queueStats.processing}</div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{queueStats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', count: queueStats.total },
              { key: 'pending', label: 'Pending', count: queueStats.pending },
              { key: 'processing', label: 'Processing', count: queueStats.processing },
              { key: 'failed', label: 'Failed', count: queueStats.failed }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filter === key
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Queue Items */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading queue...</span>
            </div>
          ) : filteredUploads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {filter === 'all' ? 'No uploads in queue' : `No ${filter} uploads`}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUploads.map((upload) => (
                <div key={upload.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    {/* Thumbnail */}
                    {upload.thumbnailUrl && (
                      <img
                        src={upload.thumbnailUrl}
                        alt="thumbnail"
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    )}

                    {/* Upload Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {upload.file?.name || 'Unknown file'}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(upload.status)}`}>
                          {upload.status}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Size: {upload.file ? formatFileSize(upload.file.size) : 'Unknown'}</div>
                        <div>Event: {upload.eventId || 'Not specified'}</div>
                        <div>Queued: {new Date(upload.timestamp).toLocaleString()}</div>
                        {upload.retryCount && upload.retryCount > 0 && (
                          <div>Retries: {upload.retryCount}/3</div>
                        )}
                        {upload.error && (
                          <div className="text-red-600">Error: {upload.error}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Queue automatically processes when online
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadQueueData}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
            >
              Refresh
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
