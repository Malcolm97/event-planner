'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';
import { supabase, TABLES } from '@/lib/supabase';
import { FiUser, FiLogOut, FiSettings, FiWifi, FiWifiOff, FiRefreshCw, FiClock, FiCheckCircle, FiAlertTriangle, FiDatabase } from 'react-icons/fi';
import Image from 'next/image';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { toast } from 'react-hot-toast';
import * as db from '@/lib/indexedDB';
import { storeSigninRedirect } from '@/lib/utils';


import React from 'react';
const Header = React.memo(function Header() {
  const { isOnline, isSyncing, lastSyncTime, syncError } = useNetworkStatus();
  const { queueLength, syncNow, isProcessingQueue } = useOfflineSync();
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null); // New state for user photo URL

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const [cachedEventsCount, setCachedEventsCount] = useState(0);


  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false); // New state for client-side check
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setHasMounted(true); // Set to true after component mounts on client
    setIsClient(true);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.profile-dropdown') && !target.closest('.network-dropdown')) {
        setIsProfileDropdownOpen(false);
        setIsNetworkDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check cached events count
  useEffect(() => {
    const checkCachedEvents = async () => {
      try {
        const events = await db.getEvents();
        setCachedEventsCount(events.length);
      } catch (error) {
        console.warn('Failed to check cached events:', error);
        setCachedEventsCount(0);
      }
    };

    checkCachedEvents();
    // Check periodically when offline
    if (!isOnline) {
      const interval = setInterval(checkCachedEvents, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isOnline]);



  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Fetch user name and photo from profile
        const { data } = await supabase
          .from(TABLES.USERS)
          .select('name, photo_url')
          .eq('id', user.id)
          .single();
        
        if (data?.name) {
          setUserName(data.name);
        }
        if (data?.photo_url) {
          setUserPhotoUrl(data.photo_url);
        }
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Fetch user name and photo from profile
        const { data } = await supabase
          .from(TABLES.USERS)
          .select('name, photo_url')
          .eq('id', session.user.id)
          .single();
        
        if (data?.name) {
          setUserName(data.name);
        }
        if (data?.photo_url) {
          setUserPhotoUrl(data.photo_url);
        } else {
          setUserPhotoUrl(null);
        }
      } else {
        setUser(null);
        setUserName('');
        setUserPhotoUrl(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Determine the current sync state
  const getSyncState = () => {
    if (!isOnline) return 'offline';
    if (isSyncing || isProcessingQueue) return 'syncing';
    if (syncError) return 'error';
    if (queueLength > 0) return 'has-queue';
    return 'online';
  };

  const syncState = getSyncState();

  // Offline-aware navigation helper
  const navigateWithOfflineCheck = (path: string, description: string) => {
    // Always allow navigation to home, settings, and about (static-ish pages)
    const alwaysAllowedPaths = ['/', '/settings', '/about'];

    if (isOnline || alwaysAllowedPaths.includes(path)) {
      router.push(path);
      return;
    }

    // For dynamic pages when offline, show a message
    toast.error(`"${description}" is not available offline. Please connect to the internet and try again.`, {
      duration: 4000,
    });
  };





  return (
    <header className="glass-effect shadow-lg border-b border-gray-200/50 sticky top-0 z-[100] backdrop-blur-md safe-area-inset">
      <div className="max-w-7xl mx-auto container-padding">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 rounded-lg p-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105">
              <span className="text-white font-bold text-sm sm:text-base">PNG</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Events
            </span>
          </Link>
          {/* Centered nav for desktop */}
          <nav className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 items-center space-x-6 xl:space-x-8">
            <Button onClick={() => navigateWithOfflineCheck('/events', 'Events')} variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm xl:text-base h-auto px-3 py-2">Events</Button>
            <Button onClick={() => navigateWithOfflineCheck('/categories', 'Categories')} variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm xl:text-base h-auto px-3 py-2">Categories</Button>
            <Button onClick={() => router.push('/creators')} variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm xl:text-base h-auto px-3 py-2">Creators</Button>
            <Button onClick={() => router.push('/about')} variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm xl:text-base h-auto px-3 py-2">About</Button>
          </nav>
          {/* Right side actions */}
          <div className="flex items-center space-x-2 xl:space-x-3">
            {/* Network Status */}
            <div className="relative network-dropdown lg:hidden">
              <Button
                onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                variant="ghost"
                className={`flex items-center text-sm xl:text-base h-auto px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                  syncState === 'offline' ? 'text-red-600' :
                  syncState === 'syncing' ? 'text-blue-600' :
                  syncState === 'error' ? 'text-red-600' :
                  syncState === 'has-queue' ? 'text-yellow-600' :
                  'text-green-600'
                }`}
                aria-expanded={isNetworkDropdownOpen}
                aria-haspopup="menu"
                title={syncState === 'offline' ? 'Offline Mode' :
                       syncState === 'syncing' ? 'Syncing...' :
                       syncState === 'error' ? 'Sync Error' :
                       syncState === 'has-queue' ? 'Pending Sync' :
                       'Online'}
              >
                {syncState === 'offline' ? <FiWifiOff size={16} /> :
                 syncState === 'syncing' ? <FiRefreshCw size={16} className="animate-spin" /> :
                 syncState === 'error' ? <FiAlertTriangle size={16} /> :
                 syncState === 'has-queue' ? <FiClock size={16} /> :
                 <FiWifi size={16} />}
              </Button>

              {isNetworkDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-3 z-[100] backdrop-blur-sm">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">Network Status</p>
                    <p className="text-xs text-gray-500">Connection & sync information</p>
                  </div>
                  <div className="py-2">
                    {/* Cached events indicator */}
                    {!isOnline && cachedEventsCount > 0 && (
                      <div className="px-4 py-2 flex items-center space-x-3 text-sm text-blue-700">
                        <FiDatabase size={16} />
                        <span>{cachedEventsCount} cached events</span>
                      </div>
                    )}

                    {/* Queue indicator */}
                    {queueLength > 0 && (
                      <div className="px-4 py-2 flex items-center space-x-3 text-sm text-orange-700">
                        <FiClock size={16} />
                        <span>{queueLength} pending operation{queueLength !== 1 ? 's' : ''}</span>
                      </div>
                    )}

                    {/* Status */}
                    <div className="px-4 py-2">
                      <div className="flex items-center space-x-3 text-sm">
                        {syncState === 'offline' ? <FiWifiOff size={16} className="text-red-600" /> :
                         syncState === 'syncing' ? <FiRefreshCw size={16} className="text-blue-600 animate-spin" /> :
                         syncState === 'error' ? <FiAlertTriangle size={16} className="text-red-600" /> :
                         syncState === 'has-queue' ? <FiClock size={16} className="text-yellow-600" /> :
                         <FiCheckCircle size={16} className="text-green-600" />}
                        <span className="font-medium">
                          {syncState === 'offline' ? 'Offline Mode' :
                           syncState === 'syncing' ? 'Syncing...' :
                           syncState === 'error' ? 'Sync Error' :
                           syncState === 'has-queue' ? 'Online (Pending)' :
                           'Online'}
                        </span>
                      </div>
                      {lastSyncTime && isOnline && (
                        <div className="text-xs text-gray-500 mt-1">
                          Last synced: {new Date(lastSyncTime).toLocaleTimeString()}
                        </div>
                      )}
                      {syncState === 'offline' && (
                        <div className="text-xs text-gray-500 mt-1">
                          Changes will sync when online
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {(syncState === 'error' || syncState === 'has-queue') && (
                      <div className="border-t border-gray-100 mt-2 pt-2 px-4">
                        <button
                          onClick={() => { syncNow(); setIsNetworkDropdownOpen(false); }}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          {syncState === 'error' ? 'Retry Sync' : 'Sync Now'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button onClick={() => navigateWithOfflineCheck('/create-event', 'Create Event')} variant="primary" size="sm" className="hidden lg:flex items-center text-sm xl:text-base">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden xl:inline">Create Event</span>
              <span className="xl:hidden">Create</span>
            </Button>

            {user ? (
              <div className="relative profile-dropdown">
                <Button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  variant="ghost"
                  className="hidden lg:flex items-center text-gray-700 hover:text-gray-900 font-medium transition-colors text-sm xl:text-base h-auto px-2 py-2 rounded-lg hover:bg-gray-100"
                  aria-expanded={isProfileDropdownOpen}
                  aria-haspopup="menu"
                >
                  {userPhotoUrl ? (
                    <Image src={userPhotoUrl} alt="User Photo" width={24} height={24} className="rounded-full inline mr-1 sm:mr-2" />
                  ) : (
                    <FiUser size={16} className="inline mr-1 sm:mr-2" />
                  )}
                  <span className="hidden xl:inline">{userName || 'Dashboard'}</span>
                  <span className="xl:hidden">{userName ? userName.split(' ')[0] : 'Profile'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-3 z-[100] backdrop-blur-sm">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{userName || 'User'}</p>
                      <p className="text-xs text-gray-500">Manage your account</p>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => { navigateWithOfflineCheck('/dashboard', 'Dashboard'); setIsProfileDropdownOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                      >
                        <FiUser size={16} />
                        <span>Dashboard</span>
                      </button>
                      <button
                        onClick={() => { router.push('/settings'); setIsProfileDropdownOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                      >
                        <FiSettings size={16} />
                        <span>Settings</span>
                      </button>
                    </div>
                    <div className="border-t border-gray-100 my-2"></div>
                    <div className="px-4">
                      <button
                        onClick={() => { handleSignOut(); setIsProfileDropdownOpen(false); }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <FiLogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              hasMounted && isOnline && (
                <Button
                  onClick={() => {
                    // Store current URL for redirect after sign-in
                    const currentUrl = window.location.pathname + window.location.search;
                    storeSigninRedirect(currentUrl);
                    router.push('/signin');
                  }}
                  variant="ghost"
                  className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm xl:text-base h-auto px-2 py-2"
                >
                  <FiUser size={14} className="inline mr-1 sm:mr-2" />Sign In
                </Button>
              )
            )}
          </div>

        </div>


      </div>
    </header>
  );
});
export default Header;
