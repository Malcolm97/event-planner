"use client";
import AppFooter from '@/components/AppFooter';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Link from "next/link";
import {
  clearAllData,
  getSyncStatus,
  updateSyncStatus,
  clearEventsCacheOnly,
  clearOfflineQueueOnly,
  clearServiceWorkerCaches
} from "@/lib/indexedDB";
import { useNetworkStatus } from "@/context/NetworkStatusContext";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useTheme } from "@/context/ThemeContext";
import { useUpdate } from "@/context/UpdateContext";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Home,
  Grid3X3,
  User,
  Settings,
  Info,
  MessageSquare,
  Trash2,
  CheckCircle,
  AlertCircle,
  Download,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Bell,
  BellOff,
  Database,
  Wifi
} from "lucide-react";

import CustomSelect from "@/components/CustomSelect";

type ClearTarget = 'all' | 'events' | 'queue' | 'sw-cache' | null;

export default function SettingsPage() {
  const router = useRouter();
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [landing, setLanding] = useState('home');
  const [saveMsg, setSaveMsg] = useState('');
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const [user, setUser] = useState<any>(null);
  const { isOnline, refreshEventsCache } = useNetworkStatus();
  const { syncNow } = useOfflineSync();
  const { theme, setTheme } = useTheme();
  const {
    currentVersion,
    serverVersion,
    updateAvailable,
    isChecking: isUpdateChecking,
    lastChecked: updateLastChecked,
    checkForUpdate,
    applyUpdate,
  } = useUpdate();
  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    permission: pushPermission,
    isLoading: pushLoading,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush
  } = usePushNotifications();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [clearTarget, setClearTarget] = useState<ClearTarget>(null);
  const [syncingNow, setSyncingNow] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [isPWA, setIsPWA] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState<string | null>(null);
  const [offlineNotif, setOfflineNotif] = useState(true);

  // Detect PWA mode with improved detection
  useEffect(() => {
    const checkPWAMode = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      const isIPadSafari = /iPad/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent);
      const isIPadFullscreen = window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches;

      setIsPWA(isStandalone || isIOSStandalone || (isIPadSafari && isIPadFullscreen));
    };

    checkPWAMode();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWAMode);
    window.addEventListener('focus', checkPWAMode);

    return () => {
      mediaQuery.removeEventListener('change', checkPWAMode);
      window.removeEventListener('focus', checkPWAMode);
    };
  }, []);

  // Load user and preferences from Supabase if logged in
  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const status = await getSyncStatus();
        if (isMounted && status?.lastSync) {
          setLastSync(new Date(status.lastSync).toLocaleString());
        }
      } catch (error) {
        console.error('Failed to load sync status:', error);
        if (isMounted) {
          setLastSync("Error loading sync status");
        }
      }

      if (isMounted) {
        setAutoSync(localStorage.getItem('autoSync') !== 'false');
        setLanding(localStorage.getItem('landing') || 'home');
        setOfflineNotif(localStorage.getItem('offlineNotif') !== 'false');
      }

      try {
        const { data } = await supabase.auth.getUser();
        if (isMounted) {
          setUser(data.user);
        }
        if (data.user && isMounted) {
          try {
            const { data: profile, error } = await supabase
              .from('users')
              .select('preferences')
              .eq('id', data.user.id)
              .single();

            if (!error && profile?.preferences && isMounted) {
              try {
                const prefs = JSON.parse(profile.preferences);
                if (prefs.autoSync !== undefined) setAutoSync(prefs.autoSync);
                if (prefs.landing) setLanding(prefs.landing);
                if (prefs.offlineNotif !== undefined) setOfflineNotif(prefs.offlineNotif);
              } catch (parseError) {
                console.error('Failed to parse user preferences:', parseError);
              }
            }
          } catch (prefsError) {
            console.debug('Could not load preferences from Supabase, using localStorage');
          }
        }
      } catch (authError) {
        console.error('Failed to load user:', authError);
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);

  // Save preferences with proper error handling
  const savePreferences = async (prefs: any) => {
    try {
      setSaveMsg('Saving preferences...');

      if (prefs.autoSync !== undefined) {
        try {
          localStorage.setItem('autoSync', String(prefs.autoSync));
        } catch (storageError) {
          console.error('Failed to save to localStorage:', storageError);
        }
      }
      if (prefs.landing !== undefined) {
        try {
          localStorage.setItem('landing', prefs.landing);
        } catch (storageError) {
          console.error('Failed to save to localStorage:', storageError);
        }
      }
      if (prefs.offlineNotif !== undefined) {
        try {
          localStorage.setItem('offlineNotif', String(prefs.offlineNotif));
        } catch (storageError) {
          console.error('Failed to save to localStorage:', storageError);
        }
      }

      if (user && user.id) {
        const currentPrefs = {
          autoSync: prefs.autoSync !== undefined ? prefs.autoSync : autoSync,
          landing: prefs.landing !== undefined ? prefs.landing : landing,
          offlineNotif: prefs.offlineNotif !== undefined ? prefs.offlineNotif : offlineNotif
        };

        const { error } = await supabase
          .from('users')
          .update({ preferences: JSON.stringify(currentPrefs) })
          .eq('id', user.id);

        if (error) {
          console.error('Failed to save preferences to Supabase:', error);
          setSaveMsg('Preferences saved locally only');
        } else {
          setSaveMsg('Preferences saved!');
        }
      } else {
        setSaveMsg('Preferences saved locally!');
      }

      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => setSaveMsg(''), 2000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveMsg('Failed to save preferences');
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const handleClearCacheClick = (target: ClearTarget) => {
    setClearTarget(target);
    setShowConfirmDialog(true);
  };

  const handleConfirmClearCache = async () => {
    setShowConfirmDialog(false);
    setClearing(true);
    setError(null);
    try {
      if (clearTarget === 'all') {
        await clearAllData();
        if ('caches' in window) {
          await clearServiceWorkerCaches();
        }
      } else if (clearTarget === 'events') {
        await clearEventsCacheOnly();
      } else if (clearTarget === 'queue') {
        await clearOfflineQueueOnly();
      } else if (clearTarget === 'sw-cache') {
        await clearServiceWorkerCaches();
      }

      setLastSync(null);
      setCleared(true);
      setTimeout(() => setCleared(false), 2000);
    } catch (e) {
      console.error('Failed to clear cache:', e);
      setError(e instanceof Error ? e.message : "Failed to clear cache");
    } finally {
      setClearing(false);
      setClearTarget(null);
    }
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      setSyncResult("Cannot sync while offline");
      setTimeout(() => setSyncResult(null), 3000);
      return;
    }

    setSyncingNow(true);
    setSyncResult(null);
    setError(null);

    try {
      await refreshEventsCache();
      await syncNow();

      const now = Date.now();
      await updateSyncStatus({
        lastSync: now,
        inProgress: false
      });

      setLastSync(new Date(now).toLocaleString());
      setSyncResult("Sync completed successfully!");
    } catch (error) {
      console.error('Sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';

      await updateSyncStatus({
        lastSync: Date.now(),
        inProgress: false,
        error: errorMessage
      });

      setSyncResult(`Sync failed: ${errorMessage}. Please try again.`);
      setError(errorMessage);
    } finally {
      setSyncingNow(false);
      setTimeout(() => setSyncResult(null), 3000);
    }
  };

  const handleCheckForUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateResult(null);

    try {
      const hasUpdate = await checkForUpdate();
      
      if (hasUpdate) {
        setUpdateResult('New version available! Click "Update Now" below.');
      } else {
        setUpdateResult('You have the latest version!');
      }
    } catch (error) {
      console.error('Update check failed:', error);
      setUpdateResult('Failed to check for updates. Please try again.');
    } finally {
      setCheckingUpdate(false);
      setTimeout(() => setUpdateResult(null), 5000);
    }
  };

  const handleApplyUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateResult('Updating...');
    try {
      await applyUpdate();
    } catch (error) {
      console.error('Failed to apply update:', error);
      setUpdateResult('Failed to update. Please try again.');
      setCheckingUpdate(false);
    }
  };

  const getClearTargetLabel = () => {
    switch (clearTarget) {
      case 'all': return 'All Data';
      case 'events': return 'Events Cache';
      case 'queue': return 'Offline Queue';
      case 'sw-cache': return 'Service Worker Cache';
      default: return 'Data';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto w-full flex-1 py-10 px-2 sm:px-4 flex flex-col">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="mb-6 self-start"
          aria-label="Back"
        >
          ← Back
        </Button>
        <h1 className="text-base sm:text-base lg:text-xl font-bold mb-6 text-center text-gray-900 dark:text-white">Settings</h1>
        <div className="grid gap-8">

          {/* Appearance Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-6 sm:p-8 flex flex-col gap-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-6 h-6 text-yellow-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Appearance</h2>
            </div>

            {/* Theme Selection */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center gap-3 mb-3">
                {theme === 'light' ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-blue-400" />
                ) : (
                  <Monitor className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                )}
                <span className="text-gray-800 dark:text-white font-medium">Theme</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all ${
                    theme === 'light'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-2 border-yellow-400'
                      : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span className="text-sm font-medium">Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all ${
                    theme === 'dark'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-400'
                      : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span className="text-sm font-medium">Dark</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all ${
                    theme === 'system'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-2 border-purple-400'
                      : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span className="text-sm font-medium">System</span>
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {theme === 'system' 
                  ? 'Follows your device theme setting' 
                  : `Using ${theme} mode`}
              </p>
            </div>

            {/* Landing Page Selector */}
            <motion.div
              className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-3">
                <Home className="w-5 h-5 text-yellow-600" />
                <span className="text-gray-800 dark:text-white font-medium">Landing Page</span>
              </div>
              <CustomSelect
                options={[
                  { value: 'home', label: 'Home', icon: '🏠' },
                  { value: 'events', label: 'Events', icon: '📅' },
                  { value: 'categories', label: 'Categories', icon: '📂' },
                  ...(user ? [{ value: 'dashboard', label: 'Dashboard', icon: '📊' }] : [])
                ]}
                value={landing}
                onChange={(value) => {
                  setLanding(value);
                  savePreferences({ landing: value });
                }}
                placeholder="Select landing page"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Choose which page to show when you open the app</p>
            </motion.div>

            {/* Language Selector (Disabled) */}
            <motion.div
              className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 opacity-60"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🌐</span>
                <span className="text-gray-800 dark:text-white font-medium">Language</span>
              </div>
              <CustomSelect
                options={[
                  { value: 'en', label: 'English', icon: '🇺🇸' }
                ]}
                value="en"
                onChange={() => { }}
                disabled={true}
                placeholder="Select language"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">More languages coming soon</p>
            </motion.div>
          </motion.section>

          {/* Notifications Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-6 sm:p-8 flex flex-col gap-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
            </div>

            <div className="flex flex-col gap-5">
              {/* Push Notifications Toggle */}
              {pushSupported && (
                <motion.div
                  className={`p-4 rounded-xl transition-colors ${isPWA
                    ? 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                    : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${pushSubscribed ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-200 dark:bg-gray-600'
                        }`}>
                        <span className="text-xs">{pushSubscribed ? '🔔' : '🔕'}</span>
                      </div>
                      <div>
                        <span className="text-gray-800 dark:text-white font-medium">Push Notifications</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {isPWA ? (
                            pushSubscribed
                              ? 'Get notified when new events are published'
                              : pushPermission === 'denied'
                                ? 'Notifications blocked - enable in browser settings'
                                : 'Get push notifications for new events'
                          ) : (
                            'Install the app to receive push notifications for new events'
                          )}
                        </p>
                        {!isPWA && (
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                            📱 Tap the install button in your browser or share menu
                          </p>
                        )}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={pushSubscribed}
                      disabled={pushLoading || pushPermission === 'denied' || !isPWA}
                      onChange={async (e) => {
                        try {
                          if (e.target.checked) {
                            await subscribeToPush();
                            setSaveMsg('Push notifications enabled!');
                            setTimeout(() => setSaveMsg(''), 2000);
                          } else {
                            await unsubscribeFromPush();
                            setSaveMsg('Push notifications disabled');
                            setTimeout(() => setSaveMsg(''), 2000);
                          }
                        } catch (error) {
                          console.error('Push notification toggle failed:', error);
                          const errorMessage = error instanceof Error ? error.message : 'Failed to update notification settings';

                          if (errorMessage.includes('VAPID')) {
                            setError('Push notifications are not configured correctly. Please check your VAPID keys in the environment variables.');
                          } else if (errorMessage.includes('permission')) {
                            setError('Please allow notification permission in your browser settings.');
                          } else if (errorMessage.includes('not supported')) {
                            setError('Push notifications are not supported in this browser.');
                          } else {
                            setError(errorMessage);
                          }

                          setTimeout(() => setError(null), 5000);
                        }
                      }}
                      className="w-5 h-5 text-blue-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                </motion.div>
              )}

              {/* Offline Notifications Toggle */}
              <motion.div
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {offlineNotif ? (
                    <Wifi className="w-5 h-5 text-green-600" />
                  ) : (
                    <Wifi className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <span className="text-gray-800 dark:text-white font-medium">Connection Alerts</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Show notifications when going online/offline</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={offlineNotif}
                  onChange={(e) => {
                    setOfflineNotif(e.target.checked);
                    savePreferences({ offlineNotif: e.target.checked });
                  }}
                  className="w-5 h-5 text-blue-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                />
              </motion.div>
            </div>
          </motion.section>

          {/* Data & Sync Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-6 sm:p-8 flex flex-col gap-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Data & Sync</h2>
            </div>

            {/* Auto Sync Toggle */}
            <motion.div
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="text-gray-800 dark:text-white font-medium">Auto Sync</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Automatically sync data in background</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => {
                  setAutoSync(e.target.checked);
                  savePreferences({ autoSync: e.target.checked });
                }}
                className="w-5 h-5 text-blue-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
              />
            </motion.div>

            {/* Sync Button */}
            <div className="flex flex-wrap gap-3">
              <motion.div>
                <Button
                  onClick={handleSyncNow}
                  disabled={syncingNow || !isOnline}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {syncingNow ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw className="w-5 h-5" />
                      </motion.div>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Sync Now
                    </>
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Selective Clear Buttons */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Clear specific caches:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleClearCacheClick('events')}
                  disabled={clearing}
                  variant="secondary"
                  className="text-sm py-2 px-4"
                >
                  Events Cache
                </Button>
                <Button
                  onClick={() => handleClearCacheClick('queue')}
                  disabled={clearing}
                  variant="secondary"
                  className="text-sm py-2 px-4"
                >
                  Offline Queue
                </Button>
                <Button
                  onClick={() => handleClearCacheClick('sw-cache')}
                  disabled={clearing}
                  variant="secondary"
                  className="text-sm py-2 px-4"
                >
                  SW Cache
                </Button>
                <Button
                  onClick={() => handleClearCacheClick('all')}
                  disabled={clearing}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4"
                >
                  Clear All
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {cleared && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-green-600 font-medium justify-center bg-green-50 dark:bg-green-900/30 rounded-lg p-3"
                >
                  <CheckCircle className="w-5 h-5" />
                  Cache cleared successfully!
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {syncResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex items-center gap-2 font-medium justify-center rounded-lg p-3 ${syncResult.includes('successfully')
                    ? 'text-green-600 bg-green-50 dark:bg-green-900/30'
                    : 'text-red-600 bg-red-50 dark:bg-red-900/30'
                    }`}
                >
                  {syncResult.includes('successfully') ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  {syncResult}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-red-600 font-medium justify-center bg-red-50 dark:bg-red-900/30 rounded-lg p-3"
                >
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Account Section for logged-in users */}
          {user && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-6 sm:p-8 flex flex-col gap-6 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-2">
                <User className="w-6 h-6 text-green-600" />
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Account</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div>
                  <Link href="/dashboard/edit-profile">
                    <Button variant="secondary" className="w-full h-16 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/40 dark:hover:to-blue-700/40 border-blue-200 dark:border-blue-700 transition-all">
                      <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-gray-800 dark:text-white">Edit Profile</span>
                    </Button>
                  </Link>
                </motion.div>

                <motion.div>
                  <Link href="/dashboard/update-password">
                    <Button variant="secondary" className="w-full h-16 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-800/40 dark:hover:to-orange-700/40 border-orange-200 dark:border-orange-700 transition-all">
                      <Settings className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      <span className="font-medium text-gray-800 dark:text-white">Change Password</span>
                    </Button>
                  </Link>
                </motion.div>

                <motion.div>
                  <Link href="/dashboard">
                    <Button variant="secondary" className="w-full h-16 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/40 dark:hover:to-green-700/40 border-green-200 dark:border-green-700 transition-all">
                      <Grid3X3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-gray-800 dark:text-white">Dashboard</span>
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.section>
          )}

          {/* App Info */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-6 sm:p-8 flex flex-col gap-4 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <Info className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">App Info</h2>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <span className="text-lg">📱</span>
                <div className="flex-1">
                  <span className="text-gray-800 dark:text-white font-medium">Current Version</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">v{currentVersion}</p>
                </div>
                {updateAvailable && (
                  <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 rounded-full animate-pulse">
                    Update Available
                  </span>
                )}
              </div>

              {serverVersion && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/30">
                  <span className="text-lg">🚀</span>
                  <div className="flex-1">
                    <span className="text-gray-800 dark:text-white font-medium">Server Version</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">v{serverVersion.version}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/30">
                <span className="text-lg">📅</span>
                <div className="flex-1">
                  <span className="text-gray-800 dark:text-white font-medium">Last Checked</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {updateLastChecked ? new Date(updateLastChecked).toLocaleString() : 'Not yet checked'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-50 dark:bg-teal-900/30">
                <span className="text-lg">💻</span>
                <div className="flex-1">
                  <span className="text-gray-800 dark:text-white font-medium">Device</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {typeof window !== 'undefined' ? navigator.userAgent.split(' ').pop() : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Update Available - Show Update Now Button */}
              {updateAvailable && (
                <div className="mt-2">
                  <Button
                    onClick={handleApplyUpdate}
                    disabled={checkingUpdate}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {checkingUpdate ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <RefreshCw className="w-5 h-5" />
                        </motion.div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Update Now
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Check for Updates Button */}
              <div className={updateAvailable ? '' : 'mt-2'}>
                <Button
                  onClick={handleCheckForUpdates}
                  disabled={checkingUpdate || isUpdateChecking}
                  variant={updateAvailable ? "secondary" : "primary"}
                  className={`w-full font-medium py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 ${
                    updateAvailable 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600' 
                      : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white'
                  }`}
                >
                  {checkingUpdate || isUpdateChecking ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw className="w-5 h-5" />
                      </motion.div>
                      Checking...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Check for Updates
                    </>
                  )}
                </Button>
              </div>

              {/* Update Result */}
              <AnimatePresence>
                {updateResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex items-center gap-2 font-medium justify-center rounded-lg p-3 ${updateResult.includes('latest')
                      ? 'text-green-600 bg-green-50 dark:bg-green-900/30'
                      : updateResult.includes('New version') || updateResult.includes('available')
                        ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/30'
                        : 'text-blue-600 bg-blue-50 dark:bg-blue-900/30'
                      }`}
                  >
                    {updateResult.includes('latest') ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : updateResult.includes('New version') || updateResult.includes('available') ? (
                      <Download className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    {updateResult}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* Feedback */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-6 sm:p-8 flex flex-col gap-4 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Feedback</h2>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Have suggestions or need help? We'd love to hear from you!
              </p>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Feature coming soon - stay tuned!
              </div>
            </div>
          </motion.section>
        </div>

        {/* Save Message */}
        <AnimatePresence>
          {saveMsg && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed bottom-20 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-green-600 dark:text-green-400 font-medium text-center justify-center bg-green-50 dark:bg-green-900/80 rounded-lg p-3 shadow-lg z-50"
              role="status"
            >
              <CheckCircle className="w-5 h-5" />
              {saveMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation Dialog */}
        <AnimatePresence>
          {showConfirmDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowConfirmDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Clear {getClearTargetLabel()}?</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  {clearTarget === 'all'
                    ? 'This will permanently delete all saved events, user data, and offline content. Your account preferences will be preserved.'
                    : clearTarget === 'events'
                      ? 'This will clear all cached events. They will be re-downloaded on next sync.'
                      : clearTarget === 'queue'
                        ? 'This will clear all pending offline operations. Any unsaved changes will be lost.'
                        : 'This will clear the service worker cache. Pages may load slower on next visit.'}
                </p>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowConfirmDialog(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmClearCache}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Clear {getClearTargetLabel()}
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