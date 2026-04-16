import { NextResponse } from 'next/server';
import { getTelemetryHealthSummary } from '@/lib/clientTelemetryStore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minutesParam = searchParams.get('minutes');
    const minutes = minutesParam ? Number.parseInt(minutesParam, 10) : 60;
    const safeMinutes = Number.isFinite(minutes) ? Math.max(5, Math.min(minutes, 24 * 60)) : 60;

    const summary = getTelemetryHealthSummary(safeMinutes);
    return NextResponse.json({ data: summary }, { status: 200 });
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to build telemetry health summary:', error);
    }
    return NextResponse.json({ error: 'Failed to load telemetry health summary' }, { status: 500 });
  }
}
