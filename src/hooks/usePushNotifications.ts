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

interface PushSubscriptionInsert {
  subscription: PushSubscriptionData;
  user_agent: string;
  user_id?: string;
  device_id?: string;
}

interface IOSNavigator extends Navigator {
  standalone?: boolean;
}

function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
}

function devWarn(...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args);
  }
}

function devError(...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
}

// Generate or retrieve a unique device ID for anonymous users
function getDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  
  const DEVICE_ID_KEY = 'pwa_device_id';
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    // Generate a new UUID-like device ID
    deviceId = 'device_' + crypto.randomUUID() + '_' + Date.now();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

async function buildNotificationRequestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

async function saveSubscriptionOnServer(payload: PushSubscriptionInsert): Promise<void> {
  const headers = await buildNotificationRequestHeaders();
  const response = await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      subscription: payload.subscription,
      device_id: payload.device_id,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Could not save your notification settings. Please try again.');
  }
}

async function removeSubscriptionOnServer(payload: { endpoint?: string; device_id?: string }): Promise<void> {
  const headers = await buildNotificationRequestHeaders();
  const response = await fetch('/api/notifications/unsubscribe', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to remove notification settings.');
  }
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
    const registerServiceWorker = async () => {
      if (!('serviceWorker' in navigator)) {
        devLog('Service workers not supported');
        return;
      }

      try {
        // Check if service worker is already registered
        let reg = await navigator.serviceWorker.getRegistration();
        
        if (!reg) {
          // Register new service worker - with error handling for production
          try {
            reg = await navigator.serviceWorker.register('/service-worker.js', {
              scope: '/'
            });
            devLog('Service worker registered for push notifications:', reg.scope);
            
            // Wait for the service worker to be ready
            await navigator.serviceWorker.ready;
            devLog('Service worker is ready');
          } catch (regError) {
            // Service worker registration failed - this is common in some browsers
            devWarn('Service worker registration failed (non-critical):', regError);
            return; // Don't throw, just return silently
          }
        } else {
          devLog('Service worker already registered:', reg.scope);
          
          // Ensure it's ready
          if (!reg.active) {
            await navigator.serviceWorker.ready;
          }
        }
      } catch (err) {
        // Catch any other errors but don't crash - service worker is optional
        devWarn('Service worker setup error (non-critical):', err);
        return;
      }
    };

    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator &&
                       'PushManager' in window &&
                       'Notification' in window;

      setIsSupported(supported);
      devLog('Push notifications supported:', supported);

      if (supported) {
        // Check current permission
        if ('Notification' in window) {
          setPermission(Notification.permission);
          devLog('Current notification permission:', Notification.permission);
        }

        // Register service worker
        if ('serviceWorker' in navigator) {
          registerServiceWorker().catch((err) =>
            devError('Error during service worker registration:', err)
          );
        }
      }
    };

    checkSupport();

    return undefined;
  }, []);

  // Check current subscription status
  const checkSubscriptionStatus = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      devError('Error checking subscription status:', err);
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
      devLog('Service worker ready for subscription');

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      devLog('Current subscription:', subscription ? 'exists' : 'none');

      if (!subscription) {
        // Subscribe with VAPID key
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        devLog('VAPID Public Key from env:', vapidPublicKey);
        
        if (!vapidPublicKey) {
          devError('Environment variable NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
          throw new Error("Notifications aren't set up properly. Please contact support.");
        }

        if (vapidPublicKey.length < 80) {
          devError('VAPID Public Key appears to be invalid or too short:', vapidPublicKey);
          throw new Error("Notifications aren't set up correctly. Please contact support.");
        }

        let applicationServerKey;
        try {
          applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
          devLog('VAPID key successfully converted to Uint8Array');
        } catch (keyError) {
          devError('Failed to convert VAPID key to Uint8Array:', keyError);
          throw new Error("Notifications aren't working properly. Please try again later.");
        }

        // Subscribe with options that work well on Android
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true, // Required for Android
          applicationServerKey: applicationServerKey as BufferSource
        });
        
        devLog('Push subscription created successfully');
      } else {
        devLog('Already subscribed, reusing existing subscription');
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

      // Save subscription to database - support both logged-in users and anonymous PWA users
      const { data: { user } } = await supabase.auth.getUser();
      
      const dbData: PushSubscriptionInsert = {
        subscription: subscriptionData,
        user_agent: navigator.userAgent
      };

      if (user) {
        // Logged-in user - save with user_id
        dbData.user_id = user.id;
        devLog('Saving subscription for logged-in user:', user.id);
      } else {
        // Anonymous PWA user - save with device_id
        const deviceId = getDeviceId();
        if (!deviceId) {
          throw new Error("Couldn't generate device ID. Please try again.");
        }
        dbData.device_id = deviceId;
        devLog('Saving subscription for anonymous device:', deviceId);
      }

      await saveSubscriptionOnServer(dbData);

      devLog('Subscription saved to server successfully');
      setIsSubscribed(true);
    } catch (err) {
      const errorMessage = getUserFriendlyError(err, "Couldn't set up notifications. Please try again.");
      devError('Subscription error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        devLog('Push subscription unsubscribed');

        // Remove from database - support both logged-in and anonymous users
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          await removeSubscriptionOnServer({ endpoint });
          devLog('Subscription removed from server for user:', user.id);
        } else {
          // Anonymous user - delete by device_id
          const deviceId = getDeviceId();
          if (deviceId) {
            await removeSubscriptionOnServer({ endpoint, device_id: deviceId });
            devLog('Subscription removed from server for device:', deviceId);
          }
        }
      } else {
        devLog('No subscription to unsubscribe from');
      }

      setIsSubscribed(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe';
      devError('Unsubscribe error:', errorMessage);
      // Still mark as unsubscribed even if database removal fails
      setError(errorMessage);
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
