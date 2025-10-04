'use client';

import { useRef } from 'react';
import Link from 'next/link';

interface WebsiteCardProps {
  id: string;
  name: string;
  videoUrl: string;
}

export default function WebsiteCard({
  id,
  name,
  videoUrl,
}: WebsiteCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  // Clean up timeout on unmount

  // Set video to 2-second mark when metadata is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 2;
    }
  };

  const handleHoverStart = () => {
    if (videoRef.current) {
      // Clear any existing timeouts
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }

      // Add a small delay before playing to prevent play() from being interrupted
      hoverTimeout.current = setTimeout(() => {
        if (videoRef.current) {
          // Reset to start of video before playing
          videoRef.current.currentTime = 0;
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
    <Link 
      href={`/website/${id}`} 
      className="block w-full aspect-[1.91/1]"
    >
      <div
        className="relative w-full h-full bg-[#0a0a0a] border border-[#262626] rounded-lg overflow-hidden hover:border-[#404040] transition-colors"
        onMouseEnter={handleHoverStart}
        onMouseLeave={handleHoverEnd}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          loop
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
        >
          <source 
            src={videoUrl} 
            type={videoUrl.endsWith('.webm') ? 'video/webm' : 'video/mp4'} 
          />
          Your browser does not support the video tag.
        </video>
        
        {/* Website name pill */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="inline-block bg-[#262626] text-white text-sm px-3 py-1 rounded-full">
            {name}
          </span>
        </div>
      </div>
    </Link>
  );
}
