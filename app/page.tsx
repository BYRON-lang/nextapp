'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Filters from './components/Filters';
import WebsiteGridSkeleton from './components/WebsiteGridSkeleton';
import { getWebsitePreviews, type GetWebsitePreviewsResult } from './components/Websitepreviewservice';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

// Dynamically import WebsiteCard with no SSR
const WebsiteCard = dynamic(() => import('./components/WebsiteCard'), {
  ssr: false,
});

const ITEMS_PER_PAGE = 12;

export default function Home() {
  const [allWebsites, setAllWebsites] = useState<GetWebsitePreviewsResult['websites']>([]);
  const [websites, setWebsites] = useState<GetWebsitePreviewsResult['websites']>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'latest' | 'popular'>('latest');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  /* ------------------ 🔹 Fetch Initial Websites ------------------ */
  useEffect(() => {
    let isMounted = true;

    const fetchInitialWebsites = async () => {
      try {
        setLoading(true);
        setAllWebsites([]);
        setWebsites([]);
        setLastDoc(null);
        setHasMore(true);

        const result = await getWebsitePreviews({
          sortBy: activeFilter,
          limit: ITEMS_PER_PAGE,
          category: activeCategory || undefined,
        });

        if (isMounted) {
          setAllWebsites(result.websites);
          setWebsites(result.websites);
          setLastDoc(result.lastDoc);
          setHasMore(result.hasMore);
        }
      } catch (error) {
        console.error('Error fetching websites:', error);
        if (isMounted) {
          setWebsites([]);
          setAllWebsites([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInitialWebsites();

    return () => {
      isMounted = false;
    };
  }, [activeFilter, activeCategory]);

  /* ------------------ 🔹 Filter Effect ------------------ */
  useEffect(() => {
    // No need to filter here as the API handles filtering by category
    // Just ensure we're showing the correct set of websites
    setWebsites(allWebsites);
  }, [allWebsites]);

  /* ------------------ 🔹 Load More Websites ------------------ */
  const loadMoreWebsites = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return;

    setLoadingMore(true);
    try {
      const result = await getWebsitePreviews({
        sortBy: activeFilter,
        limit: ITEMS_PER_PAGE,
        startAfterDoc: lastDoc,
        category: activeCategory || undefined,
      });

      if (result.websites.length === 0) {
        setHasMore(false);
        return;
      }

      setAllWebsites(prev => {
        // Filter out any duplicates by ID
        const existingIds = new Set(prev.map(w => w.id));
        const newItems = result.websites.filter(w => !existingIds.has(w.id));
        return [...prev, ...newItems];
      });

      setLastDoc(result.lastDoc);
      setHasMore(result.websites.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error loading more websites:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastDoc, activeFilter, activeCategory]);

  /* ------------------ 🔹 Infinite Scroll Observer ------------------ */
  useEffect(() => {
    if (loading || loadingMore || !hasMore || !loadMoreRef.current) return;

    const options = { root: null, rootMargin: '100px', threshold: 0.1 };

    const currentObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMoreWebsites();
      }
    }, options);

    currentObserver.observe(loadMoreRef.current);
    observer.current = currentObserver;

    return () => {
      currentObserver.disconnect();
    };
  }, [loading, loadingMore, hasMore, websites.length, loadMoreWebsites]);

  return (
    <div className="min-h-screen bg-[#141414] px-10 pb-8">
      {/* Header */}
      <header className="w-full pt-4">
        <div className="flex items-center justify-between">
          <div className="relative w-32 h-8">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              className="object-contain object-left invert"
              priority
            />
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/category"
              className="text-white text-xl hover:underline underline-offset-4 transition-all duration-200"
            >
              Category
            </Link>
            <button className="bg-[#262626] text-white px-6 py-2 rounded-full text-lg font-medium hover:bg-[#333] transition-colors duration-200 cursor-pointer">
              Submit
            </button>
          </div>
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
      <div className="mt-2 relative min-h-[200px]">
        {/* Skeleton (overlaps grid until ready) */}
        {loading && (
          <div className="absolute inset-0 transition-opacity duration-300">
            <WebsiteGridSkeleton />
          </div>
        )}

        {/* Data Grid */}
        <div
          className={`transition-opacity duration-300 ${
            loading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {websites.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {websites.map((website, index) => (
                  <WebsiteCard key={`${website.id}_${index}`} {...website} />
                ))}
              </div>

              {/* Load More */}
              {loadingMore ? (
                <div className="mt-6">
                  <WebsiteGridSkeleton />
                </div>
              ) : hasMore ? (
                <div ref={loadMoreRef} className="h-1 w-full"></div>
              ) : (
                <div className="mt-8 text-center text-gray-400">
                  No more websites to load
                </div>
              )}
            </>
          ) : (
            !loading && (
              <div className="text-center text-gray-400">No websites found</div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
