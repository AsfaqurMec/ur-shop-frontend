'use client';

import { Suspense, useId, useState } from 'react';
import type { Category } from '@/types/category';
import { Button } from '@/components/ui';
import { CategoryFilter } from './CategoryFilter';
import { SearchInput } from './SearchInput';

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

  return (
    <div className="contents lg:hidden">
      <div className="flex justify-end sm:justify-self-end">
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
      {open ? (
        <div
          id={panelId}
          className="col-span-full flex flex-col gap-8 rounded-xl border border-border/80 bg-card/40 p-4 shadow-card"
        >
          <div className="flex min-w-0 flex-col gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{searchSectionLabel}</h2>
            <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-lg bg-muted" aria-hidden />}>
              <SearchInput
                basePath={searchBasePath}
                paramName={searchParamName}
                placeholder={searchPlaceholder}
              />
            </Suspense>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/80 p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{categoriesSectionLabel}</h2>
            <CategoryFilter categories={categories} currentSlug={categorySlug} basePath="/shop" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
