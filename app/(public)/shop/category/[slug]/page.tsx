import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchCategoryBySlug, fetchCategories } from '@/lib/api/categories';
import { emptyProductList, fetchProducts } from '@/lib/api/products';
import { getPublicStoreSettings } from '@/lib/api/storeSettings';
import type { Category } from '@/types/category';
import { Container } from '@/components/ui';
import { CategoryFilter } from '@/components/storefront';
import { SearchInput } from '@/components/storefront';
import { ShopCollapsibleFilters } from '@/components/storefront';
import { ShopSaleFilter, ShopSidebarFilters, ShopSortControl } from '@/components/storefront/ShopCollapsibleFilters';
import { SocialSpeedDial } from '@/components/storefront';
import { CategoryShopClient } from '../../CategoryShopClient';
import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo/metadata';
import { stripHtml, truncateForMeta } from '@/lib/seo/text';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug).catch(() => null);
  if (!category) {
    return { title: 'Category Not Found', robots: { index: false, follow: false } };
  }
  const title = `${category.name} Collection`;
  const description = category.description?.trim()
    ? truncateForMeta(stripHtml(category.description), 160)
    : `Explore our premium ${category.name} collection at UR Shop. Find high-quality fabrics, modern fits, and exclusive designs with fast delivery in Bangladesh.`;

  return createPageMetadata({
    path: `/shop/category/${slug}`,
    title,
    description,
    keywords: [
      category.name,
      `${category.name} collection`,
      `${category.name} UR Shop`,
      'buy panjabi online bd',
      'men traditional wear',
      'premium panjabi',
    ],
  });
}

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const searchParamsResolved = await searchParams;
  const search = typeof searchParamsResolved.search === 'string' ? searchParamsResolved.search : undefined;
  const minPrice = typeof searchParamsResolved.min_price === 'string' ? Number(searchParamsResolved.min_price) : undefined;
  const maxPrice = typeof searchParamsResolved.max_price === 'string' ? Number(searchParamsResolved.max_price) : undefined;
  const onSale = searchParamsResolved.on_sale === '1';
  const sort = typeof searchParamsResolved.sort === 'string' && ['newest', 'price_asc', 'price_desc', 'name_asc', 'name_desc'].includes(searchParamsResolved.sort)
    ? searchParamsResolved.sort as 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc'
    : undefined;

  const category = await fetchCategoryBySlug(slug).catch(() => null);
  if (!category) notFound();

  const [result, categories, publicSettings] = await Promise.all([
    fetchProducts({
      page: 1,
      limit: 8,
      category_id: category.id,
      search,
      min_price: Number.isFinite(minPrice) ? minPrice : undefined,
      max_price: Number.isFinite(maxPrice) ? maxPrice : undefined,
      on_sale: onSale || undefined,
      sort,
      is_active: true,
    }).catch(() => emptyProductList(1, 8)),
    fetchCategories().catch((): Category[] => []),
    getPublicStoreSettings().catch(() => null),
  ]);

  return (
    <>
    <Container size="full" className="py-8 md:py-12 px-4 md:px-0 lg:px-20 xl:px-20 2xl:px-20">
      <div className="mb-10 border-b border-border/80 pb-8">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-x-8 sm:gap-y-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Category</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-3 max-w-2xl text-muted-foreground">{category.description}</p>
            )}
          </div>
          <ShopCollapsibleFilters
            categories={categories}
            searchBasePath={`/shop/category/${slug}`}
            categorySlug={slug}
            searchPlaceholder={`Search in ${category.name}…`}
          />
        </div>
      </div>
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
        <aside className="hidden shrink-0 lg:block lg:w-60">
          <div className="space-y-8 lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
            <ShopSidebarFilters basePath={`/shop/category/${slug}`} />
            <details className="rounded-xl border border-border/80 bg-card p-4 shadow-card" open>
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-muted-foreground">Categories</summary>
              <div className="mt-3">
                <CategoryFilter categories={categories} currentSlug={slug} basePath="/shop" />
              </div>
            </details>
            <ShopSaleFilter basePath={`/shop/category/${slug}`} />
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-6 hidden items-center justify-between gap-4 lg:flex">
            <Suspense fallback={<div className="h-10 w-72 animate-pulse rounded-md bg-muted" aria-hidden />}>
              <SearchInput
                basePath={`/shop/category/${slug}`}
                placeholder={`Search ${category.name}`}
                className="w-full max-w-md"
              />
            </Suspense>
            <ShopSortControl basePath={`/shop/category/${slug}`} />
          </div>
          <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded" />}>
            <CategoryShopClient
              initialProducts={result.products}
              total={result.total}
              categorySlug={slug}
              categoryId={category.id}
              search={search}
              minPrice={Number.isFinite(minPrice) ? minPrice : undefined}
              maxPrice={Number.isFinite(maxPrice) ? maxPrice : undefined}
              onSale={onSale}
              sort={sort}
            />
          </Suspense>
        </div>
      </div>
    </Container>
    <SocialSpeedDial links={publicSettings?.socialLinks ?? []} />
    </>
  );
}
