import { apiGet } from './client';
import type { Product } from '@/types/product';
import type { Category } from '@/types/category';
import type { BannerItem } from './banners';
import type { PublicStoreSettings } from './storeSettings';
import type { StorefrontReview } from './reviews';
import type { AdItem } from './ads';

export interface HomeFeedResponse {
  featuredProducts: Product[];
  trendingProducts: Product[];
  banners: BannerItem[];
  categories: Category[];
  categoryProducts: Array<{ category: Category; products: Product[] }>;
  reviews: StorefrontReview[];
  ads: AdItem[];
  settings: PublicStoreSettings | null;
}

export async function fetchHomeFeed(): Promise<HomeFeedResponse | null> {
  try {
    const res = await apiGet<HomeFeedResponse>('storefront/home-feed', {
      skipAuth: true,
      serverCacheSeconds: 60,
    });
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  } catch {
    return null;
  }
}
