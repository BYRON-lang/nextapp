'use client';

import { useRef } from 'react';

interface WebsiteCardProps {
  videoUrl: string;
}

export default function WebsiteCard({ videoUrl }: WebsiteCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleHoverStart = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.error('Error playing video:', e));
    }
  };

  const handleHoverEnd = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[400px] bg-[#0a0a0a] border border-[#262626] overflow-hidden cursor-pointer"
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
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
