'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
  refreshPermission: () => void;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator &&
                       'PushManager' in window &&
                       'Notification' in window;

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Check current subscription status
  const checkSubscriptionStatus = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking subscription status:', err);
      setError('Failed to check subscription status');
    }
  }, [isSupported]);

  // Refresh permission state
  const refreshPermission = useCallback(() => {
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, [isSupported]);

  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  // Add window focus listeners to refresh permission state
  useEffect(() => {
    const handleFocus = () => {
      refreshPermission();
      checkSubscriptionStatus();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshPermission();
        checkSubscriptionStatus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshPermission, checkSubscriptionStatus]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission first if not granted - check current browser permission
      if (Notification.permission !== 'granted') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }

      // Get service worker registration
      // On Android, ensure service worker is fully activated
      const registration = await navigator.serviceWorker.ready;
      console.log('Service worker ready for subscription');

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      console.log('Current subscription:', subscription ? 'exists' : 'none');

      if (!subscription) {
        // Subscribe with VAPID key
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error('Environment variable NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
          throw new Error(
            'Push notifications are not configured. ' +
            'Please add NEXT_PUBLIC_VAPID_PUBLIC_KEY to your environment variables. ' +
            'See the notification setup guide for details.'
          );
        }

        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

        // Subscribe with options that work well on Android
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true, // Required for Android
          applicationServerKey: applicationServerKey as BufferSource
        });
        
        console.log('Push subscription created successfully');
      } else {
        console.log('Already subscribed, reusing existing subscription');
      }

      if (!subscription) {
        throw new Error('Failed to create push subscription');
      }

      // Convert subscription to JSON
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');

      if (!p256dhKey || !authKey) {
        throw new Error('Failed to get subscription keys');
      }

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...Array.from(new Uint8Array(p256dhKey)))),
          auth: btoa(String.fromCharCode(...Array.from(new Uint8Array(authKey))))
        }
      };

      // Save subscription to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscriptionData,
          user_agent: navigator.userAgent
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save subscription');
      }

      console.log('Subscription saved to database successfully');
      setIsSubscribed(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe';
      console.error('Subscription error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log('Push subscription unsubscribed');

        // Remove from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: dbError } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id);

          if (dbError) {
            console.error('Database error during unsubscribe:', dbError);
            // Don't throw - subscription was already removed from browser
          } else {
            console.log('Subscription removed from database');
          }
        }
      } else {
        console.log('No subscription to unsubscribe from');
      }

      setIsSubscribed(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe';
      console.error('Unsubscribe error:', errorMessage);
      setError(errorMessage);
      // Still mark as unsubscribed even if database removal fails
      setIsSubscribed(false);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
    refreshPermission
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
