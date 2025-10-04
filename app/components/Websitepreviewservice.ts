// websitePreviewService.ts
import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    startAfter,
    QueryDocumentSnapshot,
    DocumentData,
  } from 'firebase/firestore';
  import { db } from '../lib/firebase';
  
  /* ------------------ 🔹 Types ------------------ */
  export interface WebsitePreview {
    id: string;
    name: string;
    videoUrl: string;
  }
  
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
  
  /* ------------------ 🔹 CDN Video Helper ------------------ */
  function getCdnVideoUrl(storageUrl: string): string {
    if (!storageUrl) return '';
    if (storageUrl.includes('cdn.gridrr.com')) return storageUrl;
  
    const decodedUrl = decodeURIComponent(storageUrl);
    const match = decodedUrl.match(/videos(?:%2F|\/)([^?]+)/);
    if (!match || !match[1]) {
      console.warn('Invalid video URL format:', storageUrl);
      return storageUrl; // Return original URL if we can't process it
    }
    const encodedFileName = encodeURIComponent(match[1]);
    return `https://cdn.gridrr.com/videos/${encodedFileName}`;
  }
  
  
  /* ------------------ 🔹 Fetch Previews ------------------ */
  export const getWebsitePreviews = async (
    options: GetWebsitePreviewsOptions = {}
  ): Promise<GetWebsitePreviewsResult> => {
    const {
      limit: pageLimit = 12,
      startAfterDoc = null,
      category,
      builtWith,
      sortBy = 'latest',
    } = options;
  
    const cacheKey = `preview-${category || 'all'}-${builtWith || 'all'}-${sortBy}-${startAfterDoc?.id || 'first'}-${pageLimit}`;
    const cached = getFromCache<GetWebsitePreviewsResult>(cacheKey);
    if (cached) return cached;
  
    try {
      const websitesRef = collection(db, 'websites');
  
      // Sorting
      let q = query(
        websitesRef,
        orderBy(sortBy === 'popular' ? 'views' : 'uploadedAt', 'desc')
      );
  
      // Pagination
      if (startAfterDoc) q = query(q, startAfter(startAfterDoc));
      q = query(q, limit(pageLimit + 1)); // fetch 1 extra to check hasMore
  
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
  
      const previews: WebsitePreview[] = docs.slice(0, pageLimit).map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Untitled',
          videoUrl: getCdnVideoUrl(data.videoUrl),
        };
      });
  
      const lastDoc = docs.length > pageLimit ? docs[pageLimit] : null;
  
      const result: GetWebsitePreviewsResult = {
        websites: previews,
        lastDoc,
        hasMore: docs.length > pageLimit,
      };
  
      setCache(cacheKey, result);
      return result;
    } catch (err) {
      console.error('Error fetching website previews:', err);
      return { websites: [], lastDoc: null, hasMore: false };
    }
  };
  