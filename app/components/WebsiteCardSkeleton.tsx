'use client';

interface WebsiteCardSkeletonProps {
  className?: string;
}

export default function WebsiteCardSkeleton({ className = "" }: WebsiteCardSkeletonProps) {
  return (
    <div className={`min-h-screen bg-[#141414] p-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Video Preview Skeleton - Top Center */}
        <div className="flex justify-center mb-4">
          <div className="w-full max-w-5xl">
            <div className="rounded-lg border-2 border-[#262626] bg-[#1a1a1a] aspect-video animate-pulse" />
          </div>
        </div>

        {/* Website Details Skeleton - Below Video */}
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-5xl">
            {/* Two Column Layout Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column Skeleton - Website Details */}
              <div className="text-left">
                <div className="h-8 bg-[#262626] rounded mb-4 animate-pulse" style={{ width: '60%' }} />
                <div className="h-10 bg-[#262626] rounded-full mb-4 animate-pulse" style={{ width: '120px' }} />
                <div className="h-4 bg-[#262626] rounded mb-2 animate-pulse" style={{ width: '40%' }} />
                <div className="h-4 bg-[#262626] rounded animate-pulse" style={{ width: '30%' }} />
              </div>

              {/* Right Column Skeleton - Categories and Frameworks */}
              <div className="text-left">
                <div className="h-6 bg-[#262626] rounded mb-4 animate-pulse" style={{ width: '40%' }} />
                <div className="flex flex-col gap-2 mb-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-4 bg-[#262626] rounded animate-pulse" style={{ width: `${70 + i * 10}%` }} />
                  ))}
                </div>

                {/* Frameworks Section Skeleton */}
                <div className="h-6 bg-[#262626] rounded mb-4 animate-pulse" style={{ width: '35%' }} />
                <div className="flex flex-col gap-2">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-4 bg-[#262626] rounded animate-pulse" style={{ width: `${50 + i * 20}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
