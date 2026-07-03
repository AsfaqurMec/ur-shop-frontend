'use client';

import { SocialSpeedDial } from '@/components/storefront/SocialSpeedDial';
import {
  CategoryProductsSections,
  CustomerReviewsSection,
  FacebookFeedSection,
  FeaturedCategoriesSection,
  HeroSection,
  NewsletterSection,
  TrendingProductsSection,
  useHomeAddToCart,
  VideoBannerSection,
  WhyShopWithUsSection,
  type HomeClientProps,
} from '@/components/home';
import { buildHeroSlides } from '@/components/home/utils';

export function HomeClient({
  featuredProducts,
  banners,
  reviews,
  socialLinks,
  categories,
  categoryProducts,
}: HomeClientProps) {
  const { addingProductId, handleAddToCart } = useHomeAddToCart();
  const slides = buildHeroSlides(banners, featuredProducts);
  const videoThumbnail = slides[0]?.imageUrl || '/icon.png';

  return (
    <>
      <HeroSection banners={banners} featuredProducts={featuredProducts} />
      <FeaturedCategoriesSection categories={categories} />
      <TrendingProductsSection
        products={featuredProducts}
        onAddToCart={handleAddToCart}
        addingProductId={addingProductId}
      />
      <CategoryProductsSections
        categoryProducts={categoryProducts}
        onAddToCart={handleAddToCart}
        addingProductId={addingProductId}
      />
      <WhyShopWithUsSection />
      <VideoBannerSection videoThumbnail={videoThumbnail} />
      <CustomerReviewsSection reviews={reviews} />
      <FacebookFeedSection socialLinks={socialLinks} />
      <NewsletterSection />
      <SocialSpeedDial links={socialLinks} />
    </>
  );
}
