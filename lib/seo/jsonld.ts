/**
 * JSON-LD builders (schema.org). Serialized into <script type="application/ld+json">.
 */

import type { Product as StoreProduct } from '@/types/product';
//import type { BlogPost } from '@/types/blog';
import { getDefaultCurrency, getSiteUrl, SITE_NAME } from './site';
import { getPrimaryProductImagePath, getProductImageUrl } from '@/lib/imageUrl';
import { toAbsoluteUrl } from './resolveOgImage';
import { SITE_META_HOME_DESCRIPTION } from './siteCopy';
import { BlogPost } from '@/types/blog';

export function organizationJsonLd(): Record<string, unknown> {
  const url = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    description: SITE_META_HOME_DESCRIPTION,
    url,
    logo: `${url}/icon.png`,
  };
}

/** Home page — enables sitelinks search box when Google chooses to show it. */
export function websiteJsonLd(): Record<string, unknown> {
  const url = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    description: SITE_META_HOME_DESCRIPTION,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>): Record<string, unknown> {
  const base = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${base}${item.path.startsWith('/') ? item.path : `/${item.path}`}`,
    })),
  };
}

export function productJsonLd(product: StoreProduct, canonicalPath: string): Record<string, unknown> {
  const path = getPrimaryProductImagePath(product);
  const rel = getProductImageUrl(path ?? undefined);
  const image = toAbsoluteUrl(rel) ?? `${getSiteUrl()}/icon.png`;
  const currency = getDefaultCurrency();
  const url = `${getSiteUrl()}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? product.name,
    sku: product.sku ?? undefined,
    image: [image],
    url,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: currency,
      price: String(product.price),
      availability: product.is_active
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
  };
}

export function articleJsonLd(post: BlogPost, canonicalPath: string): Record<string, unknown> {
  const url = `${getSiteUrl()}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;
  const image = toAbsoluteUrl(post.cover_image) ?? `${getSiteUrl()}/opengraph-image`;
  const published = post.published_at ?? post.updated_at;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? post.title,
    image: [image],
    datePublished: published,
    dateModified: post.updated_at,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${getSiteUrl()}/icon.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}
