/**
 * Optional public blog API — wire your backend to these routes for `/blogs` to populate.
 *
 * Expected (when implemented):
 * - `GET /blog-posts/public?limit=500` → `{ success, data: { posts: { slug, title, excerpt, updated_at }[] } }`
 * - `GET /blog-posts/public/s/:slug` → `{ success, data: { post: BlogPost } }`
 *
 * Until the backend exists, list/slug calls return empty / null and blog pages show not found or empty lists.
 */

import { apiGet } from './client';
import type { BlogPost, BlogPostSummary } from '@/types/blog';

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const res = await apiGet<{ post: BlogPost }>(`blog-posts/public/s/${encodeURIComponent(slug)}`, {
    skipAuth: true,
    serverCacheSeconds: 300,
  });
  if (!res.success || !res.data) return null;
  const post = (res.data as { post?: BlogPost }).post;
  return post ?? null;
}

export async function fetchBlogPostSummaries(): Promise<BlogPostSummary[]> {
  const res = await apiGet<{ posts: BlogPostSummary[] }>('blog-posts/public', {
    params: { limit: 500 },
    skipAuth: true,
    serverCacheSeconds: 600,
  });
  if (!res.success || !res.data) return [];
  const posts = (res.data as { posts?: BlogPostSummary[] }).posts;
  return posts ?? [];
}

export async function fetchBlogSitemapEntries(): Promise<Array<{ slug: string; lastModified: Date }>> {
  const posts = await fetchBlogPostSummaries();
  return posts.map((p) => ({
    slug: p.slug,
    lastModified: new Date(p.updated_at),
  }));
}
