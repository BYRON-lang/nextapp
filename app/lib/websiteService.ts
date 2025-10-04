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
  DocumentData as FirebaseDocumentData,
  QueryDocumentSnapshot as FirestoreQueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/* ------------------ 🔹 Utilities ------------------ */

function getCdnVideoUrl(storageUrl: string): string {
  try {
    if (storageUrl.includes('cdn.gridrr.com')) return storageUrl;

    const decodedUrl = decodeURIComponent(storageUrl);
    let fileName = '';

    const match = decodedUrl.match(/videos(?:%2F|\/)([^?]+)/);
    if (match && match[1]) fileName = match[1];

    const encodedFileName = encodeURIComponent(fileName);
    return `https://cdn.gridrr.com/videos/${encodedFileName}`;
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
  uploadedAt: string;
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
    // Note: If you use a preview service, you can fetch previews here instead of all websites
    return { prev: null, next: null }; // Placeholder: implement based on your preview service if needed
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

    // Fetch all website docs for computing category counts (or you can limit)
    const websitesRef = collection(db, 'websites');
    const q = query(websitesRef, limit(100)); // adjust limit if needed
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs;

    const categoryMap = new Map<string, number>();
    const normalizedCategoryMap = new Map<string, string>();
    ALL_CATEGORIES.forEach((cat) => {
      const norm = cat.trim().toLowerCase();
      categoryMap.set(cat, 0);
      normalizedCategoryMap.set(norm, cat);
    });

    docs.forEach((doc) => {
      const data = doc.data();
      const categories: string[] = Array.isArray(data.categories) ? data.categories : [];
      categories.forEach((cat) => {
        const norm = cat.trim().toLowerCase();
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
