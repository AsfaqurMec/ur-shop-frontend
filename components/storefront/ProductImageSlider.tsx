'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/types/product';
import { getPrimaryProductImageAlt, getPrimaryProductImagePath } from '@/lib/imageUrl';
import { ProductPhoto } from './ProductPhoto';

export function ProductImageSlider({ product }: { product: Product }) {
  const images = useMemo(() => {
    const rows = [...(product.images ?? [])].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    if (rows.length > 0) return rows;
    const primary = getPrimaryProductImagePath(product);
    return primary ? [{ id: 0, path: primary, alt_text: product.name, sort_order: 0 }] : [];
  }, [product]);
  const [index, setIndex] = useState(0);
  const active = images[index] ?? images[0];
  const alt = active?.alt_text?.trim() || getPrimaryProductImageAlt(product, active?.path) || product.name;
  const hasMany = images.length > 1;

  const go = (direction: -1 | 1) => {
    setIndex((current) => (current + direction + images.length) % images.length);
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_24px_48px_-12px_hsl(var(--foreground)/0.12)] ring-1 ring-foreground/[0.04] dark:shadow-[0_28px_56px_-16px_hsl(0_0%_0%/0.45)] dark:ring-white/[0.06]">
        <ProductPhoto
          path={active?.path}
          alt={alt}
          fill
          priority
          productName={product.name}
          className="object-cover"
        />
        {hasMany ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-background/80 text-foreground shadow-sm backdrop-blur transition hover:bg-background"
            >
              <span aria-hidden>&lt;</span>
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-background/80 text-foreground shadow-sm backdrop-blur transition hover:bg-background"
            >
              <span aria-hidden>&gt;</span>
            </button>
          </>
        ) : null}
      </div>
      {hasMany ? (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((image, thumbIndex) => (
            <button
              key={`${image.id}-${image.path}`}
              type="button"
              onClick={() => setIndex(thumbIndex)}
              aria-label={`Show image ${thumbIndex + 1}`}
              className={`relative aspect-square overflow-hidden rounded-lg border bg-card transition ${
                thumbIndex === index ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
              }`}
            >
              <ProductPhoto
                path={image.path}
                alt={image.alt_text?.trim() || product.name}
                fill
                productName={product.name}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
