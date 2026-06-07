/**
 * Product image paths from the API look like "products/images/xxx.jpg".
 *
 * Default: same-origin `/api/media/products/images/...` (see `app/api/media/[...path]/route.ts`).
 *
 * Set `NEXT_PUBLIC_IMAGE_DIRECT=1` for absolute backend/CDN URLs (`NEXT_PUBLIC_UPLOAD_BASE` or API origin).
 */

import { getApiBaseUrl } from './api/baseUrl';

function getUploadBase(): string {
  const base = process.env.NEXT_PUBLIC_UPLOAD_BASE;
  if (base) return base.replace(/\/$/, '');
  const api = getApiBaseUrl();
  return api.replace(/\/api\/?$/, '') || '';
}

function normalizeStoredImagePath(path: string): string {
  let p = path.trim().replace(/\\/g, '/');
  while (p.startsWith('/')) p = p.slice(1);
  return p;
}

/**
 * Demo DB filenames from seed-demo.js (`seed-<productId>.png`) — usually no file on disk.
 * Match by basename so any folder shape still counts.
 */
export function isDemoSeedProductImagePath(path: string | null | undefined): boolean {
  if (!path?.trim()) return false;
  const base = normalizeStoredImagePath(path).split('/').pop() ?? '';
  return /^seed-\d+\.(png|jpe?g|gif|webp)$/i.test(base);
}

export function getProductImageUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;

  const p = normalizeStoredImagePath(trimmed);
  if (isDemoSeedProductImagePath(p)) return null;

  const lower = p.toLowerCase();
  if (!lower.startsWith('products/images/')) return null;

  const pathForUrl = p.split('/').map((seg) => encodeURIComponent(seg)).join('/');

  if (process.env.NEXT_PUBLIC_IMAGE_DIRECT === '1') {
    const base = getUploadBase();
    return base ? `${base}/${pathForUrl}` : null;
  }

  return `/api/media/${pathForUrl}`;
}

export function getBannerImageUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;

  const p = normalizeStoredImagePath(trimmed);
  if (!p.toLowerCase().startsWith('banners/images/')) return null;
  const pathForUrl = p.split('/').map((seg) => encodeURIComponent(seg)).join('/');

  if (process.env.NEXT_PUBLIC_IMAGE_DIRECT === '1') {
    const base = getUploadBase();
    return base ? `${base}/${pathForUrl}` : null;
  }

  return `/api/media/${pathForUrl}`;
}

/**
 * Path to show on cards / product hero: first real upload by sort_order.
 * Never falls back to `thumbnail` when it is a demo seed path if `images` lists exist.
 * Returns null when only demo placeholders (avoid broken /api/media/.../seed-1.png).
 */
export function getPrimaryProductImagePath(product: {
  thumbnail?: string | null;
  images?: Array<{ path: string; sort_order?: number }> | null;
}): string | null | undefined {
  const imgs = product.images;
  const sorted =
    imgs && imgs.length > 0
      ? [...imgs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || 0)
      : [];

  for (const row of sorted) {
    if (!isDemoSeedProductImagePath(row.path)) return row.path;
  }

  if (product.thumbnail?.trim() && !isDemoSeedProductImagePath(product.thumbnail)) {
    return product.thumbnail;
  }

  return null;
}

/** Alt text for the resolved primary image (not `images[0]` when that row is a demo seed). */
export function getPrimaryProductImageAlt(product: {
  name: string;
  images?: Array<{ path: string; alt_text: string | null }> | null;
}, primaryPath: string | null | undefined): string {
  if (!primaryPath?.trim()) return product.name;
  const img = product.images?.find((i) => i.path === primaryPath);
  return (img?.alt_text && img.alt_text.trim()) || product.name;
}
