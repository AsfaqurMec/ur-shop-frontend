import { getBannerImageUrl, getPrimaryProductImagePath, getProductImageUrl } from '@/lib/imageUrl';
import type { SocialLink } from '@/lib/api/storeSettings';
import { SITE_HERO_SUBTITLE } from '@/lib/seo/siteCopy';
import type { BannerItem } from '@/lib/api/banners';
import type { Product } from '@/types/product';
import { fallbackSlides } from './constants';
import type { HeroSlide } from './types';

export function findFacebookLink(links: SocialLink[]) {
  return links.find(
    (item) =>
      item.label.toLowerCase().includes('facebook') ||
      item.link.toLowerCase().includes('facebook.com')
  );
}

export function buildHeroSlides(banners: BannerItem[], featuredProducts: Product[]): HeroSlide[] {
  const bannerSlides = banners.map((banner) => ({
    title: banner.title || '',
    subtitle: banner.subtitle || '',
    imageUrl: getBannerImageUrl(banner.background_image) || '/icon.png',
    buttons: banner.buttons,
  }));

  const heroSlides = featuredProducts.slice(0, 4).map((product) => ({
    title: product.name,
    subtitle: product.description || SITE_HERO_SUBTITLE,
    imageUrl: getProductImageUrl(getPrimaryProductImagePath(product)) || '/icon.png',
    buttons: [] as HeroSlide['buttons'],
  }));

  if (bannerSlides.length > 0) return bannerSlides;
  if (heroSlides.length > 0) return heroSlides;
  return fallbackSlides.map((s) => ({ ...s, buttons: [] }));
}
