'use client';

import { useId, useState } from 'react';

export type ProductDetailInfoTab = 'details' | 'features' | 'reviews';

export interface ProductDetailInfoTabsProps {
  details: React.ReactNode;
  features: React.ReactNode;
  reviews: React.ReactNode;
  defaultTab?: ProductDetailInfoTab;
}

export function ProductDetailInfoTabs({
  details,
  features,
  reviews,
  defaultTab = 'details',
}: ProductDetailInfoTabsProps) {
  const baseId = useId();
  const detailsId = `${baseId}-details-panel`;
  const featuresId = `${baseId}-features-panel`;
  const reviewsId = `${baseId}-reviews-panel`;
  const [tab, setTab] = useState<ProductDetailInfoTab>(defaultTab);

  const tabBtn =
    'relative rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  return (
    <div>
      <div
        role="tablist"
        aria-label="Product information"
        className="flex gap-0 border-b border-border/60"
      >
        <button
          type="button"
          role="tab"
          id={`${baseId}-details-tab`}
          aria-controls={detailsId}
          aria-selected={tab === 'details'}
          tabIndex={tab === 'details' ? 0 : -1}
          className={`${tabBtn} ${
            tab === 'details'
              ? 'text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setTab('details')}
        >
          Details
        </button>
        <button
          type="button"
          role="tab"
          id={`${baseId}-features-tab`}
          aria-controls={featuresId}
          aria-selected={tab === 'features'}
          tabIndex={tab === 'features' ? 0 : -1}
          className={`${tabBtn} ${
            tab === 'features'
              ? 'text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setTab('features')}
        >
          Features
        </button>
        <button
          type="button"
          role="tab"
          id={`${baseId}-reviews-tab`}
          aria-controls={reviewsId}
          aria-selected={tab === 'reviews'}
          tabIndex={tab === 'reviews' ? 0 : -1}
          className={`${tabBtn} ${
            tab === 'reviews'
              ? 'text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setTab('reviews')}
        >
          Reviews
        </button>
      </div>

      <div
        id={detailsId}
        role="tabpanel"
        aria-labelledby={`${baseId}-details-tab`}
        hidden={tab !== 'details'}
        className="pt-5"
      >
        {details}
      </div>
      <div
        id={featuresId}
        role="tabpanel"
        aria-labelledby={`${baseId}-features-tab`}
        hidden={tab !== 'features'}
        className="pt-5"
      >
        {features}
      </div>
      <div
        id={reviewsId}
        role="tabpanel"
        aria-labelledby={`${baseId}-reviews-tab`}
        hidden={tab !== 'reviews'}
        className="pt-5"
      >
        {reviews}
      </div>
    </div>
  );
}
