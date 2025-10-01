import React from 'react';

interface EventModalTabsProps {
  activeTab: 'event-details' | 'about-event' | 'host-details';
  onTabChange: (tab: 'event-details' | 'about-event' | 'host-details') => void;
}

const EventModalTabs: React.FC<EventModalTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'event-details' as const, label: 'Event Details', shortLabel: 'Details' },
    { id: 'about-event' as const, label: 'About Event', shortLabel: 'About' },
    { id: 'host-details' as const, label: 'Host Details', shortLabel: 'Host' },
  ];

  return (
    <div className="flex mb-6 sm:mb-8 border-b border-gray-200/60 bg-gradient-to-r from-gray-50/80 to-white/80 rounded-2xl p-1.5 mx-4 sm:mx-6 shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-4 py-3 sm:px-6 sm:py-4 font-semibold rounded-xl transition-all duration-300 text-sm sm:text-base lg:text-lg touch-manipulation relative overflow-hidden ${
            activeTab === tab.id
              ? 'bg-white text-yellow-600 shadow-lg border border-yellow-200 transform scale-[1.02]'
              : 'text-gray-600 hover:text-gray-800 hover:bg-white/60'
          }`}
        >
          {/* Background gradient for active state */}
          {activeTab === tab.id && (
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-50 to-orange-50 opacity-50" />
          )}

          {/* Tab content */}
          <span className="relative z-10 hidden sm:inline">{tab.label}</span>
          <span className="relative z-10 sm:hidden">{tab.shortLabel}</span>

          {/* Active indicator */}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};

export default EventModalTabs;
