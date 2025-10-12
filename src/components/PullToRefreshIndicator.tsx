'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  progress: number;
}

const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = React.memo(({ isPulling, progress }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // Debounced visibility update to prevent excessive re-renders
  useEffect(() => {
    if (isPulling) {
      setIsVisible(true);
      // Announce to screen readers with device-appropriate feedback
      if (progress >= 1) {
        setAnnouncement('Release to refresh the page');
      } else {
        setAnnouncement('Pull down to refresh');
      }
    } else {
      // Delay hiding to allow exit animation
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isPulling, progress]);

  // Early return for performance
  if (!isVisible) return null;

  // Optimized calculations with device-specific adjustments
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const isHighDPI = devicePixelRatio > 1;

  const opacity = Math.min(progress * 2, 1); // Fade in as progress increases
  const translateY = Math.min(progress * (isHighDPI ? 50 : 40), isHighDPI ? 50 : 40); // Move down up to 40-50px based on DPI

  // Dynamic styling based on device capabilities
  const indicatorHeight = isHighDPI ? 'py-3' : 'py-2';
  const iconSize = isHighDPI ? 24 : 20;
  const textSize = isHighDPI ? 'text-base' : 'text-sm';

  return (
    <>
      {/* Screen reader announcement */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Visual indicator with hardware acceleration */}
      <div
        className={`fixed top-0 left-0 right-0 z-[200] flex items-center justify-center bg-gradient-to-b from-yellow-400 to-yellow-500 text-white ${indicatorHeight} px-4 shadow-lg transition-all duration-200 ease-out will-change-transform`}
        style={{
          opacity,
          transform: `translateY(${translateY - (isHighDPI ? 50 : 40)}px)`, // Start from above viewport
          // Hardware acceleration for smoother animations
          backfaceVisibility: 'hidden',
          perspective: 1000,
        }}
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Pull to refresh progress"
      >
        <FiRefreshCw
          size={iconSize}
          className={`mr-2 transition-transform duration-200 ${progress >= 1 ? 'animate-spin' : ''}`}
          style={{
            transform: `rotate(${progress * 360}deg)`,
            // Ensure smooth rotation
            transformOrigin: 'center center',
          }}
          aria-hidden="true"
        />
        <span className={`${textSize} font-medium select-none`}>
          {progress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>
    </>
  );
});

export default PullToRefreshIndicator;
