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
    return { title: 'Category', robots: { index: false, follow: false } };
  }
  return createPageMetadata({
    path: `/shop/category/${slug}`,
    title: category.name,
    description: truncateForMeta(
      stripHtml(category.description ?? `Browse ${category.name} digital products in this category.`),
      160
    ),
  });
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const searchParamsResolved = await searchParams;
  const page = Number(searchParamsResolved.page) || 1;
  const search = typeof searchParamsResolved.search === 'string' ? searchParamsResolved.search : undefined;

  const category = await fetchCategoryBySlug(slug).catch(() => null);
  if (!category) notFound();

  const [result, categories, publicSettings] = await Promise.all([
    fetchProducts({
      page,
      limit: 12,
      category_id: category.id,
      search,
      is_active: true,
    }).catch(() => emptyProductList(page)),
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
            searchPlaceholder="Search in category…"
          />
        </div>
      </div>
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
        <aside className="hidden shrink-0 lg:block lg:w-60">
          <div className="space-y-8 lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Search
              </h2>
              <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-md bg-muted" aria-hidden />}>
                <SearchInput basePath={`/shop/category/${slug}`} placeholder="Search in category…" />
              </Suspense>
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-card">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Categories
              </h2>
              <CategoryFilter categories={categories} currentSlug={slug} basePath="/shop" />
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <CategoryShopClient
            initialProducts={result.products}
            total={result.total}
            totalPages={result.totalPages}
            page={result.page}
            categorySlug={slug}
          />
        </div>
      </div>
    </Container>
    <SocialSpeedDial links={publicSettings?.socialLinks ?? []} />
    </>
  );
}
