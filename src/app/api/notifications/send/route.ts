import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Configure web-push with VAPID keys - with proper validation
const vapidEmail = process.env.VAPID_EMAIL || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

const hasVapidConfig = vapidEmail && vapidPrivateKey && vapidPublicKey;

if (hasVapidConfig) {
  // Ensure email is in mailto format
  const emailForVapid = vapidEmail.startsWith('mailto:') ? vapidEmail : `mailto:${vapidEmail}`;
  webpush.setVapidDetails(
    emailForVapid,
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('VAPID configured successfully for notifications/send');
} else {
  console.warn(
    'VAPID keys not fully configured in notifications/send. Push notifications may not work.'
  );
}

export async function POST(request: NextRequest) {
  // Check VAPID config before proceeding
  if (!hasVapidConfig) {
    return NextResponse.json(
      { error: 'Push notification service not configured' },
      { status: 503 }
    );
  }
  try {
    const { title, body, icon, badge, tag } = await request.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: title, body' },
        { status: 400 }
      );
    }

    // Get all push subscriptions - use subscription->'endpoint' for JSONB query
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('id, subscription');

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError?.message || fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { message: 'No subscriptions found', successCount: 0, failureCount: 0 },
        { status: 200 }
      );
    }

    const notificationPayload = {
      title,
      body,
      icon: icon || '/icons/icon-192x192.png',
      badge: badge || '/icons/icon-72x72.png',
      tag: tag || 'event-notification',
    };

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    // Send notification to all subscriptions
    for (const sub of subscriptions) {
      try {
        const subscriptionObj = sub.subscription;
        if (!subscriptionObj || !subscriptionObj.endpoint) {
          console.warn('Skipping subscription with missing endpoint:', sub.id);
          failureCount++;
          continue;
        }
        
        await webpush.sendNotification(
          subscriptionObj,
          JSON.stringify(notificationPayload)
        );
        successCount++;
      } catch (error: any) {
        failureCount++;
        // Remove invalid subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
        }
        errors.push(`Failed to send to endpoint: ${error.message}`);
      }
    }

    return NextResponse.json({
      message: 'Notifications sent',
      successCount,
      failureCount,
      errors: failureCount > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}