import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { setNotificationCallback, clearNotificationCallback } from '@/components/NotificationHandler';

interface NotificationMessage {
  type: 'NOTIFICATION_CLICK';
  eventId?: string;
  url?: string;
}

/**
 * Hook to handle notification clicks from service worker
 * When a user clicks a notification, the service worker sends a message with the event ID
 * This hook listens for that message and navigates to the event
 * 
 * Note: This hook now uses the global notification callback system from NotificationHandler
 * to avoid duplicate event handling
 */
export function useNotificationClick(onEventSelected?: (eventId: string) => void) {
  const router = useRouter();

  const handleNotificationMessage = useCallback((event: MessageEvent<NotificationMessage>) => {
    const message = event.data;

    // Check if this is a notification click event from service worker
    if (message && message.type === 'NOTIFICATION_CLICK' && message.eventId) {
      console.log('Notification click received:', message.eventId);

      // Call the callback if provided (for opening event modal)
      if (onEventSelected) {
        onEventSelected(message.eventId);
      } else {
        // Fallback: navigate to the event page
        router.push(`/events/${message.eventId}`);
      }
    }
  }, [router, onEventSelected]);

  useEffect(() => {
    // Register the callback with the global notification handler
    if (onEventSelected) {
      setNotificationCallback(onEventSelected);
    }

    // Listen for messages from service worker as backup
    const serviceWorkerHandler = (event: MessageEvent<NotificationMessage>) => {
      handleNotificationMessage(event);
    };

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', serviceWorkerHandler);
    }

    // Cleanup listener on unmount
    return () => {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', serviceWorkerHandler);
      }
      // Clear the global callback when unmounting
      clearNotificationCallback();
    };
  }, [handleNotificationMessage, onEventSelected]);
}
