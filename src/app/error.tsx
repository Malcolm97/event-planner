'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check if the error is due to being offline
    const checkOfflineStatus = () => {
      const offline = !navigator.onLine;
      setIsOffline(offline);
      
      // Also check if error message indicates network issues
      if (error.message?.toLowerCase().includes('network') ||
          error.message?.toLowerCase().includes('fetch') ||
          error.message?.toLowerCase().includes('failed to fetch') ||
          error.message?.toLowerCase().includes('networkerror') ||
          error.message?.toLowerCase().includes('offline')) {
        setIsOffline(true);
      }
    };

    checkOfflineStatus();

    // Log the error to an error reporting service
    console.error(error);

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error]);

  // Offline-specific UI
  if (isOffline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Offline
          </div>
          <div className="text-6xl mb-4">📡</div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            You're Offline
          </h2>
          <p className="text-gray-600 mb-6">
            This page requires an internet connection. Please check your connection and try again, or go to the homepage to browse cached content.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Refresh Page
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Go to Homepage
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            The page will automatically reload when you're back online.
          </p>
        </div>
      </div>
    );
  }

  // Generic error UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          Oops! Something went wrong
        </h2>
        <p className="text-gray-600 mb-6">
          We're sorry, but something unexpected happened. Don't worry, it's not your fault!
        </p>
        <div className="space-y-3">
          <Button
            onClick={() => reset()}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold"
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go to Homepage
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          If this keeps happening, please try refreshing the page.
        </p>
      </div>
    </div>
  );
}