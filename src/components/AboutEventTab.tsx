import React from 'react';
import { FiInfo } from 'react-icons/fi';
import { EventItem } from '@/lib/types';

interface AboutEventTabProps {
  event: EventItem;
}

const AboutEventTab: React.FC<AboutEventTabProps> = ({ event }) => {
  // Check if description exists and is not just whitespace
  const hasValidDescription = event?.description && typeof event.description === 'string' && event.description.trim().length > 0;

  return (
    <div className="space-y-2">
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
    </div>
  );
};

export default AboutEventTab;
