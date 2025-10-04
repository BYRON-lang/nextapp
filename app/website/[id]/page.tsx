'use client';

import { useState, useEffect, useRef } from 'react';
import { getWebsiteById, incrementWebsiteViews } from '@/app/lib/websiteService';
import { Website } from '@/app/lib/websiteService';
import { useParams } from 'next/navigation';
import WebsiteCardSkeleton from '@/app/components/WebsiteCardSkeleton';


export default function WebsitePage() {
  const params = useParams();
  const [website, setWebsite] = useState<Website | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchWebsite = async () => {
      if (!params?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching website with ID:', params.id);
        const websiteData = await getWebsiteById(params.id as string);
        console.log('Website data received:', websiteData);
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

  // Increment views when website data is loaded and set up video autoplay
  useEffect(() => {
    if (website) {
      console.log('Website data loaded:', website);
      incrementWebsiteViews(website.id);
      
      // Set up video autoplay after 2 seconds
      const timer = setTimeout(() => {
        if (videoRef.current) {
          console.log('Attempting to play video...');
          videoRef.current.play().catch(error => {
            console.error('Error playing video:', error);
          });
        } else {
          console.error('Video ref is null');
        }
      }, 2000);

      return () => clearTimeout(timer);
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
            <div className="relative">
              <video
                ref={videoRef}
                className="rounded-lg border-2 border-[#262626] w-full h-auto"
                src={website.videoUrl}
                poster=""
                width="auto"
                height="auto"
                muted
                playsInline
                preload="auto"
                onError={(_e) => {
                  console.error('Error loading video');
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
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
