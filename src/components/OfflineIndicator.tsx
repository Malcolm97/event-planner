'use client';

import React, { useState, useEffect } from 'react';
import { getUploadQueueStats, getQueuedUploads } from '../lib/imageUpload';
import QueueManagementModal from './QueueManagementModal';

interface OfflineIndicatorProps {
  className?: string;
}

export default function OfflineIndicator({ className = '' }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [queueStats, setQueueStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  });
  const [showDetails, setShowDetails] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [queuedUploads, setQueuedUploads] = useState<any[]>([]);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update queue stats periodically
    const updateStats = async () => {
      try {
        const stats = await getUploadQueueStats();
        setQueueStats(stats);
      } catch (error) {
        console.error('Failed to get queue stats:', error);
      }
    };

    updateStats();
    const statsInterval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(statsInterval);
    };
  }, []);

  const loadQueuedUploads = async () => {
    try {
      const uploads = await getQueuedUploads();
      setQueuedUploads(uploads.slice(0, 5)); // Show max 5
    } catch (error) {
      console.error('Failed to load queued uploads:', error);
    }
  };

  const handleShowDetails = () => {
    setShowDetails(!showDetails);
    if (!showDetails) {
      loadQueuedUploads();
    }
  };

  // Don't show anything if online and no queued uploads
  if (isOnline && queueStats.total === 0) {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-500 via-red-500 to-pink-500 text-white shadow-lg ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Online/Offline Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="font-medium">
                {isOnline ? 'Online' : 'Offline Mode'}
              </span>
            </div>

            {/* Queue Stats */}
            {queueStats.total > 0 && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>{queueStats.pending} pending uploads</span>
                </div>
                {queueStats.failed > 0 && (
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    <span>{queueStats.failed} failed</span>
                  </div>
                )}
                {queueStats.processing > 0 && (
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                    <span>{queueStats.processing} processing</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {queueStats.total > 0 && (
              <button
                onClick={handleShowDetails}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-sm font-medium transition-colors"
              >
                {showDetails ? 'Hide' : 'Details'}
              </button>
            )}
            {!isOnline && (
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-sm font-medium transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>

        {/* Detailed Queue Information */}
        {showDetails && queueStats.total > 0 && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Pending Uploads */}
              {queueStats.pending > 0 && (
                <div className="bg-white/10 rounded-lg p-3">
                  <h4 className="font-medium mb-2 flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    Pending Uploads ({queueStats.pending})
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {queuedUploads
                      .filter(upload => upload.status === 'pending')
                      .slice(0, 3)
                      .map((upload: any) => (
                        <div key={upload.id} className="flex items-center space-x-2 text-sm">
                          {upload.thumbnailUrl && (
                            <img
                              src={upload.thumbnailUrl}
                              alt="thumbnail"
                              className="w-8 h-8 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{upload.file?.name || 'Image'}</div>
                            <div className="text-xs opacity-75">
                              {new Date(upload.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Failed Uploads */}
              {queueStats.failed > 0 && (
                <div className="bg-white/10 rounded-lg p-3">
                  <h4 className="font-medium mb-2 flex items-center">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                    Failed Uploads ({queueStats.failed})
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {queuedUploads
                      .filter(upload => upload.status === 'failed')
                      .slice(0, 3)
                      .map((upload: any) => (
                        <div key={upload.id} className="flex items-center space-x-2 text-sm">
                          {upload.thumbnailUrl && (
                            <img
                              src={upload.thumbnailUrl}
                              alt="thumbnail"
                              className="w-8 h-8 object-cover rounded opacity-50"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{upload.file?.name || 'Image'}</div>
                            <div className="text-xs opacity-75 text-red-200">
                              {upload.error || 'Upload failed'}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Processing Uploads */}
              {queueStats.processing > 0 && (
                <div className="bg-white/10 rounded-lg p-3">
                  <h4 className="font-medium mb-2 flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
                    Processing ({queueStats.processing})
                  </h4>
                  <div className="text-sm text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                    Uploading images...
                  </div>
                </div>
              )}
            </div>

            {/* Queue Summary */}
            <div className="mt-3 flex justify-between items-center text-sm">
              <span>Total queued: {queueStats.total}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowQueueModal(true)}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
                >
                  Manage Queue
                </button>
                <span className="text-xs opacity-75">
                  Images will upload automatically when online
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Offline-specific messaging */}
        {!isOnline && (
          <div className="mt-2 text-sm opacity-90">
            <div className="flex items-center space-x-4">
              <span>✨ Browse cached events and creators</span>
              <span>📝 Create events (saved for later)</span>
              <span>🖼️ Upload images (queued automatically)</span>
            </div>
          </div>
        )}
      </div>

      {/* Queue Management Modal */}
      <QueueManagementModal
        isOpen={showQueueModal}
        onClose={() => setShowQueueModal(false)}
      />
    </div>
  );
}
