import type { Category } from '@/types/category';

/** Match categories by name, slug, or description (case-insensitive). */
export function filterCategoriesByQuery(categories: Category[], query: string): Category[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return categories.filter((category) => {
    if (category.name.toLowerCase().includes(needle)) return true;
    if (category.slug.toLowerCase().includes(needle)) return true;
    if (category.description?.toLowerCase().includes(needle)) return true;
    return false;
  });
}
