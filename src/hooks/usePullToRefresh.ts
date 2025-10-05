import { useEffect, useState } from 'react';

interface PullToRefreshConfig {
  threshold?: number;
  onRefresh?: () => void;
  enabled?: boolean;
}

export const usePullToRefresh = (config: PullToRefreshConfig = {}) => {
  const { threshold = 80, onRefresh, enabled = true } = config;
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  useEffect(() => {
    // Check if running in standalone mode (PWA saved to homescreen)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;

    // Check if on mobile/tablet (has touch support and screen width < 1024px)
    const isMobile = 'ontouchstart' in window && window.innerWidth < 1024;

    if (!enabled || !isStandalone || !isMobile) {
      return;
    }

    let touchStartY = 0;
    let isTracking = false;

    const handleTouchStart = (e: TouchEvent) => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      // Only start tracking if at the top of the page
      if (scrollTop <= 10) {
        touchStartY = e.touches[0].clientY;
        isTracking = true;
        setStartY(touchStartY);
        setIsPulling(false);
        setPullDistance(0);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTracking) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY;

      // Only track downward pulls
      if (distance > 0) {
        setPullDistance(distance);
        setIsPulling(true);

        // Prevent default scrolling when pulling down
        if (distance > 20) {
          e.preventDefault();
        }
      } else {
        setIsPulling(false);
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (!isTracking) return;

      if (isPulling && pullDistance >= threshold) {
        // Trigger haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }

        // Trigger refresh
        if (onRefresh) {
          onRefresh();
        } else {
          window.location.reload();
        }
      }

      setIsPulling(false);
      setPullDistance(0);
      isTracking = false;
    };

    // Add passive: false to touchmove to allow preventDefault
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, onRefresh, pullDistance]);

  return { isPulling, pullDistance, progress: Math.min(pullDistance / threshold, 1) };
};
