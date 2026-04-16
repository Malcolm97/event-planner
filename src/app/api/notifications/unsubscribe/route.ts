import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { TABLES } from '@/lib/supabase';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getAuthenticatedUserId(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) {
    return null;
  }

  return user.id;
}

export async function POST(request: NextRequest) {
  try {
    const { endpoint, device_id } = await request.json();

    if (!endpoint && !device_id) {
      return NextResponse.json(
        { error: 'Missing endpoint or device_id' },
        { status: 400 }
      );
    }

    const userId = await getAuthenticatedUserId(request);
    let error;

    if (userId) {
      const result = await supabase
        .from(TABLES.PUSH_SUBSCRIPTIONS)
        .delete()
        .eq('user_id', userId);

      error = result.error;
    } else if (device_id) {
      const result = await supabase
        .from(TABLES.PUSH_SUBSCRIPTIONS)
        .delete()
        .eq('device_id', device_id);

      error = result.error;
    } else if (endpoint) {
      const result = await supabase
        .from(TABLES.PUSH_SUBSCRIPTIONS)
        .delete()
        .eq('endpoint', endpoint);

      error = result.error;
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
