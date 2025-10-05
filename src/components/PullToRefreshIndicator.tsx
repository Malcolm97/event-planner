'use client';

import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  progress: number;
}

const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({ isPulling, progress }) => {
  if (!isPulling) return null;

  const opacity = Math.min(progress * 2, 1); // Fade in as progress increases
  const translateY = Math.min(progress * 40, 40); // Move down up to 40px

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center bg-gradient-to-b from-yellow-400 to-yellow-500 text-white py-2 px-4 shadow-lg transition-all duration-200 ease-out"
      style={{
        opacity,
        transform: `translateY(${translateY - 40}px)`, // Start from -40px above
      }}
    >
      <FiRefreshCw
        size={20}
        className={`mr-2 transition-transform duration-200 ${progress >= 1 ? 'animate-spin' : ''}`}
        style={{
          transform: `rotate(${progress * 360}deg)`,
        }}
      />
      <span className="text-sm font-medium">
        {progress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
      </span>
    </div>
  );
};

export default PullToRefreshIndicator;
