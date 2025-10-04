
"use client";
import AppFooter from '@/components/AppFooter';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Link from "next/link";
import { clearAllData, getSyncStatus } from "@/lib/indexedDB";
import { useNetworkStatus } from "@/context/NetworkStatusContext";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, RefreshCw, Home, Calendar, Grid3X3, User, Settings, Info, MessageSquare, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import ToggleSwitch from "@/components/ToggleSwitch";
import CustomSelect, { SelectOption } from "@/components/CustomSelect";

export default function SettingsPage() {
  const router = useRouter();
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineNotif, setOfflineNotif] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [landing, setLanding] = useState('home');
  const [saveMsg, setSaveMsg] = useState('');
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const [user, setUser] = useState<any>(null);
  const { isOnline, refreshEventsCache } = useNetworkStatus();
  const { syncNow, queueLength, isProcessingQueue } = useOfflineSync();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);


  // Load user and preferences from Supabase if logged in
  useEffect(() => {
    getSyncStatus().then((status) => {
      if (status?.lastSync) {
        setLastSync(new Date(status.lastSync).toLocaleString());
      }
    });
    // Load preferences from localStorage
    setOfflineNotif(localStorage.getItem('offlineNotif') !== 'false');
    setAutoSync(localStorage.getItem('autoSync') !== 'false');
    setLanding(localStorage.getItem('landing') || 'home');
    // Load user and preferences from Supabase
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('preferences')
          .eq('id', data.user.id)
          .single();
        if (profile?.preferences) {
          try {
            const prefs = JSON.parse(profile.preferences);
            if (prefs.offlineNotif !== undefined) setOfflineNotif(prefs.offlineNotif);
            if (prefs.autoSync !== undefined) setAutoSync(prefs.autoSync);
            if (prefs.landing) setLanding(prefs.landing);
          } catch {}
        }
      }
    });
  }, []);

  // Save preferences (the useEffect handles the actual saving)
  const savePreferences = async (prefs: any) => {
    setSaveMsg('Preferences saved!');
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => setSaveMsg(''), 2000);
  };


  // Persist preferences to localStorage and Supabase (if logged in)
  useEffect(() => {
    const prefs = { offlineNotif, autoSync, landing };
    localStorage.setItem('offlineNotif', String(offlineNotif));
    localStorage.setItem('autoSync', String(autoSync));
    localStorage.setItem('landing', landing);
    if (user) {
      supabase.from('users').update({ preferences: JSON.stringify(prefs) }).eq('id', user.id);
    }
  }, [offlineNotif, autoSync, landing, user]);

  const handleClearCacheClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmClearCache = async () => {
    setShowConfirmDialog(false);
    setClearing(true);
    setError(null);
    try {
      await clearAllData();
      setCleared(true);
      setTimeout(() => setCleared(false), 2000);
    } catch (e) {
      setError("Failed to clear cache");
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

    try {
      // Refresh events cache
      await refreshEventsCache();

      // Process any queued operations
      await syncNow();

      setSyncResult("Sync completed successfully!");
      // Refresh last sync time
      getSyncStatus().then((status) => {
        if (status?.lastSync) {
          setLastSync(new Date(status.lastSync).toLocaleString());
        }
      });
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncResult("Sync failed. Please try again.");
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

          <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            <div>
              <span className="text-gray-800 font-medium">Last Sync</span>
              <p className="text-sm text-gray-600">{lastSync || "Never synced"}</p>
            </div>
          </div>

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
            {/* Offline Notifications Toggle */}
            <motion.div
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isOnline ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-red-600" />}
                <div>
                  <span className="text-gray-800 font-medium">Offline Notifications</span>
                  <p className="text-sm text-gray-600">Show notifications when offline</p>
                </div>
              </div>
              <ToggleSwitch
                checked={offlineNotif}
                onChange={(checked) => {
                  setOfflineNotif(checked);
                  savePreferences({ offlineNotif: checked });
                }}
              />
            </motion.div>

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
              <ToggleSwitch
                checked={autoSync}
                onChange={(checked) => {
                  setAutoSync(checked);
                  savePreferences({ autoSync: checked });
                }}
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
                <p className="text-sm text-gray-600">September 27, 2025</p>
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
            <motion.a
              href="mailto:support@pngevents.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Contact Support
            </motion.a>
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
                  This will permanently delete all cached events, user data, and offline content. Your account preferences will be preserved.
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
