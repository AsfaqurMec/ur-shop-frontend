export function getDrawerUserInitials(nameOrEmail: string): string {
  const t = nameOrEmail.trim();
  if (!t) return '?';
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return t.slice(0, 2).toUpperCase();
}

export function getNavCategories<T extends { parent_id: number | null; sort_order: number }>(categories: T[]) {
  return categories
    .filter((c) => c.parent_id == null)
    .sort((a, b) => a.sort_order - b.sort_order);
}
