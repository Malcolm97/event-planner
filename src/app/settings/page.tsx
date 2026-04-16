"use client";

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCircle,
  Database,
  Download,
  Grid3X3,
  Home,
  Info,
  MessageSquare,
  Monitor,
  Moon,
  RefreshCw,
  Settings,
  Sparkles,
  Sun,
  User,
  Wifi,
} from 'lucide-react';

import AppFooter from '@/components/AppFooter';
import Button from '@/components/Button';
import CustomSelect from '@/components/CustomSelect';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { useTheme } from '@/context/ThemeContext';
import { useUpdate } from '@/context/UpdateContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSettingsPreferences, type SettingsSaveState } from '@/hooks/useSettingsPreferences';
import {
  clearAllData,
  clearEventsCacheOnly,
  clearOfflineQueueOnly,
  clearServiceWorkerCaches,
  getCacheStats,
  getSyncStatus,
  type CacheStats,
  updateSyncStatus,
} from '@/lib/indexedDB';
import {
  type LandingPreference,
} from '@/lib/settingsPreferences';

type ClearTarget = 'all' | 'events' | 'queue' | 'sw-cache' | null;
type StatusTone = 'success' | 'error' | 'info' | 'warning';

interface InlineStatus {
  tone: StatusTone;
  message: string;
}

const sectionMotion = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay },
});

function formatRelativeSync(lastSync: number | null): string {
  if (!lastSync) {
    return 'Not synced yet';
  }

  return new Date(lastSync).toLocaleString();
}

function formatStorageSummary(stats: CacheStats | null): string {
  if (!stats) {
    return 'Loading storage estimate...';
  }

  if (!stats.storageAvailable) {
    return 'Storage estimate unavailable';
  }

  const percentage = Math.round((stats.storageUsed / stats.storageAvailable) * 100);
  return `${percentage}% of local storage estimate used`;
}

function getDeviceLabel(): string {
  if (typeof window === 'undefined') {
    return 'Unknown device';
  }

  const userAgentData = (navigator as Navigator & { userAgentData?: { platform?: string; brands?: Array<{ brand: string }> } }).userAgentData;
  const brand = userAgentData?.brands?.[0]?.brand;
  const platform = userAgentData?.platform || navigator.platform;

  if (brand && platform) {
    return `${brand} on ${platform}`;
  }

  return platform || 'Browser device';
}

function getPushDescription(
  isSupported: boolean,
  isPwa: boolean,
  isSubscribed: boolean,
  permission: NotificationPermission,
): string {
  if (!isSupported) {
    return 'This browser does not support push notifications.';
  }

  if (!isPwa) {
    return 'Install the app to receive push notifications for newly published events.';
  }

  if (isSubscribed) {
    return 'You will receive alerts when new events are published.';
  }

  if (permission === 'denied') {
    return 'Notifications are blocked in your browser settings.';
  }

  return 'Enable push notifications to stay informed about new events.';
}

function getSaveBannerMessage(saveState: SettingsSaveState): string {
  switch (saveState) {
    case 'saving':
      return 'Saving preferences...';
    case 'saved':
      return 'Preferences saved';
    case 'local-only':
      return 'Saved on this device. Cloud sync will retry later.';
    case 'error':
      return 'Could not save preferences';
    default:
      return '';
  }
}

function SectionCard({
  title,
  description,
  icon,
  delay,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      {...sectionMotion(delay)}
      className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-7 dark:border-slate-700 dark:bg-slate-800/90"
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-700/70 dark:text-slate-100">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.section>
  );
}

