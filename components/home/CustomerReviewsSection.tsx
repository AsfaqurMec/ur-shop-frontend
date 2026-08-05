import Link from 'next/link';
import { ExternalLink, StarIcon } from 'lucide-react';
import { Container } from '@/components/ui';
import { fallbackReviews } from './constants';
import { SectionHeading } from './SectionHeading';
import type { ReviewItem } from './types';
import { HorizontalSlider } from '@/components/storefront/HorizontalSlider';
import { getReviewImageUrl } from '@/lib/imageUrl';

interface CustomerReviewsSectionProps {
  reviews: ReviewItem[];
}

export function CustomerReviewsSection({ reviews }: CustomerReviewsSectionProps) {
  const reviewItems = reviews.length > 0 ? reviews : fallbackReviews;

  return (
    <section className="py-16 md:py-20">
      <Container size="lg" >
        <SectionHeading
          eyebrow="Testimonials"
          title="What Our Customers Say"
          description="Real feedback from satisfied customers who love our products"
        />
        <HorizontalSlider
          visibleSm={1}
          visibleLg={3}
          mobileSlidePercent={72}
          autoPlayMs={2000}
          hideNavOnMobile
          className="mt-8"
        >
          {reviewItems.map((review) => (
            <article
              key={review.id}
              className="flex flex-col items-center overflow-hidden rounded-xl border border-border bg-card pb-6 text-center shadow-sm transition-all hover:shadow-lg"
            >
              {getReviewImageUrl(review.image_path) && (
                <img
                  src={getReviewImageUrl(review.image_path) ?? undefined}
                  alt={`Photo shared by ${review.reviewer_name || 'a customer'}`}
                  className="mb-4 h-80 w-full rounded-t-xl border border-border object-cover"
                />
              )}

              <div className="mb-3 flex items-center justify-center gap-3">
                <div className="flex text-primary" aria-label={`${review.rating} star rating`}>
                  {Array.from({ length: Math.max(1, Math.min(5, review.rating)) }, (_, index) => (
                    <StarIcon key={index} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                {review.is_verified_purchase && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Verified</span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-foreground">
                {review.title || 'Great experience'}
              </h3>

              <p className="mt-3 line-clamp-3 border-b border-border/50 px-3 pb-3 text-sm leading-relaxed text-muted-foreground">
                {review.body || 'The product and checkout experience met expectations.'}
              </p>

              {review.reviewer_name && (
                <p className="mt-3 text-sm font-medium text-foreground">— {review.reviewer_name}</p>
              )}

              <Link
                href={`/products/${review.product_slug}`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {review.product_name}
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </Link>
            </article>
          ))}
        </HorizontalSlider>
      </Container>
    </section>
  );
}
