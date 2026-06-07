'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getAuthToken } from '@/lib/api/client';
import { fetchProductReviews, submitProductReview } from '@/lib/api/reviews';
import type { ProductReviewPublic } from '@/types/review';
import { Button } from '@/components/ui';
import { Container } from '@/components/ui';
import { toast } from 'sonner';

function Stars({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const starClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} className={starClass} fill={n <= rating ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={n <= rating ? 0 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </span>
  );
}

export interface ProductReviewsSectionProps {
  productId: number;
  productSlug: string;
  initialReviews: ProductReviewPublic[];
  initialTotal: number;
  /** Omit outer section/Container when nested (e.g. product page tabs). */
  embedded?: boolean;
}

export function ProductReviewsSection({
  productId,
  productSlug,
  initialReviews,
  initialTotal,
  embedded = false,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<ProductReviewPublic[]>(initialReviews);
  const [total, setTotal] = useState(initialTotal);
  const [loadingList, setLoadingList] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getAuthToken());
  }, []);

  const average = useMemo(() => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const refreshList = async () => {
    setLoadingList(true);
    try {
      const r = await fetchProductReviews(productId, { limit: 50 });
      setReviews(r.reviews);
      setTotal(r.total);
    } finally {
      setLoadingList(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      await submitProductReview(productId, {
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
      });
      setFormSuccess('Thanks! Your review is live on this page.');
      toast.success('Review submitted');
      setTitle('');
      setBody('');
      await refreshList();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not submit review';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const loginHref = `/login?redirect=${encodeURIComponent(`/products/${productSlug}`)}`;

  const summaryBlock = (
    <>
      <h2
        className={
          embedded
            ? 'sr-only'
            : 'text-2xl font-bold tracking-tight text-foreground'
        }
      >
        Customer reviews
      </h2>
      <div
        className={
          embedded
            ? 'flex flex-wrap items-center gap-3 text-sm text-muted-foreground'
            : 'mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground'
        }
      >
          {total > 0 && average != null && (
            <>
              <Stars rating={Math.round(average)} />
              <span className="tabular-nums">
                {average} out of 5 · {total} {total === 1 ? 'review' : 'reviews'}
              </span>
            </>
          )}
          {total === 0 && <span>No reviews yet. Be the first to share your experience.</span>}
      </div>
    </>
  );

  const inner = (
    <>
      {summaryBlock}

        <div className={embedded ? 'mt-6 rounded-xl border border-border/80 bg-background p-6 shadow-sm' : 'mt-8 rounded-xl border border-border/80 bg-background p-6 shadow-sm'}>
          <h3 className="text-lg font-semibold text-foreground">Write a review</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Only verified purchasers (completed orders including this product) can submit a review. One review per product.
          </p>
          {!loggedIn ? (
            <p className="mt-4 text-sm">
              <Link href={loginHref} className="font-medium text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>{' '}
              to write a review.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <span className="text-sm font-medium text-foreground">Rating</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        rating === n
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                      }`}
                      aria-pressed={rating === n}
                    >
                      {n} star{n > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="review-title" className="text-sm font-medium text-foreground">
                  Title <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="review-title"
                  type="text"
                  maxLength={255}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 flex h-10 w-full max-w-lg rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Short summary"
                />
              </div>
              <div>
                <label htmlFor="review-body" className="text-sm font-medium text-foreground">
                  Review <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <textarea
                  id="review-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="mt-1 flex w-full max-w-lg rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="What did you think?"
                />
              </div>
              {formError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
                  {formSuccess}
                </div>
              )}
              <Button type="submit" disabled={submitting} isLoading={submitting}>
                Submit review
              </Button>
            </form>
          )}
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-foreground">Published reviews</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => void refreshList()} disabled={loadingList}>
              {loadingList ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
          {reviews.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No published reviews yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border/80 bg-background">
              {reviews.map((r) => (
                <li key={r.id} className="px-4 py-4 first:rounded-t-xl last:rounded-b-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars rating={r.rating} size="sm" />
                    {r.is_verified_purchase && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Verified purchase
                      </span>
                    )}
                    <time className="text-xs text-muted-foreground" dateTime={r.created_at}>
                      {new Date(r.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                  {r.title && <p className="mt-2 font-medium text-foreground">{r.title}</p>}
                  {r.body && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.body}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
    </>
  );

  if (embedded) {
    return <div className="space-y-8">{inner}</div>;
  }

  return (
    <section className="border-t border-border/80 bg-muted/20">
      <Container size="lg" className="py-10 md:py-14">
        {inner}
      </Container>
    </section>
  );
}
