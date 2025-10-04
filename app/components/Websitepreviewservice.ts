// websitePreviewService.ts
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/* ------------------ 🔹 Types ------------------ */

export interface WebsitePreview {
  id: string;
  name: string;
  videoUrl: string;
  builtWith?: string;
  categories?: string[];
}

export interface GetWebsitesOptions {
  limit?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
}

export interface GetWebsitesResult {
  websites: WebsitePreview[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/* ------------------ 🔹 Cache ------------------ */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 1000 * 60; // 1 minute

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

/* ------------------ 🔹 Helper Functions ------------------ */

function convertTimestamps(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(convertTimestamps);
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = convertTimestamps((data as Record<string, unknown>)[key]);
      }
    }
    return result;
  }

  return data;
}

/** 
 * Normalize keys for cache and URL purposes
 * Replaces spaces and special characters with dashes, but preserves case
 */
function normalizeKey(value: string): string {
  if (!value) return value;
  return value
    .trim()
    .replace(/[\s,\/]+/g, '-') // spaces, commas, slashes → dash
    .replace(/-+/g, '-')       // collapse multiple dashes
    .toLowerCase();
}

/* ------------------ 🔹 CDN Video Helper ------------------ */
function getCdnVideoUrl(storageUrl: string): string {
  if (!storageUrl) return '';
  if (storageUrl.includes('cdn.gridrr.com')) return storageUrl;

  const decodedUrl = decodeURIComponent(storageUrl);
  const match = decodedUrl.match(/videos(?:%2F|\/)([^?]+)/);
  if (!match || !match[1]) {
    console.warn('Invalid video URL format:', storageUrl);
    return storageUrl; // fallback to original
  }
  const encodedFileName = encodeURIComponent(match[1]);
  return `https://cdn.gridrr.com/videos/${encodedFileName}`;
}

/* ------------------ 🔹 Fetch by Framework ------------------ */
export async function getWebsitesByFramework(
  framework: string
): Promise<WebsitePreview[]> {
  // Use original framework name for query, normalized version only for cache key
  const normalizedFramework = normalizeKey(framework);
  const cacheKey = `framework:${normalizedFramework}:all`;

  const cached = getFromCache<WebsitePreview[]>(cacheKey);
  if (cached) return cached;

  try {
    // Only fetch the fields we need
    const allWebsitesQuery = query(
      collection(db, 'websites'),
      where('builtWith', '>=', ''), // Ensure builtWith exists and is a string
      orderBy('builtWith')
    );
    
    const allWebsitesSnapshot = await getDocs(allWebsitesQuery);
    const websites: WebsitePreview[] = [];
    const frameworkLower = framework.toLowerCase();
    
    allWebsitesSnapshot.forEach(doc => {
      const data = doc.data();
      const docFramework = data.builtWith?.toLowerCase();
      
      if (docFramework === frameworkLower) {
        if (!data.videoUrl) return;
        
        websites.push({
          id: doc.id,
          name: data.name || 'Untitled',
          videoUrl: getCdnVideoUrl(data.videoUrl),
          ...(data.builtWith && { builtWith: data.builtWith }),
          ...(data.categories && { categories: data.categories }),
        });
      }
    });
    
    setCache(cacheKey, websites);
    return websites;
  } catch (error) {
    console.error('Error fetching websites by framework:', error);
    return [];
  }
}

/* ------------------ 🔹 Fetch by Category ------------------ */
export async function getWebsitesByCategory(
  category: string
): Promise<WebsitePreview[]> {
  // Use original category name for query, normalized version only for cache key
  const normalizedCategory = normalizeKey(category);
  const cacheKey = `category:${normalizedCategory}:all`;

  const cached = getFromCache<WebsitePreview[]>(cacheKey);
  if (cached) return cached;

  try {
    // Only fetch documents that have categories
    const allWebsitesQuery = query(
      collection(db, 'websites'),
      where('categories', '!=', null), // Ensure categories exist
      orderBy('categories')
    );
    
    const allWebsitesSnapshot = await getDocs(allWebsitesQuery);
    const websites: WebsitePreview[] = [];
    const categoryLower = category.toLowerCase();
    
    allWebsitesSnapshot.forEach(doc => {
      const data = doc.data();
      const docCategories = Array.isArray(data.categories) 
        ? data.categories.map((c: string) => c.toLowerCase())
        : [];
      
      if (docCategories.includes(categoryLower)) {
        if (!data.videoUrl) return;
        
        websites.push({
          id: doc.id,
          name: data.name || 'Untitled',
          videoUrl: getCdnVideoUrl(data.videoUrl),
          ...(data.builtWith && { builtWith: data.builtWith }),
          ...(data.categories && { categories: data.categories }),
        });
      }
    });
    
    setCache(cacheKey, websites);
    return websites;
  } catch (error) {
    console.error('Error fetching websites by category:', error);
    return [];
  }
}

