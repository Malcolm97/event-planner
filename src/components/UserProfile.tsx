'use client';

import { useState, useEffect } from 'react';
import { supabase, TABLES, User } from '../lib/supabase';
import Image from 'next/image'; // Import Image component

interface UserProfileProps {
  onError?: (msg: string) => void;
}

export default function UserProfile({ onError }: UserProfileProps) {
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const stableOnError = onError ?? (() => {});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('No authenticated user found');
          stableOnError('No authenticated user found');
          return;
        }

        // Fetch user profile from users table
        const { data, error: fetchError } = await supabase
          .from(TABLES.USERS)
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching user profile:', fetchError);
          setError('Failed to load user profile');
          stableOnError('Failed to load user profile');
          return;
        }

        if (data) {
          setUserData(data);
          stableOnError(''); // Clear any previous errors
        } else {
          setError('User profile not found');
          stableOnError('User profile not found');
        }
      } catch (err: any) {
        console.error('Error in UserProfile:', err);
        setError(err.message || 'An unexpected error occurred');
        stableOnError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [stableOnError, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (loading && !userData) {
    return <p className="text-gray-500 text-sm text-center">Loading user data...</p>;
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-500 text-sm text-center mb-3">Error: {error}</p>
        <button
          onClick={handleRetry}
          className="px-3 py-1 bg-yellow-400 text-black text-sm rounded hover:bg-yellow-500 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center">
        <div className="text-red-500 text-sm text-center mb-3">Unable to load user data. Please try again later.</div>
        <button
          onClick={handleRetry}
          className="px-3 py-1 bg-yellow-400 text-black text-sm rounded hover:bg-yellow-500 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      {userData.photo_url ? (
        <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4">
          <Image src={userData.photo_url} alt="User Photo" width={80} height={80} objectFit="cover" />
        </div>
      ) : (
        <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
          {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{userData.name || 'Unnamed User'}</h3>
      <p className="text-gray-600 text-sm mb-4">{userData.email || 'No email available'}</p>
      
      {userData.company && (
        <p className="text-gray-700 text-sm mb-2">
          <span className="font-medium">Company:</span> {userData.company}
        </p>
      )}
      
      {userData.phone && (
        <p className="text-gray-700 text-sm mb-2">
          <span className="font-medium">Phone:</span> {userData.phone}
        </p>
      )}
      
      {userData.about && (
        <p className="text-gray-600 text-sm mt-3 p-3 bg-gray-50 rounded-lg">
          {userData.about}
        </p>
      )}
    </div>
  );
}
