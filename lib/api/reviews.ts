import { apiGet, apiPost, apiPut } from './client';
import type { ProductReviewDetail, ProductReviewPublic } from '@/types/review';

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

export async function submitProductReview(
  productId: number,
  body: { rating: number; title?: string; body?: string }
): Promise<ProductReviewDetail> {
  const res = await apiPost<ProductReviewDetail>(`reviews/product/${productId}`, {
    rating: body.rating,
    ...(body.title !== undefined && body.title !== '' ? { title: body.title } : {}),
    ...(body.body !== undefined && body.body !== '' ? { body: body.body } : {}),
  });
  return unwrap(res);
}

export async function updateProductReview(
  reviewId: number,
  body: { rating?: number; title?: string | null; body?: string | null }
): Promise<ProductReviewDetail> {
  const res = await apiPut<ProductReviewDetail>(`reviews/${reviewId}`, body);
  return unwrap(res);
}
