export type TelemetryCategory = 'error' | 'warning' | 'info';

export interface TelemetryEvent {
  route: string;
  category: TelemetryCategory;
  message: string;
  details: Record<string, unknown>;
  timestamp: string;
  userAgent: string;
  online: boolean | null;
}

const MAX_EVENTS = 1000;
const telemetryEvents: TelemetryEvent[] = [];

export function addTelemetryEvent(event: TelemetryEvent): void {
  telemetryEvents.push(event);
  if (telemetryEvents.length > MAX_EVENTS) {
    telemetryEvents.splice(0, telemetryEvents.length - MAX_EVENTS);
  }
}

interface GetEventsOptions {
  limit?: number;
  category?: TelemetryCategory;
  route?: string;
  sinceMinutes?: number;
}

export function getTelemetryEvents(options: GetEventsOptions = {}): TelemetryEvent[] {
  const {
    limit = 100,
    category,
    route,
    sinceMinutes,
  } = options;

  const since = typeof sinceMinutes === 'number'
    ? Date.now() - sinceMinutes * 60 * 1000
    : null;

  const filtered = telemetryEvents.filter((event) => {
    if (category && event.category !== category) return false;
    if (route && event.route !== route) return false;
    if (since && new Date(event.timestamp).getTime() < since) return false;
    return true;
  });

  return filtered.slice(-Math.max(1, Math.min(limit, 500))).reverse();
}

export function getTelemetryHealthSummary(sinceMinutes = 60) {
  const recentEvents = getTelemetryEvents({ limit: 500, sinceMinutes });

  const creatorProfileEvents = recentEvents.filter((event) =>
    event.route === '/creators' || event.route === '/profile/[uid]'
  );

  const errors = creatorProfileEvents.filter((event) => event.category === 'error').length;
  const warnings = creatorProfileEvents.filter((event) => event.category === 'warning').length;
  const infos = creatorProfileEvents.filter((event) => event.category === 'info').length;

  let status: 'good' | 'fair' | 'poor' = 'good';
  if (errors >= 5) {
    status = 'poor';
  } else if (errors > 0 || warnings >= 5) {
    status = 'fair';
  }

  return {
    status,
    windowMinutes: sinceMinutes,
    totals: {
      tracked: creatorProfileEvents.length,
      errors,
      warnings,
      infos,
    },
    updatedAt: new Date().toISOString(),
  };
}