/* ------------------ 🔹 Latest Websites ------------------ */
export async function getLatestWebsites(
  options: GetWebsitesOptions = {}
): Promise<GetWebsitesResult> {
  const { limit: limitCount = 12, lastDoc = null } = options;
  const cacheKey = `latest:${limitCount}:${lastDoc?.id || 'first'}`;

  const cached = getFromCache<GetWebsitesResult>(cacheKey);
  if (cached) return cached;

  try {
    let q = query(
      collection(db, 'websites'),
      orderBy('uploadedAt', 'desc'),
      limit(limitCount + 1)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;

    const websites: WebsitePreview[] = docs.slice(0, limitCount).map((doc) => {
      const data = convertTimestamps(doc.data()) as DocumentData;
      return {
        id: doc.id,
        name: data.name || 'Untitled',
        videoUrl: getCdnVideoUrl(data.videoUrl),
        ...(data.builtWith && { builtWith: data.builtWith }),
        ...(data.categories && { categories: data.categories }),
      };
    });

    const newLastDoc = docs.length > limitCount ? docs[limitCount] : null;
    const result: GetWebsitesResult = { websites, lastDoc: newLastDoc, hasMore: docs.length > limitCount };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching latest websites:', error);
    return { websites: [], lastDoc: null, hasMore: false };
  }
}

/* ------------------ 🔹 Get Website Previews (general) ------------------ */
export interface GetWebsitePreviewsOptions {
  limit?: number;
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null;
  category?: string;
  builtWith?: string;
  sortBy?: 'latest' | 'popular';
}

export interface GetWebsitePreviewsResult {
  websites: WebsitePreview[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export async function getWebsitePreviews(
  options: GetWebsitePreviewsOptions = {}
): Promise<GetWebsitePreviewsResult> {
  const {
    limit: pageLimit = 12,
    startAfterDoc = null,
    category,
    builtWith,
    sortBy = 'latest',
  } = options;

  // Normalize only for cache key, keep original for query
  const normalizedCategory = category ? normalizeKey(category) : 'all';
  const normalizedFramework = builtWith ? normalizeKey(builtWith) : 'all';
  const cacheKey = `preview-${normalizedCategory}-${normalizedFramework}-${sortBy}-${startAfterDoc?.id || 'first'}-${pageLimit}`;
  const cached = getFromCache<GetWebsitePreviewsResult>(cacheKey);
  if (cached) return cached;

  try {
    console.log(`getWebsitePreviews called with options:`, {
      category,
      builtWith,
      sortBy,
      pageLimit,
      startAfterDocId: startAfterDoc?.id
    });

    const websitesRef = collection(db, 'websites');
    let q = query(
      websitesRef,
      orderBy(sortBy === 'popular' ? 'views' : 'uploadedAt', 'desc')
    );

    if (category) {
      console.log('Filtering by category:', category);
      q = query(q, where('categories', 'array-contains', category));
    }

    if (builtWith) {
      console.log('Filtering by framework:', builtWith);
      q = query(q, where('builtWith', '==', builtWith));
    }

    if (startAfterDoc) {
      console.log('Starting after document:', startAfterDoc.id);
      q = query(q, startAfter(startAfterDoc));
    }

    q = query(q, limit(pageLimit + 1));
    console.log('Final query:', q);

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    console.log(`Found ${docs.length} documents`);

    const previews: WebsitePreview[] = docs.slice(0, pageLimit).map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Untitled',
        videoUrl: getCdnVideoUrl(data.videoUrl),
        ...(data.builtWith && { builtWith: data.builtWith }),
        ...(data.categories && { categories: data.categories }),
      };
    });

    const lastDoc = docs.length > pageLimit ? docs[pageLimit] : null;
    const hasMore = docs.length > pageLimit;

    const result: GetWebsitePreviewsResult = { websites: previews, lastDoc, hasMore };
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error('Error fetching website previews:', err);
    return { websites: [], lastDoc: null, hasMore: false };
  }
}
