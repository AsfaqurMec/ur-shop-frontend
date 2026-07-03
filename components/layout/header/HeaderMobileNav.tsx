'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import type { Category } from '@/types/category';
import type { SafeUser } from '@/types/auth';
import { navLinks } from './constants';
import { getDrawerUserInitials } from './utils';
import {
  BagIcon,
  ChevronDownIcon,
  CloseIcon,
  CollectionIcon,
  DashboardIcon,
  HomeIcon,
  OrdersIcon,
  ProfileIcon,
  ShopIcon,
  SignOutIcon,
  UserIcon,
} from './HeaderIcons';

interface HeaderMobileBottomNavProps {
  pathname: string;
  cartCount: number;
  cartBadgeCount: number;
  accountHref: string;
  user: SafeUser | null;
  portalsReady: boolean;
}

export function HeaderMobileBottomNav({
  pathname,
  cartCount,
  cartBadgeCount,
  accountHref,
  user,
  portalsReady,
}: HeaderMobileBottomNavProps) {
  const mobileBottomLinks = [
    { href: '/', label: 'Home', icon: <HomeIcon /> },
    { href: '/shop', label: 'Shop', icon: <ShopIcon /> },
    { href: '/dashboard/orders', label: 'Orders', icon: <OrdersIcon /> },
    { href: '/cart', label: 'Cart', icon: <BagIcon /> },
    { href: user ? accountHref : '/login', label: 'Profile', icon: <ProfileIcon /> },
  ] as const;

  const mobileBottomNav = (
    <nav
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-border/80 bg-card/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-6px_24px_-12px_rgba(0,0,0,0.35)] backdrop-blur supports-[backdrop-filter]:bg-card/95 md:hidden"
      aria-label="Mobile bottom navigation"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {mobileBottomLinks.map(({ href, label, icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                {icon}
                <span className="leading-none">{label}</span>
                {href === '/cart' && cartCount > 0 && (
                  <span className="absolute right-2 top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                    {cartBadgeCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return portalsReady ? createPortal(mobileBottomNav, document.body) : null;
}

interface HeaderMobileDrawerProps {
  open: boolean;
  onClose: () => void;
  brandName: string;
  pathname: string;
  navCategories: Category[];
  cartCount: number;
  cartBadgeCount: number;
  authReady: boolean;
  user: SafeUser | null;
  displayName: string;
  accountHref: string;
  accountLabel: string;
  onSignOut: () => void;
  portalsReady: boolean;
}

const drawerAccordionClass =
  'group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)] transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]';

const drawerSummaryClass =
  'flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.04] [&::-webkit-details-marker]:hidden';

const drawerLabelClass =
  'inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/90';

export function HeaderMobileDrawer({
  open,
  onClose,
  brandName,
  pathname,
  navCategories,
  cartCount,
  cartBadgeCount,
  authReady,
  user,
  displayName,
  accountHref,
  accountLabel,
  onSignOut,
  portalsReady,
}: HeaderMobileDrawerProps) {
  if (!portalsReady || !open) return null;

  return createPortal(
    <div
      id="mobile-nav"
      className="fixed inset-0 z-[80] flex md:hidden bg-black"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-menu-title"
    >
      <div className="relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-black">
        {/* Subtle top glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 to-transparent"
          aria-hidden
        />

        {/* Header */}
        <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.75rem,env(safe-area-inset-top))]">
          <h2 id="mobile-menu-title" className="min-w-0 truncate text-lg font-bold tracking-tight text-white">
            {brandName}
          </h2>
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-white/30 hover:bg-white/10"
            onClick={onClose}
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <nav className="flex flex-col gap-4" aria-label="Mobile main">
            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              {navLinks.map(({ href, label }) => {
                const active =
                  href === '/shop' ? pathname === '/shop' : pathname === href || pathname.startsWith(`${href}/`);
                const isCart = label === 'Cart';
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border px-3.5 py-3.5 text-sm font-semibold transition-all ${
                      active
                        ? 'border-primary/60 bg-primary/15 text-white shadow-[0_0_20px_-4px_hsl(var(--primary)/0.4)]'
                        : 'border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]'
                    }`}
                    onClick={onClose}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        active ? 'bg-primary/30 text-primary-foreground' : 'bg-white/10 text-white/70'
                      }`}
                    >
                      {isCart ? <BagIcon /> : <ShopIcon />}
                    </span>
                    <span className="min-w-0 flex-1 text-left leading-tight">
                      {isCart ? (
                        <span className="flex flex-col gap-0.5">
                          <span>{label}</span>
                          {cartCount > 0 ? (
                            <span className="inline-flex w-fit items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                              {cartBadgeCount} items
                            </span>
                          ) : (
                            <span className="text-[11px] font-normal text-white/45">Your bag</span>
                          )}
                        </span>
                      ) : (
                        <span className="flex flex-col gap-0.5">
                          <span>{label}</span>
                          <span className="text-[11px] font-normal text-white/45">Browse store</span>
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Categories accordion */}
            <details className={drawerAccordionClass} open>
              <summary className={drawerSummaryClass}>
                <span className={drawerLabelClass}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/25 text-primary ring-1 ring-primary/40">
                    <CollectionIcon />
                  </span>
                  Categories
                </span>
                <span className="text-white/50">
                  <ChevronDownIcon />
                </span>
              </summary>
              <div className="space-y-2 border-t border-white/10 p-4">
                <Link
                  href="/shop"
                  className="block rounded-xl border border-primary/50 bg-primary/15 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-primary/25"
                  onClick={onClose}
                >
                  View all products
                </Link>
                <div className="flex flex-col gap-1.5">
                  {navCategories.map((category) => {
                    const href = `/shop/category/${category.slug}`;
                    const active = pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <Link
                        key={category.id}
                        href={href}
                        className={`group/cat relative overflow-hidden rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                          active
                            ? 'border-primary/50 bg-primary/10 pl-5 text-white'
                            : 'border-white/8 bg-white/[0.03] text-white/70 hover:border-white/15 hover:bg-white/[0.06] hover:pl-5 hover:text-white'
                        }`}
                        onClick={onClose}
                      >
                        <span
                          className={`absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary transition-all ${
                            active ? 'opacity-100' : 'opacity-0 group-hover/cat:opacity-60'
                          }`}
                        />
                        {category.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </details>

            {/* Account section */}
            {!authReady ? null : user ? (
              <details className={drawerAccordionClass} open>
                <summary className={drawerSummaryClass}>
                  <span className={drawerLabelClass}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/25 text-primary ring-1 ring-primary/40">
                      <UserIcon />
                    </span>
                    Account
                  </span>
                  <span className="text-white/50">
                    <ChevronDownIcon />
                  </span>
                </summary>
                <div className="space-y-3 border-t border-white/10 p-4">
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-base font-bold text-primary-foreground shadow-md ring-2 ring-primary/40">
                      {getDrawerUserInitials(displayName || user.email)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white" title={user.email}>
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-white/45" title={user.email}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={accountHref}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08]"
                    onClick={onClose}
                  >
                    <DashboardIcon /> {accountLabel}
                  </Link>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-left text-sm font-medium text-white/55 transition hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                    onClick={onSignOut}
                  >
                    <SignOutIcon /> Sign out
                  </button>
                </div>
              </details>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-center text-xs font-medium text-white/50">Sign in to track orders and manage your account</p>
                <div className="mt-3 grid gap-2.5">
                  <Link
                    href="/login"
                    className="rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3.5 text-center text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
                    onClick={onClose}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-xl bg-primary px-4 py-3.5 text-center text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110"
                    onClick={onClose}
                  >
                    Create account
                  </Link>
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>
    </div>,
    document.body
  );
}
