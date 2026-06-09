import type { SocialLink } from '@/lib/api/storeSettings';
import type { Product } from '@/types/product';
import type { ProductReviewPublic } from '@/types/review';
import {
  getPrimaryProductImagePath,
  getProductImageUrl,
} from '@/lib/imageUrl';
import { ProductTypeBadge } from './ProductTypeBadge';
import { Container } from '@/components/ui';
import { ProductImageSlider } from './ProductImageSlider';
import { ProductPurchasePanel } from './ProductPurchasePanel';
import { ProductDetailInfoTabs } from './ProductDetailInfoTabs';
import { ProductReviewsSection } from './ProductReviewsSection';
import { RelatedProducts } from './RelatedProducts';
import { SocialSpeedDial } from './SocialSpeedDial';

export interface ProductDetailsProps {
  product: Product;
  /** Pre-select catalog variation (e.g. renew link from dashboard). */
  initialVariationId?: number;
  /** Show a short renew notice (paired with `?renew=1`). */
  renewHint?: boolean;
  /** Admin “floating social” links — shown below the price card on PDP. */
  socialLinks?: SocialLink[];
  /** Support number sourced from public store settings / email footer settings. */
  supportNumber?: string;
  /** When set, reviews are shown in a tab next to product details. */
  productReviews?: {
    productId: number;
    productSlug: string;
    initialReviews: ProductReviewPublic[];
    initialTotal: number;
  };
  relatedProducts?: Product[];
}

function ProductTypeDescription({ type }: { type: Product['product_type'] }) {
  const copy: Record<Product['product_type'], string> = {
    downloadable: 'Instant download after purchase. Access your files from the dashboard.',
    license_key: 'You will receive a license key after purchase.',
    subscription_manual: 'Subscription will be activated after manual processing.',
    digital_service: 'This service will be fulfilled after purchase.',
  };
  return (
    <p className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-r from-muted/50 to-muted/25 py-3.5 pl-4 pr-4 text-sm leading-relaxed text-muted-foreground shadow-sm dark:from-muted/40 dark:to-muted/15 dark:shadow-none">
      <span
        className="absolute inset-y-3 left-0 w-1 rounded-full bg-primary/80"
        aria-hidden
      />
      <span className="pl-2.5">{copy[type]}</span>
    </p>
  );
}

export function ProductDetails({
  product,
  initialVariationId,
  renewHint = false,
  socialLinks = [],
  supportNumber = '',
  productReviews,
  relatedProducts = [],
}: ProductDetailsProps) {
  const primaryPath = getPrimaryProductImagePath(product);
  const imageUrl = getProductImageUrl(primaryPath);
  const fullDescription = (product.full_description ?? product.fullDescription ?? '').trim();
  const features = (product.features ?? [])
    .filter((feature): feature is string => typeof feature === 'string')
    .map((feature) => feature.trim())
    .filter((feature) => feature.length > 0);
  const hasVariationPicker = (product.catalog_variations?.length ?? 0) > 0;
  const pageAttributes = (product.catalog_attributes ?? []).filter((a) => {
    if (!a.visible_on_page || a.values.length === 0) return false;
    if (hasVariationPicker && a.used_for_variations) return false;
    return true;
  });

  return (
    <>
    <Container size="lg" className="py-8 md:py-14">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-16">
        <div className="lg:sticky lg:top-24">
          <ProductImageSlider product={product} />
        </div>
        <div className="flex min-w-0 flex-col gap-0">
          <header className="space-y-4">
            {/* <ProductTypeBadge type={product.product_type} /> */}
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-[2.125rem] md:leading-[1.15]">
              {product.name}
            </h1>
            {product.description ? (
              <p className="max-w-prose text-base leading-relaxed text-muted-foreground md:text-[1.05rem] md:leading-relaxed">
                {product.description}
              </p>
            ) : null}
          </header>

          <div className="mt-8 space-y-3">
            {/* <ProductTypeDescription type={product.product_type} /> */}
            {product.license_available_count != null && product.product_type === 'license_key' && (
              <p className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">
                  {product.license_available_count}
                </span>{' '}
                license(s) in stock
              </p>
            )}
          </div>

          <div className="mt-5">
            <ProductPurchasePanel
              product={product}
              imageUrl={imageUrl}
              initialVariationId={initialVariationId}
              renewHint={renewHint}
              socialLinks={socialLinks}
              supportNumber={supportNumber}
              displayAttributes={pageAttributes}
            />
          </div>
        </div>
      </div>

      {productReviews ? (
        <div className="mt-10 border-t border-border/60 pt-10 md:mt-12 md:pt-12">
          <ProductDetailInfoTabs
            details={
              fullDescription ? (
                <div className="rounded-2xl border border-border/60 bg-card/40 p-5 shadow-sm backdrop-blur-[2px] dark:bg-card/30">
                  <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                    {fullDescription}
                  </p>
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-5 py-8 text-center text-sm text-muted-foreground">
                  No detailed description provided for this product.
                </p>
              )
            }
            features={
              features.length > 0 ? (
                <div className="rounded-2xl border border-border/60 bg-card/40 p-5 shadow-sm backdrop-blur-[2px] dark:bg-card/30">
                  <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-foreground/70">
                    {features.map((feature, index) => (
                      <li key={`${feature}-${index}`}>{feature}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-5 py-8 text-center text-sm text-muted-foreground">
                  No features listed for this product.
                </p>
              )
            }
            reviews={
              <ProductReviewsSection
                productId={productReviews.productId}
                productSlug={productReviews.productSlug}
                initialReviews={productReviews.initialReviews}
                initialTotal={productReviews.initialTotal}
                embedded
              />
            }
          />
        </div>
      ) : null}
    </Container>
    {relatedProducts.length > 0 ? (
      <section className="border-t border-border/60 bg-muted/25">
        <Container size="lg">
          <RelatedProducts products={relatedProducts} />
        </Container>
      </section>
    ) : null}
    <SocialSpeedDial links={socialLinks} />
    </>
  );
}
