import React from 'react';

interface CategoryTabsProps {
  activeTab: 'categories' | 'locations';
  onTabChange: (tab: 'categories' | 'locations') => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'categories' as const, label: 'Categories' },
    { id: 'locations' as const, label: 'Locations' },
  ];

  return (
    <div className="flex mb-6 border-b border-gray-200 bg-gradient-to-r from-gray-50/80 to-white/80 rounded-xl p-1 mx-3 sm:mx-4 shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 font-semibold rounded-lg transition-all duration-300 text-sm sm:text-base touch-manipulation relative overflow-hidden ${
            activeTab === tab.id
              ? 'bg-white text-blue-600 shadow-md border border-blue-200 transform scale-[1.01]'
              : 'text-gray-600 hover:text-gray-800 hover:bg-white/60'
          }`}
        >
          {/* Background gradient for active state */}
          {activeTab === tab.id && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50" />
          )}

          {/* Tab content */}
          <span className="relative z-10">{tab.label}</span>

          {/* Active indicator */}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