function PreferenceRow({
  icon,
  title,
  description,
  children,
  muted = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 sm:px-5 ${
        muted
          ? 'border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/20'
          : 'border-slate-200 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-900/40'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-slate-600 dark:text-slate-300">{icon}</div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{title}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
          </div>
        </div>
        <div className="sm:ml-4">{children}</div>
      </div>
    </div>
  );
}

function InlineFeedback({ status }: { status: InlineStatus | null }) {
  if (!status) {
    return null;
  }

  const toneClasses: Record<StatusTone, string> = {
    success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-200',
    error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200',
    info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200',
  };

  const Icon = status.tone === 'success' ? CheckCircle : AlertCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${toneClasses[status.tone]}`}
    >
      <Icon className="h-4 w-4" />
      <span>{status.message}</span>
    </motion.div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-28 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-72 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-80 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800 lg:col-span-2" />
        </div>
      </div>
      <AppFooter />
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { isOnline, refreshEventsCache } = useNetworkStatus();
  const { queueLength, failedOperationsCount, isProcessingQueue, syncError, syncNow, updateQueueLength } = useOfflineSync();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const {
    currentVersion,
    currentBuildTimestamp,
    serverVersion,
    updateAvailable,
    isChecking: isUpdateChecking,
    lastChecked: updateLastChecked,
    error: updateError,
    checkForUpdate,
    applyUpdate,
  } = useUpdate();
  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    permission: pushPermission,
    isLoading: pushLoading,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
  } = usePushNotifications();

  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [isPWA, setIsPWA] = useState(false);
  const [deviceLabel, setDeviceLabel] = useState('Unknown device');
  const [clearing, setClearing] = useState(false);
  const [clearTarget, setClearTarget] = useState<ClearTarget>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);
  const [updateAction, setUpdateAction] = useState<'idle' | 'checking' | 'applying'>('idle');
  const [syncFeedback, setSyncFeedback] = useState<InlineStatus | null>(null);
  const [updateFeedback, setUpdateFeedback] = useState<InlineStatus | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<InlineStatus | null>(null);

  const syncFeedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateFeedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorFeedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshCacheStats = useCallback(async () => {
    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
    } catch (cacheError) {
      console.error('Failed to load cache stats:', cacheError);
    }
  }, []);

  const setTimedError = useCallback((message: string, timeout = 5000) => {
    setErrorFeedback({ tone: 'error', message });
    if (errorFeedbackRef.current) {
      clearTimeout(errorFeedbackRef.current);
    }
    errorFeedbackRef.current = setTimeout(() => setErrorFeedback(null), timeout);
  }, []);

  const {
    user,
    profileSnapshot,
    preferences,
    saveState,
    pageReady,
    updatePreference,
  } = useSettingsPreferences({
    isOnline,
    onLoadFallback: setTimedError,
  });

  const setTimedSyncFeedback = useCallback((status: InlineStatus, timeout = 4000) => {
    setSyncFeedback(status);
    if (syncFeedbackRef.current) {
      clearTimeout(syncFeedbackRef.current);
    }
    syncFeedbackRef.current = setTimeout(() => setSyncFeedback(null), timeout);
  }, []);

  const setTimedUpdateFeedback = useCallback((status: InlineStatus, timeout = 5000) => {
    setUpdateFeedback(status);
    if (updateFeedbackRef.current) {
      clearTimeout(updateFeedbackRef.current);
    }
    updateFeedbackRef.current = setTimeout(() => setUpdateFeedback(null), timeout);
  }, []);

  useEffect(() => {
    const checkPWAMode = () => {
      const standaloneMatch = window.matchMedia('(display-mode: standalone)').matches;
      const fullscreenMatch = window.matchMedia('(display-mode: fullscreen)').matches;
      const minimalUiMatch = window.matchMedia('(display-mode: minimal-ui)').matches;
      const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsPWA(standaloneMatch || fullscreenMatch || minimalUiMatch || iosStandalone);
    };

    setDeviceLabel(getDeviceLabel());
    checkPWAMode();

    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    standaloneQuery.addEventListener('change', checkPWAMode);
    window.addEventListener('focus', checkPWAMode);

    return () => {
      standaloneQuery.removeEventListener('change', checkPWAMode);
      window.removeEventListener('focus', checkPWAMode);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSyncState = async () => {
      try {
        const syncStatus = await getSyncStatus();
        if (isMounted) {
          setLastSync(syncStatus?.lastSync ?? null);
        }
      } catch (syncStatusError) {
        console.error('Failed to load sync status:', syncStatusError);
      }
    };

    loadSyncState();
    refreshCacheStats();

    const handleStatsRefresh = () => {
      refreshCacheStats();
    };

    window.addEventListener('offline-queue-updated', handleStatsRefresh);
    window.addEventListener('cache-refreshed', handleStatsRefresh as EventListener);

    return () => {
      isMounted = false;
      window.removeEventListener('offline-queue-updated', handleStatsRefresh);
      window.removeEventListener('cache-refreshed', handleStatsRefresh as EventListener);

      if (syncFeedbackRef.current) {
        clearTimeout(syncFeedbackRef.current);
      }
      if (updateFeedbackRef.current) {
        clearTimeout(updateFeedbackRef.current);
      }
      if (errorFeedbackRef.current) {
        clearTimeout(errorFeedbackRef.current);
      }
    };
  }, [refreshCacheStats]);

  const handleClearCacheClick = (target: ClearTarget) => {
    setClearTarget(target);
    setShowConfirmDialog(true);
  };

  const handleConfirmClearCache = async () => {
    setShowConfirmDialog(false);
    setClearing(true);
    setErrorFeedback(null);

    try {
      if (clearTarget === 'all') {
        await clearAllData();
        await clearServiceWorkerCaches();
        setLastSync(null);
      } else if (clearTarget === 'events') {
        await clearEventsCacheOnly();
      } else if (clearTarget === 'queue') {
        await clearOfflineQueueOnly();
      } else if (clearTarget === 'sw-cache') {
        await clearServiceWorkerCaches();
      }

      await updateQueueLength();
      await refreshCacheStats();
      setTimedSyncFeedback({ tone: 'success', message: `${getClearTargetLabel(clearTarget)} cleared successfully.` });
    } catch (clearError) {
      console.error('Failed to clear selected cache target:', clearError);
      setTimedError(clearError instanceof Error ? clearError.message : 'Failed to clear local data.');
    } finally {
      setClearing(false);
      setClearTarget(null);
    }
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      setTimedSyncFeedback({ tone: 'warning', message: 'Reconnect to sync your cached data.' });
      return;
    }

    setSyncingNow(true);
    setErrorFeedback(null);

    try {
      await refreshEventsCache();
      await syncNow();

      const timestamp = Date.now();
      await updateSyncStatus({
        lastSync: timestamp,
        inProgress: false,
      });

      setLastSync(timestamp);
      await updateQueueLength();
      await refreshCacheStats();
      setTimedSyncFeedback({ tone: 'success', message: 'Sync completed successfully.' });
    } catch (syncNowError) {
      console.error('Manual sync failed:', syncNowError);
      const message = syncNowError instanceof Error ? syncNowError.message : 'Sync failed. Please try again.';

      await updateSyncStatus({
        lastSync: Date.now(),
        inProgress: false,
        error: message,
      });

      setTimedSyncFeedback({ tone: 'error', message });
      setTimedError(message);
    } finally {
      setSyncingNow(false);
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    setErrorFeedback(null);

    try {
      if (enabled) {
        await subscribeToPush();
        setTimedSyncFeedback({ tone: 'success', message: 'Push notifications enabled.' });
      } else {
        await unsubscribeFromPush();
        setTimedSyncFeedback({ tone: 'info', message: 'Push notifications disabled.' });
      }
    } catch (pushError) {
      console.error('Push notification update failed:', pushError);
      const message = pushError instanceof Error ? pushError.message : 'Failed to update notification settings.';

      if (message.includes('VAPID')) {
        setTimedError('Push notifications are not configured correctly. Check the VAPID environment variables.');
        return;
      }

      if (message.toLowerCase().includes('permission')) {
        setTimedError('Allow notification permission in your browser settings to enable push alerts.');
        return;
      }

      setTimedError(message);
    }
  };

  const handleCheckForUpdates = async () => {
    setUpdateAction('checking');

    try {
      const hasUpdate = await checkForUpdate();
      if (hasUpdate) {
        setTimedUpdateFeedback({ tone: 'info', message: 'A newer version is available. Update when ready.' });
      } else {
        setTimedUpdateFeedback({ tone: 'success', message: 'You already have the latest version.' });
      }
    } catch (updateCheckError) {
      console.error('Update check failed:', updateCheckError);
      setTimedUpdateFeedback({ tone: 'error', message: 'Failed to check for updates.' });
    } finally {
      setUpdateAction('idle');
    }
  };

  const handleApplyUpdate = async () => {
    setUpdateAction('applying');
    try {
      await applyUpdate();
    } catch (applyError) {
      console.error('Failed to apply update:', applyError);
      setTimedUpdateFeedback({ tone: 'error', message: 'Failed to apply update. Reload and try again.' });
      setUpdateAction('idle');
    }
  };

  const landingOptions = [
    { value: 'home', label: 'Home', icon: '🏠' },
    { value: 'events', label: 'Events', icon: '📅' },
    { value: 'categories', label: 'Categories', icon: '📂' },
    ...(user ? [{ value: 'dashboard', label: 'Dashboard', icon: '📊' }] : []),
  ];

  const saveBannerMessage = getSaveBannerMessage(saveState);
  const queueSummary = `${queueLength} pending${failedOperationsCount > 0 ? ` • ${failedOperationsCount} failed` : ''}`;
  const cacheSummary = cacheStats
    ? `${cacheStats.eventsCount} cached event${cacheStats.eventsCount === 1 ? '' : 's'}`
    : 'Loading cache stats...';
  const storageSummary = formatStorageSummary(cacheStats);
  const pushDescription = getPushDescription(pushSupported, isPWA, pushSubscribed, pushPermission);
  const saveBannerToneClass =
    saveState === 'error'
      ? 'bg-red-50 text-red-700 dark:bg-red-950/80 dark:text-red-200'
      : saveState === 'local-only'
        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-200'
        : 'bg-green-50 text-green-700 dark:bg-green-950/80 dark:text-green-200';

  if (!pageReady) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_52%,_#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.08),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_48%,_#020617_100%)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <button onClick={() => router.back()} className="back-button self-start" aria-label="Back" type="button">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-7 dark:border-slate-700 dark:bg-slate-900/80"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">Control Center</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Settings</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
                Tune appearance, notifications, offline sync, and account shortcuts from one place. Changes save locally right away and sync to your profile when you are online.
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {isOnline ? 'Online' : 'Offline'}
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  Theme: {theme === 'system' ? `System (${resolvedTheme})` : theme}
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  Last sync: {formatRelativeSync(lastSync)}
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{profileSnapshot?.fullName || 'Guest mode'}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{profileSnapshot?.email || 'Local preferences only'}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900/80">
                  <p className="text-slate-500 dark:text-slate-400">Sync queue</p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-white">{queueLength}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900/80">
                  <p className="text-slate-500 dark:text-slate-400">Cached events</p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-white">{cacheStats?.eventsCount ?? '...'}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <AnimatePresence>
          {errorFeedback && <InlineFeedback status={errorFeedback} />}
        </AnimatePresence>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="space-y-6">
            <SectionCard
              delay={0.05}
              title="Appearance"
              description="Choose how the app looks and where it opens when you come back."
              icon={<Settings className="h-5 w-5" />}
            >
              <PreferenceRow
                icon={theme === 'light' ? <Sun className="h-5 w-5 text-amber-500" /> : theme === 'dark' ? <Moon className="h-5 w-5 text-blue-500" /> : <Monitor className="h-5 w-5 text-slate-500" />}
                title="Theme"
                description={theme === 'system' ? 'Following your device preference.' : `Currently using ${theme} mode.`}
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      theme === 'light'
                        ? 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/60 dark:bg-amber-500/15 dark:text-amber-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      theme === 'dark'
                        ? 'border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-500/60 dark:bg-blue-500/15 dark:text-blue-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      theme === 'system'
                        ? 'border-slate-400 bg-slate-200 text-slate-900 dark:border-slate-500 dark:bg-slate-600/60 dark:text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    System
                  </button>
                </div>
              </PreferenceRow>

              <PreferenceRow icon={<Home className="h-5 w-5 text-emerald-600" />} title="Landing page" description="Pick the first screen you want to see when you open the app.">
                <div className="min-w-[220px]">
                  <CustomSelect
                    options={landingOptions}
                    value={preferences.landing}
                    onChange={(value) => updatePreference('landing', value as LandingPreference)}
                    placeholder="Select landing page"
                  />
                </div>
              </PreferenceRow>

              <PreferenceRow
                icon={<Monitor className="h-5 w-5 text-slate-500" />}
                title="Regional support"
                description="Language selection is not wired yet, so this page makes that status explicit instead of looking interactive."
                muted={true}
              >
                <div className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                  English only for now
                </div>
              </PreferenceRow>
            </SectionCard>

            <SectionCard
              delay={0.1}
              title="Notifications"
              description="Manage app alerts and clarify what is available on this device."
              icon={<Bell className="h-5 w-5" />}
            >
              <PreferenceRow
                icon={<Bell className={`h-5 w-5 ${pushSubscribed ? 'text-emerald-600' : 'text-slate-500'}`} />}
                title="Push notifications"
                description={pushDescription}
                muted={!pushSupported || !isPWA}
              >
                <input
                  type="checkbox"
                  checked={pushSubscribed}
                  disabled={pushLoading || (!isPWA && !pushSubscribed) || (pushPermission === 'denied' && !pushSubscribed) || !pushSupported}
                  onChange={(event) => handlePushToggle(event.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
                />
              </PreferenceRow>

              <PreferenceRow
                icon={<Wifi className={`h-5 w-5 ${preferences.offlineNotif ? 'text-emerald-600' : 'text-slate-400'}`} />}
                title="Connection alerts"
                description="Show notifications when the app goes offline or reconnects."
              >
                <input
                  type="checkbox"
                  checked={preferences.offlineNotif}
                  onChange={(event) => updatePreference('offlineNotif', event.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
                />
              </PreferenceRow>

              <AnimatePresence>
                {syncFeedback && <InlineFeedback status={syncFeedback} />}
              </AnimatePresence>
            </SectionCard>

            <SectionCard
              delay={0.15}
              title="Data & sync"
              description="Monitor the offline queue, refresh local caches, and run a manual sync when needed."
              icon={<Database className="h-5 w-5" />}
            >
              <PreferenceRow
                icon={<RefreshCw className="h-5 w-5 text-blue-600" />}
                title="Auto sync"
                description="Keep your cached data and queued actions aligned in the background."
              >
                <input
                  type="checkbox"
                  checked={preferences.autoSync}
                  onChange={(event) => updatePreference('autoSync', event.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
                />
              </PreferenceRow>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSyncNow}
                  disabled={syncingNow || !isOnline}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-400"
                >
                  {syncingNow ? <RefreshCw className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                  {syncingNow ? 'Syncing...' : 'Sync now'}
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sync queue</p>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{queueSummary}</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {syncingNow || isProcessingQueue ? 'Sync in progress now.' : isOnline ? 'Will retry on next sync.' : 'Will retry when you reconnect.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Offline cache</p>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{cacheSummary}</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {cacheStats?.lastCacheTime ? `Updated ${new Date(cacheStats.lastCacheTime).toLocaleString()}` : 'No cache timestamp yet.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Storage</p>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{storageSummary}</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Offline cache plus queued operations stored locally.</p>
                </div>
              </div>

              {(syncError || failedOperationsCount > 0) && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                  <p className="font-semibold">Sync attention needed</p>
                  <p className="mt-1">{syncError || `${failedOperationsCount} failed operation${failedOperationsCount === 1 ? '' : 's'} waiting to be retried.`}</p>
                </div>
              )}

              <div>
                <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">Clear specific caches:</p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => handleClearCacheClick('events')} disabled={clearing} variant="secondary" className="text-sm">
                    Events cache
                  </Button>
                  <Button onClick={() => handleClearCacheClick('queue')} disabled={clearing} variant="secondary" className="text-sm">
                    Offline queue
                  </Button>
                  <Button onClick={() => handleClearCacheClick('sw-cache')} disabled={clearing} variant="secondary" className="text-sm">
                    Service worker cache
                  </Button>
                  <Button onClick={() => handleClearCacheClick('all')} disabled={clearing} className="bg-red-600 text-white hover:bg-red-700">
                    Clear all
                  </Button>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            {user && (
              <SectionCard
                delay={0.2}
                title="Account"
                description="Jump to profile and password tasks without leaving your current workflow."
                icon={<User className="h-5 w-5" />}
              >
                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <Button asChild variant="secondary" className="min-h-[84px] w-full justify-start rounded-2xl border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-left text-slate-900 hover:from-blue-100 hover:to-blue-200 dark:border-blue-800 dark:from-blue-950/30 dark:to-blue-900/20 dark:text-white">
                    <Link href="/dashboard/edit-profile" className="flex h-full w-full items-center gap-3">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                      <div>
                        <p className="font-medium">Edit profile</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">Update personal and contact details</p>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="secondary" className="min-h-[84px] w-full justify-start rounded-2xl border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 text-left text-slate-900 hover:from-orange-100 hover:to-orange-200 dark:border-orange-800 dark:from-orange-950/30 dark:to-orange-900/20 dark:text-white">
                    <Link href="/dashboard/update-password" className="flex h-full w-full items-center gap-3">
                      <Settings className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                      <div>
                        <p className="font-medium">Change password</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">Keep your account secure</p>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="secondary" className="min-h-[84px] w-full justify-start rounded-2xl border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 text-left text-slate-900 hover:from-emerald-100 hover:to-emerald-200 dark:border-emerald-800 dark:from-emerald-950/30 dark:to-emerald-900/20 dark:text-white">
                    <Link href="/dashboard" className="flex h-full w-full items-center gap-3">
                      <Grid3X3 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                      <div>
                        <p className="font-medium">Dashboard</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">Return to your event workspace</p>
                      </div>
                    </Link>
                  </Button>
                </div>
              </SectionCard>
            )}

            <SectionCard
              delay={0.25}
              title="App info"
              description="Check version state, device info, and refresh the installed build when a newer release is available."
              icon={<Info className="h-5 w-5" />}
            >
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Current version</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">v{currentVersion} • build {currentBuildTimestamp}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Server version</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{serverVersion ? `v${serverVersion.version}` : 'Unavailable right now'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Last checked</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{updateLastChecked ? new Date(updateLastChecked).toLocaleString() : 'Not checked yet'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Device</p>
                  <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">{deviceLabel}</p>
                </div>
              </div>

              {updateAvailable && (
                <Button onClick={handleApplyUpdate} disabled={updateAction === 'applying'} className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
                  {updateAction === 'applying' ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                  {updateAction === 'applying' ? 'Updating...' : 'Update now'}
                </Button>
              )}

              <Button
                onClick={handleCheckForUpdates}
                disabled={updateAction === 'checking' || isUpdateChecking || updateAction === 'applying'}
                variant={updateAvailable ? 'secondary' : 'primary'}
                className={`w-full ${
                  updateAvailable
                    ? 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600'
                    : 'text-white'
                }`}
              >
                {updateAction === 'checking' || isUpdateChecking ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                {updateAction === 'checking' || isUpdateChecking ? 'Checking...' : 'Check for updates'}
              </Button>

              <AnimatePresence>
                {updateFeedback && <InlineFeedback status={updateFeedback} />}
              </AnimatePresence>

              {updateError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                  {updateError}
                </div>
              )}
            </SectionCard>

            <SectionCard
              delay={0.3}
              title="Feedback"
              description="A dedicated feedback workflow is not wired yet, but the section now clearly reflects that instead of looking unfinished."
              icon={<MessageSquare className="h-5 w-5" />}
            >
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-4 dark:border-amber-800 dark:from-amber-950/20 dark:to-orange-950/10">
                <p className="text-sm text-slate-700 dark:text-slate-300">Need help or want to suggest an improvement? The in-app feedback tool is still pending.</p>
                <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300">Coming soon</p>
              </div>
            </SectionCard>
          </div>
        </div>

        <AnimatePresence>
          {saveState !== 'idle' && saveBannerMessage && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              className={`fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-3 text-sm font-medium shadow-lg ${saveBannerToneClass}`}
              role="status"
            >
              {saveState === 'saving' ? <RefreshCw className="h-4 w-4 animate-spin" /> : saveState === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              <span>{saveBannerMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showConfirmDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
              onClick={() => setShowConfirmDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Clear {getClearTargetLabel(clearTarget)}?</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">This action cannot be undone.</p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-6 text-slate-700 dark:text-slate-300">{getClearTargetDescription(clearTarget)}</p>

                <div className="mt-6 flex gap-3">
                  <Button onClick={() => setShowConfirmDialog(false)} variant="secondary" className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleConfirmClearCache} className="flex-1 bg-red-600 text-white hover:bg-red-700">
                    Clear {getClearTargetLabel(clearTarget)}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AppFooter />
    </div>
  );
}

function getClearTargetLabel(target: ClearTarget): string {
  switch (target) {
    case 'all':
      return 'all data';
    case 'events':
      return 'events cache';
    case 'queue':
      return 'offline queue';
    case 'sw-cache':
      return 'service worker cache';
    default:
      return 'data';
  }
}

function getClearTargetDescription(target: ClearTarget): string {
  switch (target) {
    case 'all':
      return 'This removes locally cached events, queued offline actions, and service worker caches. Your profile preferences remain in local storage and in your account if cloud sync is available.';
    case 'events':
      return 'This removes cached event data. The app will download fresh event data the next time it syncs.';
    case 'queue':
      return 'This removes pending offline operations. Any unsynced edits waiting in the queue will be lost.';
    case 'sw-cache':
      return 'This clears service worker caches. Pages may be slower on the next load while assets are fetched again.';
    default:
      return 'This removes the selected local data.';
  }
}