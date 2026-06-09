import { apiGet } from './client';
import type { Product, ProductListResult, ProductListParams } from '@/types/product';

/** Safe fallback when the catalog API is unreachable (matches list shape). */
export function emptyProductList(page = 1, limit = 12): ProductListResult {
  return { products: [], total: 0, page, limit, totalPages: 0 };
}

function unwrap<T>(res: { success: boolean; data?: T; error?: string }): T {
  if (!res.success || res.data === undefined) throw new Error(res.error ?? 'Request failed');
  return res.data;
}

export async function fetchProducts(params: ProductListParams = {}): Promise<ProductListResult> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    limit: params.limit ?? 12,
  };
  if (params.category_id != null) query.category_id = params.category_id;
  if (params.product_type) query.product_type = params.product_type;
  if (params.min_price != null) query.min_price = params.min_price;
  if (params.max_price != null) query.max_price = params.max_price;
  if (params.search) query.search = params.search;
  if (params.featured === true) query.featured = '1';
  if (params.is_active !== undefined) query.is_active = params.is_active ? '1' : '0';

  const res = await apiGet<ProductListResult>('products', {
    params: query,
    skipAuth: true,
    cache: 'no-store',
  });
  return unwrap(res);
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const res = await apiGet<{ product: Product }>(`products/s/${encodeURIComponent(slug)}`, {
    skipAuth: true,
    cache: 'no-store',
  });
  const data = unwrap(res);
  return data.product;
}

export async function fetchFeaturedProducts(limit = 8): Promise<Product[]> {
  const result = await fetchProducts({ featured: true, limit, is_active: true });
  return result.products;
}

/** Products in the same category, then same type, then featured — excluding the current product. */
export async function fetchRelatedProducts(
  product: Pick<Product, 'id' | 'category_id' | 'product_type'>,
  limit = 4,
): Promise<Product[]> {
  const related: Product[] = [];
  const seen = new Set<number>([product.id]);

  const addFromResult = (products: Product[]) => {
    for (const p of products) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      related.push(p);
      if (related.length >= limit) return true;
    }
    return related.length >= limit;
  };

  const fetchBatch = async (params: ProductListParams) => {
    try {
      const result = await fetchProducts({ ...params, limit: limit + 8, is_active: true });
      addFromResult(result.products);
    } catch {
      // Catalog may be partially unavailable; keep partial results.
    }
  };

  if (product.category_id != null) {
    await fetchBatch({ category_id: product.category_id });
  }
  if (related.length < limit) {
    await fetchBatch({ product_type: product.product_type });
  }
  if (related.length < limit) {
    await fetchBatch({ featured: true });
  }

  return related.slice(0, limit);
}

/**
 * Paginates active products for sitemap generation. Uses short server cache to reduce API load.
 */
export async function fetchProductSitemapEntries(): Promise<
  Array<{ slug: string; lastModified: Date }>
> {
  const out: Array<{ slug: string; lastModified: Date }> = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const res = await apiGet<ProductListResult>('products', {
      params: { page, limit: 100, is_active: '1' },
      skipAuth: true,
      serverCacheSeconds: 3600,
    });
    if (!res.success || !res.data) break;
    const data = res.data;
    for (const p of data.products) {
      out.push({ slug: p.slug, lastModified: new Date(p.updated_at) });
    }
    totalPages = Math.max(1, data.totalPages);
    page += 1;
  }

  return out;
}
