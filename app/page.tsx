'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Filters from './components/Filters';
import { getWebsites, Website } from './lib/websiteService';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

// Dynamically import WebsiteCard with no SSR
const WebsiteCard = dynamic(() => import('./components/WebsiteCard'), {
  ssr: false,
});

const ITEMS_PER_PAGE = 6;

export default function Home() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'latest' | 'popular'>('latest');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  /* ------------------ 🔹 Fetch Initial ------------------ */
  useEffect(() => {
    let isMounted = true;

    const fetchInitialWebsites = async () => {
      try {
        setLoading(true);
        setWebsites([]);
        setLastDoc(null);
        setHasMore(true);

        const { websites, lastDoc, hasMore } = await getWebsites({
          sortBy: activeFilter,
          category: activeCategory || undefined,
          limit: ITEMS_PER_PAGE,
        });

        if (isMounted) {
          setWebsites(websites);
          setLastDoc(lastDoc);
          setHasMore(hasMore);
        }
      } catch (error) {
        console.error('Error fetching websites:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitialWebsites();

    return () => {
      isMounted = false;
    };
  }, [activeFilter, activeCategory]);

  /* ------------------ 🔹 Infinite Scroll ------------------ */
  const handleScroll = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;

    const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
    const bottomThreshold = document.documentElement.offsetHeight - 500;

    if (scrollPosition >= bottomThreshold) {
      loadMoreWebsites();
    }
  }, [loading, loadingMore, hasMore, lastDoc, activeFilter, activeCategory]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  /* ------------------ 🔹 Load More ------------------ */
  const loadMoreWebsites = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return;

    setLoadingMore(true);

    try {
      const result = await getWebsites({
        sortBy: activeFilter,
        category: activeCategory || undefined,
        limit: ITEMS_PER_PAGE,
        startAfterDoc: lastDoc,
      });

      setWebsites((prev) => {
        // Deduplicate by ID
        const seen = new Set(prev.map((w) => w.id));
        const newItems = result.websites.filter((w) => !seen.has(w.id));
        return [...prev, ...newItems];
      });

      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading more websites:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastDoc, activeFilter, activeCategory]);

  /* ------------------ 🔹 Skeleton Loader ------------------ */
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className="w-full h-[400px] bg-[#0a0a0a] border border-[#262626] animate-pulse"
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#141414] px-10 pt-4 pb-8">
      {/* Header */}
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
          <button className="bg-[#262626] text-white px-6 py-2 rounded-full text-lg font-medium hover:bg-[#333] transition-colors duration-200 cursor-pointer">
            Submit
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-col items-center justify-start pt-20 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 bg-clip-text text-transparent">
          Curated Website <br />
          Design Inspiration
        </h1>
        <p className="text-base md:text-lg text-gray-300 max-w-2xl leading-relaxed">
          Handpicked curated website designs to inspire your next project
        </p>
      </main>

      {/* Filters */}
      <Filters
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {/* Website Grid */}
      <div className="mt-8">
        {loading ? (
          renderSkeleton()
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {websites.map((website) => {
                const { id, ...websiteProps } = website;
                return <WebsiteCard key={id} {...websiteProps} />;
              })}
            </div>

            {/* Load States */}
            {loadingMore && (
              <div className="mt-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
            {!loadingMore && !hasMore && websites.length > 0 && (
              <div className="mt-8 text-center text-gray-400">
                No more websites to load
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
