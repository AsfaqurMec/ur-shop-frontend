'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/api/client';
import { getCart } from '@/lib/api/cart';
import { getGuestCart } from '@/lib/storefront/guestCart';
import { formatCurrency } from '@/lib/utils/format';
import { BagIcon } from '@/components/layout/header/HeaderIcons';

export function FloatingCartSummary() {
  const [summary, setSummary] = useState({ count: 0, total: 0 });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const cart = getAuthToken() ? await getCart({ skip401Redirect: true }) : getGuestCart();
        if (!cancelled) setSummary({ count: cart.item_count, total: cart.subtotal });
      } catch {
        if (!cancelled) setSummary({ count: 0, total: 0 });
      }
    };
    void load();
    window.addEventListener('cart:changed', load);
    window.addEventListener('storage', load);
    return () => {
      cancelled = true;
      window.removeEventListener('cart:changed', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  if (summary.total <= 0 || summary.count <= 0) return null;
  return (
    <Link
      href="/cart"
      className="fixed right-1 top-1/2 z-[30] block w-16 -translate-y-1/2 overflow-hidden rounded-md bg-slate-950 text-sm font-semibold text-white  transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:right-2"
      aria-label={`View cart: ${summary.count} items, ${formatCurrency(summary.total)}`}
    >
      <span className="relative flex h-14 items-center justify-center pr-2">
        <BagIcon />
        <span className="absolute right-2 top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] leading-5 text-destructive-foreground">
          {Math.min(summary.count, 99)}
        </span>
      </span>
      <span className="block bg-primary px-1 py-2 text-center tabular-nums text-primary-foreground">{formatCurrency(summary.total)}</span>
    </Link>
  );
}
