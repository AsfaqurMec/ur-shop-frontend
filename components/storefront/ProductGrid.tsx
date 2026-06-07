import type { Product } from '@/types/product';
import { ProductCard } from './ProductCard';

export interface ProductGridProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  addingProductId?: number | null;
}

export function ProductGrid({ products, onAddToCart, addingProductId }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-16 text-center">
        <p className="font-medium text-foreground">No products found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Try another category, clear filters, or search with different keywords.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id} className="h-full">
          <ProductCard
            product={product}
            onAddToCart={onAddToCart}
            addToCartLoading={addingProductId === product.id}
          />
        </li>
      ))}
    </ul>
  );
}
