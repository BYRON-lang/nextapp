'use client';

import { useState } from 'react';

type FilterType = 'latest' | 'popular' | 'saas' | 'web3' | 'ai' | 'uiux' | 'webapp' | 'mobileapp' | 'dashboard' | 'portfolio' | 'darkmode' | '3d' | 'motion' | 'design' | 'startup' | 'about' | 'auth' | 'onboarding';

export default function Filters() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('latest');

  const filters: { id: FilterType; label: string }[] = [
    { id: 'latest', label: 'Latest' },
    { id: 'popular', label: 'Popular' },
    { id: 'saas', label: 'SaaS' },
    { id: 'web3', label: 'Web3' },
    { id: 'ai', label: 'AI' },
    { id: 'uiux', label: 'UI/UX' },
    { id: 'webapp', label: 'Web App' },
    { id: 'mobileapp', label: 'Mobile App' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'darkmode', label: 'Dark Mode' },
    { id: '3d', label: '3D' },
    { id: 'motion', label: 'Motion' },
    { id: 'design', label: 'Design' },
    { id: 'startup', label: 'Startup' },
    { id: 'about', label: 'About' },
    { id: 'auth', label: 'Auth' },
    { id: 'onboarding', label: 'Onboarding' },
  ];

  const getButtonClass = (filterId: FilterType) => {
    const baseClass = 'px-4 py-1.5 rounded-2xl text-base font-medium cursor-pointer';
    const activeClass = 'bg-[#191919] text-white border border-[#262626]';
    const inactiveClass = 'text-gray-400 hover:text-gray-300 transition-colors duration-150';
    
    return `${baseClass} ${activeFilter === filterId ? activeClass : inactiveClass}`;
  };

  return (
    <div className="w-full py-8 mt-12">
      <div className="flex flex-wrap gap-4 justify-start">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={getButtonClass(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
