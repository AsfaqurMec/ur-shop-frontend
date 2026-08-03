import { apiGet, apiPostFormData, apiPutFormData } from './client';
import type { ProductReviewDetail, ProductReviewPublic } from '@/types/review';

export type StorefrontReview = ProductReviewPublic & {
  product_name: string;
  product_slug: string;
};

function unwrap<T>(res: { success: boolean; data?: T; error?: string }): T {
  if (!res.success || res.data === undefined) throw new Error(res.error ?? 'Request failed');
  return res.data;
}

export async function fetchProductReviews(
  productId: number,
  params?: { limit?: number; offset?: number }
): Promise<{ reviews: ProductReviewPublic[]; total: number }> {
  const res = await apiGet<{ reviews: ProductReviewPublic[]; total: number }>(
    `reviews/product/${productId}`,
    {
      params: params as Record<string, string | number | boolean | undefined>,
      skipAuth: true,
      cache: 'no-store',
    }
  );
  return unwrap(res);
}

export async function fetchStorefrontReviews(
  params?: { limit?: number; offset?: number }
): Promise<{ reviews: StorefrontReview[]; total: number }> {
  const res = await apiGet<{ reviews: StorefrontReview[]; total: number }>('reviews', {
    params: params as Record<string, string | number | boolean | undefined>,
    skipAuth: true,
    cache: 'no-store',
  });
  return unwrap(res);
}

export async function submitProductReview(
  productId: number,
  body: { rating: number; title?: string; body?: string; image?: File | null }
): Promise<ProductReviewDetail> {
  const formData = new FormData();
  formData.append('rating', String(body.rating));
  if (body.title?.trim()) formData.append('title', body.title.trim());
  if (body.body?.trim()) formData.append('body', body.body.trim());
  if (body.image) formData.append('image', body.image);
  const res = await apiPostFormData<ProductReviewDetail>(`reviews/product/${productId}`, formData);
  return unwrap(res);
}

export async function updateProductReview(
  reviewId: number,
  body: { rating?: number; title?: string | null; body?: string | null; image?: File | null }
): Promise<ProductReviewDetail> {
  const formData = new FormData();
  if (body.rating !== undefined) formData.append('rating', String(body.rating));
  if (body.title !== undefined) formData.append('title', body.title ?? '');
  if (body.body !== undefined) formData.append('body', body.body ?? '');
  if (body.image) formData.append('image', body.image);
  const res = await apiPutFormData<ProductReviewDetail>(`reviews/${reviewId}`, formData);
  return unwrap(res);
}
