import { useEffect } from 'react';
import { setNotificationCallback, clearNotificationCallback } from '@/components/NotificationHandler';

/**
 * Hook to handle notification clicks from service worker
 * When a user clicks a notification, the service worker sends a message with the event ID
 * This hook listens for that message and navigates to the event
 * 
 * Note: This hook now uses the global notification callback system from NotificationHandler
 * to avoid duplicate event handling
 */
export function useNotificationClick(onEventSelected?: (eventId: string) => void) {
  useEffect(() => {
    // Register the callback with the global notification handler
    if (onEventSelected) {
      setNotificationCallback(onEventSelected);
    }

    // Cleanup listener on unmount
    return () => {
      // Clear the global callback when unmounting
      clearNotificationCallback();
    };
  }, [onEventSelected]);
}
