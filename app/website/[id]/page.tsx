'use client';

import { useState, useEffect } from 'react';
import { getWebsiteById, incrementWebsiteViews } from '@/app/lib/websiteService';
import { Website } from '@/app/lib/websiteService';
import { useParams } from 'next/navigation';
import WebsiteCardSkeleton from '@/app/components/WebsiteCardSkeleton';

export default function WebsitePage() {
  const params = useParams();
  const [website, setWebsite] = useState<Website | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWebsite = async () => {
      if (!params?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const websiteData = await getWebsiteById(params.id as string);
        setWebsite(websiteData);
      } catch (error) {
        console.error('Error fetching website:', error);
        setError('Website not found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWebsite();
  }, [params?.id]);

  // Increment views when website data is loaded
  useEffect(() => {
    if (website) {
      incrementWebsiteViews(website.id);
    }
  }, [website]);

  if (isLoading && !website) {
    return <WebsiteCardSkeleton />;
  }

  if (error || !website) {
    return (
      <div className="min-h-screen bg-[#141414] p-6 flex items-center justify-center">
        <div className="text-white text-xl">{error || 'Website not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Video Preview - Top Center */}
        <div className="flex justify-center mb-4">
          <div className="w-full max-w-5xl">
            <video
              className="rounded-lg border-2 border-[#262626]"
              src={website.videoUrl}
              poster={website.videoUrl}
              width="1200"
              height="800"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Website Name and Visit Button - Below Video, Same Width */}
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-5xl">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Website Details */}
              <div className="text-left">
                <div className="text-white text-2xl font-bold mb-2">
                  {website.name}
                </div>
                <div className="flex justify-start">
                  <a
                    href={website.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-white text-black text-xl font-semibold px-4 py-1 rounded-4xl hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 shadow-none"
                  >
                    Visit
                  </a>
                </div>
                <div className="text-gray-400 text-sm mt-2">
                  Added On {new Date(website.uploadedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-gray-400 text-sm mt-1">
                  {website.views || 0} {website.views === 1 ? 'view' : 'views'}
                </div>
              </div>

              {/* Right Column - Categories and Frameworks */}
              <div className="text-left">
                <h3 className="text-white text-xl font-semibold mb-2">Categories</h3>
                <div className="flex flex-col gap-2 mb-6">
                  {website.categories.map((category, index) => (
                    <div
                      key={index}
                      className="text-gray-300 text-sm hover:text-white transition-colors"
                    >
                      {category}
                    </div>
                  ))}
                </div>

                {/* Frameworks Section */}
                {website.builtWith && (
                  <>
                    <h3 className="text-white text-xl font-semibold mb-2">Frameworks</h3>
                    <div className="flex flex-col gap-2">
                      {Array.isArray(website.builtWith)
                        ? website.builtWith.map((framework, index) => (
                            <div
                              key={index}
                              className="text-gray-300 text-sm hover:text-white transition-colors"
                            >
                              {framework}
                            </div>
                          ))
                        : (
                            <div className="text-gray-300 text-sm hover:text-white transition-colors">
                              {website.builtWith}
                            </div>
                          )
                      }
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Website ID: {params?.id} */}
      </div>
    </div>
  );
}
