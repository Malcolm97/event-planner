'use client';

import { User } from '@/lib/supabase';
import Image from 'next/image';

// Base64 encoded SVG for a default user avatar (Simple User Silhouette)
const DEFAULT_AVATAR_SVG_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5YTNhZiIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjQiLz4KICA8cGF0aCBkPSJNMTIgMTRjLTQuNDE4IDAtOCAyLjIzOS04IDV2MWgxNnYtMWMwLTIuNzYxLTMuNTgyLTUtOC01eiIvPgo8L3N2Zz4=`;

interface UserProfileProps {
  userProfile?: User | null;
  onError?: (msg: string) => void;
}

export default function UserProfile({ userProfile, onError }: UserProfileProps) {
  // Handle case where user profile is not yet created (userProfile is null/undefined)
  // This is the "loading" state when coming from dashboard
  if (!userProfile) {
    return (
      <div className="text-center animate-pulse">
        <div className="w-20 h-20 rounded-full bg-gray-300 mx-auto mb-4"></div>
        <div className="h-6 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>
    );
  }

  // We have userProfile data - display it
  const displayName = userProfile?.name || 'Unnamed User';
  const displayEmail = userProfile?.email || 'No email available';
  const displayPhotoUrl = userProfile?.photo_url;

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
      
      {userProfile?.company && (
        <p className="text-gray-700 text-sm mb-2">
          <span className="font-medium">Company:</span> {userProfile.company}
        </p>
      )}
      
      {userProfile?.phone && (
        <p className="text-gray-700 text-sm mb-2">
          <span className="font-medium">Phone:</span> {userProfile.phone}
        </p>
      )}
      
      {userProfile?.about && (
        <p className="text-gray-600 text-sm mt-3 p-3 bg-gray-50 rounded-lg">
          {userProfile.about}
        </p>
      )}
    </div>
  );
}
