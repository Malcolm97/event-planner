import { supabase, TABLES } from '@/lib/supabase';

import webpush from 'web-push';

export interface StoredPushSubscription {
  id: string;
  user_id?: string | null;
  device_id?: string | null;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

interface SendPushNotificationOptions {
  title: string;
  body: string;
  url?: string;
  eventId?: string;
  targetSubscriptions?: StoredPushSubscription[];
}

const vapidEmail = process.env.VAPID_EMAIL || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export const hasVapidConfig = Boolean(vapidEmail && vapidPrivateKey && vapidPublicKey);

if (hasVapidConfig) {
  const emailForVapid = vapidEmail.startsWith('mailto:') ? vapidEmail : `mailto:${vapidEmail}`;
  webpush.setVapidDetails(emailForVapid, vapidPublicKey, vapidPrivateKey);
}

async function getEventDetails(eventId?: string) {
  if (!eventId) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLES.EVENTS)
    .select('name, location, date, end_date')
    .eq('id', eventId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function resolveSubscriptions(targetSubscriptions?: StoredPushSubscription[]) {
  if (targetSubscriptions && targetSubscriptions.length > 0) {
    return targetSubscriptions;
  }

  const { data, error } = await supabase
    .from(TABLES.PUSH_SUBSCRIPTIONS)
    .select('id, user_id, device_id, subscription');

  if (error) {
    throw error;
  }

  return (data || []) as StoredPushSubscription[];
}

function buildNotificationBody(defaultBody: string, eventDetails: Awaited<ReturnType<typeof getEventDetails>>) {
  if (!eventDetails) {
    return defaultBody;
  }

  try {
    const eventDate = new Date(eventDetails.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${eventDetails.name}\nLocation: ${eventDetails.location}\nDate: ${formattedDate}`;
  } catch {
    return defaultBody;
  }
}

export async function sendPushNotifications(options: SendPushNotificationOptions) {
  if (!hasVapidConfig) {
    throw new Error('Push notification service not configured');
  }

  const subscriptions = await resolveSubscriptions(options.targetSubscriptions);
  if (subscriptions.length === 0) {
    return {
      success: true,
      sent: 0,
      failed: 0,
      total: 0,
      message: 'No subscribers to notify',
    };
  }

  const eventDetails = await getEventDetails(options.eventId);
  const payload = JSON.stringify({
    title: options.title,
    body: buildNotificationBody(options.body, eventDetails),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: {
      url: options.url || '/',
      eventId: options.eventId || null,
    },
    actions: [
      {
        action: 'view',
        title: 'View Event',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        return { id: sub.id, success: true };
      } catch (error: any) {
        if (error?.statusCode === 410 || error?.statusCode === 400 || error?.statusCode === 404) {
          await supabase
            .from(TABLES.PUSH_SUBSCRIPTIONS)
            .delete()
            .eq('id', sub.id);
        }

        return {
          id: sub.id,
          success: false,
          error: error?.message || 'Failed to send notification',
        };
      }
    })
  );

  const sent = results.filter((result) => result.status === 'fulfilled' && result.value.success).length;
  const failed = results.length - sent;

  return {
    success: true,
    sent,
    failed,
    total: subscriptions.length,
    message: `Notifications sent to ${sent} subscribers`,
  };
}
