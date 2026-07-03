import Link from 'next/link';
import { ExternalLink, StarIcon } from 'lucide-react';
import { Container } from '@/components/ui';
import { fallbackReviews } from './constants';
import { SectionHeading } from './SectionHeading';
import type { ReviewItem } from './types';

interface CustomerReviewsSectionProps {
  reviews: ReviewItem[];
}

export function CustomerReviewsSection({ reviews }: CustomerReviewsSectionProps) {
  const reviewItems = reviews.length > 0 ? reviews : fallbackReviews;

  return (
    <section className="py-16 md:py-20">
      <Container size="lg">
        <SectionHeading
          eyebrow="Testimonials"
          title="What Our Customers Say"
          description="Real feedback from satisfied customers who love our products"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {reviewItems.slice(0, 3).map((review) => (
            <article key={review.id} className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex text-primary" aria-label={`${review.rating} star rating`}>
                  {Array.from({ length: Math.max(1, Math.min(5, review.rating)) }, (_, i) => (
                    <StarIcon key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                {review.is_verified_purchase && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Verified
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground">{review.title || 'Great experience'}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground border-b border-border/50 pb-3">
                {review.body || 'The product and checkout experience met expectations.'}
              </p>
              <Link
                href={`/products/${review.product_slug}`}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {review.product_name}
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
