export type LandingPreference = 'home' | 'events' | 'categories' | 'dashboard';

export interface SettingsPreferences {
  autoSync: boolean;
  landing: LandingPreference;
  offlineNotif: boolean;
}

export const SETTINGS_STORAGE_KEYS = {
  autoSync: 'autoSync',
  landing: 'landing',
  offlineNotif: 'offlineNotif',
} as const;

export const DEFAULT_SETTINGS_PREFERENCES: SettingsPreferences = {
  autoSync: true,
  landing: 'home',
  offlineNotif: true,
};

const LANDING_OPTIONS: LandingPreference[] = ['home', 'events', 'categories', 'dashboard'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeLanding(value: unknown, canUseDashboard: boolean): LandingPreference {
  if (typeof value !== 'string' || !LANDING_OPTIONS.includes(value as LandingPreference)) {
    return canUseDashboard ? DEFAULT_SETTINGS_PREFERENCES.landing : 'home';
  }

  if (value === 'dashboard' && !canUseDashboard) {
    return 'home';
  }

  return value as LandingPreference;
}

export function normalizeSettingsPreferences(
  source: Partial<SettingsPreferences> | null | undefined,
  canUseDashboard: boolean,
): SettingsPreferences {
  return {
    autoSync: typeof source?.autoSync === 'boolean' ? source.autoSync : DEFAULT_SETTINGS_PREFERENCES.autoSync,
    landing: normalizeLanding(source?.landing, canUseDashboard),
    offlineNotif:
      typeof source?.offlineNotif === 'boolean' ? source.offlineNotif : DEFAULT_SETTINGS_PREFERENCES.offlineNotif,
  };
}

export function parseSettingsPreferences(
  source: unknown,
  canUseDashboard: boolean,
): SettingsPreferences | null {
  if (!source) {
    return null;
  }

  let parsedSource = source;

  if (typeof source === 'string') {
    try {
      parsedSource = JSON.parse(source);
    } catch {
      return null;
    }
  }

  if (!isRecord(parsedSource)) {
    return null;
  }

  return normalizeSettingsPreferences(parsedSource as Partial<SettingsPreferences>, canUseDashboard);
}

export function loadLocalSettingsPreferences(canUseDashboard: boolean): SettingsPreferences {
  if (typeof window === 'undefined') {
    return normalizeSettingsPreferences(DEFAULT_SETTINGS_PREFERENCES, canUseDashboard);
  }

  return normalizeSettingsPreferences(
    {
      autoSync: localStorage.getItem(SETTINGS_STORAGE_KEYS.autoSync) !== 'false',
      landing: (localStorage.getItem(SETTINGS_STORAGE_KEYS.landing) as SettingsPreferences['landing'] | null) ??
        DEFAULT_SETTINGS_PREFERENCES.landing,
      offlineNotif: localStorage.getItem(SETTINGS_STORAGE_KEYS.offlineNotif) !== 'false',
    },
    canUseDashboard,
  );
}

export function persistLocalSettingsPreferences(preferences: SettingsPreferences): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(SETTINGS_STORAGE_KEYS.autoSync, String(preferences.autoSync));
  localStorage.setItem(SETTINGS_STORAGE_KEYS.landing, preferences.landing);
  localStorage.setItem(SETTINGS_STORAGE_KEYS.offlineNotif, String(preferences.offlineNotif));
}