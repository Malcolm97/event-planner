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
    <div className="flex mb-4 sm:mb-6 border-b border-gray-200/60 bg-gradient-to-r from-gray-50/80 to-white/80 rounded-xl p-1 mx-3 sm:mx-4 shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 font-semibold rounded-lg transition-all duration-300 text-sm sm:text-base touch-manipulation relative overflow-hidden ${
            activeTab === tab.id
              ? 'bg-white text-yellow-600 shadow-md border border-yellow-200 transform scale-[1.01]'
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
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};

export default EventModalTabs;
