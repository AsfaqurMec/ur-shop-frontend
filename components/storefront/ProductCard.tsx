'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types/product';
import { getPrimaryProductImageAlt, getPrimaryProductImagePath } from '@/lib/imageUrl';
import { Button } from '@/components/ui';
import { ProductTypeBadge } from './ProductTypeBadge';
import { ProductPhoto } from './ProductPhoto';
import { splitCurrencyDisplay } from '@/lib/utils/format';

export interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  addToCartLoading?: boolean;
}

export function ProductCard({ product, onAddToCart, addToCartLoading }: ProductCardProps) {
  const router = useRouter();
  const needsPdp = product.needs_pdp_config === true;
  const primaryPath = getPrimaryProductImagePath(product);
  const imageAlt = getPrimaryProductImageAlt(product, primaryPath);
  const hasComparePrice = product.compare_at_price != null && product.compare_at_price > product.price;
  const priceParts = splitCurrencyDisplay(product.price);
  const compareParts = hasComparePrice ? splitCurrencyDisplay(product.compare_at_price!) : null;
  const savePercent =
    hasComparePrice && product.compare_at_price! > 0
      ? Math.max(0, Math.round((1 - product.price / product.compare_at_price!) * 100))
      : 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-md border border-border/80 bg-card shadow-card transition-all duration-200 hover:border-primary/20 hover:shadow-card-hover">
      <Link
        href={`/products/${product.slug}`}
        className="relative isolate block aspect-square overflow-hidden bg-muted"
      >
        <ProductPhoto
          path={primaryPath}
          alt={imageAlt}
          fill
          className="transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-2">
          {/* <ProductTypeBadge type={product.product_type} /> */}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/products/${product.slug}`} className="block">
          <h2 className="line-clamp-2 min-h-[2.5rem] text-sm md:text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h2>
        </Link>
        <div className="mt-2 space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="inline-flex items-baseline gap-0.5 text-lg font-bold tracking-tight text-foreground">
              <span className="tabular-nums text-base md:text-2xl font-semibold leading-none">{priceParts.amount}</span>
              <span className="sr-only">BDT</span>
              <span className="pl-[2px] text-base md:text-2xl font-semibold leading-none text-primary" aria-hidden>
                {priceParts.symbol}
              </span>
            </span>
            {compareParts && (
              <span
                className="inline-flex items-baseline gap-0.5 text-xs font-medium text-muted-foreground/75 line-through decoration-muted-foreground/60 [text-decoration-thickness:1px]"
                aria-label={`Was ${compareParts.symbol}${compareParts.amount}`}
              >
                <span className="text-xs font-normal leading-none opacity-80" aria-hidden>
                  {compareParts.symbol}
                </span>
                <span className="tabular-nums">{compareParts.amount}</span>
              </span>
            )}
          </div>
          {savePercent > 0 ? (
            <p className="text-[11px] font-semibold leading-tight text-emerald-600 dark:text-emerald-400/90">
              Save {savePercent}%
            </p>
          ) : null}
        </div>
        <div className="mt-auto hidden flex-col gap-2 pt-4 sm:flex sm:flex-row sm:items-stretch">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            className="sm:flex-1"
            onClick={(e) => {
              e.preventDefault();
              if (needsPdp) {
                router.push(`/products/${product.slug}`);
                return;
              }
              onAddToCart?.(product);
            }}
            isLoading={addToCartLoading}
          >
            Add to cart
          </Button>
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex h-8 md:h-9 w-full shrink-0 items-center justify-center rounded-lg border border-input bg-card px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
