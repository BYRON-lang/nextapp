import { MetadataRoute } from 'next';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';

// Get all categories for sitemap
async function getAllCategories() {
  try {
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    return categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
    return [];
  }
}

// Get all frameworks for sitemap
async function getAllFrameworks() {
  try {
    const frameworksSnapshot = await getDocs(collection(db, 'frameworks'));
    return frameworksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching frameworks for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gridrr.com';
  const now = new Date();
  
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    }
  ];

  // Dynamic routes
  try {
    // Get all categories
    const categories = await getAllCategories();
    const categoryRoutes: MetadataRoute.Sitemap = categories.map(category => ({
      url: `${baseUrl}/category/${encodeURIComponent(category.id)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Get all frameworks
    const frameworks = await getAllFrameworks();
    const frameworkRoutes: MetadataRoute.Sitemap = frameworks.map(framework => ({
      url: `${baseUrl}/framework/${encodeURIComponent(framework.id)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [
      ...staticRoutes,
      ...categoryRoutes,
      ...frameworkRoutes,
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticRoutes; // Return at least the static routes if there's an error
  }
}
