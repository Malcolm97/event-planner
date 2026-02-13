import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Get the user from the auth session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if subscription already exists for this user
    const { data: existingSub } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint')
      .eq('user_id', session.user.id)
      .single();

    let data, error;

    if (existingSub) {
      // Update existing subscription
      const { data: updateData, error: updateError } = await supabase
        .from('push_subscriptions')
        .update({
          subscription: subscription,
          endpoint: subscription.endpoint,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id)
        .select();

      data = updateData;
      error = updateError;
    } else {
      // Insert new subscription
      const { data: insertData, error: insertError } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: session.user.id,
          subscription: subscription,
          endpoint: subscription.endpoint,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      data = insertData;
      error = insertError;
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save subscription', details: error.message },
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
