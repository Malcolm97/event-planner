import { NextResponse } from 'next/server';
import { addTelemetryEvent } from '@/lib/clientTelemetryStore';

interface TelemetryBody {
  route?: string;
  category?: 'error' | 'warning' | 'info';
  message?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  userAgent?: string;
  online?: boolean | null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TelemetryBody;

    if (!body?.route || !body?.category || !body?.message) {
      return NextResponse.json({ error: 'Invalid telemetry payload' }, { status: 400 });
    }

    const telemetry = {
      route: body.route,
      category: body.category,
      message: body.message,
      details: body.details || {},
      timestamp: body.timestamp || new Date().toISOString(),
      userAgent: body.userAgent || 'unknown',
      online: typeof body.online === 'boolean' ? body.online : null,
    };

    addTelemetryEvent(telemetry);

    if (process.env.NODE_ENV === 'development') {
      console.log('[client-telemetry]', telemetry);
    } else if (telemetry.category === 'error') {
      console.error('[client-telemetry]', telemetry);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to receive client telemetry:', error);
    }
    return NextResponse.json({ error: 'Failed to process telemetry' }, { status: 500 });
  }
}
