/**
 * Canonical site URL for metadata, sitemaps, and JSON-LD.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://parvesbd.com) — no trailing slash.
 */

export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME?.trim() || 'Parves BD';

const DEFAULT_DEV_ORIGIN = 'http://localhost:3000';

/**
 * Resolves the public origin used in canonical URLs and Open Graph `og:url`.
 * Falls back to Vercel preview URL when NEXT_PUBLIC_SITE_URL is unset.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  return DEFAULT_DEV_ORIGIN;
}

export function getMetadataBaseUrl(): URL {
  return new URL(getSiteUrl());
}

/**
 * Google Search Console HTML tag verification content (meta name="google-site-verification").
 * Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to the value Google gives you (not the full tag).
 */
export function getGoogleSiteVerification(): string | undefined {
  const v = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  return v || undefined;
}

/** Default storefront currency (matches UI; used in Product schema offers). */
export function getDefaultCurrency(): string {
  return process.env.NEXT_PUBLIC_STORE_CURRENCY?.trim() || 'BDT';
}
