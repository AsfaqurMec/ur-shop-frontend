'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchProducts } from '@/lib/api/products';
import { addSimpleProductToCart } from '@/lib/storefront/cartActions';
import type { Product } from '@/types/product';
import type { Category } from '@/types/category';
import { ProductGrid } from '@/components/storefront';
import { Button } from '@/components/ui';
import { useShowAddedToCartModal } from '@/components/storefront/AddedToCartModalProvider';
import { getPrimaryProductImagePath, getProductImageUrl } from '@/lib/imageUrl';

interface ShopClientProps {
  initialProducts: Product[];
  total: number;
  categories: Category[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
}

export function ShopClient({ initialProducts, total, search, minPrice, maxPrice, onSale, sort }: ShopClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length < total);
  const nextPage = useRef(2);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const showAddedToCart = useShowAddedToCartModal();

  useEffect(() => {
    setProducts(initialProducts);
    setHasMore(initialProducts.length < total);
    nextPage.current = 2;
  }, [initialProducts, total, search, minPrice, maxPrice, onSale, sort]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const result = await fetchProducts({ page: nextPage.current, limit: 8, search, min_price: minPrice, max_price: maxPrice, on_sale: onSale, sort, is_active: true });
      setProducts((current) => {
        const seen = new Set(current.map((product) => product.id));
        return [...current, ...result.products.filter((product) => !seen.has(product.id))];
      });
      nextPage.current += 1;
      setHasMore(nextPage.current <= result.totalPages);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadMore();
    }, { rootMargin: '360px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, products.length]);

  const handleAddToCart = async (product: Product) => {
    setAddingProductId(product.id);
    try {
      await addSimpleProductToCart(product);
      if (window.fbq) window.fbq('track', 'AddToCart', { content_ids: [String(product.id)], content_name: product.name, content_type: 'product', value: Number(product.price), currency: 'BDT' });
      showAddedToCart({ name: product.name, imageUrl: getProductImageUrl(getPrimaryProductImagePath(product)) });
    } finally {
      setAddingProductId(null);
    }
  };

  return <div className="space-y-6"><p className="text-sm font-medium text-muted-foreground">Showing <span className="tabular-nums text-foreground">{products.length}</span> of <span className="tabular-nums text-foreground">{total}</span> products</p><ProductGrid products={products} onAddToCart={handleAddToCart} addingProductId={addingProductId} /><div ref={sentinelRef} className="flex min-h-12 justify-center" aria-live="polite">{loadingMore ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading more products" /> : hasMore ? <Button type="button" variant="outline" size="sm" onClick={() => void loadMore()}>Load more products</Button> : products.length > 0 ? <span className="text-sm text-muted-foreground">You have reached the end.</span> : null}</div></div>;
}
