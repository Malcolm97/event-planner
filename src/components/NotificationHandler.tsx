'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAutoPushSubscription } from '@/hooks/useAutoPushSubscription';

interface NotificationMessage {
  type: 'NOTIFICATION_CLICK';
  eventId?: string;
  url?: string;
  receivedAt?: number;
  source?: 'service-worker' | 'url';
}

const NOTIFICATION_HANDOFF_CACHE = 'event-planner-notification-handoff-v1';
const NOTIFICATION_HANDOFF_PATH = '/__notification_handoff__';

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
  const hasHandledInitialEvent = useRef(false);
  const lastHandledKeyRef = useRef<string | null>(null);

  // Auto-subscribe PWA users to push notifications (works for anonymous users too!)
  // This will automatically subscribe PWA users when they install the app
  useAutoPushSubscription({
    delay: 2000, // Wait 2 seconds after app loads
    showPrompt: true
  });

  const buildMessageKey = useCallback((message: NotificationMessage) => {
    return `${message.eventId || ''}|${message.url || ''}|${message.receivedAt || 0}`;
  }, []);

  const drainPendingNotification = useCallback(async (): Promise<NotificationMessage | null> => {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return null;
    }

    try {
      const cache = await window.caches.open(NOTIFICATION_HANDOFF_CACHE);
      const requestUrl = `${window.location.origin}${NOTIFICATION_HANDOFF_PATH}`;
      const response = await cache.match(requestUrl);

      if (!response) {
        return null;
      }

      const payload = (await response.json()) as NotificationMessage;
      await cache.delete(requestUrl);
      return payload;
    } catch (error) {
      console.error('Failed to read pending notification handoff:', error);
      return null;
    }
  }, []);

  const clearPendingNotification = useCallback(async () => {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return;
    }

    try {
      const cache = await window.caches.open(NOTIFICATION_HANDOFF_CACHE);
      const requestUrl = `${window.location.origin}${NOTIFICATION_HANDOFF_PATH}`;
      await cache.delete(requestUrl);
    } catch (error) {
      console.error('Failed to clear pending notification handoff:', error);
    }
  }, []);

  const handleNotificationNavigation = useCallback((message: NotificationMessage) => {
    const messageKey = buildMessageKey(message);
    if (lastHandledKeyRef.current === messageKey) {
      return;
    }

    lastHandledKeyRef.current = messageKey;
    hasHandledInitialEvent.current = true;
    clearPendingNotification();

    const eventId = message.eventId;
    const url = message.url || '/';

    if (eventId && notificationCallback) {
      notificationCallback(eventId);
    }

    if (eventId) {
      const separator = url.includes('?') ? '&' : '?';
      router.push(`${url}${separator}eventId=${eventId}`);
      return;
    }

    router.push(url);
  }, [buildMessageKey, clearPendingNotification, router]);

  useEffect(() => {
    const eventId = searchParams.get('eventId');
    if (!eventId || hasHandledInitialEvent.current) {
      return;
    }

    hasHandledInitialEvent.current = true;
    handleNotificationNavigation({
      type: 'NOTIFICATION_CLICK',
      eventId,
      url: pathname,
      receivedAt: Date.now(),
      source: 'url'
    });
    router.replace(pathname);
  }, [searchParams, pathname, router, handleNotificationNavigation]);

  useEffect(() => {
    let isMounted = true;

    const loadPendingNotification = async () => {
      const pendingMessage = await drainPendingNotification();
      if (isMounted && pendingMessage?.type === 'NOTIFICATION_CLICK') {
        handleNotificationNavigation(pendingMessage);
      }
    };

    loadPendingNotification();

    return () => {
      isMounted = false;
    };
  }, [drainPendingNotification, handleNotificationNavigation]);

  // Handle service worker messages - this happens when app is already open
  const handleServiceWorkerMessage = useCallback((event: MessageEvent<NotificationMessage>) => {
    const message = event.data;

    // Check if this is a notification click event from service worker
    if (message && message.type === 'NOTIFICATION_CLICK') {
      console.log('Notification click received in NotificationHandler:', message);

      handleNotificationNavigation(message);
    }
  }, [handleNotificationNavigation]);

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
