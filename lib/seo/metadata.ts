/**
 * Shared Next.js Metadata helpers — single place for title template, OG/Twitter, canonical.
 */

import type { Metadata } from 'next';
import { getGoogleSiteVerification, getMetadataBaseUrl, getSiteUrl, SITE_NAME } from './site';
import { toAbsoluteUrl } from './resolveOgImage';
import { SITE_DEFAULT_DESCRIPTION } from './siteCopy';

/** Use on auth, cart, checkout, dashboards — avoids indexing private or thin transactional pages. */
export const SEO_NO_INDEX: Pick<Metadata, 'robots'> = {
  robots: { index: false, follow: false },
};

const DEFAULT_DESCRIPTION = SITE_DEFAULT_DESCRIPTION;

const DEFAULT_KEYWORDS = [
  'digital products',
  'software licenses',
  'downloads',
  'subscriptions',
  'Parves BD',
  'online store',
];

export const defaultGlobalKeywords = DEFAULT_KEYWORDS;

/** Root layout defaults — child routes merge/override; avoid duplicating full OG on every page. */
export function buildRootMetadata(): Metadata {
  const base = getMetadataBaseUrl();
  const verification = getGoogleSiteVerification();

  return {
    metadataBase: base,
    title: {
      default: `${SITE_NAME} — Digital products & licenses`,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    authors: [{ name: SITE_NAME, url: getSiteUrl() }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: getSiteUrl(),
      siteName: SITE_NAME,
      title: `${SITE_NAME} — Digital products & licenses`,
      description: DEFAULT_DESCRIPTION,
      images: [
        {
          url: '/og-default.png',
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — storefront`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} — Digital products & licenses`,
      description: DEFAULT_DESCRIPTION,
      images: ['/og-default.png'],
    },
    // Google requires a square icon (≥48×48). `/favicon.ico` is rewritten to `/icon.png` in `next.config.js`.
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '512x512' },
        { url: '/icon.png', type: 'image/png', sizes: '512x512' },
      ],
      shortcut: ['/favicon.ico'],
      apple: [{ url: '/icon.png', sizes: '180x180', type: 'image/png' }],
    },
    ...(verification
      ? {
          verification: {
            google: verification,
          },
        }
      : {}),
  };
}

export interface PageSeoInput {
  /** URL path starting with / (e.g. /shop). Used for canonical + og:url. */
  path: string;
  title: string;
  description: string;
  /** Optional OG/Twitter image — absolute URL or site-relative path. */
  image?: string | null;
  keywords?: string[];
  /** When true, page is indexable (default). */
  index?: boolean;
}

/**
 * Page-level metadata with canonical and social tags. Keeps one consistent pattern for static routes.
 */
export function createPageMetadata(input: PageSeoInput): Metadata {
  const { path, title, description, image, keywords, index = true } = input;
  const canonical = `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const ogImage = toAbsoluteUrl(image) ?? `${getSiteUrl()}/og-default.png`;

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      locale: 'en_US',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}
