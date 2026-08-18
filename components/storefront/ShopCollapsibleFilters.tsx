'use client';

import { Suspense, useId, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Category } from '@/types/category';
import { Button } from '@/components/ui';
import { CategoryFilter } from './CategoryFilter';
import { SearchInput } from './SearchInput';

type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';

function applyParams(router: ReturnType<typeof useRouter>, searchParams: ReturnType<typeof useSearchParams>, updates: Record<string, string | null>) {
  const params = new URLSearchParams(searchParams.toString());
  Object.entries(updates).forEach(([key, value]) => {
    if (value) params.set(key, value);
    else params.delete(key);
  });
  params.delete('page');
  router.push(`/shop${params.toString() ? `?${params}` : ''}`);
}

export function ShopSortControl() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sort, setSort] = useState<ProductSort>((searchParams.get('sort') as ProductSort) || 'newest');

  const changeSort = (value: ProductSort) => {
    setSort(value);
    applyParams(router, searchParams, { sort: value === 'newest' ? null : value });
  };

  return (
    <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <span className="whitespace-nowrap">Sort by</span>
      <select value={sort} onChange={(e) => changeSort(e.target.value as ProductSort)} className="h-10 min-w-44 rounded-md border border-input bg-background px-3 text-sm text-foreground">
        <option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="name_asc">Name: A to Z</option><option value="name_desc">Name: Z to A</option>
      </select>
    </label>
  );
}

export function ShopSidebarFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get('max_price') ?? 100000));
  const ceiling = 5000;

  const apply = () => applyParams(router, searchParams, {
    max_price: maxPrice < ceiling ? String(maxPrice) : null,
  });

  return (
    <div className="space-y-6 rounded-xl border border-border/80 bg-card p-4 shadow-card">
      <div>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Price range</h2>
        <p className="mb-3 text-sm font-medium text-foreground">৳0 <span className='px-1'>to</span> ৳{maxPrice.toLocaleString()}</p>
        <input aria-label="Maximum price" type="range" min="0" max={ceiling} step="100" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-primary" />
        <Button type="button" size="sm" className="mt-2 w-full" onClick={apply}>Apply price</Button>
      </div>
    </div>
  );
}

export function ShopSaleFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const saleOnly = searchParams.get('on_sale') === '1';
  return <div className="rounded-xl border border-border/80 bg-card p-4 shadow-card"><h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Sale</h2><label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground"><input type="checkbox" checked={saleOnly} onChange={(e) => applyParams(router, searchParams, { on_sale: e.target.checked ? '1' : null })} className="h-4 w-4 accent-primary" /> Sale items only</label></div>;
}

function FilterSlidersIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

export interface ShopCollapsibleFiltersProps {
  categories: Category[];
  /** Passed to SearchInput `basePath` */
  searchBasePath?: string;
  /** Passed to SearchInput `paramName` (e.g. `q` on `/search`) */
  searchParamName?: string;
  /** Passed to CategoryFilter `currentSlug` */
  categorySlug?: string | null;
  searchPlaceholder?: string;
  /** Heading above the search field */
  searchSectionLabel?: string;
  /** Heading above category links */
  categoriesSectionLabel?: string;
}

export function ShopCollapsibleFilters({
  categories,
  searchBasePath = '/shop',
  searchParamName = 'search',
  categorySlug = null,
  searchPlaceholder = 'Search shop…',
  searchSectionLabel = 'Search',
  categoriesSectionLabel = 'Categories',
}: ShopCollapsibleFiltersProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') ?? '');
  const [saleOnly, setSaleOnly] = useState(searchParams.get('on_sale') === '1');
  const [sort, setSort] = useState<ProductSort>((searchParams.get('sort') as ProductSort) || 'newest');

  const applyDrawerFilters = (overrides: Partial<{ minPrice: string; maxPrice: string; saleOnly: boolean; sort: ProductSort }> = {}) => {
    const params = new URLSearchParams(searchParams.toString());
    const min = (overrides.minPrice ?? minPrice).trim();
    const max = (overrides.maxPrice ?? maxPrice).trim();
    const nextSaleOnly = overrides.saleOnly ?? saleOnly;
    const nextSort = overrides.sort ?? sort;
    if (min) params.set('min_price', min); else params.delete('min_price');
    if (max) params.set('max_price', max); else params.delete('max_price');
    if (nextSaleOnly) params.set('on_sale', '1'); else params.delete('on_sale');
    if (nextSort === 'newest') params.delete('sort'); else params.set('sort', nextSort);
    params.delete('page');
    router.push(`${searchBasePath}${params.toString() ? `?${params.toString()}` : ''}`);
    setOpen(false);
  };

  const applyPriceRange = (event: React.FormEvent) => {
    event.preventDefault();
    applyDrawerFilters();
  };

  return (
    <div className="contents">
      <div className="col-span-full flex min-w-0 items-center gap-2 sm:justify-self-end sm:hidden flex">
        <div className="min-w-0 flex-1">
          <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-lg bg-muted" aria-hidden />}>
            <SearchInput basePath={searchBasePath} paramName={searchParamName} placeholder={searchPlaceholder} />
          </Suspense>
        </div>
        <Button
          type="button"
          variant="outline"
          size="md"
          className="gap-2 border-border/80 bg-card/50"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
        >
          <FilterSlidersIcon className="shrink-0 text-muted-foreground" />
          <span>Filters</span>
        </Button>
      </div>
      {open ? (<>
        <button type="button" aria-label="Close filters" className="fixed inset-0 z-40 bg-black/45" onClick={() => setOpen(false)} />
        <div
          id={panelId}
          className="fixed bottom-0 right-0 top-0 z-50 flex w-[min(22rem,88vw)] flex-col gap-6 overflow-y-auto bg-background p-5 shadow-2xl"
        >
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Filters</h2><Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Close</Button></div>
          <form onSubmit={applyPriceRange} className="space-y-3 rounded-xl border border-border/60 bg-card/80 p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price range</h2>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min="0" inputMode="decimal" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min price" className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm" />
              <input type="number" min="0" inputMode="decimal" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max price" className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm" />
            </div>
            <Button type="submit" size="sm">Apply price</Button>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={saleOnly} onChange={(e) => { const checked = e.target.checked; setSaleOnly(checked); applyDrawerFilters({ saleOnly: checked }); }} /> Sale items only</label>
            <label className="block text-sm font-medium">Sort by
              <select value={sort} onChange={(e) => { const value = e.target.value as ProductSort; setSort(value); applyDrawerFilters({ sort: value }); }} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="name_asc">Name: A to Z</option><option value="name_desc">Name: Z to A</option>
              </select>
            </label>
          </form>
          <details className="rounded-xl border border-border/60 bg-card/80 p-4" open>
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-muted-foreground">{categoriesSectionLabel}</summary>
            <div className="mt-3"><CategoryFilter categories={categories} currentSlug={categorySlug} basePath="/shop" /></div>
          </details>
        </div>
      </>) : null}
    </div>
  );
}
