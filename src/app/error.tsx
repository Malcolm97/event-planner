'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-base sm:text-base lg:text-2xl font-bold text-gray-900 mb-3">
          Oops! Something went wrong
        </h2>
        <p className="text-gray-600 mb-6">
          We're sorry, but something unexpected happened. Don't worry, it's not your fault!
        </p>
        <div className="space-y-3">
          <Button
            onClick={() => reset()}
            className="w-full"
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
