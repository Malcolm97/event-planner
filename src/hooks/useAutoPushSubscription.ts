'use client';

import { useEffect, useRef } from 'react';
import { usePushNotifications } from './usePushNotifications';

// Key for tracking if auto-subscribe has been attempted
const AUTO_SUBSCRIBE_ATTEMPTED_KEY = 'pwa_auto_subscribe_attempted';

interface UseAutoPushSubscriptionOptions {
  // Delay in ms before auto-subscribing (default: 3 seconds)
  delay?: number;
  // Whether to show a prompt UI (if false, subscribes silently)
  showPrompt?: boolean;
  // Custom prompt message
  promptMessage?: string;
}

export function useAutoPushSubscription(options: UseAutoPushSubscriptionOptions = {}) {
  const { delay = 3000, showPrompt = true, promptMessage } = options;
  const { subscribe, isSupported, isSubscribed, permission } = usePushNotifications();
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    // Don't run on server
    if (typeof window === 'undefined') return;

    // Skip if notifications not supported
    if (!isSupported) {
      console.log('Push notifications not supported, skipping auto-subscribe');
      return;
    }

    // Skip if already subscribed
    if (isSubscribed) {
      console.log('Already subscribed to push notifications');
      return;
    }

    // Skip if permission denied (don't ask again)
    if (permission === 'denied') {
      console.log('Notification permission denied, skipping auto-subscribe');
      return;
    }

    // Skip if already attempted recently (within last hour)
    const lastAttempt = localStorage.getItem(AUTO_SUBSCRIBE_ATTEMPTED_KEY);
    if (lastAttempt) {
      const attemptTime = parseInt(lastAttempt, 10);
      const hourAgo = Date.now() - (60 * 60 * 1000);
      if (attemptTime > hourAgo) {
        console.log('Auto-subscribe recently attempted, skipping');
        return;
      }
    }

    // Prevent multiple attempts
    if (hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;

    // Mark that we've attempted
    localStorage.setItem(AUTO_SUBSCRIBE_ATTEMPTED_KEY, Date.now().toString());

    // Check if PWA is installed or being used
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (navigator as any).standalone === true;

    // Only auto-subscribe for PWA users or if user has interacted with the site
    const timer = setTimeout(async () => {
      try {
        if (showPrompt && !isPWA) {
          // For non-PWA users, show a subtle indicator instead of auto-subscribing
          // This can be enhanced with a custom UI component
          console.log('Showing notification prompt for browser user');
        }
        
        // For PWA users, auto-subscribe without explicit prompt
        if (isPWA || showPrompt) {
          console.log('Auto-subscribing to push notifications...');
          await subscribe();
          console.log('Successfully auto-subscribed to push notifications');
        }
      } catch (error) {
        console.error('Auto-subscribe failed:', error);
        // Clear the attempted flag so it can be tried again later
        localStorage.removeItem(AUTO_SUBSCRIBE_ATTEMPTED_KEY);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [isSupported, isSubscribed, permission, subscribe, delay, showPrompt]);

  // Function to reset auto-subscribe (useful for settings)
  const resetAutoSubscribe = () => {
    localStorage.removeItem(AUTO_SUBSCRIBE_ATTEMPTED_KEY);
    hasAttemptedRef.current = false;
  };

  return {
    resetAutoSubscribe,
    isSupported,
    isSubscribed,
    permission
  };
}
