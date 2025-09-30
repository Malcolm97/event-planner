
"use client";
import AppFooter from '@/components/AppFooter';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Link from "next/link";
import { clearAllData, getSyncStatus } from "@/lib/indexedDB";
import { useNetworkStatus } from "@/context/NetworkStatusContext";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Wifi, WifiOff, RefreshCw, Home, Calendar, Grid3X3, User, Settings, Info, MessageSquare, Trash2, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";
import ToggleSwitch from "@/components/ToggleSwitch";

export default function SettingsPage() {
  const router = useRouter();
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [offlineNotif, setOfflineNotif] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [landing, setLanding] = useState('home');
  const [saveMsg, setSaveMsg] = useState('');
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const [user, setUser] = useState<any>(null);
  const { isOnline } = useNetworkStatus();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);


  // Load user and preferences from Supabase if logged in
  useEffect(() => {
    getSyncStatus().then((status) => {
      if (status?.lastSync) {
        setLastSync(new Date(status.lastSync).toLocaleString());
      }
    });
    // Load preferences from localStorage
    setDarkMode(localStorage.getItem('darkMode') === 'true');
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
            if (prefs.darkMode !== undefined) setDarkMode(prefs.darkMode);
            if (prefs.offlineNotif !== undefined) setOfflineNotif(prefs.offlineNotif);
            if (prefs.autoSync !== undefined) setAutoSync(prefs.autoSync);
            if (prefs.landing) setLanding(prefs.landing);
          } catch {}
        }
      }
    });
  }, []);

  // Apply dark mode to <html> on mount and when toggled
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode ? 'true' : 'false');
  }, [darkMode]);

  // Save preferences to localStorage and optionally Supabase
  const savePreferences = async (prefs: any) => {
    if ('darkMode' in prefs) localStorage.setItem('darkMode', prefs.darkMode ? 'true' : 'false');
    if ('offlineNotif' in prefs) localStorage.setItem('offlineNotif', prefs.offlineNotif ? 'true' : 'false');
    if ('autoSync' in prefs) localStorage.setItem('autoSync', prefs.autoSync ? 'true' : 'false');
    if ('landing' in prefs) localStorage.setItem('landing', prefs.landing);
    if (user) {
      await supabase.from('users').update({ preferences: JSON.stringify({
        darkMode,
        offlineNotif,
        autoSync,
        landing,
        ...prefs
      }) }).eq('id', user.id);
    }
    setSaveMsg('Preferences saved!');
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => setSaveMsg(''), 2000);
  };


  // Persist preferences to localStorage and Supabase (if logged in)
  useEffect(() => {
    const prefs = { darkMode, offlineNotif, autoSync, landing };
    localStorage.setItem('darkMode', String(darkMode));
    localStorage.setItem('offlineNotif', String(offlineNotif));
    localStorage.setItem('autoSync', String(autoSync));
    localStorage.setItem('landing', landing);
    if (user) {
      supabase.from('users').update({ preferences: JSON.stringify(prefs) }).eq('id', user.id);
    }
  }, [darkMode, offlineNotif, autoSync, landing, user]);

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-100 to-yellow-300 dark:from-gray-900 dark:to-gray-800">
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
          className="rounded-2xl bg-white/80 dark:bg-gray-900/80 shadow-lg p-6 sm:p-8 flex flex-col gap-6 border border-gray-100 dark:border-gray-800 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <Trash2 className="w-6 h-6 text-red-600" />
            <h2 className="text-xl sm:text-2xl font-semibold">Cache Management</h2>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            <div>
              <span className="text-gray-800 dark:text-gray-200 font-medium">Last Sync</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">{lastSync || "Never synced"}</p>
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                  Clear All Cached Data
                </>
              )}
            </Button>
          </motion.div>

          <AnimatePresence>
            {cleared && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium justify-center bg-green-50 dark:bg-green-900/20 rounded-lg p-3"
              >
                <CheckCircle className="w-5 h-5" />
                Cache cleared successfully!
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium justify-center bg-red-50 dark:bg-red-900/20 rounded-lg p-3"
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
          className="rounded-2xl bg-white/80 dark:bg-gray-900/80 shadow-lg p-6 sm:p-8 flex flex-col gap-6 border border-gray-100 dark:border-gray-800 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl sm:text-2xl font-semibold">User Preferences</h2>
          </div>

          <div className="flex flex-col gap-5">
            {/* Dark Mode Toggle */}
            <motion.div
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-5 h-5 text-blue-600" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                <div>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">Dark Mode</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Switch between light and dark themes</p>
                </div>
              </div>
              <ToggleSwitch
                checked={darkMode}
                onChange={(checked) => {
                  setDarkMode(checked);
                  savePreferences({ darkMode: checked });
                }}
              />
            </motion.div>

            {/* Offline Notifications Toggle */}
            <motion.div
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                {isOnline ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-red-600" />}
                <div>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">Offline Notifications</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Show notifications when offline</p>
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
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">Auto Sync</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Automatically sync data in background</p>
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
              className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Home className="w-5 h-5 text-purple-600" />
                <span className="text-gray-800 dark:text-gray-200 font-medium">Landing Page</span>
              </div>
              <div className="relative">
                <select
                  value={landing}
                  onChange={e => {
                    setLanding(e.target.value);
                    savePreferences({ landing: e.target.value });
                  }}
                  className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
                >
                  <option value="home">🏠 Home</option>
                  <option value="events">📅 Events</option>
                  <option value="categories">📂 Categories</option>
                  {user && <option value="dashboard">📊 Dashboard</option>}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Choose which page to show when you open the app</p>
            </motion.div>

            {/* Language Selector (Disabled) */}
            <motion.div
              className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 opacity-60"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🌐</span>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Language</span>
              </div>
              <div className="relative">
                <select
                  disabled
                  className="w-full appearance-none bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-500 cursor-not-allowed"
                >
                  <option>🇺🇸 English</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
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
                className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium text-center justify-center bg-green-50 dark:bg-green-900/20 rounded-lg p-3"
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
            className="rounded-2xl bg-white/80 dark:bg-gray-900/80 shadow-lg p-6 sm:p-8 flex flex-col gap-6 border border-gray-100 dark:border-gray-800 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <User className="w-6 h-6 text-green-600" />
              <h2 className="text-xl sm:text-2xl font-semibold">Account</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/dashboard/edit-profile">
                  <Button variant="secondary" className="w-full h-16 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 border-blue-200 dark:border-blue-700 transition-all">
                    <User className="w-6 h-6 text-blue-600" />
                    <span className="font-medium">Edit Profile</span>
                  </Button>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/dashboard/update-password">
                  <Button variant="secondary" className="w-full h-16 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30 border-purple-200 dark:border-purple-700 transition-all">
                    <Settings className="w-6 h-6 text-purple-600" />
                    <span className="font-medium">Change Password</span>
                  </Button>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/dashboard">
                  <Button variant="secondary" className="w-full h-16 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30 border-green-200 dark:border-green-700 transition-all">
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
          className="rounded-2xl bg-white/80 dark:bg-gray-900/80 shadow-lg p-6 sm:p-8 flex flex-col gap-4 border border-gray-100 dark:border-gray-800 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <Info className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl sm:text-2xl font-semibold">App Info</h2>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
              <span className="text-lg">📱</span>
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Version</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">1.0.0</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <span className="text-lg">📅</span>
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Last Updated</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">September 27, 2025</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20">
              <span className="text-lg">💻</span>
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Device</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
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
          className="rounded-2xl bg-white/80 dark:bg-gray-900/80 shadow-lg p-6 sm:p-8 flex flex-col gap-4 border border-gray-100 dark:border-gray-800 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-6 h-6 text-pink-600" />
            <h2 className="text-xl sm:text-2xl font-semibold">Feedback</h2>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-200 dark:border-pink-800">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Have suggestions or need help? We'd love to hear from you!
            </p>
            <motion.a
              href="mailto:support@pngevents.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Clear All Data?</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-6">
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
