'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchProducts } from '@/lib/api/products';
import { filterCategoriesByQuery } from '@/lib/search/filterCategories';
import type { Category } from '@/types/category';
import type { Product } from '@/types/product';

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

export interface HeaderSearchProps {
  categories: Category[];
}

export function HeaderSearch({ categories }: HeaderSearchProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const trimmed = query.trim();
  const matchedCategories = trimmed ? filterCategoriesByQuery(categories, trimmed).slice(0, 5) : [];
  const hasResults = matchedCategories.length > 0 || products.length > 0;
  const showDropdown = open && trimmed.length > 0;

  useEffect(() => {
    if (!trimmed) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await fetchProducts({ search: trimmed, limit: 5, is_active: true });
        if (!cancelled) setProducts(result.products);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const goToSearch = useCallback(() => {
    setOpen(false);
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    else router.push('/search');
  }, [router, trimmed]);

  return (
    <div ref={containerRef} className="relative">
      {open ? (
        <div className="flex items-center gap-1">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goToSearch();
            }}
            className="relative"
          >
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories & products…"
              className="w-44 rounded-lg border border-input bg-background py-1.5 pl-8 pr-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-56 lg:w-64"
              aria-label="Search categories and products"
              aria-expanded={showDropdown}
              aria-controls="header-search-results"
            />
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              <SearchIcon className="h-4 w-4" />
            </span>
          </form>
          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close search"
            onClick={() => {
              setOpen(false);
              setQuery('');
            }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Open search"
          onClick={() => setOpen(true)}
        >
          <SearchIcon className="h-5 w-5" />
        </button>
      )}

      {showDropdown ? (
        <div
          id="header-search-results"
          className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg ring-1 ring-black/5 dark:ring-white/10 sm:w-80"
          role="listbox"
        >
          {loading && !hasResults ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Searching…</p>
          ) : null}

          {!loading && !hasResults ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No matches found.</p>
          ) : null}

          {matchedCategories.length > 0 ? (
            <div className="border-b border-border/60 px-2 py-2">
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Categories</p>
              <ul>
                {matchedCategories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/shop/category/${category.slug}`}
                      className="block rounded-lg px-2 py-2 text-sm font-medium text-foreground hover:bg-muted"
                      onClick={() => {
                        setOpen(false);
                        setQuery('');
                      }}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {products.length > 0 ? (
            <div className="px-2 py-2">
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Products</p>
              <ul>
                {products.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.slug}`}
                      className="block rounded-lg px-2 py-2 text-sm font-medium text-foreground hover:bg-muted"
                      onClick={() => {
                        setOpen(false);
                        setQuery('');
                      }}
                    >
                      {product.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            type="button"
            className="w-full border-t border-border/60 bg-muted/30 px-4 py-2.5 text-left text-sm font-semibold text-primary hover:bg-muted/60"
            onClick={goToSearch}
          >
            View all results for &ldquo;{trimmed}&rdquo;
          </button>
        </div>
      ) : null}
    </div>
  );
}
