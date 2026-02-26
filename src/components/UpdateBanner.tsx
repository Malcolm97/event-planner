'use client';

import React, { useState } from 'react';
import { useUpdate } from '@/context/UpdateContext';

export default function UpdateBanner() {
  const { 
    updateAvailable, 
    isDismissed, 
    isChecking,
    serverVersion,
    applyUpdate, 
    dismissUpdate 
  } = useUpdate();
  
  const [isUpdating, setIsUpdating] = useState(false);

  // Don't show if no update, dismissed, or still checking
  if (!updateAvailable || isDismissed || isChecking) {
    return null;
  }

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await applyUpdate();
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Update icon */}
            <div className="flex-shrink-0">
              <svg 
                className="w-5 h-5 animate-pulse" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </div>
            
            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                A new version is available!
                {serverVersion && (
                  <span className="ml-2 text-xs opacity-75">
                    v{serverVersion.version}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="px-4 py-1.5 bg-black text-yellow-400 rounded-lg text-sm font-semibold 
                         hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-2"
            >
              {isUpdating ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                      fill="none" 
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
                    />
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Update Now
                </>
              )}
            </button>
            
            <button
              onClick={dismissUpdate}
              disabled={isUpdating}
              className="p-1.5 hover:bg-black/10 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Dismiss update notification"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}