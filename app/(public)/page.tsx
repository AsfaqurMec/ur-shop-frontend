import { fetchFeaturedProducts, fetchTrendingProducts } from '@/lib/api/products';
import { fetchStorefrontReviews } from '@/lib/api/reviews';
import { getPublicStoreSettings } from '@/lib/api/storeSettings';
import { fetchPublicBanners } from '@/lib/api/banners';
import { fetchCategories } from '@/lib/api/categories';
import { fetchPublicAds } from '@/lib/api/ads';
import { fetchProducts } from '@/lib/api/products';
import { JsonLd } from '@/components/seo/JsonLd';
import { createPageMetadata } from '@/lib/seo/metadata';
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo/jsonld';
import { SITE_META_HOME_DESCRIPTION } from '@/lib/seo/siteCopy';
import { HomeClient } from './HomeClient';
import type { Category } from '@/types/category';
import type { Product } from '@/types/product';

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

export const revalidate = 60;

export default async function HomePage() {
  // These requests do not depend on one another. Starting them together avoids
  // making visitors wait for round-trips before the catalog can render.
  const [featuredProducts, trendingProducts, banners, publicSettings, categories, storefrontReviews, ads] = await Promise.all([
    fetchFeaturedProducts(8).catch(() => []),
    fetchTrendingProducts(8).catch(() => []),
    fetchPublicBanners().catch(() => []),
    getPublicStoreSettings().catch(() => null),
    fetchCategories(false, { serverCacheSeconds: 60 }).catch(() => [] as Category[]),
    fetchStorefrontReviews({ limit: 12 }).catch(() => ({
      reviews: [],
      total: 0,
    })),
    fetchPublicAds().catch(() => []),
  ]);
  const topCategories = categories
    .filter((c) => c.parent_id == null)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));

  const categoryProducts = await Promise.all(
    topCategories.map(async (category) => {
      const result = await fetchProducts({ category_id: category.id, limit: 8, is_active: true }).catch(() => ({
        products: [] as Product[],
        total: 0,
        page: 1,
        limit: 8,
        totalPages: 0,
      }));
      return { category, products: result.products };
    })
  );

  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={organizationJsonLd()} />
      <HomeClient
        featuredProducts={featuredProducts}
        trendingProducts={trendingProducts}
        banners={banners}
        reviews={storefrontReviews.reviews}
        socialLinks={publicSettings?.socialLinks ?? []}
        categories={topCategories}
        categoryProducts={categoryProducts.filter((s) => s.products.length > 0)}
        ads={ads}
      />
    </>
  );
}
