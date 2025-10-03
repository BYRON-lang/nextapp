'use client';

export default function WebsiteGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="relative w-full h-[400px] bg-[#0a0a0a] border border-[#262626] rounded-lg overflow-hidden">
          {/* Empty container - no skeleton animations */}
        </div>
      ))}
    </div>
  );
}
