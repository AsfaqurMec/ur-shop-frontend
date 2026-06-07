import { apiGet } from './client';

function unwrap<T>(res: {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  errors?: Array<{ message?: string }>;
}): T {
  if (!res.success || res.data === undefined) {
    if (Array.isArray(res.errors) && res.errors.length > 0) {
      const msg = res.errors.map((e) => e.message).filter(Boolean).join(' ');
      if (msg) throw new Error(msg);
    }
    throw new Error(res.message || res.error || 'Request failed');
  }
  return res.data;
}

export interface BannerButton {
  title: string;
  route: string;
}

export interface BannerItem {
  id: number;
  background_image: string;
  title: string | null;
  subtitle: string | null;
  buttons: BannerButton[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchPublicBanners(): Promise<BannerItem[]> {
  const res = await apiGet<{ banners: BannerItem[] }>('banners', {
    skipAuth: true,
    serverCacheSeconds: 60,
  });
  return unwrap(res).banners;
}
