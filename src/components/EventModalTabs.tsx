import React from 'react';
import { FiCalendar, FiInfo, FiUser } from 'react-icons/fi';

interface EventModalTabsProps {
  activeTab: 'event-details' | 'about-event' | 'host-details';
  onTabChange: (tab: 'event-details' | 'about-event' | 'host-details') => void;
}

const EventModalTabs: React.FC<EventModalTabsProps> = ({ activeTab, onTabChange }) => {
const tabs = [
    { 
      id: 'event-details' as const, 
      label: 'Event Details', 
      shortLabel: 'Details',
      icon: FiCalendar
    },
    { 
      id: 'about-event' as const, 
      label: 'About Event', 
      shortLabel: 'About',
      icon: FiInfo
    },
    { 
      id: 'host-details' as const, 
      label: 'Host', 
      shortLabel: 'Host',
      icon: FiUser
    },
  ];

  return (
    <div className="flex gap-1 sm:gap-2 p-1.5 mx-3 sm:mx-4 mb-4 sm:mb-6 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-2xl shadow-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 font-semibold rounded-xl transition-all duration-300 text-sm sm:text-base touch-manipulation
              ${isActive
                ? 'bg-white text-gray-900 shadow-lg border border-gray-200 transform scale-[1.02]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }
            `}
          >
            <Icon size={16} className={isActive ? 'text-yellow-500' : ''} />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
            
            {/* Active indicator dot */}
            {isActive && (
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default EventModalTabs;
