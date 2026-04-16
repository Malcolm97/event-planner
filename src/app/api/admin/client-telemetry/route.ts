import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { TABLES } from '@/lib/supabase';
import { getTelemetryEvents, TelemetryCategory } from '@/lib/clientTelemetryStore';

async function hasAdminAccess() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return false;
  }

  const { data: profile, error: profileError } = await supabase
    .from(TABLES.PROFILES)
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return false;
  }

  return profile.role === 'admin';
}

export async function GET(request: Request) {
  try {
    const isAdmin = await hasAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const categoryParam = searchParams.get('category');
    const routeParam = searchParams.get('route');
    const minutesParam = searchParams.get('minutes');

    const limit = limitParam ? Number.parseInt(limitParam, 10) : 100;
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 500)) : 100;

    const minutes = minutesParam ? Number.parseInt(minutesParam, 10) : 180;
    const safeMinutes = Number.isFinite(minutes) ? Math.max(5, Math.min(minutes, 24 * 60)) : 180;

    const category = (categoryParam === 'error' || categoryParam === 'warning' || categoryParam === 'info')
      ? categoryParam as TelemetryCategory
      : undefined;

    const events = getTelemetryEvents({
      limit: safeLimit,
      category,
      route: routeParam || undefined,
      sinceMinutes: safeMinutes,
    });

    return NextResponse.json({
      data: events,
      meta: {
        count: events.length,
        limit: safeLimit,
        minutes: safeMinutes,
        category: category || null,
        route: routeParam || null,
      },
    }, { status: 200 });
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to fetch admin telemetry:', error);
    }
    return NextResponse.json({ error: 'Failed to fetch telemetry' }, { status: 500 });
  }
}
