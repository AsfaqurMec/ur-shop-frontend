import { apiGet } from './client';
import type { Category } from '@/types/category';

function unwrap<T>(res: { success: boolean; data?: T; error?: string }): T {
  if (!res.success || res.data === undefined) throw new Error(res.error ?? 'Request failed');
  return res.data;
}

export async function fetchCategories(
  nested = false,
  options?: { serverCacheSeconds?: number }
): Promise<Category[]> {
  const res = await apiGet<{ categories: Category[] }>('categories', {
    params: nested ? { nested: '1' } : undefined,
    skipAuth: true,
    ...(options?.serverCacheSeconds != null
      ? { serverCacheSeconds: options.serverCacheSeconds }
      : { cache: 'no-store' }),
  });
  const data = unwrap(res);
  return data.categories;
}

export async function fetchCategoryBySlug(slug: string): Promise<Category> {
  const res = await apiGet<{ category: Category }>(`categories/${encodeURIComponent(slug)}`, {
    skipAuth: true,
    cache: 'no-store',
  });
  const data = unwrap(res);
  return data.category;
}
