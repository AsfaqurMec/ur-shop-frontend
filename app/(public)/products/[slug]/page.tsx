import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchProductBySlug, fetchRelatedProducts } from '@/lib/api/products';
import { fetchProductReviews } from '@/lib/api/reviews';
import { getPublicStoreSettings } from '@/lib/api/storeSettings';
import { ProductDetails } from '@/components/storefront';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo/jsonld';
import { getPrimaryProductImagePath, getProductImageUrl } from '@/lib/imageUrl';
import { getSiteUrl } from '@/lib/seo/site';
import { toAbsoluteUrl } from '@/lib/seo/resolveOgImage';
import { stripHtml, truncateForMeta } from '@/lib/seo/text';
import ProductViewTracker from '@/components/analytics/ProductViewTracker';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug).catch(() => null);
  if (!product) {
    return { title: 'Product', robots: { index: false, follow: false } };
  }
  const canonical = `${getSiteUrl()}/products/${slug}`;
  const description = truncateForMeta(stripHtml(product.description ?? product.name), 160);
  const primary = getPrimaryProductImagePath(product);
  const rel = getProductImageUrl(primary ?? undefined);
  const ogImage = toAbsoluteUrl(rel) ?? `${getSiteUrl()}/icon.png`;
  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      title: product.name,
      description,
      url: canonical,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: [ogImage],
    },
  };
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function parseVariationId(sp: Record<string, string | string[] | undefined>): number | undefined {
  const raw = sp.variationId ?? sp.variation_id;
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (s == null || s === '') return undefined;
  const n = parseInt(String(s), 10);
  return Number.isFinite(n) && n >= 1 ? n : undefined;
}

function parseRenewHint(sp: Record<string, string | string[] | undefined>): boolean {
  const raw = sp.renew;
  const s = Array.isArray(raw) ? raw[0] : raw;
  return s === '1' || s === 'true' || s === 'yes';
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const initialVariationId = parseVariationId(sp);
  const renewHint = parseRenewHint(sp);
  const product = await fetchProductBySlug(slug).catch(() => null);
  if (!product) notFound();

  const [reviewsData, publicSettings, relatedProducts] = await Promise.all([
    fetchProductReviews(product.id, { limit: 50 }).catch(() => ({
      reviews: [],
      total: 0,
    })),
    getPublicStoreSettings().catch(() => null),
    fetchRelatedProducts(product, 4).catch(() => []),
  ]);

  const canonicalPath = `/products/${slug}`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Shop', path: '/shop' },
          { name: product.name, path: canonicalPath },
        ])}
      />
      <JsonLd data={productJsonLd(product, canonicalPath)} />
      <div className="min-h-screen">
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-2 text-sm">
          <Link href="/shop" className="text-muted-foreground hover:text-foreground">
            ← Shop
          </Link>
        </div>
      </div>

      <ProductViewTracker
         productId={product.id}
         productName={product.name}
         price={product.price || 0}
       />

      <ProductDetails
        product={product}
        initialVariationId={initialVariationId}
        renewHint={renewHint}
        socialLinks={publicSettings?.socialLinks ?? []}
        supportNumber={publicSettings?.emailFooterSupportNumber ?? ''}
        productReviews={{
          productId: product.id,
          productSlug: slug,
          initialReviews: reviewsData.reviews,
          initialTotal: reviewsData.total,
        }}
        relatedProducts={relatedProducts}
      />
    </div>
    </>
  );
}
