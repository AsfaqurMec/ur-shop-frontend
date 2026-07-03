'use client';

import type { PublicStoreSettings } from '@/lib/api/storeSettings';
import {
  HeaderBrand,
  HeaderCategoryNav,
  HeaderDesktopActions,
  HeaderMobileBottomNav,
  HeaderMobileDrawer,
  HeaderTopBar,
  usePublicHeader,
} from '@/components/layout/header';
import { MenuIcon } from '@/components/layout/header/HeaderIcons';

export function PublicHeader({ settings }: { settings?: PublicStoreSettings | null }) {
  const header = usePublicHeader(settings);

  return (
    <>
      <HeaderTopBar
        contactEmail={header.contactEmail}
        contactPhone={header.contactPhone}
        socialLinks={header.socialLinks}
      />

      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/70">
        <div className="pattern-header pointer-events-none absolute inset-0 opacity-50 dark:opacity-40" aria-hidden />

        <div className="relative mx-auto flex h-[var(--header-height)] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <HeaderBrand
            brandName={header.brandName}
            brandLogo={header.brandLogo}
            onNavigate={() => header.setMobileOpen(false)}
          />

          <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-extrabold italic uppercase tracking-[0.0em] text-red-600 md:hidden">
            UR SHOP
          </span>

          <HeaderCategoryNav pathname={header.pathname} navCategories={header.navCategories} />

          <HeaderDesktopActions
            categories={header.categories}
            cartCount={header.cartCount}
            cartBadgeCount={header.cartBadgeCount}
            authReady={header.authReady}
            user={header.user}
            displayName={header.displayName}
            accountHref={header.accountHref}
            accountLabel={header.accountLabel}
            accountMenuOpen={header.accountMenuOpen}
            setAccountMenuOpen={header.setAccountMenuOpen}
            accountTriggerRef={header.accountTriggerRef}
            accountMenuRef={header.accountMenuRef}
            accountMenuPos={header.accountMenuPos}
            portalsReady={header.portalsReady}
            onSignOut={header.handleSignOut}
          />

          <div className="flex flex-1 items-center justify-end gap-1 md:hidden">
            <button
              type="button"
              className="relative inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted"
              onClick={() => header.setMobileOpen((o) => !o)}
              aria-expanded={header.mobileOpen}
              aria-controls="mobile-nav"
              aria-label={header.mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <MenuIcon open={header.mobileOpen} />
            </button>
          </div>
        </div>

        <HeaderMobileDrawer
          open={header.mobileOpen}
          onClose={() => header.setMobileOpen(false)}
          brandName={header.brandName}
          pathname={header.pathname}
          navCategories={header.navCategories}
          cartCount={header.cartCount}
          cartBadgeCount={header.cartBadgeCount}
          authReady={header.authReady}
          user={header.user}
          displayName={header.displayName}
          accountHref={header.accountHref}
          accountLabel={header.accountLabel}
          onSignOut={header.handleSignOut}
          portalsReady={header.portalsReady}
        />

        <HeaderMobileBottomNav
          pathname={header.pathname}
          cartCount={header.cartCount}
          cartBadgeCount={header.cartBadgeCount}
          accountHref={header.accountHref}
          user={header.user}
          portalsReady={header.portalsReady}
        />
      </header>
    </>
  );
}
