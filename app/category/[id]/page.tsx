'use client';

import { useState, useEffect } from 'react';
import { getWebsites, Website } from '@/app/lib/websiteService';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import WebsiteGridSkeleton from '../../components/WebsiteGridSkeleton';

// Dynamically import WebsiteCard with no SSR
const WebsiteCard = dynamic(() => import('../../components/WebsiteCard'), {
  ssr: false,
});

function formatCategoryName(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function CategoryPage() {
  const params = useParams();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWebsites = async () => {
      if (!params?.id) return;

      try {
        setLoading(true);
        const categoryName = decodeURIComponent(params.id as string).replace(/-/g, ' ');
        const { websites } = await getWebsites({
          category: categoryName,
          sortBy: 'latest',
          limit: 100
        });

        setWebsites(websites || []);
      } catch (error) {
        console.error('Error fetching websites:', error);
        setWebsites([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWebsites();
  }, [params?.id]);

  if (loading && websites.length === 0) {
    return (
      <div className="min-h-screen bg-[#141414] p-6">
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 p-[2px]">
              <div className="rounded-full bg-[#141414] h-full w-full"></div>
            </div>
            <div className="relative text-white text-3xl font-medium px-7 py-5 rounded-full flex items-center">
              <div className="h-8 bg-[#262626] rounded animate-pulse" style={{ width: '200px' }} />
            </div>
          </div>
        </div>
        <WebsiteGridSkeleton />
      </div>
    );
  }

  if (!params?.id) {
    return (
      <div className="min-h-screen bg-[#141414] p-6 flex items-center justify-center">
        <div className="text-white text-xl">Category not found</div>
      </div>
    );
  }

  const categoryName = decodeURIComponent(params.id as string).replace(/-/g, ' ');
  const displayName = formatCategoryName(categoryName);

  if (websites.length === 0) {
    return (
      <div className="min-h-screen bg-[#141414] p-6">
        <div>
          {/* Back Button Pill */}
          <div className="flex justify-center mb-8">
            <Link href="/category" className="relative group">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 p-[2px] group-hover:from-gray-400 group-hover:via-gray-500 group-hover:to-gray-600 transition-all duration-300">
                <div className="rounded-full bg-[#141414] h-full w-full"></div>
              </div>
              <div className="relative text-white text-3xl font-medium px-7 py-5 rounded-full flex items-center cursor-pointer group-hover:scale-105 transition-transform duration-300">
                <span>{displayName}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 15 15" className="text-white ml-5 flex-shrink-0 group-hover:text-gray-200 transition-colors duration-300">
                  <path fill="currentColor" fillRule="evenodd" d="M0 7.5a7.5 7.5 0 1 1 15 0a7.5 7.5 0 0 1-15 0Zm10.146 3.354L7.5 8.207l-2.646 2.647l-.708-.707L6.793 7.5L4.146 4.854l.708-.708L7.5 6.793l2.646-2.647l.708.708L8.207 7.5l2.647 2.646l-.707.708Z" clipRule="evenodd"/>
                </svg>
              </div>
            </Link>
          </div>

          <div className="text-center text-gray-400 mt-20">
            <h2 className="text-2xl font-semibold mb-4">No websites found</h2>
            <p className="text-lg">No websites are currently available in the &ldquo;{displayName}&rdquo; category.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#141414] p-6">
      <div>
        {/* Silver Pill Container */}
        <div className="flex justify-center mb-8">
          <Link href="/category" className="relative group">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 p-[2px] group-hover:from-gray-400 group-hover:via-gray-500 group-hover:to-gray-600 transition-all duration-300">
              <div className="rounded-full bg-[#141414] h-full w-full"></div>
            </div>
            <div className="relative text-white text-3xl font-medium px-7 py-5 rounded-full flex items-center cursor-pointer group-hover:scale-105 transition-transform duration-300">
              <span>{displayName}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 15 15" className="text-white ml-5 flex-shrink-0 group-hover:text-gray-200 transition-colors duration-300">
                <path fill="currentColor" fillRule="evenodd" d="M0 7.5a7.5 7.5 0 1 1 15 0a7.5 7.5 0 0 1-15 0Zm10.146 3.354L7.5 8.207l-2.646 2.647l-.708-.707L6.793 7.5L4.146 4.854l.708-.708L7.5 6.793l2.646-2.647l.708.708L8.207 7.5l2.647 2.646l-.707.708Z" clipRule="evenodd"/>
              </svg>
            </div>
          </Link>
        </div>
        
        {/* Website Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {websites.map((website, index) => (
            <WebsiteCard key={`${website.id}_${index}`} {...website} />
          ))}
        </div>
      </div>
    </div>
  );
}