import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { TABLES } from '@/lib/supabase';
import { getUserFriendlyError } from '@/lib/userMessages';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { subscription, device_id } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Get the user from the auth session (optional - can be logged in or anonymous)
    const { data: { session } } = await supabase.auth.getSession();
    
    // FIX: Get user agent from request headers (server-side safe)
    // navigator.userAgent is undefined on server-side
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    let dbData: any = {
      subscription: subscription,
      user_agent: userAgent
    };

    let existingSub = null;

    if (session) {
      // Logged-in user - save with user_id
      dbData.user_id = session.user.id;
      
      // Check if subscription already exists for this user
      const { data: existingSubs } = await supabase
        .from(TABLES.PUSH_SUBSCRIPTIONS)
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1);

      existingSub = existingSubs && existingSubs.length > 0 ? existingSubs[0] : null;
    } else if (device_id) {
      // Anonymous PWA user - save with device_id
      dbData.device_id = device_id;
      
      // Check if subscription already exists for this device
      const { data: existingSubs } = await supabase
        .from(TABLES.PUSH_SUBSCRIPTIONS)
        .select('id')
        .eq('device_id', device_id)
        .limit(1);

      existingSub = existingSubs && existingSubs.length > 0 ? existingSubs[0] : null;
    } else {
      // No session and no device_id - require one or the other
      return NextResponse.json(
        { error: 'Unauthorized - either login or provide device_id for anonymous subscription' },
        { status: 401 }
      );
    }

    let data, error;

    if (existingSub) {
      // Update existing subscription
      if (session) {
        const { data: updateData, error: updateError } = await supabase
          .from(TABLES.PUSH_SUBSCRIPTIONS)
          .update({
            subscription: subscription,
            user_agent: userAgent,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.user.id)
          .select()
          .single();

        data = updateData;
        error = updateError;
      } else {
        const { data: updateData, error: updateError } = await supabase
          .from(TABLES.PUSH_SUBSCRIPTIONS)
          .update({
            subscription: subscription,
            user_agent: userAgent,
            updated_at: new Date().toISOString()
          })
          .eq('device_id', device_id)
          .select()
          .single();

        data = updateData;
        error = updateError;
      }
    } else {
      // Insert new subscription
      const { data: insertData, error: insertError } = await supabase
        .from(TABLES.PUSH_SUBSCRIPTIONS)
        .insert(dbData)
        .select();

      data = insertData;
      error = insertError;
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: getUserFriendlyError(error, 'Failed to save subscription') },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Subscription saved successfully', data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: getUserFriendlyError(error, 'Internal server error') },
      { status: 500 }
    );
  }
}