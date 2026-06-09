'use client';

import { useState } from 'react';
import Link from 'next/link';
import { addToCart } from '@/lib/api/cart';
import type { Product } from '@/types/product';
import { ProductGrid } from './ProductGrid';
import { useShowAddedToCartModal } from './AddedToCartModalProvider';
import { getPrimaryProductImagePath, getProductImageUrl } from '@/lib/imageUrl';

export interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const showAddedToCart = useShowAddedToCartModal();

  if (products.length === 0) return null;

  const handleAddToCart = async (product: Product) => {
    setAddingProductId(product.id);
    try {
      await addToCart(product.id, 1);
      window.dispatchEvent(new Event('cart:changed'));
      showAddedToCart({
        name: product.name,
        imageUrl: getProductImageUrl(getPrimaryProductImagePath(product)),
      });
    } catch {
      // API client redirects on 401
    } finally {
      setAddingProductId(null);
    }
  };

  return (
    <section className="py-10 md:py-14" aria-labelledby="related-products-heading">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">You may also like</p>
          <h2
            id="related-products-heading"
            className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl"
          >
            Related products
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            More items from the same category and catalog.
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
        onAddToCart={handleAddToCart}
        addingProductId={addingProductId}
      />
    </section>
  );
}
