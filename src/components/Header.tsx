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
import { storeSigninRedirect, isAutoSyncEnabled } from '@/lib/utils';

import React from 'react';

const Header = React.memo(function Header() {
  const { isOnline, isSyncing, lastSyncTime, syncError, connectionQuality } = useNetworkStatus();
  const { queueLength, syncNow, isProcessingQueue } = useOfflineSync();
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const [cachedEventsCount, setCachedEventsCount] = useState(0);

  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setHasMounted(true);
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
      const interval = setInterval(checkCachedEvents, 30000);
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

  // Sync state configuration for cleaner rendering
  const syncStateConfig = {
    offline: {
      icon: FiWifiOff,
      color: 'text-red-600 hover:bg-red-50',
      bgClass: 'bg-red-100 text-red-600',
      label: 'Offline Mode',
      description: 'Limited functionality available',
    },
    syncing: {
      icon: FiRefreshCw,
      color: 'text-blue-600 hover:bg-blue-50',
      bgClass: 'bg-blue-100 text-blue-600',
      label: 'Syncing Data',
      description: 'Updating your data...',
      animate: true,
    },
    error: {
      icon: FiAlertTriangle,
      color: 'text-red-600 hover:bg-red-50',
      bgClass: 'bg-red-100 text-red-600',
      label: 'Sync Error',
      description: 'Connection issue detected',
      showNotification: true,
    },
    'has-queue': {
      icon: FiClock,
      color: 'text-yellow-600 hover:bg-yellow-50',
      bgClass: 'bg-yellow-100 text-yellow-600',
      label: 'Pending Sync',
      description: 'Changes ready to sync',
      showNotification: true,
    },
    online: {
      icon: FiWifi,
      color: 'text-green-600 hover:bg-green-50',
      bgClass: 'bg-green-100 text-green-600',
      label: 'Online',
      description: 'Fully connected',
    },
  };

  const currentSyncConfig = syncStateConfig[syncState];
  const SyncIcon = currentSyncConfig.icon;

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

  // Determine if we should show cached data banner
  const shouldShowCachedDataBanner = !isOnline && cachedEventsCount > 0;

  return (
    <>
      {/* Saved Data Banner for Mobile/Tablet */}
      {shouldShowCachedDataBanner && (
        <div className="bg-blue-600 text-white text-center py-2 px-4 text-sm font-medium lg:hidden">
          <div className="flex items-center justify-center gap-2">
            <FiDatabase size={16} />
            <span>Saved events ({cachedEventsCount})</span>
          </div>
        </div>
      )}

      <header className="glass-effect shadow-sm border-b border-gray-200/50 sticky top-0 z-[100] backdrop-blur-md lg:shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 xl:px-12">
          <div className="flex justify-between items-center h-11 sm:h-14 lg:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 lg:space-x-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 rounded-lg p-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-10 lg:h-10 bg-gradient-to-br from-yellow-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105">
                <span className="text-white font-bold text-sm sm:text-base lg:text-base">PNG</span>
              </div>
              <span className="text-base sm:text-base lg:text-xl font-bold text-foreground tracking-tight">
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
              {/* Network Status - Mobile/Tablet only */}
              <div className="relative network-dropdown lg:hidden">
                <Button
                  onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                  variant="ghost"
                  className={`relative flex items-center text-sm xl:text-base h-auto px-3 py-2 rounded-xl transition-all duration-200 hover:bg-gray-50 hover:scale-105 active:scale-95 ${
                    syncState === 'offline' ? 'text-red-600 hover:bg-red-50' :
                    syncState === 'syncing' ? 'text-blue-600 hover:bg-blue-50' :
                    syncState === 'error' ? 'text-red-600 hover:bg-red-50' :
                    syncState === 'has-queue' ? 'text-yellow-600 hover:bg-yellow-50' :
                    'text-green-600 hover:bg-green-50'
                  }`}
                  aria-expanded={isNetworkDropdownOpen}
                  aria-haspopup="menu"
                  title={syncState === 'offline' ? 'Offline Mode' :
                         syncState === 'syncing' ? 'Syncing...' :
                         syncState === 'error' ? 'Sync Error' :
                         syncState === 'has-queue' ? 'Pending Sync' :
                         'Online'}
                >
                  <div className="relative">
                    {syncState === 'offline' ? <FiWifiOff size={18} /> :
                     syncState === 'syncing' ? <FiRefreshCw size={18} className="animate-spin" /> :
                     syncState === 'error' ? <FiAlertTriangle size={18} /> :
                     syncState === 'has-queue' ? <FiClock size={18} /> :
                     <FiWifi size={18} />}

                    {/* Notification dot for pending/error states */}
                    {(syncState === 'error' || syncState === 'has-queue') && (
                      <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse ${
                        syncState === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                    )}
                  </div>
                </Button>

                {isNetworkDropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200/50 backdrop-blur-xl z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100/80 bg-gradient-to-r from-gray-50/50 to-white/50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${
                          syncState === 'offline' ? 'bg-red-100 text-red-600' :
                          syncState === 'syncing' ? 'bg-blue-100 text-blue-600' :
                          syncState === 'error' ? 'bg-red-100 text-red-600' :
                          syncState === 'has-queue' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {syncState === 'offline' ? <FiWifiOff size={20} /> :
                           syncState === 'syncing' ? <FiRefreshCw size={20} className="animate-spin" /> :
                           syncState === 'error' ? <FiAlertTriangle size={20} /> :
                           syncState === 'has-queue' ? <FiClock size={20} /> :
                           <FiWifi size={20} />}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900">
                            {syncState === 'offline' ? 'Offline Mode' :
                             syncState === 'syncing' ? 'Syncing Data' :
                             syncState === 'error' ? 'Sync Error' :
                             syncState === 'has-queue' ? 'Pending Sync' :
                             'Online'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {syncState === 'offline' ? 'Limited functionality available' :
                             syncState === 'syncing' ? 'Updating your data...' :
                             syncState === 'error' ? 'Connection issue detected' :
                             syncState === 'has-queue' ? 'Changes ready to sync' :
                             'Fully connected'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Saved events indicator */}
                      {!isOnline && cachedEventsCount > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FiDatabase size={16} className="text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-blue-900">Saved Events</p>
                            <p className="text-xs text-blue-700">{cachedEventsCount} event{cachedEventsCount !== 1 ? 's' : ''} saved offline</p>
                          </div>
                        </div>
                      )}

                      {/* Queue indicator */}
                      {queueLength > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <FiClock size={16} className="text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-orange-900">Pending Changes</p>
                            <p className="text-xs text-orange-700">{queueLength} item{queueLength !== 1 ? 's' : ''} waiting to sync</p>
                          </div>
                        </div>
                      )}

                      {/* Last sync time */}
                      {lastSyncTime && isOnline && isAutoSyncEnabled() && (
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <FiCheckCircle size={16} className="text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-900">Last Synced</p>
                            <p className="text-xs text-green-700">{new Date(lastSyncTime).toLocaleString()}</p>
                          </div>
                        </div>
                      )}

                      {/* Offline message */}
                      {syncState === 'offline' && (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Offline Mode:</span> Your changes will automatically sync when you reconnect to the internet.
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      {(syncState === 'error' || syncState === 'has-queue') && (
                        <div className="pt-2 border-t border-gray-100">
                          <button
                            onClick={() => { syncNow(); setIsNetworkDropdownOpen(false); }}
                            disabled={isProcessingQueue}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                              isProcessingQueue
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : syncState === 'error'
                                  ? 'bg-red-500 hover:bg-red-600 text-white hover:scale-105 active:scale-95'
                                  : 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105 active:scale-95'
                            }`}
                          >
                            {isProcessingQueue ? (
                              <>
                                <FiRefreshCw size={16} className="animate-spin" />
                                Syncing...
                              </>
                            ) : (
                              <>
                                <FiRefreshCw size={16} />
                                {syncState === 'error' ? 'Retry Sync' : 'Sync Now'}
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop: Create Event + User Profile grouped together */}
              <div className="hidden lg:flex items-center gap-2">
                <Button onClick={() => navigateWithOfflineCheck('/create-event', 'Create Event')} variant="primary" size="sm" className="flex items-center text-sm xl:text-base">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 xl:h-5 xl:w-5 mr-1 xl:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      className="flex items-center text-gray-700 hover:text-gray-900 font-medium transition-colors text-sm xl:text-base h-auto px-2 py-2 rounded-lg hover:bg-gray-100"
                      aria-expanded={isProfileDropdownOpen}
                      aria-haspopup="menu"
                    >
                      {userPhotoUrl ? (
                        <Image src={userPhotoUrl} alt="User Photo" width={24} height={24} className="rounded-full inline mr-1 xl:mr-2" />
                      ) : (
                        <FiUser size={16} className="inline mr-1 xl:mr-2" />
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
        </div>
      </header>
    </>
  );
});

export default Header;
