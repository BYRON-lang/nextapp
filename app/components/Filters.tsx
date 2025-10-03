'use client';

import { Dispatch, SetStateAction } from 'react';
import '../styles/scrollbar-hide.css';

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
    const baseClass = 'px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs sm:text-base font-medium cursor-pointer transition-all duration-200 whitespace-nowrap';
    const isActive = activeFilter === filterId || activeCategory === filterId;
    
    return isActive 
      ? `${baseClass} bg-[#191919] text-white border border-[#262626]`
      : `${baseClass} text-gray-400 hover:text-gray-300 hover:bg-[#1a1a1a]`;
  };

  return (
    <div className="w-full py-4 sm:py-8 mt-8 sm:mt-12 relative">
      <div className="relative">
        {/* Gradient fade effect on the right side */}
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-[#141414] to-transparent z-10 pointer-events-none"></div>
        <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 sm:pb-4 -mx-2 sm:-mx-4 px-2 sm:px-4 scrollbar-hide">
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
    </div>
  );
}
