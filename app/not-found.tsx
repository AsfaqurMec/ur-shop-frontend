import Link from 'next/link';
import type { Metadata } from 'next';
import { SEO_NO_INDEX } from '@/lib/seo/metadata';

/** Avoid a misleading canonical — 404 can occur on any URL; only signal noindex. */
export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you are looking for does not exist or has been moved.',
  ...SEO_NO_INDEX,
};

/** Global 404 — kept lightweight for crawlers and users. */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-background px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">Page not found</h1>
      <p className="mt-3 max-w-md text-center text-sm text-muted-foreground">
        The link may be broken or the page may have been removed. Try the shop or return home.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/shop"
          className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          Browse shop
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-lg border border-border px-5 text-sm font-medium text-foreground"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
