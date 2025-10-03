import {
    collection,
    getDocs,
    query,
    orderBy,
    doc,
    getDoc,
    updateDoc,
    increment,
    limit,
    startAfter,
    DocumentData as FirebaseDocumentData,
    QueryDocumentSnapshot as FirestoreQueryDocumentSnapshot,
    Timestamp,
  } from 'firebase/firestore';
  import { db } from './firebase';
  
  /* ------------------ 🔹 Utilities ------------------ */
  
  function getCdnVideoUrl(storageUrl: string): string {
    try {
      console.log('Original video URL:', storageUrl);

      if (storageUrl.includes('cdn.gridrr.com')) return storageUrl;

      const decodedUrl = decodeURIComponent(storageUrl);
      let fileName = '';

      // Extract filename from URL (handles both videos/ and videos%2F)
      const match = decodedUrl.match(/videos(?:%2F|\/)([^?]+)/);
      if (match && match[1]) fileName = match[1];

      // Encode filename for safe CDN URL
      const encodedFileName = encodeURIComponent(fileName);

      const cdnUrl = `https://cdn.gridrr.com/videos/${encodedFileName}`;
      console.log('Generated CDN URL:', cdnUrl);

      return cdnUrl;
    } catch (e) {
      console.error('Error generating CDN URL, falling back to original URL:', e);
      return storageUrl;
    }
  }

  /* ------------------ 🔹 Types ------------------ */
  
  export type QueryDocumentSnapshot<T = DocumentData> = FirestoreQueryDocumentSnapshot<T>;
  export type DocumentData = FirebaseDocumentData;
  
  export interface SocialLinks {
    twitter?: string;
    instagram?: string;
    [key: string]: string | undefined;
  }
  
  export interface Website {
    id: string;
    name: string;
    videoUrl: string;
    url: string;
    builtWith?: string;
    categories: string[];
    socialLinks?: SocialLinks;
    uploadedAt: string; // ISO string
    category?: string;
    views?: number;
  }
  
  export interface CategoryCount {
    name: string;
    count: number;
  }
  
  /* ------------------ 🔹 Timestamp Helpers ------------------ */
  
  function convertTimestamps<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Timestamp) return obj.toDate().toISOString() as unknown as T;
    if (Array.isArray(obj)) return obj.map((item) => convertTimestamps(item)) as unknown as T;
    if (typeof obj === 'object' && obj !== null) {
      const result: Record<string, unknown> = {};
      for (const key in obj) {
        result[key] = convertTimestamps((obj as Record<string, unknown>)[key]);
      }
      return result as unknown as T;
    }
    return obj;
  }
  
  interface FirestoreTimestamp {
    toDate?: () => Date;
    seconds?: number;
  }
  const isFirestoreTimestamp = (value: unknown): value is FirestoreTimestamp =>
    value !== null && typeof value === 'object' && ('toDate' in value || 'seconds' in value);
  
  const convertTimestamp = (timestamp: FirestoreTimestamp | Date | undefined | null): string => {
    if (!timestamp) return new Date().toISOString();
    if (timestamp instanceof Date) return timestamp.toISOString();
    if (isFirestoreTimestamp(timestamp)) {
      if (timestamp.toDate) return timestamp.toDate().toISOString();
      if (timestamp.seconds !== undefined) return new Date(timestamp.seconds * 1000).toISOString();
    }
    return new Date().toISOString();
  };
  
  /* ------------------ 🔹 Cache ------------------ */
  
  interface CacheEntry<T> {
    data: T;
    expiry: number;
  }
  const cache = new Map<string, CacheEntry<unknown>>();
  const CACHE_TTL = 1000 * 60; // 1 min
  
  function getFromCache<T>(key: string): T | null {
    const entry = cache.get(key);
    if (entry && Date.now() < entry.expiry) return entry.data as T;
    cache.delete(key);
    return null;
  }
  function setCache<T>(key: string, data: T): void {
    cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
  }
  
  /* ------------------ 🔹 Sitemap Websites ------------------ */
  export interface WebsiteForSitemap {
    id: string;
    updatedAt?: string;
  }
  
  export async function getAllWebsitesForSitemap(): Promise<WebsiteForSitemap[]> {
    try {
      const websitesRef = collection(db, 'websites');
      const q = query(websitesRef, orderBy('uploadedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        updatedAt: convertTimestamp(doc.data().uploadedAt)
      }));
    } catch (err) {
      console.error('Error getting websites for sitemap:', err);
      throw err;
    }
  }
  
  /* ------------------ 🔹 Pagination ------------------ */
  
  export interface GetWebsitesOptions {
    sortBy?: 'latest' | 'popular';
    limit?: number;
    startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null;
    category?: string;
    builtWith?: string;
  }
  export interface GetWebsitesResult {
    websites: Website[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    hasMore: boolean;
  }
  
  const normalizeCategoryName = (name: string): string => name.trim().toLowerCase();
  
  export const getWebsites = async (
    options: GetWebsitesOptions = {}
  ): Promise<GetWebsitesResult> => {
    const { sortBy = 'latest', category, builtWith, limit: pageLimit = 6, startAfterDoc = null } = options;
  
    const cacheKey = `websites-${category || 'all'}-${builtWith || 'all'}-${sortBy}-${startAfterDoc?.id || 'first'}-${pageLimit}`;
    const cached = getFromCache<GetWebsitesResult>(cacheKey);
    if (cached) return cached;
  
    try {
      const websitesRef = collection(db, 'websites');
  
      // Sorting
      let q = query(websitesRef, orderBy(sortBy === 'popular' ? 'views' : 'uploadedAt', 'desc'));
  
      // Pagination
      if (startAfterDoc) q = query(q, startAfter(startAfterDoc));
      q = query(q, limit(pageLimit + 1)); // fetch 1 extra
  
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs;
  
      const websites: Website[] = docs.slice(0, pageLimit).map((doc) => {
        const rawData = convertTimestamps(doc.data());
        return {
          id: doc.id,
          name: rawData.name || 'Untitled',
          videoUrl: rawData.videoUrl ? getCdnVideoUrl(rawData.videoUrl) : '',
          url: rawData.url || '#',
          builtWith: rawData.builtWith,
          categories: Array.isArray(rawData.categories) ? rawData.categories : [],
          socialLinks: rawData.socialLinks || {},
          uploadedAt: rawData.uploadedAt || new Date().toISOString(),
          category:
            Array.isArray(rawData.categories) && rawData.categories.length > 0
              ? rawData.categories[0]
              : 'uncategorized',
          views: rawData.views || 0,
        };
      });
  
      let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
      if (docs.length > pageLimit) {
        lastDoc = docs[pageLimit];
      }
  
      let filtered = websites;
      if (category) {
        const searchCategory = normalizeCategoryName(category);
        filtered = websites.filter((site) =>
          site.categories?.some((cat) => normalizeCategoryName(cat) === searchCategory)
        );
      }

      if (builtWith) {
        const searchFramework = normalizeCategoryName(builtWith);
        filtered = filtered.filter((site) => {
          const siteBuiltWith = site.builtWith;
          if (!siteBuiltWith) return false;

          // Handle both string and array cases
          const frameworks = Array.isArray(siteBuiltWith) ? siteBuiltWith : [siteBuiltWith];
          return frameworks.some((framework) =>
            normalizeCategoryName(framework) === searchFramework
          );
        });
      }
  
      const result: GetWebsitesResult = {
        websites: filtered,
        lastDoc,
        hasMore: docs.length > pageLimit,
      };
  
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching websites:', error);
      return { websites: [], lastDoc: null, hasMore: false };
    }
  };
  
  /* ------------------ 🔹 Get Website By ID ------------------ */
  
  export async function getWebsiteById(id: string): Promise<Website> {
    try {
      const docRef = doc(db, 'websites', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Website not found');
      }

      const websiteData = convertTimestamps({
        id: docSnap.id,
        ...docSnap.data(),
      }) as Website;

      // Convert video URL to CDN URL
      if (websiteData.videoUrl) {
        websiteData.videoUrl = getCdnVideoUrl(websiteData.videoUrl);
      }

      return websiteData;
    } catch (error) {
      console.error('Error getting website by ID:', error);
      throw error;
    }
  }
  
  /* ------------------ 🔹 Adjacent Websites ------------------ */
  
  export const getAdjacentWebsites = async (
    currentId: string,
    sortBy: 'latest' | 'popular' = 'latest'
  ): Promise<{ prev: Website | null; next: Website | null }> => {
    try {
      const { websites } = await getWebsites({ sortBy, limit: 50 });
      const index = websites.findIndex((w) => w.id === currentId);
  
      return {
        prev: index < websites.length - 1 ? websites[index + 1] : null,
        next: index > 0 ? websites[index - 1] : null,
      };
    } catch (err) {
      console.error('Error getting adjacent websites:', err);
      return { prev: null, next: null };
    }
  };
  
  /* ------------------ 🔹 Increment Views ------------------ */
  
  export const incrementWebsiteViews = async (websiteId: string): Promise<void> => {
    try {
      const websiteRef = doc(db, 'websites', websiteId);
      await updateDoc(websiteRef, {
        views: increment(1),
        lastViewed: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error incrementing website views:', error);
    }
  };
  
  /* ------------------ 🔹 Categories ------------------ */
  
  export const ALL_CATEGORIES = [
    'SaaS', 'E-commerce', 'Finance', 'Healthcare', 'Education',
    'Technology', 'Marketing', 'Design', 'Startup', 'Agency',
    'Nonprofit', 'Real Estate', 'Food & Beverage', 'Fitness',
    'Travel', 'Entertainment', 'Media', 'Consulting', 'Legal',
    'Manufacturing', 'Retail', 'Fashion', 'Beauty',
    'Home Services', 'Automotive', 'AI', 'UI/UX',
  
    'Landing Page', 'Dashboard', 'Mobile App', 'Web App', 'Blog',
    'Portfolio', 'Personal', 'Docs', 'Marketing', 'Pricing',
    'Auth', 'Onboarding', 'Careers', 'Contact', 'About',
    'Case Studies', 'Help Center', 'Knowledge Base', 'Status Page',
    'Blog Platform', 'Checkout', 'Booking', 'Directory',
    'Newsletter', 'Community',
  
    'Minimal', 'Bold', 'Dark Mode', 'Light Mode', 'Gradient',
    '3D', 'Motion', 'Illustration', 'Photography', 'Typography',
    'Neumorphism', 'Glassmorphism', 'Brutalist', 'Vintage', 'Modern',
    'Retro', 'Futuristic', 'Playful', 'Corporate', 'Elegant',
    'Hand-drawn', 'Geometric', 'Abstract', 'Creative',
  ];
  
  /* ------------------ 🔹 Category Counts ------------------ */
  
  export const getCategoryCounts = async (): Promise<CategoryCount[]> => {
    try {
      const cacheKey = 'category-counts';
      const cached = getFromCache<CategoryCount[]>(cacheKey);
      if (cached) return cached;
  
      const { websites } = await getWebsites({ limit: 100 }); // fetch first 100 for stats
      const categoryMap = new Map<string, number>();
      const normalizedCategoryMap = new Map<string, string>();
  
      ALL_CATEGORIES.forEach((cat) => {
        const norm = normalizeCategoryName(cat);
        categoryMap.set(cat, 0);
        normalizedCategoryMap.set(norm, cat);
      });
  
      websites.forEach((site) => {
        site.categories?.forEach((cat) => {
          const norm = normalizeCategoryName(cat);
          const matched = normalizedCategoryMap.get(norm);
          if (matched) {
            categoryMap.set(matched, (categoryMap.get(matched) || 0) + 1);
          }
        });
      });
  
      const result = Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));
  
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching category counts:', error);
      return [];
    }
  };
  