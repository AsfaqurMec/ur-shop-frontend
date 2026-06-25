'use client';

import { useEffect } from 'react';

interface ProductViewTrackerProps {
  productId: string | number;
  productName: string;
  price: number;
}

export default function ProductViewTracker({
  productId,
  productName,
  price,
}: ProductViewTrackerProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'ViewContent', {
        content_ids: [String(productId)],
        content_name: productName,
        content_type: 'product',
        value: Number(price),
        currency: 'BDT',
      });
    }
  }, [productId, productName, price]);

  return null;
}