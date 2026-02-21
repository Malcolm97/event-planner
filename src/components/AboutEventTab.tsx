import React from 'react';
import { FiInfo, FiExternalLink } from 'react-icons/fi';
import { EventItem } from '@/lib/types';
import { sanitizeUrl } from '@/lib/thirdPartyUtils';

interface AboutEventTabProps {
  event: EventItem;
}

const AboutEventTab: React.FC<AboutEventTabProps> = ({ event }) => {
  // Check if description exists and is not just whitespace
  const hasValidDescription = event?.description && typeof event.description === 'string' && event.description.trim().length > 0;
  
  // Check if external links exist and validate them
  const externalLinks = event?.external_links;
  const validatedLinks = externalLinks ? {
    facebook: sanitizeUrl(externalLinks.facebook),
    instagram: sanitizeUrl(externalLinks.instagram),
    tiktok: sanitizeUrl(externalLinks.tiktok),
    website: sanitizeUrl(externalLinks.website),
  } : null;
  
  const hasValidExternalLinks = validatedLinks && Object.values(validatedLinks).some(link => link !== null);

  return (
    <div className="space-y-3">
      {hasValidDescription ? (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200/60 shadow-sm">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center">
            <FiInfo size={14} className="text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">About This Event</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-xs sm:text-sm">
              {event.description.trim()}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/60 text-gray-600 px-4 py-5 rounded-xl text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <FiInfo size={16} className="text-gray-500" />
          </div>
          <h3 className="font-medium text-sm mb-1">No Description Available</h3>
          <p className="text-xs">This event doesn't have a description yet.</p>
        </div>
      )}

      {/* External Links Section */}
      {hasValidExternalLinks && (
        <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-xl p-3 border border-purple-200/60 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FiExternalLink size={14} className="text-purple-500" />
            <h4 className="text-sm font-semibold text-gray-700">Event Links</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {validatedLinks?.facebook && (
              <a
                href={validatedLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all duration-200 hover:scale-105"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C23.027 19.612 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </a>
            )}
            {validatedLinks?.instagram && (
              <a
                href={validatedLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white text-xs font-medium hover:scale-105 transition-all duration-200"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>Instagram</span>
              </a>
            )}
            {validatedLinks?.tiktok && (
              <a
                href={validatedLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black text-white text-xs font-medium hover:bg-gray-800 hover:scale-105 transition-all duration-200"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <span>TikTok</span>
              </a>
            )}
            {validatedLinks?.website && (
              <a
                href={validatedLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-700 text-white text-xs font-medium hover:bg-gray-800 hover:scale-105 transition-all duration-200"
              >
                <FiExternalLink size={14} />
                <span>Website</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutEventTab;
