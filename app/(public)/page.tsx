import { fetchFeaturedProducts } from '@/lib/api/products';
import { fetchProductReviews } from '@/lib/api/reviews';
import { getPublicStoreSettings } from '@/lib/api/storeSettings';
import { fetchPublicBanners } from '@/lib/api/banners';
import { JsonLd } from '@/components/seo/JsonLd';
import { createPageMetadata } from '@/lib/seo/metadata';
import { websiteJsonLd } from '@/lib/seo/jsonld';
import { SITE_META_HOME_DESCRIPTION } from '@/lib/seo/siteCopy';
import { HomeClient } from './HomeClient';

export const metadata = createPageMetadata({
  path: '/',
  title: 'Premium Panjabi Collection 👔 Men’s Fashion | Lifestyle Accessories',
  description: SITE_META_HOME_DESCRIPTION,
  keywords: [
    'UR Shop',
    'Premium Panjabi Collection',
    'Men’s Fashion',
    'Lifestyle Accessories',
    'Panjabi',
    'Men’s Clothing',
    'Fashion',
    'Accessories',
    'Panjabi Collection',
  ],
});

export default async function HomePage() {
  const featuredProducts = await fetchFeaturedProducts(8).catch(() => []);
  const banners = await fetchPublicBanners().catch(() => []);
  const publicSettings = await getPublicStoreSettings().catch(() => null);
  const reviewGroups = await Promise.all(
    featuredProducts.slice(0, 6).map(async (product) => {
      const result = await fetchProductReviews(product.id, { limit: 2, offset: 0 }).catch(() => ({
        reviews: [],
        total: 0,
      }));
      return result.reviews.map((review) => ({ ...review, product_name: product.name }));
    })
  );
  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <HomeClient
        featuredProducts={featuredProducts}
        banners={banners}
        reviews={reviewGroups.flat().slice(0, 6)}
        socialLinks={publicSettings?.socialLinks ?? []}
      />
    </>
  );
}
