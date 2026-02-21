'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { FiStar, FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { EventItem } from '@/lib/types';

// Define PNG-specific categories and their properties
const allCategories = [
  { name: 'Cultural Festivals', icon: FiMusic, color: 'bg-purple-100 text-purple-600' },
  { name: 'Rugby & Sports', icon: FiHeart, color: 'bg-green-100 text-green-600' },
  { name: 'Community Events', icon: FiCoffee, color: 'bg-orange-100 text-orange-600' },
  { name: 'Music & Concerts', icon: FiMusic, color: 'bg-pink-100 text-pink-600' },
  { name: 'Art & Exhibitions', icon: FiImage, color: 'bg-blue-100 text-blue-600' },
  { name: 'Business & Tech', icon: FiCpu, color: 'bg-indigo-100 text-indigo-600' },
  { name: 'Other', icon: FiStar, color: 'bg-gray-100 text-gray-700' },
];

const categoryIconMap: { [key: string]: IconType } = {
  'Cultural Festivals': FiMusic,
  'Rugby & Sports': FiHeart,
  'Community Events': FiCoffee,
  'Music & Concerts': FiMusic,
  'Art & Exhibitions': FiImage,
  'Business & Tech': FiCpu,
  'Other': FiStar,
};

const categoryColorMap: { [key: string]: string } = {
  'Cultural Festivals': 'bg-purple-100 text-purple-600',
  'Rugby & Sports': 'bg-green-100 text-green-600',
  'Community Events': 'bg-orange-100 text-orange-600',
  'Music & Concerts': 'bg-pink-100 text-pink-600',
  'Art & Exhibitions': 'bg-blue-100 text-blue-600',
  'Business & Tech': 'bg-indigo-100 text-indigo-600',
  'Other': 'bg-gray-100 text-gray-700',
};

interface CategoryGridProps {
  events: EventItem[];
}

const CategoryGrid = memo(function CategoryGrid({ events }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7 gap-4 md:gap-6 lg:gap-8">
      {allCategories
        .filter(cat => {
          if (cat.name === 'Other') {
            const predefinedCategoryNames = allCategories.filter(c => c.name !== 'Other').map(c => c.name);
            return events.some(ev => ev.category && !predefinedCategoryNames.includes(ev.category));
          } else {
            return events.some(ev => ev.category === cat.name);
          }
        })
        .map((cat) => {
          const Icon = categoryIconMap[cat.name] || FiStar;
          const categoryColor = categoryColorMap[cat.name] || 'bg-yellow-100 text-black';
          return (
            <Link
              href={`/categories?category=${encodeURIComponent(cat.name)}`}
              key={cat.name}
              className={`card-hover flex flex-col items-center justify-center gap-3 lg:gap-4 px-6 py-8 lg:px-8 lg:py-10 rounded-2xl lg:rounded-3xl border-2 border-border-color font-bold shadow-lg hover:shadow-xl lg:hover:shadow-2xl hover:border-yellow-400 transition-all duration-300 min-h-[140px] lg:min-h-[180px] xl:min-h-[200px] ${categoryColor} group`}
            >
              <span className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-full bg-card-background border-2 border-border-color group-hover:border-yellow-400 transition-all duration-300 shadow-md lg:shadow-lg">
                <Icon size={28} className="lg:w-8 lg:h-8" />
              </span>
              <span className="text-base lg:text-lg font-bold text-center">{cat.name}</span>
            </Link>
          );
        })}
    </div>
  );
});

CategoryGrid.displayName = 'CategoryGrid';

export default CategoryGrid;
