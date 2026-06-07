import type { MetadataRoute } from 'next';
import { fetchProductSitemapEntries } from '@/lib/api/products';
import { fetchCategories } from '@/lib/api/categories';
import { fetchBlogSitemapEntries } from '@/lib/api/blogPosts';
import { getSiteUrl } from '@/lib/seo/site';

/** Regenerate periodically to balance freshness vs. backend load (see also `serverCacheSeconds` on fetches). */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${base}/search`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/blogs`, lastModified: now, changeFrequency: 'weekly', priority: 0.75 },
  ];

  let productEntries: MetadataRoute.Sitemap = [];
  let categoryEntries: MetadataRoute.Sitemap = [];
  let blogEntries: MetadataRoute.Sitemap = [];

  try {
    const [products, categories, blogs] = await Promise.all([
      fetchProductSitemapEntries(),
      fetchCategories(false, { serverCacheSeconds: 3600 }),
      fetchBlogSitemapEntries(),
    ]);

    productEntries = products.map((p) => ({
      url: `${base}/products/${encodeURIComponent(p.slug)}`,
      lastModified: p.lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }));

    categoryEntries = categories.map((c) => ({
      url: `${base}/shop/category/${encodeURIComponent(c.slug)}`,
      lastModified: new Date(c.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    blogEntries = blogs.map((b) => ({
      url: `${base}/blogs/${encodeURIComponent(b.slug)}`,
      lastModified: b.lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch {
    // Catalog/blog APIs may be unavailable during build — still emit static URLs.
  }

  return [...staticRoutes, ...categoryEntries, ...productEntries, ...blogEntries];
}
