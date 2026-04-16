import type { User as AuthUser } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DEFAULT_SETTINGS_PREFERENCES,
  loadLocalSettingsPreferences,
  normalizeSettingsPreferences,
  parseSettingsPreferences,
  persistLocalSettingsPreferences,
  type SettingsPreferences,
} from '@/lib/settingsPreferences';
import { supabase, TABLES } from '@/lib/supabase';

export type SettingsSaveState = 'idle' | 'saving' | 'saved' | 'local-only' | 'error';

export interface ProfileSnapshot {
  fullName: string;
  email: string | null;
}

interface UseSettingsPreferencesOptions {
  isOnline: boolean;
  onLoadFallback?: (message: string) => void;
}

interface UseSettingsPreferencesResult {
  user: AuthUser | null;
  profileSnapshot: ProfileSnapshot | null;
  preferences: SettingsPreferences;
  saveState: SettingsSaveState;
  pageReady: boolean;
  updatePreference: <K extends keyof SettingsPreferences>(key: K, value: SettingsPreferences[K]) => void;
}

export function useSettingsPreferences({
  isOnline,
  onLoadFallback,
}: UseSettingsPreferencesOptions): UseSettingsPreferencesResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profileSnapshot, setProfileSnapshot] = useState<ProfileSnapshot | null>(null);
  const [preferences, setPreferences] = useState<SettingsPreferences>(DEFAULT_SETTINGS_PREFERENCES);
  const [saveState, setSaveState] = useState<SettingsSaveState>('idle');
  const [pageReady, setPageReady] = useState(false);

  const hasHydratedPreferencesRef = useRef(false);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      const localPreferences = loadLocalSettingsPreferences(false);

      try {
        const { data } = await supabase.auth.getUser();
        const currentUser = data.user ?? null;
        const basePreferences = loadLocalSettingsPreferences(Boolean(currentUser));
        let nextPreferences = basePreferences;
        let nextProfile: ProfileSnapshot | null = currentUser
          ? {
              fullName:
                (typeof currentUser.user_metadata?.full_name === 'string' && currentUser.user_metadata.full_name) ||
                (typeof currentUser.user_metadata?.name === 'string' && currentUser.user_metadata.name) ||
                'Your account',
              email: currentUser.email ?? null,
            }
          : null;

        if (currentUser) {
          const { data: profileData, error } = await supabase
            .from(TABLES.USERS)
            .select('preferences, full_name, email')
            .eq('id', currentUser.id)
            .single();

          if (error) {
            console.warn('Could not load settings from profile row:', error.message);
          } else {
            const remotePreferences = parseSettingsPreferences(profileData?.preferences, true);
            if (remotePreferences) {
              nextPreferences = normalizeSettingsPreferences({ ...basePreferences, ...remotePreferences }, true);
            }

            nextProfile = {
              fullName: profileData?.full_name || nextProfile?.fullName || 'Your account',
              email: profileData?.email || currentUser.email || null,
            };
          }
        }

        persistLocalSettingsPreferences(nextPreferences);

        if (!isMounted) {
          return;
        }

        setUser(currentUser);
        setProfileSnapshot(nextProfile);
        setPreferences(nextPreferences);
      } catch (authError) {
        console.error('Failed to load settings page context:', authError);
        if (isMounted) {
          setPreferences(localPreferences);
          onLoadFallback?.('We could not load your cloud settings. Using device preferences instead.');
        }
      } finally {
        if (isMounted) {
          setPageReady(true);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;

      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
      if (saveResetRef.current) {
        clearTimeout(saveResetRef.current);
      }
    };
  }, [onLoadFallback]);

  useEffect(() => {
    if (!pageReady) {
      return;
    }

    if (!hasHydratedPreferencesRef.current) {
      hasHydratedPreferencesRef.current = true;
      return;
    }

    try {
      persistLocalSettingsPreferences(preferences);
    } catch (storageError) {
      console.error('Failed to persist settings locally:', storageError);
      setSaveState('error');
      return;
    }

    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }
    if (saveResetRef.current) {
      clearTimeout(saveResetRef.current);
    }

    if (!user?.id || !isOnline) {
      setSaveState(user?.id ? 'local-only' : 'saved');
      saveResetRef.current = setTimeout(() => setSaveState('idle'), 2500);
      return;
    }

    setSaveState('saving');
    saveDebounceRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from(TABLES.USERS)
          .update({
            preferences: JSON.stringify(preferences),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) {
          throw error;
        }

        setSaveState('saved');
      } catch (saveError) {
        console.error('Failed to persist preferences to profile row:', saveError);
        setSaveState('local-only');
      } finally {
        if (saveResetRef.current) {
          clearTimeout(saveResetRef.current);
        }
        saveResetRef.current = setTimeout(() => setSaveState('idle'), 2500);
      }
    }, 500);
  }, [isOnline, pageReady, preferences, user?.id]);

  const updatePreference = useCallback(
    <K extends keyof SettingsPreferences>(key: K, value: SettingsPreferences[K]) => {
      setPreferences((currentPreferences) =>
        normalizeSettingsPreferences(
          {
            ...currentPreferences,
            [key]: value,
          },
          Boolean(user),
        ),
      );
    },
    [user],
  );

  return {
    user,
    profileSnapshot,
    preferences,
    saveState,
    pageReady,
    updatePreference,
  };
}