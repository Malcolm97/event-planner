'use client';

import { useState, useEffect } from 'react';
import { supabase, TABLES, User } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Base64 encoded SVG for a default user avatar (Simple User Silhouette)
const DEFAULT_AVATAR_SVG_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5YTNhZiIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjQiLz4KICA8cGF0aCBkPSJNMTIgMTRjLTQuNDE4IDAtOCAyLjIzOS04IDV2MWgxNnYtMWMwLTIuNzYxLTMuNTgyLTUtOC01eiIvPgo8L3N2Zz4=`;

interface UserProfileProps {
  onError?: (msg: string) => void;
}

export default function UserProfile({ onError }: UserProfileProps) {
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const stableOnError = onError ?? (() => {});
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return; // Do not fetch if user is null
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user profile from users table
        const { data, error: fetchError } = await supabase
          .from(TABLES.USERS)
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          // If user not found, still allow display but show empty state
          if (fetchError.code === 'PGRST116') {
            console.warn('User profile not yet created:', user.id);
            if (isMounted) {
              setUserData(null);
              setLoading(false);
            }
            return;
          }
          
          console.error('Error fetching user profile:', fetchError);
          setError('Failed to load user profile');
          stableOnError('Failed to load user profile');
          return;
        }

        if (isMounted && data) {
          setUserData(data);
          stableOnError(''); // Clear any previous errors

          // Redirect to edit profile if user data is incomplete and hasn't redirected yet
          if (!hasRedirected && Object.keys(data).length === 0) {
            router.push('/dashboard/edit-profile');
            setHasRedirected(true);
          }
        } else if (isMounted) {
          setUserData(null);
        }
      } catch (err: any) {
        console.error('Error in UserProfile:', err);
        setError(err.message || 'An unexpected error occurred');
        stableOnError(err.message || 'An unexpected error occurred');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Start fetching immediately if user is available, don't wait for authLoading
    if (user) {
      fetchUserData();
    }

    return () => {
      isMounted = false;
    };
  }, [user, stableOnError, router, hasRedirected]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (loading && !userData) {
    return (
      <div className="text-center animate-pulse">
        <div className="w-20 h-20 rounded-full bg-gray-300 mx-auto mb-4"></div>
        <div className="h-6 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>
    );
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

  if (!userData && !user) { // Also check if auth user is null
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

  // Handle case where user exists but profile not yet created
  if (!userData && user) {
    const displayName = user?.user_metadata?.name || 'Unnamed User';
    const displayEmail = user?.email || 'No email available';
    const displayPhotoUrl = user?.user_metadata?.avatar_url;

    return (
      <div className="text-center">
        {displayPhotoUrl ? (
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4">
            <Image src={displayPhotoUrl} alt="User Photo" width={80} height={80} className="object-cover" />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4">
            <Image src={DEFAULT_AVATAR_SVG_BASE64} alt="Default User Avatar" width={80} height={80} />
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{displayName}</h3>
        <p className="text-gray-600 text-sm mb-4">{displayEmail}</p>
        <p className="text-gray-500 text-xs text-center py-2">
          Profile data coming soon...
        </p>
      </div>
    );
  }

  const displayName = user?.user_metadata?.name || userData?.name || 'Unnamed User';
  const displayEmail = user?.email || userData?.email || 'No email available';
  const displayPhotoUrl = userData?.photo_url || user?.user_metadata?.avatar_url;

  return (
    <div className="text-center">
      {displayPhotoUrl ? (
        <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4">
          <Image src={displayPhotoUrl} alt="User Photo" width={80} height={80} className="object-cover" />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4">
          {/* Using a local image for the default avatar */}
          <Image src={DEFAULT_AVATAR_SVG_BASE64} alt="Default User Avatar" width={80} height={80} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{displayName}</h3>
      <p className="text-gray-600 text-sm mb-4">{displayEmail}</p>
      
      {userData?.company && (
        <p className="text-gray-700 text-sm mb-2">
          <span className="font-medium">Company:</span> {userData.company}
        </p>
      )}
      
      {userData?.phone && (
        <p className="text-gray-700 text-sm mb-2">
          <span className="font-medium">Phone:</span> {userData.phone}
        </p>
      )}
      
      {userData?.about && (
        <p className="text-gray-600 text-sm mt-3 p-3 bg-gray-50 rounded-lg">
          {userData.about}
        </p>
      )}
    </div>
  );
}
