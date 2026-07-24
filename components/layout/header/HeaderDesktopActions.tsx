'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { HeaderSearch } from '@/components/layout/HeaderSearch';
import type { Category } from '@/types/category';
import type { SafeUser } from '@/types/auth';
import { accountMenuItemClass } from './constants';
import { BagIcon, DashboardIcon, SignOutIcon, UserIcon } from './HeaderIcons';

interface HeaderDesktopActionsProps {
  categories: Category[];
  cartCount: number;
  cartBadgeCount: number;
  authReady: boolean;
  user: SafeUser | null;
  displayName: string;
  accountHref: string;
  accountLabel: string;
  accountMenuOpen: boolean;
  setAccountMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  accountTriggerRef: React.Ref<HTMLButtonElement>;
  accountMenuRef: React.Ref<HTMLUListElement>;
  accountMenuPos: { top: number; right: number };
  portalsReady: boolean;
  onSignOut: () => void;
}

export function HeaderDesktopActions({
  categories,
  cartCount,
  cartBadgeCount,
  authReady,
  user,
  displayName,
  accountHref,
  accountLabel,
  accountMenuOpen,
  setAccountMenuOpen,
  accountTriggerRef,
  accountMenuRef,
  accountMenuPos,
  portalsReady,
  onSignOut,
}: HeaderDesktopActionsProps) {
  const accountDropdown =
    accountMenuOpen && user ? (
      <ul
        ref={accountMenuRef}
        id="header-account-menu"
        className="hidden sm:block fixed z-[100] min-w-[11rem] overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-lg shadow-black/15 ring-1 ring-black/5 dark:shadow-black/50 dark:ring-white/10"
        style={{ top: 95, right: 30, backgroundColor: 'hsl(var(--popover))' }}
        role="menu"
        aria-label="Account"
      >
        <li role="none">
          <Link
            href={accountHref}
            role="menuitem"
            className={accountMenuItemClass}
            onClick={() => setAccountMenuOpen(false)}
          >
            <DashboardIcon /> {accountLabel}
          </Link>
        </li>
        <li role="none">
          <button type="button" role="menuitem" className={accountMenuItemClass} onClick={onSignOut}>
            <SignOutIcon /> Sign out
          </button>
        </li>
      </ul>
    ) : null;

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <HeaderSearch categories={categories} />

      <Link
        href="/cart"
        className="hidden sm:flex relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Cart"
      >
        <BagIcon />
        {cartCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
            {cartBadgeCount}
          </span>
        )}
      </Link>

      {!authReady ? (
        <span className=" inline-flex h-9 w-9 items-center justify-center" aria-hidden />
      ) : user ? (
        <>
          <button
            type="button"
            ref={accountTriggerRef}
            className="hidden sm:flex relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 text-foreground shadow-sm transition-colors hover:bg-muted dark:bg-muted/40 dark:hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-expanded={accountMenuOpen}
            aria-haspopup="menu"
            aria-controls="header-account-menu"
            title={displayName || user.email}
            onClick={() => {
              console.log("clicked");
              setAccountMenuOpen((o) => !o);
            }}
          >
            <UserIcon />
          </button>
          {portalsReady && accountDropdown ? createPortal(accountDropdown, document.body) : null}
        </>
      ) : (
        <Link
          href="/login"
          className="hidden sm:flex inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Sign in"
          title="Sign in"
        >
          <UserIcon />
        </Link>
      )}
    </div>
  );
}
