import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { TABLES } from '@/lib/supabase';
import { getUserFriendlyError } from '@/lib/userMessages';

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
    const { subscription, device_id } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    const userId = await getAuthenticatedUserId(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const basePayload = {
      subscription,
      endpoint: subscription.endpoint,
      user_agent: userAgent,
    };

    let existingSub: { id: string } | null = null;

    if (userId) {
      const { data: existingSubs } = await supabase
        .from(TABLES.PUSH_SUBSCRIPTIONS)
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      existingSub = existingSubs && existingSubs.length > 0 ? existingSubs[0] : null;
    } else if (device_id) {
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

    let data;
    let error;

    if (existingSub) {
      if (userId) {
        const result = await supabase
          .from(TABLES.PUSH_SUBSCRIPTIONS)
          .update({
            ...basePayload,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .select()
          .single();

        data = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from(TABLES.PUSH_SUBSCRIPTIONS)
          .update({
            ...basePayload,
            device_id,
            updated_at: new Date().toISOString(),
          })
          .eq('device_id', device_id)
          .select()
          .single();

        data = result.data;
        error = result.error;
      }
    } else {
      const result = await supabase
        .from(TABLES.PUSH_SUBSCRIPTIONS)
        .insert({
          ...basePayload,
          ...(userId ? { user_id: userId } : { device_id }),
        })
        .select()
        .single();

      data = result.data;
      error = result.error;
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
      { status: existingSub ? 200 : 201 }
    );
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: getUserFriendlyError(error, 'Internal server error') },
      { status: 500 }
    );
  }
}