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
import { HomepageAdPopup } from '@/components/home/HomepageAdPopup';

export function HomeClient({
  featuredProducts,
  trendingProducts,
  banners,
  reviews,
  socialLinks,
  categories,
  categoryProducts,
  ads,
}: HomeClientProps) {
  const { addingProductId, handleAddToCart } = useHomeAddToCart();
  const slides = buildHeroSlides(banners, featuredProducts);
  const videoThumbnail = slides[0]?.imageUrl || '/icon.png';
  const displayedTrending = trendingProducts && trendingProducts.length > 0 ? trendingProducts : featuredProducts;

  return (
    <>
      <HomepageAdPopup ads={ads} />
      <HeroSection banners={banners} featuredProducts={featuredProducts} />
      <FeaturedCategoriesSection categories={categories} />
      <div className="content-visibility-auto">
        <TrendingProductsSection
          products={displayedTrending}
          onAddToCart={handleAddToCart}
          addingProductId={addingProductId}
        />
      </div>
      <div className="content-visibility-auto">
        <CategoryProductsSections
          categoryProducts={categoryProducts}
          onAddToCart={handleAddToCart}
          addingProductId={addingProductId}
        />
      </div>
      <div className="content-visibility-auto">
        <WhyShopWithUsSection />
      </div>
      <div className="content-visibility-auto">
        <VideoBannerSection videoThumbnail={videoThumbnail} />
      </div>
      <div className="content-visibility-auto">
        <CustomerReviewsSection reviews={reviews} />
      </div>
      <div className="content-visibility-auto">
        <FacebookFeedSection socialLinks={socialLinks} />
      </div>
      <div className="content-visibility-auto">
        <NewsletterSection />
      </div>
      <SocialSpeedDial links={socialLinks} />
    </>
  );
}
