'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const SupabaseStatusIndicator: React.FC = () => {
  const { supabaseConnected, supabaseError, connectionStatus } = useAuth();

  // Don't show indicator if Supabase is properly configured and connected
  if (supabaseConnected && !supabaseError) {
    return null;
  }

  const getStatusColor = () => {
    if (supabaseError) return 'bg-red-500';
    if (connectionStatus === 'error') return 'bg-red-500';
    if (connectionStatus === 'disconnected') return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getStatusText = () => {
    if (supabaseError) return supabaseError;
    if (connectionStatus === 'error') return 'Database connection error';
    if (connectionStatus === 'disconnected') return 'Database disconnected';
    return 'Checking database connection...';
  };

  const getHelpText = () => {
    if (supabaseError && supabaseError.includes('infinite recursion')) {
      return '🚨 CRITICAL: RLS policy infinite recursion detected. Run the fix in your Supabase SQL Editor.';
    }
    if (supabaseError && supabaseError.includes('not properly configured')) {
      return 'Please update your .env.local file with actual Supabase credentials.';
    }
    if (connectionStatus === 'error') {
      return 'Check your Supabase dashboard for service issues or configuration problems.';
    }
    return 'Some features may be limited while database is unavailable.';
  };

  return (
    <div className="fixed top-20 left-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Database Status
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getStatusText()}
          </p>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {getHelpText()}
      </div>
    </div>
  );
};

export default SupabaseStatusIndicator;