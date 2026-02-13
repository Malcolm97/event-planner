import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface NotificationMessage {
  type: 'NOTIFICATION_CLICK';
  eventId: string;
  url: string;
}

/**
 * Hook to handle notification clicks from service worker
 * When a user clicks a notification, the service worker sends a message with the event ID
 * This hook listens for that message and navigates to the event
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
    // Listen for messages from service worker
    // The service worker sends messages via client.postMessage()
    navigator.serviceWorker.addEventListener('message', handleNotificationMessage);

    // Cleanup listener on unmount
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleNotificationMessage);
    };
  }, [handleNotificationMessage]);
}
