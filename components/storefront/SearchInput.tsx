'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export interface SearchInputProps {
  placeholder?: string;
  basePath?: string;
  paramName?: string;
  className?: string;
}

export function SearchInput({
  placeholder = 'Search categories & products…',
  basePath = '/shop',
  paramName = 'search',
  className = '',
}: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramName) ?? '');

  useEffect(() => {
    setValue(searchParams.get(paramName) ?? '');
  }, [searchParams, paramName]);

  useEffect(() => {
    const current = searchParams.get(paramName) ?? '';
    if (value === current) return;
    const timer = window.setTimeout(() => {
      const q = value.trim();
      const params = new URLSearchParams(searchParams.toString());
      if (q) params.set(paramName, q);
      else params.delete(paramName);
      params.delete('page');
      router.replace(`${basePath}${params.toString() ? `?${params.toString()}` : ''}`);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [value, router, searchParams, basePath, paramName]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = value.trim();
      const params = new URLSearchParams(searchParams.toString());
      if (q) params.set(paramName, q);
      else params.delete(paramName);
      params.delete('page');
      router.push(`${basePath}${params.toString() ? `?${params.toString()}` : ''}`);
    },
    [value, router, searchParams, basePath, paramName]
  );

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Search categories and products"
        />
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
      </div>
    </form>
  );
}
