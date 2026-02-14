'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAutoPushSubscription } from '@/hooks/useAutoPushSubscription';

interface NotificationMessage {
  type: 'NOTIFICATION_CLICK';
  eventId?: string;
  url?: string;
}

// Global state to share notification events across components
let notificationCallback: ((eventId: string) => void) | null = null;

export function setNotificationCallback(callback: (eventId: string) => void) {
  notificationCallback = callback;
}

export function clearNotificationCallback() {
  notificationCallback = null;
}

/**
 * NotificationHandler component
 * Handles notification click events from the service worker
 * This component should be placed in the root layout to handle notifications app-wide
 * Also handles eventId from URL params when app is opened from notification
 */
export default function NotificationHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [eventToOpen, setEventToOpen] = useState<string | null>(null);
  const hasHandledInitialEvent = useRef(false);

  // Auto-subscribe PWA users to push notifications (works for anonymous users too!)
  // This will automatically subscribe PWA users when they install the app
  useAutoPushSubscription({
    delay: 2000, // Wait 2 seconds after app loads
    showPrompt: true
  });

  // Handle event ID from URL params - this happens when app is opened from notification
  useEffect(() => {
    const eventId = searchParams.get('eventId');
    if (eventId && !hasHandledInitialEvent.current) {
      console.log('Opening event from URL params:', eventId);
      hasHandledInitialEvent.current = true;
      setEventToOpen(eventId);
      
      // Call global callback if set (for components like EventModal)
      if (notificationCallback) {
        notificationCallback(eventId);
      }
      
      // Clean up URL after reading
      router.replace(pathname);
    }
  }, [searchParams, router, pathname]);

  // Handle service worker messages - this happens when app is already open
  const handleServiceWorkerMessage = useCallback((event: MessageEvent<NotificationMessage>) => {
    const message = event.data;

    // Check if this is a notification click event from service worker
    if (message && message.type === 'NOTIFICATION_CLICK') {
      console.log('Notification click received in NotificationHandler:', message);
      
      const eventId = message.eventId;
      const url = message.url || '/';
      
      if (eventId) {
        // Call global callback if set (for components like EventModal)
        if (notificationCallback) {
          notificationCallback(eventId);
        }
        
        // Also navigate to the event page
        const urlWithEvent = `${url}?eventId=${eventId}`;
        router.push(urlWithEvent);
      } else {
        // Just navigate to the URL if no eventId
        router.push(url);
      }
    }
  }, [router]);

  useEffect(() => {
    // Listen for messages from service worker
    const serviceWorkerHandler = (event: MessageEvent<NotificationMessage>) => {
      handleServiceWorkerMessage(event);
    };

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', serviceWorkerHandler);
    }

    // Also listen for window messages as fallback (for some browser configurations)
    const windowHandler = (event: MessageEvent<NotificationMessage>) => {
      handleServiceWorkerMessage(event);
    };
    window.addEventListener('message', windowHandler);

    // Cleanup
    return () => {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', serviceWorkerHandler);
      }
      window.removeEventListener('message', windowHandler);
    };
  }, [handleServiceWorkerMessage]);

  // This component doesn't render anything - it's purely functional
  return null;
}
