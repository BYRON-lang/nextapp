'use client';

export default function WebsiteGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, index) => (
        <div 
          key={index} 
          className="relative w-full aspect-[1.91/1] border border-[#262626] rounded-lg overflow-hidden"
        >
          {/* Empty container with just border */}
        </div>
      ))}
    </div>
  );
}
