import React from 'react';
import { FiInfo } from 'react-icons/fi';
import { EventItem } from '@/lib/types';

interface AboutEventTabProps {
  event: EventItem;
}

const AboutEventTab: React.FC<AboutEventTabProps> = ({ event }) => {
  return (
    <div className="space-y-6">
      {event?.description ? (
        <div className="flex items-start gap-5 p-8 rounded-3xl bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center shadow-md">
            <FiInfo size={20} className="text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-2xl mb-4">About This Event</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
              {event.description}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/60 text-gray-600 px-8 py-12 rounded-3xl text-center shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-md">
            <FiInfo size={24} className="text-gray-500" />
          </div>
          <h3 className="font-semibold text-xl mb-2">No Description Available</h3>
          <p className="text-lg">This event doesn't have a description yet.</p>
        </div>
      )}
    </div>
  );
};

export default AboutEventTab;
