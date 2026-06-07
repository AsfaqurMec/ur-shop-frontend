import { Suspense } from 'react';
import { emptyProductList, fetchProducts } from '@/lib/api/products';
import { fetchCategories } from '@/lib/api/categories';
import { getPublicStoreSettings } from '@/lib/api/storeSettings';
import type { Category } from '@/types/category';
import { Container } from '@/components/ui';
import { CategoryFilter } from '@/components/storefront';
import { SearchInput } from '@/components/storefront';
import { ShopCollapsibleFilters } from '@/components/storefront';
import { SocialSpeedDial } from '@/components/storefront';
import { ShopClient } from './ShopClient';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  path: '/shop',
  title: 'Shop — all digital products',
  description:
    'Parves BD shop: browse the full catalog of downloadable software, license keys, subscriptions, and digital services. Filter by category or search.',
  keywords: ['Parves BD shop', 'catalog', 'digital products', 'licenses'],
});

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ShopPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = typeof params.search === 'string' ? params.search : undefined;
  
  const [result, categories, publicSettings] = await Promise.all([
    fetchProducts({
      page,
      limit: 12,
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">Shop</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Browse the full catalog. Filter by category or search — prices and types are shown on each card.
            </p>
          </div>
          <ShopCollapsibleFilters categories={categories} />
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
                <SearchInput basePath="/shop" placeholder="Search shop…" />
              </Suspense>
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-card">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Categories
              </h2>
              <CategoryFilter categories={categories} basePath="/shop" />
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded" />}>
            <ShopClient
              initialProducts={result.products}
              total={result.total}
              totalPages={result.totalPages}
              page={result.page}
              categories={categories}
            />
          </Suspense>
        </div>
      </div>
    </Container>
    <SocialSpeedDial links={publicSettings?.socialLinks ?? []} />
    </>
  );
}
