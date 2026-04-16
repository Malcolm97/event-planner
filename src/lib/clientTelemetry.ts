interface ClientTelemetryPayload {
  route: string;
  category: 'error' | 'warning' | 'info';
  message: string;
  details?: Record<string, unknown>;
}

const CATEGORY_SAMPLE_RATE: Record<ClientTelemetryPayload['category'], number> = {
  error: 1,
  warning: 0.5,
  info: 0.2,
};

const THROTTLE_MS = 30 * 1000;
const recentTelemetryKeys = new Map<string, number>();

function shouldSample(category: ClientTelemetryPayload['category']): boolean {
  const rate = CATEGORY_SAMPLE_RATE[category] ?? 1;
  if (rate >= 1) return true;
  return Math.random() <= rate;
}

function isThrottled(payload: ClientTelemetryPayload): boolean {
  const key = `${payload.route}::${payload.category}::${payload.message}`;
  const now = Date.now();
  const lastSeen = recentTelemetryKeys.get(key);

  if (lastSeen && now - lastSeen < THROTTLE_MS) {
    return true;
  }

  recentTelemetryKeys.set(key, now);

  // Basic cleanup to avoid unlimited growth.
  if (recentTelemetryKeys.size > 500) {
    for (const [mapKey, value] of recentTelemetryKeys.entries()) {
      if (now - value > THROTTLE_MS) {
        recentTelemetryKeys.delete(mapKey);
      }
    }
  }

  return false;
}

export async function reportClientTelemetry(payload: ClientTelemetryPayload): Promise<void> {
  try {
    if (!shouldSample(payload.category)) {
      return;
    }

    if (isThrottled(payload)) {
      return;
    }

    const body = JSON.stringify({
      ...payload,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      online: typeof navigator !== 'undefined' ? navigator.onLine : null,
    });

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/client-telemetry', blob);
      return;
    }

    await fetch('/api/client-telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      keepalive: true,
    });
  } catch {
    // Telemetry must never break user flows.
  }
}
