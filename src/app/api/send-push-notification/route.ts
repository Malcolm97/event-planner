import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';
import { getUserFriendlyError } from '@/lib/userMessages';

const webpush = require('web-push');

// Configure VAPID keys - Check for missing configuration
// VAPID_EMAIL should be in format "mailto:email@example.com" or just "email@example.com"
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
  console.log('VAPID configured successfully');
} else {
  console.warn(
    'VAPID keys not fully configured. Push notifications may not work. ' +
    'Please ensure VAPID_EMAIL (with mailto: prefix), VAPID_PRIVATE_KEY, and NEXT_PUBLIC_VAPID_PUBLIC_KEY are set in .env.local'
  );
}

// Helper function to check admin access
async function checkAdminAccess() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { isAdmin: false, error: 'Not authenticated' }
    }

    const { data: userData, error: userError } = await supabase
      .from(TABLES.USERS)
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError) {
      const isUserNotFound = userError.code === 'PGRST116' ||
                               userError.message?.includes('No rows found') ||
                               userError.code === 'PGRST204' ||
                               !userError.code

      if (isUserNotFound) {
        return { isAdmin: false, error: 'We couldn\'t find your profile. Please try signing in again.' }
      } else {
        return { isAdmin: false, error: getUserFriendlyError(userError, 'Something went wrong. Please try again.') }
      }
    }

    return { isAdmin: userData?.role === 'admin', user }
  } catch (error) {
    return { isAdmin: false, error: getUserFriendlyError(error, 'Something unexpected happened. Please try again.') }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify VAPID keys are configured before proceeding
    if (!hasVapidConfig) {
      console.error('VAPID keys not configured');
      return NextResponse.json(
        {
          error: 'Push notification service not configured',
          message: 'VAPID keys are missing. Please configure VAPID_EMAIL, VAPID_PRIVATE_KEY, and NEXT_PUBLIC_VAPID_PUBLIC_KEY in environment variables.',
          success: false
        },
        { status: 503 }
      );
    }

    // Check admin access - only admins can send push notifications
    const adminCheck = await checkAdminAccess()
    
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error || 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

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
      // Get ALL push subscriptions - both logged-in users AND anonymous PWA users
      const { data: allSubscriptions, error } = await supabase
        .from(TABLES.PUSH_SUBSCRIPTIONS)
        .select('id, user_id, device_id, subscription');

      if (error) {
        console.error('Error fetching push subscriptions:', error);
        return NextResponse.json({ error: 'Failed to fetch subscriptions', details: error.message }, { status: 500 });
      }

      subscriptions = allSubscriptions;
      console.log(`Found ${subscriptions.length} total push subscriptions (including anonymous PWA users)`);
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
          .from(TABLES.EVENTS)
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
          return { id: sub.id, userId: sub.user_id, deviceId: sub.device_id, success: true, result };
        } catch (err: any) {
          console.error(`Failed to send notification to subscription ${sub.id}:`, err.message);

          // If subscription is invalid/expired, remove it from database
          // FIXED: Delete by subscription ID, not user_id
          if (err.statusCode === 410 || err.statusCode === 400) {
            await supabase
              .from(TABLES.PUSH_SUBSCRIPTIONS)
              .delete()
              .eq('id', sub.id);
          }

          return { id: sub.id, userId: sub.user_id, deviceId: sub.device_id, success: false, error: err.message };
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
      { error: getUserFriendlyError(error, 'Failed to send push notifications') },
      { status: 500 }
    );
  }
}
