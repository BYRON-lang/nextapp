'use client';

import { Dispatch, SetStateAction } from 'react';

type FilterType = 'latest' | 'popular' | 'saas' | 'web3' | 'ai' | 'uiux' | 'webapp' | 'mobileapp' | 'dashboard' | 'portfolio' | 'darkmode' | '3d' | 'motion' | 'design' | 'startup' | 'about' | 'auth' | 'onboarding';

interface FiltersProps {
  activeFilter: 'latest' | 'popular';
  setActiveFilter: Dispatch<SetStateAction<'latest' | 'popular'>>;
  activeCategory: string | null;
  setActiveCategory: Dispatch<SetStateAction<string | null>>;
}

export default function Filters({ 
  activeFilter, 
  setActiveFilter,
  activeCategory,
  setActiveCategory 
}: FiltersProps) {

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
    const baseClass = 'px-4 py-1.5 rounded-2xl text-base font-medium cursor-pointer transition-all duration-200';
    const isActive = activeFilter === filterId || activeCategory === filterId;
    
    return isActive 
      ? `${baseClass} bg-[#191919] text-white border border-[#262626]`
      : `${baseClass} text-gray-400 hover:text-gray-300 hover:bg-[#1a1a1a]`;
  };

  return (
    <div className="w-full py-8 mt-12">
      <div className="flex flex-wrap gap-4 justify-start">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => {
              if (filter.id === 'latest' || filter.id === 'popular') {
                setActiveFilter(filter.id);
                setActiveCategory(null);
              } else {
                setActiveCategory(filter.id);
              }
            }}
            className={getButtonClass(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
