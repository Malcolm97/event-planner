"use client";


import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Link from "next/link";
import { clearAllData, getSyncStatus } from "@/lib/indexedDB";
import { useNetworkStatus } from "@/context/NetworkStatusContext";
import { supabase } from "@/lib/supabase";

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
    if (typeof window !== 'undefined') {
      if (darkMode) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }
    if (user) {
      supabase.from('users').update({ preferences: JSON.stringify(prefs) }).eq('id', user.id);
    }
  }, [darkMode, offlineNotif, autoSync, landing, user]);

  const handleClearCache = async () => {
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
        <button
          onClick={() => router.back()}
          className="mb-6 px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition whitespace-nowrap min-w-[80px] text-base sm:text-sm truncate shadow self-start"
          aria-label="Back"
        >
          ← Back
        </button>
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">Settings</h1>
        <div className="grid gap-8">
        {/* Cache Management */}
        <section className="rounded-2xl bg-white/80 dark:bg-gray-900/80 shadow p-6 sm:p-8 flex flex-col gap-4 border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2">Cache Management</h2>
          <div className="text-gray-700 dark:text-gray-300">
            <span className="font-medium">Last Sync:</span> {lastSync || "Never"}
          </div>
          <Button
            onClick={handleClearCache}
            disabled={clearing}
            className="w-full sm:w-auto"
          >
            {clearing ? "Clearing..." : "Clear All Cached Data"}
          </Button>
          {cleared && (
            <div className="text-green-600 font-semibold">Cache cleared!</div>
          )}
          {error && (
            <div className="text-red-600 font-semibold">{error}</div>
          )}
        </section>

        {/* User Preferences */}
        <section className="rounded-2xl bg-white/80 dark:bg-gray-900/80 shadow p-6 sm:p-8 flex flex-col gap-4 border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2">User Preferences</h2>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer" aria-label="Enable dark mode">
              <input type="checkbox" checked={darkMode} onChange={e => { setDarkMode(e.target.checked); savePreferences({ darkMode: e.target.checked }); }} className="accent-yellow-500 w-5 h-5" />
              <span className="text-gray-800 dark:text-gray-200">Enable dark mode</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer" aria-label="Show offline notifications">
              <input type="checkbox" checked={offlineNotif} onChange={e => { setOfflineNotif(e.target.checked); savePreferences({ offlineNotif: e.target.checked }); }} className="accent-yellow-500 w-5 h-5" />
              <span className="text-gray-800 dark:text-gray-200">Show offline notifications</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer" aria-label="Auto-sync in background">
              <input type="checkbox" checked={autoSync} onChange={e => { setAutoSync(e.target.checked); savePreferences({ autoSync: e.target.checked }); }} className="accent-yellow-500 w-5 h-5" />
              <span className="text-gray-800 dark:text-gray-200">Auto-sync in background</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer" aria-label="Preferred landing page">
              <span className="text-gray-800 dark:text-gray-200">Preferred landing page:</span>
              <select
                value={landing}
                onChange={e => { setLanding(e.target.value); savePreferences({ landing: e.target.value }); }}
                className="border rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="home">Home</option>
                <option value="events">Events</option>
                <option value="categories">Categories</option>
                {user && <option value="dashboard">Dashboard</option>}
              </select>
            </label>
          {saveMsg && (
            <div className="text-green-600 font-semibold text-center mt-2" role="status">{saveMsg}</div>
          )}
            <label className="flex items-center gap-3">
              <span className="text-gray-800 dark:text-gray-200">Language:</span>
              <select disabled className="border rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-100">
                <option>English</option>
              </select>
              <span className="text-gray-400">(more coming soon)</span>
            </label>
          </div>
        </section>

        {/* Account Section for logged-in users */}
        {user && (
          <section className="rounded-2xl bg-white/80 dark:bg-gray-900/80 shadow p-6 sm:p-8 flex flex-col gap-4 border border-gray-100 dark:border-gray-800">
            <h2 className="text-xl sm:text-2xl font-semibold mb-2">Account</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard/edit-profile" className="flex-1">
                <Button variant="secondary" className="w-full">Edit Profile</Button>
              </Link>
              <Link href="/dashboard/update-password" className="flex-1">
                <Button variant="secondary" className="w-full">Change Password</Button>
              </Link>
              <Link href="/dashboard" className="flex-1">
                <Button variant="secondary" className="w-full">Go to Dashboard</Button>
              </Link>
            </div>
          </section>
        )}

        {/* App Info */}
        <section className="rounded-2xl bg-white/80 dark:bg-gray-900/80 shadow p-6 sm:p-8 flex flex-col gap-2 border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2">App Info</h2>
          <div className="text-gray-700 dark:text-gray-300">Version: 1.0.0</div>
          <div className="text-gray-700 dark:text-gray-300">Last updated: September 27, 2025</div>
          <div className="text-gray-700 dark:text-gray-300">Device: {typeof window !== 'undefined' ? navigator.userAgent : ''}</div>
        </section>

        {/* Feedback */}
        <section className="rounded-2xl bg-white/80 dark:bg-gray-900/80 shadow p-6 sm:p-8 flex flex-col gap-2 border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2">Feedback</h2>
          <p className="text-gray-700 dark:text-gray-300">Have suggestions or need help? <a href="mailto:support@pngevents.com" className="text-blue-600 underline">Contact support</a>.</p>
        </section>
        </div>
      </div>
      {/* Footer */}
      <footer className="w-full py-12 px-4 sm:px-8 bg-gray-900 border-t border-gray-700 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-gray-400 text-sm">
          <div className="flex gap-6 mb-2 md:mb-0">
            <Link href="/events" className="whitespace-nowrap min-w-[90px] px-3 py-2 hover:text-yellow-400 text-gray-300 transition-colors font-medium text-base sm:text-sm" aria-label="Events">Events</Link>
            <Link href="/categories" className="whitespace-nowrap min-w-[110px] px-3 py-2 hover:text-yellow-400 text-gray-300 transition-colors font-medium text-base sm:text-sm" aria-label="Categories">Categories</Link>
            <Link href="/about" className="whitespace-nowrap min-w-[80px] px-3 py-2 hover:text-yellow-400 text-gray-300 transition-colors font-medium text-base sm:text-sm" aria-label="About">About</Link>
          </div>
          <div className="text-center text-gray-300 font-medium">© 2025 PNG Events. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium" aria-label="Terms">Terms</Link>
            <Link href="/privacy" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium" aria-label="Privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
