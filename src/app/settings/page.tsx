
"use client";
import AppFooter from '@/components/AppFooter';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Link from "next/link";
import { clearAllData, getSyncStatus, updateSyncStatus } from "@/lib/indexedDB";
import { useNetworkStatus } from "@/context/NetworkStatusContext";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { supabase } from "@/lib/supabase";
import { isAutoSyncEnabled } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Home, Calendar, Grid3X3, User, Settings, Info, MessageSquare, Trash2, CheckCircle, AlertCircle } from "lucide-react";

import CustomSelect, { SelectOption } from "@/components/CustomSelect";

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
  const { syncNow, queueLength, isProcessingQueue } = useOfflineSync();
  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    permission: pushPermission,
    isLoading: pushLoading,
    error: pushError,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush
  } = usePushNotifications();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [isPWA, setIsPWA] = useState(false);


  // Detect PWA mode with improved detection
  useEffect(() => {
    const checkPWAMode = () => {
      // Check for standalone display mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check for iOS standalone mode
      const isIOSStandalone = (window.navigator as any).standalone === true;
      // Check for iOS iPad Safari fullscreen
      const isIPadSafari = /iPad/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent);
      const isIPadFullscreen = window.matchMedia('(display-mode: fullscreen)').matches || 
                               window.matchMedia('(display-mode: minimal-ui)').matches;
      
      setIsPWA(isStandalone || isIOSStandalone || (isIPadSafari && isIPadFullscreen));
      console.log('PWA Mode Check:', { isStandalone, isIOSStandalone, isIPadSafari, isIPadFullscreen });
    };

    checkPWAMode();

    // Listen for changes in display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      checkPWAMode();
    };

    // Also check on focus (user might have installed PWA)
    const handleFocus = () => {
      checkPWAMode();
    };

    mediaQuery.addEventListener('change', handleChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Load user and preferences from Supabase if logged in
  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        // Load sync status with error handling
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

      // Load preferences from localStorage
      if (isMounted) {
        setAutoSync(localStorage.getItem('autoSync') !== 'false');
        setLanding(localStorage.getItem('landing') || 'home');
      }

      // Load user and preferences from Supabase
      try {
        const { data } = await supabase.auth.getUser();
        if (isMounted) {
          setUser(data.user);
        }
        if (data.user && isMounted) {
          const { data: profile, error } = await supabase
            .from('users')
            .select('preferences')
            .eq('id', data.user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Failed to load user preferences:', error);
          } else if (profile?.preferences && isMounted) {
            try {
              const prefs = JSON.parse(profile.preferences);
              if (prefs.autoSync !== undefined) setAutoSync(prefs.autoSync);
              if (prefs.landing) setLanding(prefs.landing);
            } catch (parseError) {
              console.error('Failed to parse user preferences:', parseError);
            }
          }
        }
      } catch (authError) {
        console.error('Failed to load user:', authError);
      }
    };

    loadSettings();

    // Cleanup function to prevent state updates on unmounted component
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

      // Save to localStorage immediately with error handling
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

      // Save to Supabase if user is logged in
      if (user && user.id) {
        const currentPrefs = {
          autoSync: prefs.autoSync !== undefined ? prefs.autoSync : autoSync,
          landing: prefs.landing !== undefined ? prefs.landing : landing
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

      // Clear message after 2 seconds
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => setSaveMsg(''), 2000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveMsg('Failed to save preferences');
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const handleClearCacheClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmClearCache = async () => {
    setShowConfirmDialog(false);
    setClearing(true);
    setError(null);
    try {
      // Clear IndexedDB data
      try {
        await clearAllData();
      } catch (dbError) {
        console.error('Failed to clear IndexedDB:', dbError);
        throw new Error('Failed to clear local database');
      }

      // Clear service worker cache
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(name => 
              caches.delete(name).catch(err => 
                console.warn(`Failed to clear cache: ${name}`, err)
              )
            )
          );
          console.log('Service worker cache cleared');
        } catch (cacheError) {
          console.warn('Error clearing service worker cache:', cacheError);
          // Continue even if service worker cache clearing fails
        }
      }

      // Clear last sync status
      try {
        setLastSync(null);
      } catch (statusError) {
        console.warn('Error clearing sync status:', statusError);
      }

      setCleared(true);
      setTimeout(() => setCleared(false), 2000);
    } catch (e) {
      console.error('Failed to clear cache:', e);
      setError(e instanceof Error ? e.message : "Failed to clear cache");
    } finally {
      setClearing(false);
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
      // Refresh events cache with error handling
      try {
        await refreshEventsCache();
      } catch (cacheError) {
        console.error('Error refreshing events cache:', cacheError);
        // Continue with sync even if cache refresh fails
      }

      // Process any queued operations
      await syncNow();

      // Update sync status with current timestamp
      const now = Date.now();
      try {
        await updateSyncStatus({
          lastSync: now,
          inProgress: false
        });
      } catch (statusError) {
        console.error('Error updating sync status:', statusError);
      }

      // Update UI
      setLastSync(new Date(now).toLocaleString());
      setSyncResult("Sync completed successfully!");
    } catch (error) {
      console.error('Sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      
      // Update sync status to reflect failure
      try {
        await updateSyncStatus({
          lastSync: Date.now(),
          inProgress: false,
          error: errorMessage
        });
      } catch (statusError) {
        console.error('Error updating sync status after failure:', statusError);
      }
      
      setSyncResult(`Sync failed: ${errorMessage}. Please try again.`);
      setError(errorMessage);
    } finally {
      setSyncingNow(false);
      setTimeout(() => setSyncResult(null), 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
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
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">Settings</h1>
        <div className="grid gap-8">
        {/* Cache Management */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl bg-white shadow-lg p-6 sm:p-8 flex flex-col gap-6 border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-2">
            <Trash2 className="w-6 h-6 text-red-600" />
            <h2 className="text-xl sm:text-2xl font-semibold">Cache Management</h2>
          </div>

          {isAutoSyncEnabled() && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <div>
                <span className="text-gray-800 font-medium">Last Sync</span>
                <p className="text-sm text-gray-600">{lastSync || "Never synced"}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div>
              <Button
                onClick={handleSyncNow}
                disabled={syncingNow || !isOnline}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
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

            <motion.div>
              <Button
                onClick={handleClearCacheClick}
                disabled={clearing}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {clearing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="w-5 h-5" />
                    </motion.div>
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Clear Cache
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          <AnimatePresence>
            {cleared && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-green-600 font-medium justify-center bg-green-50 rounded-lg p-3"
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
                className={`flex items-center gap-2 font-medium justify-center rounded-lg p-3 ${
                  syncResult.includes('successfully')
                    ? 'text-green-600 bg-green-50'
                    : 'text-red-600 bg-red-50'
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
                className="flex items-center gap-2 text-red-600 font-medium justify-center bg-red-50 rounded-lg p-3"
              >
                <AlertCircle className="w-5 h-5" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* User Preferences */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl bg-white shadow-lg p-6 sm:p-8 flex flex-col gap-6 border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl sm:text-2xl font-semibold">User Preferences</h2>
          </div>

          <div className="flex flex-col gap-5">
            {/* Push Notifications Toggle */}
            {pushSupported && (
              <motion.div
                className={`p-4 rounded-xl transition-colors ${
                  isPWA
                    ? 'bg-gray-50 hover:bg-gray-100'
                    : 'bg-amber-50 border border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      pushSubscribed ? 'bg-green-100' : 'bg-gray-200'
                    }`}>
                      <span className="text-xs">{pushSubscribed ? '🔔' : '🔕'}</span>
                    </div>
                    <div>
                      <span className="text-gray-800 font-medium">Notifications</span>
                      <p className="text-sm text-gray-600">
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
                        <p className="text-xs text-amber-700 mt-1">
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
                        
                        // Provide more specific error messages for common issues
                        if (errorMessage.includes('VAPID')) {
                          setError('Push notifications are not configured correctly. Please check your VAPID keys in the environment variables.');
                        } else if (errorMessage.includes('permission')) {
                          setError('Please allow notification permission in your browser settings.');
                        } else if (errorMessage.includes('not supported')) {
                          setError('Push notifications are not supported in this browser.');
                        } else {
                          setError(errorMessage);
                        }
                        
                        setTimeout(() => setError(null), 5000); // Show error for 5 seconds
                      }
                    }}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>
              </motion.div>
            )}



            {/* Auto Sync Toggle */}
            <motion.div
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="text-gray-800 font-medium">Auto Sync</span>
                  <p className="text-sm text-gray-600">Automatically sync data in background</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => {
                  setAutoSync(e.target.checked);
                  savePreferences({ autoSync: e.target.checked });
                }}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
            </motion.div>

            {/* Landing Page Selector */}
            <motion.div
              className="p-4 rounded-xl bg-gray-50"
            >
              <div className="flex items-center gap-3 mb-3">
                <Home className="w-5 h-5 text-yellow-600" />
                <span className="text-gray-800 font-medium">Landing Page</span>
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
              <p className="text-sm text-gray-600 mt-2">Choose which page to show when you open the app</p>
            </motion.div>

            {/* Language Selector (Disabled) */}
            <motion.div
              className="p-4 rounded-xl bg-gray-50 opacity-60"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🌐</span>
                <span className="text-gray-800 font-medium">Language</span>
              </div>
              <CustomSelect
                options={[
                  { value: 'en', label: 'English', icon: '🇺🇸' }
                ]}
                value="en"
                onChange={() => {}}
                disabled={true}
                placeholder="Select language"
              />
              <p className="text-sm text-gray-500 mt-2">More languages coming soon</p>
            </motion.div>
          </div>

          {/* Save Message */}
          <AnimatePresence>
            {saveMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-green-600 font-medium text-center justify-center bg-green-50 rounded-lg p-3"
                role="status"
              >
                <CheckCircle className="w-5 h-5" />
                {saveMsg}
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
            className="rounded-2xl bg-white shadow-lg p-6 sm:p-8 flex flex-col gap-6 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-2">
              <User className="w-6 h-6 text-green-600" />
              <h2 className="text-xl sm:text-2xl font-semibold">Account</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div>
                <Link href="/dashboard/edit-profile">
                  <Button variant="secondary" className="w-full h-16 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 transition-all">
                    <User className="w-6 h-6 text-blue-600" />
                    <span className="font-medium">Edit Profile</span>
                  </Button>
                </Link>
              </motion.div>

              <motion.div>
                <Link href="/dashboard/update-password">
                  <Button variant="secondary" className="w-full h-16 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-orange-200 transition-all">
                    <Settings className="w-6 h-6 text-orange-600" />
                    <span className="font-medium">Change Password</span>
                  </Button>
                </Link>
              </motion.div>

              <motion.div>
                <Link href="/dashboard">
                  <Button variant="secondary" className="w-full h-16 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-green-200 transition-all">
                    <Grid3X3 className="w-6 h-6 text-green-600" />
                    <span className="font-medium">Dashboard</span>
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
          className="rounded-2xl bg-white shadow-lg p-6 sm:p-8 flex flex-col gap-4 border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-2">
            <Info className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-semibold">App Info</h2>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
              <span className="text-lg">📱</span>
              <div>
                <span className="text-gray-800 font-medium">Version</span>
                <p className="text-sm text-gray-600">1.0.0</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50">
              <span className="text-lg">📅</span>
              <div>
                <span className="text-gray-800 font-medium">Last Updated</span>
                <p className="text-sm text-gray-600">January 18, 2026</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-50">
              <span className="text-lg">💻</span>
              <div>
                <span className="text-gray-800 font-medium">Device</span>
                <p className="text-sm text-gray-600 truncate">
                  {typeof window !== 'undefined' ? navigator.userAgent.split(' ').pop() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Feedback */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-2xl bg-white shadow-lg p-6 sm:p-8 flex flex-col gap-4 border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl sm:text-2xl font-semibold">Feedback</h2>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200">
            <p className="text-gray-700 mb-4">
              Have suggestions or need help? We'd love to hear from you!
            </p>
            <div className="text-sm text-gray-600 mt-2">
              Feature coming soon - stay tuned!
            </div>
          </div>
        </motion.section>
        </div>

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
                className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Clear All Data?</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">
                  This will permanently delete all saved events, user data, and offline content. Your account preferences will be preserved.
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
                    Clear Data
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
