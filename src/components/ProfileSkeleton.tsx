'use client';

import { FiBriefcase } from 'react-icons/fi';

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="animate-pulse flex items-center gap-1.5">
              <div className="h-4 w-12 bg-gray-200 rounded"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 w-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Section Skeleton - Compact */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start gap-4 animate-pulse">
          {/* Avatar Skeleton */}
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-200"></div>
          </div>

          <div className="flex-1 w-full">
            {/* Name Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <div className="h-5 w-32 bg-gray-200 rounded mx-auto sm:mx-0"></div>
              <div className="h-4 w-24 bg-gray-200 rounded mx-auto sm:mx-0"></div>
            </div>
            
            {/* Company Skeleton */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-2">
              <FiBriefcase size={12} className="text-gray-300" />
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
            </div>

            {/* Bio Skeleton */}
            <div className="space-y-1.5 mb-3">
              <div className="h-3 w-full bg-gray-200 rounded"></div>
              <div className="h-3 w-3/4 bg-gray-200 rounded mx-auto sm:mx-0"></div>
            </div>

            {/* Contact Icons Skeleton */}
            <div className="flex gap-2 justify-center sm:justify-start">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Events Skeleton */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <div className="card overflow-hidden animate-pulse">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
              <div className="h-4 w-28 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="p-4">
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3].map((card) => (
                <div key={card} className="w-[280px] flex-shrink-0">
                  <div className="h-36 bg-gray-200 rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Events Sections Skeleton */}
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        {[1, 2].map((section) => (
          <div key={section} className="card p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
              <div className="h-4 w-28 bg-gray-200 rounded"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2].map((card) => (
                <div key={card} className="h-28 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}