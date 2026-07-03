import type { BannerItem } from '@/lib/api/banners';
import type { SocialLink } from '@/lib/api/storeSettings';
import type { Category } from '@/types/category';
import type { Product } from '@/types/product';
import type { ProductReviewPublic } from '@/types/review';

export interface HomeClientProps {
  featuredProducts: Product[];
  banners: BannerItem[];
  reviews: Array<ProductReviewPublic & { product_name?: string; product_slug?: string }>;
  socialLinks: SocialLink[];
  categories: Category[];
  categoryProducts: Array<{ category: Category; products: Product[] }>;
}

export interface HeroSlide {
  title: string;
  subtitle: string;
  imageUrl: string;
  buttons: Array<{ title: string; route: string }>;
}

export type ReviewItem = ProductReviewPublic & {
  product_name?: string;
  product_slug?: string;
};
