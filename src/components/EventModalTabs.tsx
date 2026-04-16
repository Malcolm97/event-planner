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
    <div role="tablist" aria-label="Event detail sections" className="grid grid-cols-3 gap-1.5 p-1.5 mx-2 sm:mx-3 md:mx-4 mb-3 sm:mb-4 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-2xl shadow-sm border border-white/70">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            id={`${tab.id}-tab`}
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
            tabIndex={isActive ? 0 : -1}
            className={`
              flex min-h-[48px] sm:min-h-[52px] items-center justify-center gap-1.5 sm:gap-2 px-2 py-2 sm:px-3 sm:py-2.5 font-semibold rounded-xl transition-all duration-300 modal-tab-label touch-manipulation
              ${isActive
                ? 'bg-white text-gray-900 shadow border border-gray-200 scale-[1.01]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
              }
            `}
          >
            <Icon size={15} className={isActive ? 'text-yellow-500' : ''} />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
};

export default EventModalTabs;
