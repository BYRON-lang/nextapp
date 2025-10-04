'use client';

import { useEffect, useState, useMemo } from 'react';
import { getWebsitePreviews } from './Websitepreviewservice';
import type { WebsitePreview } from './Websitepreviewservice';

// Helper function to normalize names for comparison
const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // Remove all non-alphanumeric characters
};

const CATEGORY_SECTIONS = [
  {
    title: 'Frameworks',
    items: [
      // Component Frameworks
      'React', 'Vue', 'Angular', 'Svelte', 'SolidJS',
      
      // Meta-frameworks
      'Next.Js', 'Nuxt', 'Gatsby', 'Remix', 'SvelteKit',
      'Astro', 'Qwik',
      
      // State Management
      'Redux', 'Zustand', 'Jotai', 'Recoil', 'MobX',
      
      // Styling
      'Tailwind CSS', 'Emotion', 'Styled Components', 'CSS Modules',
      'Sass', 'Less', 'PostCSS', 'UnoCSS',
      
      // Animation
      'Framer Motion', 'GSAP', 'Framer', 'Motion One',
      
      // 3D & WebGL
      'Three.js', 'WebGL', 'React Three Fiber', 'Drei',
      
      // UI Libraries
      'Chakra UI', 'MUI', 'Headless UI', 'Radix UI', 'Shadcn UI',
      
      // Build Tools
      'Vite', 'Webpack', 'Rollup', 'Parcel', 'Snowpack',
      
      // Other Tools
      'Alpine.js', 'Stimulus', 'Webflow', 'Figma', 'Storybook'
    ]
  },
  {
    title: 'Business & Industries',
    items: [
      'SaaS', 'E-commerce', 'Finance', 'Healthcare', 'Education',
      'Technology', 'Marketing', 'Design', 'Startup', 'Agency',
      'Nonprofit', 'Real Estate', 'Food & Beverage', 'Fitness',
      'Travel', 'Entertainment', 'Media', 'Consulting', 'Legal',
      'Manufacturing', 'Retail', 'Fashion', 'Beauty',
      'Home Services', 'Automotive', 'AI', 'UI/UX'
    ]
  },
  {
    title: 'Website Types',
    items: [
      'Landing Page', 'Dashboard', 'Mobile App', 'Web App', 'Blog',
      'Portfolio', 'Personal', 'Documentation', 'Pricing Page',
      'Authentication', 'Onboarding', 'Careers', 'Contact', 'About',
      'Case Studies', 'Help Center', 'Knowledge Base', 'Status Page',
      'Blog Platform', 'Checkout', 'Booking', 'Directory',
      'Newsletter', 'Community'
    ]
  },
  {
    title: 'Design Styles',
    items: [
      'Minimal', 'Bold', 'Dark Mode', 'Light Mode', 'Gradient',
      '3D', 'Motion', 'Illustration', 'Photography', 'Typography',
      'Neumorphism', 'Glassmorphism', 'Brutalist', 'Vintage', 'Modern',
      'Retro', 'Futuristic', 'Playful', 'Corporate', 'Elegant',
      'Hand-drawn', 'Geometric', 'Abstract', 'Creative'
    ]
  }
];

export default function CategoriesSection() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Create a mapping of normalized names to display names and their counts
  const normalizedCounts = useMemo(() => {
    const result: Record<string, { display: string; count: number }> = {};
    
    // Process all categories and frameworks
    Object.entries(counts).forEach(([name, count]) => {
      const normalized = normalizeName(name);
      // Keep the first occurrence of each normalized name (case-insensitive, symbol-agnostic)
      if (!result[normalized] || count > result[normalized].count) {
        result[normalized] = { display: name, count };
      } else {
        // If we already have this normalized name, add to its count
        result[normalized].count += count;
      }
    });
    
    return result;
  }, [counts]);

  // Fetch category and framework counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setIsLoading(true);
        const { websites } = await getWebsitePreviews({ limit: 1000 });
        
        const newCounts: Record<string, number> = {};
        
        websites.forEach((website: WebsitePreview & { categories?: string[]; builtWith?: string | string[] }) => {
          // Count categories
          if (website.categories) {
            website.categories.forEach((category: string) => {
              newCounts[category] = (newCounts[category] || 0) + 1;
            });
          }
          
          // Count frameworks from builtWith field
          if (website.builtWith) {
            const frameworks = Array.isArray(website.builtWith) 
              ? website.builtWith 
              : [website.builtWith];
              
            frameworks.forEach((framework: string) => {
              if (framework) {
                newCounts[framework] = (newCounts[framework] || 0) + 1;
              }
            });
          }
        });
        
        setCounts(newCounts);
      } catch (_error) {
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, []);

  // Function to filter and sort items based on count and match them case-insensitively
  const getVisibleItems = (items: string[]) => {
    if (isLoading) return items;
    
    return items.filter(item => {
      const normalizedItem = normalizeName(item);
      // Check if any count entry matches this item (case-insensitive, symbol-agnostic)
      return Object.entries(normalizedCounts).some(([normalized, { count }]) => {
        return normalized === normalizedItem && count > 0;
      });
    }).sort((a, b) => {
      // Sort by count (descending) then by name (ascending)
      const countA = normalizedCounts[normalizeName(a)]?.count || 0;
      const countB = normalizedCounts[normalizeName(b)]?.count || 0;
      return countB - countA || a.localeCompare(b);
    });
  };

  return (
    <div className="mt-8 space-y-12">
      {CATEGORY_SECTIONS.map((section) => {
        const visibleItems = getVisibleItems(section.items);
        if (visibleItems.length === 0) return null;
        
        return (
          <div key={section.title} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-200 pl-3">
              {section.title}
            </h2>
            <ul className="space-y-2 pl-3">
              {section.items.map((category) => {
                const itemData = normalizedCounts[normalizeName(category)];
                const itemCount = itemData?.count || 0;
                const displayName = itemData?.display || category;
                
                if (itemCount === 0) return null;
                
                return (
                  <li key={category}>
                    <a
                      href={
                        section.title === 'Frameworks'
                          ? `/framework/${displayName.toLowerCase().replace(/\s+/g, '-')}`
                          : `/category/${displayName.toLowerCase().replace(/\s+/g, '-')}`
                      }
                      className="flex justify-between items-center py-2 px-3 rounded-md hover:bg-gray-800/50 transition-colors w-full group"
                    >
                      <span className="text-gray-300 group-hover:text-white">
                        {displayName}
                      </span>
                      <span className="text-gray-500">
                        {itemCount}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
