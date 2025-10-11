import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
const webpush = require('web-push');

// Configure VAPID keys
if (process.env.VAPID_EMAIL && process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { title, body: messageBody, url, eventId } = body;

    // Validate required fields
    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Get all push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('user_id, subscription');

    if (error) {
      console.error('Error fetching push subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found');
      return NextResponse.json({ message: 'No subscribers to notify' });
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body: messageBody,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: {
        url: url || '/',
        eventId: eventId || null
      },
      actions: [
        {
          action: 'view',
          title: 'View Event'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    });

    // Send notifications to all subscribers
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        try {
          const pushSubscription = {
            endpoint: sub.subscription.endpoint,
            keys: {
              p256dh: sub.subscription.keys.p256dh,
              auth: sub.subscription.keys.auth
            }
          };

          const result = await webpush.sendNotification(pushSubscription, payload);
          return { userId: sub.user_id, success: true, result };
        } catch (err: any) {
          console.error(`Failed to send notification to user ${sub.user_id}:`, err.message);

          // If subscription is invalid/expired, remove it from database
          if (err.statusCode === 410 || err.statusCode === 400) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('user_id', sub.user_id);
          }

          return { userId: sub.user_id, success: false, error: err.message };
        }
      })
    );

    // Count successful sends
    const successful = results.filter(result =>
      result.status === 'fulfilled' && result.value.success
    ).length;

    const failed = results.length - successful;

    console.log(`Push notification sent: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length,
      message: `Notifications sent to ${successful} subscribers`
    });

  } catch (error: any) {
    console.error('Error sending push notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send push notifications' },
      { status: 500 }
    );
  }
}
