import Link from 'next/link';
import type { Category } from '@/types/category';

interface SearchCategoryResultsProps {
  categories: Category[];
  query: string;
}

export function SearchCategoryResults({ categories, query }: SearchCategoryResultsProps) {
  if (!query || categories.length === 0) return null;

  return (
    <section className="mb-8 rounded-xl border border-border/80 bg-card p-5 shadow-card">
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Matching categories
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} match &ldquo;{query}&rdquo;
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/shop/category/${category.slug}`}
              className="inline-flex items-center rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
