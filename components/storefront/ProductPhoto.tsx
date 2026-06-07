'use client';

import { getProductImageUrl } from '@/lib/imageUrl';

export interface ProductPhotoProps {
  /** Relative API path, e.g. products/images/file.jpg — same as admin gallery `img.path` */
  path: string | null | undefined;
  alt: string;
  /** When true, image fills a `relative` parent (object-cover), like admin thumbnails */
  fill?: boolean;
  className?: string;
  priority?: boolean;
  /** Shown on the gradient placeholder when there is no image */
  productName?: string | null;
}

/**
 * Storefront product image: native <img> + same URL rules as {@link getProductImageUrl}.

 * Avoids Next/Image edge cases with rewrites and matches “dashboard shows it” behavior.

 */

function PlaceholderFill({
  title,
  alt,
  className,
}: {
  title?: string | null;
  alt: string;
  className: string;
}) {
  const label = (title ?? '').trim();
  const initial = label ? label.charAt(0).toUpperCase() : '?';
  return (
    <div
      role="img"
      aria-label={alt}
      className={`absolute inset-0 flex flex-col overflow-hidden ${className}`}
    >
      <div
        className="pattern-hero absolute inset-0 opacity-[0.45] dark:opacity-[0.35]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/[0.12] via-muted/80 to-violet-500/[0.08] dark:from-primary/[0.18] dark:via-muted dark:to-violet-500/[0.12]"
        aria-hidden
      />
      <div className="absolute -right-1/4 -top-1/4 h-[70%] w-[70%] rounded-full bg-primary/[0.07] blur-3xl dark:bg-primary/[0.12]" aria-hidden />
      <div className="absolute -bottom-1/4 -left-1/4 h-[55%] w-[55%] rounded-full bg-violet-500/[0.06] blur-3xl dark:bg-violet-500/[0.1]" aria-hidden />
      <div className="relative z-[1] flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-8 pt-10" aria-hidden>
        <span className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-foreground/[0.08] bg-background/55 text-3xl font-bold tracking-tight text-foreground shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-black/25">
          {initial}
        </span>
        {label ? (
          <p className="max-w-[90%] text-center text-sm font-medium leading-snug text-muted-foreground text-balance">
            {label}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ProductPhoto({
  path,
  alt,
  fill,
  className = '',
  priority,
  productName,
}: ProductPhotoProps) {
  const src = getProductImageUrl(path);
  if (!src) {
    if (fill) {
      return <PlaceholderFill title={productName} alt={alt} className={className} />;
    }
    return null;
  }

  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 z-0 h-full w-full object-cover ${className}`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}
