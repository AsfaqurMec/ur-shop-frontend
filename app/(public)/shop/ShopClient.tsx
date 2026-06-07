'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { addToCart } from '@/lib/api/cart';
import type { Product } from '@/types/product';
import type { Category } from '@/types/category';
import { ProductGrid } from '@/components/storefront';
import { useShowAddedToCartModal } from '@/components/storefront/AddedToCartModalProvider';
import { Button } from '@/components/ui';
import { getPrimaryProductImagePath, getProductImageUrl } from '@/lib/imageUrl';

interface ShopClientProps {
  initialProducts: Product[];
  total: number;
  totalPages: number;
  page: number;
  categories: Category[];
}

export function ShopClient({
  initialProducts,
  total,
  totalPages,
  page,
}: ShopClientProps) {
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const showAddedToCart = useShowAddedToCartModal();

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

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      <p className="text-sm font-medium text-muted-foreground">
        Showing catalog ·{' '}
        <span className="tabular-nums text-foreground">{total}</span> product{total === 1 ? '' : 's'}
      </p>
      <ProductGrid
        products={initialProducts}
        onAddToCart={handleAddToCart}
        addingProductId={addingProductId}
      />
      {(prevPage || nextPage) && (
        <nav
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 pt-4 sm:gap-x-4"
          aria-label="Catalog pagination"
        >
          {prevPage && (
            <Button variant="outline" onClick={() => setPage(prevPage)}>
              Previous
            </Button>
          )}
          <span className="min-w-[10rem] text-center text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {nextPage && (
            <Button variant="outline" onClick={() => setPage(nextPage)}>
              Next
            </Button>
          )}
        </nav>
      )}
    </div>
  );
}
