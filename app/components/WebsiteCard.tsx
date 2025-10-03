'use client';

import { useRef, useEffect } from 'react';

interface WebsiteCardProps {
  videoUrl: string;
  name?: string;
}

export default function WebsiteCard({ videoUrl, name = 'Website' }: WebsiteCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
    };
  }, []);

  const handleHoverStart = () => {
    if (videoRef.current) {
      // Clear any existing timeouts
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
      
      // Add a small delay before playing to prevent play() from being interrupted
      hoverTimeout.current = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(e => {
            // Ignore the error if it's due to the video being paused
            if (e.name !== 'AbortError') {
              console.error('Error playing video:', e);
            }
          });
        }
      }, 100);
    }
  };

  const handleHoverEnd = () => {
    // Clear any pending play() calls
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div 
      className="relative w-full h-full bg-[#0a0a0a] border border-[#262626] rounded-lg overflow-hidden cursor-pointer hover:border-[#404040] transition-colors flex items-center justify-center"
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          loop
          muted
          playsInline
          preload="metadata"
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Website name pill */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="inline-block bg-[#262626] text-white text-sm px-3 py-1 rounded-full">
            {name}
          </span>
        </div>
      </div>
    </div>
  );
}
