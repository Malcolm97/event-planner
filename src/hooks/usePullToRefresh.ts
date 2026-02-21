'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface PullToRefreshConfig {
  threshold?: number;
  onRefresh?: () => void | Promise<void>;
  enabled?: boolean;
  debugMode?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  progress: number;
  isRefreshing: boolean;
}

/**
 * Optimized pull-to-refresh hook for PWA and mobile browsers
 * Works on all pages when placed at the root level
 */
export function usePullToRefresh({
  threshold = 80,
  onRefresh,
  enabled = true,
  debugMode = false,
}: PullToRefreshConfig = {}): PullToRefreshState {
  const [isPulling, setIsPulling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const currentTouchY = useRef(0);
  const isTracking = useRef(false);
  const hasTriggeredRefresh = useRef(false);
  const containerRef = useRef<HTMLElement | null>(null);
  const isRefreshingRef = useRef(false);

  // Check if we're in standalone mode or debug mode
  const shouldEnable = useCallback(() => {
    if (!enabled) return false;
    if (debugMode) return true;
    
    // Check for standalone PWA mode
    if (typeof window === 'undefined') return false;
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    
    // Also enable for touch devices in browser (not just standalone)
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isStandalone || hasTouch;
  }, [enabled, debugMode]);

  // Check if element or its parents is scrollable and scrolled
  const isScrolledDown = useCallback((element: Element | null): boolean => {
    if (!element) return false;
    
    // Check if the element itself is scrollable and scrolled
    const isScrollable = element.scrollHeight > element.clientHeight;
    if (isScrollable && element.scrollTop > 10) {
      return true;
    }
    
    // Check parent elements
    if (element.parentElement && element.parentElement !== document.body) {
      return isScrolledDown(element.parentElement);
    }
    
    // Check document scroll
    return window.scrollY > 10 || document.documentElement.scrollTop > 10;
  }, []);

  // Get the scrollable container for a touch point
  const getScrollableContainer = useCallback((x: number, y: number): Element | null => {
    const element = document.elementFromPoint(x, y);
    if (!element) return null;
    
    // Check if element or its parents are scrollable
    let current: Element | null = element;
    while (current) {
      const style = window.getComputedStyle(current);
      const overflowY = style.overflowY;
      const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') &&
        current.scrollHeight > current.clientHeight;
      
      if (isScrollable) return current;
      current = current.parentElement;
    }
    
    return null;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!shouldEnable() || isRefreshingRef.current) return;
    
    // Only handle single touch
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    currentTouchY.current = touch.clientY;
    
    // Check if we're at the top of the page
    const container = getScrollableContainer(touch.clientX, touch.clientY);
    containerRef.current = container as HTMLElement;
    
    if (isScrolledDown(container)) {
      isTracking.current = false;
      return;
    }
    
    isTracking.current = true;
    hasTriggeredRefresh.current = false;
  }, [shouldEnable, isRefreshing, getScrollableContainer, isScrolledDown]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isTracking.current || !shouldEnable() || isRefreshingRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX.current);
    const deltaY = touch.clientY - touchStartY.current;
    
    // Ignore horizontal swipes (more horizontal than vertical)
    if (deltaX > deltaY * 1.5) {
      isTracking.current = false;
      setIsPulling(false);
      setProgress(0);
      return;
    }
    
    // Only track downward pulls
    if (deltaY < 0) {
      setIsPulling(false);
      setProgress(0);
      return;
    }
    
    currentTouchY.current = touch.clientY;
    
    // Calculate progress with resistance
    const rawProgress = deltaY / threshold;
    // Apply resistance - gets harder to pull as you go further
    const resistedProgress = Math.min(rawProgress * 0.5, 1.5);
    
    setIsPulling(true);
    setProgress(Math.min(resistedProgress, 1));
    
    // Prevent default scroll when pulling down at top
    if (deltaY > 10 && !isScrolledDown(containerRef.current)) {
      e.preventDefault();
    }
  }, [shouldEnable, threshold, isScrolledDown]);

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (!isTracking.current || !shouldEnable()) {
      isTracking.current = false;
      return;
    }
    
    isTracking.current = false;
    
    // Check if threshold was reached
    if (progress >= 1 && !hasTriggeredRefresh.current) {
      hasTriggeredRefresh.current = true;
      setIsRefreshing(true);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          // Default refresh behavior - cache busting reload
          // Clear service worker cache and reload
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }
          
          // Force reload from server, bypassing cache
          window.location.reload();
        }
      } catch (error) {
        console.error('Pull to refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        hasTriggeredRefresh.current = false;
      }
    }
    
    setIsPulling(false);
    setProgress(0);
  }, [shouldEnable, progress, onRefresh]);

  // Set up event listeners
  useEffect(() => {
    if (!shouldEnable()) return;

    const options: AddEventListenerOptions = { passive: false };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [shouldEnable, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isPulling: isPulling || isRefreshing,
    progress: isRefreshing ? 1 : progress,
    isRefreshing,
  };
}

export default usePullToRefresh;