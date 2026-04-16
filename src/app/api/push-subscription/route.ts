import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase, TABLES } from '@/lib/supabase';

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const supabaseAuth = createClient(
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

  const { data: { user }, error } = await supabaseAuth.auth.getUser();
  if (error || !user) {
    return null;
  }

  return user;
}

// GET - Retrieve user's push subscription
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from(TABLES.PUSH_SUBSCRIPTIONS)
      .select('subscription, created_at, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    return NextResponse.json({
      subscription: data?.subscription || null,
      created_at: data?.created_at || null,
      updated_at: data?.updated_at || null,
    });
  } catch (error: any) {
    console.error('Unexpected error fetching push subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Save or update user's push subscription
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription, userAgent } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription data. Must include endpoint and keys.' },
        { status: 400 }
      );
    }

    const response = await fetch(new URL('/api/notifications/subscribe', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: request.headers.get('authorization') as string,
        'user-agent': userAgent || request.headers.get('user-agent') || 'unknown',
      },
      body: JSON.stringify({ subscription }),
    });

    const responseData = await response.json().catch(() => null);
    return NextResponse.json(responseData || { success: response.ok }, { status: response.status });
  } catch (error: any) {
    console.error('Unexpected error saving push subscription:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE - Remove user's push subscription
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(new URL('/api/notifications/unsubscribe', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: request.headers.get('authorization') as string,
      },
      body: JSON.stringify({ endpoint: request.nextUrl.searchParams.get('endpoint') || undefined }),
    });

    const responseData = await response.json().catch(() => null);
    return NextResponse.json(responseData || { success: response.ok }, { status: response.status });
  } catch (error: any) {
    console.error('Unexpected error deleting push subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
