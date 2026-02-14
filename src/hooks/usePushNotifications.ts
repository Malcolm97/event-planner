'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getUserFriendlyError } from '@/lib/userMessages';

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

  // Check if push notifications are supported and register service worker
  useEffect(() => {
    let isMounted = true;

    const registerServiceWorker = async () => {
      if (!('serviceWorker' in navigator)) {
        console.log('Service workers not supported');
        return;
      }

      try {
        // Check if service worker is already registered
        let reg = await navigator.serviceWorker.getRegistration();
        
        if (!reg) {
          // Register new service worker
          reg = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/'
          });
          console.log('Service worker registered for push notifications:', reg.scope);
          
          // Wait for the service worker to be ready
          await navigator.serviceWorker.ready;
          console.log('Service worker is ready');
        } else {
          console.log('Service worker already registered:', reg.scope);
          
          // Ensure it's ready
          if (!reg.active) {
            await navigator.serviceWorker.ready;
          }
        }
      } catch (err) {
        console.error('Service worker registration failed:', err);
      }
    };

    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator &&
                       'PushManager' in window &&
                       'Notification' in window;

      setIsSupported(supported);
      console.log('Push notifications supported:', supported);

      if (supported) {
        // Check current permission
        if ('Notification' in window) {
          setPermission(Notification.permission);
          console.log('Current notification permission:', Notification.permission);
        }

        // Register service worker
        if ('serviceWorker' in navigator) {
          registerServiceWorker().catch((err) =>
            console.error('Error during service worker registration:', err)
          );
        }
      }
    };

    checkSupport();

    // Cleanup
    return () => {
      isMounted = false;
    };
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
      throw new Error('Your browser doesn\'t support notifications.');
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (err) {
      const errorMessage = getUserFriendlyError(err, 'Failed to request permission');
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      throw new Error("Your browser doesn't support notifications.");
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission first if not granted - check current browser permission
      if (Notification.permission !== 'granted') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          throw new Error("Please enable notifications in your browser settings to get updates.");
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
        console.log('VAPID Public Key from env:', vapidPublicKey);
        
        if (!vapidPublicKey) {
          console.error('Environment variable NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
          throw new Error("Notifications aren't set up properly. Please contact support.");
        }

        if (vapidPublicKey.length < 80) {
          console.error('VAPID Public Key appears to be invalid or too short:', vapidPublicKey);
          throw new Error("Notifications aren't set up correctly. Please contact support.");
        }

        let applicationServerKey;
        try {
          applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
          console.log('VAPID key successfully converted to Uint8Array');
        } catch (keyError) {
          console.error('Failed to convert VAPID key to Uint8Array:', keyError);
          throw new Error("Notifications aren't working properly. Please try again later.");
        }

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
        throw new Error("Couldn't set up notifications. Please try again.");
      }

      // Convert subscription to JSON
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');

      if (!p256dhKey || !authKey) {
        throw new Error("Couldn't complete notification setup. Please try again.");
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
        throw new Error("Please sign in to continue.");
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
        throw new Error("Couldn't save your notification settings. Please try again.");
      }

      console.log('Subscription saved to database successfully');
      setIsSubscribed(true);
    } catch (err) {
      const errorMessage = getUserFriendlyError(err, "Couldn't set up notifications. Please try again.");
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
