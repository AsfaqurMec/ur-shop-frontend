import type { Product } from '@/types/product';

/** True when the product has variation dimensions or persisted variation rows. */
export function productUsesVariations(product: Product): boolean {
  const attrs = product.catalog_attributes ?? [];
  const hasDims = attrs.some((a) => a.kind === 'select' && a.used_for_variations);
  const hasRows = (product.catalog_variations?.length ?? 0) > 0;
  return hasDims || hasRows;
}

export function getDefaultVariationPricing(product: Product): {
  price: number;
  compare_at_price: number | null;
} | null {
  const id = product.default_variation_id;
  if (id == null) return null;
  const row = product.catalog_variations?.find((v) => v.id === id && v.enabled);
  if (!row) return null;
  return { price: Number(row.price), compare_at_price: row.compare_at_price };
}
