import { useEffect, useState } from 'react';

interface PullToRefreshConfig {
  threshold?: number;
  onRefresh?: () => void;
  enabled?: boolean;
  debugMode?: boolean; // For development testing
}

export const usePullToRefresh = (config: PullToRefreshConfig = {}) => {
  const { threshold = 80, onRefresh, enabled = true, debugMode = false } = config;
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  useEffect(() => {
    // Check if running in standalone mode (PWA saved to homescreen) or debug mode
    const isStandalone = debugMode ||
                        window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;

    // Enhanced mobile/tablet detection using media queries and touch capabilities
    const isMobile = debugMode ||
                    ('ontouchstart' in window &&
                    (window.innerWidth < 1024 || window.matchMedia('(max-width: 1023px)').matches));

    if (!enabled || !isStandalone || !isMobile) {
      return;
    }

    // Device-adaptive threshold based on screen size and pixel density
    const devicePixelRatio = window.devicePixelRatio || 1;
    const screenHeight = window.innerHeight;
    const adaptiveThreshold = threshold * (devicePixelRatio > 1 ? 1.2 : 1) * (screenHeight < 600 ? 0.8 : 1);

    let touchStartY = 0;
    let touchStartX = 0;
    let isTracking = false;
    let startTime = 0;
    let hasPreventedDefault = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Only handle single touch
      if (e.touches.length !== 1) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      // Only start tracking if at the top of the page and not already tracking
      if (scrollTop <= 10 && !isTracking) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        startTime = Date.now();
        isTracking = true;
        hasPreventedDefault = false;
        setStartY(touchStartY);
        setIsPulling(false);
        setPullDistance(0);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTracking || e.touches.length !== 1) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const distanceY = currentY - touchStartY;
      const distanceX = currentX - touchStartX;

      // Check for horizontal scrolling (if X movement is significant relative to Y, don't treat as pull)
      if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > 15) {
        isTracking = false;
        setIsPulling(false);
        setPullDistance(0);
        return;
      }

      // Only track downward pulls
      if (distanceY > 0) {
        setPullDistance(distanceY);
        setIsPulling(true);

        // Prevent default scrolling when pulling down significantly
        if (distanceY > 20 && !hasPreventedDefault) {
          e.preventDefault();
          hasPreventedDefault = true;
        }
      } else {
        // If user pulls up instead, stop tracking
        setIsPulling(false);
        setPullDistance(0);
        isTracking = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTracking) return;

      const endTime = Date.now();
      const touchDuration = endTime - startTime;

      // Only trigger refresh if the gesture was quick enough and distance sufficient
      if (isPulling && pullDistance >= adaptiveThreshold && touchDuration < 1000) {
        // Trigger haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }

        // Trigger refresh with cache bypass for PWA
        if (onRefresh) {
          onRefresh();
        } else {
          performCacheBustingRefresh();
        }
      }

      setIsPulling(false);
      setPullDistance(0);
      isTracking = false;
      hasPreventedDefault = false;
    };

    // Enhanced refresh function that bypasses service worker cache
    const performCacheBustingRefresh = () => {
      // For PWA mode, we need to ensure cache is bypassed
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Unregister service worker temporarily and reload
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister().then(() => {
              // Add cache-busting parameter to force fresh content
              const url = new URL(window.location.href);
              url.searchParams.set('_t', Date.now().toString());
              window.location.href = url.toString();
            });
          });
        }).catch(() => {
          // Fallback to regular reload with cache busting
          window.location.href = window.location.href + (window.location.href.includes('?') ? '&' : '?') + '_t=' + Date.now();
        });
      } else {
        // Regular browser refresh with cache busting
        window.location.reload();
      }
    };

    // Add event listeners with appropriate options
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, onRefresh]);

  return { isPulling, pullDistance, progress: Math.min(pullDistance / (threshold * (window.devicePixelRatio > 1 ? 1.2 : 1) * (window.innerHeight < 600 ? 0.8 : 1)), 1) };
};
