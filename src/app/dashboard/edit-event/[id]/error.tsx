'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function EditEventError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 text-center">
        <h2 className="section-title text-gray-900 mb-3">Couldn&apos;t load this event editor</h2>
        <p className="page-subtitle text-gray-600 mb-6">
          Something went wrong while opening or updating this event.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-500"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
