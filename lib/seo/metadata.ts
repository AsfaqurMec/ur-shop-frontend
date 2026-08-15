import type { Metadata } from 'next';
import { getGoogleSiteVerification, getMetadataBaseUrl, getSiteUrl, SITE_NAME } from './site';
import { toAbsoluteUrl } from './resolveOgImage';
import { SITE_DEFAULT_DESCRIPTION } from './siteCopy';

export const SEO_NO_INDEX: Pick<Metadata, 'robots'> = { robots: { index: false, follow: false } };

const DEFAULT_KEYWORDS = ['UR Shop', 'premium panjabi', 'men’s fashion', 'lifestyle accessories', 'panjabi collection', 'men’s clothing'];
export const defaultGlobalKeywords = DEFAULT_KEYWORDS;

export function buildRootMetadata(): Metadata {
  const base = getMetadataBaseUrl();
  const verification = getGoogleSiteVerification();
  const title = `${SITE_NAME} | Premium Panjabi Collection & Men’s Fashion`;
  return {
    metadataBase: base,
    title: { default: 'Premium Panjabi Collection & Men’s Fashion', template: `%s | ${SITE_NAME}` },
    description: SITE_DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    authors: [{ name: SITE_NAME, url: getSiteUrl() }], creator: SITE_NAME, publisher: SITE_NAME,
    applicationName: SITE_NAME, category: 'Shopping', referrer: 'origin-when-cross-origin',
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: { type: 'website', locale: 'en_US', url: getSiteUrl(), siteName: SITE_NAME, title, description: SITE_DEFAULT_DESCRIPTION, images: [{ url: '/icon.png', width: 1200, height: 630, alt: `${SITE_NAME} premium Panjabi collection and men’s fashion` }] },
    twitter: { card: 'summary_large_image', title, description: SITE_DEFAULT_DESCRIPTION, images: ['/icon.png'] },
    icons: { icon: [{ url: '/favicon.ico', sizes: '512x512' }, { url: '/icon.png', type: 'image/png', sizes: '512x512' }], shortcut: ['/favicon.ico'], apple: [{ url: '/icon.png', sizes: '180x180', type: 'image/png' }] },
    ...(verification ? { verification: { google: verification } } : {}),
  };
}

export interface PageSeoInput { path: string; title: string; description: string; image?: string | null; keywords?: string[]; index?: boolean; }
export function createPageMetadata(input: PageSeoInput): Metadata {
  const { path, title, description, image, keywords, index = true } = input;
  const canonical = `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const ogImage = toAbsoluteUrl(image) ?? `${getSiteUrl()}/icon.png`;
  return {
    title, description, ...(keywords?.length ? { keywords } : {}),
    robots: index ? { index: true, follow: true } : { index: false, follow: false }, alternates: { canonical },
    openGraph: { type: 'website', url: canonical, siteName: SITE_NAME, title, description, locale: 'en_US', images: [{ url: ogImage, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}
