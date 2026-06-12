'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ThemeToggle } from '@/components/theme';
import { getAuthToken, clearAuthToken } from '@/lib/api/client';
import { getProfile } from '@/lib/api/auth';
import { getCart } from '@/lib/api/cart';
import { fetchCategories } from '@/lib/api/categories';
import { getPublicStoreSettings } from '@/lib/api/storeSettings';
import type { SafeUser } from '@/types/auth';
import type { Category } from '@/types/category';
import { SITE_NAME } from '@/lib/seo/site';
import type { PublicStoreSettings } from '@/lib/api/storeSettings';

const navLinks = [
  { href: '/shop', label: 'Shop' },
  { href: '/cart', label: 'Cart' },
] as const;

function DashboardMenuIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}

function SignOutMenuIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CollectionIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5h7v5H4v-5zM13 5.5h7v5h-7v-5zM4 13.5h7v5H4v-5zM13 13.5h7v5h-7v-5z" />
    </svg>
  );
}

function ThemeDrawerIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-amber-400/95" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function AccountDrawerIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function DrawerAccordionChevron() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-primary/80 transition-transform duration-200 group-open:rotate-180"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function getDrawerUserInitials(nameOrEmail: string): string {
  const t = nameOrEmail.trim();
  if (!t) return '?';
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return t.slice(0, 2).toUpperCase();
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  );
}

function CartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l1.4 9.2a2 2 0 001.98 1.7h8.9a2 2 0 001.96-1.58L21 7H7" />
      <circle cx="10" cy="19" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="17" cy="19" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5l9-7 9 7M5.5 9.5V20h5.5v-5h2v5h5.5V9.5" />
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7l8-4 8 4m-16 0l8 4m-8-4v10l8 4m0-10l8-4v10l-8 4" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

const accountMenuItemClass =
  'flex w-full items-center gap-2 border-0 bg-popover px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover';

const mobileDrawerAccordionClass =
  'group overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/30 shadow-[0_10px_36px_-14px_rgba(0,0,0,0.45)] ring-1 ring-primary/15 backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:shadow-[0_14px_44px_-14px_rgba(0,0,0,0.5)] hover:ring-primary/30 dark:from-card dark:via-card dark:to-muted/15 dark:shadow-black/55 dark:ring-white/10';

const mobileDrawerSummaryClass =
  'flex cursor-pointer list-none items-center justify-between gap-3 bg-gradient-to-r from-primary/18 via-primary/8 to-transparent px-4 py-3.5 transition-colors hover:from-primary/26 hover:via-primary/14 [&::-webkit-details-marker]:hidden';

const mobileDrawerAccordionLabelClass =
  'inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/90';

