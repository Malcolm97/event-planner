import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { endpoint, user_id, device_id } = await request.json();

    if (!endpoint && !user_id && !device_id) {
      return NextResponse.json(
        { error: 'Missing endpoint, user_id, or device_id' },
        { status: 400 }
      );
    }

    // Get the user from the auth session (optional)
    const { data: { session } } = await supabase.auth.getSession();
    
    let error;

    if (session) {
      // Logged-in user - delete by user_id
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', session.user.id);
      
      error = deleteError;
    } else if (device_id) {
      // Anonymous PWA user - delete by device_id
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('device_id', device_id);
      
      error = deleteError;
    } else if (endpoint) {
      // Fallback: try to delete by endpoint (stored in subscription JSON)
      // This requires a different approach since it's in JSONB
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('subscription->>endpoint', endpoint);
      
      error = deleteError;
    } else {
      return NextResponse.json(
        { error: 'Unauthorized - either login or provide device_id' },
        { status: 401 }
      );
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to remove subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Subscription removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
