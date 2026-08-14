'use client';

import { useState } from 'react';
import { addSimpleProductToCart } from '@/lib/storefront/cartActions';
import { getPrimaryProductImagePath, getProductImageUrl } from '@/lib/imageUrl';
import { useShowAddedToCartModal } from '@/components/storefront/AddedToCartModalProvider';
import type { Product } from '@/types/product';

export function useHomeAddToCart() {
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const showAddedToCart = useShowAddedToCartModal();

  const handleAddToCart = async (product: Product) => {
    setAddingProductId(product.id);
    try {
      await addSimpleProductToCart(product);

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'AddToCart', {
          content_ids: [String(product.id)],
          content_name: product.name,
          content_type: 'product',
          value: Number(product.price ?? 0),
          currency: 'BDT',
        });
      }

      window.dispatchEvent(new Event('cart:changed'));
      showAddedToCart({
        name: product.name,
        imageUrl: getProductImageUrl(getPrimaryProductImagePath(product)),
      });
    } finally {
      setAddingProductId(null);
    }
  };

  return { addingProductId, handleAddToCart };
}
