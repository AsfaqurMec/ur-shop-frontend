'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCloseSidebarDrawer } from '@/components/layout/DashboardSidebarShell';
import { clearAuthToken } from '@/lib/api/client';
import { getAdminOpenTicketsCount } from '@/lib/api/admin';
import { NavCountBadge } from '@/components/layout/NavCountBadge';

const iconWrap = 'flex h-[18px] w-[18px] shrink-0 items-center justify-center opacity-80';

function I({ children }: { children: React.ReactNode }) {
  return <span className={iconWrap}>{children}</span>;
}

const links: { href: string; label: string; icon: React.ReactNode }[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: (
      <I>
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </I>
    ),
  },
  {
    href: '/admin/products',
    label: 'Products',
    icon: (
      <I>
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </I>
    ),
  },
  {
    href: '/admin/categories',
    label: 'Categories',
    icon: (
      <I>
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      </I>
    ),
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    icon: (
      <I>
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </I>
    ),
  },
  {
    href: '/admin/pending-orders',
    label: 'Pending orders',
    icon: (
      <I>
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </I>
    ),
  },
  {
    href: '/admin/payment-options',
    label: 'Payment options',
    icon: (
      <I>
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </I>
    ),
  },
  {
    href: '/admin/customers',
    label: 'Customers',
    icon: (
      <I>
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </I>
    ),
  },
  {
    href: '/admin/tickets',
    label: 'Tickets',
    icon: (
      <I>
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      </I>
    ),
  },
  {
    href: '/admin/coupons',
    label: 'Coupons',
    icon: (
      <I>
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      </I>
    ),
  },
  {
    href: '/admin/reviews',
    label: 'Reviews',
    icon: (
      <I>
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </I>
    ),
  },
  {
    href: '/admin/emails',
    label: 'Emails',
    icon: (
      <I>
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </I>
    ),
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: (
      <I>
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </I>
    ),
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const closeDrawer = useCloseSidebarDrawer();
  const [openTicketCount, setOpenTicketCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const n = await getAdminOpenTicketsCount();
        if (!cancelled) setOpenTicketCount(n);
      } catch {
        if (!cancelled) setOpenTicketCount(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const handleLogout = () => {
    clearAuthToken();
    closeDrawer?.();
    router.replace('/');
  };

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Admin">
      <Link
        href="/"
        onClick={() => closeDrawer?.()}
        className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Storefront
      </Link>
      <div className="mb-2 rounded-lg bg-primary/10 px-3 py-2">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Admin</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Manage your store</p>
      </div>
      {links.map(({ href, label, icon }) => {
        const isLinkActive =
          href === '/admin'
            ? pathname === '/admin'
            : pathname === href || pathname.startsWith(`${href}/`);
        const showTicketsBadge = href === '/admin/tickets' && openTicketCount != null && openTicketCount > 0;
        return (
          <Link
            key={href}
            href={href}
            onClick={() => closeDrawer?.()}
            className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isLinkActive
                ? 'bg-muted text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            <span className="flex min-w-0 flex-1 items-center gap-3">
              {icon}
              {label}
            </span>
            {showTicketsBadge ? (
              <NavCountBadge count={openTicketCount} ariaLabel={`${openTicketCount} open tickets`} />
            ) : null}
          </Link>
        );
      })}
      <div className="mt-6 border-t border-border/60 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <I>
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </I>
          Log out
        </button>
      </div>
    </nav>
  );
}
