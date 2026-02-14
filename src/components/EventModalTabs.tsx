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
    <div className="flex gap-1 p-1 mx-2 sm:mx-3 mb-2 sm:mb-3 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-xl shadow-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 font-medium rounded-lg transition-all duration-300 text-xs sm:text-sm touch-manipulation
              ${isActive
                ? 'bg-white text-gray-900 shadow border border-gray-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }
            `}
          >
            <Icon size={14} className={isActive ? 'text-yellow-500' : ''} />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
};

export default EventModalTabs;
