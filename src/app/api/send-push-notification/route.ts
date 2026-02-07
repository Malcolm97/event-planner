import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
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
    const { title, body: messageBody, url, eventId, targetSubscriptions } = body;

    // Validate required fields
    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    let subscriptions;

    // If targetSubscriptions is provided, use those specific subscriptions
    if (targetSubscriptions && Array.isArray(targetSubscriptions) && targetSubscriptions.length > 0) {
      subscriptions = targetSubscriptions;
      console.log(`Using ${subscriptions.length} targeted subscriptions`);
    } else {
      // Otherwise, get all push subscriptions from LOGGED-IN USERS ONLY (for new event announcements)
      const { data: allSubscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('user_id, subscription')
        .not('user_id', 'is', null); // Ensure user_id is not null - must be logged-in users

      if (error) {
        console.error('Error fetching push subscriptions:', error);
        return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
      }

      subscriptions = allSubscriptions;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found');
      return NextResponse.json({ message: 'No subscribers to notify' });
    }

    // Fetch event details if eventId is provided to include in notification
    let eventDetails = null;
    if (eventId) {
      try {
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('name, location, date, end_date')
          .eq('id', eventId)
          .single();

        if (!eventError && eventData) {
          eventDetails = eventData;
        }
      } catch (error) {
        console.warn('Failed to fetch event details for notification:', error);
        // Continue without event details - not critical
      }
    }

    // Format date/time for display
    let dateTimeStr = '';
    if (eventDetails) {
      try {
        const eventDate = new Date(eventDetails.date);
        const options: Intl.DateTimeFormatOptions = {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
        dateTimeStr = eventDate.toLocaleDateString('en-US', options);
      } catch (error) {
        console.warn('Failed to format event date:', error);
      }
    }

    // Build enhanced notification body with event details
    let enhancedBody = messageBody;
    if (eventDetails) {
      enhancedBody = `${eventDetails.name}\n📍 ${eventDetails.location}\n📅 ${dateTimeStr}`;
    }

    // Prepare notification payload with enhanced details
    const payload = JSON.stringify({
      title,
      body: enhancedBody,
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
