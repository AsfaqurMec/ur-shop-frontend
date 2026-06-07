'use client';

import Link from 'next/link';
import type { Category } from '@/types/category';

export interface CategoryFilterProps {
  categories: Category[];
  currentSlug?: string | null;
  basePath?: string;
}

export function CategoryFilter({
  categories,
  currentSlug = null,
  basePath = '/shop',
}: CategoryFilterProps) {
  return (
    <nav className="space-y-1" aria-label="Categories">
      <Link
        href={basePath}
        className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          !currentSlug
            ? 'bg-primary/10 font-semibold text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        All categories
      </Link>
      {categories.map((cat) => {
        const href = `${basePath}/category/${cat.slug}`;
        const isActive = currentSlug === cat.slug;
        return (
          <Link
            key={cat.id}
            href={href}
            className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary/10 font-semibold text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {cat.name}
          </Link>
        );
      })}
    </nav>
  );
}
