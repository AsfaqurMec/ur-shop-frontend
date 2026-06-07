'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SITE_FOOTER_BLURB } from '@/lib/seo/siteCopy';
import { SITE_NAME } from '@/lib/seo/site';
import type { PublicStoreSettings } from '@/lib/api/storeSettings';
import { getPublicStoreSettings } from '@/lib/api/storeSettings';
import { useEffect, useState } from 'react';

function PhoneHandsetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}

function toPhoneHref(value: string): string {
  const compact = value.replace(/[^\d+]/g, '');
  if (!compact) return '';
  if (compact.startsWith('+')) return `tel:${compact}`;
  return `tel:${compact.replace(/\+/g, '')}`;
}

export function PublicFooter({ settings }: { settings?: PublicStoreSettings | null }) {
  const [liveSettings, setLiveSettings] = useState<PublicStoreSettings | null>(settings ?? null);

  useEffect(() => {
    let cancelled = false;
    getPublicStoreSettings()
      .then((data) => {
        if (!cancelled) setLiveSettings(data);
      })
      .catch(() => {
        // Keep existing/fallback branding when API is temporarily unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const year = new Date().getFullYear();
  const brandName = liveSettings?.siteTitle?.trim() || SITE_NAME;
  const brandLogo = liveSettings?.siteLogo?.trim() || '/icon.png';
  const supportNumber = liveSettings?.emailFooterSupportNumber?.trim() || '';
  const supportNumberHref = toPhoneHref(supportNumber);
  return (
    <footer className="mt-auto border-t border-border/80 bg-card">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 font-semibold tracking-tight">
              <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-border">
                <Image
                  src={brandLogo}
                  alt=""
                  width={36}
                  height={36}
                  className="object-contain"
                  unoptimized
                />
              </span>
              {brandName}
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              {SITE_FOOTER_BLURB}
            </p>
            {supportNumberHref ? (
              <a
                href={supportNumberHref}
                className="mt-4 inline-flex max-w-full items-center gap-2 rounded-md border border-border/80 bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/50 dark:border-border/70 dark:bg-muted/30 dark:hover:bg-muted/50"
              >
                <PhoneHandsetIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate tabular-nums">{supportNumber}</span>
              </a>
            ) : null}
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Store
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/shop" className="text-foreground hover:text-primary transition-colors">
                  Browse shop
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-foreground hover:text-primary transition-colors">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-foreground hover:text-primary transition-colors">
                  Cart
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Account
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/login" className="text-foreground hover:text-primary transition-colors">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-foreground hover:text-primary transition-colors">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center gap-4 border-t border-border/80 pt-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-sm text-muted-foreground">© {year} {brandName}. All rights reserved.</p>
          <p className="text-xs text-muted-foreground sm:text-right">
            Secure payments · Instant digital delivery
          </p>
        </div>
        <div className="mt-0  pt-8 text-center">
          <p className="text-base text-muted-foreground">
            Developed by{' '}
            <Link
              href="https://www.flexsoftr.com"
              target="_blank"
              rel="noopener noreferrer"
              className=" font-semibold text-cyan-500 transition-colors hover:text-cyan-400"
            >
              FlexSoft
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