export function PublicHeader({ settings }: { settings?: PublicStoreSettings | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SafeUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [productsMenuOpen, setProductsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [liveSettings, setLiveSettings] = useState<PublicStoreSettings | null>(settings ?? null);
  const [categories, setCategories] = useState<Category[]>([]);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLUListElement>(null);
  const [accountMenuPos, setAccountMenuPos] = useState({ top: 0, right: 0 });
  /** Portals must not run on the first client render — server output is `null` there; otherwise hydration mismatches. */
  const [portalsReady, setPortalsReady] = useState(false);

  useEffect(() => {
    setPortalsReady(true);
  }, []);

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

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setAuthReady(true);
      return;
    }
    let cancelled = false;
    getProfile()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setProductsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    const onProfileUpdated = () => {
      const token = getAuthToken();
      if (!token) return;
      void getProfile()
        .then((data) => setUser(data.user))
        .catch(() => setUser(null));
    };
    window.addEventListener('profile:updated', onProfileUpdated);
    return () => window.removeEventListener('profile:updated', onProfileUpdated);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCartCount = async () => {
      const token = getAuthToken();
      if (!token) {
        if (!cancelled) setCartCount(0);
        return;
      }
      try {
        const cart = await getCart();
        if (!cancelled) setCartCount(cart.item_count);
      } catch {
        if (!cancelled) setCartCount(0);
      }
    };

    const handleCartChanged = () => {
      void loadCartCount();
    };

    void loadCartCount();
    window.addEventListener('cart:changed', handleCartChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('cart:changed', handleCartChanged);
    };
  }, [pathname]);

  const handleSignOut = () => {
    clearAuthToken();
    setUser(null);
    setMobileOpen(false);
    setAccountMenuOpen(false);
    router.refresh();
  };

  useEffect(() => {
    if (!accountMenuOpen) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (accountTriggerRef.current?.contains(t) || accountMenuRef.current?.contains(t)) return;
      setAccountMenuOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [accountMenuOpen]);

  useLayoutEffect(() => {
    if (!accountMenuOpen) return;
    const update = () => {
      const el = accountTriggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setAccountMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [accountMenuOpen]);

  const accountHref = user?.role === 'admin' ? '/admin' : '/dashboard';
  const accountLabel = user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard';
  const displayName = user ? user.name || user.email : '';
  const cartBadgeCount = Math.min(cartCount, 99);
  const brandName = liveSettings?.siteTitle?.trim() || SITE_NAME;
  const brandLogo = liveSettings?.siteLogo?.trim() || '/icon.png';
  const featuredCategories = categories.slice(0, 8);
  const allProductsActive = pathname.startsWith('/shop/category/');

  const accountDropdown =
    accountMenuOpen && user ? (
      <ul
        ref={accountMenuRef}
        id="header-account-menu"
        className="fixed z-[100] min-w-[11rem] overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-lg shadow-black/15 ring-1 ring-black/5 dark:shadow-black/50 dark:ring-white/10"
        style={{
          top: accountMenuPos.top,
          right: accountMenuPos.right,
          backgroundColor: 'hsl(var(--popover))',
        }}
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
            <DashboardMenuIcon />
            {accountLabel}
          </Link>
        </li>
        <li role="none">
          <button type="button" role="menuitem" className={accountMenuItemClass} onClick={handleSignOut}>
            <SignOutMenuIcon />
            Sign out
          </button>
        </li>
      </ul>
    ) : null;

  const mobileBottomLinks = [
    { href: '/', label: 'Home', icon: <HomeIcon /> },
    { href: '/shop', label: 'Shop', icon: <ShopIcon /> },
    { href: '/dashboard/orders', label: 'Orders', icon: <OrdersIcon /> },
    { href: '/cart', label: 'Cart', icon: <CartIcon /> },
    { href: user ? accountHref : '/login', label: 'Profile', icon: <ProfileIcon /> },
  ] as const;

  const mobileBottomNav = (
    <nav
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-border/80 bg-card/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-6px_24px_-12px_rgba(0,0,0,0.35)] backdrop-blur supports-[backdrop-filter]:bg-card/95 md:hidden"
      aria-label="Mobile bottom navigation"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {mobileBottomLinks.map(({ href, label, icon }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname === href || pathname.startsWith(`${href}/`);
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
                {href === '/cart' && cartCount > 0 ? (
                  <span className="absolute right-2 top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                    {cartBadgeCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/70">
      <div
        className="pattern-header pointer-events-none absolute inset-0 opacity-50 dark:opacity-40"
        aria-hidden
      />
      <div className="relative mx-auto flex h-[var(--header-height)] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight text-foreground"
          onClick={() => setMobileOpen(false)}
        >
          <span
            className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-border"
            aria-hidden
          >
            <Image
              src={brandLogo}
              alt=""
              width={36}
              height={36}
              className="object-contain"
              priority
              unoptimized
            />
          </span>
          <span className="hidden sm:inline">{brandName}</span>
        </Link>

        <nav
          className="hidden md:flex flex-1 items-center justify-center gap-1"
          aria-label="Main"
        >
          {navLinks.map(({ href, label }) => {
            const active =
              href === '/shop'
                ? pathname === '/shop'
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {label === 'Cart' ? (
                  <span className="inline-flex items-center gap-2">
                    <span>{label}</span>
                    {cartCount > 0 ? (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-foreground">
                        {cartBadgeCount}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  label
                )}
              </Link>
            );
          })}
          <div
            className="relative"
            onMouseEnter={() => setProductsMenuOpen(true)}
            onMouseLeave={() => setProductsMenuOpen(false)}
          >
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                allProductsActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              aria-haspopup="menu"
              aria-expanded={productsMenuOpen}
              aria-label="All products categories"
              onClick={() => setProductsMenuOpen((prev) => !prev)}
            >
              All Products
              <ChevronIcon open={productsMenuOpen} />
            </button>
            <div
              className={`absolute left-1/2 top-full z-40 w-[16rem] -translate-x-1/2 pt-3 transition duration-200 ${
                productsMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <div className="overflow-hidden rounded-sm border border-primary/20 bg-popover/100 shadow-[0_22px_55px_-20px_rgba(0,0,0,0.45)] backdrop-blur dark:shadow-black/60">
                <div className="bg-gradient-to-r from-primary/35 via-primary/25 to-transparent px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">All Products</p>
                    <span className="rounded-full border border-primary/20 bg-background/70 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {categories.length} categories
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose a collection to explore curated products.
                  </p>
                </div>
                <div className="flex flex-col gap-2 py-4 px-2">
                  <Link
                    href="/shop"
                    className="block rounded-sm border border-primary/30 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent px-3 py-2.5 text-sm font-semibold text-foreground transition hover:from-primary/25 hover:via-primary/15"
                    onClick={() => setProductsMenuOpen(false)}
                  >
                    View all products
                  </Link>
                  {featuredCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/shop/category/${category.slug}`}
                      className="rounded-sm border border-border/70 bg-background/80 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                      onClick={() => setProductsMenuOpen(false)}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="hidden md:flex shrink-0 items-center gap-1">
          {/* <ThemeToggle /> */}
          {!authReady ? (
            <span className="inline-flex h-9 w-32 items-center justify-end" aria-hidden />
          ) : user ? (
            <>
              <button
                type="button"
                ref={accountTriggerRef}
                className="inline-flex h-9 max-w-[14rem] shrink-0 items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 text-left text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted dark:bg-muted/40 dark:hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                aria-controls="header-account-menu"
                title={user.email}
                onClick={() => setAccountMenuOpen((o) => !o)}
              >
                <span className="min-w-0 flex-1 truncate">{displayName}</span>
                <ChevronIcon open={accountMenuOpen} />
              </button>
              {portalsReady && accountDropdown
                ? createPortal(accountDropdown, document.body)
                : null}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Create account
              </Link>
            </>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end gap-1 md:hidden">
          <button
            type="button"
            className="relative inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>
      </div>

      {portalsReady && mobileOpen
        ? createPortal(
            <div
              id="mobile-nav"
              className="fixed inset-0 z-[80] flex md:hidden backdrop-blur-xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-menu-title"
            >
              <div className="relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-gradient-to-b from-card via-card to-muted/25 dark:to-muted/10">
                <div
                  className="pattern-header pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-25"
                  aria-hidden
                />
                <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-primary/20 px-4 py-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.75rem,env(safe-area-inset-top))]">
                  <h2 id="mobile-menu-title" className="min-w-0 truncate text-lg font-bold tracking-tight text-foreground">
                    {brandName}
                  </h2>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-foreground shadow-sm transition hover:bg-muted"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                  >
                    <MenuIcon open />
                  </button>
                </div>
                <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                  <nav className="flex flex-col gap-3" aria-label="Mobile main">
                    <div className="grid grid-cols-2 gap-2.5">
                      {navLinks.map(({ href, label }) => {
                        const active =
                          href === '/shop'
                            ? pathname === '/shop'
                            : pathname === href || pathname.startsWith(`${href}/`);
                        const isCart = label === 'Cart';
                        return (
                          <Link
                            key={href}
                            href={href}
                            className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border px-3.5 py-3.5 text-sm font-semibold shadow-sm transition-all ${
                              active
                                ? 'border-primary/50 bg-gradient-to-br from-primary/20 to-primary/5 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.25)] ring-2 ring-primary/20'
                                : 'border-border/60 bg-card/90 text-foreground hover:border-primary/35 hover:bg-muted/60 hover:shadow-md'
                            }`}
                            onClick={() => setMobileOpen(false)}
                          >
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                active ? 'bg-primary/25 text-primary' : 'bg-muted/80 text-muted-foreground'
                              }`}
                            >
                              {isCart ? <CartIcon /> : <ShopIcon />}
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
                                    <span className="text-[11px] font-normal text-muted-foreground">Your bag</span>
                                  )}
                                </span>
                              ) : (
                                <span className="flex flex-col gap-0.5">
                                  <span>{label}</span>
                                  <span className="text-[11px] font-normal text-muted-foreground">Browse store</span>
                                </span>
                              )}
                            </span>
                          </Link>
                        );
                      })}
                    </div>

                    <details className={`${mobileDrawerAccordionClass} mt-0`} open>
                      <summary className={mobileDrawerSummaryClass}>
                        <span className={mobileDrawerAccordionLabelClass}>
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary ring-1 ring-primary/30">
                            <CollectionIcon />
                          </span>
                          All Products
                        </span>
                        <DrawerAccordionChevron />
                      </summary>
                      <div className="space-y-2 border-t border-border/50 bg-muted/20 p-4 dark:bg-muted/10">
                        <Link
                          href="/shop"
                          className="block rounded-xl border border-primary/40 bg-gradient-to-r from-primary/25 via-primary/15 to-transparent px-4 py-3 text-center text-sm font-bold text-foreground shadow-inner shadow-primary/10 transition hover:from-primary/35 hover:via-primary/20"
                          onClick={() => setMobileOpen(false)}
                        >
                          View all products
                        </Link>
                        <div className="flex flex-col gap-2">
                          {featuredCategories.map((category) => (
                            <Link
                              key={category.id}
                              href={`/shop/category/${category.slug}`}
                              className="group/cat relative overflow-hidden rounded-xl border border-border/60 bg-background/90 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-primary/45 hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent hover:pl-5 hover:text-foreground"
                              onClick={() => setMobileOpen(false)}
                            >
                              <span className="absolute inset-y-0 left-0 w-1 origin-left scale-y-0 bg-primary transition group-hover/cat:scale-y-100" />
                              {category.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </details>

                    {/* <details className={mobileDrawerAccordionClass} open>
                      <summary className={mobileDrawerSummaryClass}>
                        <span className={mobileDrawerAccordionLabelClass}>
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-400/35">
                            <ThemeDrawerIcon />
                          </span>
                          Theme
                        </span>
                        <DrawerAccordionChevron />
                      </summary>
                      <div className="border-t border-border/50 bg-muted/15 p-4 dark:bg-muted/10">
                         <ThemeToggle variant="menu" /> 
                      </div>
                    </details> */}

                    {!authReady ? null : user ? (
                      <details className={mobileDrawerAccordionClass} open>
                        <summary className={mobileDrawerSummaryClass}>
                          <span className={mobileDrawerAccordionLabelClass}>
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary ring-1 ring-primary/30">
                              <AccountDrawerIcon />
                            </span>
                            Account
                          </span>
                          <DrawerAccordionChevron />
                        </summary>
                        <div className="space-y-3 border-t border-border/50 bg-muted/15 p-4 dark:bg-muted/10">
                          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-muted/50 to-transparent px-3 py-3">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-base font-bold text-primary-foreground shadow-md ring-2 ring-primary/30">
                              {getDrawerUserInitials(displayName || user.email)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground" title={user.email}>
                                {displayName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground" title={user.email}>
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <Link
                            href={accountHref}
                            className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-left text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:bg-muted"
                            onClick={() => setMobileOpen(false)}
                          >
                            <DashboardMenuIcon />
                            {accountLabel}
                          </Link>
                          <button
                            type="button"
                            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-left text-sm font-medium text-muted-foreground transition hover:border-border hover:bg-muted/80 hover:text-foreground"
                            onClick={handleSignOut}
                          >
                            <SignOutMenuIcon />
                            Sign out
                          </button>
                        </div>
                      </details>
                    ) : (
                      <div className="grid gap-2.5 rounded-2xl border border-border/50 bg-gradient-to-br from-muted/40 to-transparent p-4 ring-1 ring-white/5">
                        <p className="text-center text-xs font-medium text-muted-foreground">
                          Welcome — sign in to track orders
                        </p>
                        <Link
                          href="/login"
                          className="rounded-xl border border-border/60 bg-card px-4 py-3.5 text-center text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:bg-muted"
                          onClick={() => setMobileOpen(false)}
                        >
                          Sign in
                        </Link>
                        <Link
                          href="/register"
                          className="rounded-xl bg-gradient-to-r from-primary to-primary/85 px-4 py-3.5 text-center text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110"
                          onClick={() => setMobileOpen(false)}
                        >
                          Create account
                        </Link>
                      </div>
                    )}
                  </nav>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {portalsReady ? createPortal(mobileBottomNav, document.body) : null}
    </header>
  );
}
