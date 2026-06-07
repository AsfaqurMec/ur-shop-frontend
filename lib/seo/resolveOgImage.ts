/**
 * Turns relative app paths (e.g. /api/media/...) into absolute URLs for Open Graph and Twitter.
 */

import { getSiteUrl } from './site';

export function toAbsoluteUrl(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl?.trim()) return undefined;
  const s = pathOrUrl.trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const origin = getSiteUrl();
  if (s.startsWith('/')) return `${origin}${s}`;
  return `${origin}/${s}`;
}
