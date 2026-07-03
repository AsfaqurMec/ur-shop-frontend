import { fetchFeaturedProducts } from '@/lib/api/products';
import { fetchProductReviews } from '@/lib/api/reviews';
import { getPublicStoreSettings } from '@/lib/api/storeSettings';
import { fetchPublicBanners } from '@/lib/api/banners';
import { fetchCategories } from '@/lib/api/categories';
import { fetchProducts } from '@/lib/api/products';
import { JsonLd } from '@/components/seo/JsonLd';
import { createPageMetadata } from '@/lib/seo/metadata';
import { websiteJsonLd } from '@/lib/seo/jsonld';
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

export default async function HomePage() {
  const featuredProducts = await fetchFeaturedProducts(8).catch(() => []);
  const banners = await fetchPublicBanners().catch(() => []);
  const publicSettings = await getPublicStoreSettings().catch(() => null);
  const categories = await fetchCategories(false, { serverCacheSeconds: 60 }).catch(() => [] as Category[]);
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

  const reviewGroups = await Promise.all(
    featuredProducts.slice(0, 6).map(async (product) => {
      const result = await fetchProductReviews(product.id, { limit: 2, offset: 0 }).catch(() => ({
        reviews: [],
        total: 0,
      }));
      return result.reviews.map((review) => ({
        ...review,
        product_name: product.name,
        product_slug: product.slug,
      }));
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
        categories={topCategories}
        categoryProducts={categoryProducts.filter((s) => s.products.length > 0)}
      />
    </>
  );
}
