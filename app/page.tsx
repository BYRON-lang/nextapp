'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Filters from './components/Filters';
import WebsiteCard from './components/WebsiteCard';
import { getWebsites, Website } from './lib/websiteService';

// Number of items to load per page (defined outside component to maintain referential equality)
const ITEMS_PER_PAGE = 6; // Smaller batch size for better pagination

export default function Home() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [lastDoc, setLastDoc] = useState<{ id: string; data: any } | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState('latest');

  // Fetch initial websites when filter changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchInitialWebsites = async () => {
      try {
        setLoading(true);
        const { websites, lastDoc } = await getWebsites({
          sortBy: activeFilter === 'popular' ? 'popular' : 'latest',
          limit: ITEMS_PER_PAGE
        });
        
        if (isMounted) {
          setWebsites(websites);
          setLastDoc(lastDoc);
          // Only set hasMore to false if we get fewer items than requested
          setHasMore(websites.length >= ITEMS_PER_PAGE);
        }
      } catch (error) {
        console.error('Error fetching websites:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Reset state when filter changes
    setWebsites([]);
    setLastDoc(null);
    setHasMore(true);
    fetchInitialWebsites();

    return () => {
      isMounted = false;
    };
  }, [activeFilter]);

  // Function to load more websites
  const loadMoreWebsites = useCallback(async () => {
    if (isFetching || !hasMore || !lastDoc) return;

    try {
      setIsFetching(true);
      const { websites: newWebsites, lastDoc: newLastDoc } = await getWebsites({
        sortBy: activeFilter === 'popular' ? 'popular' : 'latest',
        limit: ITEMS_PER_PAGE,
        offsetDoc: lastDoc
      });

      if (newWebsites.length > 0) {
        setWebsites(prev => {
          // Create a map of existing IDs for faster lookup
          const existingIds = new Set(prev.map(w => w.id));
          // Only add websites that aren't already in the list
          const uniqueNewWebsites = newWebsites.filter(w => !existingIds.has(w.id));
          return [...prev, ...uniqueNewWebsites];
        });
        
        setLastDoc(newLastDoc);
        // Only set hasMore to false if we get fewer items than requested
        setHasMore(newWebsites.length >= ITEMS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more websites:', error);
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, hasMore, lastDoc, activeFilter]);

  // Handle scroll events for infinite loading
  useEffect(() => {
    if (isFetching || !hasMore) return;

    let scrollTimeout: NodeJS.Timeout;
    let isFetchingScroll = false;

    const handleScroll = () => {
      if (isFetching || isFetchingScroll || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollThreshold = 500; // Start loading when 500px from bottom

      if (scrollTop + clientHeight >= scrollHeight - scrollThreshold) {
        if (!scrollTimeout) {
          scrollTimeout = setTimeout(() => {
            if (isFetching || isFetchingScroll || !hasMore) return;
            isFetchingScroll = true;
            loadMoreWebsites().finally(() => {
              isFetchingScroll = false;
              clearTimeout(scrollTimeout);
            });
          }, 100);
        }
      }
    };

    // Initial check in case the page isn't scrollable yet
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [loadMoreWebsites, isFetching, hasMore]);
  return (
    <div className="min-h-screen bg-[#141414] px-10 pt-4 pb-8">
      <header className="relative w-full">
        <div className="relative w-32 h-auto aspect-[4/1]">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            fill 
            className="object-contain invert" 
            priority
          />
        </div>
        <div className="absolute right-4 top-0 flex items-center gap-6">
          <a 
            href="#" 
            className="text-white text-xl hover:underline underline-offset-4 transition-all duration-200"
          >
            Category
          </a>
          <button 
            className="bg-[#262626] text-white px-6 py-2 rounded-full text-lg font-medium hover:bg-[#333] transition-colors duration-200 cursor-pointer"
          >
            Submit
          </button>
        </div>
      </header>
      
      {/* Hero Section */}
      <main className="flex flex-col items-center justify-start pt-20 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 bg-clip-text text-transparent">
          Curated Website<br />
          Design Inspiration
        </h1>
        <p className="text-base md:text-lg text-gray-300 max-w-2xl leading-relaxed">
          Handpicked curated website designs to inspire your next project
        </p>
      </main>
      
      {/* Filters Section */}
      <Filters />

      {/* Website Grid */}
      <div className="w-full mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((website, index) => (
            <WebsiteCard key={`${website.id}-${index}`} {...website} />
          ))}
          
          {/* Loading skeleton when initially loading */}
          {loading && [...Array(6)].map((_, i) => (
            <div key={`skeleton-${i}`} className="w-full h-[400px] bg-[#0a0a0a] border border-[#262626] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
