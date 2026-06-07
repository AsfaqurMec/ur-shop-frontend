'use client';

import { useState } from 'react';
import Link from 'next/link';
import { addToCart } from '@/lib/api/cart';
import type { Product } from '@/types/product';
import type { ProductReviewPublic } from '@/types/review';
import { FeaturedProducts } from '@/components/storefront';
import { useShowAddedToCartModal } from '@/components/storefront/AddedToCartModalProvider';
import { Container } from '@/components/ui';
import { Button } from '@/components/ui';
import { getPrimaryProductImagePath, getProductImageUrl } from '@/lib/imageUrl';
import { SITE_HERO_SUBTITLE } from '@/lib/seo/siteCopy';
import { SocialSpeedDial } from '@/components/storefront/SocialSpeedDial';
import type { SocialLink } from '@/lib/api/storeSettings';

interface HomeClientProps {
  featuredProducts: Product[];
  reviews: Array<ProductReviewPublic & { product_name?: string }>;
  socialLinks: SocialLink[];
}

const fallbackSlides = [
  {
    title: 'Software, templates, and licenses delivered instantly',
    subtitle: SITE_HERO_SUBTITLE,
    imageUrl: '/og-default.png',
  },
  {
    title: 'Digital tools for creators, students, and teams',
    subtitle: 'Browse curated products, pay securely, and keep every order in your account.',
    imageUrl: '/og-default.png',
  },
];

const fallbackReviews = [
  {
    id: -1,
    rating: 5,
    title: 'Fast delivery',
    body: 'The checkout was clean and the product was available right away.',
    product_name: 'Digital product',
    is_verified_purchase: true,
  },
  {
    id: -2,
    rating: 5,
    title: 'Professional support',
    body: 'Questions were handled quickly and the order details were easy to track.',
    product_name: 'License order',
    is_verified_purchase: true,
  },
  {
    id: -3,
    rating: 4,
    title: 'Smooth experience',
    body: 'Simple store, clear product pages, and no confusion after purchase.',
    product_name: 'Template bundle',
    is_verified_purchase: false,
  },
];

export function HomeClient({ featuredProducts, reviews, socialLinks }: HomeClientProps) {
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const showAddedToCart = useShowAddedToCartModal();

  const heroSlides = featuredProducts.slice(0, 4).map((product) => ({
    title: product.name,
    subtitle: product.description || SITE_HERO_SUBTITLE,
    imageUrl: getProductImageUrl(getPrimaryProductImagePath(product)) || '/og-default.png',
  }));
  const slides = heroSlides.length > 0 ? heroSlides : fallbackSlides;
  const slide = slides[activeSlide] ?? slides[0];
  const reviewItems = reviews.length > 0 ? reviews : fallbackReviews;

  const handleAddToCart = async (product: Product) => {
    setAddingProductId(product.id);
    try {
      await addToCart(product.id, 1);
      window.dispatchEvent(new Event('cart:changed'));
      showAddedToCart({
        name: product.name,
        imageUrl: getProductImageUrl(getPrimaryProductImagePath(product)),
      });
    } finally {
      setAddingProductId(null);
    }
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-background" aria-hidden />
        <img src={slide.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/35" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/35" aria-hidden />

        <Container size="lg" className="relative py-14 sm:py-20 md:py-24 lg:py-28">
          <div className="max-w-2xl">
            <p className="inline-flex items-center rounded-full border border-primary/20 bg-background/80 px-4 py-1.5 text-[0.65rem] font-semibold uppercase text-primary shadow-sm backdrop-blur-sm sm:text-xs">
              Digital commerce, simplified
            </p>
            <h1 className="mt-6 text-balance text-3xl font-bold tracking-tight text-foreground sm:mt-7 sm:text-4xl md:text-5xl md:leading-[1.12]">
              {slide.title}
            </h1>
            {slide.subtitle ? (
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:mt-7 sm:text-lg">
                {slide.subtitle}
              </p>
            ) : null}
            <div className="mt-9 flex w-full flex-col items-stretch gap-3 sm:mt-11 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link href="/shop" className="w-full sm:w-auto">
                <Button size="lg" className="w-full min-w-0 shadow-md shadow-primary/10 sm:min-w-[10rem]">
                  Browse shop
                </Button>
              </Link>
              <Link href="/search" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full min-w-0 border-border/80 bg-card/70 backdrop-blur-sm sm:min-w-[10rem]">
                  Search products
                </Button>
              </Link>
            </div>
            <ul className="mt-10 flex list-none flex-wrap items-center gap-2 sm:gap-3">
              {['Secure checkout', 'Instant delivery', 'Account & support'].map((label) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm sm:text-sm"
                >
                  <span className="h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
            <p className="mt-10 text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>{' '}
              <span className="text-border">.</span>{' '}
              <Link href="/dashboard" className="font-medium text-foreground hover:text-primary hover:underline">
                Open dashboard
              </Link>
            </p>
          </div>

          {slides.length > 1 ? (
            <div className="mt-10 flex items-center gap-2">
              {slides.map((item, index) => (
                <button
                  key={`${item.title}-${index}`}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show banner ${index + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeSlide ? 'w-9 bg-primary' : 'w-2.5 bg-foreground/25 hover:bg-foreground/40'
                  }`}
                />
              ))}
            </div>
          ) : null}
        </Container>
      </section>

      {featuredProducts.length > 0 && (
        <Container size="lg" className="pb-20 pt-4">
          <FeaturedProducts
            products={featuredProducts}
            onAddToCart={handleAddToCart}
            addingProductId={addingProductId}
          />
        </Container>
      )}

      <section className="border-y border-border/50 bg-muted/25 py-14 md:py-18">
        <Container size="lg">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-primary">Customer reviews</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Trusted by digital buyers</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Real feedback from orders, product pages, and support conversations.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {reviewItems.slice(0, 3).map((review) => (
              <article key={review.id} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex text-sm font-semibold text-primary" aria-label={`${review.rating} star rating`}>
                    {'*'.repeat(Math.max(1, Math.min(5, review.rating)))}
                  </div>
                  {review.is_verified_purchase ? (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase text-primary">
                      Verified
                    </span>
                  ) : null}
                </div>
                <h3 className="text-base font-semibold text-foreground">{review.title || 'Great experience'}</h3>
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">
                  {review.body || 'The product and checkout experience met expectations.'}
                </p>
                <p className="mt-5 border-t border-border/70 pt-3 text-xs font-medium text-muted-foreground">
                  {review.product_name || 'Store customer'}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <SocialSpeedDial links={socialLinks} />
    </>
  );
}
