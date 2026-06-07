import { Suspense } from 'react';
import { emptyProductList, fetchProducts } from '@/lib/api/products';
import { fetchCategories } from '@/lib/api/categories';
import { getPublicStoreSettings } from '@/lib/api/storeSettings';
import type { Category } from '@/types/category';
import { Container } from '@/components/ui';
import { SearchInput } from '@/components/storefront';
import { CategoryFilter } from '@/components/storefront';
import { ShopCollapsibleFilters } from '@/components/storefront';
import { SocialSpeedDial } from '@/components/storefront';
import { SearchClient } from './SearchClient';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  path: '/search',
  title: 'Search products',
  description:
    'Search Parves BD by product name or description. Find software, courses, tools, and licenses in the catalog.',
  keywords: ['Parves BD search', 'find digital products', 'catalog search'],
});

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.trim() : '';
  const page = Number(params.page) || 1;

  const [result, categories, publicSettings] = await Promise.all([
    fetchProducts({
      page,
      limit: 12,
      is_active: true,
      ...(q ? { search: q } : {}),
    }).catch(() => emptyProductList(page)),
    fetchCategories().catch((): Category[] => []),
    getPublicStoreSettings().catch(() => null),
  ]);

  return (
    <>
    <Container size="lg" className="py-8 md:py-12">
      <div className="mb-10 border-b border-border/80 pb-8">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-x-8 sm:gap-y-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">Search</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {q ? (
                <>
                  Results for <span className="font-semibold text-foreground">&ldquo;{q}&rdquo;</span>
                </>
              ) : (
                'Browse the catalog below, or enter keywords to find products by name or description.'
              )}
            </p>
          </div>
          <ShopCollapsibleFilters
            categories={categories}
            searchBasePath="/search"
            searchParamName="q"
            searchPlaceholder="Search products…"
            searchSectionLabel="Query"
            categoriesSectionLabel="Browse by category"
          />
        </div>
      </div>
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
        <aside className="hidden shrink-0 lg:block lg:w-60">
          <div className="space-y-8 lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Query
              </h2>
              <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-md bg-muted" aria-hidden />}>
                <SearchInput basePath="/search" paramName="q" placeholder="Search products…" />
              </Suspense>
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-card">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Browse by category
              </h2>
              <CategoryFilter categories={categories} basePath="/shop" />
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" aria-hidden />}>
            <SearchClient
              initialProducts={result.products}
              total={result.total}
              totalPages={result.totalPages}
              page={result.page}
              query={q}
            />
          </Suspense>
        </div>
      </div>
    </Container>
    <SocialSpeedDial links={publicSettings?.socialLinks ?? []} />
    </>
  );
}
