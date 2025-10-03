'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

  const [currentPage, setCurrentPage] = useState(1);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Define loadMoreWebsites before it's used in the effect
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
      setCurrentPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error('Error loading more websites:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastDoc, activeFilter, activeCategory]);

  // Reset to first page when filter or category changes
  useEffect(() => {
    setCurrentPage(1);
    setWebsites([]);
    setLastDoc(null);
    setHasMore(true);
  }, [activeFilter, activeCategory]);

  // Observe the loading ref for infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore || !loadMoreRef.current) return;

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    };

    const currentObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMoreWebsites();
      }
    }, options);

    currentObserver.observe(loadMoreRef.current);
    observer.current = currentObserver;

    return () => {
      currentObserver.disconnect();
    };
  }, [loading, loadingMore, hasMore, loadMoreWebsites]);

  // Loading indicator component
  const LoadingIndicator = () => (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#141414] px-10 pt-4 pb-8">
      {/* Header */}
      <header className="w-full">
        <div className="relative w-32 h-auto aspect-[4/1] -ml-10">
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
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {websites.map((website) => {
                const { id, ...websiteProps } = website;
                return <WebsiteCard key={id} {...websiteProps} />;
              })}
            </div>

            {/* Load States */}
            {loadingMore ? (
              <LoadingIndicator />
            ) : hasMore ? (
              <div ref={loadMoreRef} className="h-1 w-full"></div>
            ) : (
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
