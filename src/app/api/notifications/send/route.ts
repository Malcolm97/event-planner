import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';
import { getUserFriendlyError } from '@/lib/userMessages';
import { hasVapidConfig, sendPushNotifications } from '@/lib/pushNotifications';

async function checkAdminAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'Not authenticated' };
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

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
  if (authError || !user) {
    return { isAdmin: false, error: 'Not authenticated' };
  }

  const { data: profile, error: profileError } = await supabase
    .from(TABLES.USERS)
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return { isAdmin: false, error: getUserFriendlyError(profileError, 'Unable to verify admin access') };
  }

  return {
    isAdmin: profile?.role === 'admin',
    error: profile?.role === 'admin' ? null : 'Access denied. Admin privileges required.',
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!hasVapidConfig) {
      return NextResponse.json(
        { error: 'Push notification service not configured' },
        { status: 503 }
      );
    }

    const adminCheck = await checkAdminAccess(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error || 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, body: messageBody, url, eventId, targetSubscriptions } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    const result = await sendPushNotifications({
      title,
      body: messageBody,
      url,
      eventId,
      targetSubscriptions,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}