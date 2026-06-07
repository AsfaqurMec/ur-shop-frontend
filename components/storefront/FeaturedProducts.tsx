import Link from 'next/link';
import { ProductGrid } from './ProductGrid';
import type { Product } from '@/types/product';

export interface FeaturedProductsProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  addingProductId?: number | null;
}

export function FeaturedProducts({
  products,
  onAddToCart,
  addingProductId,
}: FeaturedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-6 md:py-10" aria-labelledby="featured-heading">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="featured-heading" className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Featured products
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Hand-picked items from the catalog — add to cart or open a product for full details.
          </p>
        </div>
        <Link
          href="/shop"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-input bg-card px-5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
        >
          View all products
        </Link>
      </div>
      <ProductGrid
        products={products}
        onAddToCart={onAddToCart}
        addingProductId={addingProductId}
      />
    </section>
  );
}
