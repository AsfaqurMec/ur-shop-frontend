'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCloseSidebarDrawer } from '@/components/layout/DashboardSidebarShell';
import { clearAuthToken, getAuthToken } from '@/lib/api/client';
import { listMyTickets } from '@/lib/api/tickets';
import { getAccessTokenUserId } from '@/lib/auth/token';
import {
  SUPPORT_TICKET_READ_STORAGE_PREFIX,
  SUPPORT_TICKETS_READ_EVENT,
  getUnreadAnsweredCount,
} from '@/lib/utils/supportTicketReadState';
import { NavCountBadge } from '@/components/layout/NavCountBadge';

const iconClass = 'h-[18px] w-[18px] shrink-0 opacity-80';

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span className={iconClass} aria-hidden>
      {children}
    </span>
  );
}

const links: { href: string; label: string; icon: React.ReactNode }[] = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: (
      <Icon>
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </Icon>
    ),
  },
  {
    href: '/dashboard/orders',
    label: 'Orders',
    icon: (
      <Icon>
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </Icon>
    ),
  },
  {
    href: '/dashboard/downloads',
    label: 'Downloads',
    icon: (
      <Icon>
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </Icon>
    ),
  },
  {
    href: '/dashboard/licenses',
    label: 'Licenses',
    icon: (
      <Icon>
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      </Icon>
    ),
  },
  {
    href: '/dashboard/subscriptions',
    label: 'Subscriptions',
    icon: (
      <Icon>
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </Icon>
    ),
  },
  {
    href: '/dashboard/tickets',
    label: 'Support',
    icon: (
      <Icon>
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </Icon>
    ),
  },
  {
    href: '/dashboard/profile',
    label: 'Profile',
    icon: (
      <Icon>
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </Icon>
    ),
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const closeDrawer = useCloseSidebarDrawer();
  const [answeredTicketCount, setAnsweredTicketCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const uid = getAccessTokenUserId(getAuthToken());
        if (uid == null) {
          if (!cancelled) setAnsweredTicketCount(null);
          return;
        }
        const { tickets } = await listMyTickets({ limit: 200, offset: 0 });
        if (!cancelled) setAnsweredTicketCount(getUnreadAnsweredCount(uid, tickets));
      } catch {
        if (!cancelled) setAnsweredTicketCount(null);
      }
    };
    void refresh();
    const onRead = () => {
      void refresh();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith(SUPPORT_TICKET_READ_STORAGE_PREFIX)) void refresh();
    };
    window.addEventListener(SUPPORT_TICKETS_READ_EVENT, onRead);
    window.addEventListener('storage', onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener(SUPPORT_TICKETS_READ_EVENT, onRead);
      window.removeEventListener('storage', onStorage);
    };
  }, [pathname]);

  const handleLogout = () => {
    clearAuthToken();
    closeDrawer?.();
    router.replace('/');
  };

  return (
    <nav className="flex flex-col gap-1" aria-label="Dashboard">
      <Link
        href="/"
        onClick={() => closeDrawer?.()}
        className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Store
      </Link>
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Your account
      </p>
      {links.map(({ href, label, icon }) => {
        const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        const showSupportBadge =
          href === '/dashboard/tickets' && answeredTicketCount != null && answeredTicketCount > 0;
        return (
          <Link
            key={href}
            href={href}
            onClick={() => closeDrawer?.()}
            className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span className="flex min-w-0 flex-1 items-center gap-3">
              {icon}
              {label}
            </span>
            {showSupportBadge ? (
              <NavCountBadge
                count={answeredTicketCount}
                ariaLabel={`${answeredTicketCount} new replies on support`}
              />
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
          <Icon>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </Icon>
          Log out
        </button>
      </div>
    </nav>
  );
}
