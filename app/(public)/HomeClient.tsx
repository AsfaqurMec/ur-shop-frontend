'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { addToCart } from '@/lib/api/cart';
import type { Product } from '@/types/product';
import type { ProductReviewPublic } from '@/types/review';
import { FeaturedProducts } from '@/components/storefront';
import { useShowAddedToCartModal } from '@/components/storefront/AddedToCartModalProvider';
import { Container } from '@/components/ui';
import { Button } from '@/components/ui';
import { getPrimaryProductImagePath, getProductImageUrl } from '@/lib/imageUrl';
import { getBannerImageUrl } from '@/lib/imageUrl';
import { SITE_HERO_SUBTITLE } from '@/lib/seo/siteCopy';
import { SocialSpeedDial } from '@/components/storefront/SocialSpeedDial';
import type { SocialLink } from '@/lib/api/storeSettings';
import type { BannerItem } from '@/lib/api/banners';
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HomeClientProps {
  featuredProducts: Product[];
  banners: BannerItem[];
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
    product_name: 'Panjabi Collection',
    is_verified_purchase: true,
  },
  {
    id: -2,
    rating: 5,
    title: 'Professional support',
    body: 'Questions were handled quickly and the order details were easy to track.',
    product_name: 'Panjabi Collection',
    is_verified_purchase: true,
  },
  {
    id: -3,
    rating: 4,
    title: 'Smooth experience',
    body: 'Simple store, clear product pages, and no confusion after purchase.',
    product_name: 'T-shirt Collection',
    is_verified_purchase: false,
  },
];

export function HomeClient({ featuredProducts, banners, reviews, socialLinks }: HomeClientProps) {
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const showAddedToCart = useShowAddedToCartModal();

  const bannerSlides = banners.map((banner) => ({
    title: banner.title || '',
    subtitle: banner.subtitle || '',
    imageUrl: getBannerImageUrl(banner.background_image) || '/og-default.png',
    buttons: banner.buttons,
  }));
  const heroSlides = featuredProducts.slice(0, 4).map((product) => ({
    title: product.name,
    subtitle: product.description || SITE_HERO_SUBTITLE,
    imageUrl: getProductImageUrl(getPrimaryProductImagePath(product)) || '/og-default.png',
    buttons: [],
  }));
  const slides = bannerSlides.length > 0 ? bannerSlides : heroSlides.length > 0 ? heroSlides : fallbackSlides.map((s) => ({ ...s, buttons: [] }));
  // const slide = slides[activeSlide] ?? slides[0];
  // const reviewItems = reviews.length > 0 ? reviews : fallbackReviews;

  const slide = slides[activeSlide] ?? slides[0];
const reviewItems = reviews.length > 0 ? reviews : fallbackReviews;

useEffect(() => {
  if (slides.length <= 1) return;

  const interval = setInterval(() => {
    setActiveSlide((prev) =>
      prev === slides.length - 1 ? 0 : prev + 1
    );
  }, 4000);

  return () => clearInterval(interval);
}, [slides.length]);

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
    <section className="relative overflow-hidden border-b border-border/50 h-[40vh] md:h-[90vh]">
  <div className="absolute inset-0 bg-background" aria-hidden />
  {/* <img
    src={slide.imageUrl}
    alt=""
    className="absolute inset-0 h-full w-full opacity-100"
  /> */}
  <img
  key={activeSlide}
  src={slide.imageUrl}
  alt=""
  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
/>

  {/* Left Arrow */}
  {slides.length > 1 && (
    <button
      type="button"
      onClick={() =>
        setActiveSlide((prev) =>
          prev === 0 ? slides.length - 1 : prev - 1
        )
      }
      className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/80 p-3 shadow-lg backdrop-blur transition hover:bg-background"
      aria-label="Previous slide"
    >
      <ChevronLeft className="h-6 w-6" />
    </button>
  )}

  {/* Right Arrow */}
  {slides.length > 1 && (
    <button
      type="button"
      onClick={() =>
        setActiveSlide((prev) =>
          prev === slides.length - 1 ? 0 : prev + 1
        )
      }
      className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/80 p-3 shadow-lg backdrop-blur transition hover:bg-background"
      aria-label="Next slide"
    >
      <ChevronRight className="h-6 w-6" />
    </button>
  )}

  <Container
    size="lg"
    className="relative py-14 sm:py-20 md:py-24 lg:py-28"
  >
    <div className="max-w-2xl">
      <h1 className="mt-6 text-balance text-3xl font-bold tracking-tight text-foreground sm:mt-7 sm:text-4xl md:text-5xl md:leading-[1.12]">
        {slide.title}
      </h1>

      {slide.subtitle ? (
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:mt-7 sm:text-lg">
          {slide.subtitle}
        </p>
      ) : null}

      {slide.buttons.length > 0 ? (
        <div className="mt-9 flex w-full flex-col items-stretch gap-3 sm:mt-11 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          {slide.buttons.map((button, index) => (
            <Link
              key={`${button.title}-${index}`}
              href={button.route}
              className="w-full sm:w-auto"
            >
              <Button
                variant={index === 0 ? "primary" : "outline"}
                size="lg"
                className="w-full min-w-0 shadow-md shadow-primary/10 sm:min-w-[10rem]"
              >
                {button.title}
              </Button>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-9 flex w-full flex-col items-stretch gap-3 sm:mt-11 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4" />
      )}
    </div>
  </Container>

  {/* Pagination Dots - Bottom Center */}
  {slides.length > 1 && (
    <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
      {slides.map((item, index) => (
        <button
          key={`${item.title}-${index}`}
          type="button"
          onClick={() => setActiveSlide(index)}
          aria-label={`Show banner ${index + 1}`}
          className={`h-2.5 rounded-full transition-all duration-300 ${
            index === activeSlide
              ? "w-8 bg-primary"
              : "w-2.5 bg-white/50 hover:bg-white/80"
          }`}
        />
      ))}
    </div>
  )}
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
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Trusted by our customers</h2>
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
