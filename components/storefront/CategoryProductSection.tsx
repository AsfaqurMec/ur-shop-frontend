'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Category } from '@/types/category';
import type { Product } from '@/types/product';
import { getCategoryBannerImageUrl } from '@/lib/imageUrl';
import { ProductGrid } from './ProductGrid';
import { ProductCard } from './ProductCard';
import { HorizontalSlider } from './HorizontalSlider';

export interface CategoryProductSectionProps {
  category: Category;
  products: Product[];
  onAddToCart?: (product: Product) => void;
  addingProductId?: number | null;
}

export function CategoryProductSection({
  category,
  products,
  onAddToCart,
  addingProductId,
}: CategoryProductSectionProps) {
  if (products.length === 0) return null;

  const displayProducts = products.slice(0, 4);
  const bannerUrl = getCategoryBannerImageUrl(category.banner_image);

  return (
    <section className="py-8 md:py-12" aria-labelledby={`category-products-${category.id}`}>
      {bannerUrl ? (
        <Link
          href={`/shop/category/${category.slug}`}
          className="group relative mb-8 block overflow-hidden rounded-2xl border border-border/60 shadow-md"
        >
          <img
            src={bannerUrl}
            alt={category.name}
            className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.02] md:h-56 lg:h-64"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
          <div className="absolute inset-0 flex items-end justify-between gap-4 p-6 md:p-8">
            <div className="max-w-2xl text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/75">Collection</p>
              <h2
                id={`category-products-${category.id}`}
                className="mt-1 text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl"
              >
                {category.name}
              </h2>
              {category.description && (
                <p className="mt-2 line-clamp-2 max-w-xl text-sm text-white/85 md:text-base">
                  {category.description}
                </p>
              )}
            </div>
            <span className="hidden shrink-0 items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition group-hover:bg-white group-hover:text-foreground sm:inline-flex">
              View all
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      ) : (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Featured</p>
            <h2
              id={`category-products-${category.id}`}
              className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl"
            >
              {category.name}
            </h2>
            {category.description && (
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">{category.description}</p>
            )}
          </div>
          <Link
            href={`/shop/category/${category.slug}`}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-input bg-card px-5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
          >
            View all
          </Link>
        </div>
      )}

      {!bannerUrl ? null : (
        <div className="mb-6 flex justify-end sm:hidden">
          <Link
            href={`/shop/category/${category.slug}`}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-input bg-card px-5 text-sm font-semibold text-foreground shadow-sm"
          >
            View all
          </Link>
        </div>
      )}

      <div className="hidden lg:block">
        <ProductGrid
          products={displayProducts}
          onAddToCart={onAddToCart}
          addingProductId={addingProductId}
        />
      </div>

      <div className="lg:hidden">
        <HorizontalSlider visibleSm={1} visibleLg={1} autoPlayMs={4000}>
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              addToCartLoading={addingProductId === product.id}
            />
          ))}
        </HorizontalSlider>
      </div>
    </section>
  );
}
