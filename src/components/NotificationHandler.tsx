'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface NotificationMessage {
  type: 'NOTIFICATION_CLICK';
  eventId: string;
  url: string;
}

/**
 * NotificationHandler component
 * Handles notification click events from the service worker
 * This component should be placed in the root layout to handle notifications app-wide
 */
export default function NotificationHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [eventToOpen, setEventToOpen] = useState<string | null>(null);

  // Check for event ID in URL query params (from notification click)
  useEffect(() => {
    const eventId = searchParams.get('eventId');
    if (eventId) {
      console.log('Opening event from URL:', eventId);
      setEventToOpen(eventId);
      // Clear the URL param after reading
      router.replace('/');
    }
  }, [searchParams, router]);

  // Handle service worker messages
  const handleServiceWorkerMessage = useCallback((event: MessageEvent<NotificationMessage>) => {
    const message = event.data;

    // Check if this is a notification click event from service worker
    if (message && message.type === 'NOTIFICATION_CLICK' && message.eventId) {
      console.log('Notification click received in NotificationHandler:', message.eventId);
      
      // Navigate to the event - we'll use URL params to pass the event ID
      // This avoids complex state management between components
      const baseUrl = message.url || '/';
      const urlWithEvent = `${baseUrl}?eventId=${message.eventId}`;
      router.push(urlWithEvent);
    }
  }, [router]);

  useEffect(() => {
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    // Also listen for window messages as fallback
    window.addEventListener('message', handleServiceWorkerMessage as EventListener);

    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      window.removeEventListener('message', handleServiceWorkerMessage as EventListener);
    };
  }, [handleServiceWorkerMessage]);

  // This component doesn't render anything
  return null;
}
